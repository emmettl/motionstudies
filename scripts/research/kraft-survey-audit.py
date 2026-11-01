"""Offline coverage, provenance, rights and reconciliation audit for KRAFT."""
import collections
import csv
import datetime as dt
import hashlib
import io
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

root = Path('work/kraft-source-probe/survey-2026-11-01')
manifest = json.loads((root/'captures.json').read_text())
for capture in manifest:
    body = (root/capture['file']).read_bytes()
    assert len(body) == capture['bytes']
    assert hashlib.sha256(body).hexdigest() == capture['sha256'], capture['name']

def latest(name):
    return next(c for c in reversed(manifest) if c['name']==name and c.get('status')==200)

def body(name):
    return (root/latest(name)['file']).read_bytes()

def read(name):
    return json.loads(body(name))

def energy_summary(value, date):
    start=dt.datetime.fromisoformat(date+'T00:00:00+00:00')
    end=start+dt.timedelta(days=1)
    rows=[r for r in value['data'] if start<=dt.datetime.fromisoformat(r['timestamp'])<end]
    stamps=sorted(dt.datetime.fromisoformat(r['timestamp']).timestamp() for r in rows)
    seconds=value['interval_minutes']*60
    assert stamps == list(range(int(start.timestamp()),int(end.timestamp()),seconds))
    ids=[s['id'] for s in value['series']]
    missing={key:sum(r['values'].get(key) is None for r in rows) for key in ids}
    totals={key:round(sum(r['values'][key] for r in rows)*seconds/3600/(1000 if value['unit']=='MW' else 1),6)
            for key in ids if not missing[key] and next(s for s in value['series'] if s['id']==key).get('unit',value['unit']) in ['MW','GW']}
    changes={}
    if value['endpoint']=='cbpf':
        for key in ids:
            signs=[1 if r['values'][key]>0 else -1 if r['values'][key]<0 else 0 for r in rows if r['values'].get(key) is not None]
            nonzero=[s for s in signs if s]
            changes[key]=sum(a!=b for a,b in zip(nonzero,nonzero[1:]))
    return {'country':value['country'],'endpoint':value['endpoint'],'dateUtc':date,
            'rows':len(rows),'resolution':value['resolution'],'unit':value['unit'],
            'missingValues':{k:v for k,v in missing.items() if v},'series':ids,
            'completeSeriesEnergyGwh':totals,'nonzeroSignChanges':changes,'license':value.get('license')}

electricity=[]
for country,date in [('dk','2026-09-16'),('no','2026-09-16'),('se','2026-09-16'),('ch','2026-09-18'),('ch','2026-09-20')]:
    for endpoint in ['public_power','cbpf']:
        electricity.append(energy_summary(read(f'{country}-{date}-{endpoint}'),date))
for endpoint in ['public_power','cbpf']:
    value=json.loads(Path(f'work/kraft-source-probe/2026-11-01/ch-{endpoint}.json').read_text())
    electricity.append(energy_summary(value,'2026-09-16'))

weather=[]
for location in read('weather-era5-day-aligned'):
    hourly=location['hourly']; times=hourly['time']
    # Hourly radiation is backward-looking: 01:00..next midnight covers the day.
    radiation_indices=[i for i,t in enumerate(times) if '2026-09-16T01:00'<=t<='2026-09-17T00:00']
    wind_indices=[i for i,t in enumerate(times) if '2026-09-16T00:00'<=t<'2026-09-17T00:00']
    assert len(radiation_indices)==len(wind_indices)==24
    series={}
    for key in ['wind_speed_100m','wind_direction_100m','shortwave_radiation','cloud_cover']:
        indices=radiation_indices if key=='shortwave_radiation' else wind_indices
        vals=[hourly[key][i] for i in indices]
        series[key]={'missing':sum(v is None for v in vals),'min':min(v for v in vals if v is not None),'max':max(v for v in vals if v is not None),'unit':location['hourly_units'][key]}
    weather.append({'latitude':location['latitude'],'longitude':location['longitude'],'elevation':location['elevation'],
                    'utcOffsetSeconds':location['utc_offset_seconds'],'series':series})

station_rows=list(csv.DictReader(io.StringIO(body('meteoswiss-abo-hourly').decode('cp1252')),delimiter=';'))
station_selected=[r for r in station_rows if dt.datetime(2026,9,16)<dt.datetime.strptime(r['reference_timestamp'],'%d.%m.%Y %H:%M')<=dt.datetime(2026,9,17)]
assert len(station_selected)==24
assert len({r['reference_timestamp'] for r in station_selected})==24
station={'id':'ABO','name':'Adelboden','utcIntervalEndRows':24,
         'fields':{key:{'missing':sum(r[key]=='' for r in station_selected),
                        'min':min(float(r[key]) for r in station_selected if r[key]!=''),
                        'max':max(float(r[key]) for r in station_selected if r[key]!='')}
                   for key in ['fu3010h0','dkl010h0','gre000h0']}}

