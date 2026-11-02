/* Gravity Talent Partners weekly job page builder.
 *
 * Runs inside a signed in Squarespace admin tab (https://duck-robin-9c2r.squarespace.com/config/...).
 * Load it with:
 *   eval(await fetch('https://raw.githubusercontent.com/gravitytalentpartners/gtp-jobs-feed/main/page_builder.js?x=' + Date.now(), {cache: 'no-store'}).then(r => r.text()));
 * Then:
 *   await GTPB.plan()             what needs building, taking down or syncing (changes nothing)
 *   await GTPB.preview(rid, copy) the page a job would get (changes nothing)
 *   await GTPB.run({copy})        builds missing pages, takes down stale ones, syncs pay and metro
 *   await GTPB.verify()           checks every board job has a live page and every stale page redirects
 *
 * Jobs whose role and concept match a template are written automatically. Any other job comes back in
 * plan().needsCopy and must be given copy in run({copy: {RID: {...}}}) or it is skipped and reported.
 * Copy fields: label (title segment, for example "Global Hotel Company"), noun (for the SEO line, for
 * example "global hospitality company"), intro (first paragraph, ending before the confidentiality line),
 * own (5 or 6 bullets), look (5 bullets), and either expl (a key of GTPB.EXPL) or explTitle + explParas,
 * plus optional onet. Write only from the job's public description; no client names; no dash punctuation.
 */
