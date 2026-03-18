---
description: Add a new feature to the project - must update tasks.json first before implementing
---

# Add New Feature Workflow

When the user requests a new feature, follow this workflow to ensure proper tracking and context management.

## Rule #1: NEVER Implement Before Documenting

Any new feature request must:
1. First be added to `.agent/prd.json` (high-level feature)
2. Then be added to `.agent/tasks.json` (granular task)
3. Only then can code be written

## Workflow Steps

### 1. UNDERSTAND THE REQUEST
Clarify the feature request:
- What is the user asking for?
- What's the expected behavior?
- What's the scope (small fix vs large feature)?
- Which phase does this belong to?

### 2. CHECK FOR EXISTING FEATURES
// turbo
Read prd.json to check if this feature already exists:
```
View file: .agent/prd.json
```

Then check tasks.json:
```
grep the feature name in .agent/tasks.json
```

If it exists:
- Tell the user the task ID
- Ask if they want to start implementing it
- If yes, switch to /ralph-loop workflow

### 3. UPDATE prd.json FIRST

Add the feature to the appropriate phase in prd.json:

```json
"feature_key": {
  "name": "Feature Name",
  "completed": false,
  "notes": "Brief description if needed"
}
```

**Which phase?**
- `phase1_foundation`: Infrastructure, auth, base UI
- `phase2_test_management`: Projects, suites, test cases
- `phase3_local_execution`: Runner, execution, artifacts
- `phase4_reporting`: Results, charts, exports
- `phase5_advanced_features`: Integrations, scheduling, advanced

Also update the metadata counts:
- Increment `totalFeatures`
- Increment `pendingFeatures` (if not completed)

### 4. CREATE THE TASK IN tasks.json

Add a granular task entry:

```json
{
  "id": "T-X###",  // Following naming: T-F=Foundation, T-M=Management, T-E=Execution, T-R=Reporting, T-A=Advanced
  "name": "Task Name (concise)",
  "description": "Detailed description of what this task does",
  "status": "pending",
  "estimatedHours": X,
  "dependencies": ["T-X###"],  // Any tasks this depends on
  "acceptanceCriteria": [
    "Specific criteria 1",
    "Specific criteria 2",
    "Specific criteria 3"
  ],
  "technicalNotes": "Implementation hints, libraries to use, patterns to follow",
  "filesAffected": [
    "path/to/file1.ts",
    "path/to/file2.tsx"
  ]
}
```

**Task ID Prefixes:**
- `T-F###` - Foundation tasks
- `T-M###` - Test Management tasks
- `T-E###` - Execution/Runner tasks
- `T-R###` - Reporting tasks
- `T-A###` - Advanced feature tasks

**Update metadata:**
- Increment `totalTasks`
- Increment `pendingTasks`
- Update `lastUpdated`

**Add to taskOrder:**
Add the task ID to the `taskOrder` array in priority position.

### 5. UPDATE progress.txt

Add a note about the new task:
```
================================================================================
NEWLY ADDED TASKS
================================================================================
[2026-01-20] T-X### - Feature Name (requested by user)
  Priority: high/medium/low
  Ready to implement: yes/no (depends on T-X###)
```

Also add to PENDING TASKS section if high priority.

### 6. CONFIRM WITH USER

Tell the user:
- The feature has been added to prd.json
- The task has been created with ID T-X###
- Its priority and dependencies
- Ask if they want to start implementing now

### 7. IMPLEMENT (if user says yes)

Switch to /ralph-loop workflow starting at step 3 (LEARN).

## Example: Adding a New Feature

**User says:** "I want to add dark/light theme toggle"

**Agent actions:**

**Step 1: Update prd.json**
Add to phase2_test_management.features (or create new section):
```json
"theme_toggle": {
  "name": "Theme Toggle (Dark/Light)",
  "completed": false
}
```

**Step 2: Create task in tasks.json**
```json
{
  "id": "T-M018",
  "name": "Theme Toggle (Dark/Light)",
  "description": "Add ability to switch between dark and light themes",
  "status": "pending",
  "estimatedHours": 3,
  "dependencies": [],
  "acceptanceCriteria": [
    "Toggle button in header/sidebar",
    "Theme persists across sessions (localStorage)",
    "Smooth transition between themes",
    "All components respect theme"
  ],
  "technicalNotes": "Use CSS variables for theming, next-themes library recommended",
  "filesAffected": [
    "apps/web/src/app/layout.tsx",
    "apps/web/src/app/globals.css",
    "apps/web/src/components/layout/ThemeToggle.tsx"
  ]
}
```

**Step 3: Update progress.txt**
Add to NEWLY ADDED section.

**Step 4: Tell user**
"Added as T-M018 - Theme Toggle. Ready to implement (no dependencies). Start now?"

## File Hierarchy

```
.agent/
├── prd.json          # HIGH-LEVEL: Features grouped by phase
│                     # Updated FIRST when adding features
│
├── tasks.json        # GRANULAR: Specific tasks with details
│                     # Updated SECOND, derived from prd.json
│
├── progress.txt      # STATUS: Current state, history
│                     # Updated during work
│
└── workflows/
    ├── add-feature.md    # This file
    └── ralph-loop.md     # Main development workflow
```

## Quick Reference

**Always update in this order:**
1. `.agent/prd.json` (feature level)
2. `.agent/tasks.json` (task level)
3. `.agent/progress.txt` (tracking)
4. Then implement code

**Never:**
- Skip prd.json and go straight to tasks.json
- Skip both and start coding
- Forget to update progress.txt after completion
