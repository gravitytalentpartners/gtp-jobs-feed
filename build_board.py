#!/usr/bin/env python3
"""GTP jobs board generator.

Input: a JSON export of the Open Searches table filtered to Post to Website = true
(the exact shape the Airtable list_records_for_table tool returns), plus overrides.json.
pages.json (job page link per job) and manual_jobs.json (jobs with no ATS record) are read
from the same folder as overrides.json when they exist.
Records whose Stage is Completed Placement or On Hold never reach the board, even if
Post to Website is still checked.
Output: jobs.json (the feed), board_embed_vN.html (static paste version), board_loader.html
(one time paste that reads the feed).

Usage: build_board.py open_searches.json overrides.json out_dir version_label feed_url
"""
import json, os, re, sys, html, datetime

F = {
    'title': 'fldFXHEJG0vswcP8X', 'pos': 'fld8KT77VQn86rNfP', 'client': 'fldSsFLw3ySgFAJjT',
    'metro': 'fld5UPa0CIqdxSghJ', 'tags': 'fld8MDuji3ZwMSvwV', 'desc': 'fldvo9KXYArkefizu',
    'comp': 'fldvjN43yMHvMRvpa', 'sal': 'fldHKVEnJt6R2cr6T', 'internal': 'flduOBAWQWhwN06Bf',
    'stage': 'fldyqswm0O4UZG8NM',
}
CLOSED = {'completed placement', 'on hold'}
FORM = 'https://airtable.com/appLD7LkoIgyCC4Bp/pagK5TijMmeWmwEYu/form'
LEAK = ['fox', 'the henry', 'culinary dropout', 'flower child', 'zinburger', 'blanco', 'doughbird',
        'greene house', 'olive & ivy', 'arrogant butcher', '110 grill', 'apex', 'tavern', 'broadway',
        'bhg', 'nautilus', 'pier 4', 'oar and iron', 'm culinary', 'opus', '2life', 'concert golf',
        'betterteam', 'cheesecake', 'raventures']


def norm_comp(c, sal):
    c = (c or '').strip()
    if not c and sal:
        c = 'Up to $%dK' % round(sal / 1000)
    return re.sub(r'(\d)k\b', r'\1K', c)


def stage_name(s):
    if isinstance(s, dict):
        s = s.get('name')
    return (s or '').strip()


def check_public(rid, role, metro, desc, tags, comp, label):
    if not (role and metro and desc):
        raise SystemExit('missing public field on %s %s' % (rid, label))
    blob = ' '.join([role, metro, ' '.join(tags), desc, comp]).lower()
    hits = [b for b in LEAK if b in blob]
    if hits:
        raise SystemExit('client identifier %s on %s' % (hits, label))


def load_optional(folder, name, default):
    path = os.path.join(folder, name)
    if not os.path.exists(path):
        return default
    data = json.load(open(path))
    if isinstance(data, dict):
        data.pop('_note', None)
    return data


