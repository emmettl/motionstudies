"""Summarise frozen Swiss KRAFT samples offline; no provider requests."""
import datetime as dt
import hashlib
import json
from pathlib import Path

root = Path('work/kraft-source-probe/swiss-2026-11-01')
original = Path('work/kraft-source-probe/2026-11-01')
def read(path):
    return json.loads(path.read_text())

def window(value, start, end):
    rows = sorted(value['data'], key=lambda r: r['timestamp'])
    rows = [r for r in rows if start <= dt.datetime.fromisoformat(r['timestamp']) < end]
    times = [dt.datetime.fromisoformat(r['timestamp']).timestamp() for r in rows]
    step = value['interval_minutes'] * 60
    assert times == list(range(int(start.timestamp()), int(end.timestamp()), step))
    return rows

start = dt.datetime(2026, 9, 16, tzinfo=dt.timezone.utc)
flows = read(original / 'ch-cbpf.json')
rows = window(flows, start, start + dt.timedelta(days=1))
changes = []
previous = None
for row in rows:
    value = row['values']['germany']
    direction = 'import' if value > 0 else 'export' if value < 0 else 'zero'
    if direction != previous:
        changes.append({'intervalStart': row['timestamp'], 'directionRelativeToSwitzerland': direction, 'gw': value})
        previous = direction
border_energy = {s['id']: round(sum(r['values'][s['id']] for r in rows) * .25, 6) for s in flows['series']}
local_start = dt.datetime.fromisoformat('2026-09-16T00:00:00+02:00')
local_end = local_start + dt.timedelta(days=1)
power = read(root / 'ch-local-power.json')
local_rows = window(power, local_start, local_end)
local_energy = {s['id']: round(sum(r['values'][s['id']] for r in local_rows) / 1000, 6)
                for s in power['series'] if s.get('unit', power['unit']) == 'MW'}
daily_production = [r for r in read(root / 'production-day.json')['data'] if r['datum'] == '2026-09-16']
daily_consumption = [r for r in read(root / 'consumption-day.json')['data'] if r['datum'] == '2026-09-16']
assert len(daily_production) == 6 and len(daily_consumption) == 1
pv = read(root / 'pv-entremont.json')
pv_rows = sorted([r for r in pv['data'] if '2026-09-16T' in r['datetime_utc']], key=lambda r:r['datetime_utc'])
assert len(pv_rows) == 24 and len({r['datetime_utc'] for r in pv_rows}) == 24
assert all(r['bezirk'] == 'Entremont' for r in pv_rows)
captures = []
for path in sorted(root.iterdir()):
    if path.suffix not in ['.json', '.xlsx']:
        continue
    body = path.read_bytes()
    captures.append({'file': path.name, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
print(json.dumps({'kind': 'kraft-swiss-probe', 'auditDate': '2026-11-01', 'rawStore': str(root),
                  'captures': captures, 'utcDayBorderEnergyGwh': border_energy,
                  'germanBorderDirectionSpans': changes,
                  'localDayEnergyChartsEnergyGwh': local_energy,
                  'bfeDatedProduction': daily_production, 'bfeDatedConsumption': daily_consumption,
                  'entremontPv': {'rowsInUtcDay': len(pv_rows), 'peakRecord': max(pv_rows,key=lambda r:r['pv_produktion_schaetzung_kwh']),
                                 'truncatedUnfilteredPage': read(root / 'pv-day.json')['meta']},
                  'limitations': ['BFE dated totals have no timezone metadata in the inspected schema.',
                                 'No pumping-consumption series in acquired Swiss Energy-Charts response.',
                                 'Unfiltered PV page is capped at 1000 rows, not a complete Swiss day.',
                                 'Swissgrid workbook downloaded but not audited.',
                                 'Capture date recorded; exact retrieval instants not retained.']}, indent=2))
