import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("hosting", Path(__file__).with_name("publish-edition.py"))
hosting = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hosting)


class EditionHostingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def run_metadata(self, edition):
        return {"id": 123, "run_number": 10, "status": "completed", "conclusion": "success",
                "head_branch": "main", "path": ".github/workflows/pages.yml",
                "repository": {"full_name": "emmettl/" + edition}, "event": "push",
                "head_sha": "a" * 40, "html_url": "https://github.com/emmettl/" + edition + "/actions/runs/123"}

    def archive(self, edition, extra=None, observed=False):
        files = {"index.html": b"<html>edition</html>", "assets/index-BC56FVMz.js": b"export {}"}
        files.update({name: b"{}" for name in hosting.EDITIONS[edition]["required"]})
        if edition == "manifest":
            files["data/demo-study.json"] = json.dumps({"source": {
                "evidence": "observed" if observed else "synthetic", "publication": "synthetic-only"
            }}).encode()
        path = self.root / "artifact.tar"
        with tarfile.open(path, "w") as tar:
            for name, value in files.items():
                member = tarfile.TarInfo("./" + name)
                member.size = len(value)
                tar.addfile(member, io.BytesIO(value))
            if extra is not None:
                tar.addfile(extra, io.BytesIO(b"x" * extra.size) if extra.isfile() else None)
        return path

    def test_all_five_editions_preserve_payload_and_provenance(self):
        for edition in hosting.EDITIONS:
            with self.subTest(edition=edition):
                publisher = hosting.Publisher(edition)
                destination = self.root / edition
                release = publisher.stage_artifact(self.archive(edition), destination, self.run_metadata(edition))
                self.assertEqual((destination / edition / "assets/index-BC56FVMz.js").read_bytes(), b"export {}")
                self.assertEqual(json.loads((destination / edition / "_release.json").read_text()), release)
                self.assertEqual(release["repository"], "emmettl/" + edition)
                headers = (destination / "_headers").read_text()
                self.assertIn(f"/{edition}/assets/*\n  Cache-Control: public, max-age=31536000, immutable", headers)
                self.assertNotIn("noindex", headers)

    def test_workflow_and_repository_gates(self):
        publisher = hosting.Publisher("allchange")
        run = self.run_metadata("allchange")
        for field, value in [("status", "in_progress"), ("conclusion", "failure"), ("head_branch", "feature"),
                             ("path", ".github/workflows/checks.yml"), ("event", "pull_request"),
                             ("repository", {"full_name": "emmettl/correspondances"})]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                publisher.validate_run({**run, field: value})
        self.assertTrue(publisher.is_superseded(run, {**run, "run_number": 11}))
        self.assertFalse(publisher.is_superseded(run, run))
        with self.assertRaises(KeyError):
            hosting.Publisher("local-express")

    def test_archive_rejects_unsafe_foreign_reserved_and_unhashed_files(self):
        publisher = hosting.Publisher("allchange")
        for name in ["../escape", "/absolute", "dir\\escape", "_headers", "_redirects", "_release.json",
                     "_worker.js", "index.html", "data/swiss-rail-morning.json", "assets/config.json"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                publisher.stage_artifact(self.archive("allchange", tarfile.TarInfo(name)), self.root / "output", self.run_metadata("allchange"))
            self.assertFalse((self.root / "output").exists())
        member = tarfile.TarInfo("link")
        member.type = tarfile.SYMTYPE
        member.linkname = "../escape"
        with self.assertRaises(ValueError):
            publisher.stage_artifact(self.archive("allchange", member), self.root / "output", self.run_metadata("allchange"))

    def test_manifest_stays_synthetic_only(self):
        with self.assertRaisesRegex(ValueError, "synthetic fixture"):
            hosting.Publisher("manifest").stage_artifact(self.archive("manifest", observed=True), self.root / "output", self.run_metadata("manifest"))
        self.assertFalse((self.root / "output").exists())

    def test_file_size_and_count_limits(self):
        archive = self.archive("allchange")
        for key, limit in [("MAX_FILE_BYTES", 1), ("MAX_FILES", 4)]:
            with patch.object(hosting, key, limit), self.assertRaises(ValueError):
                hosting.Publisher("allchange").stage_artifact(archive, self.root / "output", self.run_metadata("allchange"))

    def test_live_verification_rejects_stale_release_bad_cache_and_noindex(self):
        publisher = hosting.Publisher("allchange")
        output = self.root / "output"
        (output / "assets").mkdir(parents=True)
        (output / "assets/index-BC56FVMz.js").write_text("export {}")
        release = {"run_id": 123}

        def response_for(request, **kwargs):
            response = io.BytesIO(json.dumps(release).encode())
            cache = "public, max-age=0, must-revalidate"
            if "/assets/" in request.full_url:
                cache = "public, max-age=31536000, immutable"
            elif request.full_url.endswith("_release.json"):
                cache = "no-cache"
            response.headers = {"Cache-Control": cache, "X-Motion-Studies-Hosting": "cloudflare-static", **overrides}
            return response

        overrides = {}
        with patch.object(hosting.urllib.request, "urlopen", side_effect=response_for):
            publisher.verify_deployment(release, output)
        for overrides in [{"Cache-Control": "public, max-age=600"}, {"X-Robots-Tag": "noindex"}, {"X-Motion-Studies-Hosting": "proxy"}]:
            with patch.object(hosting.urllib.request, "urlopen", side_effect=response_for), patch.object(hosting.time, "sleep"), self.assertRaises(ValueError):
                publisher.verify_deployment(release, output)
        overrides = {}
        with patch.object(hosting.urllib.request, "urlopen", side_effect=response_for), patch.object(hosting.time, "sleep"), self.assertRaises(ValueError):
            publisher.verify_deployment({"run_id": 999}, output)


if __name__ == "__main__":
    unittest.main()
