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

const TARGET_CERT = 'Certificação de Vibe Coding';

console.log(`=== EXCLUIR CERTIFICAÇÃO: ${TARGET_CERT} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de certificações...');
  await page.goto(`${profileUrl}/details/certifications/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log(`[PASSO 2] Procurando botão de edição para "${TARGET_CERT}"...`);
  const editButtons = await page.$$(`a[aria-label*="Editar licença ou certificado ${TARGET_CERT}"]`);
  
  if (editButtons.length === 0) {
    console.log(`❌ Nenhuma certificação encontrada com o nome: ${TARGET_CERT}`);
    process.exit(0);
  }

  // Clica no primeiro
  await editButtons[0].click();
  
  console.log('[PASSO 3] Aguardando modal de edição...');
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('[PASSO 4] Procurando botão Excluir...');
  // O botão de excluir normalmente contém a palavra "Excluir"
  const deleteBtn = await page.$('button:has-text("Excluir")');
  if (!deleteBtn) {
    console.error('❌ Botão de excluir não encontrado no modal.');
    process.exit(1);
  }

  await deleteBtn.click();
  console.log('✅ Clicou em Excluir.');

  console.log('[PASSO 5] Aguardando modal de confirmação...');
  await page.waitForTimeout(2000);
  
  // Modal de confirmação
  const confirmDeleteBtn = await page.$$('dialog button:has-text("Excluir"), div[role="dialog"] button:has-text("Excluir")');
  if (confirmDeleteBtn.length > 0) {
    await confirmDeleteBtn[confirmDeleteBtn.length - 1].click();
    console.log('✅ Confirmou a exclusão!');
  } else {
    console.log('⚠️ Modal de confirmação não pediu clique extra ou botão não achado.');
  }

  await page.waitForTimeout(4000);
  console.log('🎉 Certificação excluída com sucesso!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
