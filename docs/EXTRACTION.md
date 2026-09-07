# Extraction provenance

Prepared from [Gleislicht bdb1f3a](https://github.com/emmettl/gleislicht/commit/bdb1f3a48db1cc6ec0bcf3858765004ee7e6d147).

The `packages/` and `lab/` directories were imported with `git subtree split` and `git subtree add`, without squashing. Their directory history is retained. Earlier work before those directory boundaries remains available in the source repository. Build scripts and regression fixtures were copied from that same commit and adapted to a shared-only workspace.

The original catalogue files are retained. Site assembly uses an explicit asset allowlist, so npm files, package sources and tests cannot be uploaded as part of the catalogue. The lab is a separate production build under `lab/`.

During the initial rehearsal, All Change consumed private `0.0.0` tarballs with a SHA-256 vendor manifest. Those file dependencies have since been replaced by exact registry prereleases, and the edition repositories now own their implementations as described below.

## Edition repositories

The shared package and lab extraction is complete. Editions install exact `0.1.0-alpha.2` npm releases: All Change (London), Correspondances (Paris), Gleislicht (Switzerland), and the private Local / Express proof (New York). The latter retains its publication hold and has no Pages workflow. Each repository owns only its edition build, local data tools, artifacts and regression gates. London and Paris retain their former Gleislicht URLs through static compatibility redirects.
