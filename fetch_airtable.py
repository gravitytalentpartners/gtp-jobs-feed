#!/usr/bin/env python3
"""Pull Open Searches records with Post to Website checked (and Stage not Completed Placement
or On Hold) from the GTP ATS and save them
in the shape build_board.py expects ({"records": [{"id": ..., "cellValuesByFieldId": {...}}]}).

Reads AIRTABLE_TOKEN from the environment (a read only personal access token scoped to the base).
Usage: fetch_airtable.py out.json
"""
import json, os, sys, urllib.request, urllib.parse

BASE = 'appLD7LkoIgyCC4Bp'
TABLE = 'tbldnlIklvv8YS7h5'
FIELDS = ['fldFXHEJG0vswcP8X', 'fld8KT77VQn86rNfP', 'fldSsFLw3ySgFAJjT', 'fld5UPa0CIqdxSghJ',
          'fld8MDuji3ZwMSvwV', 'fldvo9KXYArkefizu', 'fldvjN43yMHvMRvpa', 'fldHKVEnJt6R2cr6T',
          'flduOBAWQWhwN06Bf', 'fldyqswm0O4UZG8NM']
FORMULA = "AND({Post to Website}, NOT(OR({Stage} = 'Completed Placement', {Stage} = 'On Hold')))"


def main():
    token = (os.environ.get('AIRTABLE_TOKEN') or '').strip()
    if not token:
        raise SystemExit('AIRTABLE_TOKEN is not set')
    if '.' not in token or not token.startswith('pat'):
        raise SystemExit('AIRTABLE_TOKEN does not look like a full Airtable token (it should start with pat and contain a dot). The token ID shown in the Airtable list is not the token.')
    out = sys.argv[1]
    records, offset = [], None
    while True:
        params = [('returnFieldsByFieldId', 'true'), ('pageSize', '100'),
                  ('filterByFormula', FORMULA)]
        params += [('fields[]', f) for f in FIELDS]
        if offset:
            params.append(('offset', offset))
        url = 'https://api.airtable.com/v0/%s/%s?%s' % (BASE, TABLE, urllib.parse.urlencode(params))
        req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        for rec in data.get('records', []):
            records.append({'id': rec['id'], 'cellValuesByFieldId': rec.get('fields', {})})
        offset = data.get('offset')
        if not offset:
            break
    if len(records) < 20:
        raise SystemExit('only %d records came back, refusing to rebuild the feed' % len(records))
    json.dump({'records': records}, open(out, 'w'))
    print('fetched', len(records), 'records')


if __name__ == '__main__':
    main()
