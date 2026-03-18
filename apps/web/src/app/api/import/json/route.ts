import { NextResponse } from 'next/server';
import { CreateTestStepInput, CreateTestCaseInput, TestAction, SelectorType, AssertionType, AssertionOperator } from '@openAutomate/shared';

// Valid values for validation
const VALID_ACTIONS: TestAction[] = [
    'navigate', 'click', 'dblclick', 'rightclick', 'type', 'clear',
    'select', 'check', 'uncheck', 'hover', 'scroll', 'wait',
    'press', 'upload', 'assert', 'screenshot'
];

const VALID_SELECTOR_TYPES: SelectorType[] = ['css', 'xpath', 'text', 'testId'];

const VALID_ASSERTION_TYPES: AssertionType[] = [
    'visible', 'hidden', 'exists', 'notExists',
    'text', 'value', 'url', 'title', 'attribute'
];

const VALID_OPERATORS: AssertionOperator[] = ['equals', 'contains', 'startsWith', 'endsWith', 'matches'];

interface ValidationError {
    path: string;
    message: string;
}

interface ExternalTestStep {
    // Core fields
    action?: string;
    order?: number;
    description?: string;

    // Selector fields
    selector?: string;
    selectorType?: string;
    element?: string; // Alternative name for selector
    locator?: string; // Another alternative

    // Value fields
    value?: string;
    text?: string; // Alternative for 'value' in type actions
    url?: string; // Alternative for navigate action
    input?: string; // Another alternative

    // Assertion fields
    assertionType?: string;
    assertion?: string; // Alternative name
    expectedValue?: string;
    expected?: string; // Alternative name
    operator?: string;

    // Meta fields
    timeout?: number;
    wait?: number; // Alternative for timeout
    optional?: boolean;
    screenshot?: boolean;
}

interface ExternalTestCase {
    name?: string;
    title?: string; // Alternative name
    description?: string;
    steps?: ExternalTestStep[];
    priority?: string;
    tags?: string[];
}

function validateStep(step: ExternalTestStep, index: number): { step: CreateTestStepInput; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const path = `steps[${index}]`;

    // Normalize action
    const action = step.action?.toLowerCase() as TestAction;
    if (!action) {
        errors.push({ path: `${path}.action`, message: 'Action is required' });
    } else if (!VALID_ACTIONS.includes(action)) {
        errors.push({
            path: `${path}.action`,
            message: `Invalid action "${step.action}". Valid actions: ${VALID_ACTIONS.join(', ')}`
        });
    }

    // Normalize selector (accept multiple field names)
    const selector = step.selector || step.element || step.locator || '';

    // Normalize selectorType
    let selectorType: SelectorType = 'css';
    if (step.selectorType) {
        const normalizedType = step.selectorType.toLowerCase() as SelectorType;
        if (VALID_SELECTOR_TYPES.includes(normalizedType)) {
            selectorType = normalizedType;
        }
    }

    // Normalize value (accept multiple field names)
    let value = step.value || step.text || step.input || step.url || '';

    // For navigate action, use url if value is empty
    if (action === 'navigate' && !value && step.url) {
        value = step.url;
    }

    // Normalize assertion fields
    let assertionType: AssertionType | undefined;
    if (step.assertionType || step.assertion) {
        const rawType = (step.assertionType || step.assertion || '').toLowerCase();
        if (VALID_ASSERTION_TYPES.includes(rawType as AssertionType)) {
            assertionType = rawType as AssertionType;
        }
    }

    const expectedValue = step.expectedValue || step.expected || '';

    let operator: AssertionOperator | undefined;
    if (step.operator) {
        const rawOp = step.operator.toLowerCase();
        if (VALID_OPERATORS.includes(rawOp as AssertionOperator)) {
            operator = rawOp as AssertionOperator;
        }
    }

    // Normalize timeout
    const timeout = step.timeout || step.wait;

    const normalizedStep: CreateTestStepInput = {
        order: step.order || index + 1,
        action: action || 'click',
        selector,
        selectorType,
        value,
        description: step.description || '',
        timeout,
        optional: step.optional || false,
        screenshot: step.screenshot || false,
        assertionType,
        expectedValue: expectedValue || undefined,
        operator
    };

    return { step: normalizedStep, errors };
}

