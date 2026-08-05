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

const CERT_DATA = {
  nome: 'Certificação de Vibe Coding',
  organizacao: 'MCP University',
  mesEmissao: '8', // Agosto
  anoEmissao: '2026',
  codigo: 'VIBE-2026-X1',
  url: 'https://github.com/maykonlong/Linkedin_mcp_server',
  competencia: 'Playwright'
};

console.log('=== ADICIONAR CERTIFICAÇÃO (TESTE) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  console.log('[PASSO 1] Acessando detalhes de certificações...');
  await page.goto(`${profileUrl}/details/certifications/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('[PASSO 2] Clicando no botão Adicionar Certificação (+)...');
  const clicked = await page.evaluate(() => {
    const addSvgs = Array.from(document.querySelectorAll('svg[id="add-medium"]'));
    if (addSvgs[0]) {
      const btn = addSvgs[0].closest('button') || addSvgs[0].closest('a');
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  if (!clicked) {
    console.log('Tentando URL direta...');
    await page.goto(`${profileUrl}/edit/forms/certification/new/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  console.log('[PASSO 3] Aguardando modal...');
  await page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('[PASSO 4] Preenchendo campos textuais (Nome, Organização)...');
  
  // Nome
  const nomeInput = await page.$('input[id*="custom-typeahead"], input[aria-label="Nome*"]');
  if (nomeInput) {
    await nomeInput.click();
    await page.keyboard.type(CERT_DATA.nome, { delay: 30 });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape'); // Fecha dropdown
  }

  // Organização emissora
  const orgInput = await page.$('input[aria-label="Organização emissora*"]');
  if (orgInput) {
    await orgInput.click();
    await page.keyboard.type(CERT_DATA.organizacao, { delay: 30 });
    await page.waitForTimeout(1500);
    // Clica na primeira opção do dropdown se existir, ou da ESC
    const orgDropdown = await page.$$('div[role="listbox"] div[role="option"]');
    if (orgDropdown.length > 0) {
      await orgDropdown[0].click();
    } else {
      await page.keyboard.press('Escape');
    }
  }

  console.log('[PASSO 5] Preenchendo Datas (Emissão)...');
  const startMonth = await page.$('div[aria-label*="Mês"] select');
  if (startMonth) await startMonth.selectOption(CERT_DATA.mesEmissao);
  
  const startYear = await page.$('div[aria-label*="Ano"] select');
  if (startYear) await startYear.selectOption(CERT_DATA.anoEmissao);

  console.log('[PASSO 6] Preenchendo Código e URL...');
  // O aria-label está nulo na estrutura bruta para eles, então vamos procurar pelas labels vinculadas aos IDs
  await page.evaluate((data) => {
    const labels = Array.from(document.querySelectorAll('label'));
    
    const codigoLabel = labels.find(l => l.innerText.includes('Código da credencial'));
    if (codigoLabel) {
      const inputId = codigoLabel.getAttribute('for');
      if (inputId) document.getElementById(inputId).value = data.codigo;
    }
    
    const urlLabel = labels.find(l => l.innerText.includes('URL da credencial'));
    if (urlLabel) {
      const inputId = urlLabel.getAttribute('for');
      if (inputId) {
        document.getElementById(inputId).value = data.url;
        // Dispatch event para forçar o React a pegar o valor
        document.getElementById(inputId).dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, CERT_DATA);
  
  // Como usamos evaluate para setar o valor direto (bypass), precisamos despachar eventos, mas o Playwright .fill é melhor se acharmos o locator.
  // Vamos tentar também via locators:
  const codigoLabelHandle = await page.$('label:has-text("Código da credencial")');
  if (codigoLabelHandle) {
     const forAttr = await codigoLabelHandle.getAttribute('for');
     if (forAttr) await page.fill(`input[id="${forAttr}"]`, CERT_DATA.codigo);
  }
  
  const urlLabelHandle = await page.$('label:has-text("URL da credencial")');
  if (urlLabelHandle) {
     const forAttr = await urlLabelHandle.getAttribute('for');
     if (forAttr) await page.fill(`input[id="${forAttr}"]`, CERT_DATA.url);
  }

  console.log('[PASSO 7] Adicionando competência...');
  const addSkillBtn = await page.$('button:has-text("Adicionar competência")');
  if (addSkillBtn) {
    await addSkillBtn.click();
    await page.waitForTimeout(1000);
    
    const skillInput = await page.$('input[placeholder*="Competência"]');
    if (skillInput) {
      await skillInput.fill(CERT_DATA.competencia);
      await page.waitForTimeout(2000);
      
      const skillOption = await page.$('div[role="listbox"] div[role="option"]');
      if (skillOption) {
        await skillOption.click();
      } else {
        await page.keyboard.press('Enter');
      }
    }
  }

  await page.waitForTimeout(2000);

  console.log('[PASSO 8] Clicando em Salvar...');
  const saveBtns = await page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar")');
  const saveBtn = saveBtns[saveBtns.length - 1];
  
  if (saveBtn) {
    await saveBtn.click();
    console.log('✅ Botão Salvar clicado!');
  } else {
    console.log('⚠️ Botão Salvar não encontrado.');
  }

  await page.waitForTimeout(5000);
  console.log('🎉 Certificação adicionada com sucesso!');

} catch (err) {
  console.error('❌ [ERRO]', err.message);
} finally {
  await browser.close();
}
