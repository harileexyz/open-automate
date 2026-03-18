/**
 * OpenAutomate - Shared Type Definitions
 * Core data models for the test automation platform
 */

// ============================================================================
// Base Types
// ============================================================================

export interface Timestamp {
    seconds: number;
    nanoseconds: number;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// Project Types
// ============================================================================

export interface ProjectSettings {
    defaultBrowser: BrowserType;
    defaultViewport: Viewport;
    screenshotOnFailure: boolean;
    videoRecording: boolean;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    baseUrl: string;
    ownerId: string;
    members: string[];
    idPrefix: string; // e.g., "OA" for "OpenAutomate"
    lastTestNumber: number; // For sequential ID generation (e.g., OA-1, OA-2)
    settings: ProjectSettings;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface Viewport {
    width: number;
    height: number;
}

// ============================================================================
// Test Suite Types
// ============================================================================

export interface TestSuite {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    tags: string[];
    parentSuiteId?: string;
    order: number;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// Test Case Types
// ============================================================================

export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';
export type TestCaseStatus = 'draft' | 'active' | 'deprecated';

export type TestAction =
    | 'navigate'
    | 'click'
    | 'dblclick'
    | 'rightclick'
    | 'type'
    | 'clear'
    | 'select'
    | 'check'
    | 'uncheck'
    | 'hover'
    | 'scroll'
    | 'wait'
    | 'press'
    | 'upload'
    | 'assert'
    | 'screenshot';

export type SelectorType = 'css' | 'xpath' | 'text' | 'testId';

export type AssertionType =
    | 'visible'
    | 'hidden'
    | 'exists'
    | 'notExists'
    | 'text'
    | 'value'
    | 'url'
    | 'title'
    | 'attribute';

export type AssertionOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches';

export interface TestStep {
    id: string;
    order: number;
    action: TestAction;
    // Automation fields
    selector?: string;
    selectorType?: SelectorType;
    value?: string;
    // Manual testing fields
    description?: string; // High-level description
    manualAction?: string; // Detailed manual instruction
    expectedResult?: string; // What the tester should see
    // Meta fields
    screenshot?: boolean;
    timeout?: number;
    optional?: boolean;
    // For assertions
    assertionType?: AssertionType;
    expectedValue?: string;
    operator?: AssertionOperator;
}

export interface TestCase {
    id: string;
    projectId: string;
    suiteId: string;
    testId: string; // User-facing ID (e.g., OA-1)
    name: string;
    description?: string;
    priority: TestCasePriority;
    status: TestCaseStatus;
    tags: string[];
    preconditions?: string;
    expectedResult?: string;
    steps: TestStep[];
    estimatedDuration?: number;
    createdBy: string;
    lastEditedBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// Test Run Types
// ============================================================================

export type RunTriggerType = 'manual' | 'scheduled' | 'webhook';
export type RunStatus = 'queued' | 'starting' | 'running' | 'completed' | 'cancelled' | 'failed';
export type ExecutorType = 'local' | 'cloud';

export interface RunScope {
    type: 'project' | 'suite' | 'testCase' | 'selection';
    ids: string[];
}

export interface RunEnvironment {
    browser: BrowserType;
    viewport: Viewport;
    baseUrl: string;
    headless: boolean;
}

export interface RunProgress {
    total: number;
    completed: number;
    passed: number;
    failed: number;
    skipped: number;
}

export interface ExecutionAgent {
    type: ExecutorType;
    agentId?: string;
}

export interface TestRun {
    id: string;
    projectId: string;
    name?: string;
    triggeredBy: string;
    triggerType: RunTriggerType;
    scope: RunScope;
    environment: RunEnvironment;
    status: RunStatus;
    progress: RunProgress;
    queuedAt: Timestamp;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    duration?: number;
    executionAgent: ExecutionAgent;
    recordVideo?: boolean;
    traceUrl?: string;
    videoUrl?: string;
    tracePath?: string;
    videoPath?: string;
}

// ============================================================================
// Test Result Types
// ============================================================================

export type ResultStatus = 'passed' | 'failed' | 'skipped' | 'error';

export interface ResultError {
    message: string;
    stack?: string;
    stepId?: string;
}

export interface ResultArtifacts {
    screenshots: string[];
    videoUrl?: string;
    traceUrl?: string;
    screenshotPaths?: string[];
    videoPath?: string;
    tracePath?: string;
    logs?: string;
}

export interface StepResult {
    stepId: string;
    status: ResultStatus;
    duration: number;
    error?: string;
    screenshotUrl?: string;
    screenshotPath?: string;
}

export interface TestResult {
    id: string;
    runId: string;
    testCaseId: string;
    projectId: string;
    status: ResultStatus;
    startedAt: Timestamp;
    completedAt: Timestamp;
    duration: number;
    stepResults: StepResult[];
    error?: ResultError;
    artifacts: ResultArtifacts;
}

// ============================================================================
// Feature/Requirement Mapping Types
// ============================================================================

export interface Feature {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    externalId?: string;
    testCaseIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// Form/Input Types (for UI)
// ============================================================================

export interface CreateProjectInput {
    name: string;
    description?: string;
    baseUrl: string;
}

export interface CreateTestSuiteInput {
    projectId: string;
    name: string;
    description?: string;
    tags?: string[];
    parentSuiteId?: string;
}

export interface CreateTestCaseInput {
    projectId: string;
    suiteId?: string;
    name: string;
    description?: string;
    priority?: TestCasePriority;
    tags?: string[];
    preconditions?: string;
    expectedResult?: string;
    steps?: CreateTestStepInput[];
}

export interface CreateTestStepInput {
    order?: number;
    action: TestAction;
    selector?: string;
    selectorType?: SelectorType;
    value?: string;
    description?: string;
    screenshot?: boolean;
    timeout?: number;
    optional?: boolean;
    assertionType?: AssertionType;
    expectedValue?: string;
    operator?: AssertionOperator;
}
