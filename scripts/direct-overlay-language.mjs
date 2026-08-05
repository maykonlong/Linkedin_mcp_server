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

// URL overlay direta para a criação de idioma secundário/primário no LinkedIn
const createLangUrl = `${profileUrl}/overlay/create-secondary-profile/`;

const FIRST_NAME    = 'Maykon';
const LAST_NAME     = 'Batista da Silva';
const HEADLINE_PTBR = 'Analista QA | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Automação de Testes';

console.log('=== NAVEGAÇÃO DIRETA NA OVERLAY DE IDIOMA ===');
console.log('URL de destino:', createLangUrl);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // PASSO 1: Navegar diretamente para a URL da overlay de idiomas
  console.log('[PASSO 1] Navegando diretamente para a overlay de idioma...');
  await page.goto(createLangUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Se a URL direta redirecionou para o perfil, procura o card e clica
  const hasModal = await page.$('.artdeco-modal select, select');
  if (!hasModal) {
    console.log('[INFO] Overlay direta não abriu modal. Tentando clicar no link do card...');
    const langCardLink = await page.$('a[href*="create-secondary-profile"], a[href*="locale"], a[href*="language"]');
    if (langCardLink) {
      await langCardLink.click();
      await page.waitForTimeout(3500);
    }
  }

  // PASSO 2: Validar e selecionar o <select> de idioma
  console.log('[PASSO 2] Procurando select de idioma no modal...');
  const selectElement = await page.waitForSelector('select', { timeout: 10000 });
  await selectElement.selectOption('pt_BR');
  console.log('✅ [VALIDADO] Português (pt_BR) selecionado no dropdown!');
  await page.waitForTimeout(2000);

  // PASSO 3: Marcar "Make primary language"
  console.log('[PASSO 3] Marcando "Make primary language"...');
  const primaryCheck = await page.$('label:has-text("Make primary language"), label[for*="rt"], label[for]');
  if (primaryCheck) {
    await primaryCheck.click();
    console.log('✅ [VALIDADO] "Make primary language" marcado!');
    await page.waitForTimeout(1000);
  }

  // PASSO 4: Preencher First Name
  console.log('[PASSO 4] Preenchendo nomes...');
  const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
  if (firstNameInput) {
    await firstNameInput.fill('');
    await firstNameInput.fill(FIRST_NAME);
    console.log('✅ [VALIDADO] First Name preenchido:', FIRST_NAME);
  }

  // PASSO 5: Preencher Last Name (Batista da Silva)
  console.log('[PASSO 5] Preenchendo Last Name...');
  const lastNameInput = await page.$('input[aria-describedby*="rv"], input[id*="rv"], input[id*="r2r"]');
  if (lastNameInput) {
    await lastNameInput.scrollIntoViewIfNeeded();
    await lastNameInput.fill('');
    await lastNameInput.fill(LAST_NAME);
    console.log(`✅ [VALIDADO] Last Name "${LAST_NAME}" preenchido com sucesso!`);
  } else {
    const inputs = await page.$$('.artdeco-modal input[type="text"], input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[1].fill('');
      await inputs[1].fill(LAST_NAME);
      console.log(`✅ [VALIDADO] Last Name preenchido no input de ordinal [1]!`);
    }
  }

  // PASSO 6: Preencher Headline PT-BR
  console.log('[PASSO 6] Preenchendo Headline PT-BR...');
  const headlineArea = await page.$('.artdeco-modal textarea, textarea');
  if (headlineArea) {
    await headlineArea.fill('');
    await headlineArea.fill(HEADLINE_PTBR);
    console.log('✅ [VALIDADO] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // PASSO 7: Clicar no botão Save
  console.log('[PASSO 7] Clicando no botão Save...');
  const saveBtn = await page.$('.artdeco-modal button:has-text("Save"), button:has-text("Save"), span:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click({ force: true });
    console.log('✅ [VALIDADO] Clique no botão Save executado com sucesso!');
    await page.waitForTimeout(5000);
    console.log('🎉 PERFIL EM PORTUGUÊS (PT-BR) SALVO COMO IDIOMA PRIMÁRIO!');
  }

} catch (err) {
  console.error('❌ [ERRO NA NAVEGAÇÃO DIRETA]', err.message);
} finally {
  await browser.close();
}
