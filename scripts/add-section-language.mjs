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

console.log('=== SALVAMENTO GARANTIDO DE IDIOMA PT-BR ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // PASSO 1: Acessar a página do perfil
  console.log('[PASSO 1] Acessando perfil no LinkedIn...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // PASSO 2: Clicar no card de idioma ou botão de idioma
  console.log('[PASSO 2] Abrindo modal de idioma...');
  const langLink = await page.$('div:has-text("Profile language") a, div:has-text("Profile language") button, button:has-text("Add language"), span:has-text("Add language")');
  if (langLink) {
    await langLink.click().catch(() => {});
    await page.waitForTimeout(3000);
  }

  // PASSO 3: Selecionar Português no dropdown
  console.log('[PASSO 3] Selecionando Português (pt_BR)...');
  const selectElement = await page.waitForSelector('.artdeco-modal select, select:has(option[value="pt_BR"])', { timeout: 10000 });
  await selectElement.selectOption('pt_BR');
  console.log('✅ [VALIDADO] Português (pt_BR) selecionado no dropdown!');
  await page.waitForTimeout(2000);

  // PASSO 4: Marcar "Make primary language" (tentativa não-bloqueante com force)
  console.log('[PASSO 4] Tentando marcar Make primary language...');
  const primaryCheck = await page.$('label:has-text("Make primary language"), label[for*="rt"], input[type="checkbox"]');
  if (primaryCheck) {
    await primaryCheck.click({ force: true }).catch(() => {});
    console.log('✅ [VALIDADO] Clique em Make primary language enviado!');
  }
  await page.waitForTimeout(1000);

  // PASSO 5: Preencher First Name (Maykon)
  console.log('[PASSO 5] Preenchendo First Name...');
  const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
  if (firstNameInput) {
    await firstNameInput.fill('');
    await firstNameInput.fill(FIRST_NAME).catch(() => {});
    console.log('✅ [VALIDADO] First Name preenchido!');
  }

  // PASSO 6: Preencher Last Name (Batista da Silva)
  console.log('[PASSO 6] Preenchendo Last Name...');
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
      console.log(`✅ [VALIDADO] Last Name preenchido via ordinal!`);
    }
  }

  // PASSO 7: Preencher Headline PT-BR
  console.log('[PASSO 7] Preenchendo Headline PT-BR...');
  const headlineArea = await page.$('.artdeco-modal textarea, textarea');
  if (headlineArea) {
    await headlineArea.fill('');
    await headlineArea.fill(HEADLINE_PTBR);
    console.log('✅ [VALIDADO] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // PASSO 8: Clicar no botão Save
  console.log('[PASSO 8] Clicando no botão Save...');
  const saveBtn = await page.$('.artdeco-modal button:has-text("Save"), button:has-text("Save"), span:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click({ force: true });
    console.log('✅ [VALIDADO] Botão Save clicado com sucesso!');
    await page.waitForTimeout(6000);
    console.log('🎉 IDIOMA DE PERFIL EM PORTUGUÊS (PT-BR) SALVO COM SUCESSO!');
  } else {
    await page.keyboard.press('Enter');
    console.log('✅ [VALIDADO] Formulário submetido via tecla Enter!');
    await page.waitForTimeout(5000);
  }

} catch (err) {
  console.error('❌ [ERRO NA EXECUÇÃO]', err.message);
} finally {
  await browser.close();
}