def build_jobs(records, overrides, pages=None, manual=None):
    pages = pages or {}
    jobs, seen, skipped = [], set(), []
    for r in records:
        v = r['cellValuesByFieldId']
        if v.get(F['internal']):
            continue
        rid = r['id'][-8:]
        if stage_name(v.get(F['stage'])).lower() in CLOSED:
            skipped.append((rid, stage_name(v.get(F['stage']))))
            continue
        o = overrides.get(rid, {})
        role = o.get('role') or (v.get(F['pos']) or '').strip()
        metro = (v.get(F['metro']) or '').strip()
        tags = [t.strip() for t in (v.get(F['tags']) or '').split(',') if t.strip()]
        desc = (v.get(F['desc']) or '').strip() + o.get('desc_suffix', '')
        sal = v.get(F['sal']) or 0
        comp = norm_comp(v.get(F['comp']), sal)
        check_public(rid, role, metro, desc, tags, comp, v.get(F['title']))
        j = {'rid': rid, 'role': role, 'metro': metro, 'tags': tags, 'desc': desc, 'comp': comp, 'sal': sal}
        if o.get('badge'):
            j['badge'] = o['badge']
        jobs.append(j)
        seen.add(rid)
    for m in (manual or []):
        rid = m['rid']
        if rid in seen:
            continue
        o = overrides.get(rid, {})
        role = o.get('role') or m.get('role', '').strip()
        tags = [t.strip() for t in m.get('tags', []) if t.strip()]
        desc = m.get('desc', '').strip() + o.get('desc_suffix', '')
        comp = norm_comp(m.get('comp'), m.get('sal') or 0)
        check_public(rid, role, m.get('metro', '').strip(), desc, tags, comp, 'manual job ' + rid)
        j = {'rid': rid, 'role': role, 'metro': m['metro'].strip(), 'tags': tags, 'desc': desc, 'comp': comp,
             'sal': m.get('sal') or 0}
        if o.get('badge') or m.get('badge'):
            j['badge'] = o.get('badge') or m.get('badge')
        jobs.append(j)
        seen.add(rid)
    for j in jobs:
        url = pages.get(j['rid'])
        if url:
            if not re.match(r'^/jobs/[a-z0-9-]+$', url):
                raise SystemExit('bad job page link for %s: %s' % (j['rid'], url))
            j['url'] = url
    for rid, st in skipped:
        print('left off the board (stage %s): %s' % (st, rid))
    jobs.sort(key=lambda j: (-j['sal'], j['role'], j['metro']))
    for j in jobs:
        del j['sal']
    return jobs


CSS = r'''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet">
<style>
  .gtp-board{--paper:#ffffff;--ink:#111111;--stone:#6b6b6b;--line:#e2e2e2;--wash:#f6f6f6;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--paper);color:var(--ink);padding:48px 16px 80px;line-height:1.55;width:100%;max-width:100%;overflow-x:hidden}
  .gtp-board *{box-sizing:border-box}
  .gtp-wrap{width:100%;max-width:880px;margin:0 auto}
  .gtp-head h2{font-family:"Source Serif 4",Georgia,serif;font-weight:700;font-size:34px;margin:0 0 8px;color:var(--ink)}
  .gtp-head p{margin:0 0 6px;font-size:15px;color:var(--stone)}
  .gtp-count{font-size:13px;color:var(--stone);margin:14px 0 18px}
  .gtp-controls{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 26px}
  .gtp-controls input,.gtp-controls select{font-family:inherit;font-size:14px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:10px 12px;max-width:100%}
  .gtp-controls input{flex:1 1 240px}
  .gtp-controls select{flex:0 1 240px}
  .gtp-job{border:1px solid var(--line);border-radius:8px;padding:18px 20px;margin:0 0 12px;background:var(--paper)}
  .gtp-job.gtp-feat{border:2px solid #b08d2f;background:#fdfaf1}
  .gtp-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8a6d1d;background:#f4e9c9;border:1px solid #d9c37a;border-radius:99px;padding:3px 10px;margin:0 0 8px}
  .gtp-job-title{display:block;font-family:"Source Serif 4",Georgia,serif;font-weight:600;font-size:18px;line-height:1.3;color:var(--ink)}
  a.gtp-job-link{color:inherit;text-decoration:none;background-image:none}
  a.gtp-job-link:hover .gtp-job-title{text-decoration:underline}
  .gtp-page{font-size:13px;color:var(--stone);text-decoration:underline}
  .gtp-job-meta{display:block;font-size:13.5px;color:var(--stone);margin-top:4px}
  .gtp-tags{margin:10px 0 0;display:flex;flex-wrap:wrap;gap:6px}
  .gtp-tag{font-size:11.5px;color:var(--stone);background:var(--wash);border:1px solid var(--line);border-radius:99px;padding:3px 10px;white-space:nowrap}
  .gtp-desc{display:none;font-size:14px;color:var(--ink);margin:12px 0 0;padding-top:12px;border-top:1px solid var(--line)}
  .gtp-job.open .gtp-desc{display:block}
  .gtp-actions{display:flex;align-items:center;gap:14px;margin-top:14px;flex-wrap:wrap}
  .gtp-comp{font-size:14px;font-weight:600;color:var(--ink)}
  .gtp-more{font-size:13px;color:var(--stone);background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;font-family:inherit}
  .gtp-apply{margin-left:auto;font-size:13px;font-weight:600;letter-spacing:.02em;text-decoration:none;color:#ffffff;background:var(--ink);border-radius:6px;padding:9px 18px}
  .gtp-apply:hover{background:#333333;color:#ffffff}
  .gtp-empty{display:none;font-size:14px;color:var(--stone);padding:26px 0}
  .gtp-team{margin-top:48px;border-top:2px solid var(--ink);padding-top:28px}
  .gtp-team h3{font-family:"Source Serif 4",Georgia,serif;font-weight:700;font-size:24px;margin:0 0 6px}
  .gtp-team p{font-size:14px;color:var(--stone);margin:0 0 16px}
  .gtp-foot{margin-top:36px;font-size:12px;color:var(--stone);border-top:1px solid var(--line);padding-top:14px}
  .gtp-board input,.gtp-board select,.gtp-board button{max-width:100%}
  @media (max-width:620px){.gtp-board{padding:28px 10px 56px}.gtp-apply{margin-left:0;width:100%;text-align:center}}
</style>'''

