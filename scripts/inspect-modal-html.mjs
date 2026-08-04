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
await page.waitForTimeout(3500);

// Extrai HTML completo dos elementos dentro da classe artdeco-modal
const modalHtml = await page.evaluate(() => {
  const modal = document.querySelector('.artdeco-modal, [role="dialog"]');
  if (!modal) return 'MODAL_NOT_FOUND';
  
  const fields = Array.from(modal.querySelectorAll('input, textarea, select, [contenteditable="true"]'));
  return fields.map((f, i) => {
    return `[${i}] tag=${f.tagName} id="${f.id}" name="${f.name || ''}" val="${f.value || f.textContent || ''}" placeholder="${f.getAttribute('placeholder') || ''}" aria="${f.getAttribute('aria-label') || ''}"`;
  }).join('\n');
});

console.log('=== CAMPOS DO MODAL ===');
console.log(modalHtml);
console.log('=== FIM ===');

await browser.close();
