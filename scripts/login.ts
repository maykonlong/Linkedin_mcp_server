import { chromium } from 'playwright';
import { loadConfig } from '../src/config.js';
import { SessionManager } from '../src/session-manager.js';

const config = loadConfig();
const sessionManager = new SessionManager();

async function main() {
  console.log('============================================');
  console.log('   LinkedIn - Login Manual (Auto-Save)');
  console.log('============================================');
  console.log();
  console.log('Email:', config.email);
  console.log('Abrindo navegador visível...');
  console.log('Faça o login na janela que abrir.');
  console.log('A sessão será salva automaticamente ao detectar o feed.');
  console.log();

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
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  });

  const page = await context.newPage();

  await page.goto('https://www.linkedin.com/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(2000);
  const usernameInput = await page.$('#username');
  if (usernameInput) {
    await usernameInput.fill(config.email);
    console.log('Email preenchido automaticamente.');
    const passwordInput = await page.$('#password');
    if (passwordInput) await passwordInput.focus();
  }

  console.log('>>> Aguardando login...');
  const startTime = Date.now();
  const maxWait = 5 * 60 * 1000;
  let loggedIn = false;

  while (Date.now() - startTime < maxWait) {
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    if (currentUrl.includes('/feed') && !currentUrl.includes('/login')) {
      loggedIn = true;
      break;
    }

    if (currentUrl.includes('/checkpoint')) {
      console.log('[Detecção de verificação de segurança. Complete no navegador...]');
    }
  }

  if (loggedIn) {
    const savedPath = await sessionManager.saveSession(context);
    console.log();
    console.log('✅ SESSÃO SALVA COM SUCESSO!');
    console.log('Arquivo:', savedPath);
  } else {
    console.log();
    console.log('⏰ Timeout: Login não completado em 5 minutos.');
  }

  await page.waitForTimeout(2000);
  await browser.close();
  console.log('Navegador fechado.');
}

main().catch(console.error);
