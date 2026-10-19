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
tarballs. The renderer change is prepared for adoption by London, Paris, Switzerland,
Local / Express, NORIKAE, Berlin and Underfall through exact registry pins.

Paris's guarded build adapter must follow the extracted component and picking
modules. Its station admission, morph scale and airport-over-station priority are
preserved; drift in either new hook remains an explicit error. No installed
package files are rewritten.

Preparation checks cover 467 shared unit tests, 11 hosting checks, type, lint,
architecture, isolated packed-consumer contracts, browser specimens, loader
lifecycle and publication dry runs (100 packed-browser passes with two existing skips,
34 loader passes and four dry runs). Paris also passes 18 station/airport/morph
browser journeys; Swiss and London unit totals are 1,465 and 277 respectively. The edition checks include clean registry
installs, boundary/type/lint/build gates, applicable payload budgets and relevant
station-selection/playback browser journeys. Publication and adoption evidence
will be recorded after the trusted workflow succeeds.
