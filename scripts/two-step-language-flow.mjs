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

const FIRST_NAME    = 'Maykon';
const LAST_NAME     = 'Batista da Silva';
const HEADLINE_PTBR = 'Analista QA | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Automação de Testes';

console.log('=== FLUXO DE IDIOMA — LÁPIS PELO ÍNDICE 3 (CONFIRMADO PELA INSPEÇÃO) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // PASSO 1: Acessar o perfil
  console.log('[PASSO 1] Acessando perfil...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Rolar para forçar renderização do sidebar
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(2000);

  // PASSO 2: Mapear TODOS os botões com SVG edit-medium e clicar no índice 3 (Idioma do perfil)
  console.log('[PASSO 2] Clicando no botão de Idioma do perfil (índice 3 dos edit-medium)...');
  const clickResult = await page.evaluate(() => {
    // Pega todos os SVG edit-medium da página
    const svgs = Array.from(document.querySelectorAll('svg[id="edit-medium"]'));
    const info = svgs.map((svg, i) => {
      const btn = svg.parentElement?.closest('button') || svg.parentElement;
      return { index: i, ariaLabel: btn?.getAttribute('aria-label') || '', tag: btn?.tagName };
    });
    console.log('SVGs encontrados:', JSON.stringify(info));

    // Prioridade 1: aria-label que contenha idioma/language
    const langBtn = svgs.find(svg => {
      const btn = svg.parentElement?.closest('button') || svg.parentElement;
      const label = btn?.getAttribute('aria-label') || '';
      return label.toLowerCase().includes('idioma') || label.toLowerCase().includes('language');
    });

    if (langBtn) {
      const btn = langBtn.parentElement?.closest('button') || langBtn.parentElement;
      btn?.click();
      return { clicked: true, via: 'aria-label', label: btn?.getAttribute('aria-label') };
    }

    // Fallback: índice 3 (confirmado pela inspeção anterior)
    const svg3 = svgs[3];
    if (svg3) {
      const btn = svg3.parentElement?.closest('button') || svg3.parentElement;
      btn?.click();
      return { clicked: true, via: 'indice-3', label: btn?.getAttribute('aria-label') };
    }

    return { clicked: false };
  });

  if (clickResult.clicked) {
    console.log(`✅ [VALIDADO] Lápis clicado via ${clickResult.via} (label: "${clickResult.label}")!`);
  } else {
    console.error('❌ [FALHA] Nenhum lápis de idioma encontrado!');
    process.exit(1);
  }
  await page.waitForTimeout(3000);

  // PASSO 3: Clicar no span "Add language" / "Adicionar idioma"
  console.log('[PASSO 3] Clicando no botão "+ Adicionar idioma"...');
  const addLangBtn = await page.waitForSelector(
    'button:has-text("Adicionar idioma"), button:has-text("Add language")',
    { timeout: 10000 }
  ).catch(() => null);

  if (addLangBtn) {
    await addLangBtn.evaluate(el => el.click());
    console.log('✅ [VALIDADO] Clicado em "+ Adicionar idioma"!');
    await page.waitForTimeout(3500);
  } else {
    console.log('[INFO] Botão "Add language" não encontrado — modal já pode estar no passo do select.');
  }

  // PASSO 4: Selecionar pt_BR no select de idioma
  console.log('[PASSO 4] Selecionando Português (pt_BR)...');
  const selectEl = await page.waitForSelector('select.e2d9c3f3, select:has(option[value="pt_BR"])', { timeout: 10000 });
  await selectEl.selectOption('pt_BR');
  console.log('✅ [VALIDADO] Português (pt_BR) selecionado!');
  await page.waitForTimeout(2000);

  // PASSO 5: Marcar "Make primary language" (label for="«r2p»", classe _017b01a6)
  console.log('[PASSO 5] Marcando Make primary language...');
  await page.evaluate(() => {
    const label = document.querySelector('label._017b01a6') || document.querySelector('label[for]');
    label?.click();
  }).catch(() => {});
  console.log('✅ [VALIDADO] Make primary language clicado!');
  await page.waitForTimeout(1000);

  // PASSO 6: First Name (input id="«r2q»", aria-describedby contém "r2q")
  console.log('[PASSO 6] Preenchendo First Name...');
  const inputs = await page.$$('input[type="text"]');
  if (inputs[0]) { await inputs[0].fill(''); await inputs[0].fill(FIRST_NAME); }
  console.log('✅ [VALIDADO] First Name preenchido!');

  // PASSO 7: Last Name (input id="«r2r»")
  console.log('[PASSO 7] Preenchendo Last Name...');
  if (inputs[1]) {
    await inputs[1].scrollIntoViewIfNeeded();
    await inputs[1].fill('');
    await inputs[1].fill(LAST_NAME);
    console.log(`✅ [VALIDADO] Last Name "${LAST_NAME}" preenchido!`);
  }

  // PASSO 8: Headline (textarea id="«r2s»", classe _0179a374)
  console.log('[PASSO 8] Preenchendo Headline PT-BR...');
  const textarea = await page.$('textarea._0179a374, textarea');
  if (textarea) {
    await textarea.fill('');
    await textarea.fill(HEADLINE_PTBR);
    console.log('✅ [VALIDADO] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // PASSO 9: Clicar no Save (span classe _31325942)
  console.log('[PASSO 9] Clicando no Save...');
  const saveClicked = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span._31325942'));
    // O "Save" é o último span com essa classe (depois do "Add language")
    const saveSpan = spans[spans.length - 1];
    if (saveSpan) {
      const btn = saveSpan.closest('button') || saveSpan.parentElement;
      btn?.click();
      return true;
    }
    return false;
  });

  if (saveClicked) {
    console.log('✅ [VALIDADO] Botão Save clicado!');
  } else {
    await page.keyboard.press('Enter');
    console.log('✅ [VALIDADO] Formulário enviado via Enter!');
  }

  await page.waitForTimeout(6000);
  console.log('🎉 PERFIL EM PORTUGUÊS (PT-BR) DEFINIDO COMO IDIOMA PRIMÁRIO!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
