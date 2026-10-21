# Idle rendering and verified JSON reads — 21 October 2026

The first bounded measurement pass covers the public openings of Paris, London and Switzerland. Three interleaved runs per edition use the same Chromium/Metal browser on an Apple M4 Max, a 1440×900 viewport and DPR 1. Each phase explicitly seeks to 08:00; the paused clock is checked before and after the four-second sample. Release commits are checked around every run. [Recorded results](evidence/idle-decode-2026-10-21.json) retain samples, payload hashes, release metadata and sampled CPU hotspots.

| Edition | Paused script ms / rendered frame, median | Approx. draws / frame | Largest opening JSON | Parse median | Verified-read median |
| --- | ---: | ---: | ---: | ---: | ---: |
| Paris | 0.60 | 41 | 371,366 bytes | 0.7 ms | 1.0 ms |
| London | 0.45 | 21 | 1,405,091 bytes | 2.6 ms | 3.5 ms |
| Switzerland | 0.52 | 36 | 1,708,324 bytes | 2.8 ms | 4.8 ms |

All nine paused samples have **zero buffer upload calls and zero known zero-opacity submissions**. Playing samples upload moving geometry, as expected. No page errors were recorded. The repeated Swiss realtime response is a separate, changing input of roughly 2.5 MB; its verified-read medians range from 4.3 to 7.0 ms. Each captured response has its own hash.

## Meaning and limits

The JSON parse benchmark runs `JSON.parse` on captured text. The verified-read benchmark invokes the actual shared `verifiedNetworkDayChunk` function in the browser on an already available response, with byte and SHA-256 checks enabled. It includes body reading, hashing, UTF-8 decoding and parsing. It excludes network transfer, optional decompression and domain-specific pattern expansion; it is a mechanical benchmark, not a claim that every opening uses that loader.

CPU samples place recurring idle work in WebGL binding/submission, world-matrix updates and uniforms. Existing caches already suppress paused geometry uploads. These observations do not identify an invisible-draw leak or repeated decode that warrants a production fix. Ambient material animation still renders while service time is paused. Removing that animation or reducing its cadence would change the work rather than merely remove redundant computation.

The host's frame cadence varied substantially, so four-second script totals are not a fair cross-run comparison. The table normalises by observed rendered frames and rounds the result; frame-boundary observations are approximate. These are instrumented desktop CPU measurements, **not GPU elapsed timings, physical-phone evidence or an FPS guarantee**. Swiss paused script cost ranges from 0.46 to 0.78 ms/frame; the small differences between editions should not be treated as a precise ranking. Shader compilation also appears in startup profiles; those profiles include scene startup and settling and are not isolated decode costs.

`uploadSourceBytes` in the evidence is the sum of submitted source-view capacities, not GPU transfer bandwidth: optional WebGL2 subranges were not inferred. Raw CPU profiles remain in the selected output directory and are not added to Git.

## Decision and next bounded work

Keep the current production rendering and loading behaviour. These openings do not justify introducing workers, sharing another loader, or disabling ambient motion. No npm release or edition dependency upgrade is needed for this measurement tooling.

The next renderer consolidation should isolate the built-in static rail/context geometry and its GPU resource lifecycle behind private modules, preserving the public API. That boundary would support a controlled static-transform or draw-batching experiment against the costs actually observed here. Require a matched workload, visual/interaction checks and a repeatable improvement before shipping an optimisation. Heavy optional datasets, pattern expansion and physical-device/GPU measurements remain separate follow-ups.

## Reproduce

Use the repository's Node 24+ environment:

```sh
npm run profile:idle-decode -- --runs 3 --out /private/tmp/motion-idle-baseline
```

Optional positional targets are `correspondances`, `allchange` and `gleislicht`. `--duration` controls each phase in milliseconds (minimum 1000). The tool writes per-phase CPU profiles and incremental results; a release change or moving paused clock fails the run. Changes to live datasets and shader caches mean a future run is a new baseline, not a reproduction of historical bytes.

Validation: nine controlled production runs, a final short CLI smoke run, syntax, lint and architecture checks. Lint retains the existing unused `extname` warning in the boundary checker.
