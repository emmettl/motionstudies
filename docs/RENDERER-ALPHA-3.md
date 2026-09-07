# Renderer alpha.3

Berlin's flat route review exposed the same back-face visibility issue fixed locally in All Change. This coordinated release moves the reusable changes from All Change commits `fa6dce4` and `dbc41d7` into the shared renderer: flat route ribbons render both faces in one transparency pass, water fills use one pass, and fully faded water/border/backing-network/traffic layers stop submitting geometry. London-specific marker, lane and label adapters are not copied.

`NationalNetworkScene` adds optional `groundStyle: 'grid' | 'quiet'`; default grid behavior is unchanged. Quiet retains the ground plane and omits the reference grid. The lab exposes flat routes plus quiet ground for independent review. Consumers must update exact registry pins deliberately; existing alpha.2 editions are untouched.

Local verification: package/lab/test declarations, lint, architecture boundaries, 140 unit tests and an isolated packed consumer with Chromium/WebKit browser specimens (12 passed, two intentionally mouse-only skips). Hosted release verification repeats the packed consumer against committed source before trusted npm publication.

Hosted verification and catalogue deployment passed at `4c86b50`: [run 34153264962](https://github.com/emmettl/motionstudies/actions/runs/34153264962). npm publication is pending explicit user authorization after automatic approval review rejected the trusted-release dispatch. No alpha.3 package has been published by this task.
