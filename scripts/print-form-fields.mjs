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
await page.waitForTimeout(3000);

const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
await editBtn.click();
await page.waitForTimeout(3000);

const fields = await page.$$('input, textarea, select');
console.log(`=== TODOS OS ${fields.length} CAMPOS DO FORMULÁRIO ===`);

for (let i = 0; i < fields.length; i++) {
  const f = fields[i];
  const tag = await page.evaluate(el => el.tagName, f);
  const id = await f.getAttribute('id') || '';
  const name = await f.getAttribute('name') || '';
  const type = await f.getAttribute('type') || '';
  const val = await f.inputValue().catch(() => '');
  console.log(`[${i}] tag=${tag} type=${type} id="${id}" name="${name}" val="${val}"`);
}

console.log('=== FIM ===');
await browser.close();
