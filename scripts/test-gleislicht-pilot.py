import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("pilot", Path(__file__).with_name("publish-gleislicht-pilot.py"))
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)


class PilotPublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.run = {
            "id": 123, "run_number": 10, "status": "completed", "conclusion": "success",
            "head_branch": "main", "path": ".github/workflows/pages.yml",
            "repository": {"full_name": "emmettl/gleislicht"}, "event": "push",
            "head_sha": "a" * 40, "html_url": "https://github.com/emmettl/gleislicht/actions/runs/123",
        }

    def archive(self, extra=None):
        path = self.root / "artifact.tar"
        files = {
            "index.html": b"<html>Swiss edition</html>",
            "data/swiss-rail-morning.json": b'{"serviceDate":"2026-09-09"}',
            "data/swiss-rail-day-manifest.json": b"{}",
            "london.html": b"https://emmettl.github.io/allchange/",
            "paris.html": b"https://emmettl.github.io/correspondances/",
        }
        with tarfile.open(path, "w") as tar:
            for name, data in files.items():
                entry = tarfile.TarInfo("./" + name)
                entry.size = len(data)
                tar.addfile(entry, io.BytesIO(data))
            if extra:
                tar.addfile(extra, io.BytesIO(b"x" * extra.size) if extra.isfile() else None)
        return path

    def test_payload_bytes_and_release_provenance_are_preserved(self):
        staged = self.root / "assets"
        release = pilot.stage_artifact(self.archive(), staged, self.run)
        self.assertEqual((staged / "gleislicht-pilot/data/swiss-rail-morning.json").read_bytes(), b'{"serviceDate":"2026-09-09"}')
        self.assertEqual(json.loads((staged / "gleislicht-pilot/_release.json").read_text()), release)
        self.assertEqual(release["source_files"], 5)
        self.assertIn("X-Robots-Tag: noindex", (staged / "_headers").read_text())
        self.assertFalse((staged / "index.html").exists())

    def test_unsuccessful_or_untrusted_workflow_is_rejected(self):
        for field, value in [("conclusion", "failure"), ("status", "in_progress"), ("head_branch", "feature"), ("path", ".github/workflows/other.yml"), ("event", "pull_request"), ("repository", {"full_name": "other/repo"})]:
            with self.subTest(field=field), self.assertRaises(ValueError):
                pilot.validate_run({**self.run, field: value})

    def test_newer_successful_release_prevents_stale_ci_deployment(self):
        newer = {**self.run, "id": 124, "run_number": 11}
        self.assertTrue(pilot.is_superseded(self.run, newer))
        self.assertFalse(pilot.is_superseded(newer, self.run))
        self.assertFalse(pilot.is_superseded(self.run, self.run))

    def test_live_verification_checks_release_and_cache_headers(self):
        from unittest.mock import patch
        assets = self.root / "edition/assets"
        assets.mkdir(parents=True)
        (assets / "index-BC56FVMz.js").write_text("export {}")
        release = {"run_id": 123}

        def response_for(request, **kwargs):
            response = io.BytesIO(json.dumps(release).encode())
            policy = "public, max-age=0, must-revalidate"
            if "/assets/" in request.full_url:
                policy = "public, max-age=31536000, immutable"
            elif request.full_url.endswith("_release.json"):
                policy = "no-cache"
            response.headers = {"Cache-Control": policy, "X-Motion-Studies-Hosting": "cloudflare-pilot"}
            return response

        with patch.object(pilot.urllib.request, "urlopen", side_effect=response_for) as fetch:
            pilot.verify_deployment(release, assets.parent)
            self.assertEqual(fetch.call_count, 5)
        with patch.object(pilot.urllib.request, "urlopen", side_effect=response_for), patch.object(pilot.time, "sleep"), self.assertRaises(ValueError):
            pilot.verify_deployment({"run_id": 999}, assets.parent)

    def test_unsafe_and_foreign_paths_are_rejected_before_staging(self):
        for name in ["../escaped", "/absolute", "data/local-express.json", "data/all-change/file.json", "new-york.html", "_headers", "index.html"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                pilot.stage_artifact(self.archive(tarfile.TarInfo(name)), self.root / "assets", self.run)
            self.assertFalse((self.root / "assets").exists())

    def test_symlinks_are_rejected(self):
        entry = tarfile.TarInfo("data/link")
        entry.type = tarfile.SYMTYPE
        entry.linkname = "../../outside"
        with self.assertRaises(ValueError):
            pilot.stage_artifact(self.archive(entry), self.root / "assets", self.run)

    def test_immutable_namespace_requires_hashed_filenames(self):
        for name in ["assets/config.json", "assets/index.js", "assets/styles.css", "assets/nested/index.js"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                pilot.stage_artifact(self.archive(tarfile.TarInfo(name)), self.root / "assets", self.run)
            self.assertFalse((self.root / "assets").exists())
        staged = self.root / "assets"
        pilot.stage_artifact(self.archive(tarfile.TarInfo("assets/index-BC56FVMz.js")), staged, self.run)
        headers = (staged / "_headers").read_text()
        immutable_rules = [rule for rule in headers.split("\n\n") if "immutable" in rule]
        self.assertEqual(immutable_rules, ["/gleislicht-pilot/assets/*\n  Cache-Control: public, max-age=31536000, immutable"])

    def test_size_and_count_limits_are_enforced(self):
        from unittest.mock import patch
        archive = self.archive()
        for limit, value in [("MAX_FILE_BYTES", 1), ("MAX_FILES", 5)]:
            with patch.object(pilot, limit, value), self.assertRaises(ValueError):
                pilot.stage_artifact(archive, self.root / "assets", self.run)


if __name__ == "__main__":
    unittest.main()
