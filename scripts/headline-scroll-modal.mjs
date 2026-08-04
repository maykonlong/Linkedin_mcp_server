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

console.log('=== ATUALIZANDO HEADLINE (MODAL SCROLL) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editBtn = await page.waitForSelector('[aria-label="Editar perfil"], [aria-label="Edit profile"]', { timeout: 15000 });
  await editBtn.click();
  await page.waitForTimeout(3000);

  // Rola a div interna do modal para forçar a renderização do campo de Headline/Título
  await page.evaluate(() => {
    const modalBody = document.querySelector('.artdeco-modal__content');
    if (modalBody) modalBody.scrollBy(0, 400);
  });
  await page.waitForTimeout(2000);

  // Procura por textarea ou input que contenha o Headline
  const headlineInput = await page.waitForSelector('.artdeco-modal textarea, textarea[name="headline"], textarea[id*="headline"], input[name="headline"]', { timeout: 8000 }).catch(async () => {
    // Procura por qualquer textarea ou input que tenha a label Título ou Headline
    const allInputs = await page.$$('.artdeco-modal input[type="text"], .artdeco-modal textarea');
    for (const inp of allInputs) {
      const val = await inp.inputValue().catch(() => '');
      if (val.trim().toLowerCase() === 'qa' || val.length > 0) {
        return inp;
      }
    }
    return null;
  });

  if (headlineInput) {
    await headlineInput.scrollIntoViewIfNeeded();
    await headlineInput.click({ clickCount: 3 });
    await headlineInput.fill('');
    await headlineInput.fill(NEW_HEADLINE);
    console.log('[SUCCESS] Campo Headline localizado e preenchido com sucesso!');

    await page.waitForTimeout(1000);
    const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button[data-action-type="save"], button:has-text("Salvar"), button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('✅ HEADLINE ATUALIZADO E SALVO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Campo Headline não encontrado após scroll do modal.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