(function () {
  var COLL = '6ad253c55d9553498df7710d';
  var FEED = 'https://raw.githubusercontent.com/gravitytalentpartners/gtp-jobs-feed/main/jobs.json';
  var FORM = 'https://airtable.com/appLD7LkoIgyCC4Bp/pagK5TijMmeWmwEYu/form?prefill_Position=';
  var POSTS = '/api/content/blogs/' + COLL + '/text-posts';
  var PS = '<p style="white-space:pre-wrap;" data-rte-preserve-empty="true">';
  var H2 = '<h2 style="white-space:pre-wrap;" data-rte-preserve-empty="true">';
  var LEAK = ['fox', 'the henry', 'culinary dropout', 'flower child', 'zinburger', 'blanco', 'doughbird',
    'greene house', 'olive & ivy', 'arrogant butcher', '110 grill', 'apex', 'tavern', 'broadway', 'bhg',
    'nautilus', 'pier 4', 'oar and iron', 'm culinary', 'opus', '2life', 'concert golf', 'betterteam',
    'cheesecake', 'raventures'];
  var DATA = {"ROLES":{"Executive Chef":[["Lead the kitchen: menu execution, line management and every plate that leaves the pass","Build and engineer menus with the culinary leadership team","Own food cost, kitchen labor, purchasing and inventory","Hire, train and develop Sous Chefs and the back of house team","Hold sanitation, food safety and consistency standards every shift","Partner with the General Manager on the restaurant's results and guest experience"],["Executive Chef or Executive Sous Chef experience in a high volume scratch kitchen","Command of food cost, labor and kitchen financials","A hands on leader who works the line and builds a training culture","Strong organization across prep, inventory and ordering at volume","Calm and consistent through busy, bar driven service"],"The Executive Chef Role",["An Executive Chef runs the entire culinary side of a hospitality business. In a restaurant group, hotel or private club, that can mean a main dining room, casual outlets, catering and banquets, often on the same day. The job blends three things: cooking at a high level, leading a kitchen team, and running a profitable operation.","Day to day, the Executive Chef sets the menu and the standard for every plate, builds recipes and costing, manages ordering and inventory, schedules the team, and works the line when service calls for it. They hire, train and develop Sous Chefs and cooks, and they own sanitation, food safety and kitchen upkeep.","On the business side, the Executive Chef owns food cost, labor and the culinary budget, forecasts volume with the front of house and events teams, and reports results to the General Manager or ownership. The strongest candidates can show both: a kitchen that cooks great food consistently and a P&L that hits its targets.","Most Executive Chefs step up from a successful run as Sous Chef or Executive Sous Chef in a high volume kitchen, or from an Executive Chef seat in a smaller operation that is ready for more scale."]],"Restaurant Manager":[["Run the floor on your shifts: service, pace, guest experience and the team","Lead, schedule and coach servers, bartenders, hosts and support staff","Handle guest issues on the spot and build regulars","Own shift level controls: labor, comps, cash, opening and closing","Hold cleanliness, safety and brand standards every shift","Partner with the GM and the kitchen to keep service and food in sync"],["Restaurant Manager or strong shift leader experience in a high volume, full service restaurant","A floor presence: visible, calm and quick with guests and staff","Comfortable with scheduling, labor and shift financials","A coach who builds servers and bartenders into a strong team","Energy for busy nights and the organization to keep them smooth"],"The Restaurant Manager Role",["A Restaurant Manager runs the dining room on their shifts. The General Manager owns the whole business; the Restaurant Manager owns the floor while the doors are open, leading the front of house team, managing the pace of service and making sure every guest leaves happy.","Day to day, the Restaurant Manager opens or closes, sets the floor plan, runs the pre shift, coaches servers and bartenders in the moment, handles guest issues and watches the numbers that move during a shift: labor, comps, cash and sales. The role also keeps the room clean, safe and on brand.","Restaurant Managers grow into Assistant General Managers and General Managers by learning the back half of the business: scheduling, cost control, hiring and the P&L. In a high volume restaurant that path can be fast for managers who build strong teams and consistent service.","Candidates usually come from Restaurant Manager, Shift Leader or Bar Manager roles in busy full service, upscale casual or fast casual restaurants."]],"Sous Chef":[["Run the line and the pass on your shifts, with the Executive Chef or in their absence","Lead, train and schedule cooks and prep staff","Own prep lists, ordering, receiving and inventory for your stations","Hold recipe specs, plating standards and ticket times at volume","Keep sanitation, food safety and kitchen organization tight every shift","Step into the Executive Chef's role on their days off"],["Sous Chef or strong Lead Line Cook experience in a high volume scratch kitchen","Clean, fast and consistent on the line, and able to run a shift start to finish","Comfortable with ordering, inventory and basic kitchen financials","A teacher who builds cooks and keeps a calm, positive line","Reliable, organized and ready for the next step toward Executive Chef"],"The Sous Chef Role",["A Sous Chef is the second in command of a kitchen. The Executive Chef sets the menu and owns the numbers; the Sous Chef makes service happen, running the line, expediting the pass and leading the cooks on every shift they work.","Day to day, the Sous Chef writes prep lists, checks product in, keeps stations stocked and organized, tastes and corrects, and holds recipe specs and plating standards through the busiest hours. Sous Chefs usually own ordering and inventory for part of the kitchen and run the full operation on the Executive Chef's days off.","Leadership is a growing part of the job. The Sous Chef trains new cooks, coaches the line, manages the schedule and keeps the kitchen clean, safe and calm when tickets are stacked. In a scratch cooking, high volume restaurant that is a demanding seat and the best training there is for an Executive Chef role.","Most Sous Chefs come from Lead Line Cook, Kitchen Supervisor or Junior Sous Chef roles in busy scratch kitchens, and the strongest ones are promoted to Executive Sous Chef or Executive Chef within a few years."]],"General Manager":[["Run the whole restaurant: sales, margin, labor, guest experience and the team","Own the P&L, forecasting, scheduling and cost controls","Hire, train and develop managers, chefs and hourly staff","Hold food quality, service and cleanliness standards every shift","Lead the floor during peak service and build regulars","Partner with the Executive Chef and the home office on menus, marketing and growth"],["General Manager experience in a high volume, full service restaurant","A record of growing sales and margin while improving guest scores","Strong financial command: P&L, labor, cost control and forecasting","A hands on leader who builds strong, stable teams","Energy and presence for a busy, guest packed room"],"The General Manager Role",["A restaurant General Manager owns everything that happens inside the four walls: the guests, the team, the food and the numbers. In a high volume restaurant that means leading a large staff, managing a scratch kitchen in partnership with the culinary leader, and delivering the sales and margin the business expects.","Day to day, the GM leads service from the floor, coaches managers and staff, handles guest issues, and keeps standards of food, service and cleanliness high on every shift. Behind the scenes, the GM owns the P&L: forecasting, scheduling, labor, cost of goods, purchasing, repairs and the controls that protect margin.","People are the biggest part of the job. The GM hires, trains and develops the management team and hourly staff, builds a culture that keeps good people, and grows the next GM. Strong GMs also build the restaurant's place in its community, from regulars to local partnerships and events.","Candidates usually come from GM or Assistant General Manager roles in high volume, full service, fast casual, upscale casual or chef driven restaurants."]],"Assistant General Manager":[["Run the restaurant alongside the GM and lead it on their days off","Own scheduling, labor, inventory and shift level cost controls","Hire, train and develop the management and front of house teams","Lead the floor during peak service and drive guest experience","Hold food quality, service and cleanliness standards every day","Partner with the Executive Chef and the GM on results and the P&L"],["Assistant General Manager or senior Restaurant Manager experience in a high volume restaurant","A record of building strong teams and consistent service","Command of scheduling, labor, cost controls and basic P&L","A hands on leader who is calm and decisive in a busy room","Ready to step into a General Manager seat"],"The Assistant General Manager Role",["An Assistant General Manager is the General Manager's second and the restaurant's operating leader on most shifts. The AGM carries much of what the GM does, scheduling, labor, hiring, training, inventory and shift results, while still leading the floor during peak service.","Day to day, the AGM runs shifts, coaches managers and staff, handles guest issues, and manages the controls that protect margin: labor, comps, cash, ordering and inventory. The role usually owns the schedule and the hiring pipeline, and runs the restaurant fully when the GM is off.","The AGM seat is where future General Managers learn the P&L. Strong AGMs understand how sales, labor and cost of goods move the bottom line and can explain the numbers to their teams. They also build benches deep enough to make the next GM promotion easy.","Candidates come from Assistant General Manager, Restaurant Manager or Bar Manager roles in high volume, full service, fast casual or upscale casual restaurants."]],"Executive Sous Chef":[["Run the kitchen day to day alongside the Executive Chef and lead the Sous Chefs","Own ordering, inventory, food cost and kitchen labor on your shifts","Hold recipe specs, plating and ticket times across a high volume line","Hire, train and develop Sous Chefs, cooks and prep staff","Keep sanitation, food safety and kitchen systems to standard","Run the kitchen fully in the Executive Chef's absence"],["Executive Sous Chef or senior Sous Chef experience in a high volume scratch kitchen","Command of ordering, inventory, food cost and labor","A hands on leader who runs a clean, organized, fast line","A developer of cooks and Sous Chefs with a steady, positive presence","Ready to step into an Executive Chef seat"],"The Executive Sous Chef Role",["An Executive Sous Chef is the Executive Chef's right hand and the kitchen's operating leader on most shifts. The role sits between the Sous Chefs and the Executive Chef: still on the line, but now carrying the numbers, the schedule and the development of the kitchen team.","Day to day, the Executive Sous Chef runs service, writes and reviews prep, manages ordering and inventory, tracks food cost and labor, and holds every plate to spec. The role trains and leads the Sous Chefs and cooks, keeps sanitation and safety tight, and runs the whole kitchen when the Executive Chef is off or traveling.","In a high volume scratch kitchen the Executive Sous Chef is usually the next Executive Chef, either in that restaurant or at a new opening. Strong candidates show both sides: cooking and line leadership, and the discipline with cost, labor and systems that an Executive Chef seat demands.","Candidates come from Executive Sous Chef or senior Sous Chef roles in busy, scratch cooking restaurants, hotels and clubs."]]},"EXPL":{"cfo":["The Chief Financial Officer Role",["A Chief Financial Officer owns the financial health and direction of the company. The seat covers accounting and close, planning and forecasting, cash and treasury, tax and audit, and the capital decisions that shape how the business grows.","Day to day, the CFO gives the CEO, ownership and the operating team a clear, timely view of performance, builds the budget and the long range plan, manages banking, lender and investor relationships, and sets the controls and systems that let the company scale without losing visibility.","In a multi site or project driven business the role is as operational as it is financial. The strongest CFOs understand the unit economics behind every location, contract or property, and partner closely with operators to turn the numbers into decisions.","Candidates usually come from CFO, VP Finance or senior controller roles in comparable multi site, hospitality, real estate or construction businesses, often with capital markets or private equity experience behind them."]],"controller":["The Controller Role",["A Controller owns the accounting engine of the company: the close, the general ledger, payroll, payables and receivables, cash, and the controls that keep financial reporting accurate and on time.","Day to day, the Controller runs the monthly close, reconciles and reviews the books, prepares financial statements and management reporting, supports audit and tax, and works with operators so the numbers reflect what is really happening in each unit.","In a multi unit hospitality business the role is also about scale. Strong Controllers build processes and systems that hold up as the company adds locations or concepts, and they develop an accounting team that can run them.","Candidates usually come from Controller, Assistant Controller or accounting manager roles in multi unit restaurant, hospitality or franchise organizations, often with public accounting experience earlier in their careers."]],"vpfin":["The Corporate Vice President, Finance Role",["A corporate finance vice president at a global hotel company sits between the CFO's office and the business. The role leads finance projects and new programs, builds the analysis behind major decisions, and makes sure corporate finance supports the hotels and the brands well.","Day to day, that means planning and forecasting work, business cases and financial models, process and reporting improvements, and close partnership with operations, development and accounting teams across the portfolio.","Strong candidates bring an MBA or CPA, a background in corporate finance or FP&A, and the communication skills to turn complex numbers into clear recommendations for senior leaders."]],"rvp_hotel":["The Regional Vice President of Operations Role",["A Regional Vice President of Operations leads a group of hotels and their general managers on behalf of the management company, the owners and the brands. The role is accountable for owner returns, guest satisfaction, brand standards and the strength of the leadership teams in every property.","Day to day, the RVP reviews performance with each GM, drives revenue and cost strategy, approves budgets and forecasts, visits properties, supports sales and revenue management, and represents the company with owners, asset managers and brand partners.","The best regional leaders develop general managers, step in when a property needs help, and build trust with ownership through clear communication and results.","Candidates usually come from regional, area or multi property general manager roles with third party management companies or branded hotel owners and operators."]],"rvp_multi":["The Regional Vice President of Operations Role",["A Regional Vice President of Operations leads a market or region of a multi unit brand: the unit leaders, the results and the standards that make the brand what it is. The role owns the P&L for the region and the strength of its leadership bench.","Day to day, the RVP visits units, coaches general managers and district leaders, drives sales, labor and cost performance, holds operating and guest experience standards, and partners with the home office on openings, training and marketing.","The strongest regional leaders build talent faster than the company grows, so every new location opens with a ready leader and existing units keep improving.","Candidates usually come from Regional Director, Director of Operations or Regional Vice President roles with multi unit restaurant, cafe or entertainment brands."]],"vp_senior":["The Vice President of Operations Role",["A Vice President of Operations in senior living leads the executive directors who run each community, and is accountable for resident experience, occupancy, financial results and regulatory compliance across the portfolio.","Day to day, the role visits communities, coaches and develops executive directors, reviews census, budgets and NOI, supports sales and marketing, and makes sure clinical, dining and life enrichment programs meet the company's standards and the state's requirements.","The strongest senior living operators combine a real heart for residents and families with the business discipline to keep communities full, well staffed and financially strong.","Candidates usually come from regional director or vice president of operations roles with senior living or continuing care operators, often after running communities as an executive director."]],"construction":["The Construction Executive Role",["A construction executive at an owner and operator leads the capital program from the owner's side: deciding what gets built and why, setting budgets and schedules, choosing the right partners, and delivering projects safely, on time and on budget.","Day to day, that means feasibility and planning, design management, contracting and procurement, oversight of general contractors and project managers, and clear reporting to senior leadership on cost, schedule and risk.","The strongest candidates have delivered complex capital programs across many sites at once, built project management teams and processes, and earned the trust of operators who live with the result.","Candidates usually come from vice president or director of construction, development or capital projects roles with owners, operators or large construction managers."]],"svp_gm_gc":["The Senior Vice President and General Manager Role",["A Senior Vice President and General Manager in a general contractor runs a business unit as if it were its own company: winning work, delivering it well and building the team that does both.","Day to day, the role owns the unit's P&L, leads business development and client relationships alongside preconstruction, oversees project execution and safety, and recruits and develops project executives, project managers and superintendents.","The strongest candidates have grown a market for a builder before, with a client network in healthcare, commercial or multifamily work and a record of profitable delivery.","Candidates usually come from SVP, VP or division leader roles with established general contractors and construction managers."]],"svp_fac":["The Senior Vice President, Facilities, Energy and Capital Role",["This executive owns the physical side of a hotel portfolio: the long range capital plan, facilities and engineering standards, and the energy strategy that keeps properties efficient and competitive.","Day to day, the role prioritizes and funds capital projects across dozens of hotels, leads engineering and facilities leaders, manages energy procurement and efficiency programs, and reports to the CEO and ownership on spend, results and risk.","Strong candidates have run capital, engineering or asset management functions for a multi property hotel or real estate company and are comfortable managing a large annual spend with discipline.","Candidates usually come from senior capital planning, engineering, facilities or asset management roles with hotel owners, operators or REITs."]],"vp_portfolio":["The Vice President, Portfolio Operations Role",["A portfolio operations vice president at a luxury lifestyle hotel company leads a group of hotels and their general managers, and drives the operating consistency that lets a design led brand grow without losing what makes it special.","Day to day, the role reviews performance with each property, coaches GMs, leads operating initiatives and transformation work across the group, and partners with the COO and corporate teams on standards, systems and results.","Strong candidates bring multi property hotel operations leadership, a record of operating change, and a feel for luxury and lifestyle guest experience.","Candidates usually come from regional or area operations roles, or general manager roles at flagship luxury and lifestyle hotels."]],"gm_resort":["The Resort General Manager Role",["A general manager of a large resort and convention center leads one of the most complex businesses in hospitality: rooms, food and beverage, group and convention sales, events, engineering and a large workforce, all under one roof.","Day to day, the GM leads the executive committee, drives revenue strategy and group business, owns the P&L and the budget, holds brand standards, and represents the hotel with ownership, the brand and the community.","Strong candidates have run large, group focused hotels or resorts before and can show results for both the brand and ownership.","Candidates usually come from general manager roles at large convention or resort hotels, or from hotel manager roles at the largest properties ready for the top seat."]],"dir_catering":["The Director of Catering Operations Role",["A director of catering operations is the operating leader of a catering and events business: the people, the production, the logistics and the results behind every event.","Day to day, the role sets expectations and operating rhythm for general managers and support leaders, holds SOPs and service quality across event types, manages budgets, labor and KPIs, and partners with culinary, sales, finance and people teams.","The strongest candidates bring discipline to complex logistics, develop managers well, and stay composed and decisive through peak event periods.","Candidates usually come from director or senior manager roles in large catering, events, contract food service or multi site hospitality operations."]]},"ONET":{"Executive Chef":"35-1011.00 Chefs and Head Cooks","Executive Sous Chef":"35-1011.00 Chefs and Head Cooks","Sous Chef":"35-1011.00 Chefs and Head Cooks","Restaurant Manager":"11-9051.00 Food Service Managers","General Manager":"11-9051.00 Food Service Managers","Assistant General Manager":"11-9051.00 Food Service Managers","cfo":"11-3031.00 Financial Managers","vpfin":"11-3031.00 Financial Managers","controller":"11-3031.01 Treasurers and Controllers","rvp_hotel":"11-9081.00 Lodging Managers","vp_portfolio":"11-9081.00 Lodging Managers","gm_resort":"11-9081.00 Lodging Managers","rvp_multi":"11-1021.00 General and Operations Managers","vp_senior":"11-1021.00 General and Operations Managers","construction":"11-9021.00 Construction Managers","svp_gm_gc":"11-9021.00 Construction Managers","svp_fac":"11-3013.00 Facilities Managers","dir_catering":"11-9051.00 Food Service Managers"},"CONCEPTS":{"Fast casual|Scratch cooking|Health forward":["Health Forward Fast Casual","health forward fast casual restaurant","A high throughput, health forward fast casual restaurant in the {area}, with a fully from scratch kitchen and an upbeat pace, typically doing $3M to $5M, is hiring {arole}."],"Scratch kitchen|$6M to $10M volume|High energy bar scene":["High Energy Scratch Kitchen","high energy scratch kitchen restaurant","A high energy, from scratch kitchen restaurant in the {area}, doing $6M to $10M with a lively, bar driven atmosphere and a fast moving team, is hiring {arole}."],"Scratch kitchen|$10M+ volume|Elevated all day dining":["High Volume Upscale Restaurant","high volume upscale restaurant","A high volume, $10M plus scratch kitchen restaurant in the {area}, with a polished, high end feel and an all day dining program, is hiring {arole}."],"Full service|Scratch kitchen|Strong bar program":["Full Service Scratch Kitchen","full service scratch kitchen restaurant","A vibrant, full service scratch kitchen restaurant in the {area}, doing $4M to $7M with a strong bar program and festive energy, is hiring {arole}."],"Premium casual|Scratch kitchen|Chef driven":["Chef Driven Premium Casual","chef driven premium casual restaurant","A fast paced, chef driven scratch kitchen restaurant in the {area}, doing roughly $3M with a premium casual feel, is hiring {arole}."],"Garden inspired|Scratch kitchen|Strong brunch and patio":["Garden Inspired Scratch Kitchen","garden inspired scratch kitchen restaurant","A modern, garden inspired scratch kitchen restaurant in the {area}, doing $4M to $6M with a strong brunch, patio and bar business and a polished, relaxed feel, is hiring {arole}."]},"PLACES":{"San Diego Metro, CA":["San Diego CA","San Diego area","San Diego","CA"],"Los Angeles Metro, CA (hybrid)":["Los Angeles CA","Los Angeles area","Los Angeles","CA"],"Dallas Metro, TX":["Dallas TX","Dallas area","Dallas","TX"],"Atlanta Metro, GA":["Atlanta GA","Atlanta area","Atlanta","GA"],"Western US (Remote)":["Western US Remote","western United States",null,null],"Detroit Metro, MI (hybrid)":["Detroit MI","Detroit area","Detroit","MI"],"Chicago Metro, IL":["Chicago IL","Chicago area","Chicago","IL"],"Seattle Metro, WA":["Seattle WA","Seattle area","Seattle","WA"],"Washington DC Metro, MD":["Washington DC Metro","Washington DC area",null,"MD"],"Southwest Florida":["Southwest Florida","Southwest Florida area",null,"FL"],"Greater Boston, MA":["Greater Boston MA","Greater Boston area","Boston","MA"],"Southern California":["Southern California","Southern California area",null,"CA"],"Central New Jersey":["Central New Jersey","Central New Jersey area",null,"NJ"],"Miami Metro, FL":["Miami FL","Miami area","Miami","FL"],"New York Metro, NY":["New York NY","New York area","New York","NY"],"Northern New Jersey":["Northern New Jersey","Northern New Jersey area",null,"NJ"],"Denver Metro, CO (West Coast region)":["Denver CO","Denver area","Denver","CO"],"Denver Metro, CO":["Denver CO","Denver area","Denver","CO"],"Phoenix Metro, AZ":["Phoenix AZ","Phoenix area","Phoenix","AZ"],"Kansas City Metro, KS":["Kansas City KS","Kansas City area","Kansas City","KS"],"Boise Metro, ID":["Boise ID","Boise area","Boise","ID"],"Tucson Metro, AZ":["Tucson AZ","Tucson area","Tucson","AZ"],"Austin Metro, TX":["Austin TX","Austin area","Austin","TX"],"Houston Metro, TX":["Houston TX","Houston area","Houston","TX"],"Las Vegas Metro, NV":["Las Vegas NV","Las Vegas area","Las Vegas","NV"]}};

  function crumb() { return decodeURIComponent((document.cookie.match(/crumb=([^;]+)/) || [])[1] || ''); }
  function hdr(ct) { return {'Content-Type': ct || 'application/json', 'X-CSRF-Token': crumb()}; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function art(w) { return 'AEIOU'.indexOf(w[0].toUpperCase()) > -1 ? 'an' : 'a'; }
  function slugify(t) { return t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function dashFree(s) { return !/[‐-―]/.test(s); }
  async function getJSON(u) { var r = await fetch(u, {credentials: 'include', cache: 'no-store'}); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }

  function pay(comp) {
    var k = function (s) { return Math.round(parseFloat(s) * 1000); };
    var m = comp.match(/\$([\d.]+)K to \$([\d.]+)K/); if (m) return [k(m[1]), k(m[2])];
    m = comp.match(/Up to \$([\d.]+)K/); if (m) return [null, k(m[1])];
    m = comp.match(/^\$([\d.]+)K/); if (m) return [k(m[1]), k(m[1])];
    return null;
  }

  function place(metro) {
    if (DATA.PLACES[metro]) return DATA.PLACES[metro];
    var m = metro.replace(/\s*\((hybrid|remote)\)\s*$/i, ''), mm;
    if ((mm = m.match(/^(.*?) Metro, ([A-Z]{2})$/))) return [mm[1] + ' ' + mm[2], mm[1] + ' area', mm[1], mm[2]];
    if ((mm = m.match(/^Greater (.*?), ([A-Z]{2})$/))) return ['Greater ' + mm[1] + ' ' + mm[2], 'Greater ' + mm[1] + ' area', mm[1], mm[2]];
    if ((mm = m.match(/^(.*?), ([A-Z]{2})$/))) return [mm[1] + ' ' + mm[2], mm[1] + ' area', mm[1], mm[2]];
    return [m, m + ' area', null, null];
  }

  function template(job) {
    var c = DATA.CONCEPTS[job.tags.join('|')], r = DATA.ROLES[job.role];
    if (!c || !r) return null;
    var p = place(job.metro);
    return {label: c[0], noun: c[1], intro: c[2].replace('{area}', p[1]).replace('{arole}', art(job.role) + ' ' + job.role),
      own: r[0], look: r[1], explTitle: r[2], explParas: r[3], onet: DATA.ONET[job.role]};
  }

  function makePage(job, copy, taken) {
    var p = place(job.metro);
    var c = Object.assign({}, copy);
    if (c.expl) { var e = DATA.EXPL[c.expl] || DATA.ROLES[c.expl]; if (!e) throw new Error('unknown expl ' + c.expl);
      c.explTitle = c.explTitle || (DATA.EXPL[c.expl] ? e[0] : e[2]); c.explParas = c.explParas || (DATA.EXPL[c.expl] ? e[1] : e[3]);
      c.onet = c.onet || DATA.ONET[c.expl]; }
    ['label', 'noun', 'intro', 'explTitle'].forEach(function (k) { if (!c[k]) throw new Error(job.rid + ' copy missing ' + k); });
    if (!(c.own && c.own.length >= 4 && c.look && c.look.length >= 4 && c.explParas && c.explParas.length >= 2)) throw new Error(job.rid + ' copy lists too short');
    var title = job.role + ', ' + c.label + ', ' + p[0];
    var slug = slugify(title), base = slug, n = 1;
    while (taken[slug]) { slug = base + '-' + n; n++; }
    var pos = encodeURIComponent(job.role + ' - ' + job.metro + ' [' + job.rid + ']');
    var intro = c.intro.replace(/\s+$/, '') + " Gravity Talent Partners is running this search confidentially on the company's behalf.";
    var html = [PS + esc(intro) + '</p>', H2 + 'What You Will Own</h2>',
      '<ul data-rte-list="default">' + c.own.map(function (x) { return '<li>' + PS + esc(x) + '</p></li>'; }).join('') + '</ul>',
      H2 + 'What We Are Looking For</h2>',
      '<ul data-rte-list="default">' + c.look.map(function (x) { return '<li>' + PS + esc(x) + '</p></li>'; }).join('') + '</ul>',
      H2 + 'Compensation</h2>', PS + esc(job.comp + ', full time.') + '</p>', H2 + 'How to Apply</h2>',
      PS + 'Apply below and your information comes straight to our team. A Gravity Talent Partners recruiter reviews every application and will reach out if your background is a fit. This search is confidential.</p>',
      PS + '<a href="' + FORM + pos + '">Apply for this role</a></p>', H2 + esc(c.explTitle) + '</h2>']
      .concat(c.explParas.map(function (x) { return PS + esc(x) + '</p>'; }))
      .concat([PS + 'Browse all <a href="/hospitality-jobs">open hospitality jobs</a>, or if you are hiring, see <a href="/how-we-work">how we work</a>.</p>']).join('');
    var pr = pay(job.comp);
    var entry = {role: job.role, metro: job.metro, tags: job.tags, comp: job.comp, ref: job.rid, date: today(),
      onet: c.onet || '11-1021.00 General and Operations Managers'};
    if (pr) { entry.max = pr[1]; if (pr[0]) entry.min = pr[0]; } else entry.nosal = true;
    if (p[2]) entry.city = p[2];
    if (p[3]) entry.st = p[3];
    if (/remote/i.test(job.metro)) entry.remote = true;
    var seoDesc = job.role + ' for ' + art(c.noun) + ' ' + c.noun + ' in ' + p[0] + '. ' + job.comp + '. Confidential search by Gravity Talent Partners.';
    var excerpt = PS + esc(c.label + ', ' + p[0] + '. ' + job.comp + '.') + '</p>';
    var blob = [title, html, seoDesc, excerpt].join(' ');
    var hits = LEAK.filter(function (b) { return blob.toLowerCase().indexOf(b) > -1; });
    if (hits.length) throw new Error(job.rid + ' client name in copy: ' + hits.join(', '));
    if (!dashFree(blob)) throw new Error(job.rid + ' dash punctuation in copy');
    return {rid: job.rid, title: title, slug: slug, html: html, entry: entry, excerpt: excerpt,
      seoTitle: job.role + ' Job, ' + p[0] + ' | Gravity Talent Partners', seoDesc: seoDesc};
  }

  async function settings() { return getJSON('/api/commondata/GetCollectionSettings?collectionId=' + COLL); }
  function readMap(code) {
    var i = code.indexOf('  var jobs = {'), e = code.indexOf('\n  };', i);
    if (i < 0 || e < 0) throw new Error('job map not found in header injection');
    return {map: JSON.parse(code.slice(i + 13, e + 4)), start: i + 13, end: e + 4};
  }
  function writeMap(code, rm, map) {
    var body = '{\n' + Object.keys(map).map(function (k) { return JSON.stringify(k) + ':' + JSON.stringify(map[k]); }).join(',\n') + '\n  }';
    var out = code.slice(0, rm.start) + body + code.slice(rm.end);
    readMap(out);
    (out.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g) || []).forEach(function (s) { new Function(s.replace(/^<script[^>]*>|<\/script>$/g, '')); });
    return out;
  }
  async function items() {
    var all = [], start = null;
    for (var g = 0; g < 20; g++) {
      var j = await getJSON('/api/content-collections/' + COLL + '/content-items?limit=100' + (start ? '&start=' + start : ''));
      all = all.concat(j.results); if (!j.hasNextPage) break; start = j.nextPageStart;
    }
    var seen = {}; return all.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
  }

  async function plan() {
    var feed = await fetch(FEED + '?x=' + Date.now(), {cache: 'no-store'}).then(function (r) { return r.json(); });
    var st = await settings(), rm = readMap(st.headerInjectCode), map = rm.map;
    var its = await items(), byPath = {};
    its.forEach(function (x) { byPath[x.fullUrl] = x; });
    var refs = {}; Object.keys(map).forEach(function (p) { refs[map[p].ref] = p; });
    var live = {}; feed.jobs.forEach(function (j) { live[j.rid] = j; });
    var missing = feed.jobs.filter(function (j) { return !refs[j.rid]; });
    var stale = Object.keys(map).filter(function (p) { return !live[map[p].ref]; })
      .map(function (p) { var it = byPath[p]; return {ref: map[p].ref, path: p, role: map[p].role, metro: map[p].metro, postId: it ? it.id : null, published: it ? it.workflowState === 1 : false}; });
    var sync = feed.jobs.filter(function (j) { var p = refs[j.rid]; return p && (map[p].comp !== j.comp || map[p].metro !== j.metro); })
      .map(function (j) { var p = refs[j.rid]; return {rid: j.rid, path: p, comp: [map[p].comp, j.comp], metro: [map[p].metro, j.metro]}; });
    var needsCopy = missing.filter(function (j) { return !template(j); })
      .map(function (j) { return {rid: j.rid, role: j.role, metro: j.metro, comp: j.comp, tags: j.tags, desc: j.desc}; });
    var ageDays = (Date.now() - Date.parse(feed.generated)) / 864e5;
    var abort = null;
    if (!feed.jobs || feed.jobs.length < 50) abort = 'feed has only ' + (feed.jobs || []).length + ' jobs';
    else if (stale.length > 0.3 * Object.keys(map).length) abort = stale.length + ' of ' + Object.keys(map).length + ' pages would come down at once';
    return {feedGenerated: feed.generated, feedAgeDays: Math.round(ageDays * 10) / 10, boardJobs: feed.jobs.length,
      pages: Object.keys(map).length, missing: missing.map(function (j) { return {rid: j.rid, role: j.role, metro: j.metro, auto: !!template(j)}; }),
      needsCopy: needsCopy, stale: stale, sync: sync, abort: abort};
  }

  async function preview(rid, copy) {
    var feed = await fetch(FEED + '?x=' + Date.now(), {cache: 'no-store'}).then(function (r) { return r.json(); });
    var job = feed.jobs.filter(function (j) { return j.rid === rid; })[0];
    if (!job) throw new Error(rid + ' not on the board');
    var c = copy || template(job); if (!c) throw new Error(rid + ' needs copy');
    return makePage(job, c, {});
  }

  async function run(opts) {
    opts = opts || {};
    var copy = opts.copy || {}, dry = !!opts.dryRun;
    var pl = await plan();
    if (pl.abort && !opts.force) return {aborted: pl.abort, plan: pl};
    var feed = await fetch(FEED + '?x=' + Date.now(), {cache: 'no-store'}).then(function (r) { return r.json(); });
    var live = {}; feed.jobs.forEach(function (j) { live[j.rid] = j; });
    var its = await items(), taken = {};
    its.forEach(function (x) { taken[x.urlId] = 1; });
    var tmplItem = its.filter(function (x) { return x.workflowState === 1; })[0];
    var tmpl = await getJSON(POSTS + '/' + tmplItem.id);
    var built = [], skipped = [], errors = [], down = [], synced = [];
    var pages = [];
    pl.missing.forEach(function (m) {
      var job = live[m.rid], c = copy[m.rid] || template(job);
      if (!c) { skipped.push({rid: m.rid, role: job.role, metro: job.metro, reason: 'no template and no copy given'}); return; }
      try { var pg = makePage(job, c, taken); taken[pg.slug] = 1; pages.push(pg); } catch (e) { errors.push({rid: m.rid, error: String(e.message || e)}); }
    });
    if (dry) return {dryRun: true, plan: pl, wouldBuild: pages.map(function (p) { return {rid: p.rid, title: p.title, slug: p.slug}; }), skipped: skipped, errors: errors};

    // 1. create posts
    for (var i = 0; i < pages.length; i++) {
      var pg = pages[i], post = JSON.parse(JSON.stringify(tmpl));
      ['id', 'assetUrl', 'fullUrl', 'addedOn', 'updatedOn', 'publishOn', 'shareStates', 'pushedServices', 'pendingPushedServices', 'commentCount'].forEach(function (k) { delete post[k]; });
      post.title = pg.title; post.urlId = pg.slug; post.workflowState = 1; post.publishOn = Date.now();
      post.excerpt = {html: pg.excerpt, raw: false};
      post.seoData = {seoTitle: pg.seoTitle, seoDescription: pg.seoDesc, seoHidden: false};
      var blk = post.body.layout.rows[0].columns[0].blocks[0];
      blk.id = Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(10)), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      blk.value.html = pg.html;
      try {
        var r = await fetch(POSTS, {method: 'POST', credentials: 'include', headers: hdr(), body: JSON.stringify(post)});
        var j = await r.json();
        if (!r.ok || !j.fullUrl) throw new Error('status ' + r.status);
        pg.path = j.fullUrl; built.push({rid: pg.rid, title: pg.title, path: j.fullUrl});
      } catch (e) { errors.push({rid: pg.rid, error: 'create failed: ' + (e.message || e)}); }
    }

    // 2. take down stale pages (draft) and collect redirects
    var redirectPaths = [];
    for (var s = 0; s < pl.stale.length; s++) {
      var x = pl.stale[s];
      try {
        if (x.postId && x.published) {
          var u = POSTS + '/' + x.postId, p2 = await getJSON(u);
          p2.workflowState = 4;
          var r2 = await fetch(u, {method: 'PUT', credentials: 'include', headers: hdr(), body: JSON.stringify(p2)});
          if (!r2.ok) throw new Error('status ' + r2.status);
        }
        redirectPaths.push(x.path); down.push({ref: x.ref, role: x.role, metro: x.metro, path: x.path});
      } catch (e) { errors.push({rid: x.ref, error: 'take down failed: ' + (e.message || e)}); }
    }

    // 3. sync pay and metro on existing pages
    for (var q = 0; q < pl.sync.length; q++) {
      var sy = pl.sync[q];
      try {
        var it = its.filter(function (z) { return z.fullUrl === sy.path; })[0];
        if (it && sy.comp[0] !== sy.comp[1]) {
          var u3 = POSTS + '/' + it.id, p3 = await getJSON(u3), b3 = p3.body.layout.rows[0].columns[0].blocks[0];
          var oldP = PS + esc(sy.comp[0] + ', full time.') + '</p>';
          if (b3.value && b3.value.html && b3.value.html.indexOf(oldP) > -1) {
            b3.value.html = b3.value.html.replace(oldP, PS + esc(sy.comp[1] + ', full time.') + '</p>');
            var r3 = await fetch(u3, {method: 'PUT', credentials: 'include', headers: hdr(), body: JSON.stringify(p3)});
            if (!r3.ok) throw new Error('status ' + r3.status);
          }
        }
        synced.push(sy);
      } catch (e) { errors.push({rid: sy.rid, error: 'sync failed: ' + (e.message || e)}); }
    }

    // 4. one write to the header injection map
    var st = await settings(), rm = readMap(st.headerInjectCode), map = rm.map;
    built.forEach(function (b) { var pg = pages.filter(function (p) { return p.rid === b.rid; })[0]; map[b.path] = pg.entry; });
    down.forEach(function (d) { delete map[d.path]; });
    synced.forEach(function (sy) {
      var e = map[sy.path]; if (!e) return; var j = live[sy.rid];
      e.comp = j.comp; e.metro = j.metro; var pr = pay(j.comp);
      if (pr) { e.max = pr[1]; if (pr[0]) e.min = pr[0]; else delete e.min; delete e.nosal; } else { delete e.max; delete e.min; e.nosal = true; }
      var pl2 = place(j.metro); if (pl2[2]) e.city = pl2[2]; else delete e.city; if (pl2[3]) e.st = pl2[3]; else delete e.st;
    });
    if (built.length || down.length || synced.length) {
      st.headerInjectCode = writeMap(st.headerInjectCode, rm, map);
      st.collectionId = COLL; st.password = '';
      var r4 = await fetch('/api/commondata/SaveCollectionSettings', {method: 'POST', credentials: 'include', headers: hdr('application/json; charset=UTF-8'), body: JSON.stringify({collectionData: st, memberAreaData: {}})});
      if (!r4.ok) errors.push({error: 'map save failed: status ' + r4.status});
      var check = readMap((await settings()).headerInjectCode).map, missed = [];
      built.forEach(function (b) { if (!check[b.path]) missed.push(b.path); });
      down.forEach(function (d) { if (check[d.path]) missed.push(d.path); });
      if (missed.length) errors.push({error: 'job page map did not save for ' + missed.join(', ')});
    }

    // 5. redirects for pages that came down
    if (redirectPaths.length) {
      var cur = (await getJSON('/api/config/GetAdvancedSettings')).mappings || '';
      var have = {}; cur.split('\n').forEach(function (l) { have[l.split(' ->')[0].trim()] = 1; });
      var add = redirectPaths.filter(function (p) { return !have[p]; }).map(function (p) { return p + ' -> /hospitality-jobs 301'; });
      if (add.length) {
        var next = cur.replace(/\s+$/, '') + '\n' + add.join('\n');
        var r5 = await fetch('/api/config/SaveAdvancedSettings', {method: 'POST', credentials: 'include', headers: hdr('application/x-www-form-urlencoded; charset=UTF-8'), body: 'mappings=' + encodeURIComponent(next)});
        if (!r5.ok) errors.push({error: 'redirect save failed: status ' + r5.status});
      }
    }
    return {built: built, takenDown: down, synced: synced, skipped: skipped, errors: errors};
  }

  async function verify() {
    var feed = await fetch(FEED + '?x=' + Date.now(), {cache: 'no-store'}).then(function (r) { return r.json(); });
    var st = await settings(), map = readMap(st.headerInjectCode).map, refs = {};
    Object.keys(map).forEach(function (p) { refs[map[p].ref] = p; });
    var noPage = feed.jobs.filter(function (j) { return !refs[j.rid]; }).map(function (j) { return j.rid; });
    var paths = feed.jobs.filter(function (j) { return refs[j.rid]; }).map(function (j) { return refs[j.rid]; });
    var bad = [];
    for (var i = 0; i < paths.length; i += 15) {
      var res = await Promise.all(paths.slice(i, i + 15).map(function (p) {
        return fetch(p + '?x=' + Date.now(), {cache: 'no-store', redirect: 'manual'}).then(function (r) { return [p, r.type === 'opaqueredirect' ? 'redirect' : r.status]; }).catch(function (e) { return [p, 'error']; });
      }));
      res.forEach(function (x) { if (x[1] !== 200) bad.push(x); });
    }
    return {boardJobs: feed.jobs.length, withPage: paths.length, noPage: noPage, badLinks: bad};
  }

  window.GTPB = {plan: plan, preview: preview, run: run, verify: verify, EXPL: DATA.EXPL, ROLES: Object.keys(DATA.ROLES), CONCEPTS: Object.keys(DATA.CONCEPTS), makePage: makePage, template: template, place: place};
})();
