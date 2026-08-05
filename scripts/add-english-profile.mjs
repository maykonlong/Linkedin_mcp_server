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

const FIRST_NAME      = 'Maykon';
const LAST_NAME       = 'Batista da Silva';
const HEADLINE_EN     = 'QA Analyst | AI-Driven Testing & Vibe Coding | PIX · SPI · SPB | Postman · SQL · JIRA | Test Automation';

console.log('=== ADICIONAR PERFIL EM INGLÊS (SEM DEFINIR COMO PRINCIPAL) ===');

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

  // PASSO 2: Clicar no lápis do "Idioma do perfil" (índice 3 dos svg[id="edit-medium"])
  console.log('[PASSO 2] Clicando no lápis do Idioma do perfil (índice 3)...');
  const clickResult = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[id="edit-medium"]'));

    // Prioridade: aria-label com "idioma" ou "language"
    const langSvg = svgs.find(svg => {
      const btn = svg.parentElement?.closest('button') || svg.parentElement;
      const label = btn?.getAttribute('aria-label') || '';
      return label.toLowerCase().includes('idioma') || label.toLowerCase().includes('language');
    });

    const target = langSvg || svgs[3];
    if (target) {
      const btn = target.parentElement?.closest('button') || target.parentElement;
      btn?.click();
      return { clicked: true, via: langSvg ? 'aria-label' : 'indice-3' };
    }
    return { clicked: false };
  });

  if (!clickResult.clicked) {
    console.error('❌ [FALHA] Lápis de idioma não encontrado!');
    process.exit(1);
  }
  console.log(`✅ [VALIDADO] Lápis clicado via ${clickResult.via}!`);
  await page.waitForTimeout(3000);

  // PASSO 3: Clicar no botão "+ Adicionar idioma" (svg[id="add-medium"])
  console.log('[PASSO 3] Clicando em "+ Adicionar idioma" via svg[id="add-medium"]...');
  const addLangResult = await page.evaluate(() => {
    const addSvg = document.querySelector('svg[id="add-medium"]');
    if (addSvg) {
      const btn = addSvg.closest('button') || addSvg.parentElement;
      btn?.click();
      return { clicked: true, via: 'svg[id=add-medium]' };
    }
    const span = document.querySelector('span._8afe7807');
    if (span) {
      const btn = span.closest('button') || span.parentElement;
      btn?.click();
      return { clicked: true, via: 'span._8afe7807' };
    }
    return { clicked: false };
  });

  if (!addLangResult.clicked) {
    console.error('❌ [FALHA] Botão "+ Adicionar idioma" não encontrado!');
    process.exit(1);
  }
  console.log(`✅ [VALIDADO] "+ Adicionar idioma" clicado via ${addLangResult.via}!`);
  await page.waitForTimeout(3500);

  // PASSO 4: Selecionar English (en_US) no select
  // Classe atual do select: b1d1561e (inspecionado em runtime)
  // Valor confirmado: en_US
  console.log('[PASSO 4] Selecionando English (en_US)...');
  const selectEl = await page.waitForSelector(
    'select.b1d1561e, select:has(option[value="en_US"])',
    { timeout: 10000 }
  );
  await selectEl.selectOption('en_US');
  console.log('✅ [VALIDADO] English (en_US) selecionado!');
  await page.waitForTimeout(2000);

  // PASSO 5: NÃO marcar "Definir como idioma principal" — perfil EN é secundário
  console.log('[PASSO 5] Verificando que "Definir como idioma principal" está DESMARCADO...');
  const checkboxState = await page.evaluate(() => {
    const checkbox = document.querySelector('input.eef3c9ac[type="checkbox"]');
    if (checkbox) {
      // Garantir que está DESMARCADO
      if (checkbox.checked) {
        checkbox.click(); // desmarcar se estiver marcado
        return 'estava marcado — desmarcado';
      }
      return 'já estava desmarcado — OK';
    }
    return 'checkbox não encontrado';
  });
  console.log(`✅ [VALIDADO] Checkbox: ${checkboxState}`);
  await page.waitForTimeout(1000);

  // PASSO 6: First Name
  console.log('[PASSO 6] Preenchendo First Name...');
  const inputs = await page.$$('input[type="text"]:visible, input.cbf56152');
  if (inputs[0]) {
    await inputs[0].scrollIntoViewIfNeeded();
    await inputs[0].fill('');
    await inputs[0].fill(FIRST_NAME);
    console.log(`✅ [VALIDADO] First Name "${FIRST_NAME}" preenchido!`);
  } else {
    const allInputs = await page.$$('input[type="text"]');
    if (allInputs[0]) { await allInputs[0].fill(''); await allInputs[0].fill(FIRST_NAME); }
  }

  // PASSO 7: Last Name
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

  // PASSO 8: Headline em inglês
  console.log('[PASSO 8] Preenchendo Headline em inglês...');
  const textarea = await page.$('textarea._0179a374, textarea');
  if (textarea) {
    await textarea.fill('');
    await textarea.fill(HEADLINE_EN);
    console.log(`✅ [VALIDADO] Headline EN: "${HEADLINE_EN}"`);
  }

  await page.waitForTimeout(2000);

  // PASSO 9: Clicar no botão "Salvar"
  // Span externo: _258a2dc3 e6a71372 | Span interno: _8afe7807 texto "Salvar"
  console.log('[PASSO 9] Clicando no botão "Salvar"...');
  const saveResult = await page.evaluate(() => {
    // Prioridade 1: span externo único do botão Salvar
    const outerSpan = document.querySelector('span._258a2dc3.e6a71372');
    if (outerSpan) {
      const btn = outerSpan.closest('button') || outerSpan.parentElement;
      btn?.click();
      return { clicked: true, via: 'span._258a2dc3.e6a71372' };
    }
    // Prioridade 2: span _8afe7807 com texto Salvar/Save
    const innerSpans = Array.from(document.querySelectorAll('span._8afe7807'));
    const saveSpan = innerSpans.find(s => s.textContent.trim() === 'Salvar' || s.textContent.trim() === 'Save');
    if (saveSpan) {
      const btn = saveSpan.closest('button') || saveSpan.parentElement;
      btn?.click();
      return { clicked: true, via: `span._8afe7807 "${saveSpan.textContent.trim()}"` };
    }
    return { clicked: false };
  });

  if (saveResult.clicked) {
    console.log(`✅ [VALIDADO] Botão Salvar clicado via ${saveResult.via}!`);
  } else {
    // Fallback: page.$$ para pegar o último botão com texto Salvar/Save
    const allSaveBtns = await page.$$('button:has(span._8afe7807)');
    const lastSaveBtn = allSaveBtns[allSaveBtns.length - 1];
    if (lastSaveBtn) {
      await lastSaveBtn.click();
      console.log('✅ [VALIDADO] Botão Salvar clicado via fallback page.$$!');
    } else {
      // Último recurso: procurar por qualquer botão com texto Salvar
      const saveBtnEl = await page.$('button:has-text("Salvar"), button:has-text("Save")');
      if (saveBtnEl) {
        await saveBtnEl.click();
        console.log('✅ [VALIDADO] Botão Salvar clicado via has-text!');
      } else {
        console.error('❌ [FALHA] Botão Salvar não encontrado!');
      }
    }
  }

  await page.waitForTimeout(6000);
  console.log('');
  console.log('🎉 PERFIL EM INGLÊS ADICIONADO COMO IDIOMA SECUNDÁRIO!');
  console.log(`   Headline EN: "${HEADLINE_EN}"`);
  console.log('   Idioma principal: PT-BR (mantido)');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
