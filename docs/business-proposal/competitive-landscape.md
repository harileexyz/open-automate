# Competitive landscape

For each product: what problem they say they solve, the features they ship, and how OpenAutomate compares.

**Confidence note.** Marketing pages change, prices move, feature lists drift. Entries are tagged:
- ✅ high confidence — I've seen the product, repo, or docs directly and the claim is structural.
- 🟡 medium — I'm confident on category and shape, less on specific features.
- ⚠️ low — directional only; verify before quoting.

OpenAutomate's working hypothesis (per `discovery-log.md`): *enable shift-left by shortening the dev-to-test feedback loop*. The comparisons below assume that framing; if we pick a different sub-problem, the comparison shifts.

---

## Category 1 — DIY baseline (the real competition)

This is what most teams do today. Any commercial pitch has to beat this, not other vendors.

### GitHub Actions + Playwright HTML report ✅
- **Problem they solve:** "I want my Playwright tests to run on every PR and produce a report."
- **Features:** Hosted runners, matrix builds, artifact upload, the built-in Playwright HTML reporter, free tier for open source, generous free minutes for private repos.
- **Pain it leaves on the table:** No history across runs. No flake tracking. Reports are per-run, per-PR — there's no "team dashboard." Triaging a failure means downloading a zip. Triggering a run outside CI is awkward.
- **vs OpenAutomate:** OpenAutomate's main job is to be *worth the install* over this. If a team's pain is just "I want a nicer report on this PR," OpenAutomate loses — Actions is free and zero-ops. OpenAutomate wins when teams want history, on-demand runs, or shared visibility across many test suites and many PRs.

### GitLab CI / CircleCI / Buildkite + Playwright 🟡
- Same shape as the above. CircleCI and Buildkite have richer test-insight overlays (flake detection, slowest-test reports) baked in.
- **vs OpenAutomate:** CI vendors are bundling more shift-left features over time. OpenAutomate has to either be CI-agnostic (works regardless of who runs the CI) or offer something CI can't — e.g., on-demand runs from a UI, or test management that survives CI changes.

---

## Category 2 — Playwright/Cypress-native orchestrators

Direct competitors. Same framework, similar shape.

### Currents.dev ✅
- **Problem they solve:** "Cypress and Playwright reports are ephemeral. Teams want a dashboard, parallelization coordination, flake tracking, and history."
- **Features:** Cloud dashboard for runs across CI, parallel-run orchestration (splits a suite across runners), flake detection, run analytics, GitHub/Slack integrations, supports both Cypress and Playwright.
- **Buyer:** QA leads and engineering managers running large E2E suites that take too long serially.
- **vs OpenAutomate:** Currents is **SaaS**. It is the closest commercial product to what OpenAutomate is shaped like. Currents wins on: maturity, parallelization, integrations. OpenAutomate's only real differentiation today is *self-hostable* + *open source* + *Playwright-only* (narrower scope = simpler product).

### Sorry Cypress ✅
- **Problem they solve:** "Cypress Cloud is paid and SaaS. We want the same dashboard, self-hosted and free."
- **Features:** Self-hosted dashboard, parallelization coordination, run history, screenshots/videos, originally Cypress-focused. Open source.
- **Buyer:** Cost-sensitive or self-host-mandated teams already on Cypress.
- **vs OpenAutomate:** Sorry Cypress is the *strongest direct comp* in spirit — same self-hosted, OSS, framework-orchestrator pitch, just for Cypress. If OpenAutomate is "Sorry Cypress for Playwright," that's a real wedge — but it's a narrow one, and we should expect Sorry Cypress (or a fork) to expand to Playwright.

### Microsoft Playwright Testing (Azure) 🟡
- **Problem they solve:** "Running Playwright at scale across browsers/OSes is operationally heavy. Microsoft will run it for you on Azure."
- **Features:** Cloud-hosted Playwright runners across browsers, parallelization, integration with Playwright Test reporter, billed via Azure.
- **Buyer:** Teams already on Azure who want Microsoft-blessed scale-out.
- **vs OpenAutomate:** Different axis — they sell *compute*, OpenAutomate would sell *the platform around the compute*. Not directly competitive, but it raises the bar on what "running Playwright in the cloud" feels like.

---

## Category 3 — Framework-agnostic test management

Older, broader, often Jira-shaped. Different buyer, different shape.

### TestRail ✅
- **Problem they solve:** "QA teams need to track manual and automated test cases, runs, requirements coverage, and signoff for releases."
- **Features:** Test case repository, test plans, test runs (manual + automated), requirements traceability, integrations with Jira, JUnit/automation result import.
- **Buyer:** QA managers in mid-to-large organizations, often regulated industries.
- **vs OpenAutomate:** Different product entirely. TestRail is process-and-compliance-shaped; OpenAutomate is execution-and-feedback-shaped. They could even coexist (TestRail tracks the QA process, OpenAutomate runs the tests). Overlap is shallow.

