"""Reconcile retained Swiss observations offline, without fitting or filling data.

Usage: python3 scripts/research/kraft-reconcile.py PROBE_ROOT RIGHTS_CAPTURE_ROOT
Prints a deterministic summary; raw interval records are not redistributed.
"""
import csv
import datetime as dt
from decimal import Decimal as D
import hashlib
import io
import json
import math
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile
from zoneinfo import ZoneInfo

probe, receipts = map(Path, sys.argv[1:3])
swiss = probe / 'swiss-2026-11-01'
ledger = json.loads((receipts / 'captures.json').read_text())
inputs = []

def payload(path):
    value = path.read_bytes()
    inputs.append({'file': path.name, 'bytes': len(value), 'sha256': hashlib.sha256(value).hexdigest()})
    return value

def read(path):
    return json.loads(payload(path), parse_float=D)

def captured(name):
    record = next(r for r in reversed(ledger) if r['name'] == name and r.get('status') == 200)
    value = payload(receipts / record['file'])
    assert len(value) == record['bytes'] and hashlib.sha256(value).hexdigest() == record['sha256']
    return value

def number(value):
    return round(float(value), 9)

ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(io.BytesIO(payload(swiss / 'swissgrid-2026.xlsx'))) as archive:
    strings = [''.join(s.itertext()) for s in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
    workbook = ET.fromstring(archive.read('xl/workbook.xml'))
    relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
    sheet = next(s for s in workbook.find('m:sheets', ns) if s.get('name') == 'Zeitreihen0h15')
    rid = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    target = next(r.get('Target') for r in relationships if r.get('Id') == rid)
    target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
    rows = ET.fromstring(archive.read(target)).findall('m:sheetData/m:row', ns)
    def cells(row):
        values = {}
        for cell in row:
            raw = cell.find('m:v', ns)
            if raw is not None:
                values[''.join(filter(str.isalpha, cell.get('r')))] = strings[int(raw.text)] if cell.get('t') == 's' else raw.text
        return values
    headers = cells(rows[0])
    data = []
    for row in rows[2:]:
        values = cells(row)
        if values.get('A'):
            # Excel serials have small binary roundoff; round once to nearest second.
            instant = dt.datetime(1899, 12, 30) + dt.timedelta(seconds=round(float(values['A']) * 86400))
            assert instant.second == 0 and instant.minute % 15 == 0
            data.append((instant, values, int(row.get('r'))))

day = dt.date(2026, 9, 16)
selected = [(t, v, r) for t, v, r in data if t.date() == day]
assert len(selected) == 96 and len({t for t, _, _ in selected}) == 96
assert [t for t, _, _ in selected] == [dt.datetime.combine(day, dt.time()) + dt.timedelta(minutes=15 * i) for i in range(96)]
required = ['B', 'C', 'D', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R']
assert all(v.get(c) is not None for _, v, _ in selected for c in required)
totals = {c: sum(D(v[c]) for _, v, _ in selected) / D(1_000_000) for c in required}
spring = [t for t, _, _ in data if t.date() == dt.date(2026, 3, 29)]
missing_spring = sorted(set(range(0, 1440, 15)) - {t.hour * 60 + t.minute for t in spring})
assert len(spring) == 92 and missing_spring == [120, 135, 150, 165]
zone = ZoneInfo('Europe/Zurich')
start = dt.datetime(2026, 9, 16, tzinfo=zone)
end = dt.datetime(2026, 9, 17, tzinfo=zone)

def native(value):
    rows = sorted((dt.datetime.fromisoformat(r['timestamp']), r['values']) for r in value['data'] if start <= dt.datetime.fromisoformat(r['timestamp']) < end)
    step = value['interval_minutes'] * 60
    assert [int(t.timestamp()) for t, _ in rows] == list(range(int(start.timestamp()), int(end.timestamp()), step))
    return rows

flows = read(swiss / 'ch-local-flows.json')
assert flows['unit'] == 'GW' and flows['interval_minutes'] == 15
flow_rows = native(flows)
borders = []
for border, out_col, in_col in [('austria', 'K', 'L'), ('germany', 'M', 'N'), ('france', 'O', 'P'), ('italy', 'Q', 'R')]:
    sg = [(D(v[in_col]) - D(v[out_col])) * 4 / 1000 for _, v, _ in selected]
    ec = [v[border] * 1000 for _, v in flow_rows]
    difference = [a - b for a, b in zip(ec, sg)]
    # Same 80 central workbook intervals for each shift; no wrap or extrapolation.
    shifts = []
    for shift in range(-8, 9):
        residual = [ec[i + shift] - sg[i] for i in range(8, 88)]
        shifts.append({'energyChartsIndexShiftMinutes': shift * 15,
                       'pairs': len(residual), 'rmseMw': number(math.sqrt(sum(float(v)**2 for v in residual) / len(residual)))})
    borders.append({'border': border,
                    'swissgridNetImportGwh': number((totals[in_col] - totals[out_col])),
                    'energyChartsNetImportGwh': number(sum(ec) / 4000),
                    'differenceGwh': number(sum(difference) / 4000),
                    'meanDifferenceMw': number(sum(difference) / 96),
                    'maximumAbsoluteDifferenceMw': number(max(abs(v) for v in difference)),
                    'sameDirectionIntervals': sum((a > 0) == (b > 0) and (a < 0) == (b < 0) for a, b in zip(ec, sg)),
                    'nativePairs': 96, 'shiftDiagnostics': shifts})

power = read(swiss / 'ch-local-power.json')
assert power['unit'] == 'MW' and power['interval_minutes'] == 60
power_rows = native(power)
ec_energy = {s['id']: sum(v[s['id']] for _, v in power_rows) / 1000
             for s in power['series'] if s.get('unit', power['unit']) == 'MW'}
hourly_load = []
for i, (t, values) in enumerate(power_rows):
    assert selected[i * 4][0] == t.replace(tzinfo=None)
    workbook_mw = sum(D(v['D']) for _, v, _ in selected[i * 4:i * 4 + 4]) / 1000
    hourly_load.append(values['load'] - workbook_mw)

consumption_csv = list(csv.DictReader(io.StringIO(captured('bfe-consumption-csv').decode('utf-8-sig'))))
production_csv = list(csv.DictReader(io.StringIO(captured('bfe-production-csv').decode('utf-8-sig'))))
consumption_day = [r for r in consumption_csv if r['Datum'] == day.isoformat()]
api_consumption = [r for r in read(swiss / 'consumption-day.json')['data'] if r['datum'] == day.isoformat()]
assert len(consumption_day) == len(api_consumption) == 1
csv_day = consumption_day[0]
assert int(csv_day['Landesverbrauch_GWh']) == api_consumption[0]['landesverbrauch_gwh'] == round(totals['D'])
assert int(csv_day['Endverbrauch_GWh']) == api_consumption[0]['endverbrauch_gwh'] == round(totals['B'])
assert len({r['Datum'] for r in consumption_csv}) == len(consumption_csv), 'Do not select a latest revision without an explicit ordering contract'
csv_production = [r for r in production_csv if r['Datum'] == day.isoformat()]
api_production = [r for r in read(swiss / 'production-day.json')['data'] if r['datum'] == day.isoformat()]
assert len(csv_production) == len(api_production) == 6
assert {r['Energietraeger']: D(r['Produktion_GWh']) for r in csv_production} == {r['energietraeger']: r['produktion_gwh'] for r in api_production}
comparison = []
mapping = {'Flusskraft': ['hydro_run_of_river'], 'Kernkraft': ['nuclear'], 'Photovoltaik': ['solar'],
           'Speicherkraft': ['hydro_water_reservoir', 'hydro_pumped_storage'], 'Thermische': ['others'], 'Wind': ['wind_onshore']}
for row in csv_production:
    keys = mapping[row['Energietraeger']]
    energy = sum(ec_energy[k] for k in keys)
    comparison.append({'bfeCategory': row['Energietraeger'], 'bfeGwh': number(D(row['Produktion_GWh'])),
                       'energyChartsCategories': keys, 'energyChartsGwh': number(energy),
                       'bfeMinusEnergyChartsGwh': number(D(row['Produktion_GWh']) - energy),
                       'comparisonStatus': 'candidate category correspondence; not proof of equivalent measurement scope'})

print(json.dumps({'kind': 'kraft-swiss-reconciliation', 'schemaVersion': 1,
    'date': day.isoformat(), 'inputs': inputs,
    'clock': {'interpretation': 'Europe/Zurich civil interval starts, supported by workbook DST pattern; provider confirmation pending',
              'springForwardDate': '2026-03-29', 'springRows': len(spring), 'missingMinuteLabels': missing_spring,
              'studyRows': 96, 'studyRowRange': [selected[0][2], selected[-1][2]],
              'comparisonStartUtc': start.astimezone(dt.timezone.utc).isoformat(),
              'comparisonEndUtc': end.astimezone(dt.timezone.utc).isoformat(),
              'compilerRule': 'interval kWh * 4 / 1000 = interval-mean MW; exclusive end'},
    'bfeConsumption': {'csvDatedRow': csv_day, 'apiDatedRows': len(api_consumption),
                       'csvRows': len(consumption_csv), 'csvDatesUnique': True,
                       'rule': 'Use this pinned CSV snapshot with unique dates; reject duplicate dates, never pick last from unordered API.',
                       'workbookEndUserGwh': number(totals['B']), 'workbookTotalGwh': number(totals['D']),
                       'roundedWorkbookEqualsBfe': True},
    'load': {'energyChartsGwh': number(ec_energy['load']), 'workbookTotalGwh': number(totals['D']),
             'differenceGwh': number(ec_energy['load'] - totals['D']),
             'hourlyPairs': 24, 'meanDifferenceMw': number(sum(hourly_load) / 24),
             'minimumHourlyDifferenceMw': number(min(hourly_load)), 'maximumHourlyDifferenceMw': number(max(hourly_load)),
             'status': 'unresolved scope/upstream/revision difference; not corrected'},
    'borders': borders, 'productionComparisons': comparison,
    'pumping': {'standaloneConsumptionPresent': False,
                'totalMinusEndUserGwh': number(totals['D'] - totals['B']),
                'meaning': 'combined pumps, grid losses and power-station own-use; never a pumping series'},
    'limitations': ['Native source values are frozen; these calculations do not revise the recorded release.',
                    'Clock diagnostics establish a consistent interpretation, not provider certification.',
                    'Category comparisons do not reconcile gross/net generation or mixed estimation methods.',
                    'No reconciliation residual is allocated to pumping, transit or individual plants.']}, indent=2) + '\n')
