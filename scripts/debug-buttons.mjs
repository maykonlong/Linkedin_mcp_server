import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';

const sessionFile = './sessions/session.json';
const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}
const profileUrl = config.profile_url.replace(/\/+$/, '');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

const buttons = await page.$$('button[aria-label], a[aria-label]');
console.log('=== TODOS OS ARIA-LABELS ENCONTRADOS NO PERFIL ===');
for (let i = 0; i < buttons.length; i++) {
  const aria = await buttons[i].getAttribute('aria-label');
  const text = await buttons[i].innerText().catch(() => '');
  console.log(`[${i}] aria-label="${aria}" | text="${text.replace(/\n/g, ' ')}"`);
}
console.log('=== FIM ===');

await browser.close();
