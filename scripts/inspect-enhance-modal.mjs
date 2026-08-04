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

// Clica em "Aprimorar perfil"
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const target = btns.find(b => b.innerText.includes('Aprimorar perfil') || b.innerText.includes('Enhance profile'));
  if (target) target.click();
});

await page.waitForTimeout(3000);

console.log('=== ITENS NO MODAL DE APRIMORAR PERFIL ===');
const modalItems = await page.evaluate(() => {
  const els = Array.from(document.querySelectorAll('.artdeco-modal button, .artdeco-modal a, .artdeco-modal span, [role="dialog"] button, [role="dialog"] a'));
  return els.map(el => ({
    tag: el.tagName,
    text: (el.textContent || '').trim().replace(/\n/g, ' '),
    className: el.className
  })).filter(item => item.text.length > 0);
});

console.log(JSON.stringify(modalItems, null, 2));
console.log('=== FIM ===');

await browser.close();
