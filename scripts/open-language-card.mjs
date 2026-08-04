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

const HEADLINE_PTBR = 'Analista QA | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Automação de Testes';

console.log('=== TROCA DE IDIOMA DO PERFIL (CARD DIREITO / DETAILS LANGUAGES) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Procura o card "Profile language" no lado direito da tela e clica nele
  console.log('[STEP 1] Buscando o card Profile language...');
  const cardLang = await page.$('div:has-text("Profile language"), section:has-text("Profile language"), p:has-text("Profile language")');
  
  if (cardLang) {
    // Procura o botão/lápis dentro desse card ou clica no próprio card
    const pencilBtn = await cardLang.$('button, a, svg');
    if (pencilBtn) {
      await pencilBtn.click();
      console.log('[SUCCESS] Clicado no lápis do card Profile language!');
    } else {
      await cardLang.click();
      console.log('[SUCCESS] Clicado no card Profile language!');
    }
  } else {
    // Tenta navegar para a página de idiomas diretamente
    console.log('[INFO] Navegando para a URL de idiomas...');
    await page.goto(`${profileUrl}/details/languages/`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  }

  await page.waitForTimeout(3500);

  // Clica no botão "Add language" se visível
  const addBtn = await page.$('button:has-text("Add language"), span:has-text("Add language"), a:has-text("Add language")');
  if (addBtn) {
    await addBtn.click();
    console.log('[SUCCESS] Botão Add language clicado!');
    await page.waitForTimeout(3000);
  }

  // Seleciona a opção Português (pt_BR) no dropdown <select>
  const selectDropdown = await page.waitForSelector('select', { timeout: 10000 }).catch(() => null);
  if (selectDropdown) {
    await selectDropdown.selectOption('pt_BR').catch(() => {});
    console.log('[SUCCESS] Português (pt_BR) selecionado!');
    await page.waitForTimeout(1000);
  }

  // Marca "Make primary language"
  const checkLabel = await page.$('label[for], input[type="checkbox"]');
  if (checkLabel) {
    await checkLabel.click().catch(() => {});
    console.log('[SUCCESS] "Make primary language" marcado!');
    await page.waitForTimeout(1000);
  }

  // Preenche o Headline em Português na textarea
  const headlineArea = await page.$('textarea');
  if (headlineArea) {
    await headlineArea.fill('');
    await headlineArea.fill(HEADLINE_PTBR);
    console.log('[SUCCESS] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // Clica em Salvar
  const saveButton = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
  if (saveButton) {
    await saveButton.click();
    console.log('[SUCCESS] Botão Save clicado com sucesso!');
    await page.waitForTimeout(5000);
    console.log('🎉 IDIOMA PRIMÁRIO DO PERFIL ALTERADO PARA PORTUGUÊS!');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
