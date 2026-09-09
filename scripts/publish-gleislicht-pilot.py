"""Publish an already-successful Gleislicht Pages artifact to Cloudflare.

Requires Python 3, gh, Node/npm and a local Wrangler login (or an API token).
Defaults to a dry run. Source files and the GitHub Pages release are untouched.
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

ROOT = Path(__file__).resolve().parents[1]
REPO = "emmettl/gleislicht"
PREFIX = "gleislicht-pilot"
URL = "https://motionstudies.app/" + PREFIX + "/"
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_FILES = 20_000


def validate_run(run):
    if (run.get("status") != "completed" or run.get("conclusion") != "success"
            or run.get("head_branch") != "main"
            or run.get("path") != ".github/workflows/pages.yml"
            or run.get("repository", {}).get("full_name") != REPO
            or run.get("event") not in {"push", "schedule", "workflow_dispatch"}):
        raise ValueError("Pilot requires a successful main-branch Gleislicht Pages run")


def stage_artifact(archive, destination, run):
    """Validate the full archive before copying regular files into a fresh directory."""
    validate_run(run)
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
            if re.search(r"(^|/)(all-change|correspondances|local-express|new-york)", name):
                raise ValueError("Foreign edition in Swiss artifact: " + name)
            # Everything under /assets/ receives an immutable browser cache policy.
            # Keep stable filenames out of that namespace as builds evolve.
            if name.startswith("assets/") and not re.fullmatch(r"assets/[^/]+-[A-Za-z0-9_-]{8}\.[A-Za-z0-9.]+", name):
                raise ValueError("Immutable asset must have a Vite content hash: " + name)
            files[name] = member
        if len(files) + 1 > MAX_FILES:
            raise ValueError("Artifact exceeds Cloudflare's free asset count limit")
        for required in ["index.html", "data/swiss-rail-morning.json", "data/swiss-rail-day-manifest.json"]:
            if required not in files:
                raise ValueError("Missing required Swiss artifact: " + required)
        for name, target in [("london.html", "allchange"), ("paris.html", "correspondances")]:
            if name not in files or ("https://emmettl.github.io/" + target + "/").encode() not in tar.extractfile(files[name]).read():
                raise ValueError("Missing compatibility redirect: " + name)

        edition = destination / PREFIX
        edition.mkdir(parents=True)
        digest = hashlib.sha256()
        for name, member in sorted(files.items()):
            target = edition / name
            target.parent.mkdir(parents=True, exist_ok=True)
            file_digest = hashlib.sha256()
            with tar.extractfile(member) as source, target.open("xb") as output:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
                    file_digest.update(chunk)
            digest.update(name.encode() + b"\0" + file_digest.digest())
        release = {
            "repository": REPO,
            "run_id": run["id"],
            "commit": run["head_sha"],
            "workflow_url": run["html_url"],
            "source_files": len(files),
            "source_bytes": sum(member.size for member in files.values()),
            "content_sha256": digest.hexdigest(),
        }
        (edition / "_release.json").write_text(json.dumps(release, indent=2) + "\n")
        (destination / "_headers").write_text(
            "/gleislicht-pilot/*\n"
            "  X-Motion-Studies-Hosting: cloudflare-pilot\n"
            "  X-Robots-Tag: noindex\n"
            "\n/gleislicht-pilot/assets/*\n"
            "  Cache-Control: public, max-age=31536000, immutable\n"
            "\n/gleislicht-pilot/_release.json\n"
            "  Cache-Control: no-cache\n"
        )
        return release


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", required=True, type=int, help="Successful GitHub Pages workflow run ID")
    parser.add_argument("--deploy", action="store_true", help="Publish after staging and Wrangler dry-run validation")
    args = parser.parse_args()
    run = json.loads(subprocess.check_output([
        "gh", "api", f"repos/{REPO}/actions/runs/{args.run}",
    ], text=True))
    validate_run(run)
    # Keep temporary payloads available if upload fails; print the directory for recovery.
    stage = Path(tempfile.mkdtemp(prefix="gleislicht-pilot-"))
    print("Staging:", stage, flush=True)
    subprocess.run([
        "gh", "run", "download", str(args.run), "--repo", REPO,
        "--name", "github-pages", "--dir", str(stage / "download"),
    ], check=True)
    release = stage_artifact(stage / "download/artifact.tar", stage / "assets", run)
    print(json.dumps(release, indent=2), flush=True)
    command = [
        "npx", "--yes", "wrangler@4.129.0", "deploy",
        "--config", str(ROOT / "wrangler.gleislicht-pilot.jsonc"),
        "--assets", str(stage / "assets"),
    ]
    subprocess.run(command + ["--dry-run", "--outdir", str(stage / "dry-run")], cwd=ROOT, check=True)
    if args.deploy:
        subprocess.run(command, cwd=ROOT, check=True)
        print("Published:", URL)
        shutil.rmtree(stage)
    else:
        print("Dry run passed. To publish, rerun with --deploy. Staged files retained:", stage)


if __name__ == "__main__":
    main()
