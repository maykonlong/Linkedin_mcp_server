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

const SKILL_NAME = 'Playwright';
const TARGET_EXPERIENCE = 'Analista de Testes QA Jr na empresa C&M Software';

console.log(`=== VINCULAR COMPETÊNCIA: ${SKILL_NAME} ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de competências...');
  await page.goto(`${profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log(`[PASSO 2] Procurando botão de edição para a competência "${SKILL_NAME}"...`);
  const editButtons = await page.$$(`a[aria-label*="Editar ${SKILL_NAME}"]`);
  
  if (editButtons.length === 0) {
    console.log(`❌ Nenhuma competência encontrada com o nome: ${SKILL_NAME}`);
    process.exit(0);
  }

  // Clica no primeiro
  await editButtons[0].click();
  
  console.log('[PASSO 3] Aguardando tela de edição de vínculos...');
  await page.waitForTimeout(3000);

  console.log(`[PASSO 4] Procurando a experiência: "${TARGET_EXPERIENCE}"...`);
  
  // O container do checkbox tem role="checkbox" e o texto da experiência dentro de um parágrafo
  const checkboxContainer = await page.$(`div[role="checkbox"]:has(p:has-text("${TARGET_EXPERIENCE}"))`);
  
  if (checkboxContainer) {
      const isChecked = await checkboxContainer.getAttribute('aria-checked');
      if (isChecked === 'false') {
          console.log('Clicando para vincular...');
          await checkboxContainer.click();
          await page.waitForTimeout(1000);
      } else {
          console.log('Já está vinculado!');
      }
  } else {
      console.log(`⚠️ Experiência "${TARGET_EXPERIENCE}" não encontrada na lista.`);
      // Mostra as disponíveis para debug
      const allExp = await page.$$eval('div[role="checkbox"] p', ps => ps.map(p => p.innerText));
      console.log('Experiências disponíveis para vínculo:', allExp);
  }

  console.log('[PASSO 5] Clicando em Salvar...');
  const saveBtns = await page.$$('button:has-text("Salvar")');
  const saveBtn = saveBtns[saveBtns.length - 1];
  
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ Botão Salvar clicado!');
  } else {
    console.log('⚠️ Botão Salvar não encontrado.');
  }

  await page.waitForTimeout(4000);
  console.log(`🎉 Competência "${SKILL_NAME}" vinculada com sucesso!`);

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
