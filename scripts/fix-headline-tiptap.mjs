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

const FULL_HEADLINE = 'QA Analyst | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Test Automation';

console.log('=== FIX HEADLINE (TIPTAP FLEXÍVEL) ===');
console.log('Headline a ser gravado:', FULL_HEADLINE);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Clica em Editar Perfil
  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(4000);

  // Procura qualquer div contenteditable ou role textbox na página
  const editors = await page.$$('div[contenteditable="true"], div.tiptap, div[role="textbox"]');
  console.log(`[INFO] Encontrados ${editors.length} editores de texto.`);

  let headlineEditor = null;
  for (const editor of editors) {
    const text = await editor.innerText();
    console.log(`[DEBUG] Editor texto atual: "${text.trim()}"`);
    // Se o texto atual for "qa" ou estivemos buscando o editor de headline
    if (text.trim().toLowerCase() === 'qa' || text.trim() === '') {
      headlineEditor = editor;
      break;
    }
  }

  // Caso nenhum contivesse "qa", seleciona o primeiro disponível
  if (!headlineEditor && editors.length > 0) {
    headlineEditor = editors[0];
  }

  if (headlineEditor) {
    console.log('[SUCCESS] Editor de Headline localizado com sucesso!');
    await headlineEditor.scrollIntoViewIfNeeded();
    await headlineEditor.focus();
    await page.waitForTimeout(500);

    // Limpa o conteúdo usando seleções do teclado para garantir compatibilidade com Tiptap
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);
    
    // Digita ou preenche o novo Headline
    await headlineEditor.fill(FULL_HEADLINE);
    console.log('[SUCCESS] Headline preenchido no Tiptap!');

    await page.waitForTimeout(1500);

    // Procura o botão Save/Salvar
    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado!');
      await page.waitForTimeout(5000);
      console.log('🎉 HEADLINE REAL ATUALIZADO E SALVO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Nenhum editor Tiptap/contenteditable foi localizado.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
