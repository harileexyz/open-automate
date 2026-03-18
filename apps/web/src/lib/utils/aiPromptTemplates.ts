/**
 * AI Prompt Templates for External Test Case Generation
 * These templates help users generate compatible JSON from external AIs like ChatGPT, Claude, etc.
 */

export const OPENAUTOMATO_SCHEMA = `{
    "name": "string (required) - Short descriptive test name",
    "description": "string (optional) - What this test covers",
    "priority": "'critical' | 'high' | 'medium' | 'low' (optional, defaults to 'medium')",
    "tags": "string[] (optional) - Tags for categorization",
    "steps": [
        {
            "order": "number (optional) - Step order, defaults to array index + 1",
            "action": "'navigate' | 'click' | 'type' | 'select' | 'wait' | 'assert' | 'screenshot' | 'hover' | 'press' (required)",
            "selector": "string - CSS selector, XPath, or testId (required for most actions)",
            "selectorType": "'css' | 'xpath' | 'text' | 'testId' (optional, defaults to 'css')",
            "value": "string - Value for type/navigate/wait actions",
            "description": "string - Human readable step description",
            "assertionType": "'visible' | 'hidden' | 'text' | 'value' | 'url' | 'title' (for assert action)",
            "expectedValue": "string - Expected value for assertions",
            "operator": "'equals' | 'contains' | 'startsWith' | 'endsWith' (optional)",
            "timeout": "number - Wait timeout in milliseconds (optional)",
            "optional": "boolean - If true, test continues even if step fails (optional)"
        }
    ]
}`;

export const CHATGPT_PROMPT = `You are a QA Automation Engineer. Generate test cases in JSON format for the following web application or feature.

OUTPUT FORMAT (respond ONLY with valid JSON, no explanations):
{
    "name": "Short descriptive test name",
    "description": "What this test covers",
    "steps": [
        {
            "action": "navigate" | "click" | "type" | "select" | "wait" | "assert" | "hover" | "press",
            "selector": "CSS selector for the element (e.g., #login-btn, .submit-form, input[name='email'])",
            "value": "Value for type/navigate actions",
            "description": "Human readable step description",
            "assertionType": "visible" | "text" | "url" | "title" (only for assert action),
            "expectedValue": "Expected value for assertions"
        }
    ]
}

RULES:
1. Always start with a 'navigate' action to the page URL
2. Use robust CSS selectors (prefer IDs, then unique classes, then attributes)
3. For login flows, use placeholder credentials like 'test@example.com' and 'password123'
4. Include at least one assertion at the end to verify success
5. Keep step descriptions clear and actionable

GENERATE TEST CASES FOR:`;

export const CLAUDE_PROMPT = `<task>Generate automated test cases in JSON format for web application testing.</task>

<output_format>
Respond with ONLY valid JSON. No markdown, no explanations, just JSON.

Single test case:
{
    "name": "Test case name",
    "description": "Test description",
    "steps": [
        {"action": "navigate", "value": "https://example.com"},
        {"action": "click", "selector": "#button"},
        {"action": "type", "selector": "input#email", "value": "test@example.com"},
        {"action": "assert", "assertionType": "visible", "selector": ".success"}
    ]
}

Multiple test cases:
{
    "testCases": [
        {"name": "Test 1", "steps": [...]},
        {"name": "Test 2", "steps": [...]}
    ]
}
</output_format>

<valid_actions>
- navigate: Go to URL (use "value" for URL)
- click: Click element (use "selector")
- type: Type text (use "selector" and "value")
- select: Select dropdown option (use "selector" and "value")
- wait: Wait for time or element (use "timeout" in ms or "selector")
- assert: Verify something (use "assertionType": visible|text|url|title, "selector", "expectedValue")
- hover: Hover over element
- press: Press keyboard key (use "value" for key like "Enter")
</valid_actions>

<generate_for>`;

export const EXAMPLE_OUTPUT = {
    name: "User Login Flow",
    description: "Verify that users can successfully log into the application",
    priority: "high",
    steps: [
        {
            action: "navigate",
            value: "https://example.com/login",
            description: "Navigate to login page"
        },
        {
            action: "wait",
            timeout: 2000,
            description: "Wait for page to fully load"
        },
        {
            action: "type",
            selector: "input[name='email']",
            value: "test@example.com",
            description: "Enter email address"
        },
        {
            action: "type",
            selector: "input[name='password']",
            value: "password123",
            description: "Enter password"
        },
        {
            action: "click",
            selector: "button[type='submit']",
            description: "Click login button"
        },
        {
            action: "assert",
            assertionType: "url",
            expectedValue: "/dashboard",
            operator: "contains",
            description: "Verify redirect to dashboard"
        },
        {
            action: "assert",
            assertionType: "visible",
            selector: ".welcome-message",
            description: "Verify welcome message is visible"
        }
    ]
};

export const MULTI_TEST_EXAMPLE = {
    testCases: [
        {
            name: "Successful Login",
            description: "Test valid user login",
            steps: [
                { action: "navigate", value: "https://example.com/login" },
                { action: "type", selector: "#email", value: "valid@user.com" },
                { action: "type", selector: "#password", value: "validpass" },
                { action: "click", selector: "button[type='submit']" },
                { action: "assert", assertionType: "url", expectedValue: "/dashboard", operator: "contains" }
            ]
        },
        {
            name: "Failed Login - Invalid Password",
            description: "Test error message for invalid password",
            steps: [
                { action: "navigate", value: "https://example.com/login" },
                { action: "type", selector: "#email", value: "valid@user.com" },
                { action: "type", selector: "#password", value: "wrongpass" },
                { action: "click", selector: "button[type='submit']" },
                { action: "assert", assertionType: "visible", selector: ".error-message" },
                { action: "assert", assertionType: "text", selector: ".error-message", expectedValue: "Invalid credentials" }
            ]
        }
    ]
};

export function getPromptForAI(aiType: 'chatgpt' | 'claude' | 'general', featureDescription: string): string {
    switch (aiType) {
        case 'chatgpt':
            return `${CHATGPT_PROMPT}\n${featureDescription}`;
        case 'claude':
            return `${CLAUDE_PROMPT}\n${featureDescription}\n</generate_for>`;
        default:
            return `Generate test cases in JSON format for: ${featureDescription}\n\nExpected format:\n${OPENAUTOMATO_SCHEMA}`;
    }
}
