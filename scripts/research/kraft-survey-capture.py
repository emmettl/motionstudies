"""Bounded one-shot public source survey. Run explicitly; never scheduled.

Retains request URLs, retrieval times, status, response headers, hashes and bytes.
Existing successful captures are reused. No credentials or paid APIs are used.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request

root = Path('work/kraft-source-probe/survey-2026-11-01')
root.mkdir(parents=True, exist_ok=True)
manifest_path = root / 'captures.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
jobs = []
def job(name, base, params=None):
    jobs.append((name, base + ('?' + urllib.parse.urlencode(params) if params else '')))

job('weather-era5', 'https://archive-api.open-meteo.com/v1/archive', {
    'latitude':'54,46.5,48,52', 'longitude':'6,8,2,10',
    'start_date':'2026-09-15','end_date':'2026-09-16', 'models':'era5',
    'hourly':'wind_speed_100m,wind_direction_100m,shortwave_radiation,cloud_cover',
    'wind_speed_unit':'ms','timezone':'UTC','elevation':'nan,nan,nan,nan','cell_selection':'nearest'})
job('meteoswiss-collection','https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-smn')
job('meteoswiss-items','https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-smn/items',{'limit':1})
job('plants-collection','https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.elektrizitaetsproduktionsanlagen')
job('bfe-production-rights','https://ckan.opendata.swiss/api/3/action/package_show',{'id':'energiedashboard-ch-stromproduktion-swissgrid'})
job('bfe-pv-rights','https://ckan.opendata.swiss/api/3/action/package_search',{'q':'pv-stromproduktion-estimate','rows':3})
job('bfe-pv-rights-targeted','https://ckan.opendata.swiss/api/3/action/package_search',{'q':'"energiedashboard" AND "Photovoltaik"','rows':10})
job('meteoswiss-abo-hourly','https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/abo/ogd-smn_abo_h_recent.csv')
job('meteoswiss-parameters','https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn/ogd-smn_meta_parameters.csv')
job('plants-items','https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.elektrizitaetsproduktionsanlagen/items',{'limit':1})
job('plants-csv-zip','https://data.geo.admin.ch/ch.bfe.elektrizitaetsproduktionsanlagen/elektrizitaetsproduktionsanlagen/elektrizitaetsproduktionsanlagen_2056.csv.zip')
job('bfe-consumption-rights','https://ckan.opendata.swiss/api/3/action/package_show',{'id':'energiedashboard-ch-landesverbrauch-und-endverbrauch'})
job('swiss-boundaries','https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissboundaries3d')
job('weather-era5-day-aligned', 'https://archive-api.open-meteo.com/v1/archive', {
    'latitude':'54,46.5,48,52','longitude':'6,8,2,10',
    'start_date':'2026-09-16','end_date':'2026-09-17','models':'era5',
    'hourly':'wind_speed_100m,wind_direction_100m,shortwave_radiation,cloud_cover',
    'wind_speed_unit':'ms','timezone':'UTC','elevation':'nan,nan,nan,nan','cell_selection':'nearest'})
for country, date in [('dk','2026-09-16'),('no','2026-09-16'),('se','2026-09-16'),('ch','2026-09-18'),('ch','2026-09-20')]:
    next_date = str(dt.date.fromisoformat(date)+dt.timedelta(days=1))
    for endpoint in ['public_power','cbpf']:
        job(f'{country}-{date}-{endpoint}','https://api.energy-charts.info/v2/'+endpoint,
            {'country':country,'start':date+'T00:00Z','end':next_date+'T00:00Z'})
last_energy = {}
for name, url in jobs:
    if any(c['name']==name and c.get('status')==200 for c in manifest):
        continue
    if 'api.energy-charts.info' in url:
        endpoint = urllib.parse.urlparse(url).path
        wait = max(0,31-(time.monotonic()-last_energy.get(endpoint,0)))
        if wait:
            time.sleep(wait)
        last_energy[endpoint]=time.monotonic()
    record={'name':name,'url':url,'retrievalStartedAt':dt.datetime.now(dt.timezone.utc).isoformat()}
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MotionStudies-KRAFT-source-research/1.0'}),timeout=35) as response:
            cap = (32 if name == 'plants-csv-zip' else 8) * 1024 * 1024
            body=response.read(cap+1)
            if len(body)>cap:
                raise ValueError(f'response exceeds {cap} byte cap')
            record.update(status=response.status,headers=dict(response.headers.items()))
    except urllib.error.HTTPError as error:
        body=error.read(65536)
        record.update(status=error.code,headers=dict(error.headers.items()))
    except Exception as error:
        body=b''
        record['error']=str(error)
    attempt = 1 + sum(c['name'] == name for c in manifest)
    filename = name + (f'-attempt{attempt}' if attempt > 1 else '') + '.json'
    record.update(retrievedAt=dt.datetime.now(dt.timezone.utc).isoformat(),bytes=len(body),sha256=hashlib.sha256(body).hexdigest(),file=filename)
    (root/record['file']).write_bytes(body)
    manifest.append(record)
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(name,record.get('status',record.get('error')),len(body),flush=True)
