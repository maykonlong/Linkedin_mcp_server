/**
 * Login interativo para renovar a sessão do LinkedIn.
 * Uso: node scripts/login-session.mjs
 * 
 * Abre uma janela do Edge para você fazer o login manualmente.
 * Após detectar o feed, salva a sessão automaticamente.
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega configurações
const configPath = resolve(__dirname, '..', 'conf.ini');
const config = {};
if (existsSync(configPath)) {
  const lines = readFileSync(configPath, 'utf-8').split('\n');
  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      config[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
    }
  }
}

const email = process.env.LINKEDIN_EMAIL || config.email;
const sessionDir = resolve(__dirname, '..', 'sessions');
const sessionPath = resolve(sessionDir, 'session.json');

console.log('============================================');
console.log('   LinkedIn - Renovação de Sessão');
console.log('============================================');
console.log('');
console.log('Email:', email);
console.log('Abrindo Edge para login manual...');
console.log('Faça o login na janela que abrir.');
console.log('A sessão será salva automaticamente ao detectar o feed.');
console.log('');

const browser = await chromium.launch({
  headless: false,
  channel: 'msedge',
  args: [
    '--no-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1280,900',
  ],
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
});

const page = await context.newPage();
await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);

// Preenche e-mail automaticamente
const userField = await page.$('#username');
if (userField) {
  await userField.fill(email);
  console.log('✅ E-mail preenchido. Digite a senha e faça login.');
  const passField = await page.$('#password');
  if (passField) await passField.focus();
}

const maxWait = 5 * 60 * 1000;
const startTime = Date.now();
let loggedIn = false;

while (Date.now() - startTime < maxWait) {
  await page.waitForTimeout(2000);
  const url = page.url();

  if (url.includes('/feed') && !url.includes('/login')) {
    loggedIn = true;
    break;
  }
  if (url.includes('/checkpoint')) {
    console.log('[⚠️  Verificação de segurança detectada. Complete no navegador...]');
  }
}

if (loggedIn) {
  const { mkdirSync } = await import('fs');
  mkdirSync(sessionDir, { recursive: true });
  await context.storageState({ path: sessionPath });
  console.log('');
  console.log('✅ SESSÃO SALVA COM SUCESSO!');
  console.log('Arquivo:', sessionPath);
} else {
  console.log('');
  console.log('⏰ Timeout: Login não completado em 5 minutos.');
}

await page.waitForTimeout(2000);
await browser.close();
console.log('Navegador fechado. Pode fechar este terminal.');
