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

console.log('=== ALTERANDO PROFILE LANGUAGE PARA PORTUGUÊS (PT-BR) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Clica especificamente no lápis da seção "Profile language"
  console.log('[STEP 1] Procurando o lápis de Profile language...');
  const editLangBtn = await page.waitForSelector('div:has-text("Profile language") button, section:has-text("Profile language") button, [aria-label*="Profile language"]', { timeout: 10000 }).catch(() => null);
  
  if (editLangBtn) {
    await editLangBtn.click();
    console.log('[SUCCESS] Botão de lápis em Profile language clicado!');
  } else {
    // Tenta pelo primeiro botão de lápis no topo/coluna direita
    const allEditButtons = await page.$$('button:has(svg[id="edit-medium"])');
    console.log(`[INFO] Encontrados ${allEditButtons.length} botões de lápis na página.`);
    if (allEditButtons.length > 0) {
      await allEditButtons[0].click();
      console.log('[SUCCESS] Clicado no botão de edição!');
    }
  }
  await page.waitForTimeout(3500);

  // Se houver um botão "Add language", clica nele
  const addLangBtn = await page.$('button:has-text("Add language"), span:has-text("Add language"), a:has-text("Add language")');
  if (addLangBtn) {
    await addLangBtn.click();
    console.log('[SUCCESS] Clicado em Add language!');
    await page.waitForTimeout(3000);
  }

  // Seleciona pt_BR no dropdown
  const selectEl = await page.waitForSelector('select', { timeout: 10000 }).catch(() => null);
  if (selectEl) {
    await selectEl.selectOption('pt_BR').catch(() => {});
    console.log('[SUCCESS] Português (pt_BR) selecionado no select!');
    await page.waitForTimeout(1000);
  }

  // Marcar a caixa "Make primary language"
  const checkLabel = await page.$('label[for], input[type="checkbox"]');
  if (checkLabel) {
    await checkLabel.click().catch(() => {});
    console.log('[SUCCESS] Caixa Make primary language marcada!');
    await page.waitForTimeout(1000);
  }

  // Preencher Headline PT-BR se houver a textarea
  const headlineArea = await page.$('textarea');
  if (headlineArea) {
    await headlineArea.fill('');
    await headlineArea.fill(HEADLINE_PTBR);
    console.log('[SUCCESS] Headline PT-BR preenchido no formulário de idioma!');
  }

  await page.waitForTimeout(2000);

  // Clicar no botão Save / Salvar
  const saveBtn = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Salvar clicado no modal de idioma!');
    await page.waitForTimeout(5000);
    console.log('🎉 IDIOMA DE PERFIL ALTERADO PARA PORTUGUÊS (PT-BR) COM SUCESSO!');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