### Allure TestOps 🟡
- **Problem they solve:** "Connect automated test results to test cases, with rich reporting and analytics."
- **Features:** Test case management, automated result ingestion, dashboards, flake/stability metrics, integrations with most frameworks including Playwright.
- **Buyer:** QA orgs that want better reporting on top of automated suites.
- **vs OpenAutomate:** Overlaps in "viewing automated test results nicely." Allure is broader (any framework) and more reporting-heavy; OpenAutomate is narrower (Playwright) and more execution-focused.

### Testomat.io 🟡
- Test case management with strong automated-test integration, BDD-friendly. Smaller than TestRail; more developer-friendly.
- **vs OpenAutomate:** Same axis as Allure — test management vs execution platform.

### Xray / Zephyr Scale (Jira-native) ⚠️
- **Problem they solve:** "Test management *inside* Jira, so QA lives where the tickets live."
- **Buyer:** Jira-heavy enterprises.
- **vs OpenAutomate:** Different buyer (Jira admins/QA) and different shape. Not directly competitive.

---

## Category 4 — Cross-browser cloud runners

They sell *machines to run tests on*, not the platform around them.

### BrowserStack / Sauce Labs / LambdaTest ✅
- **Problem they solve:** "We need our tests to run on real Safari/iOS/Edge/old-Android, and we don't want to maintain a device lab."
- **Features:** Hosted browsers and devices, live debugging, video/screenshot capture, integrations with Playwright/Selenium/Cypress, parallelization.
- **Buyer:** Teams whose pain is *browser/device coverage*, not orchestration.
- **vs OpenAutomate:** Adjacent, not competing. A team could use OpenAutomate to schedule and view runs while pointing the actual browser execution at BrowserStack. If anything, BrowserStack is a *future integration*, not a competitor.

---

## Category 5 — Shift-left / CI insight tooling (closest to our framing)

If our positioning is "shift-left," these are the products that talk that language today.

### Trunk.io Flaky Tests 🟡
- **Problem they solve:** "Flaky tests destroy developer trust in CI. Detect, quarantine, and triage them automatically."
- **Features:** Auto-detects flakes across runs, quarantines them, surfaces owners, integrates with most CI providers, framework-agnostic.
- **Buyer:** Engineering leaders measuring developer productivity / CI reliability.
- **vs OpenAutomate:** Trunk solves a *specific* shift-left pain (signal noise from flakes) really well. OpenAutomate doesn't address this directly today. If we picked sub-problem #4 from the discovery log ("devs ignore failures because signal is noisy"), Trunk is the incumbent we'd be fighting.

### Datadog Test Visibility / CI Visibility 🟡
- **Problem they solve:** "Treat CI runs and tests like production observability — flake rates, slowest tests, failure trends, with the rest of your Datadog stack."
- **Features:** Test result ingestion across frameworks/CIs, flake and performance analytics, alerting, dashboards, ties into the Datadog suite.
- **Buyer:** Already-Datadog orgs with a platform team.
- **vs OpenAutomate:** Datadog is observability-shaped, not execution-shaped. They watch tests run; they don't run them. Conceptually adjacent, commercially distant.

### Launchable ⚠️
- **Problem they solve:** "Most tests in a suite don't need to run for most changes. Use ML to predict which tests are likely to fail and run only those."
- **Buyer:** Large orgs with massive test suites where total runtime is the bottleneck.
- **vs OpenAutomate:** Different mechanism entirely (test selection vs. test orchestration). Both could serve "shorter feedback loop," but via different levers.

---

## Where OpenAutomate fits today

Honest read of the map:

- **Closest direct competitor:** Sorry Cypress — same self-hosted/OSS shape, different framework. Currents.dev — same product surface, but SaaS and broader.
- **Closest framing competitor:** Trunk.io Flaky Tests — speaks the same shift-left language, but solves a different mechanism (flakes, not loop time).
- **Real baseline competitor:** GitHub Actions + the default Playwright report. Free, zero-ops, and good enough for most teams.

OpenAutomate's plausible wedges, in rough order of defensibility:

1. **"Sorry Cypress for Playwright, with a sharper shift-left story."** Narrow but real — Playwright is overtaking Cypress, and the OSS self-hosted slot for Playwright is open. Risk: Sorry Cypress (or a fork) closes this in a weekend.
2. **"Self-hosted, BYO-Firebase, owns its data."** Real for regulated/privacy-sensitive teams. Narrow segment. Hard to reach.
3. **"Shift-left platform that shortens dev-to-test loop time."** Strong framing, but the current code doesn't yet earn this claim — we'd need features like local triggering, fast feedback, dev-side dashboards. Today this is aspiration, not differentiation.

What OpenAutomate is **not** competitive on today: parallelization, flake intelligence, cross-browser scale, Jira/QA-process integrations, mature CI integrations.

---

## What to validate before relying on this doc

- Talk to 3–5 teams already using Currents or Sorry Cypress: why they picked it, what they wish it did, what would make them switch.
- Confirm Sorry Cypress's Playwright support roadmap. If they ship strong Playwright support, wedge #1 narrows.
- Pricing for Currents, Allure TestOps, BrowserStack — *don't quote prices in pitches without re-checking*. They change.
- Whether "shift-left" buyers actually shop for tools, or whether they buy the same tools for different stated reasons.
