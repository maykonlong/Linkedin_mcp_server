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

const SKILL_NAME = 'Vibe Coding';

console.log(`=== ADICIONAR COMPETÊNCIA: ${SKILL_NAME} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando página de Competências...');
  await page.goto(`${profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('[PASSO 2] Clicando no botão Adicionar Competência (+)...');
  // O link possui aria-label "Adicione uma competência"
  const addBtn = await page.$('a[aria-label="Adicione uma competência"]');
  if (addBtn) {
    await addBtn.click();
  } else {
    // Tenta URL direta
    await page.goto(`${profileUrl}/skills/edit/forms/new/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  console.log('[PASSO 3] Aguardando modal...');
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('[PASSO 4] Preenchendo o nome da competência...');
  const skillInput = await page.$('input[placeholder*="Competência"]');
  if (skillInput) {
    await skillInput.fill(SKILL_NAME);
    await page.waitForTimeout(1500);

    // Clica na primeira sugestão ou dá Enter
    const suggestions = await page.$$('div[role="listbox"] div[role="option"]');
    if (suggestions.length > 0) {
      await suggestions[0].click();
    } else {
      await page.keyboard.press('Enter');
    }
  } else {
    console.error('❌ Input de competência não encontrado!');
    process.exit(1);
  }

  console.log('[PASSO 5] Clicando em Salvar...');
  await page.waitForTimeout(1000);
  const saveBtns = await page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar")');
  const saveBtn = saveBtns[saveBtns.length - 1];
  
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ Botão Salvar clicado!');
  } else {
    console.log('⚠️ Botão Salvar não encontrado.');
  }

  await page.waitForTimeout(5000);
  console.log(`🎉 Competência "${SKILL_NAME}" adicionada com sucesso!`);

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
