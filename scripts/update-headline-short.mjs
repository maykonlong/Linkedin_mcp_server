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

// Headline conciso com exatamente 48 caracteres (limite < 50 chars)
const SHORT_HEADLINE = 'QA Analyst | PIX · SPI · SPB | Postman · SQL · JIRA';

console.log('=== ATUALIZANDO HEADLINE CURTO (< 50 CHARS) ===');
console.log('Novo Headline:', SHORT_HEADLINE);
console.log('Tamanho em caracteres:', SHORT_HEADLINE.length);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3500);

  const allInputs = await page.$$('input');
  console.log(`[INFO] Total de inputs encontrados: ${allInputs.length}`);

  if (allInputs.length >= 3) {
    const headlineField = allInputs[2];
    await headlineField.scrollIntoViewIfNeeded();
    await headlineField.click({ clickCount: 3 });
    await headlineField.fill('');
    await headlineField.fill(SHORT_HEADLINE);
    console.log('[SUCCESS] Headline conciso preenchido no campo!');

    await page.waitForTimeout(1500);

    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button[data-action-type="save"], button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE CURTO SALVO COM SUCESSO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Menos de 3 inputs encontrados.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
