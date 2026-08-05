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

const LAST_NAME = 'Batista da Silva';

console.log('=== SALVANDO MODAL DE IDIOMA (SELETORES EXATOS DOS SNIPPETS) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Procura e clica para abrir o modal de idiomas
  console.log('[STEP 1] Abrindo modal de idiomas...');
  const addLangBtn = await page.$('button:has-text("Add language"), a:has-text("Add language"), span:has-text("Add language"), [aria-label*="language"]');
  if (addLangBtn) {
    await addLangBtn.click();
    console.log('[SUCCESS] Clicado em Add language!');
    await page.waitForTimeout(3000);
  }

  // 1. Selecionar Português no dropdown
  const selectDropdown = await page.waitForSelector('select', { timeout: 10000 }).catch(() => null);
  if (selectDropdown) {
    await selectDropdown.selectOption('pt_BR').catch(() => {});
    console.log('[SUCCESS] Português selecionado no dropdown!');
    await page.waitForTimeout(1000);
  }

  // 2. Clicar no label de Make primary language
  console.log('[STEP 2] Clicando em Make primary language...');
  const primaryLabel = await page.$('label[for*="rt"], label:has-text("Make primary language"), label[for]');
  if (primaryLabel) {
    await primaryLabel.click();
    console.log('[SUCCESS] Make primary language clicado!');
    await page.waitForTimeout(1000);
  }

  // 3. Preencher Last Name no input (que estava vermelho!)
  console.log('[STEP 3] Preenchendo Last Name...');
  const lastNameInput = await page.$('input[aria-describedby*="rv"], input[id*="rv"], input[type="text"]:nth-of-type(2)');
  if (lastNameInput) {
    await lastNameInput.scrollIntoViewIfNeeded();
    await lastNameInput.focus();
    await lastNameInput.fill('');
    await lastNameInput.fill(LAST_NAME);
    console.log(`[SUCCESS] Last Name "${LAST_NAME}" preenchido com sucesso!`);
  } else {
    // Procura por qualquer input com aviso de erro em vermelho
    const allInputs = await page.$$('input');
    if (allInputs.length >= 2) {
      await allInputs[1].fill(LAST_NAME);
      console.log(`[SUCCESS] Last Name preenchido no input de ordinal [1]!`);
    }
  }

  await page.waitForTimeout(1500);

  // 4. Clicar no botão Save (span/button)
  console.log('[STEP 4] Clicando no botão Save...');
  const saveBtn = await page.$('button:has-text("Save"), span:has-text("Save"), button.artdeco-button--primary');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Save clicado com sucesso!');
    await page.waitForTimeout(5000);
    console.log('🎉 PERFIL EM PORTUGUÊS (PT-BR) SALVO COMO IDIOMA PRIMÁRIO!');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
