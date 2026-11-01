# gtp-jobs-feed

Feed behind the jobs board on gravityexecutives.com/hospitality-jobs.

- `jobs.json` is what the board loads, from https://raw.githubusercontent.com/gravitytalentpartners/gtp-jobs-feed/main/jobs.json
- `build_board.py` turns an Open Searches export from the Gravity Talent Partners ATS into the feed. It refuses to build if a public field is missing or a client name appears in public copy.
- `overrides.json` holds display overrides (role names, featured badges, description suffixes) keyed by the last 8 characters of the ATS record id.
- `fetch_airtable.py` pulls the Post to Website records from the ATS using the `AIRTABLE_TOKEN` secret.
- `.github/workflows/feed.yml` runs every Sunday at 3:33 PM Eastern (and on demand from the Actions tab), rebuilds the feed, and commits `jobs.json` only when the jobs changed. The board picks up a new commit within about ten minutes.

The Sunday ATS mirror of Fox postings runs at 2:23 PM Eastern, so the 3:33 PM rebuild sees it.
