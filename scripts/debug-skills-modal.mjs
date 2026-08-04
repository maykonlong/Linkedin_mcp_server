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

// Procura o botão "Adicionar seção" na seção .ph5 do perfil
const buttons = await page.$$('.ph5 button, main section:first-of-type button');
console.log('=== BOTÕES NA SEÇÃO DO TOPO ===');
for (const b of buttons) {
  const text = (await b.innerText().catch(() => '')).replace(/\n/g, ' ');
  const aria = (await b.getAttribute('aria-label').catch(() => '')) || '';
  console.log(`text="${text}" | aria="${aria}"`);
  if (text.toLowerCase().includes('adicionar') || text.toLowerCase().includes('add') || aria.toLowerCase().includes('seção')) {
    await b.click();
    console.log('[OK] Clicado botão de adicionar seção:', text);
    break;
  }
}

await page.waitForTimeout(3000);

// Imprime opções visíveis no modal/menu de seções
const options = await page.$$('.artdeco-modal button, .artdeco-dropdown button, [role="button"], span');
console.log('\n=== OPÇÕES NO MENU/MODAL ===');
for (const opt of options) {
  const t = (await opt.innerText().catch(() => '')).replace(/\n/g, ' ');
  if (t.length > 2 && (t.includes('Competência') || t.includes('Skill') || t.includes('Recomendad') || t.includes('Principal') || t.includes('Adicionar'))) {
    console.log(`option text="${t.substring(0, 60)}"`);
  }
}
console.log('=== FIM ===');

await browser.close();
