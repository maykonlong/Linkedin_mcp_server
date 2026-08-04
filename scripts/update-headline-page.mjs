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

console.log('=== ATUALIZANDO HEADLINE (INDEX 2 ATTR) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(4000);

  const result = await page.evaluate((text) => {
    const fields = Array.from(document.querySelectorAll('textarea, input[type="text"], input:not([type="hidden"])'));
    
    // Imprime os valores dos primeiros 5 campos para confirmação
    const fieldSummary = fields.slice(0, 6).map((f, idx) => `[${idx}] ${f.value}`).join(' | ');
    
    let headlineField = fields.find(f => {
      const v = (f.value || '').toLowerCase().trim();
      return v.includes('qa') && !v.includes('maykon');
    });

    if (!headlineField && fields.length >= 3) {
      headlineField = fields[2];
    }

    if (headlineField) {
      headlineField.value = text;
      headlineField.dispatchEvent(new Event('input', { bubbles: true }));
      headlineField.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, summary: fieldSummary };
    }

    return { success: false, summary: fieldSummary };
  }, NEW_HEADLINE);

  console.log('[RESULTADO]', result);

  if (result.success) {
    await page.waitForTimeout(1500);
    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button[data-action-type="save"], button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE PERSISTIDO E SALVO NO LINKEDIN!');
    }
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