function validateTestCase(testCase: ExternalTestCase, index: number = 0): {
    testCase: CreateTestCaseInput | null;
    errors: ValidationError[]
} {
    const errors: ValidationError[] = [];
    const prefix = index > 0 ? `testCases[${index}]` : '';

    // Normalize name (accept 'name' or 'title')
    const name = testCase.name || testCase.title;
    if (!name) {
        errors.push({
            path: prefix ? `${prefix}.name` : 'name',
            message: 'Test case name is required'
        });
    }

    // Validate steps
    const steps: CreateTestStepInput[] = [];
    if (!testCase.steps || !Array.isArray(testCase.steps)) {
        errors.push({
            path: prefix ? `${prefix}.steps` : 'steps',
            message: 'Steps array is required'
        });
    } else if (testCase.steps.length === 0) {
        errors.push({
            path: prefix ? `${prefix}.steps` : 'steps',
            message: 'At least one step is required'
        });
    } else {
        testCase.steps.forEach((step, i) => {
            const { step: normalizedStep, errors: stepErrors } = validateStep(step, i);
            steps.push(normalizedStep);
            errors.push(...stepErrors.map(e => ({
                path: prefix ? `${prefix}.${e.path}` : e.path,
                message: e.message
            })));
        });
    }

    // If there are critical errors, return null
    if (!name || steps.length === 0) {
        return { testCase: null, errors };
    }

    const normalizedTestCase: CreateTestCaseInput = {
        projectId: '', // Will be set by caller
        name: name,
        description: testCase.description || '',
        priority: (['critical', 'high', 'medium', 'low'].includes(testCase.priority?.toLowerCase() || '')
            ? testCase.priority?.toLowerCase() as any
            : 'medium'),
        tags: testCase.tags || [],
        steps
    };

    return { testCase: normalizedTestCase, errors };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, suiteId, testCases: inputTestCases, testCase: singleTestCase } = body;

        // Validate projectId
        if (!projectId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'projectId is required',
                    validationErrors: [{ path: 'projectId', message: 'Project ID is required' }]
                },
                { status: 400 }
            );
        }

        // Accept either single testCase or array of testCases
        let testCasesToProcess: ExternalTestCase[] = [];

        if (singleTestCase) {
            testCasesToProcess = [singleTestCase];
        } else if (inputTestCases && Array.isArray(inputTestCases)) {
            testCasesToProcess = inputTestCases;
        } else if (body.name && body.steps) {
            // The entire body is a single test case
            testCasesToProcess = [body];
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request format. Provide either "testCase", "testCases" array, or a test case object with "name" and "steps".',
                    validationErrors: [{ path: 'root', message: 'No test cases found in request' }]
                },
                { status: 400 }
            );
        }

        if (testCasesToProcess.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No test cases to import',
                    validationErrors: [{ path: 'testCases', message: 'At least one test case is required' }]
                },
                { status: 400 }
            );
        }

        // Validate all test cases
        const validatedTestCases: CreateTestCaseInput[] = [];
        const allErrors: ValidationError[] = [];

        testCasesToProcess.forEach((tc, index) => {
            const { testCase, errors } = validateTestCase(tc, testCasesToProcess.length > 1 ? index : 0);
            allErrors.push(...errors);
            if (testCase) {
                testCase.projectId = projectId;
                if (suiteId) {
                    testCase.suiteId = suiteId;
                }
                validatedTestCases.push(testCase);
            }
        });

        // If there are critical errors (no valid test cases), return validation response
        if (validatedTestCases.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All test cases failed validation',
                    validationErrors: allErrors
                },
                { status: 400 }
            );
        }

        // Return validated test cases for preview (actual Firestore save happens in frontend)
        return NextResponse.json({
            success: true,
            data: {
                validatedTestCases,
                totalInput: testCasesToProcess.length,
                totalValid: validatedTestCases.length,
                warnings: allErrors.filter(e => !e.path.includes('.action') && !e.path.includes('.name'))
            }
        });

    } catch (error: any) {
        console.error('JSON Import API Error:', error);

        // Handle JSON parse errors specifically
        if (error instanceof SyntaxError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid JSON format. Please check your JSON syntax.',
                    validationErrors: [{ path: 'root', message: error.message }]
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to process import',
                validationErrors: []
            },
            { status: 500 }
        );
    }
}

// GET endpoint to return the expected JSON format
export async function GET() {
    const exampleFormat = {
        description: "OpenAutomate Test Case Import Format",
        usage: "POST to this endpoint with the following JSON structure",
        acceptedFormats: [
            {
                name: "Single test case (direct)",
                example: {
                    projectId: "your-project-id",
                    suiteId: "optional-suite-id",
                    name: "Test Login Flow",
                    description: "Verify user can log in successfully",
                    steps: [
                        { action: "navigate", value: "https://example.com/login" },
                        { action: "type", selector: "#email", value: "user@example.com" },
                        { action: "type", selector: "#password", value: "password123" },
                        { action: "click", selector: "button[type='submit']" },
                        { action: "assert", assertionType: "url", expectedValue: "/dashboard" }
                    ]
                }
            },
            {
                name: "Multiple test cases",
                example: {
                    projectId: "your-project-id",
                    testCases: [
                        { name: "Test 1", steps: [{ action: "navigate", value: "https://example.com" }] },
                        { name: "Test 2", steps: [{ action: "navigate", value: "https://example.com/about" }] }
                    ]
                }
            }
        ],
        validActions: VALID_ACTIONS,
        validSelectorTypes: VALID_SELECTOR_TYPES,
        validAssertionTypes: VALID_ASSERTION_TYPES,
        validOperators: VALID_OPERATORS,
        fieldAliases: {
            selector: ["selector", "element", "locator"],
            value: ["value", "text", "input", "url"],
            name: ["name", "title"],
            expectedValue: ["expectedValue", "expected"],
            assertionType: ["assertionType", "assertion"]
        }
    };

    return NextResponse.json(exampleFormat);
}
