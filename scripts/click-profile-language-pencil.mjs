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

console.log('=== CLICANDO NO LÁPIS DA SIDEBAR (PROFILE LANGUAGE) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Busca links ou botões que contenham a palavra language/idioma ou o card da coluna direita
  console.log('[STEP 1] Procurando elemento clicável de idioma na sidebar...');
  
  // Procura especificamente o link/botão de editar idioma no card da coluna da direita
  const langLink = await page.$('a[href*="language"], a[href*="locale"], button[aria-label*="language"], button[aria-label*="Profile language"]');
  
  if (langLink) {
    await langLink.click();
    console.log('[SUCCESS] Link/botão de idioma clicado!');
  } else {
    // Tenta clicar no primeiro ícone de lápis dentro da sidebar (aside ou coluna direita)
    const rightSidebarPencil = await page.$('.scaffold-layout__aside button, aside button, .pv-profile-card--hero + div button');
    if (rightSidebarPencil) {
      await rightSidebarPencil.click();
      console.log('[SUCCESS] Clicado no botão da coluna da direita!');
    }
  }

  await page.waitForTimeout(3000);

  // Se o botão "Add language" aparecer no modal ou na tela, clica nele
  const addBtn = await page.$('button:has-text("Add language"), span:has-text("Add language"), a:has-text("Add language")');
  if (addBtn) {
    await addBtn.click();
    console.log('[SUCCESS] Clicado no botão Add language!');
    await page.waitForTimeout(3000);
  }

  // Preenche o modal de idioma
  const selectElement = await page.waitForSelector('select', { timeout: 8000 }).catch(() => null);
  if (selectElement) {
    await selectElement.selectOption('pt_BR');
    console.log('[SUCCESS] Idioma Português (pt_BR) selecionado no select!');
    await page.waitForTimeout(1000);

    const primaryCheckbox = await page.$('label[for], input[type="checkbox"]');
    if (primaryCheckbox) {
      await primaryCheckbox.click().catch(() => {});
      console.log('[SUCCESS] Opção de idioma primário marcada!');
    }

    const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
    if (firstNameInput) await firstNameInput.fill(FIRST_NAME).catch(() => {});

    const lastNameInput = await page.$('input[id*="r2r"]');
    if (lastNameInput) await lastNameInput.fill(LAST_NAME).catch(() => {});

    const headlineTextarea = await page.$('textarea[id*="r2s"], textarea');
    if (headlineTextarea) {
      await headlineTextarea.fill('');
      await headlineTextarea.fill(HEADLINE_PTBR).catch(() => {});
      console.log('[SUCCESS] Headline PT-BR preenchido no modal de idioma!');
    }

    await page.waitForTimeout(2000);

    const saveButton = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
    if (saveButton) {
      await saveButton.click();
      console.log('[SUCCESS] Botão Salvar clicado no modal de idioma!');
      await page.waitForTimeout(5000);
      console.log('🎉 IDIOMA DE PERFIL DEFINIDO PARA PORTUGUÊS (PT-BR)!');
    }
  } else {
    console.error('[AVISO] Select de idioma não localizado no modal.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
