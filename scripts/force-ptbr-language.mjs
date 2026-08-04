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

console.log('=== FORÇANDO IDIOMA PT-BR COM SELETORES EXATOS ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 1. Clicar no lápis ao lado de Profile language ou no botão Add language
  console.log('[STEP 1] Clicando para abrir o modal de idioma...');
  const editIcon = await page.$('div:has-text("Profile language") svg[id="edit-medium"], button:has-text("Add language"), span:has-text("Add language")');
  if (editIcon) {
    await editIcon.click();
    console.log('[SUCCESS] Clicado no botão/lápis de idioma!');
  } else {
    // Tenta clicar no primeiro botão Add language encontrado
    const addSpan = await page.waitForSelector('span:has-text("Add language")', { timeout: 10000 });
    await addSpan.click();
    console.log('[SUCCESS] Clicado no span Add language!');
  }

  await page.waitForTimeout(3000);

  // 2. Selecionar Português no dropdown <select>
  console.log('[STEP 2] Selecionando Português (pt_BR)...');
  const selectElement = await page.waitForSelector('select', { timeout: 10000 });
  await selectElement.selectOption('pt_BR');
  await page.waitForTimeout(1000);

  // 3. Marcar a caixa "Make primary language"
  console.log('[STEP 3] Marcando "Make primary language"...');
  const primaryLabel = await page.$('label[for*="r2p"], label[for], input[type="checkbox"]');
  if (primaryLabel) {
    await primaryLabel.click();
    console.log('[SUCCESS] Marcada a opção de idioma primário!');
    await page.waitForTimeout(1000);
  }

  // 4. Preencher First Name (Maykon)
  const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
  if (firstNameInput) {
    await firstNameInput.fill('');
    await firstNameInput.fill(FIRST_NAME);
    console.log('[SUCCESS] First Name preenchido!');
  }

  // 5. Preencher Last Name (Batista da Silva)
  const lastNameInput = await page.$('input[id*="r2r"]');
  if (lastNameInput) {
    await lastNameInput.fill('');
    await lastNameInput.fill(LAST_NAME);
    console.log('[SUCCESS] Last Name preenchido!');
  }

  // 6. Preencher Headline em PT-BR (textarea)
  const headlineTextarea = await page.$('textarea[id*="r2s"], textarea');
  if (headlineTextarea) {
    await headlineTextarea.fill('');
    await headlineTextarea.fill(HEADLINE_PTBR);
    console.log('[SUCCESS] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // 7. Clicar em Save
  console.log('[STEP 7] Clicando no botão Save...');
  const saveSpan = await page.waitForSelector('span:has-text("Save"), button:has-text("Save")', { timeout: 8000 });
  await saveSpan.click();
  console.log('[SUCCESS] Botão Save clicado com sucesso!');

  await page.waitForTimeout(6000);
  console.log('🎉 IDIOMA PORTUGUÊS (PT-BR) DEFINIDO E SALVO COMO PRIMÁRIO!');

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
