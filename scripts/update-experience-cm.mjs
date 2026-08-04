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

// ID da experiência na C&M Software — altere conforme o seu perfil
const EXPERIENCE_FORM_ID = '1984080321';
const experienceEditUrl = `${profileUrl}/details/experience/edit/forms/${EXPERIENCE_FORM_ID}/`;

const NEW_DESCRIPTION = `Atuação como QA Analyst especializado no ecossistema de pagamentos instantâneos (PIX), Sistema de Pagamentos Brasileiro (SPB) e Sistema de Pagamentos Instantâneos (SPI).

Principais responsabilidades e conquistas:
• Execução de testes funcionais, regressivos e de integração em APIs REST utilizando Postman para fluxos de PIX, SPI e SPB.
• Validação de dados e integridade de banco de dados por meio de consultas SQL.
• Análise técnica de logs de aplicação em ambiente Linux para identificação e resolução de inconsistências técnicas.
• Validação de regras de negócio em motores de antifraude e mensageria financeira alinhados às normas do Banco Central (Bacen).
• Atuação com cultura Shift-Left Testing e gestão de defeitos via JIRA, reduzindo a incidência de falhas em ambiente de produção.`;

console.log('=== ATUALIZANDO EXPERIÊNCIA PROFISSIONAL (C&M SOFTWARE) ===');
console.log('Tamanho da descrição:', NEW_DESCRIPTION.length, 'caracteres (limite 2000)');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(experienceEditUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Procura a área/campo de Descrição (pode ser textarea ou div contenteditable)
  const descField = await page.$('textarea[name="description"], textarea[id*="description"], textarea, div[contenteditable="true"]');
  
  if (descField) {
    console.log('[SUCCESS] Encontrado o campo de Descrição da Experiência!');
    await descField.scrollIntoViewIfNeeded();
    await descField.focus();
    
    // Selecionar tudo e limpar o conteúdo anterior
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // Preencher a descrição otimizada
    await descField.fill(NEW_DESCRIPTION);
    console.log('[SUCCESS] Nova descrição otimizada preenchida!');

    await page.waitForTimeout(2000);

    // Clicar no botão Salvar/Save
    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('🎉 EXPERIÊNCIA DA C&M SOFTWARE ATUALIZADA COM SUCESSO NO LINKEDIN!');
    } else {
      console.error('[ERRO] Botão Salvar não encontrado.');
    }
  } else {
    console.error('[ERRO] Campo de Descrição não localizado na página de edição.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
