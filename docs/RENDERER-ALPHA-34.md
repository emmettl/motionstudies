# Renderer station-picking refactor — alpha.34

19 October 2026

The coordinated `0.1.0-alpha.34` release extracts station tap selection from
`NationalNetworkScene` into private implementation modules. The camera, canvas,
ranked stations, projected stops, framing and selection callback are explicit
inputs. Each installation owns its pointer listeners and returns their disposer;
it allocates no persistent GPU resources. The scene and labels share the existing
station-centre calculation. Public exports, selection semantics and package
boundaries are unchanged.

All four packages move together under npm's `next` tag. Source workspaces remain
private; publication uses the normal trusted workflow and its retained, tested
tarballs. The renderer change is adopted by London, Paris, Switzerland,
Local / Express, NORIKAE, Berlin and Underfall through exact registry pins.

Paris's guarded build adapter now follows the extracted component and picking
modules. Its station admission, morph scale and airport-over-station priority are
preserved; drift in either new hook remains an explicit error. No installed
package files are rewritten.

Preparation checks cover 467 shared unit tests, 11 hosting checks, type, lint,
architecture, isolated packed-consumer contracts, browser specimens, loader
lifecycle and publication dry runs (100 packed-browser passes with two existing
skips,
34 loader passes and four dry runs). Paris also passes 18 station/airport/morph
browser journeys; Swiss and London unit totals are 1,465 and 277 respectively.
The edition checks include clean registry
installs, boundary/type/lint/build gates, applicable payload budgets and relevant
station-selection/playback browser journeys. Publication succeeded from `4b07d16`
through [trusted run 39204369780](https://github.com/emmettl/motionstudies/actions/runs/39204369780).
All four registry integrities and `next` tags are verified. Exact adoption commits,
checks and installed-package parity are in the [evidence record](evidence/renderer-alpha34.json).

## Edition validation

| Edition | Unit checks | Relevant browser journeys |
| --- | ---: | ---: |
| London | 277 | 2 |
| Paris | 27 | 18 |
| Switzerland | 1,465 | 18 |
| Local / Express | 2 | 6 |
| NORIKAE player branch | 28 | 6 |
| Berlin | 20 | 8 |
| Underfall | 131 | 10 |

The browser runs use Chromium and WebKit except Berlin, whose existing phone
project uses Chromium. The independently maintained NORIKAE main branch also
passes 28 unit checks and
six browser journeys, giving 74 edition browser passes across eight checkouts.
All eight clean registry installations pass their applicable boundary, type, lint,
build and payload gates. Every installed package file matches the published
tarball; those files also match the candidates used for the browser checks.
The seven main-branch adoptions and NORIKAE player branch are pushed.


## Hosted rollout status

The npm release workflow succeeded, and every remote main head plus NORIKAE's
player branch matches the recorded adoption commits. The edition deployment
workflows started independently. Underfall's [check run](https://github.com/emmettl/underfall/actions/runs/39205271278)
passed code validation but failed when GitHub refused the deployment artifact
because the existing Actions storage quota is still exceeded. Its Cloudflare
workflow was therefore skipped by the successful-artifact gate. Other deployment
runs were still running or queued at this snapshot; local validation and a pushed
adoption do not establish a completed hosted deployment.
