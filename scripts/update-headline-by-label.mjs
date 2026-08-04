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

console.log('=== ATUALIZAÇÃO VISÍVEL DO HEADLINE ===');

const browser = await chromium.launch({
  headless: false,
  channel: 'msedge',
  args: ['--no-sandbox', '--window-size=1280,900'],
});

const context = await browser.newContext({
  storageState: sessionFile,
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
});

const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Clica no botão de editar perfil
  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  // Procura todos os inputs/textareas visíveis no formulário
  const fields = await page.$$('input, textarea');
  console.log(`[INFO] Encontrados ${fields.length} campos visíveis.`);

  let targetField = null;

  for (const field of fields) {
    const val = await field.inputValue().catch(() => '');
    const isVisible = await field.isVisible().catch(() => false);
    if (isVisible && (val.toLowerCase().includes('qa') || val.length === 2)) {
      targetField = field;
      console.log(`[OK] Campo Headline localizado com valor atual: "${val}"`);
      break;
    }
  }

  if (!targetField && fields.length >= 3) {
    // No formulário de intro do LinkedIn em PT-BR:
    // [0] Nome ("Maykon")
    // [1] Sobrenome ("Batista da Silva")
    // [2] Nome adicional
    // [3] Pronomes ("Ele/Dele")
    // [4] Headline ("qa")
    for (let i = 2; i < fields.length; i++) {
      const val = await fields[i].inputValue().catch(() => '');
      if (val.toLowerCase().trim() === 'qa') {
        targetField = fields[i];
        console.log(`[OK] Encontrado no índice ${i}!`);
        break;
      }
    }
  }

  if (targetField) {
    await targetField.scrollIntoViewIfNeeded();
    await targetField.click({ clickCount: 3 });
    await targetField.fill(NEW_HEADLINE);
    console.log('[SUCCESS] Novo Headline preenchido com sucesso!');

    await page.waitForTimeout(1500);

    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE SALVO COM SUCESSO NO LINKEDIN!');
    }
  } else {
    console.log('[AVISO] Não foi possível focar automaticamente. A janela do Edge está aberta para você conferir.');
    await page.waitForTimeout(10000);
  }

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
