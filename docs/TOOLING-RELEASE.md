# Shared tooling release record

`@motionstudies/tooling` is versioned independently of the four runtime packages. It is published under `next`; consumers adopt exact versions explicitly.

## First publication

`0.1.0-alpha.0` was staged from `376c798d5b8330fc8378ad0f9bc3e4b0f2fcf268` through [run 42865681277](https://github.com/emmettl/motionstudies/actions/runs/42865681277) and approved by the maintainer with npm 2FA on 10 November 2026. Direct token publication had required interactive authentication (`EOTP`).

The live registry archive was verified on 10 November 2026 at 17:35 UTC:

- Size: 6,300 bytes.
- SHA-256: `af402b6d345c82803b3c54fac1fb6baeb9fd8e818bed3f01621a4479dddbfcaf`.
- SHA-512 integrity: `sha512-DrbIQOaq6r9HYH1kpQX7su2Gym2CZPZH8gHyKUsQff6g6wgQ4Lp5/UJRJxpj9LOPhE9UE147CVRT1bDwYFU54g==`.

The downloaded archive matched the tested stage byte-for-byte. A fresh exact registry install resolved all six public exports; the installed formatter/lint presets and TypeScript configuration/declarations passed. All nine contract tests passed against the installed package, and the installed checker verified Working Models' current boundaries read-only.

## Trusted publishing

The owner reported configuring npm trusted publishing on 10 November 2026. Required identity: GitHub owner `emmettl`, repository `motionstudies`, workflow `tooling-release.yml`, environment `npm`, allowed action direct `npm publish`.

`0.1.0-alpha.1` changes release documentation only and is prepared to validate the first trusted release. The workflow's `trusted` mode supplies an empty `NODE_AUTH_TOKEN` and grants `id-token: write`. Configuration alone is not evidence of successful OIDC authentication; record the successful run and registry digest here after publication. Revoke a dedicated bootstrap token only after trusted publication is verified.

See [package verification and release procedure](../packages/tooling/README.md).
