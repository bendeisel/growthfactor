import { chromium } from 'playwright';
const OUT = '/tmp/claude-0/-home-user-growthfactor/7fddcffa-0948-553c-8110-640cbdc92eca/scratchpad/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1720, height: 1000 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.getByLabel('Password').fill('let-me-in-please');
await page.getByRole('button', { name: 'Sign in' }).click();
await page.waitForURL('http://localhost:3000/', { timeout: 30000 });
await page.waitForTimeout(3500);
// what's in the selector now?
const options = await page.getByLabel('Choose a model').locator('option').allTextContents();
console.log('models offered:', JSON.stringify(options, null, 1));
// delegate control should be hidden with only... two models, so it shows
console.log('delegate visible:', await page.getByText('Delegate').isVisible().catch(() => false));
await page.screenshot({ path: OUT + 'v4-full.png' });
// send a turn with no key -> should name ANTHROPIC_API_KEY
await page.getByPlaceholder(/^Ask /).fill('Pull the numbers for every business.');
await page.keyboard.press('Enter');
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + 'v4-nokey.png', clip: { x: 425, y: 250, width: 830, height: 400 } });
console.log('errors:', JSON.stringify(errors));
await browser.close();
