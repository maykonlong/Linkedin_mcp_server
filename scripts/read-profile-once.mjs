// Script standalone para ler perfil usando sessão salva
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const sessionFile = join('.', 'sessions', 'session.json');
if (!existsSync(sessionFile)) {
  console.error('ERRO: Sessão não encontrada. Execute: npm run login');
  process.exit(1);
}

// Lê config
const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

const browser = await chromium.launch({
  headless: true,
  channel: 'msedge',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800'],
});

const context = await browser.newContext({
  storageState: sessionFile,
  viewport: { width: 1280, height: 800 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
});

const page = await context.newPage();

// Verifica login
await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2000);
if (!page.url().includes('/feed')) {
  console.error('ERRO: Sessão expirada. Execute: npm run login');
  await browser.close();
  process.exit(1);
}
console.log('[OK] Sessão válida');

// Navega para perfil
await page.goto(config.profile_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// Scroll para carregar lazy content
await page.evaluate(async () => {
  for (let i = 0; i < 10; i++) {
    window.scrollBy(0, 600);
    await new Promise(r => setTimeout(r, 800));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1000));
});
await page.waitForTimeout(2000);

// Extrai TODO o texto da página para análise completa
const fullText = await page.evaluate(() => document.body.innerText);

console.log('=== TEXTO COMPLETO DO PERFIL ===');
console.log(fullText);
console.log('=== FIM ===');

await browser.close();
