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

const TARGET_INSTITUTION = 'Universidade de Teste IA';

console.log(`=== EDITAR FORMAÇÃO ACADÊMICA: ${TARGET_INSTITUTION} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de formação...');
  await page.goto(`${profileUrl}/details/education/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log(`[PASSO 2] Procurando botão de edição para "${TARGET_INSTITUTION}" (o primeiro/de cima)...`);
  const editButtons = await page.$$(`a[aria-label*="Editar formação acadêmica ${TARGET_INSTITUTION}"]`);
  
  if (editButtons.length === 0) {
    console.log(`❌ Nenhuma formação encontrada com o nome: ${TARGET_INSTITUTION}`);
    process.exit(0);
  }

  // Clica no primeiro (o de cima, que está sem as datas no print)
  await editButtons[0].click();
  
  console.log('[PASSO 3] Aguardando modal de edição...');
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('[PASSO 4] Editando Datas...');
  // O usuário quer que edite o de cima, então vamos adicionar as datas corretas nele
  const startMonth = await page.$('div[aria-label="Mês de Data de início"] select');
  if (startMonth) await startMonth.selectOption('3');
  
  const startYear = await page.$('div[aria-label="Ano de Data de início"] select');
  if (startYear) await startYear.selectOption('2020');

  const endMonth = await page.$('div[aria-label="Mês de Data de término (ou prevista)"] select');
  if (endMonth) await endMonth.selectOption('12');
  
  const endYear = await page.$('div[aria-label="Ano de Data de término (ou prevista)"] select');
  if (endYear) await endYear.selectOption('2024');

  console.log('[PASSO 5] Clicando em Salvar...');
  const saveBtns = await page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar")');
  const saveBtn = saveBtns[saveBtns.length - 1];
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ Botão Salvar clicado!');
  } else {
    console.log('⚠️ Botão Salvar não encontrado.');
  }

  await page.waitForTimeout(5000);
  console.log('🎉 Formação editada com sucesso!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
