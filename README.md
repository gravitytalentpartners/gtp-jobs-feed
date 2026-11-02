# gtp-jobs-feed

Feed behind the jobs board on gravityexecutives.com/hospitality-jobs.

- `jobs.json` is what the board loads, from https://raw.githubusercontent.com/gravitytalentpartners/gtp-jobs-feed/main/jobs.json
- `build_board.py` turns an Open Searches export from the Gravity Talent Partners ATS into the feed. It refuses to build if a public field is missing or a client name appears in public copy.
- `overrides.json` holds display overrides (role names, featured badges, description suffixes) keyed by the last 8 characters of the ATS record id.
- `fetch_airtable.py` pulls the Post to Website records from the ATS using the `AIRTABLE_TOKEN` secret.
- Jobs whose Stage is Completed Placement or On Hold stay off the board even if Post to Website is still checked (filtered in `fetch_airtable.py` and again in `build_board.py`).
- Job pages live in the Squarespace blog "Job Listings" at gravityexecutives.com/jobs. The job page map in that blog's Page Header Code Injection (one entry per page, keyed by URL) drives each page's header and Google JobPosting data, and the board reads the same map to link every card to its page. A page whose job is no longer in jobs.json shows "This position is no longer open", drops its JobPosting data and is marked noindex.
- `page_builder.js` keeps the job pages in step with the board. Load it in a signed in Squarespace admin tab and call `GTPB.plan()` then `GTPB.run()`: it builds a page for every board job that lacks one (from templates, or from copy passed in for roles without a template), sets pages for jobs that left the board to draft, removes them from the map and redirects them to /hospitality-jobs, and keeps pay and metro in sync. A scheduled task runs it every Sunday evening after the feed rebuild.
- `pages.json` is a fallback list of job page links, used by the board only if the live map cannot be read.
- `manual_jobs.json` holds jobs that belong on the board but have no ATS record. Remove an entry when that search closes.
- `.github/workflows/feed.yml` runs every Sunday at 3:33 PM Eastern (and on demand from the Actions tab), rebuilds the feed, and commits `jobs.json` only when the jobs changed. The board picks up a new commit within about ten minutes.

The Sunday ATS mirror of Fox postings runs at 2:23 PM Eastern, so the 3:33 PM rebuild sees it.
