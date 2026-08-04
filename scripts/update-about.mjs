import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';

const sessionFile = './sessions/session.json';
if (!existsSync(sessionFile)) {
  console.error('ERRO: Sessão não encontrada.');
  process.exit(1);
}

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

const profileUrl = config.profile_url.replace(/\/+$/, '');

const NEW_ABOUT_BILINGUAL = `🎯 Analista de QA com 3+ anos de experiência em testes de sistemas de pagamento de grande escala (PIX, SPI, SPB).
Especialista em validação de APIs REST (Postman), consultas SQL, análise de logs em ambiente Linux e gestão ágil com JIRA.

Experiência sólida na criação de cenários de testes, execução de testes funcionais e de integração, e prevenção de incidentes em produção através de estratégias robustas de QA.

Background em eletrônica e liderança técnica contribuindo com forte raciocínio analítico, melhoria de processos e resolução de problemas.

📩 Contato direto: [SEU_EMAIL]

--------------------------------------------------

🎯 QA Analyst | 3+ years testing large-scale payment systems (PIX, SPI, SPB).
Skilled in API testing (Postman), SQL queries, Linux log analysis, and JIRA in agile environments.

Experienced in creating test scenarios, executing functional and integration tests, and preventing production incidents through robust QA strategies.

📩 Open to remote/global opportunities — reach me at: [SEU_EMAIL]`;

console.log('=== ATUALIZANDO SEÇÃO SOBRE (BILÍNGUE PT-BR + EN) ===');

const browser = await chromium.launch({
  headless: false,
  channel: 'msedge',
  args: ['--no-sandbox', '--window-size=1280,900'],
});

const context = await browser.newContext({
  storageState: sessionFile,
  viewport: { width: 1280, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
});

const page = await context.newPage();

try {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('[OK] Perfil carregado');

  // Clica no botão exato "Editar sobre"
  const editAboutBtn = await page.waitForSelector('[aria-label="Editar sobre"], [aria-label="Edit about"]', { timeout: 15000 });
  await editAboutBtn.click();
  console.log('[OK] Botão "Editar sobre" clicado com sucesso!');

  await page.waitForTimeout(3000);

  // Preenche via DOM ou input/textarea
  const filled = await page.evaluate((text) => {
    const editables = Array.from(document.querySelectorAll('textarea, div[contenteditable="true"]'));
    if (editables.length > 0) {
      const el = editables[0];
      if (el.tagName.toLowerCase() === 'textarea') {
        el.value = text;
      } else {
        el.innerText = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }, NEW_ABOUT_BILINGUAL);

  console.log('[OK] Preenchimento do Sobre bilíngue:', filled);
  await page.waitForTimeout(1000);

  const saveBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[SUCCESS] Botão Salvar clicado!');
    await page.waitForTimeout(4000);
    console.log('✅ SEÇÃO SOBRE BILÍNGUE (PT-BR + EN) SALVA COM SUCESSO!');
  } else {
    console.error('[ERRO] Botão Salvar não localizado.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
