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

// Dados de teste
const EDU_DATA = {
  instituicao: 'Universidade de Teste IA',
  diploma: 'Bacharelado em Testes Automatizados',
  area: 'Engenharia de Software',
  mesInicio: '3', // Março
  anoInicio: '2020',
  mesFim: '12', // Dezembro
  anoFim: '2024',
  nota: '9.5',
  atividades: 'Grupo de Vibe Coding, Maratona de Programação',
  descricao: 'Formação focada em desenvolvimento de IAs e testes automatizados. [Gerado por MCP]'
};

console.log('=== ADICIONAR FORMAÇÃO ACADÊMICA (TESTE) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de formação...');
  await page.goto(`${profileUrl}/details/education/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('[PASSO 2] Clicando no botão Adicionar Formação (+)...');
  const addClicked = await page.evaluate(() => {
    const addSvgs = Array.from(document.querySelectorAll('svg[id="add-medium"]'));
    if (addSvgs[0]) {
      const btn = addSvgs[0].closest('button') || addSvgs[0].closest('a');
      btn?.click();
      return true;
    }
    return false;
  });

  if (!addClicked) {
    console.error('❌ Não encontrou botão de adicionar. Tentando URL direta...');
    await page.goto(`${profileUrl}/edit/forms/education/new/`);
  }
  
  // Aguardar modal carregar (pode ser <dialog> nativo ou div[role="dialog"])
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(3000); // Dar tempo para os componentes typeahead inicializarem

  console.log('[PASSO 3] Preenchendo campos textuais...');

  // 1. Instituição (Typeahead)
  console.log(' -> Instituição');
  const instInput = await page.$('input[placeholder*="Fundação Getúlio Vargas"]');
  if (instInput) {
    await instInput.fill('');
    await instInput.fill(EDU_DATA.instituicao);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // Fecha dropdown
  }

  // 2. Diploma
  console.log(' -> Diploma');
  const diplomaInput = await page.$('input[aria-label="Diploma"]');
  if (diplomaInput) {
    await diplomaInput.fill('');
    await diplomaInput.fill(EDU_DATA.diploma);
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }

  // 3. Área de estudo
  console.log(' -> Área de estudo');
  const areaInput = await page.$('input[aria-label="Área de estudo"]');
  if (areaInput) {
    await areaInput.fill('');
    await areaInput.fill(EDU_DATA.area);
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
  }

  console.log('[PASSO 4] Preenchendo Datas...');
  // Data Início
  const startMonth = await page.$('select[aria-label="Mês de Data de início"]');
  if (startMonth) await startMonth.selectOption(EDU_DATA.mesInicio);
  
  const startYear = await page.$('select[aria-label="Ano de Data de início"]');
  if (startYear) await startYear.selectOption(EDU_DATA.anoInicio);

  // Data Fim
  const endMonth = await page.$('select[aria-label="Mês de Data de término (ou prevista)"]');
  if (endMonth) await endMonth.selectOption(EDU_DATA.mesFim);
  
  const endYear = await page.$('select[aria-label="Ano de Data de término (ou prevista)"]');
  if (endYear) await endYear.selectOption(EDU_DATA.anoFim);

  console.log('[PASSO 5] Preenchendo campos complementares (Nota, Atividades, Descrição)...');
  const notaInput = await page.$('input[aria-label^="Nota"]');
  if (notaInput) await notaInput.fill(EDU_DATA.nota);

  const atividadesInput = await page.$('textarea[aria-label^="Atividades"]');
  if (atividadesInput) await atividadesInput.fill(EDU_DATA.atividades);

  const descInput = await page.$('textarea[aria-label^="Descrição"]');
  if (descInput) await descInput.fill(EDU_DATA.descricao);

  console.log('[PASSO 6] Adicionando competência...');
  const addSkillBtn = await page.$('button:has-text("Adicionar competência"), button:has-text("Add skill")');
  if (addSkillBtn) {
    await addSkillBtn.click();
    await page.waitForTimeout(1000);
    const skillInput = await page.$('input[placeholder*="Competência"]');
    if (skillInput) {
      await skillInput.fill('Playwright');
      await page.waitForTimeout(1500);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
    }
  }

  console.log('[PASSO 7] Clicando em Salvar...');
  const saveBtns = await page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar")');
  const saveBtn = saveBtns[saveBtns.length - 1];
  if (saveBtn) {
    // DESCOMENTAR PARA SALVAR DE VERDADE:
    await saveBtn.click();
    console.log('✅ Botão Salvar clicado!');
  } else {
    console.log('⚠️ Botão Salvar não encontrado (provavelmente o texto é diferente).');
  }

  await page.waitForTimeout(5000);
  console.log('🎉 Formação acadêmica processada!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
