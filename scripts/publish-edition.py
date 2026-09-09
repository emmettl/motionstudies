"""Publish a verified public edition's Pages artifact directly to Cloudflare.

Requires Python 3, gh, Node/npm, and Wrangler authentication. Defaults to a dry run.
Only editions explicitly configured in hosting/editions.json can be published.
"""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
EDITIONS = json.loads((ROOT / "hosting/editions.json").read_text())
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_FILES = 20_000
HASHED_ASSET = re.compile(r"assets/[^/]+-[A-Za-z0-9_-]{8}\.[A-Za-z0-9.]+")


def github_json(endpoint):
    return json.loads(subprocess.check_output(["gh", "api", endpoint], text=True))


class Publisher:
    def __init__(self, edition):
        self.spec = EDITIONS[edition]
        self.edition = edition
        self.repository = "emmettl/" + edition
        self.url = "https://motionstudies.app/" + edition + "/"

    def validate_run(self, run):
        if (run.get("status") != "completed" or run.get("conclusion") != "success"
                or run.get("head_branch") != "main"
                or run.get("path") != ".github/workflows/pages.yml"
                or run.get("repository", {}).get("full_name") != self.repository
                or run.get("event") not in {"push", "schedule", "workflow_dispatch"}):
            raise ValueError("Publishing requires this edition's successful main-branch Pages run")

    def latest_successful_run(self):
        runs = github_json(f"repos/{self.repository}/actions/workflows/pages.yml/runs?branch=main&status=success&per_page=1")["workflow_runs"]
        if not runs:
            raise ValueError("No successful main-branch Pages release is available")
        self.validate_run(runs[0])
        return runs[0]

    def is_superseded(self, run, latest):
        self.validate_run(run)
        self.validate_run(latest)
        return run["run_number"] < latest["run_number"]

    def stage_artifact(self, archive, destination, run):
        self.validate_run(run)
        if destination.exists():
            raise ValueError("Staging destination must not exist")
        with tarfile.open(archive) as tar:
            files = {}
            for member in tar.getmembers():
                path = PurePosixPath(member.name)
                if path.is_absolute() or ".." in path.parts or "\\" in member.name:
                    raise ValueError("Unsafe artifact path: " + member.name)
                if not (member.isdir() or member.isfile()):
                    raise ValueError("Links and special files are not permitted: " + member.name)
                if member.isdir():
                    continue
                name = str(path)
                if name in files or name in {"_headers", "_redirects", "_worker.js", "_release.json"}:
                    raise ValueError("Duplicate or reserved artifact path: " + name)
                if member.size > MAX_FILE_BYTES:
                    raise ValueError("Asset exceeds Cloudflare's 25 MiB limit: " + name)
                if name.startswith("data/") and not re.fullmatch(self.spec["data_pattern"], name):
                    raise ValueError("Unapproved edition data: " + name)
                if name.startswith("assets/") and not HASHED_ASSET.fullmatch(name):
                    raise ValueError("Immutable asset must have a Vite content hash: " + name)
                files[name] = member
            if len(files) + 1 > MAX_FILES:
                raise ValueError("Artifact exceeds Cloudflare's free asset count limit")
            for required in ["index.html", *self.spec["required"]]:
                if required not in files:
                    raise ValueError("Missing required edition artifact: " + required)
            if not any(HASHED_ASSET.fullmatch(name) for name in files):
                raise ValueError("No hashed application assets found")
            if self.edition == "manifest":
                manifest = json.load(tar.extractfile(files["data/demo-study.json"]))
                source = manifest.get("source", {})
                if source.get("evidence") != "synthetic" or source.get("publication") != "synthetic-only":
                    raise ValueError("MANIFEST hosting requires its public synthetic fixture")

            output = destination / self.edition
            output.mkdir(parents=True)
            digest = hashlib.sha256()
            for name, member in sorted(files.items()):
                target = output / name
                target.parent.mkdir(parents=True, exist_ok=True)
                file_digest = hashlib.sha256()
                with tar.extractfile(member) as source, target.open("xb") as handle:
                    while chunk := source.read(1024 * 1024):
                        handle.write(chunk)
                        file_digest.update(chunk)
                digest.update(name.encode() + b"\0" + file_digest.digest())
            release = {
                "repository": self.repository, "run_id": run["id"], "commit": run["head_sha"],
                "workflow_url": run["html_url"], "source_files": len(files),
                "source_bytes": sum(member.size for member in files.values()),
                "content_sha256": digest.hexdigest(),
            }
            (output / "_release.json").write_text(json.dumps(release, indent=2) + "\n")
            (destination / "_headers").write_text(
                f"/{self.edition}/*\n  X-Motion-Studies-Hosting: cloudflare-static\n"
                f"\n/{self.edition}/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n"
                f"\n/{self.edition}/_release.json\n  Cache-Control: no-cache\n"
            )
            return release

    def verify_deployment(self, release, output):
        hashed_asset = next(path for path in sorted((output / "assets").iterdir()) if path.is_file())
        policies = {
            "": "public, max-age=0, must-revalidate",
            "assets/" + hashed_asset.name: "public, max-age=31536000, immutable",
            self.spec["required"][0]: "public, max-age=0, must-revalidate",
            "_release.json": "no-cache",
        }
        headers = {"User-Agent": "Motion-Studies-Hosting-CI/1.0", "Cache-Control": "no-cache"}
        for attempt in range(6):
            try:
                with urllib.request.urlopen(urllib.request.Request(self.url + "_release.json", headers=headers), timeout=30) as response:
                    if json.load(response) != release:
                        raise ValueError("Published release metadata does not match this artifact")
                for path, expected in policies.items():
                    request = urllib.request.Request(self.url + path, method="HEAD", headers=headers)
                    with urllib.request.urlopen(request, timeout=30) as response:
                        if response.headers.get("Cache-Control") != expected:
                            raise ValueError("Unexpected cache policy: " + path)
                        if "noindex" in response.headers.get("X-Robots-Tag", "").lower():
                            raise ValueError("Production hosting must be indexable: " + path)
                        if response.headers.get("X-Motion-Studies-Hosting") != "cloudflare-static":
                            raise ValueError("Response did not come from Cloudflare hosting: " + path)
                print("Verified live release identity and cache policies:", self.edition, flush=True)
                return
            except (OSError, ValueError):
                if attempt == 5:
                    raise
                time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--edition", required=True, choices=sorted(EDITIONS))
    parser.add_argument("--run", required=True, type=int)
    parser.add_argument("--deploy", action="store_true")
    parser.add_argument("--require-latest", action="store_true")
    args = parser.parse_args()
    publisher = Publisher(args.edition)
    run = github_json(f"repos/{publisher.repository}/actions/runs/{args.run}")
    publisher.validate_run(run)
    if args.require_latest and publisher.is_superseded(run, publisher.latest_successful_run()):
        print("Skipping superseded Pages release:", args.run)
        return
    stage = Path(tempfile.mkdtemp(prefix=args.edition + "-hosting-"))
    print("Staging:", stage, flush=True)
    subprocess.run(["gh", "run", "download", str(args.run), "--repo", publisher.repository,
                    "--name", "github-pages", "--dir", str(stage / "download")], check=True)
    release = publisher.stage_artifact(stage / "download/artifact.tar", stage / "assets", run)
    print(json.dumps(release, indent=2), flush=True)
    command = ["npx", "--yes", "wrangler@4.129.0", "deploy", "--config",
               str(ROOT / f"wrangler.{args.edition}.jsonc"), "--assets", str(stage / "assets")]
    subprocess.run(command + ["--dry-run", "--outdir", str(stage / "dry-run")], cwd=ROOT, check=True)
    if args.deploy:
        if args.require_latest and publisher.is_superseded(run, publisher.latest_successful_run()):
            print("Skipping Pages release superseded while staging:", args.run)
            shutil.rmtree(stage)
            return
        subprocess.run(command, cwd=ROOT, check=True)
        publisher.verify_deployment(release, stage / "assets" / args.edition)
        print("Published:", publisher.url)
        shutil.rmtree(stage)
    else:
        print("Dry run passed. Rerun with --deploy to publish. Staged files retained:", stage)


if __name__ == "__main__":
    main()
