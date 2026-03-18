---
description: RALPH Loop - Main development workflow for implementing tasks
---

# RALPH Loop Development Workflow

This workflow implements the **RALPH-V** model (Research, Analyze, Learn, Plan, Handle, **Verify**) for systematic task completion with mandatory verification before completion.

## File Hierarchy

```
.agent/
├── prd.json          # HIGH-LEVEL: Features by phase (source of truth)
├── tasks.json        # GRANULAR: Specific implementation tasks
├── progress.txt      # STATUS: Current state, history, context
└── workflows/
    ├── ralph-loop.md     # This file - main dev workflow
    └── add-feature.md    # Adding new features
```

## Prerequisites

Before starting any task, ensure:
- You have read `.agent/progress.txt` for current state
- You have access to `.agent/tasks.json` for task definitions
- The development servers are running (web app and runner)

## Workflow Steps

### 1. RESTORE CONTEXT (R)
// turbo
Read the progress file to understand current state:
```
View file: .agent/progress.txt
```

**Check for:**
- Is there an active task in "in_progress" status?
- What was the last completed task?
- Are there any blocked tasks?
- What are the recommended next tasks?

Then read the tasks file for details:
```
View file: .agent/tasks.json
```

**Decision Point:**
- If there's an active task in "in_progress" status → Go to step 4 (LEARN from where you left)
- If no active task → Go to step 2 (ANALYZE)

### 2. ANALYZE (A)
Identify the next task to work on:

1. Check if there are any blocked tasks that can now be unblocked
2. Look at the `taskOrder` array in tasks.json for recommended sequence
3. Consider dependencies - don't start a task if its dependencies aren't complete
4. Prefer higher priority (phases 2-3 before 4-5)

**Priority Order:**
1. Phase 3 (Execution) remaining - core functionality
2. Phase 2 (Management) remaining - user-facing features
3. Phase 4 (Reporting) - analytics and exports
4. Phase 5 (Advanced) - nice-to-haves

**Output:** Select one task ID to work on.

### 3. LEARN (L) - Research Phase
Before implementation, gather context:

1. Read the task definition from tasks.json
2. View the `filesAffected` to understand existing code
3. Check for any similar patterns already in the codebase
4. Review acceptance criteria carefully

**For each file in filesAffected:**
```
View file outline: <filepath>
```

**If the task involves a new feature:**
- Search for similar implementations in the codebase
- Review related hooks/components
- Check if any dependencies need to be installed

### 4. PLAN (P)
Create a mini-implementation plan:

1. List the specific changes needed
2. Identify the order of changes
3. Note any new files to create
4. Consider edge cases and error handling
5. Identify what can go wrong
6. **Define how to test/verify the implementation**

**Update progress.txt with:**
```
## Active Task
- Task ID: T-X###
- Task Name: [Name]
- Status: IN_PROGRESS
- Started: [timestamp]
- Phase: PLANNING
- Notes: Brief implementation plan
- Verification Plan: How this will be tested
```

### 5. HANDLE (H) - Implementation
Execute the implementation:

1. Create any new files needed
2. Modify existing files as planned
3. Follow existing code patterns and style
4. Add proper TypeScript types
5. Include error handling

**During implementation:**
- Update progress.txt periodically with Phase: IMPLEMENTING
- Note significant decisions or changes

**After implementation:**
- Check for TypeScript/lint errors before proceeding to verification

### 6. VERIFY (V) - Testing & Validation ⭐ NEW
**CRITICAL: DO NOT skip this step or mark task complete without verification!**

Before updating any documentation, verify the implementation works:

#### 6.1 Build Verification
// turbo
Check for TypeScript and lint errors:
```bash
# For web app changes
cd apps/web && npx tsc --noEmit
```

**If errors exist:** Fix them before proceeding.

#### 6.2 Test Strategy by Task Type

**For Execution/API Tasks (apps/web/src/lib/runner/ or apps/web/src/app/api/):**
```
Strategy: Manual execution test
1. Start the web app
2. Trigger a test run from the web UI that uses the new feature
3. Check server logs for expected behavior
4. Check Firestore/Storage for correct data updates
```

**For UI Component Tasks (apps/web/src/components/):**
```
Strategy: Visual inspection
1. Navigate to the page containing the component
2. Interact with the component
3. Verify expected behavior and appearance
4. Check browser console for errors
```

**For Hook/Logic Tasks (apps/web/src/lib/):**
```
Strategy: Integration test via UI
1. Navigate to a page that uses the hook
2. Perform actions that trigger the hook
3. Verify data loads/saves correctly
4. Check Network tab for API calls
```

**For API/Firebase Tasks:**
```
Strategy: Data verification
1. Trigger the feature from UI
2. Check Firestore console for data
3. Verify data structure matches expected schema
```

#### 6.3 Acceptance Criteria Check
Go through each acceptance criterion from the task definition:

```
[ ] Criterion 1 - PASS / FAIL
[ ] Criterion 2 - PASS / FAIL
[ ] Criterion 3 - PASS / FAIL
...
```

**ALL criteria must PASS to proceed.**

