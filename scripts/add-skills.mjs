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

const SKILLS_TO_ADD = [
  'SQL',
  'JIRA',
  'Linux',
  'Test Automation',
  'Quality Assurance (QA)',
];

console.log('=== ADICIONANDO COMPETÊNCIAS (VIA PVS-ACTION) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  for (const skill of SKILLS_TO_ADD) {
    console.log(`\n[+] Adicionando skill: "${skill}"`);

    await page.goto(`${profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Clica no botão + do topo da lista de competências
    const addBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const target = btns.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        return aria.includes('adicione') || aria.includes('add') || b.className.includes('pvs-navigation__action');
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    });

    console.log('[OK] Clique no botão + da página:', addBtn);
    await page.waitForTimeout(2500);

    // Preenche a skill no modal
    const input = await page.$('.artdeco-modal input, input[name="name"], input[type="text"]');
    if (input) {
      await input.click({ clickCount: 3 });
      await input.fill('');
      await input.fill(skill);
      await page.waitForTimeout(1500);

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, .artdeco-modal button[type="submit"], button:has-text("Salvar"), button:has-text("Save")');
      if (saveBtn) {
        await saveBtn.click();
        console.log(`[SUCCESS] Skill "${skill}" salva com sucesso!`);
        await page.waitForTimeout(3000);
      }
    }
  }

  console.log('\n✅ COMPETÊNCIAS FINALIZADAS!');

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
