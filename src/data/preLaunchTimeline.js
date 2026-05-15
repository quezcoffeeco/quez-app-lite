// ============================================================
// QUEZ APP LITE — Pre-Launch Master Timeline
// Source: I-02_Pre-Launch-Master-Timeline_v1.0 (May 2026 → Soft Open Feb 2027)
// Transcribed verbatim from the OneDrive doc. Task IDs are stable —
// progress in localStorage is keyed by id, so DON'T renumber after release.
// To add new tasks, append a new id at the end of its section. To remove
// a task from the data, leave the id and add `retired: true` so old
// progress entries are ignored without orphaning data.
//
// targetDate (YYYY-MM-DD) is the "ahead-or-behind" anchor. For month-
// labeled tasks the target is the LAST day of that month (so completing
// any time in that month counts as on-time). For specific-date tasks
// (Jul 15 / Feb 1 / Mar 10 / Apr 30 / Aug 1) the target is that date.
// ============================================================

export const PHASES = [
  {
    id: 'phase_pre_separation',
    title: 'Now – May 2026',
    subtitle: 'Pre-Separation Actions — Do Before ETS',
    tasks: [
      { id: 'pl_p1_01', when: 'Now',      targetDate: '2026-05-31', category: 'VA / Benefits',  text: 'File VA disability claim — the earlier you file, the earlier benefits begin. Do not wait until ETS.' },
      { id: 'pl_p1_02', when: 'Now',      targetDate: '2026-05-31', category: 'VA / Benefits',  text: 'File GI Bill transfer to dependents while still on active duty — cannot be done after ETS.' },
      { id: 'pl_p1_03', when: 'Now',      targetDate: '2026-05-31', category: 'Regulatory',     text: 'Call Pottawattamie County Environmental Health AND Iowa DIAL Food Plan Review (515.350.7587) — confirm mobile food unit classification for a coffee-only trailer. This call gates your entire trailer build spec.' },
      { id: 'pl_p1_04', when: 'Now',      targetDate: '2026-05-31', category: 'Regulatory',     text: 'Ask DIAL: hood type required (Type I, Type II, or exhaust fan only) for steaming milk with no open flame cooking.' },
      { id: 'pl_p1_05', when: 'Now',      targetDate: '2026-05-31', category: 'Regulatory',     text: 'Ask DIAL: minimum fresh water tank capacity and water heater rating for your unit class.' },
      { id: 'pl_p1_06', when: 'Now',      targetDate: '2026-05-31', category: 'Research',       text: 'Visit 3–5 coffee operations in Omaha / Council Bluffs. Note build details, equipment brands, service window layout.' },
      { id: 'pl_p1_07', when: 'Now',      targetDate: '2026-05-31', category: 'Social',         text: 'Create @QuezcoffeeIA on TikTok, Instagram, and \'Quez Coffee – Council Bluffs\' on Facebook. Start posting immediately — the build is content.' },
      { id: 'pl_p1_08', when: 'Now',      targetDate: '2026-05-31', category: 'Research',       text: 'Get 3 used trailer shell quotes from dealers or private sellers. Target $8,000–$10,000 range.' },
      { id: 'pl_p1_09', when: 'Now',      targetDate: '2026-05-31', category: 'Financial',      text: 'Begin assembling SBA loan application documents: personal tax returns (2 years), pay stubs, personal financial statement (SBA Form 413), business plan.' },
      { id: 'pl_p1_10', when: 'May 2026', targetDate: '2026-05-31', category: 'Military',       text: 'Submit CSP (Capstone / Transition) paperwork the day TAP completes.' },
      { id: 'pl_p1_11', when: 'May 2026', targetDate: '2026-05-31', category: 'Reserves',       text: 'Confirm Army Reserves unit near Council Bluffs — unit assignment must be confirmed for Reserves pay and TRICARE Reserve Select to activate post-ETS.' },
    ],
  },
  {
    id: 'phase_entity_formation',
    title: 'June 2026',
    subtitle: 'Entity Formation & Financial Foundation',
    tasks: [
      { id: 'pl_p2_01', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Legal',     text: 'Form Quez Coffee Co. LLC in Iowa — sos.iowa.gov. Cost: ~$50. Business name must match what you want on licenses, tax accounts, and loan documents.' },
      { id: 'pl_p2_02', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Legal',     text: 'Get EIN (Federal Employer Identification Number) — IRS.gov, free, instant online. Do this the same day you form the LLC.' },
      { id: 'pl_p2_03', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Financial', text: 'Open dedicated business checking account — use EIN, not SSN. Do not commingle personal and business funds from Day 1.' },
      { id: 'pl_p2_04', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Tax',       text: 'Apply for Iowa Sales Tax Permit — Iowa Dept of Revenue, tax.iowa.gov. Free. Required before first sale.' },
      { id: 'pl_p2_05', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Financial', text: 'Deposit $10,000 owner equity injection into business checking account. This confirms equity for the SBA loan application.' },
      { id: 'pl_p2_06', when: 'Jun 2026', targetDate: '2026-06-30', category: 'Financial', text: 'Apply for business credit card in the LLC name. Used for equipment purchases, supplies — not personal expenses.' },
      { id: 'pl_p2_07', when: 'Jun 2026', targetDate: '2026-06-30', category: 'SBA Loan',  text: 'Begin formal SBA Veterans Advantage Loan application with SBDC advisor. Target: application submitted by July 15.' },
      { id: 'pl_p2_08', when: 'Jun 2026', targetDate: '2026-06-30', category: 'SBDC',      text: 'Schedule first meeting with Iowa SBDC advisor. Bring business plan v3.0, personal financial statement, and equity confirmation.' },
    ],
  },
  {
    id: 'phase_loan_location',
    title: 'Jul – Aug 2026',
    subtitle: 'Loan Application & Location Confirmation',
    tasks: [
      { id: 'pl_p3_01', when: 'Jul 15, 2026', targetDate: '2026-07-15', category: 'SBA Loan',   text: 'Submit SBA Veterans Advantage Loan application — $45,000 at 6.5% / 7 years, 9-month deferment requested. Target approval by September.' },
      { id: 'pl_p3_02', when: 'Jul 2026',     targetDate: '2026-07-31', category: 'Location',   text: 'Confirm primary soft-open lot at 35th & Broadway in writing. Signed B-01 or B-02 lot agreement on file.' },
      { id: 'pl_p3_03', when: 'Jul 2026',     targetDate: '2026-07-31', category: 'Research',   text: 'Identify 2–3 additional rotation locations for Year 1. Initiate lot agreement conversations.' },
      { id: 'pl_p3_04', when: 'Jul 2026',     targetDate: '2026-07-31', category: 'Military',   text: 'Submit PTDY request for September family relocation (if eligible).' },
      { id: 'pl_p3_05', when: 'Jul 2026',     targetDate: '2026-07-31', category: 'Regulatory', text: 'Research Iowa veteran small business grants — Iowa Economic Development Authority, IADVA, local community foundations.' },
      { id: 'pl_p3_06', when: 'Aug 2026',     targetDate: '2026-08-31', category: 'Relocation', text: 'Family relocation to Council Bluffs completes. House purchase closes.' },
      { id: 'pl_p3_07', when: 'Aug 2026',     targetDate: '2026-08-31', category: 'Financial',  text: 'Rental property — issue tenant 30-day written notice of rent increase if applicable. File all landlord paperwork through proper Iowa channels.' },
      { id: 'pl_p3_08', when: 'Aug 2026',     targetDate: '2026-08-31', category: 'Equipment',  text: 'Get final quotes on espresso machines, grinder, ice machine, refrigeration, blender, water heater. Compare NSF-certified models.' },
    ],
  },
  {
    id: 'phase_regulatory_build_prep',
    title: 'Sep – Oct 2026',
    subtitle: 'Regulatory Submissions & Build Prep',
    tasks: [
      { id: 'pl_p4_01', when: 'Sep 2026', targetDate: '2026-09-30', category: 'Loan',       text: 'SBA loan approval target. Funds targeted for November disbursement.' },
      { id: 'pl_p4_02', when: 'Sep 2026', targetDate: '2026-09-30', category: 'Regulatory', text: 'Submit Iowa DIAL Food Plan Review package — floor plan, equipment schedule, plumbing/mechanical schematics, menu, SOPs. Use D-01 checklist before submission.' },
      { id: 'pl_p4_03', when: 'Sep 2026', targetDate: '2026-09-30', category: 'Licensing',  text: 'Apply for CFPM (Certified Food Protection Manager) certification — ServSafe Manager or Prometric. Both operators. ~$200/person. Required before physical inspection.' },
      { id: 'pl_p4_04', when: 'Sep 2026', targetDate: '2026-09-30', category: 'Insurance',  text: 'Get quotes for general liability insurance — $1M per occurrence minimum. Bind policy before permit inspection.' },
      { id: 'pl_p4_05', when: 'Sep 2026', targetDate: '2026-09-30', category: 'Trailer',    text: 'Purchase trailer shell. Document purchase with bill of sale. Photograph pre-build condition.' },
      { id: 'pl_p4_06', when: 'Oct 2026', targetDate: '2026-10-31', category: 'Regulatory', text: 'DIAL plan review response — expect 3–4 weeks from submission. Address any comments immediately. Incomplete submissions restart the clock.' },
      { id: 'pl_p4_07', when: 'Oct 2026', targetDate: '2026-10-31', category: 'Equipment',  text: 'Order all equipment. Confirm NSF/ANSI certifications on all food-contact equipment before ordering.' },
      { id: 'pl_p4_08', when: 'Oct 2026', targetDate: '2026-10-31', category: 'Legal',      text: 'Confirm Iowa DIAL plan review approval before construction starts. Do not build before approval.' },
    ],
  },
  {
    id: 'phase_build_install_social',
    title: 'Nov – Dec 2026',
    subtitle: 'Build, Install, & Social Launch',
    tasks: [
      { id: 'pl_p5_01', when: 'Nov 2026', targetDate: '2026-11-30', category: 'Financial',  text: 'SBA loan funds disbursed. Deposit into business checking. Begin tracking all pre-opening expenses in QuickBooks.' },
      { id: 'pl_p5_02', when: 'Nov 2026', targetDate: '2026-11-30', category: 'Build',      text: 'Trailer build begins. Owner leads — licensed electrical and plumbing contractors for permit-required work only.' },
      { id: 'pl_p5_03', when: 'Nov 2026', targetDate: '2026-11-30', category: 'Equipment',  text: 'Equipment arrives. Photograph serial numbers. Register warranties. File manuals in I-01 Equipment Binder.' },
      { id: 'pl_p5_04', when: 'Nov 2026', targetDate: '2026-11-30', category: 'Equipment',  text: 'Equipment installed per Iowa DIAL-approved plans. No deviations from approved layout without re-submission.' },
      { id: 'pl_p5_05', when: 'Nov 2026', targetDate: '2026-11-30', category: 'Social',     text: 'TikTok: daily build documentation posts. Show every major step — wiring, plumbing, equipment install. This is your pre-launch audience.' },
      { id: 'pl_p5_06', when: 'Dec 2026', targetDate: '2026-12-31', category: 'Build',      text: 'Trailer build complete. Owner walk-through and self-inspection using D-01 checklist. Every Priority (P) and Priority Foundation (Pf) item must pass.' },
      { id: 'pl_p5_07', when: 'Dec 2026', targetDate: '2026-12-31', category: 'Regulatory', text: 'Schedule Iowa DIAL physical inspection. Do NOT schedule until all D-01 checklist items pass.' },
      { id: 'pl_p5_08', when: 'Dec 2026', targetDate: '2026-12-31', category: 'Regulatory', text: 'Council Bluffs Mobile Food Vendor Permit application submitted to CB Parks & Recreation — (712) 890-5291. Requires Iowa DIAL license first.' },
      { id: 'pl_p5_09', when: 'Dec 2026', targetDate: '2026-12-31', category: 'Regulatory', text: 'Fire Marshal inspection — CB Parks & Rec triggers this after vendor permit application. Have extinguisher, generator, and LP lines ready.' },
      { id: 'pl_p5_10', when: 'Dec 2026', targetDate: '2026-12-31', category: 'QuickBooks', text: 'QuickBooks Online + QuickBooks Intuit POS configured. Iowa sales tax rate 7% set. Chart of accounts established. First test transaction run.' },
      { id: 'pl_p5_11', when: 'Dec 2026', targetDate: '2026-12-31', category: 'Social',     text: 'TikTok/Instagram: 500+ followers target by December 31. If behind, increase posting frequency — daily minimum.' },
    ],
  },
  {
    id: 'phase_final_prep',
    title: 'January 2027',
    subtitle: 'Final Prep — 30 Days to Soft Open',
    tasks: [
      { id: 'pl_p6_01', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Licensing',  text: 'Iowa DIAL Annual Mobile Food Unit License in hand. Council Bluffs vendor permit in hand. General liability insurance COI on file.' },
      { id: 'pl_p6_02', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Operations', text: 'Full menu test run — all 15 drinks built to Recipe Bible spec. Both operators make every drink. Timed to build targets.' },
      { id: 'pl_p6_03', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Operations', text: 'Staff hired and fully trained — all 3 phases of E-03 completed. Solo clearance signed by owner for all staff.' },
      { id: 'pl_p6_04', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Operations', text: 'H-01 Hiring & Onboarding packet completed for each staff member. Iowa New Hire Report filed within 15 days of hire.' },
      { id: 'pl_p6_05', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Operations', text: 'Cold brew protocol tested — nightly brew confirmed. All house-made syrups produced and labeled. Full daily operations log run for 1 week.' },
      { id: 'pl_p6_06', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Equipment',  text: 'Full equipment run-through at soft-open location — generator, water system, espresso machine, POS. Simulate a full 8-hour service day.' },
      { id: 'pl_p6_07', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Location',   text: 'Lot agreement for 35th & Broadway active and signed. Access confirmed for February 1.' },
      { id: 'pl_p6_08', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Financial',  text: 'Opening cash drawer funded. Deposit to business checking confirmed. QuickBooks POS opening count set.' },
      { id: 'pl_p6_09', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Social',     text: "TikTok/Instagram: 1,000+ followers target. Countdown to soft open posts begin — '14 days,' '7 days,' '3 days,' 'Tomorrow.'" },
      { id: 'pl_p6_10', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Loyalty',    text: 'Stamp cards ordered and in hand. Stamp tool (honey bee or Q mark) ordered and tested. Card holder mounted inside trailer.' },
      { id: 'pl_p6_11', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Honey',      text: 'Confirm honey supply from both Iowa suppliers. Minimum 2 gallons on hand for opening week.' },
      { id: 'pl_p6_12', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Supplies',   text: 'All consumables ordered and on hand: cups (all sizes), lids, sleeves, straws, gloves, paper towels, soap, sanitizer, test strips.' },
      { id: 'pl_p6_13', when: 'Jan 2027', targetDate: '2027-01-31', category: 'Media',      text: 'Soft open announcement drafted: press release for Council Bluffs Nonpareil, social media posts, Facebook event created.' },
    ],
  },
  {
    id: 'phase_soft_open',
    title: 'February 2027',
    subtitle: 'Soft Open — No Owner Draw — Build the Rhythm',
    tasks: [
      { id: 'pl_p7_01', when: 'Feb 1, 2027', targetDate: '2027-02-01', category: 'Milestone',  text: 'SOFT OPEN DAY. 35th & Broadway. 6:00 AM. First cup served. Every 10th drink free from Day 1.' },
      { id: 'pl_p7_02', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Operations', text: 'Daily Operations Log (E-02) completed every single shift. Both operator initials on every log. This is an Iowa DIAL compliance document.' },
      { id: 'pl_p7_03', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Financial',  text: 'Iowa sales tax collected 7% on every transaction. Funds go directly to sales tax sub-account — never operating funds.' },
      { id: 'pl_p7_04', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Financial',  text: 'No owner draw in February or March. All revenue goes to operating reserves. $2,500/month draw begins April 2027.' },
      { id: 'pl_p7_05', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Social',     text: 'Post every day. At minimum: location update + one drink or behind-the-scenes post. TikTok minimum 3x/week.' },
      { id: 'pl_p7_06', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Operations', text: 'Customer feedback loop — after first 30 days, conduct 10–20 customer interviews. What do they love? What would they change? Cut bottom sellers. Double down on top performers.' },
      { id: 'pl_p7_07', when: 'Feb 2027',    targetDate: '2027-02-28', category: 'Financial',  text: 'QuickBooks weekly report every Monday. Compare cups/day against break-even (49 cups/day at $6.00 average). Know your numbers.' },
    ],
  },
  {
    id: 'phase_grand_opening',
    title: 'March – April 2027',
    subtitle: 'Grand Opening & Owner Full-Time',
    tasks: [
      { id: 'pl_p8_01', when: 'Mar 10, 2027', targetDate: '2027-03-10', category: 'Milestone',     text: 'ETS from active duty. Ryan Joseph Rodriquez is now a full-time business owner. Reserve commitment continues monthly.' },
      { id: 'pl_p8_02', when: 'Mar 2027',     targetDate: '2027-03-31', category: 'Grand Opening', text: 'GRAND OPENING event — full social blitz, media pitch to Nonpareil / KETV / WOWT, veteran community outreach, Facebook event.' },
      { id: 'pl_p8_03', when: 'Mar 2027',     targetDate: '2027-03-31', category: 'Media',         text: 'Press release to: Council Bluffs Nonpareil, KETV (ABC), WOWT (NBC), Omaha World-Herald. Pitch 3–4 weeks in advance of Grand Opening date.' },
      { id: 'pl_p8_04', when: 'Apr 2027',     targetDate: '2027-04-30', category: 'Financial',     text: 'Owner draw begins — $2,500/month. Confirm revenue supports draw before first payment.' },
      { id: 'pl_p8_05', when: 'Apr 2027',     targetDate: '2027-04-30', category: 'Delivery',      text: 'Activate DoorDash, Uber Eats, and/or GrubHub once build times are consistently under 3 minutes. Do not activate until operations are stable.' },
      { id: 'pl_p8_06', when: 'Apr 2027',     targetDate: '2027-04-30', category: 'Location',      text: 'Second rotation location confirmed and active. 2–3 weekly location rotations in place.' },
      { id: 'pl_p8_07', when: 'Apr 30, 2027', targetDate: '2027-04-30', category: 'Tax',           text: 'Iowa sales tax Q1 return filed — due April 30, 2027. Iowa Dept of Revenue, tax.iowa.gov.' },
    ],
  },
  {
    id: 'phase_post_opening',
    title: 'Post-Opening Milestones',
    subtitle: 'Months 3–12',
    tasks: [
      { id: 'pl_p9_01', when: 'Month 3',     targetDate: '2027-05-01', category: 'Financial', text: 'Confirm Conservative scenario ($4,680/mo) is met. If Base scenario ($7,800/mo), hold draw and build reserve.' },
      { id: 'pl_p9_02', when: 'Month 6',     targetDate: '2027-08-01', category: 'Social',    text: '5,000 TikTok followers target · 3,000 Instagram · 2,000 Facebook. Review G-03 playbook — adjust content strategy if behind.' },
      { id: 'pl_p9_03', when: 'Month 6',     targetDate: '2027-08-01', category: 'Review',    text: '30-day customer research complete. Menu adjusted based on sales data. Bottom sellers cut or swapped for seasonal.' },
      { id: 'pl_p9_04', when: 'Aug 1, 2027', targetDate: '2027-08-01', category: 'Financial', text: 'FIRST SBA LOAN PAYMENT DUE — $674/month. Confirm payment posted. Log confirmation number. 9-month deferment ends.' },
      { id: 'pl_p9_05', when: 'Q3 2027',     targetDate: '2027-07-31', category: 'Tax',       text: 'Iowa sales tax Q2 return filed — due July 31, 2027.' },
      { id: 'pl_p9_06', when: 'Q4 2027',     targetDate: '2027-10-31', category: 'Planning',  text: 'Year 2 planning: second trailer quotes, additional lot agreements, S-Corp election evaluation. Consult CPA if Year 1 net profit approaches $50,000.' },
      { id: 'pl_p9_07', when: 'Q4 2027',     targetDate: '2027-10-31', category: 'Tax',       text: 'Iowa sales tax Q3 return filed — due October 31, 2027.' },
      { id: 'pl_p9_08', when: 'Jan 2028',    targetDate: '2028-01-31', category: 'Annual',    text: 'Iowa DIAL license renewal ($250). Council Bluffs vendor permit renewal. Insurance renewal. Annual checklist (E-02) completed.' },
      { id: 'pl_p9_09', when: 'Jan 2028',    targetDate: '2028-01-31', category: 'Tax',       text: 'Iowa sales tax Q4 return filed — due January 31, 2028. Annual reconciliation complete.' },
      { id: 'pl_p9_10', when: '2028',        targetDate: '2028-01-01', category: 'Growth',    text: 'YEAR 2 — Second trailer unit. S-Corp elected. Multi-location schedule. First full-time hire. $200,000–$250,000 revenue target.' },
    ],
  },
];

// Critical gates — the cross-cutting "if this slips, the launch slips" view.
// Each entry references one or more task IDs so checking off in the main
// timeline automatically marks the gate as done. `gates` is what falls if it slips.
export const CRITICAL_GATES = [
  { id: 'gate_01', when: 'Now (active duty)', label: 'DIAL classification call — confirms trailer build spec', gates: 'Everything downstream',                                   taskIds: ['pl_p1_03', 'pl_p1_04', 'pl_p1_05'] },
  { id: 'gate_02', when: 'Now (active duty)', label: 'GI Bill transfer to dependents — cannot do after ETS',     gates: 'Dependent education benefits forever',                  taskIds: ['pl_p1_02'] },
  { id: 'gate_03', when: 'June 2026',         label: 'LLC formed + EIN obtained',                                gates: 'SBA application, bank account, all licenses',           taskIds: ['pl_p2_01', 'pl_p2_02'] },
  { id: 'gate_04', when: 'June 2026',         label: '$10,000 equity deposited to business checking',            gates: 'SBA loan approval',                                     taskIds: ['pl_p2_05'] },
  { id: 'gate_05', when: 'Jul 15, 2026',      label: 'SBA loan application submitted',                           gates: 'Loan approval timeline, Nov disbursement',              taskIds: ['pl_p3_01'] },
  { id: 'gate_06', when: 'Aug 2026',          label: 'Lot agreement signed — 35th & Broadway',                   gates: 'Confirmed soft-open location',                          taskIds: ['pl_p3_02'] },
  { id: 'gate_07', when: 'Sep 2026',          label: 'DIAL plan review package submitted',                       gates: 'Physical inspection, permits, build start',             taskIds: ['pl_p4_02'] },
  { id: 'gate_08', when: 'Sep 2026',          label: 'CFPM certification — both operators',                      gates: 'Iowa license, legal service operations',                taskIds: ['pl_p4_03'] },
  { id: 'gate_09', when: 'Sep 2026',          label: 'General liability insurance bound',                        gates: 'Vendor permit, lot agreements, DIAL',                   taskIds: ['pl_p4_04'] },
  { id: 'gate_10', when: 'Oct 2026',          label: 'DIAL plan review APPROVED',                                gates: 'Construction start — do not build before approval',     taskIds: ['pl_p4_08'] },
  { id: 'gate_11', when: 'Nov 2026',          label: 'SBA loan funds disbursed',                                 gates: 'Equipment orders, trailer build, supplies',             taskIds: ['pl_p5_01'] },
  { id: 'gate_12', when: 'Dec 2026',          label: 'DIAL physical inspection PASSED',                          gates: 'Iowa DIAL Annual License',                              taskIds: ['pl_p5_07'] },
  { id: 'gate_13', when: 'Dec 2026',          label: 'CB vendor permit + Fire Marshal inspection PASSED',        gates: 'Legal operation in Council Bluffs',                     taskIds: ['pl_p5_08', 'pl_p5_09'] },
  { id: 'gate_14', when: 'Jan 2027',          label: 'All licenses in hand, staff trained, supplies on hand',    gates: 'February 1 soft open date',                             taskIds: ['pl_p6_01', 'pl_p6_03', 'pl_p6_12'] },
  { id: 'gate_15', when: 'Feb 1, 2027',       label: 'SOFT OPEN',                                                gates: 'Revenue, customer feedback, operations rhythm',         taskIds: ['pl_p7_01'] },
  { id: 'gate_16', when: 'Apr 30, 2027',      label: 'Iowa sales tax Q1 return filed',                           gates: 'Compliance — $25/day late penalty',                     taskIds: ['pl_p8_07'] },
  { id: 'gate_17', when: 'Aug 1, 2027',       label: 'First SBA loan payment — $674',                            gates: 'Loan in good standing',                                 taskIds: ['pl_p9_04'] },
];

// Color hint per category — used for the chip background in the UI.
export const CATEGORY_COLORS = {
  'VA / Benefits':  '#7B9F4F',
  'Regulatory':     '#C84B4B',
  'Research':       '#7BB3F0',
  'Social':         '#D17BC8',
  'Financial':      '#D4AF37',
  'Military':       '#9F7B4F',
  'Reserves':       '#9F7B4F',
  'Legal':          '#B37BF0',
  'Tax':            '#D4AF37',
  'SBA Loan':       '#D4AF37',
  'SBDC':           '#D4AF37',
  'Location':       '#7BB3F0',
  'Relocation':     '#7BB3F0',
  'Equipment':      '#888888',
  'Loan':           '#D4AF37',
  'Licensing':      '#C84B4B',
  'Insurance':      '#C84B4B',
  'Trailer':        '#888888',
  'Build':          '#888888',
  'QuickBooks':     '#D4AF37',
  'Operations':     '#4FB39F',
  'Loyalty':        '#D17BC8',
  'Honey':          '#D4AF37',
  'Supplies':       '#888888',
  'Media':          '#D17BC8',
  'Milestone':      '#E05252',
  'Grand Opening':  '#E05252',
  'Delivery':       '#7BB3F0',
  'Review':         '#4FB39F',
  'Planning':       '#4FB39F',
  'Annual':         '#C84B4B',
  'Growth':         '#7B9F4F',
};

// Total task count — used for the dashboard tile's "X / Y" display.
export const TOTAL_TASKS = PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