#### 6.4 Update Progress with Verification Results

```
## Active Task
- Task ID: T-X###
- Status: VERIFYING
- Verification Results:
  - Build: ✅ PASS (no TS errors)
  - Manual Test: ✅ PASS (tested via UI)
  - Acceptance Criteria:
    - [x] Criterion 1
    - [x] Criterion 2
    - [x] Criterion 3
```

#### 6.5 If Verification Fails

1. Note which test/criterion failed
2. Go back to step 5 (HANDLE) to fix
3. Re-run verification
4. Repeat until all tests pass

### 7. POST-TASK UPDATE (Only after Verification Passes!)
After completing AND verifying a task:

**If COMPLETED (all verification passed):**

1. **Update tasks.json:**
   - Set task `status` to "completed"
   - Add `completedDate` field

2. **Update prd.json:**
   - Set the corresponding feature's `completed` to true
   - Update `completedFeatures` count

3. **Update progress.txt:**
   - Clear Active Task (set to None/IDLE)
   - Add to COMPLETED TASK HISTORY section with verification notes
   - Increment "Tasks Completed This Session"
   - Update NEXT RECOMMENDED TASKS

**If BLOCKED:**

1. **Update progress.txt:**
   - Add to BLOCKED TASKS section with reason
   - Include specific error/issue encountered
   - Suggest what's needed to unblock

2. **Move to next task** (go to step 2)

**If PARTIALLY DONE (context limit/time):**

1. **Update progress.txt:**
   - Keep Active Task with status IN_PROGRESS
   - Update Phase: where you are (PLANNING/IMPLEMENTING/VERIFYING)
   - Add detailed NOTES with exactly where you stopped:
     - What's done
     - What's remaining
     - Verification status so far
     - Any variables/state needed to resume
     - Files modified so far

## Quick Reference: Testing Commands

```bash
# Check TypeScript errors (web)
cd apps/web && npx tsc --noEmit

# Run linting
npm run lint

# Start web dev server (if not running)
cd apps/web && npm run dev

# Check server logs for job processing
# (View the terminal running the web app)
```

## Example: Complete RALPH-V Cycle

### Starting a task:
```
## Active Task
- Task ID: T-E007
- Task Name: Assertion Actions
- Status: IN_PROGRESS
- Started: 2026-01-20T08:00:00+05:30
- Phase: IMPLEMENTING
- Notes: Adding assertion types to executor
- Verification Plan:
  1. Run TypeScript check
  2. Create test case with assert-visible step
  3. Run test via runner
  4. Verify log shows assertion pass/fail
```

### After verification passes:
```
## Active Task
- Task ID: T-E007
- Status: VERIFIED ✅
- Verification Results:
  - Build: ✅ PASS
  - Manual Test: ✅ PASS
    - Created test with assert-visible
    - Ran via runner, assertion executed correctly
    - Log showed "Asserting: visible equals"
  - Acceptance Criteria:
    - [x] assert-visible checks element is visible
    - [x] assert-text checks element contains text
    - [x] assert-url checks current URL matches
    - [x] assert-title checks page title
    - [x] Assertions report pass/fail correctly
```

### Completing task:
```
## Active Task
- Task ID: None
- Status: IDLE

[Add to COMPLETED TASK HISTORY]
[2026-01-20] T-E007 - Assertion Actions ✅ VERIFIED
  Duration: 15 minutes
  Files: executor.ts, listener.ts
  Verification: Build ✅, Manual Test ✅, All 5 criteria passed
```

### If verification fails:
```
## Active Task
- Task ID: T-E007
- Status: VERIFICATION_FAILED ❌
- Verification Results:
  - Build: ✅ PASS
  - Manual Test: ❌ FAIL
    - assert-text not matching correctly
    - Error: "contains" operator returning false for valid match
  - Action: Fix matchValue function for "contains" case
```

## Critical Rules

1. **NEVER skip verification** - A task is NOT complete until verified
2. **ALL acceptance criteria must pass** - Not just "most" of them
3. **Build must be clean** - No TypeScript errors allowed
4. **Always update tracking files** after completing a verified task:
   - tasks.json (status)
   - prd.json (if feature complete)
   - progress.txt (history with verification notes)

5. **One task at a time** - Complete or block before moving on

6. **Dependencies matter** - Check before starting a task

7. **Preserve context** - If stopping mid-task, write detailed notes

8. **New features = /add-feature first** - Never code without tracking

9. **Follow the order:**
   - prd.json (feature level, completed flag)
   - tasks.json (task level, status field)
   - progress.txt (progress tracking)

## Verification Checklist Template

Copy this for each task:

```
## Verification Checklist for T-X###

### Build Check
- [ ] TypeScript compiles without errors
- [ ] No lint errors/warnings

### Functional Tests
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error cases handled gracefully

### Acceptance Criteria
- [ ] Criterion 1: [description]
- [ ] Criterion 2: [description]
- [ ] Criterion 3: [description]

### Regression Check
- [ ] Existing features still work
- [ ] No console errors introduced

### Final Status
- [ ] ALL CHECKS PASSED → Ready to mark complete
```
