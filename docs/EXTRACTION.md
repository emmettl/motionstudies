# Extraction provenance

Prepared from [Gleislicht bdb1f3a](https://github.com/emmettl/gleislicht/commit/bdb1f3a48db1cc6ec0bcf3858765004ee7e6d147).

The `packages/` and `lab/` directories were imported with `git subtree split` and `git subtree add`, without squashing. Their directory history is retained. Earlier work before those directory boundaries remains available in the source repository. Build scripts and regression fixtures were copied from that same commit and adapted to a shared-only workspace.

The original catalogue files are retained. Site assembly uses an explicit asset allowlist, so npm files, package sources and tests cannot be uploaded as part of the catalogue. The lab is a separate production build under `lab/`.

All Change initially consumes the exact private `0.0.0` tarballs built here. Its vendor manifest records SHA-256 hashes and this source commit. Replace those file dependencies with exact registry prerelease versions once publication is configured. No edition in Gleislicht has been removed or redirected during this rehearsal.
