"""Explicit, bounded rights/definition refresh; no account or recurring collection.

Usage: python3 scripts/research/kraft-rights-capture.py /absolute/capture/root
Successful receipts are immutable and reused. Failures stay in the ledger.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(sys.argv[1])
ROOT.mkdir(parents=True, exist_ok=True)
ledger_path = ROOT / 'captures.json'
ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else []
jobs = {
    'energy-charts-openapi': 'https://api.energy-charts.info/openapi.json',
    'energy-charts-sources': 'https://energy-charts.info/sources.html?l=en&c=CH',
    'energy-charts-faq': 'https://energy-charts.info/faqs.html?l=en&c=CH',
    'energy-charts-page-content': 'https://energy-charts.info/jsx/build/pageContent.js?v=a7836a67',
    'energy-charts-contact': 'https://energy-charts.info/contact.html?l=en',
    'energy-charts-sources-content': 'https://energy-charts.info/jsx/build/sources.js?v=a7836a67',
    'energy-charts-contact-content': 'https://energy-charts.info/jsx/build/contact.js?v=a7836a67',
    'entsoe-reuse-list': 'https://transparencyplatform.zendesk.com/hc/article_attachments/40921869379729',
    'entsoe-terms': 'https://transparencyplatform.zendesk.com/hc/article_attachments/40921869376401',
    'swissgrid-legal': 'https://www.swissgrid.ch/en/home/footer/legal-information.html',
    'swissgrid-definitions': 'https://www.swissgrid.ch/en/home/customers/topics/energy-data-ch.html',
    'swissgrid-generation': 'https://www.swissgrid.ch/en/home/operation/grid-data/generation.html',
    'swissgrid-commercial-flows': 'https://www.swissgrid.ch/en/home/operation/grid-data/cross-border-load-flows.html',
    'swiss-terms': 'https://opendata.swiss/en/terms-of-use',
    'bfe-production-rights': 'https://ckan.opendata.swiss/api/3/action/package_show?id=energiedashboard-ch-stromproduktion-swissgrid',
    'bfe-consumption-rights': 'https://ckan.opendata.swiss/api/3/action/package_show?id=energiedashboard-ch-landesverbrauch-und-endverbrauch',
    'bfe-pv-catalogue': 'https://ckan.opendata.swiss/api/3/action/package_search?' + urllib.parse.urlencode({'q': 'ogd127 OR "pv-stromproduktion-estimate" OR "PV-Segmentation"', 'rows': 20}),
    'bfe-pv-page': 'https://www.dashboardenergie.admin.ch/strom/produktion-pv',
    'bfe-pv-model-card': 'https://www.bfe-ogd.ch/pv_segmentation_model_card.pdf',
    'bfe-production-csv': 'https://www.bfe-ogd.ch/ogd104_stromproduktion_swissgrid.csv',
    'bfe-consumption-csv': 'https://www.bfe-ogd.ch/ogd103_stromverbrauch_swissgrid_lv_und_endv.csv',
    'bfe-consumption-metadata': 'https://energiedashboard.ch/api/v1/datasets/stromverbrauch-swissgrid-lv-und-endv',
    'plants-rights': 'https://data.geo.admin.ch/api/stac/v1/collections/ch.bfe.elektrizitaetsproduktionsanlagen',
    'boundaries-rights': 'https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissboundaries3d',
    'swisstopo-terms': 'https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices',
    'boundaries-product': 'https://www.swisstopo.admin.ch/en/landscape-model-swissboundaries3d',
    'bfe-pv-catalogue-exact': 'https://ckan.opendata.swiss/api/3/action/package_search?' + urllib.parse.urlencode({'q': '"ogd127_pv_stromproduktion_estimate"', 'rows': 5}),
    'meteoswiss-terms': 'https://opendatadocs.meteoswiss.ch/general/terms-of-use',
    'open-meteo-terms': 'https://open-meteo.com/en/terms',
    'era5-overview': 'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview',
}
for name, url in jobs.items():
    cached = next((r for r in reversed(ledger) if r['name'] == name and r['url'] == url and r.get('status') == 200), None)
    if cached:
        existing = (ROOT / cached['file']).read_bytes()
        if len(existing) != cached['bytes'] or hashlib.sha256(existing).hexdigest() != cached['sha256']:
            raise ValueError(f'Cached rights receipt failed integrity: {name}')
        continue
    record = {'name': name, 'url': url, 'retrievalStartedAt': dt.datetime.now(dt.timezone.utc).isoformat()}
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'MotionStudies-KRAFT-rights-review/1.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read(8 * 1024 * 1024 + 1)
            if len(payload) > 8 * 1024 * 1024:
                raise ValueError('Response exceeds 8 MiB ceiling')
            record.update(status=response.status, headers={k: v for k, v in response.headers.items() if k.lower() != 'set-cookie'}, finalUrl=response.url)
    except urllib.error.HTTPError as error:
        payload = error.read(65536)
        record.update(status=error.code, headers={k: v for k, v in error.headers.items() if k.lower() != 'set-cookie'})
    except Exception as error:
        payload = b''
        record['error'] = str(error)
    attempt = 1 + sum(r['name'] == name for r in ledger)
    record.update(file=f'{name}-{attempt}.body', bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest(), retrievedAt=dt.datetime.now(dt.timezone.utc).isoformat())
    (ROOT / record['file']).write_bytes(payload)
    ledger.append(record)
    ledger_path.write_text(json.dumps(ledger, indent=2) + '\n')
    print(name, record.get('status', record.get('error')), len(payload), flush=True)
