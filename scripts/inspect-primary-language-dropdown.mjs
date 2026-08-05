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

console.log('=== INSPEÇÃO DO DROPDOWN DE IDIOMA PRINCIPAL ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(2000);

  // Clicar lápis índice 3 (Idioma do perfil)
  console.log('Clicando no lápis de idioma...');
  await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[id="edit-medium"]'));
    const btn = (svgs[3]?.parentElement?.closest('button') || svgs[3]?.parentElement);
    btn?.click();
  });
  await page.waitForTimeout(3000);

  // Inspecionar dropdown de idioma principal
  const result = await page.evaluate(() => {
    // Procurar o SVG caret-small e o texto próximo
    const carets = Array.from(document.querySelectorAll('svg[id="caret-small"]'));
    const selects = Array.from(document.querySelectorAll('select'));
    
    const dropdownInfo = carets.map((c, i) => {
      const parentBtn = c.closest('button') || c.closest('div');
      return {
        index: i,
        parentTag: parentBtn?.tagName,
        ariaLabel: parentBtn?.getAttribute('aria-label'),
        text: parentBtn?.innerText?.trim().replace(/\n/g, ' ')
      };
    });

    const selectInfo = selects.map((s, i) => ({
      index: i,
      id: s.id,
      className: s.className,
      options: Array.from(s.options).map(o => o.text).join(', ')
    }));

    return { dropdownInfo, selectInfo };
  });

  console.log('\n--- Carets encontrados (Custom Dropdowns) ---');
  console.log(JSON.stringify(result.dropdownInfo, null, 2));
  console.log('\n--- Selects nativos encontrados ---');
  console.log(JSON.stringify(result.selectInfo, null, 2));

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
