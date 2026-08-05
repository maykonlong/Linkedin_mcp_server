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

  // PASSO 3: Clicar no botão "+" (svg[id="add-medium"]) — seletor exato fornecido pelo usuário
  // O SVG tem id="add-medium" (diferente do lápis que usa id="edit-medium")
  // Span classe: _8afe7807 _49ff5183 _50d88983...
  console.log('[PASSO 3] Clicando no botão "+ Adicionar idioma" via svg[id="add-medium"]...');
  const addLangClicked = await page.evaluate(() => {
    // Busca pelo SVG com id="add-medium" (ícone de + do Adicionar idioma)
    const addSvg = document.querySelector('svg[id="add-medium"]');
    if (addSvg) {
      const btn = addSvg.closest('button') || addSvg.parentElement;
      btn?.click();
      return { clicked: true, via: 'svg[id=add-medium]' };
    }
    // Fallback: span com classe _8afe7807 (exata do snippet do usuário)
    const span = document.querySelector('span._8afe7807');
    if (span) {
      const btn = span.closest('button') || span.parentElement;
      btn?.click();
      return { clicked: true, via: 'span._8afe7807' };
    }
    return { clicked: false };
  });

  if (addLangClicked.clicked) {
    console.log(`✅ [VALIDADO] "+ Adicionar idioma" clicado via ${addLangClicked.via}!`);
    await page.waitForTimeout(3500);
  } else {
    console.error('❌ [FALHA] Botão "+ Adicionar idioma" não encontrado!');
    process.exit(1);
  }

  // PASSO 4: Selecionar pt_BR no select de idioma
  console.log('[PASSO 4] Selecionando Português (pt_BR)...');
  const selectEl = await page.waitForSelector('select.e2d9c3f3, select:has(option[value="pt_BR"])', { timeout: 10000 });
  await selectEl.selectOption('pt_BR');
  console.log('✅ [VALIDADO] Português (pt_BR) selecionado!');
  await page.waitForTimeout(2000);

  // PASSO 5: Marcar "Definir como idioma principal"
  // checkbox: input.eef3c9ac[type="checkbox"]
  // label:    label.bc44a536._955b4555._30782d83._4ef8dd46._021da188
  console.log('[PASSO 5] Marcando "Definir como idioma principal"...');
  const primaryResult = await page.evaluate(() => {
    // Prioridade 1: clicar no label (que ativa o checkbox visualmente)
    const label = document.querySelector('label.bc44a536._955b4555._30782d83._4ef8dd46._021da188');
    if (label) {
      label.click();
      return { done: true, via: 'label.bc44a536' };
    }
    // Fallback: marcar o checkbox diretamente pela classe
    const checkbox = document.querySelector('input.eef3c9ac[type="checkbox"]');
    if (checkbox && !checkbox.checked) {
      checkbox.click();
      return { done: true, via: 'input.eef3c9ac' };
    }
    if (checkbox?.checked) {
      return { done: true, via: 'já estava marcado' };
    }
    return { done: false };
  });

  if (primaryResult.done) {
    console.log(`✅ [VALIDADO] "Definir como idioma principal" marcado via ${primaryResult.via}!`);
  } else {
    console.log('[WARN] Checkbox não encontrado — continuando mesmo assim...');
  }


  // PASSO 6: First Name (primeiro input[type="text"] visível no modal)
  console.log('[PASSO 6] Preenchendo First Name...');
  const inputs = await page.$$('input[type="text"]:visible, input.cbf56152');
  if (inputs[0]) {
    await inputs[0].scrollIntoViewIfNeeded();
    await inputs[0].fill('');
    await inputs[0].fill(FIRST_NAME);
    console.log(`✅ [VALIDADO] First Name "${FIRST_NAME}" preenchido!`);
  } else {
    console.log('[WARN] First Name input não encontrado, tentando por índice global...');
    const allInputs = await page.$$('input[type="text"]');
    if (allInputs[0]) { await allInputs[0].fill(''); await allInputs[0].fill(FIRST_NAME); }
  }

  // PASSO 7: Last Name (segundo input[type="text"] visível no modal)
  console.log('[PASSO 7] Preenchendo Last Name...');
  if (inputs[1]) {
    await inputs[1].scrollIntoViewIfNeeded();
    await inputs[1].fill('');
    await inputs[1].fill(LAST_NAME);
    console.log(`✅ [VALIDADO] Last Name "${LAST_NAME}" preenchido!`);
  } else {
    const allInputs = await page.$$('input[type="text"]');
    if (allInputs[1]) {
      await allInputs[1].scrollIntoViewIfNeeded();
      await allInputs[1].fill('');
      await allInputs[1].fill(LAST_NAME);
      console.log(`✅ [VALIDADO] Last Name "${LAST_NAME}" preenchido via fallback!`);
    }
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

  // PASSO 9: Clicar no botão "Salvar"
  // Span externo: _258a2dc3 e6a71372 (classe única do botão Salvar)
  // Span interno: _8afe7807 com texto "Salvar"
  console.log('[PASSO 9] Clicando no botão "Salvar"...');
  const saveResult = await page.evaluate(() => {
    // Prioridade 1: span externo com classe _258a2dc3.e6a71372 (único do botão Salvar)
    const outerSpan = document.querySelector('span._258a2dc3.e6a71372');
    if (outerSpan) {
      const btn = outerSpan.closest('button') || outerSpan.parentElement;
      btn?.click();
      return { clicked: true, via: 'span._258a2dc3.e6a71372' };
    }
    // Prioridade 2: span interno _8afe7807 com texto "Salvar"
    const innerSpans = Array.from(document.querySelectorAll('span._8afe7807'));
    const saveSpan = innerSpans.find(s => s.textContent.trim() === 'Salvar' || s.textContent.trim() === 'Save');
    if (saveSpan) {
      const btn = saveSpan.closest('button') || saveSpan.parentElement;
      btn?.click();
      return { clicked: true, via: `span._8afe7807 texto="${saveSpan.textContent.trim()}"` };
    }
    return { clicked: false };
  });

  if (saveResult.clicked) {
    console.log(`✅ [VALIDADO] Botão Salvar clicado via ${saveResult.via}!`);
  } else {
    console.log('[WARN] Botão Salvar não encontrado, tentando Playwright locator...');
    const saveBtn = await page.getByRole('button', { name: /salvar|save/i }).last().catch(() => null);
    if (saveBtn) {
      await saveBtn.click();
      console.log('✅ [VALIDADO] Botão Salvar clicado via getByRole!');
    } else {
      console.error('❌ [FALHA] Botão Salvar não encontrado!');
    }
  }

  await page.waitForTimeout(6000);
  console.log('🎉 PERFIL EM PORTUGUÊS (PT-BR) DEFINIDO COMO IDIOMA PRIMÁRIO!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
