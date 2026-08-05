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

console.log('=== INSPEÇÃO DO SELECT DE IDIOMA ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(2000);

  // Clicar lápis índice 3
  await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[id="edit-medium"]'));
    const btn = (svgs[3]?.parentElement?.closest('button') || svgs[3]?.parentElement);
    btn?.click();
  });
  await page.waitForTimeout(3000);

  // Clicar "+ Adicionar idioma"
  await page.evaluate(() => {
    const addSvg = document.querySelector('svg[id="add-medium"]');
    const btn = addSvg?.closest('button') || addSvg?.parentElement;
    btn?.click();
  });
  await page.waitForTimeout(3500);

  // Inspecionar TODOS os selects e suas opções
  const result = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.map((sel, i) => ({
      index: i,
      class: sel.getAttribute('class')?.slice(0, 60),
      id: sel.id,
      options: Array.from(sel.options).slice(0, 10).map(o => ({ value: o.value, text: o.text }))
    }));
  });

  console.log(`\nSelects encontrados: ${result.length}`);
  result.forEach(s => {
    console.log(`\n[Select ${s.index}] id="${s.id}" class="${s.class}"`);
    s.options.forEach(o => console.log(`  value="${o.value}" text="${o.text}"`));
  });

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
