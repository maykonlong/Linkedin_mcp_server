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

console.log('=== AUDITORIA E VERIFICAÇÃO FINAL DO PERFIL ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const headline = await page.$eval('.text-body-medium', el => el.innerText.trim()).catch(() => 'Não capturado');
  
  const about = await page.$eval('#about ~ .display-flex .inline-show-more-text, section:has(#about) .inline-show-more-text', el => el.innerText.trim()).catch(() => 'Não capturado');

  console.log('\n--- HEADLINE ATUAL ---');
  console.log(headline);

  console.log('\n--- SEÇÃO SOBRE (ABOUT) ---');
  console.log(about.slice(0, 300) + '...');

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
