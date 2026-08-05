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

console.log('=== INSPEÇÃO: MAPEANDO SVG LÁPIS E CARDS DO PERFIL ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const result = await page.evaluate(() => {
    const info = [];

    // Todos os SVG com id="edit-medium"
    const allSVGs = document.querySelectorAll('svg[id="edit-medium"]');
    allSVGs.forEach((svg, i) => {
      const btn = svg.closest('button') || svg.closest('a') || svg.parentElement;
      const parentText = btn?.closest('section, div, aside')?.innerText?.slice(0, 120) || '';
      info.push({
        index: i,
        svgClass: svg.getAttribute('class'),
        btnAriaLabel: btn?.getAttribute('aria-label') || '',
        parentText: parentText.trim().replace(/\n/g, ' ')
      });
    });

    return info;
  });

  console.log(`\nEncontrados ${result.length} SVG edit-medium na página:\n`);
  result.forEach(r => {
    console.log(`[SVG ${r.index}]`);
    console.log(`  Classe SVG: ${r.svgClass}`);
    console.log(`  aria-label: ${r.btnAriaLabel}`);
    console.log(`  Contexto: ${r.parentText}`);
    console.log('');
  });

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
