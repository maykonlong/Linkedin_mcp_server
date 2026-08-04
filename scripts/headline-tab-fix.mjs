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

console.log('=== ATUALIZANDO HEADLINE (VIA TAB NAVIGATION) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Clica no botão "Editar perfil"
  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  // Pega todos os inputs da página/modal
  const inputs = await page.$$('input, textarea');
  console.log(`[INFO] Encontrados ${inputs.length} inputs no modal.`);

  let headlineInput = null;

  // Procura por valor 'qa' ou usa o terceiro input
  for (let i = 0; i < inputs.length; i++) {
    const val = await inputs[i].inputValue().catch(() => '');
    if (val.trim().toLowerCase() === 'qa') {
      headlineInput = inputs[i];
      console.log(`[OK] Encontrado campo 'qa' no índice ${i}`);
      break;
    }
  }

  if (!headlineInput && inputs.length >= 3) {
    headlineInput = inputs[2];
    console.log('[OK] Selecionado o terceiro input do formulário!');
  }

  if (headlineInput) {
    await headlineInput.focus();
    await headlineInput.click({ clickCount: 3 });
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await headlineInput.fill(NEW_HEADLINE);
    console.log('[SUCCESS] Headline preenchido no input!');

    await page.waitForTimeout(1000);

    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save"), button[type="submit"]');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE ATUALIZADO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Não foi possível focar o campo Headline.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
