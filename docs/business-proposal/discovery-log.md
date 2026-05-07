# Discovery log

A working document. Records what we currently believe, what we're assuming, and what we need to validate before building further. No solution claims yet — the goal is to pick the right problem before scaling the product around it.

When something here gets validated or killed, move it out: validated beliefs go into a problem-statement doc, killed ones go to the bottom under "Ruled out."

---

## Working hypothesis

**OpenAutomate exists to help companies adopt shift-left testing by shortening the dev-to-test feedback loop.**

This is a hypothesis, not a conclusion. It's stronger than "test management platform" because:

- It attaches to a named pain that engineering leaders already have budget and OKRs for.
- The outcome is measurable (minutes from commit to test signal).
- It reframes the buyer from QA leads to engineering leadership, where velocity-related spend lives.

It is still vague enough that five different products could claim to solve it. The next job is to narrow it.

---

## What we believe (but haven't verified)

1. **Playwright adoption is large and growing.** Backed by npm download trends and State of JS surveys through 2024. Reasonably safe.
2. **Commercial test-management tools have paying customers.** Currents.dev, Sorry Cypress, Testomat.io, Allure TestOps, BrowserStack Test Management all exist and charge money. Suggests the broader space is real.
3. **A self-hosted, BYO-infrastructure slice exists.** Regulated industries, cost-sensitive teams, privacy-conscious orgs. Real but narrow.

---

## Assumptions we are currently making without evidence

These are the load-bearing assumptions. If any of them is wrong, the product premise shifts.

- **A1.** Teams using Playwright feel meaningful pain beyond "CI logs are ugly." Unverified — many teams may be perfectly content with GitHub Actions + the HTML report.
- **A2.** "Dev-to-test feedback loop time" is something engineering leaders are actively trying to reduce, not just nodding at in conference talks.
- **A3.** Self-hosting is perceived as a feature, not a tax. Unclear — for many teams it is overhead they would pay to avoid.
- **A4.** The right buyer is engineering leadership, not QA leads. Changes pricing, positioning, and what the product needs to expose.
- **A5.** The problem is solvable with a platform layer. It might instead be a culture problem (devs don't run tests) that no tool fixes.

---

## The five candidate sub-problems

"Shift left" is an outcome. The real problem underneath it is one of these. Each implies a different product. We have not yet picked one.

| # | Problem | Who feels it | What competes |
|---|---------|--------------|---------------|
| 1 | Tests run too slowly | Devs waiting on CI | Parallelization, sharding, faster runners |
| 2 | Tests run too late in the pipeline (only on PR) | Devs who get stale signal | Watch-mode tooling, pre-commit infra |
| 3 | Devs don't run E2E tests locally because setup is painful | Devs who skip tests entirely | Containerized dev environments, devcontainers |
| 4 | Devs ignore failures because signal is noisy or slow to interpret | Devs drowning in flakes | Flake-detection, triage tools, AI summarizers |
| 5 | Tests are written by QA, not devs, so devs see them late | Cross-functional teams | Culture change — tools rarely fix this alone |

The current code shape (queued runs, worker pool, artifact viewer) maps most naturally to **#1 or #2**. The framing in the README and current docs does not commit to either.

---

## What we need to validate next

In rough priority order:

1. **Pick the sub-problem.** Not by intuition — by talking to 5–10 teams that already use Playwright and asking what their actual pain is. The wrong answer here invalidates everything downstream.
2. **Confirm the buyer.** Is the person feeling the pain the same person who would approve self-hosting it? Often not.
3. **Confirm self-host is wanted, not tolerated.** If the answer is "we'd rather pay for SaaS," the entire BYO-Firebase architecture is a liability, not a moat.
4. **Find one team willing to run a pre-MVP version against a real workload.** Without this, every later decision is speculation.

---

## Ruled out

*(empty for now — populate as hypotheses get killed)*
