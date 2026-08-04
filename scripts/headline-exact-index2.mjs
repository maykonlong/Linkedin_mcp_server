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

console.log('=== GRAVAÇÃO DEFINITIVA DO HEADLINE (INDEX 2) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  // Seleciona o terceiro input type="text" (índice 2) que fica entre Sobrenome e Pronome
  const textInputs = await page.$$('.artdeco-modal input[type="text"], form input[type="text"]');
  console.log(`[INFO] Encontrados ${textInputs.length} inputs do tipo text no formulário.`);

  if (textInputs.length >= 3) {
    const headlineInput = textInputs[2];
    await headlineInput.click({ clickCount: 3 });
    await headlineInput.fill(NEW_HEADLINE);
    console.log('[SUCCESS] Headline preenchido com sucesso no campo ordinal [2]!');

    await page.waitForTimeout(1500);

    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE PERSISTIDO COM SUCESSO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Menos de 3 inputs de texto encontrados no modal.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