BODY = r'''<div class="gtp-board"><div class="gtp-wrap">
  <div class="gtp-head">
    <h2>Apply Now</h2>
    <p>Please review our confidential opportunities below. Apply for consideration and a member of our team will review your credentials.</p>
  </div>
  <div class="gtp-controls">
    <input id="gtpSearch" type="text" placeholder="Search by role or keyword" aria-label="Search roles">
    <select id="gtpMetro" aria-label="Filter by location"><option value="">All locations</option></select>
  </div>
  <div class="gtp-count"><span id="gtpShown"></span> open positions</div>
  <div id="gtpList"></div>
  <div class="gtp-empty" id="gtpEmpty">No roles match that search. Clear the filters to see all open positions.</div>
  <div class="gtp-team">
    <h3>Join Our Team</h3>
    <p>Gravity Talent Partners is growing. We partner with experienced professionals who want to own their own recruiting business, backed by our brand, our systems, and full desk support. If you want to be a business owner, we offer the architecture and the system for you to land and expand.</p>
    <div class="gtp-job">
      <span class="gtp-job-title">Independent Contract Recruiter, Business to Business, Full Desk Support</span>
      <span class="gtp-job-meta">Remote, United States</span>
      <div class="gtp-tags"><span class="gtp-tag">Independent Business Owner</span><span class="gtp-tag">No cap on earnings</span><span class="gtp-tag">Origination revenue share</span></div>
      <div class="gtp-desc">Build your own recruiting business backed by a boutique executive search firm with national reach and a complete launch system. You own your business and operate business to business with full desk support behind you: proven tools, resources, and technology, origination revenue share, no cap on commission based income, and the freedom to work from anywhere. The people who thrive here are self starters with recruiting or industry experience, business minded professionals who are passionate about connecting companies with great talent. You bring the drive and the relationships. We bring the platform that turns them into a business.</div>
      <div class="gtp-actions"><span class="gtp-comp">Commission based, no cap</span>
        <button class="gtp-more" type="button">Details</button>
        <a class="gtp-apply" href="https://airtable.com/appLD7LkoIgyCC4Bp/pagK5TijMmeWmwEYu/form?prefill_Position=Independent%20Contract%20Recruiter%20-%20GTP%20Internal" target="_blank" rel="noopener">Apply</a></div>
    </div>
  </div>
  <div class="gtp-foot">Gravity Talent Partners LLC &middot; Executive Search &middot; Leadership Advisory &middot; Management Consulting &middot; gravityexecutives.com</div>
</div></div>'''

