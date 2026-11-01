"""Offline audit of the bounded Energy-Charts KRAFT probe; no network requests.

Usage: python3 scripts/research/kraft-source-audit.py [capture-directory]
Prints a reproducible summary; raw responses remain in the ignored work store.
"""
import datetime as dt
import hashlib
import json
import math
import pathlib
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'work/kraft-source-probe/2026-11-01')
start = dt.datetime(2026, 9, 16, tzinfo=dt.timezone.utc).timestamp()
end = start + 86400
captures = []
flows = {}
for country in ['at', 'ch', 'de', 'fr', 'it', 'nl']:
    for endpoint in ['public_power', 'cbpf']:
        path = root / f'{country}-{endpoint}.json'
        body = path.read_bytes()
        value = json.loads(body)
        assert value['country'] == country and value['endpoint'] == endpoint
        assert value['unit'] == ('MW' if endpoint == 'public_power' else 'GW')
        rows = {dt.datetime.fromisoformat(r['timestamp']).timestamp(): r['values'] for r in value['data']}
        assert len(rows) == len(value['data']), 'duplicate timestamp'
        selected = {t: r for t, r in rows.items() if start <= t < end}
        step = value['interval_minutes'] * 60
        assert sorted(selected) == list(range(int(start), int(end), step)), 'interval gap'
        series = []
        for s in value['series']:
            values = [r.get(s['id']) for r in selected.values()]
            present = [v for v in values if v is not None]
            assert all(isinstance(v, (int, float)) and math.isfinite(v) for v in present)
            series.append({'id': s['id'], 'unit': s.get('unit', value['unit']),
                           'missing': len(values) - len(present),
                           'min': min(present) if present else None,
                           'max': max(present) if present else None})
        if endpoint == 'cbpf':
            flows[country] = selected
        captures.append({'country': country, 'endpoint': endpoint,
                         'url': f'https://api.energy-charts.info/v2/{endpoint}?country={country}&start=2026-09-16T00%3A00Z&end=2026-09-17T00%3A00Z',
                         'file': path.name, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest(),
                         'generatedAt': value['generated_at'], 'license': value.get('license'),
                         'unit': value['unit'], 'resolution': value['resolution'],
                         'sourceRows': len(rows), 'selectedRows': len(selected),
                         'excludedEndBoundaryRows': len(rows) - len(selected), 'series': series})
names = {'at': 'austria', 'ch': 'switzerland', 'de': 'germany', 'fr': 'france', 'it': 'italy', 'nl': 'netherlands'}
pairs = []
for a, b in [('de', 'fr'), ('de', 'ch'), ('fr', 'ch'), ('de', 'at'), ('de', 'nl'), ('ch', 'it'), ('fr', 'it'), ('at', 'it'), ('at', 'ch')]:
    residuals = [abs(flows[a][t][names[b]] + flows[b][t][names[a]]) for t in flows[a]
                 if flows[a][t].get(names[b]) is not None and flows[b][t].get(names[a]) is not None]
    pairs.append({'areas': [a, b], 'pairedIntervals': len(residuals),
                  'maxOppositeResidualGw': max(residuals) if residuals else None})
schema = (root / 'openapi.json').read_bytes()
print(json.dumps({'kind': 'kraft-source-probe', 'schemaVersion': 1, 'auditDate': '2026-11-01',
                  'studyWindow': {'startUtc': '2026-09-16T00:00:00Z', 'endUtcExclusive': '2026-09-17T00:00:00Z'},
                  'rawStore': str(root), 'rawResponsesCommitted': False,
                  'openapiSha256': hashlib.sha256(schema).hexdigest(),
                  'totalResponseBytes': sum(c['bytes'] for c in captures),
                  'captures': captures, 'borderChecks': pairs}, indent=2))
