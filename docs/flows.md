# End-to-end flows

Sequence diagrams for the flows whose choreography is non-obvious. For static views see `architecture.md` (system) and `module-topology.md` (modules). For the run state machine see `run-lifecycle.md`.

The four flows here cover essentially everything load-bearing: queueing + executing a test, cancelling mid-run, recovering from a dead worker, and authenticated artifact access. Trivial flows (login, project create) are not diagrammed — they're a single Firestore write each.

## 1. Run a single test case (the headline flow)

What happens from "user clicks Run" to "user watches the trace." Real-time updates come from Firestore subscriptions on the `testRuns/{runId}` doc.

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (Next.js page)
    participant FS as Firestore
    participant Worker
    participant PW as Playwright / Chromium
    participant Storage as Firebase Storage
    participant SUT as App under test

    User->>UI: click "Run" on a test case
    UI->>FS: create testRuns/{id}<br/>{status: 'queued', testCaseId, projectId}
    FS-->>UI: runId
    UI->>UI: navigate to run detail page
    UI->>FS: subscribe to testRuns/{runId}

    Note over Worker,FS: every 5 s (per worker loop tick)
    Worker->>FS: txn — find first status='queued', UPDATE → 'starting'<br/>set workerId + leaseId
    FS-->>Worker: { runId, leaseId } or null

    Worker->>FS: assertLease + UPDATE status='running', attemptCount++
    FS-->>UI: realtime: status='running'

    Worker->>FS: load testCases/{id} + variables (where projectId)
    Worker->>PW: launch headless Chromium, start tracing, open page

    loop each step
        Worker->>FS: append log entry, heartbeatAt
        FS-->>UI: realtime: new log entry
        Worker->>PW: execute step (navigate / click / type / assert / wait)
        PW->>SUT: HTTP / DOM interaction
        SUT-->>PW: response
        PW-->>Worker: ok or thrown
        alt step ok
            Worker->>FS: mark step 'passed' + duration, heartbeatAt
        else step failed
            Worker->>PW: capture screenshot
            PW-->>Worker: screenshot bytes
            Worker->>Storage: upload screenshots/{projectId}/{runId}/{stepId}.png
            Worker->>FS: mark step 'failed' + error + screenshotPath
            Note over Worker: break out of loop
        end
    end

    Worker->>PW: stop tracing → trace.zip on disk
    Worker->>PW: close page, context, browser
    Worker->>Storage: upload traces/{projectId}/{runId}/{testCaseId}.zip
    Worker->>Storage: upload videos/.../{testCaseId}.webm (if recordVideo)
    Worker->>FS: assertLease + UPDATE status='completed'|'failed'<br/>tracePath, videoPath, final logs
    FS-->>UI: realtime: terminal status
    UI-->>User: render results + artifact links
```

The lease assertion happens on every Worker → FS write. If the lease was stolen (e.g. via stale-mark, see flow 3), the assertion throws and the executor abandons the run mid-step. The browser is still cleaned up via the `finally` block.

## 2. Cancel a run mid-execution

Cancellation is **cooperative**. The UI sets a flag; the worker checks the flag between steps. A step already in flight (e.g. a slow `assert` waiting for a selector) runs to completion before the cancel takes effect.

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant FS as Firestore
    participant Worker
    participant PW as Playwright

    Note over Worker,PW: worker mid-execution, currently on step N
    User->>UI: click "Cancel"
    UI->>FS: UPDATE testRuns/{id}<br/>cancelRequestedAt = now()
    FS-->>UI: ok
    UI-->>User: button shows "Cancelling..."

    Worker->>PW: finish step N (cooperative — no preemption)
    PW-->>Worker: step done

    Worker->>FS: throwIfRunCancelled (between-step check)
    FS-->>Worker: { cancelRequestedAt: <ts> }
    Worker->>Worker: throw RunCancelledError

    Note over Worker: catch in executeSingleTestCase finally
    Worker->>PW: stop tracing + close browser
    Worker->>FS: (best-effort) upload trace captured so far
    Worker->>FS: assertLease + UPDATE status='cancelled'<br/>completedAt, partial logs

    FS-->>UI: realtime: status='cancelled'
    UI-->>User: render "Cancelled" + partial trace
```

If the user cancels while the worker is between steps, the round trip is fast (sub-second). If the worker is mid-step on a long `wait` action, the cancel takes effect when that step's promise resolves. There is no "kill the browser now" path — adding one would risk leaking processes.

## 3. Stale-run cleanup (worker died mid-run)

When a worker process dies (SIGKILL, OOM, machine restart), its in-flight run is stuck in `running` with no one to update it. The next worker tick — by *any* live worker — runs `markStaleRunsFailed()` and reaps it.

```mermaid
sequenceDiagram
    participant W1 as Worker A (about to die)
    participant FS as Firestore
    participant W2 as Worker B (alive)
    participant UI

    W1->>FS: heartbeat: heartbeatAt = T0<br/>(during normal step execution)
    Note over W1: process killed (OOM / SIGKILL / VM restart)
    Note over FS: testRuns/{id}: status='running',<br/>heartbeatAt=T0, workerId=A, leaseId=L1

    Note over W2,FS: every 5 s on W2's loop tick
    W2->>FS: markStaleRunsFailed():<br/>scan status in [starting, running]<br/>filter heartbeatAt < (now - 15 min)
    FS-->>W2: stale runs []

    loop each stale run
        W2->>FS: UPDATE status='failed'<br/>error='heartbeat expired'<br/>workerId=null, leaseId=null<br/>completedAt, updatedAt
    end

    FS-->>UI: realtime: status='failed'
    UI-->>UI: render "heartbeat expired"

    Note over W2,UI: re-running requires user to re-queue<br/>(stale runs go to 'failed', not back to 'queued')
```

Two non-obvious details:
- **Any worker reaps any stale run.** Recovery does not require the original worker to come back.
- **Stale runs do not auto-retry.** Clearing `workerId`/`leaseId` *and* setting status='failed' means they're terminal; the user re-queues manually. This is intentional: auto-retry of a run that may have side-effected (filled a form, made an API call) is unsafe by default.

## 4. Authenticated artifact access (trace / screenshot / video)

Storage paths are not publicly readable. The UI proxies all artifact reads through `/api/artifacts/access`, which verifies the user's ID token, checks project membership, and streams the bytes from Storage via the Admin SDK.

```mermaid
sequenceDiagram
    actor User
    participant UI as UI (browser)
    participant API as /api/artifacts/access
    participant Auth as Firebase Auth
    participant FS as Firestore
    participant Storage as Firebase Storage

    User->>UI: click "View trace" on a run
    UI->>UI: get current ID token from Auth context
    UI->>API: GET ?path=traces/{projectId}/{runId}/{tcId}.zip<br/>Authorization: Bearer <ID token>

    API->>Auth: verifyIdToken(bearer) [Admin SDK]
    Auth-->>API: { uid } or throws

    API->>FS: read projects/{projectId}, check members[uid].role
    FS-->>API: role = 'owner' | 'viewer' | (none)

    alt user is a project member
        API->>Storage: read object at <path> [Admin SDK]
        Storage-->>API: stream of bytes
        API-->>UI: 200 application/zip (streamed)
        UI-->>User: open trace viewer (Playwright trace UI)
    else missing token / not a member
        API-->>UI: 401 / 403
        UI-->>User: "not authorized" toast
    end
```

The path is also validated against `lib/server/artifact-paths.ts` to make sure callers can't request arbitrary objects (e.g. `path=../../another-project/...`). Path validation belongs to the API route — Storage rules are a backstop, not the primary enforcement.
