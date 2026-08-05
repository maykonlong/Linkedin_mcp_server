import { chromium } from 'playwright';
import { readFileSync } from 'fs';

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

try {
  await page.goto(`${profileUrl}/details/education/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Clicar no botão adicionar (+)
  await page.evaluate(() => {
    const addSvgs = Array.from(document.querySelectorAll('svg[id="add-medium"]'));
    if (addSvgs[0]) {
      const btn = addSvgs[0].closest('button') || addSvgs[0].closest('a');
      btn?.click();
    }
  });
  await page.waitForTimeout(5000); // Mais tempo para o modal renderizar

  const htmlDump = await page.evaluate(() => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return 'MODAL (dialog) NÃO ENCONTRADO!';
    
    // Pega todos os labels e inputs dentro do dialog
    const elements = Array.from(dialog.querySelectorAll('label, input, textarea, select, button'));
    let map = [];
    elements.forEach(el => {
      if (el.tagName === 'LABEL') {
        map.push(`LABEL: ${el.innerText.trim()} (for: ${el.getAttribute('for')})`);
      } else if (el.tagName === 'INPUT') {
        map.push(`INPUT [${el.type}]: id="${el.id}" class="${el.className}" placeholder="${el.getAttribute('placeholder') || ''}"`);
      } else if (el.tagName === 'TEXTAREA') {
        map.push(`TEXTAREA: id="${el.id}" class="${el.className}"`);
      } else if (el.tagName === 'SELECT') {
        map.push(`SELECT: id="${el.id}" class="${el.className}"`);
      }
    });
    return map.join('\n');
  });

  console.log('\n--- ESTRUTURA DO MODAL ---');
  console.log(htmlDump);

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
