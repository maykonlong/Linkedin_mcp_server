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
// Se true, deleta o último encontrado (o de baixo). Se false, deleta o primeiro.
const DELETE_LAST = true; 

console.log(`=== EXCLUIR FORMAÇÃO ACADÊMICA: ${TARGET_INSTITUTION} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de formação...');
  await page.goto(`${profileUrl}/details/education/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log(`[PASSO 2] Procurando botões de edição para "${TARGET_INSTITUTION}"...`);
  const editButtons = await page.$$(`a[aria-label*="Editar formação acadêmica ${TARGET_INSTITUTION}"]`);
  
  if (editButtons.length === 0) {
    console.log(`❌ Nenhuma formação encontrada com o nome: ${TARGET_INSTITUTION}`);
    process.exit(0);
  }

  console.log(`✅ Encontradas ${editButtons.length} formações. Clicando para editar a ${DELETE_LAST ? 'última (de baixo)' : 'primeira (de cima)'}...`);
  const targetBtn = DELETE_LAST ? editButtons[editButtons.length - 1] : editButtons[0];
  
  await targetBtn.click();
  
  console.log('[PASSO 3] Aguardando modal de edição...');
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('[PASSO 4] Procurando botão "Excluir formação acadêmica"...');
  const deleteBtn = await page.$('button:has-text("Excluir formação acadêmica")');
  if (!deleteBtn) {
    console.error('❌ Botão de excluir não encontrado no modal.');
    process.exit(1);
  }

  await deleteBtn.click();
  console.log('✅ Clicou em Excluir.');

  console.log('[PASSO 5] Aguardando modal de confirmação...');
  await page.waitForTimeout(2000);
  
  // O modal de confirmação de exclusão do LinkedIn costuma ter um botão azul/vermelho "Excluir"
  const confirmDeleteBtn = await page.$$('dialog button:has-text("Excluir"), div[role="dialog"] button:has-text("Excluir")');
  if (confirmDeleteBtn.length > 0) {
    await confirmDeleteBtn[confirmDeleteBtn.length - 1].click();
    console.log('✅ Confirmou a exclusão!');
  } else {
    console.log('⚠️ Modal de confirmação não pediu clique extra ou botão não achado.');
  }

  await page.waitForTimeout(4000);
  console.log('🎉 Formação excluída com sucesso!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
