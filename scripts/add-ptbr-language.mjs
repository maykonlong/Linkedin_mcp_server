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

const FIRST_NAME   = 'Maykon';
const LAST_NAME    = 'Batista da Silva';
const HEADLINE_PTBR = 'Analista QA | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Automação de Testes';

console.log('=== ADICIONANDO PERFIL EM PORTUGUÊS (PT-BR) FLEXÍVEL ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Procura qualquer botão relacionado a idioma (Add language ou edit profile language)
  const langBtn = await page.$('button:has-text("Add language"), a:has-text("Add language"), span:has-text("Add language"), [aria-label*="language"], [aria-label*="idioma"]');
  if (langBtn) {
    console.log('[INFO] Clicando no botão de Idioma...');
    await langBtn.click();
    await page.waitForTimeout(3000);
  }

  // Localiza o select de idiomas no modal
  const langSelect = await page.waitForSelector('select', { timeout: 8000 }).catch(() => null);
  if (langSelect) {
    await langSelect.selectOption('pt_BR').catch(() => {});
    console.log('[SUCCESS] Idioma Português (pt_BR) selecionado no dropdown!');
    await page.waitForTimeout(1000);
  }

  // Tenta marcar como idioma primário
  const primaryCheck = await page.$('input[type="checkbox"], label[for*="r2p"]');
  if (primaryCheck) {
    await primaryCheck.click().catch(() => {});
    console.log('[SUCCESS] Marcado como idioma primário!');
  }

  // Preenche inputs de nome se presentes
  const textInputs = await page.$$('.artdeco-modal input[type="text"], input[type="text"]');
  if (textInputs.length >= 1) {
    await textInputs[0].fill(FIRST_NAME).catch(() => {});
  }
  if (textInputs.length >= 2) {
    await textInputs[1].fill(LAST_NAME).catch(() => {});
  }

  // Preenche a textarea do Headline
  const textarea = await page.$('.artdeco-modal textarea, textarea');
  if (textarea) {
    await textarea.scrollIntoViewIfNeeded();
    await textarea.focus();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await textarea.fill(HEADLINE_PTBR);
    console.log('[SUCCESS] Headline em Português preenchido!');
  }

  await page.waitForTimeout(1500);

  // Clica no botão Save/Salvar
  const saveBtn = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Salvar clicado!');
    await page.waitForTimeout(5000);
    console.log('🎉 IDIOMA PORTUGUÊS (PT-BR) SALVO COMO IDIOMA PRIMÁRIO!');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
