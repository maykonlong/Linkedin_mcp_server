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

console.log('=== GRAVAÇÃO PERFEITA DO HEADLINE ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Clica no botão "Editar perfil"
  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  // Localiza o campo através da label "Título" ou "Headline" ou textarea
  let field = await page.locator('label:has-text("Título"), label:has-text("Headline")').first().evaluateHandle(el => {
    const parent = el.closest('div');
    return parent ? parent.querySelector('input, textarea') : null;
  }).catch(() => null);

  if (!field || !(await field.asElement())) {
    // Tenta encontrar qualquer textarea ou input que contenha o texto atual
    const inputs = await page.$$('.artdeco-modal textarea, .artdeco-modal input');
    console.log(`[INFO] Encontrados ${inputs.length} campos no modal.`);
    for (const inp of inputs) {
      const val = await inp.inputValue().catch(() => '');
      console.log(` -> val="${val}"`);
      if (val.trim().toLowerCase() === 'qa') {
        field = inp;
        break;
      }
    }
  }

  if (field) {
    const el = field.asElement() || field;
    await el.click({ clickCount: 3 });
    await el.fill('');
    await el.fill(NEW_HEADLINE);
    console.log('[SUCCESS] Headline preenchido com sucesso!');

    await page.waitForTimeout(1000);
    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE SALVO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Campo de Headline não localizado.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
