# Shared tooling release record

`@motionstudies/tooling` is versioned independently of the four runtime packages. Releases are published under `next`, then can be explicitly promoted to `latest`. Both tags currently point to `0.1.0-alpha.1`; consumers adopt exact versions explicitly.

## First publication

`0.1.0-alpha.0` was staged from `376c798d5b8330fc8378ad0f9bc3e4b0f2fcf268` through [run 42865681277](https://github.com/emmettl/motionstudies/actions/runs/42865681277) and approved by the maintainer with npm 2FA on 10 November 2026. Direct token publication had required interactive authentication (`EOTP`).

The live registry archive was verified on 10 November 2026 at 17:35 UTC:

- Size: 6,300 bytes.
- SHA-256: `af402b6d345c82803b3c54fac1fb6baeb9fd8e818bed3f01621a4479dddbfcaf`.
- SHA-512 integrity: `sha512-DrbIQOaq6r9HYH1kpQX7su2Gym2CZPZH8gHyKUsQff6g6wgQ4Lp5/UJRJxpj9LOPhE9UE147CVRT1bDwYFU54g==`.

The downloaded archive matched the tested stage byte-for-byte. A fresh exact registry install resolved all six public exports; the installed formatter/lint presets and TypeScript configuration/declarations passed. All nine contract tests passed against the installed package, and the installed checker verified Working Models' current boundaries read-only.

## Trusted publishing

The owner reported configuring npm trusted publishing on 10 November 2026. Required identity: GitHub owner `emmettl`, repository `motionstudies`, workflow `tooling-release.yml`, environment `npm`, allowed action direct `npm publish`.

`0.1.0-alpha.1` changes release documentation only and was published from `306b78512462316790b235b191bdad6a70af7a81` in [trusted run 42867594969, attempt 2](https://github.com/emmettl/motionstudies/actions/runs/42867594969/attempts/2). The OIDC exchange returned HTTP 201 and npm confirmed publication with `NODE_AUTH_TOKEN` empty. The publisher must name `tooling-release.yml`, rather than the four-package `release.yml`, and permit direct `npm publish`.

The publication job's immediate registry check encountered a processing 404. [Verification-only run 42868710996](https://github.com/emmettl/motionstudies/actions/runs/42868710996) subsequently passed without republishing. The workflow now supports `mode: verify-registry` and retries transient registry responses with fresh queries. It still fails immediately for identity, integrity or byte mismatches.

The live archive is 6,524 bytes with SHA-256 `8b4a8524f1153aa8fbde1f0923576b4c4db47e3b4256aef6db81c775ce91886a`. Its bytes match the tested CI tarball and `next` points to this version. A clean registry install passed all nine contract tests, resolved all six exports and verified Working Models' boundaries read-only. Code, declarations and configuration presets are byte-identical to `0.1.0-alpha.0`; see [machine-readable evidence](evidence/tooling-alpha1.json).

Trusted publication is verified. A token created solely for this bootstrap can now be revoked in npm and its GitHub `NPM_TOKEN` secret removed. This record does not claim either credential-cleanup action has been performed.

## Default install tag

[Promotion run 42870336557](https://github.com/emmettl/motionstudies/actions/runs/42870336557) moved `latest` from the `0.0.0-stage` placeholder to `0.1.0-alpha.1` on 10 November 2026. It verified the existing registry archive against the tested candidate before changing the tag and confirmed `next` remained `0.1.0-alpha.1`. No new package version was published.

A fresh, unversioned `npm install --save-exact @motionstudies/tooling` resolved `0.1.0-alpha.1` with the verified release integrity. The default install now receives the actual tooling package. Its version remains a prerelease.

For future explicit promotions, run `tooling-release.yml` on `main` with `mode: promote-latest`. The committed candidate must match the existing registry archive. The trusted publisher needs `Allow npm dist-tag` in addition to its publishing permission; this grant has been configured and verified. New releases continue to use `next` until an explicit promotion.

See [package verification and release procedure](../packages/tooling/README.md).
