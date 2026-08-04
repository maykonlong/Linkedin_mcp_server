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

console.log('=== GRAVAÇÃO DEFINITIVA DO HEADLINE ===');

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

  // Encontra e preenche o campo de Headline com eventos DOM reais
  const headlineSaved = await page.evaluate((text) => {
    // Procura por id contendo headline ou por valor atual "qa" ou pela label "Título"
    const inputs = Array.from(document.querySelectorAll('.artdeco-modal input, .artdeco-modal textarea'));
    
    let target = inputs.find(i => {
      const val = i.value || '';
      const id = i.id || '';
      const name = i.name || '';
      return val.trim().toLowerCase() === 'qa' || id.toLowerCase().includes('headline') || name.toLowerCase().includes('headline');
    });

    // Se não achou por valor/id, no modal de intro o terceiro campo de texto é o Headline (índice 2)
    if (!target && inputs.length >= 3) {
      target = inputs[2];
    }

    if (target) {
      target.value = text;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, NEW_HEADLINE);

  console.log('[OK] Headline preenchido no DOM:', headlineSaved);
  await page.waitForTimeout(1500);

  // Clica em Salvar
  const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Salvar clicado no modal!');
    await page.waitForTimeout(5000);
    console.log('✅ HEADLINE PERSISTIDO COM SUCESSO!');
  } else {
    console.error('[ERRO] Botão Salvar não encontrado no modal.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
