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
const SKILL_NAME = 'Vibe Coding';

console.log('=== INSPECIONAR EDIÇÃO DE COMPETÊNCIA ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(`${profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const editButtons = await page.$$(`a[aria-label*="Editar ${SKILL_NAME}"]`);
  if (editButtons.length === 0) {
    console.log(`❌ Nenhuma competência encontrada com o nome: ${SKILL_NAME}`);
    process.exit(0);
  }

  await editButtons[0].click();
  await page.waitForTimeout(3000);

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(b => ({
      tagName: b.tagName,
      text: b.innerText.trim(),
      ariaLabel: b.getAttribute('aria-label') || 'null',
      className: b.className
    })).filter(b => b.text || b.ariaLabel !== 'null');
  });

  console.log('--- BOTÕES E LINKS ENCONTRADOS ---');
  for (const b of buttons) {
      if (b.text.toLowerCase().includes('excluir') || b.ariaLabel.toLowerCase().includes('excluir') || b.text.toLowerCase().includes('deletar') || b.text.toLowerCase().includes('delete') || b.text.toLowerCase().includes('remover') || b.ariaLabel.toLowerCase().includes('remover')) {
          console.log(`BINGO -> ${b.tagName}: [Texto: "${b.text}"] [AriaLabel: "${b.ariaLabel}"]`);
      }
  }

  console.log('--- TODOS OS BOTÕES DA TELA ---');
  console.log(buttons.slice(0, 50).map(b => `${b.tagName}: ${b.text.substring(0,20)} (Aria: ${b.ariaLabel})`));

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
