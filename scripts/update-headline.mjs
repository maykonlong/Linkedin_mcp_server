import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';

const sessionFile = './sessions/session.json';
const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}
const profileUrl = config.profile_url.replace(/\/+$/, '');
const NEW_HEADLINE = 'QA Analyst | Software Testing | PIX · SPI · SPB | Postman · SQL · JIRA | Test Automation';

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

const editProfileBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
await editProfileBtn.click();
console.log('[OK] Botão Editar perfil clicado');

await page.waitForTimeout(3000);

const modalInputs = await page.$$('input, textarea');
console.log(`[INFO] Total de elementos encontrados: ${modalInputs.length}`);

let headlineField = null;

for (let i = 0; i < modalInputs.length; i++) {
  const inp = modalInputs[i];
  const val = await inp.inputValue().catch(() => '');
  console.log(`[${i}] value="${val}"`);

  if (val.trim().toLowerCase() === 'qa') {
    headlineField = inp;
    console.log(`[OK] Encontrado campo por valor 'qa' no índice ${i}!`);
    break;
  }
}

// Se não achou pelo valor 'qa', os inputs no modal de introdução do LinkedIn são:
// [0] Nome ("Maykon")
// [1] Sobrenome ("Batista da Silva")
// [2] Headline / Título
if (!headlineField && modalInputs.length >= 3) {
  headlineField = modalInputs[2];
  console.log('[OK] Selecionado campo de Headline pelo índice [2] no formulário do modal!');
}

if (headlineField) {
  await headlineField.click({ clickCount: 3 });
  await headlineField.fill('');
  await headlineField.fill(NEW_HEADLINE);
  console.log('[SUCCESS] Headline preenchido com sucesso!');

  await page.waitForTimeout(1000);

  const saveBtn = await page.$('button[data-action-type="save"], button:has-text("Salvar"), button:has-text("Save"), button[type="submit"]');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Salvar clicado!');
    await page.waitForTimeout(5000);
    console.log('✅ HEADLINE DO LINKEDIN ATUALIZADO COM SUCESSO!');
  } else {
    console.error('[ERRO] Botão Salvar não encontrado no modal.');
  }
}

await browser.close();
