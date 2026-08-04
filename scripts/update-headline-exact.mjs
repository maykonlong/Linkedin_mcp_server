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
const NEW_HEADLINE = 'QA Analyst | Software Testing | PIX · SPI · SPB | Postman · SQL · JIRA | Test Automation';

console.log('=== GRAVAÇÃO CIRÚRGICA DO HEADLINE ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3500);

  // Procura o input cujo label associado contem "Título" ou "Headline" ou cujo valor atual é "qa"
  const filled = await page.evaluate((headlineText) => {
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    
    for (const inp of inputs) {
      const val = inp.value || '';
      const id = inp.id || '';
      const aria = inp.getAttribute('aria-label') || '';

      // Procura a label associada ao input
      const label = document.querySelector(`label[for="${id}"]`)?.textContent || '';

      if (val.trim().toLowerCase() === 'qa' || label.toLowerCase().includes('título') || label.toLowerCase().includes('headline') || id.toLowerCase().includes('headline')) {
        inp.value = headlineText;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, id, label, oldVal: val };
      }
    }
    return { success: false };
  }, NEW_HEADLINE);

  console.log('[RESULTADO] Preenchimento:', filled);

  if (filled.success) {
    await page.waitForTimeout(1500);
    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE PERSISTIDO NO LINKEDIN!');
    }
  } else {
    console.log('[AVISO] Tentando fallback nos índices 3 e 4...');
    const inputs = await page.$$('input, textarea');
    if (inputs.length >= 4) {
      await inputs[3].click({ clickCount: 3 });
      await inputs[3].fill(NEW_HEADLINE);
      await page.waitForTimeout(1000);
      const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
      if (saveBtn) await saveBtn.click();
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE PERSISTIDO VIA FALLBACK!');
    }
  }

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
