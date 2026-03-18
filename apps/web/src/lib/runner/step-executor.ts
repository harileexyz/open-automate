import { Page } from 'playwright';

// Helper function for assertion operators
export function matchValue(actual: any, expected: string, operator: string): boolean {
    const act = actual !== undefined && actual !== null ? String(actual) : '';
    switch (operator) {
        case 'equals':
            return act === expected;
        case 'contains':
            return act.includes(expected);
        case 'startsWith':
            return act.startsWith(expected);
        case 'endsWith':
            return act.endsWith(expected);
        case 'matches':
            try {
                return new RegExp(expected).test(act);
            } catch {
                return false;
            }
        default:
            return act === expected;
    }
}

export async function executeStep(page: Page, step: any, stepValue: string, stepSelector: string, substituteVariables: Function) {
    if (step.action === 'navigate') {
        let url = stepValue || '';
        // If the URL is formatted as a markdown link [Text](URL), extract the URL part
        const mdLinkMatch = url.match(/\[.*\]\((.*)\)/);
        if (mdLinkMatch && mdLinkMatch[1]) {
            url = mdLinkMatch[1];
        }
        // Wait until there are no network connections for at least 500 ms
        await page.goto(url, { waitUntil: 'networkidle' });
    } else if (step.action === 'click') {
        // Bypass actionability checks for faster execution
        await page.click(stepSelector || '', { force: true });
    } else if (step.action === 'type') {
        await page.fill(stepSelector || '', stepValue || '');
    } else if (step.action === 'wait') {
        await page.waitForTimeout(parseInt(stepValue || '1000'));
    } else if (step.action === 'assert') {
        const assertionType = step.assertionType || 'visible';
        const expectedValue = substituteVariables(step.expectedValue);
        const operator = step.operator || 'equals';

        switch (assertionType) {
            case 'visible':
                await page.waitForSelector(stepSelector || '', { state: 'visible', timeout: 5000 });
                break;
            case 'hidden':
                await page.waitForSelector(stepSelector || '', { state: 'hidden', timeout: 5000 });
                break;
            case 'exists':
                await page.waitForSelector(stepSelector || '', { state: 'attached', timeout: 5000 });
                break;
            case 'notExists':
                await page.waitForSelector(stepSelector || '', { state: 'detached', timeout: 5000 });
                break;
            case 'text': {
                const element = await page.waitForSelector(stepSelector || '', { timeout: 5000 });
                const actualText = await element?.textContent() || '';
                if (!matchValue(actualText, expectedValue || '', operator)) {
                    throw new Error(`Text assertion failed: expected "${expectedValue}" (${operator}), got "${actualText}"`);
                }
                break;
            }
            case 'value': {
                const inputValue = await page.inputValue(stepSelector || '');
                if (!matchValue(inputValue, expectedValue || '', operator)) {
                    throw new Error(`Value assertion failed: expected "${expectedValue}" (${operator}), got "${inputValue}"`);
                }
                break;
            }
            case 'url': {
                if (!matchValue(page.url(), expectedValue || '', operator)) {
                    throw new Error(`URL assertion failed: expected "${expectedValue}" (${operator}), got "${page.url()}"`);
                }
                break;
            }
            case 'title': {
                const title = await page.title();
                if (!matchValue(title, expectedValue || '', operator)) {
                    throw new Error(`Title assertion failed: expected "${expectedValue}" (${operator}), got "${title}"`);
                }
                break;
            }
            case 'attribute': {
                const attrName = stepValue || 'class';
                const element = await page.waitForSelector(stepSelector || '', { timeout: 5000 });
                const attrValue = await element?.getAttribute(attrName) || '';
                if (!matchValue(attrValue, expectedValue || '', operator)) {
                    throw new Error(`Attribute "${attrName}" assertion failed: expected "${expectedValue}" (${operator}), got "${attrValue}"`);
                }
                break;
            }
        }
    }
}
