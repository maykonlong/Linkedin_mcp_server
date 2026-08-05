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

const TARGET_LANGUAGE_VALUE = 'en_US'; // 'es_ES', 'en_US', etc.

console.log(`=== ADICIONAR IDIOMA DO PERFIL: ${TARGET_LANGUAGE_VALUE} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando a página de adicionar idioma secundário...');
  await page.goto(`${profileUrl}/edit/secondary-language/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('[PASSO 2] Procurando o seletor de idiomas...');
  // O select pode ser encontrado por ser o único ou o primeiro no modal
  const languageSelect = await page.$('select');
  
  if (languageSelect) {
      console.log(`[PASSO 3] Selecionando o idioma "${TARGET_LANGUAGE_VALUE}"...`);
      await languageSelect.selectOption(TARGET_LANGUAGE_VALUE);
      await page.waitForTimeout(2000);
      
      console.log('[PASSO 4] Clicando em Salvar...');
      const saveBtns = await page.$$('button:has-text("Salvar")');
      const saveBtn = saveBtns[saveBtns.length - 1];
      if (saveBtn) {
          await saveBtn.click();
          console.log('✅ Botão Salvar clicado!');
      } else {
          console.log('⚠️ Botão Salvar não encontrado.');
      }
  } else {
      console.log('❌ O dropdown de idioma não foi encontrado na página. Talvez o perfil já tenha atingido o limite ou o modal não abriu corretamente.');
  }

  await page.waitForTimeout(5000);
  console.log('🎉 Finalizado!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
