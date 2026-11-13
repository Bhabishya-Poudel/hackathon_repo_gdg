# Grant leads (NOT in the database)

Research recorded 2026-10-22 from third-party grant listing screenshots. IDs refer to the original listings.
**All leads are unverified.** Inclusion in `seed_grants.json` requires confirmation of the official URL,
amount, deadline, and eligibility against the funder’s published requirements (see "Status" below).

Triage legend:
- **A** = a specific, named program worth verifying now.
- **B** = an official agency page or program *list*, not one grant. Requires individual program review before ingestion.
- **C** = funder not identified or not verified. Skip.
- **D** = skip: closed, a loan, outside the US, research or organizations only, or a duplicate.

## A. Named programs to verify (claims as pasted, unverified)

| ID | Program | Pasted claim |
|---|---|---|
| 74001 | National Trust, Preserve Route 66 Legacy Business Grant Fund | $5,000 to $10,000, deadline Nov 12, 2026 |
| 55991 | Coalition to Back Black Businesses (U.S. Chamber Foundation) | $25,000 enhancement grants; may be only an announcement, not an open application |
| 21609 | Niagara Falls NY, Small Business Property Improvement Program | up to $100,000 |
| 67589 | Rooted Philanthropic (Saint Paul, MN, East Side) | entrepreneurship, education, wellness |
| 67025 | Latino Restaurant Association restaurant grant (SoCalGas) | for Latino restaurants; opening date TBD |
| 76425 | Montgomery, Alabama, Thriving Small Business Grant Program | business sustainability and job creation |
| 5610 | Live Music Society, Toolbox Grant | venue improvements up to $10,000 (screenshot said $50,000) |
| 67494 | Live Music Society, Music in Action Grant | listing said $50,000 |
| 13309 | Community Food Bank of Southern Arizona, Thriving Communities Grant | food security, southern Arizona |
| 76265 | LIAACC and Trellus, Delivery & Marketing Grant | up to $2,500, Suffolk County NY, minority-owned |
| 686 | Erie County NY, Storefront Revitalization Grants | small businesses and nonprofits |
| 72144 | California Dept of Food and Agriculture, Farm to Community Food Hubs | food hubs |
| 56029, 74067 | Wish Local Empowerment Program | $500 to $2,000 for Black-owned small businesses |
| 76126, 73081 | Santander, Cultivate Small Business (ICIC delivers) | culinary/food entrepreneurs; current amounts may differ |
| 76129 | Secretsos Foundation, Small Business Grant | $2,500, quarterly |
| 75920 | Hidden Star / Galaxy of Stars, Galaxy Grants | women and minority entrepreneurs; amounts vary |
| 75423 | Freed Fellowship | $500 monthly plus consideration for $2,500 year-end |
| 75314 | Detroit Economic Growth Corp, Motor City Match | Detroit small businesses |
| 74523 | IndieSpace, Mental Health Grants (NYC) | artist wellness; $10,000 unverified |
| 19641 | Seattle Restored / Shunpike | $3,500 artist residency part |
| 55598 | NAACP and BACARDI, Backing the B.A.R. | Black-owned bars and restaurants |
| 56019 | LegalZoom / NBA, Fast Break for Small Business | $10,000 plus $500 in services, minority-owned |
| 72745 | Jefferson County, Indiana, Small Business Grant Program | $6,000 |
| 73780 | Fifteen Percent Pledge, Achievement Award | $200,000, Black-owned |
| 73025 | Black Ambition | up to $1 million, underrepresented founders |
| 70606 | Prosper Portland, Prosperity Investment Program | building improvements; matching percentages differ |
| 70659, 67348, 67039 | Pennsylvania Creative Entrepreneur Accelerator Program (one program, three listings) | $2,000, creative entrepreneurs |
| 67540 | Kentucky State University, Small-Scale Farm Grant Program | $10,000 |
| 65066 | The Boston Foundation, Latino Equity Fund | Latino communities |
| 8 (second list) | Women Who Tech, Grants Program | equity-free grants for women-led tech startups; page describes earlier cycles |
| 9 (second list) | NourishMD, Maryland DHCD | $25,000 to $150,000 for food retailers, deadline Nov 2, 2026 |
| 12 (second list) | Minnesota Dept of Agriculture, AGRI Livestock Investment Grant | $400 to $25,000, deadline Nov 17, 2026 |
| 69193 | California Fish and Wildlife, Wolf-Livestock Compensation Grants | niche (livestock producers) |

## B. Official agency pages or program lists (not a single grant)

