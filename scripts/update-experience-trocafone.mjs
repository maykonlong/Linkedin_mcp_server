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

// ID da experiência na Trocafone — altere conforme o seu perfil
const EXPERIENCE_FORM_ID = '1498195355';
const experienceEditUrl = `${profileUrl}/details/experience/edit/forms/${EXPERIENCE_FORM_ID}/`;

const NEW_DESCRIPTION = `Atuação em diagnóstico técnico avançado, testes de hardware/firmware e análise de causas-raiz em dispositivos eletrônicos.

Destaques e impacto:
• Aplicação de metodologias analíticas e procedimentos de qualidade para diagnóstico e resolução de falhas complexas.
• Otimização do fluxo e processo de testes e reparo, reduzindo significativamente o tempo médio de atendimento (MTTR).
• Elaboração de relatórios técnicos de inconformidades e implementação de melhorias em processos internos de qualidade.`;

console.log('=== ATUALIZANDO EXPERIÊNCIA PROFISSIONAL (TROCAFONE) ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(experienceEditUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const descField = await page.$('textarea[name="description"], textarea[id*="description"], textarea, div[contenteditable="true"]');
  
  if (descField) {
    console.log('[SUCCESS] Encontrado o campo de Descrição da Trocafone!');
    await descField.scrollIntoViewIfNeeded();
    await descField.focus();
    
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    await descField.fill(NEW_DESCRIPTION);
    console.log('[SUCCESS] Descrição da Trocafone preenchida!');

    await page.waitForTimeout(2000);

    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Salvar"), button.artdeco-button--primary');
    if (saveBtn) {
      await saveBtn.click();
      console.log('[SUCCESS] Botão Salvar clicado com sucesso!');
      await page.waitForTimeout(5000);
      console.log('🎉 EXPERIÊNCIA DA TROCAFONE ATUALIZADA COM SUCESSO NO LINKEDIN!');
    }
  } else {
    console.error('[ERRO] Campo de Descrição não localizado.');
  }

} catch (err) {
  console.error('[ERRO FATAL]', err.message);
} finally {
  await browser.close();
}
