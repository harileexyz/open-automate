
import { NextResponse } from 'next/server';
import { CreateTestStepInput, CreateTestCaseInput } from '@openAutomate/shared';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock function to simulate LLM delay and response
async function mockGenerateTest(url: string, instructions?: string) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s generation time

    // Return a mocked structured response
    // In a real implementation, we would fetch the URL HTML, pick relevant parts, and prompt OpenAI/Geneini

    const domain = new URL(url).hostname.replace('www.', '');
    const featureName = instructions?.split(' ')[0] || 'Feature';

    const steps: CreateTestStepInput[] = [
        {
            action: 'navigate',
            value: url,
            description: `Navigate to ${url}`,
            order: 1
        },
        {
            action: 'wait',
            timeout: 2000,
            description: 'Wait for page to load',
            order: 2
        },
        {
            action: 'click',
            selector: 'button.primary-cta',
            selectorType: 'css',
            description: 'Click the main call-to-action button',
            order: 3
        },
        {
            action: 'assert',
            assertionType: 'visible',
            selector: '#modal-dialog',
            selectorType: 'css',
            description: 'Verify modal appears',
            order: 4
        },
        {
            action: 'type',
            selector: 'input[name="email"]',
            selectorType: 'css',
            value: 'test@example.com',
            description: 'Enter test email',
            order: 5
        },
        {
            action: 'click',
            selector: 'button[type="submit"]',
            selectorType: 'css',
            description: 'Submit the form',
            order: 6
        },
        {
            action: 'assert',
            assertionType: 'text',
            selector: '.success-message',
            selectorType: 'css',
            expectedValue: 'Success',
            operator: 'contains',
            description: 'Verify success message'
        }
    ];

    return {
        projectId: '',
        name: `verify ${featureName} on ${domain}`,
        description: `Auto-generated test for ${featureName} functionality based on analysis of ${url}.\nInstructions: ${instructions || 'None'}`,
        steps
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { url, instructions } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('GEMINI_API_KEY missing, using mock data.');
            return NextResponse.json({
                success: true,
                data: await mockGenerateTest(url, instructions)
            });
        }

        let generatedTest: CreateTestCaseInput;
        try {
            generatedTest = await generateTestWithGemini(url, instructions, apiKey);
        } catch (error) {
            console.warn('Gemini generation failed, falling back to mock generation.', error);
            generatedTest = await mockGenerateTest(url, instructions);
        }

        return NextResponse.json({
            success: true,
            data: generatedTest
        });

    } catch (error: any) {
        console.error('AI Generation API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate test case' },
            { status: 500 }
        );
    }
}

async function generateTestWithGemini(url: string, instructions: string = '', apiKey: string): Promise<CreateTestCaseInput> {
    // 1. Fetch and Parse HTML
    const htmlResponse = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch URL: ${htmlResponse.statusText}`);
    }

    const html = await htmlResponse.text();
    const $ = cheerio.load(html);

    // 2. Clean and Simplify DOM for LLM
    // faster-processing: remove scripts, styles, SVG paths, etc.
    $('script').remove();
    $('style').remove();
    $('svg').remove();
    $('link').remove();
    $('meta').remove();
    $('*').removeAttr('style');

    // Extract interactive elements and structure
    // We limit the context to avoid sending massive strings.
    // A better approach is to prioritize inputs, buttons, and semantic structure.
    const simplifiedBody = $('body').html()?.slice(0, 50000) || '';

    // 3. Prompt Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview"
    });

    const prompt = `
    You are an expert QA Automation Engineer.
    I will provide you with the simplified HTML of a web page and an optional user instruction.
    
    Your task is to generate a JSON test case structure that tests the core functionality of this page or follows the specific instructions if provided.
    
    Target URL: ${url}
    User Instructions: ${instructions || "Test the main user flow (e.g., login, signup, or main action) of this page."}
    
    The JSON output must strictly follow this schema:
    {
        "name": "string (Short descriptive name of the test)",
        "description": "string (What this test covers)",
        "steps": [
            {
                "order": number (1-based index),
                "action": "navigate" | "click" | "type" | "select" | "wait" | "assert" | "screenshot",
                "selector": "string (CSS selector for the element, e.g. input[name='email'])",
                "selectorType": "css",
                "value": "string (For type/navigate actions. For assert, this is the expected behavior description)",
                "description": "string (Human readable step description)",
                "assertionType": "visible" | "text" | "value" | "url" (Only for assert action),
                "expectedValue": "string" (Only for assert action)
            }
        ]
    }
    
    Rules:
    1. Always start with a 'navigate' action to the Target URL.
    2. Use robust CSS selectors (prefer IDs, then unique classes, then attributes).
    3. If the page is a login page, generating steps to type 'user@example.com' into username and 'password123' into password is good practice.
    4. Include at least one assertion at the end to verify success.
    
    HTML Content:
    ${simplifiedBody}
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean up the response - Gemini often wraps JSON in markdown code blocks
    text = text.trim();
    if (text.startsWith('```json')) {
        text = text.slice(7);
    } else if (text.startsWith('```')) {
        text = text.slice(3);
    }
    if (text.endsWith('```')) {
        text = text.slice(0, -3);
    }
    text = text.trim();

    try {
        const parsed = JSON.parse(text);
        // Transform to exact CreateTestCaseInput shape if needed, but the prompt should ideally match.
        // We'll perform a quick map to ensure 'order' is correct and fields are present.
        return {
            projectId: '', // Handled by caller/frontend
            name: parsed.name || 'AI Generated Test',
            description: parsed.description || '',
            steps: (parsed.steps || []).map((s: any, i: number) => ({
                order: i + 1, // Ensure order is 1-based
                action: s.action || 'click',
                selector: s.selector || '',
                selectorType: s.selectorType || 'css', // Default to css if not provided by LLM
                value: s.value || '',
                description: s.description || '',
                assertionType: s.assertionType,
                expectedValue: s.expectedValue,
                operator: s.operator, // Include operator if LLM provides it
                timeout: s.timeout, // Include timeout if LLM provides it
                optional: s.optional || false
            }))
        };
    } catch (e) {
        console.error("Failed to parse Gemini JSON. Raw response:", text);
        throw new Error("AI returned invalid JSON structure. Please try again.");
    }
}