National Trust for Historic Preservation (43924), MassCEC funding list (63497, 63486), Pennsylvania DCED (21365, 13624,
6291) and PA grant finder (list 2 #7), New Jersey state grants (63252, list 2 #1), Vermont Agency of Agriculture (78937,
list 2 #3), Illinois DCEO (56512, 74018, list 2 #11), D.C. DMPED (1214), Nevada Dept of Agriculture (3306), Nebraska DED
(3157), Idaho Commerce Rural Economic Development Professional Grant (1061), NC DEQ (2391), USDA NRCS Conservation
Innovation Grants (1998), USDA Rural Development (3483, 56623, 900, 72173), Minnesota Dept of Health rural health (74855),
Wyoming Business Council (9864), Virginia Dept of Small Business (list 2 #6), US DOE funding (list 2 #4), USDA Community
Food Projects (list 2 #2), Greater Sarasota Chamber of Commerce (57327), City of Savannah Community Partnership Program
(149, nonprofits), MIT Solve (1704), Recycling Partnership (73415), Pop Culture Collaborative (71992), Borealis
Philanthropy (12041).

## C. Funder not identified or not verified (skip)

6170, 541, 56982, 60470, 6320, 352, 66059, 8692, 63869, 13356, 13460, 18416, 55988, 70510, 70285, 6998 (Main Street
Ventures, no current page), list 2 #10 (generic Grants.gov title).

## D. Skip

- **Outside the US:** Cassels Black-Owned Business Grant (74159, Canada, closed Oct 16), Northern Ontario Heritage Fund
  (17223), Indigenous Screen Office (74707), Vancity (17332), Kakivak Association (17443).
- **Closed:** Kirabo Grant (73992, applications closed), Beyond Open (56034, final round concluded), Miami Foundation
  Community Grants (12938, nonprofits, cycle closed).
- **Loans, not grants:** New Hampshire Community Loan Fund (76514).
- **Research or institutions only:** NIH SEPA (14022), Northeast SARE research (65734), NSF SBIR/STTR Phase II (list 2
  #5, prior awardees only).
- **Not for businesses:** East Tennessee Foundation scholarship (316).

## Status (updated 2026-10-22)

Group A was checked against official pages. **8 were added to `data/seed_grants.json`** (verified on the funder's page):
Galaxy Grants, Freed Fellowship, Secretsos Small Business Grant, NourishMD (MD), Preserve Route 66 Legacy Business Grant
Fund, AGRI Livestock Investment Grant (MN), Prosper Portland Prosperity Investment Program (OR), Seattle Restored
Pop-Up Program (WA, marked `forecasted`: applications open Oct 28).

**Checked and NOT added**
- **Closed or inactive:** Coalition to Back Black Businesses (no longer active), Black Ambition Prize (closed, none in 2026),
  Fifteen Percent Pledge Achievement Award (no 2026 cycle shown), NAACP x BACARDI Backing the B.A.R. (2024 round only),
  LegalZoom/NBA Fast Break (ended 2024), Wish Local Empowerment (2020 program), Live Music Society Toolbox (closed Sept 16,
  2026) and Music in Action (closed Mar 12, 2026), Pennsylvania Creative Entrepreneur Accelerator (closed May 22, 2026;
  five Philadelphia-area counties only), Women Who Tech (dormant, 2022-2023 cycles), Erie County Storefront (funding
  allocated, not accepting applications), Jefferson County IN (closed April 2025), Detroit Motor City Match (Round 33
  closed Oct 1, 2026), CDFA Food Hubs (closed Apr 2025, no new round), Latino Restaurant Association (deadline TBD).
- **Not for small businesses (nonprofit-only):** Boston Foundation Latino Equity Fund ($50,000, MA, closes "October 30",
  year not stated), Community Food Bank of Southern Arizona Thriving Communities Grant (up to $20,000, AZ, window
  to the second Wednesday of December).
- **Unclear status, could not confirm:** Niagara Falls Small Business Property Improvement Program (up to $100,000 as
  50% of costs; open/closed not stated), LIAACC/Trellus Delivery & Marketing (up to $2,500, a delivery credit for
  Suffolk County NY chamber members; status unclear), Montgomery AL Thriving Small Business Grant (page would not
  load; a snippet suggests the window closed June 2026), Santander Cultivate Small Business (food accelerator,
  grants of at least $2,500 per graduate, next window about Nov to Jan), Kentucky State University Small-Scale Farm
  Grant (max $5,000 per application, $10,000 lifetime, next listed deadline Dec 1, state not stated), Rooted
  Philanthropic (mostly by invitation), IndieSpace Mental Health Grant ($500 monthly lottery, NYC performing artists).

**Wrong claims caught in the original list:** Erie County does not state nonprofits are eligible; the Jefferson County
$6,000 figure was not on the official page; IndieSpace awards $500 (not $10,000); Seattle Restored has no $3,500
residency component and the Shunpike link is not on its site; Black Ambition's "$1M" is a grand prize, not a typical
grant; Fifteen Percent Pledge's $200,000 is a single top prize; the Boston Foundation grant is for nonprofits.

**Second list (The Grant Portal table, 87 rows) imported as unverified listings, 2026-10-22.** At the team's request all
rows were added to `data/listed_grants.json` (loaded with source `listing`) using the table's own title, amount,
deadline, provider and link, even where the program may be closed or mislabeled. These have no eligibility text, so the
reply shows "View more details: <link>" in place of "Who can apply" and "Apply". Notes:
- The Grant Portal's detail pages are behind a paywall and did not name the funder, so the table's "Provider / Program"
  and "Direct Website URL" columns were filled in by something else and are unreliable. Cross-checks found at least
  six wrong: 70606 is Prosper Portland (not "Main Street America"), 21609 is the Niagara Falls program (not HUD CDBG),
  70659 and 67348/67039 are the Pennsylvania Creative Entrepreneur Accelerator (not Freed Fellowship or America's SBDC),
  and 316 and 6170 conflict with earlier findings.
- **Skipped (3):** 70606 and 70659 (duplicates of verified entries already in the seed file) and 67039 (duplicate of 67348).
- **Corrected from our own checks:** 21609 now points to the Niagara Falls program on esd.ny.gov (NY, up to $100,000);
  67348 now points to philaculture.org/CEA (PA, closed May 22, 2026).
- **Marked closed (hidden from users):** 1975 Coalition to Back Black Businesses (no longer active), 67348 (closed),
  67494 Live Music Society (2026 windows closed).
- **State limits** were added only where the title or provider names a state (CA, OR, MN, AL, AR, CO, MI, LA, MA, PA, KY,
  the Northeast SARE region, and British Columbia, which never matches a US user).
- Many rows are not for small businesses (research, nonprofits, government, scholarships, outside the US). They are in
  the database but should rarely match.

Group B entries require individual program review before ingestion.
