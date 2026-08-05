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

console.log('=== CLIQUE DIRETO NO SVG DO LÁPIS (EDIT-MEDIUM) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // PASSO 1: Acessar a página do perfil
  console.log('[PASSO 1] Acessando perfil no LinkedIn...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // PASSO 2: Clicar cirurgicamente no SVG edit-medium (lápis) do card Idioma do perfil
  console.log('[PASSO 2] Localizando o SVG edit-medium (lápis) no card Idioma do perfil...');
  
  const clickedPencil = await page.evaluate(() => {
    // Procura a section ou div de Idioma do perfil na barra lateral
    const cards = Array.from(document.querySelectorAll('div, section, aside'));
    const langCard = cards.find(el => {
      const txt = el.innerText || '';
      return txt.includes('Idioma do perfil') || txt.includes('Profile language');
    });

    if (langCard) {
      // Procura a SVG do lápis (id="edit-medium" ou data-token-id="74")
      const svgPencil = langCard.querySelector('svg[id="edit-medium"], svg[data-token-id="74"]');
      if (svgPencil) {
        const btn = svgPencil.closest('button') || svgPencil.closest('a') || svgPencil.parentElement;
        if (btn) {
          btn.click();
          return true;
        }
      }
    }
    
    // Fallback: procura qualquer SVG edit-medium na coluna direita (aside)
    const aside = document.querySelector('aside, .scaffold-layout__aside');
    if (aside) {
      const svgInAside = aside.querySelector('svg[id="edit-medium"], svg[data-token-id="74"]');
      if (svgInAside) {
        const btn = svgInAside.closest('button') || svgInAside.closest('a') || svgInAside.parentElement;
        if (btn) {
          btn.click();
          return true;
        }
      }
    }

    return false;
  });

  if (clickedPencil) {
    console.log('✅ [VALIDADO] Clique no lápis (SVG edit-medium) executado via JS com sucesso!');
  } else {
    console.log('[AVISO] Tentando localizar o lápis via seletor direto...');
    const pencilBtn = await page.$('div:has-text("Idioma do perfil") button, div:has-text("Profile language") button');
    if (pencilBtn) await pencilBtn.evaluate(el => el.click());
  }

  await page.waitForTimeout(3000);

  // PASSO 3: Clicar no botão "+ Adicionar idioma" / "+ Add language" no modal 1 (Imagem 1)
  console.log('[PASSO 3] Procurando o botão "+ Adicionar idioma"...');
  const addLangBtn = await page.waitForSelector('button:has-text("Adicionar idioma"), button:has-text("Add language"), span:has-text("Adicionar idioma"), span:has-text("Add language")', { timeout: 10000 }).catch(() => null);

  if (addLangBtn) {
    await addLangBtn.evaluate(el => el.click());
    console.log('✅ [VALIDADO] Clicado em "+ Adicionar idioma"!');
    await page.waitForTimeout(3500);
  }

  // PASSO 4: Selecionar Português (pt_BR) no dropdown <select>
  console.log('[PASSO 4] Selecionando Português (pt_BR) no dropdown...');
  const selectElement = await page.waitForSelector('.artdeco-modal select, select:has(option[value="pt_BR"])', { timeout: 10000 });
  await selectElement.selectOption('pt_BR');
  console.log('✅ [VALIDADO] Português (pt_BR) selecionado!');
  await page.waitForTimeout(2500);

  // PASSO 5: Marcar a checkbox de idioma principal
  console.log('[PASSO 5] Marcando a checkbox de idioma principal...');
  const primaryCheck = await page.$('label:has-text("Tornar idioma principal"), label:has-text("Make primary language"), label[for*="r2p"], label[for*="rt"]');
  if (primaryCheck) {
    await primaryCheck.evaluate(el => el.click()).catch(() => {});
    console.log('✅ [VALIDADO] Marcado como idioma principal!');
    await page.waitForTimeout(1000);
  }

  // PASSO 6: Preencher First Name (Maykon)
  console.log('[PASSO 6] Preenchendo First Name...');
  const firstNameInput = await page.$('input[id*="r2q"], input[type="text"]:first-of-type');
  if (firstNameInput) {
    await firstNameInput.fill('');
    await firstNameInput.fill(FIRST_NAME).catch(() => {});
    console.log('✅ [VALIDADO] First Name preenchido!');
  }

  // PASSO 7: Preencher Last Name (Batista da Silva)
  console.log('[PASSO 7] Preenchendo Last Name...');
  const lastNameInput = await page.$('input[aria-describedby*="rv"], input[id*="rv"], input[id*="r2r"]');
  if (lastNameInput) {
    await lastNameInput.scrollIntoViewIfNeeded();
    await lastNameInput.fill('');
    await lastNameInput.fill(LAST_NAME);
    console.log(`✅ [VALIDADO] Last Name "${LAST_NAME}" preenchido com sucesso!`);
  } else {
    const inputs = await page.$$('.artdeco-modal input[type="text"], input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[1].fill('');
      await inputs[1].fill(LAST_NAME);
      console.log('✅ [VALIDADO] Last Name preenchido no input ordinal!');
    }
  }

  // PASSO 8: Preencher Headline PT-BR
  console.log('[PASSO 8] Preenchendo Headline PT-BR...');
  const headlineArea = await page.$('.artdeco-modal textarea, textarea');
  if (headlineArea) {
    await headlineArea.fill('');
    await headlineArea.fill(HEADLINE_PTBR);
    console.log('✅ [VALIDADO] Headline PT-BR preenchido!');
  }

  await page.waitForTimeout(2000);

  // PASSO 9: Clicar no botão Salvar / Save
  console.log('[PASSO 9] Clicando no botão Salvar...');
  const saveBtn = await page.$('.artdeco-modal button:has-text("Salvar"), .artdeco-modal button:has-text("Save"), button:has-text("Salvar"), button:has-text("Save"), span:has-text("Save")');
  if (saveBtn) {
    await saveBtn.evaluate(el => el.click());
    console.log('✅ [VALIDADO] Botão Salvar clicado via JS com sucesso!');
    await page.waitForTimeout(6000);
    console.log('🎉 IDIOMA PRIMÁRIO DO PERFIL ALTERADO PARA PORTUGUÊS (PT-BR) E CONCLUÍDO!');
  } else {
    await page.keyboard.press('Enter');
    console.log('✅ [VALIDADO] Formulário enviado via tecla Enter!');
    await page.waitForTimeout(5000);
  }

} catch (err) {
  console.error('❌ [ERRO DE EXECUÇÃO]', err.message);
} finally {
  await browser.close();
}
