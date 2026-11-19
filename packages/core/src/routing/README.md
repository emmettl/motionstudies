# Routing (`@motionstudies/core/routing/*`)

The search engine behind [PFAD](https://pfad.motionstudies.app/), extracted from PFAD's `src/search` so that other works (first Rowdies) can run the same deterministic searches and replay the same event traces.

- **Graph:** a plain typed-array CSR `Graph` (`contracts.ts`): integer-centimetre costs, directed arcs, fixed neighbour order.
- **Algorithms:** Dijkstra, bidirectional Dijkstra, A\* (feasible planar distance), ALT landmarks, greedy best-first, depth-first, breadth-first, multi-source territories, spanning tree.
- **Determinism:** ties break by cost, then ascending node id; neighbours follow compiler edge order. The same graph, endpoints and algorithm give the same trace.
- **Trace:** packed `Uint32` events (settled, examined, improved) with checkpoints for exact seeking (`trace.ts`).
- **Not in the package:** chunk loading and hashing, the Web Worker, the OSM compiler and all drawing. Graph profiles other than roads (for example rail) are produced by a compiler that fills the same `Graph`.
- **Timing fields** (`performance.now()`) are measurements only and never affect results.

Pure TypeScript with no runtime dependencies and no DOM use outside `performance.now()`.
