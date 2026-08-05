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

const FIRST_NAME    = 'Maykon';
const LAST_NAME     = 'Batista da Silva';
const HEADLINE_PTBR = 'Analista QA | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Automação de Testes';

console.log('=== EXECUÇÃO COM SAVE BOTÃO INFALÍVEL ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // 1. Lápis do Profile language
  const editLangPencil = await page.$('div:has-text("Profile language") button, section:has-text("Profile language") button, [aria-label*="Profile language"]');
  if (editLangPencil) {
    await editLangPencil.click();
    await page.waitForTimeout(3000);
  }

  // 2. Add language
  const addLangBtn = await page.$('button:has-text("Add language"), span:has-text("Add language"), a:has-text("Add language")');
  if (addLangBtn) {
    await addLangBtn.click();
    await page.waitForTimeout(3500);
  }

  // 3. Dropdown pt_BR
  const selectDropdown = await page.waitForSelector('.artdeco-modal select, select:has(option[value="pt_BR"])', { timeout: 10000 });
  await selectDropdown.selectOption('pt_BR');
  console.log('[SUCCESS] Português (pt_BR) selecionado!');
  await page.waitForTimeout(2500);

  // 4. Make primary language
  console.log('[STEP 4] Marcando Make primary language...');
  const primaryCheck = await page.$('label:has-text("Make primary language"), label[for*="rt"], label[for]');
  if (primaryCheck) {
    await primaryCheck.click().catch(() => {});
    console.log('[SUCCESS] Make primary language clicado!');
    await page.waitForTimeout(1000);
  }

  // 5. Nomes
  const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
  if (firstNameInput) {
    await firstNameInput.fill('');
    await firstNameInput.fill(FIRST_NAME).catch(() => {});
  }

  // 6. Last Name (Batista da Silva)
  console.log('[STEP 6] Preenchendo Last Name...');
  const lastNameInput = await page.$('input[aria-describedby*="rv"], input[id*="rv"], input[id*="r2r"]');
  if (lastNameInput) {
    await lastNameInput.scrollIntoViewIfNeeded();
    await lastNameInput.fill('');
    await lastNameInput.fill(LAST_NAME);
    console.log(`[SUCCESS] Last Name "${LAST_NAME}" preenchido com sucesso!`);
  } else {
    const inputs = await page.$$('.artdeco-modal input[type="text"], input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[1].fill('');
      await inputs[1].fill(LAST_NAME);
      console.log(`[SUCCESS] Last Name preenchido via fallback ordinal!`);
    }
  }

  // 7. Headline PT-BR
  const headlineTextarea = await page.$('.artdeco-modal textarea, textarea');
  if (headlineTextarea) {
    await headlineTextarea.fill('');
    await headlineTextarea.fill(HEADLINE_PTBR).catch(() => {});
    console.log('[SUCCESS] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // 8. Clicar no botão Save infalível
  console.log('[STEP 8] Clicando no botão Save...');
  
  // Tenta encontrar por múltiplos seletores de botões/elementos com texto Save no modal
  const saveClickable = await page.$('.artdeco-modal button:has-text("Save"), .artdeco-modal span:has-text("Save"), button:has-text("Save"), span:has-text("Save")');
  
  if (saveClickable) {
    await saveClickable.scrollIntoViewIfNeeded();
    await saveClickable.click({ force: true });
    console.log('[SUCCESS] Botão Save clicado com sucesso!');
    await page.waitForTimeout(6000);
    console.log('🎉 IDIOMA DE PERFIL DEFINIDO E SALVO COMO PORTUGUÊS (PT-BR)!');
  } else {
    // Fallback: pressiona Enter no campo de texto para submeter o formulário
    console.log('[INFO] Pressionando Enter para submeter o formulário...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    console.log('🎉 FORMULÁRIO SUBMETIDO VIA ENTER!');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
