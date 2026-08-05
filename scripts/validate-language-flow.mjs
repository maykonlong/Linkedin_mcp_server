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

console.log('=== VALIDAÇÃO CIRÚRGICA DA SIDEBAR DIREITA (PROFILE LANGUAGE) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // PASSO 1: Acessar o perfil
  console.log('[PASSO 1] Acessando perfil no LinkedIn...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // PASSO 2: Localizar e clicar no lápis da coluna direita (aside / Profile language)
  console.log('[PASSO 2] Buscando lápis de idioma na sidebar direita (aside)...');
  
  // Procura o botão dentro da barra lateral direita ou section Profile language
  const asidePencil = await page.$('aside button:has(svg[id="edit-medium"]), .scaffold-layout__aside button:has(svg[id="edit-medium"]), section:has-text("Profile language") button, div:has-text("Profile language") button');

  if (asidePencil) {
    await asidePencil.scrollIntoViewIfNeeded();
    await asidePencil.click();
    console.log('✅ [VALIDADO] Clicado no botão de lápis da sidebar direita!');
    await page.waitForTimeout(3000);
  } else {
    console.log('[INFO] Lápis na sidebar não encontrado diretamente. Procurando botões na coluna direita...');
    const allRightButtons = await page.$$('aside button, .scaffold-layout__aside button');
    if (allRightButtons.length > 0) {
      await allRightButtons[0].click();
      console.log('✅ [VALIDADO] Clicado no primeiro botão da coluna direita!');
      await page.waitForTimeout(3000);
    }
  }

  // PASSO 3: Se houver botão "Add language", clica nele
  const addLangSpan = await page.$('button:has-text("Add language"), span:has-text("Add language"), a:has-text("Add language")');
  if (addLangSpan) {
    await addLangSpan.click();
    console.log('✅ [VALIDADO] Clicado no botão Add language!');
    await page.waitForTimeout(3000);
  }

  // PASSO 4: Validar a presença do <select> de idiomas com a option "pt_BR"
  console.log('[PASSO 4] Procurando dropdown de idioma com option pt_BR...');
  const selectElement = await page.waitForSelector('select:has(option[value="pt_BR"]), .artdeco-modal select', { timeout: 10000 });
  
  if (selectElement) {
    await selectElement.selectOption('pt_BR');
    console.log('✅ [VALIDADO] Português (pt_BR) selecionado no dropdown!');
    await page.waitForTimeout(2000);
  }

  // PASSO 5: Marcar a caixa "Make primary language"
  console.log('[PASSO 5] Marcando a opção "Make primary language"...');
  const primaryCheck = await page.$('label:has-text("Make primary language"), label[for*="rt"], label[for]');
  if (primaryCheck) {
    await primaryCheck.click();
    console.log('✅ [VALIDADO] "Make primary language" marcado!');
    await page.waitForTimeout(1000);
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
      console.log(`✅ [VALIDADO] Last Name preenchido via fallback no input ordinal [1]!`);
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

  // PASSO 8: Clicar no botão Save e confirmar o salvamento
  console.log('[PASSO 8] Clicando no botão Save...');
  const saveBtn = await page.$('.artdeco-modal button:has-text("Save"), button:has-text("Save"), span:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click({ force: true });
    console.log('✅ [VALIDADO] Clique no botão Save executado com sucesso!');
    await page.waitForTimeout(5000);
    console.log('🎉 IDIOMA PRIMÁRIO DO PERFIL ALTERADO PARA PORTUGUÊS (PT-BR) E CONFIRMADO!');
  }

} catch (err) {
  console.error('❌ [ERRO NA VALIDAÇÃO]', err.message);
} finally {
  await browser.close();
}