RENDER = r'''
var FORM="%(form)s";
var list=document.getElementById('gtpList'),q=document.getElementById('gtpSearch'),sel=document.getElementById('gtpMetro'),shown=document.getElementById('gtpShown'),empty=document.getElementById('gtpEmpty');
var JOBS=[];
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function baseMetro(m){return m.replace(/\s*\(.*\)$/,'');}
function fillMetros(){var seen={},opts=[];JOBS.forEach(function(j){var b=baseMetro(j.metro);if(!seen[b]){seen[b]=1;opts.push(b);}});opts.sort();var cur=sel.value;sel.innerHTML='<option value="">All locations</option>'+opts.map(function(m){return '<option value="'+esc(m)+'">'+esc(m)+'</option>';}).join('');sel.value=cur;}
function wire(root){root.querySelectorAll('.gtp-more').forEach(function(b){b.addEventListener('click',function(){var card=b.closest('.gtp-job');card.classList.toggle('open');b.textContent=card.classList.contains('open')?'Hide details':'Details';});});}
function render(){
  var term=(q.value||'').toLowerCase(),metro=sel.value,n=0,htmlOut='';
  JOBS.forEach(function(j){
    var hay=(j.role+' '+j.metro+' '+j.tags.join(' ')+' '+j.desc).toLowerCase();
    if(metro&&baseMetro(j.metro)!==metro)return;
    if(term&&hay.indexOf(term)===-1)return;
    n++;
    var pos=encodeURIComponent(j.role+' - '+j.metro+' ['+j.rid+']');
    var tags=j.tags.map(function(t){return '<span class="gtp-tag">'+esc(t)+'</span>';}).join('');
    htmlOut+='<div class="gtp-job'+(j.badge?' gtp-feat':'')+'">'
      +(j.badge?'<span class="gtp-badge">'+esc(j.badge)+'</span>':'')
      +(j.url?'<a class="gtp-job-link" href="'+esc(j.url)+'">':'')+'<span class="gtp-job-title">'+esc(j.role)+'</span>'+(j.url?'</a>':'')
      +'<span class="gtp-job-meta">'+esc(j.metro)+'</span>'
      +'<div class="gtp-tags">'+tags+'</div>'
      +'<div class="gtp-desc">'+esc(j.desc)+'</div>'
      +'<div class="gtp-actions"><span class="gtp-comp">'+esc(j.comp)+'</span>'
      +'<button class="gtp-more" type="button">Details</button>'
      +(j.url?'<a class="gtp-page" href="'+esc(j.url)+'">Full job page</a>':'')
      +'<a class="gtp-apply" href="'+FORM+'?prefill_Position='+pos+'" target="_blank" rel="noopener">Apply</a></div>'
      +'</div>';
  });
  list.innerHTML=htmlOut;shown.textContent=n;empty.style.display=n?'none':'block';
  wire(list);
}
function load(jobs){JOBS=jobs;fillMetros();render();}
q.addEventListener('input',render);sel.addEventListener('change',render);
wire(document.querySelector('.gtp-team'));
'''


def page(script):
    return CSS + '\n' + BODY + '\n<script>\n(function(){' + script + '\n})();\n</script>\n'


def main():
    src, ovr, out, label, feed_url = sys.argv[1:6]
    records = json.load(open(src))['records']
    overrides = json.load(open(ovr))
    folder = os.path.dirname(os.path.abspath(ovr))
    pages = load_optional(folder, 'pages.json', {})
    manual = load_optional(folder, 'manual_jobs.json', {}).get('jobs', [])
    jobs = build_jobs(records, overrides, pages, manual)
    generated = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    feed = {'generated': generated, 'count': len(jobs), 'jobs': jobs}
    json.dump(feed, open(out + '/jobs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    inline = RENDER % {'form': FORM} + 'load(' + json.dumps(jobs, ensure_ascii=False, separators=(',', ':')) + ');'
    open(out + '/board_embed_' + label + '.html', 'w').write(page(inline))
    loader = RENDER % {'form': FORM} + (
        "var FEED='%s';\n"
        "fetch(FEED+'?t='+Math.floor(Date.now()/600000),{cache:'no-store'}).then(function(r){return r.json();})"
        ".then(function(f){load(f.jobs);}).catch(function(){shown.textContent='0';empty.textContent='Open positions are loading slowly. Please refresh in a moment.';empty.style.display='block';});"
    ) % feed_url
    open(out + '/board_loader.html', 'w').write(page(loader))
    metros = sorted(set(re.sub(r'\s*\(.*\)$', '', j['metro']) for j in jobs))
    print('jobs:', len(jobs), 'featured:', sum(1 for j in jobs if j.get('badge')), 'metros:', len(metros),
          'with job page:', sum(1 for j in jobs if j.get('url')))
    print('top:', [(j['role'], j['comp']) for j in jobs[:3]])


if __name__ == '__main__':
    main()
