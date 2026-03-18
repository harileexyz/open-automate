/**
 * OpenAutomate - Shared Constants
 */

// Firestore Collection Names
export const COLLECTIONS = {
    USERS: 'users',
    PROJECTS: 'projects',
    TEST_SUITES: 'testSuites',
    TEST_CASES: 'testCases',
    TEST_RUNS: 'testRuns',
    TEST_RESULTS: 'testResults',
    FEATURES: 'features',
} as const;

// Default Project Settings
export const DEFAULT_PROJECT_SETTINGS = {
    defaultBrowser: 'chromium' as const,
    defaultViewport: { width: 1280, height: 720 },
    screenshotOnFailure: true,
    videoRecording: false,
};

// Test Priorities with display info
export const TEST_PRIORITIES = [
    { value: 'critical', label: 'Critical', color: '#ef4444' },
    { value: 'high', label: 'High', color: '#f97316' },
    { value: 'medium', label: 'Medium', color: '#eab308' },
    { value: 'low', label: 'Low', color: '#22c55e' },
] as const;

// Test Case Statuses
export const TEST_STATUSES = [
    { value: 'draft', label: 'Draft', color: '#6b7280' },
    { value: 'active', label: 'Active', color: '#22c55e' },
    { value: 'deprecated', label: 'Deprecated', color: '#ef4444' },
] as const;

// Run Statuses
export const RUN_STATUSES = [
    { value: 'queued', label: 'Queued', color: '#6b7280' },
    { value: 'running', label: 'Running', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#22c55e' },
    { value: 'cancelled', label: 'Cancelled', color: '#f97316' },
    { value: 'failed', label: 'Failed', color: '#ef4444' },
] as const;

// Test Actions with display info
export const TEST_ACTIONS = [
    { value: 'navigate', label: 'Navigate', icon: 'globe', description: 'Go to URL' },
    { value: 'click', label: 'Click', icon: 'mouse-pointer', description: 'Click element' },
    { value: 'dblclick', label: 'Double Click', icon: 'mouse-pointer-2', description: 'Double click element' },
    { value: 'rightclick', label: 'Right Click', icon: 'menu', description: 'Right click / context menu' },
    { value: 'type', label: 'Type', icon: 'keyboard', description: 'Type text into input' },
    { value: 'clear', label: 'Clear', icon: 'eraser', description: 'Clear input field' },
    { value: 'select', label: 'Select', icon: 'chevron-down', description: 'Select dropdown option' },
    { value: 'check', label: 'Check', icon: 'check-square', description: 'Check checkbox' },
    { value: 'uncheck', label: 'Uncheck', icon: 'square', description: 'Uncheck checkbox' },
    { value: 'hover', label: 'Hover', icon: 'move', description: 'Mouse hover over element' },
    { value: 'scroll', label: 'Scroll', icon: 'scroll', description: 'Scroll to element' },
    { value: 'wait', label: 'Wait', icon: 'clock', description: 'Wait for time/element' },
    { value: 'press', label: 'Press Key', icon: 'command', description: 'Press keyboard key' },
    { value: 'upload', label: 'Upload', icon: 'upload', description: 'Upload file' },
    { value: 'assert', label: 'Assert', icon: 'check-circle', description: 'Make an assertion' },
    { value: 'screenshot', label: 'Screenshot', icon: 'camera', description: 'Take screenshot' },
] as const;

// Assertion Types
export const ASSERTION_TYPES = [
    { value: 'visible', label: 'Is Visible', description: 'Element is visible on page' },
    { value: 'hidden', label: 'Is Hidden', description: 'Element is hidden' },
    { value: 'exists', label: 'Exists', description: 'Element exists in DOM' },
    { value: 'notExists', label: 'Does Not Exist', description: 'Element does not exist' },
    { value: 'text', label: 'Has Text', description: 'Element contains text' },
    { value: 'value', label: 'Has Value', description: 'Input has value' },
    { value: 'url', label: 'URL Matches', description: 'Current URL matches' },
    { value: 'title', label: 'Title Matches', description: 'Page title matches' },
    { value: 'attribute', label: 'Has Attribute', description: 'Element has attribute' },
] as const;

// Browsers
export const BROWSERS = [
    { value: 'chromium', label: 'Chrome', icon: 'chrome' },
    { value: 'firefox', label: 'Firefox', icon: 'firefox' },
    { value: 'webkit', label: 'Safari', icon: 'safari' },
] as const;

// Common Viewport Presets
export const VIEWPORT_PRESETS = [
    { name: 'Desktop HD', width: 1920, height: 1080 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Tablet (Landscape)', width: 1024, height: 768 },
    { name: 'Tablet (Portrait)', width: 768, height: 1024 },
    { name: 'Mobile (Large)', width: 414, height: 896 },
    { name: 'Mobile (Medium)', width: 375, height: 812 },
    { name: 'Mobile (Small)', width: 320, height: 568 },
] as const;
