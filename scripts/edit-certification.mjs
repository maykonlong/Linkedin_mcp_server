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

console.log(`=== EDITAR CERTIFICAÇÃO: ${TARGET_CERT} ===`);

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

  console.log('[PASSO 4] Editando Datas (Emissão para Setembro)...');
  const startMonth = await page.$('div[aria-label*="Mês de Data de emissão"] select');
  if (startMonth) {
    await startMonth.selectOption('9'); // Mudando para setembro
  }

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
  console.log('🎉 Certificação editada com sucesso!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
