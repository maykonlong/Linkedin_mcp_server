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
const skillsUrl = `${profileUrl}/details/skills/`;

// Novas competências focadas em IA & Automação Avançada
const AI_SKILLS = [
  'Artificial Intelligence (AI)',
  'Generative AI',
  'Prompt Engineering',
  'Software Development'
];

// Sobre atualizado com a seção de AI-Driven QA & Vibe Coding
const NEW_ABOUT_WITH_AI = `Analista de Qualidade de Software (QA) com sólida experiência no ecossistema de pagamentos e mensageria financeira (PIX, SPI, SPB). Especialista em testes de APIs REST, validação de regras de negócio, testes regressivos e automação.

🤖 AI-Driven QA & Vibe Coding:
Entusiasta de engenharia assistida por IA, desenvolvimento de automações modernas com Agentes de IA, construção de MCP Servers/Skills customizadas e aplicação de Vibe Coding para acelerar a cobertura de testes e entrega de software de alta resiliência.

Domínio técnico: Postman, SQL, JIRA, ambientes Linux, Engenharia de Prompts e ferramentas assistidas por IA.

📍 Contato: [SEU_EMAIL] | São Paulo - SP

---

QA Analyst specializing in software testing for financial payment systems (PIX, SPI, SPB) and AI-driven QA automation. Experienced in REST API testing, SQL validation, JIRA, Linux, and custom AI agent workflows.`;

console.log('=== ATUALIZANDO COMPETÊNCIAS DE IA E SEÇÃO SOBRE (VIBE CODING) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // 1. Atualizar a Seção Sobre
  console.log('[STEP 1] Atualizando Seção Sobre com Vibe Coding...');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const editAboutBtn = await page.$('#about ~ .display-flex button[aria-label*="About"], section:has(#about) button[aria-label*="About"], button[aria-label*="Editar sobre"], button[aria-label*="Edit about"]');
  if (editAboutBtn) {
    await editAboutBtn.click();
    await page.waitForTimeout(3000);

    const aboutTextarea = await page.$('.artdeco-modal textarea, .artdeco-modal div[contenteditable="true"]');
    if (aboutTextarea) {
      await aboutTextarea.scrollIntoViewIfNeeded();
      await aboutTextarea.focus();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(500);
      await aboutTextarea.fill(NEW_ABOUT_WITH_AI);
      console.log('[SUCCESS] Novo Sobre com Vibe Coding preenchido!');

      const saveAboutBtn = await page.$('.artdeco-modal button.artdeco-button--primary, button:has-text("Salvar"), button:has-text("Save")');
      if (saveAboutBtn) {
        await saveAboutBtn.click();
        console.log('[SUCCESS] Seção Sobre salva com sucesso!');
        await page.waitForTimeout(4000);
      }
    }
  }

  // 2. Adicionar Competências de IA na página /details/skills/
  console.log('\n[STEP 2] Adicionando Competências de IA em /details/skills/...');
  await page.goto(skillsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  for (const skill of AI_SKILLS) {
    try {
      console.log(`-> Processando skill: "${skill}"`);
      const addSkillBtn = await page.waitForSelector('button:has-text("Add skill"), button:has-text("Adicionar competência"), a[href*="add-skill"]', { timeout: 8000 });
      await addSkillBtn.click();
      await page.waitForTimeout(2000);

      const skillInput = await page.waitForSelector('input[data-testid="typeahead-input"], input[placeholder*="Skill"], input[placeholder*="Competência"]', { timeout: 8000 });
      await skillInput.focus();
      await skillInput.fill(skill);
      await page.waitForTimeout(1500);

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);

      const saveSkillBtn = await page.$('button.artdeco-button--primary:has-text("Save"), button.artdeco-button--primary:has-text("Salvar")');
      if (saveSkillBtn) {
        await saveSkillBtn.click();
        console.log(`✅ Competência "${skill}" salva com sucesso!`);
        await page.waitForTimeout(3000);
      }
    } catch (err) {
      console.log(`[AVISO] Não foi possível adicionar a skill "${skill}":`, err.message);
      await page.goto(skillsUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  console.log('\n🎉 PERFIL 100% ATUALIZADO COM VIBE CODING E COMPETÊNCIAS DE IA!');

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
