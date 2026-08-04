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

console.log('Navegando para details/skills...');
await page.goto(`${profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000);

console.log('URL final:', page.url());

// Lista botões na página /details/skills/
const buttons = await page.$$('button[aria-label], a[aria-label]');
console.log(`Encontrados ${buttons.length} botões na página /details/skills/:`);
for (const b of buttons) {
  const aria = await b.getAttribute('aria-label');
  console.log(` - aria-label="${aria}"`);
}

await browser.close();
