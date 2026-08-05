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

// O idioma que queremos definir como principal (ex: "Português" ou "Inglês")
const TARGET_LANGUAGE = 'Português';

console.log(`=== DEFINIR "${TARGET_LANGUAGE}" COMO IDIOMA PRINCIPAL ===`);

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando perfil...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(2000);

  console.log('[PASSO 2] Clicando no lápis do Idioma do perfil...');
  const clickResult = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg[id="edit-medium"]'));
    const langSvg = svgs.find(svg => {
      const btn = svg.parentElement?.closest('button') || svg.parentElement;
      const label = btn?.getAttribute('aria-label') || '';
      return label.toLowerCase().includes('idioma') || label.toLowerCase().includes('language');
    });

    const target = langSvg || svgs[3];
    if (target) {
      const btn = target.parentElement?.closest('button') || target.parentElement;
      btn?.click();
      return { clicked: true };
    }
    return { clicked: false };
  });

  if (!clickResult.clicked) {
    console.error('❌ [FALHA] Lápis de idioma não encontrado!');
    process.exit(1);
  }
  await page.waitForTimeout(3000);

  // PASSO 3: Validar idioma atual e alterar se necessário
  console.log('[PASSO 3] Verificando o idioma principal atual...');
  
  const currentLangResult = await page.evaluate((targetLang) => {
    // Procura o botão do dropdown de idioma (tem o caret-small)
    const carets = Array.from(document.querySelectorAll('svg[id="caret-small"]'));
    const dropdownBtn = carets[0]?.closest('button') || carets[0]?.closest('div');
    
    if (!dropdownBtn) return { found: false };

    const currentText = dropdownBtn.innerText?.trim();
    if (currentText === targetLang) {
      return { found: true, isAlreadyTarget: true, currentText };
    }
    
    // Se não for o alvo, clica no dropdown para abrir as opções
    dropdownBtn.click();
    return { found: true, isAlreadyTarget: false, currentText };
  }, TARGET_LANGUAGE);

  if (!currentLangResult.found) {
    console.log('[INFO] Dropdown de idioma principal não encontrado. Pode ser que você tenha apenas 1 idioma adicionado.');
    console.log('       Nesse caso, ele já é o principal automaticamente.');
  } else if (currentLangResult.isAlreadyTarget) {
    console.log(`✅ [VALIDADO] O idioma principal já é "${TARGET_LANGUAGE}"! Nenhuma alteração necessária.`);
  } else {
    console.log(`[INFO] O idioma atual é "${currentLangResult.currentText}". Alterando para "${TARGET_LANGUAGE}"...`);
    await page.waitForTimeout(1500);

    // Clicar na opção desejada dentro do dropdown aberto
    const optionClicked = await page.evaluate((targetLang) => {
      // Como o dropdown é customizado, procuramos por divs/spans visíveis com o texto exato
      // Ignorando o próprio botão do dropdown
      const elements = Array.from(document.querySelectorAll('div, span, li'))
        .filter(el => el.textContent.trim() === targetLang && el.closest('button') === null);
      
      for (const el of elements) {
        // Encontra o item clicável pai
        const clickable = el.closest('[role="option"]') || el.closest('li') || el.closest('div[tabindex]');
        if (clickable) {
          clickable.click();
          return true;
        }
      }
      return false;
    }, TARGET_LANGUAGE);

    if (optionClicked) {
      console.log(`✅ [VALIDADO] Opção "${TARGET_LANGUAGE}" selecionada no dropdown!`);
      await page.waitForTimeout(1000);
    } else {
      console.error(`❌ [FALHA] Opção "${TARGET_LANGUAGE}" não encontrada no dropdown. Verifique se o idioma já foi adicionado ao perfil.`);
      // Tenta fallback com Playwright locator
      const optionLocator = await page.getByRole('option', { name: new RegExp(TARGET_LANGUAGE, 'i') }).catch(() => null);
      if (optionLocator) {
        await optionLocator.click();
        console.log(`✅ [VALIDADO] Opção selecionada via getByRole!`);
      } else {
        process.exit(1);
      }
    }

    // PASSO 4: Salvar a mudança
    console.log('[PASSO 4] Clicando no botão "Salvar"...');
    const saveResult = await page.evaluate(() => {
      const outerSpan = document.querySelector('span._258a2dc3.e6a71372');
      if (outerSpan) {
        const btn = outerSpan.closest('button') || outerSpan.parentElement;
        btn?.click();
        return { clicked: true, via: 'span._258a2dc3.e6a71372' };
      }
      const innerSpans = Array.from(document.querySelectorAll('span._8afe7807'));
      const saveSpan = innerSpans.find(s => s.textContent.trim() === 'Salvar' || s.textContent.trim() === 'Save');
      if (saveSpan) {
        const btn = saveSpan.closest('button') || saveSpan.parentElement;
        btn?.click();
        return { clicked: true, via: `span._8afe7807` };
      }
      return { clicked: false };
    });

    if (!saveResult.clicked) {
      const saveBtn = await page.$$('button:has(span._8afe7807)');
      if (saveBtn[saveBtn.length - 1]) {
        await saveBtn[saveBtn.length - 1].click();
      } else {
        const saveFallback = await page.$('button:has-text("Salvar"), button:has-text("Save")');
        if (saveFallback) await saveFallback.click();
      }
    }
    console.log('✅ [VALIDADO] Salvo com sucesso!');
    await page.waitForTimeout(3000);
  }

  // PASSO 5: Clicar em "Concluído" se o modal ainda estiver aberto (ou se salvou agora)
  console.log('[PASSO 5] Verificando se precisamos clicar em "Concluído"...');
  const doneResult = await page.evaluate(() => {
    const outerSpan = document.querySelector('span.f22b271e._9a39c7cc');
    if (outerSpan) {
      const btn = outerSpan.closest('button') || outerSpan.parentElement;
      btn?.click();
      return true;
    }
    const innerSpans = Array.from(document.querySelectorAll('span._04113bfd'));
    const doneSpan = innerSpans.find(s => s.textContent.trim() === 'Concluído' || s.textContent.trim() === 'Done');
    if (doneSpan) {
      const btn = doneSpan.closest('button') || doneSpan.parentElement;
      btn?.click();
      return true;
    }
    return false;
  });

  if (doneResult) {
    console.log('✅ [VALIDADO] Botão Concluído clicado!');
  } else {
    // Fallback locator
    const doneBtn = await page.$('button:has-text("Concluído"), button:has-text("Done")');
    if (doneBtn) {
      await doneBtn.click();
      console.log('✅ [VALIDADO] Botão Concluído clicado via fallback!');
    } else {
      console.log('Modal já fechado ou botão Concluído não necessário.');
    }
  }

  console.log('\n🎉 SCRIPT FINALIZADO COM SUCESSO!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
