# Local / Express publication review

**Programme update — 13 September 2026:** Local / Express is parked at the author’s request. This review is retained for a possible return; publication follow-up is paused and the private proof remains unpublished.

[Edition repository (private)](https://github.com/emmettl/local-express) · [Study brief](NEW-YORK.md)

Reviewed 6 September 2026. This is an engineering release decision, not legal advice.

## Decision

Keep **Local / Express** as a private, reproducible study until MTA provides written clarification or an appropriate licence. Following the repository split on 7 September 2026, the independent edition repository remains private and Pages is disabled. Do not make that repository or its derived artifacts public while this gate is unresolved. This public planning document records the release decision; it contains no derived MTA artifacts.

The ambiguity is narrow but material. The [MTA data-feed agreement](https://www.mta.info/developers/terms-and-conditions), updated 13 March 2024, expressly allows a developer to download and host feed data on a non-MTA server and to use only part of a feed. It also says that a developer must not modify or delete feed data. The corridor artifact selects trips, converts the ZIP tables into a compact application schema, derives indexes and scheduled-order-reversal events, and simplifies fields. That is a transformation even though source values and provenance remain traceable.

The [MTA developer page](https://www.mta.info/developers) says its feeds are free to use while separately requiring a licence for logos, maps, symbols and other MTA intellectual property. The linked [MTA Licensing Program](https://www.mta.info/doing-business-with-us/licensing-program) lists maps, station names, subway route indicators and rolling stock among its licensing categories. The study uses plain station names and route numerals but no MTA logo, route bullet, map artwork, signage system, rolling-stock likeness or official line-colour specification. That reduces confusion and copying risk; it does not resolve whether the separate licence requirement applies.

## Conditions already met

- Data is fetched during compilation and served only from a project-controlled host.
- The interface identifies MTA as the source without stating or implying MTA endorsement, approval or hosting.
- The study is labelled scheduled and not realtime; it does not claim completeness, observed operation or physical track assignment.
- The original archive URL, retrieval time, feed version and SHA-256 are retained in the artifact metadata.
- The visual system, diagram geometry and colour treatment are original rather than copied from an MTA map or identity asset.
- Keyboard navigation, reduced motion, non-WebGL fallback and phone viewport checks are part of the browser gate.

## Clarification to request

Before public release, ask `MTALicensing@nyct.com` whether a free, non-commercial browser artwork may:

1. publish a compact transformed subset of regular Subway GTFS on its own static host;
2. display plain station names and route numerals without MTA route bullets, logos, colours or map artwork;
3. retain derived service-pattern comparisons and interpolation while clearly labelling them as the application's analysis rather than MTA data; and
4. distribute the compiler source and reproducibility metadata without redistributing the original ZIP.

If MTA requires a licence, retain the response and agreement alongside the source manifest before enabling Pages publication. If MTA permits feed transformation under the existing agreement, record that clarification and remove the explicit publication exclusion. If neither is available, replace the public proof with generated or separately licensed data rather than weakening the provenance language.

## Build gate

The private Local / Express repository runs its edition checks without a Pages deployment workflow. Its local page carries `noindex,nofollow`. Gleislicht’s `npm run pages:prepare` rejects New York publication in the Swiss artifact. Any public release requires resolving this review, then deliberately enabling publication in the edition repository. Shared package releases and changes to the public catalogue do not release this proof.