workbook=Path('work/kraft-source-probe/swiss-2026-11-01/swissgrid-2026.xlsx')
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(workbook) as archive:
    strings=[''.join(x.itertext()) for x in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
    def cell(c):
        v=c.find('m:v',ns)
        return None if v is None else strings[int(v.text)] if c.get('t')=='s' else v.text
    rows=ET.fromstring(archive.read('xl/worksheets/sheet4.xml')).findall('m:sheetData/m:row',ns)
    header={''.join(filter(str.isalpha,c.get('r'))):cell(c) for c in rows[0]}
    selected=[]
    indices=[]
    for row in rows[2:]:
        values={''.join(filter(str.isalpha,c.get('r'))):cell(c) for c in row}
        if values.get('A') and 46281<=float(values['A'])<46282:
            selected.append(values);indices.append(int(row.get('r')))
    assert len(selected)==96
    for values in selected:
        assert all(values.get(k) is not None for k in ['B','C','D','K','L','M','N','O','P','Q','R'])
    gwh={key:round(sum(float(r[key]) for r in selected)/1e6,9) for key in ['B','C','D','K','L','M','N','O','P','Q','R','T','U']}
    regions={key:{'label':header[key],'missing':sum(r.get(key) is None for r in selected),
                  'gwh':round(sum(float(r[key]) for r in selected if r.get(key) is not None)/1e6,9)} for key in ['AF','AG','AT','AU','AP','AQ']}
workbook_summary={'file':str(workbook),'sha256':hashlib.sha256(workbook.read_bytes()).hexdigest(),
                  'sheet':'Zeitreihen0h15','rowStart':min(indices),'rowEnd':max(indices),'rows':96,
                  'dateLabels':'2026-09-16; timezone not explicit in inspected cells',
                  'units':'kWh per quarter-hour','totalsGwhByColumn':gwh,'selectedRegions':regions,
                  'manualLeftAlignedSince':2025,
                  'pumpingConsumptionColumnPresent':any('pump' in (v or '').lower() for v in header.values())}
local_flows=json.loads(Path('work/kraft-source-probe/swiss-2026-11-01/ch-local-flows.json').read_text())
flow_rows=local_flows['data'][:-1]
border_comparison=[]
for border,out_col,in_col in [('austria','K','L'),('germany','M','N'),('france','O','P'),('italy','Q','R')]:
    ec=sum(r['values'][border] for r in flow_rows)*.25
    sg=gwh[in_col]-gwh[out_col]
    border_comparison.append({'border':border,'swissgridDatedNetImportGwh':round(sg,6),'energyChartsLocalDayNetImportGwh':round(ec,6),'differenceGwh':round(ec-sg,6)})

with zipfile.ZipFile(io.BytesIO(body('plants-csv-zip'))) as archive:
    plants=list(csv.DictReader(io.TextIOWrapper(archive.open('ElectricityProductionPlant.csv'),encoding='utf-8-sig')))
    catalogue={name:archive.read(name).decode('utf-8-sig') for name in ['MainCategoryCatalogue.csv','PlantCategoryCatalogue.csv']}
plant_summary={'records':len(plants),'crs':'EPSG:2056',
               'missingCoordinates':sum(not r['_x'] or not r['_y'] for r in plants),
               'missingOperationDate':sum(not r['BeginningOfOperation'] for r in plants),
               'operationAfterStudyDate':sum(r['BeginningOfOperation']>'2026-09-16' for r in plants),
               'duplicateIds':len(plants)-len({r['xtf_id'] for r in plants}),
               'countsByMainCategory':dict(collections.Counter(r['MainCategory'] for r in plants)),
               'missingCoordinatesByMainCategory':dict(collections.Counter(r['MainCategory'] for r in plants if not r['_x'] or not r['_y'])),
               'catalogues':catalogue,
               'licenseLinks':[x for x in read('plants-collection')['links'] if x['rel']=='license']}
for plant in plants:
    if plant['_x'] and plant['_y']:
        assert math.isfinite(float(plant['_x'])) and math.isfinite(float(plant['_y']))
asset=read('plants-items')['features'][0]['assets']['elektrizitaetsproduktionsanlagen_2056.csv.zip']
assert asset['file:checksum'] == '1220'+latest('plants-csv-zip')['sha256']
rights={}
for name in ['bfe-production-rights','bfe-consumption-rights']:
    value=read(name)['result']
    rights[name]=[{'rights':r.get('rights'),'url':r['url']} for r in value['resources']]

print(json.dumps({'kind':'kraft-survey-audit','auditDate':'2026-11-01','captures':manifest,
                  'electricity':electricity,'weather':weather,'meteoswissStation':station,
                  'swissgridWorkbook':workbook_summary,'swissBorderComparison':border_comparison,
                  'plantRegister':plant_summary,'resourceRights':rights},indent=2,ensure_ascii=False))
