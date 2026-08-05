import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { loadConfig } from '../build/config.js';

const CONFIG = loadConfig();

async function main() {
  const linkedin = new LinkedInAutomation(
    CONFIG.profileUrl,
    CONFIG.email,
    CONFIG.password
  );

  console.log('📡 Iniciando LinkedIn Automation...');
  await linkedin.init();
  
  const loginOk = await linkedin.login();
  if (!loginOk) {
    console.error('❌ Falha na autenticação (Sessão inválida). Rode "npm run login:session".');
    process.exit(1);
  }

  console.log('✅ Sessão carregada! Atualizando Headline...');
  
  const newHeadline = 'QA Analyst | Testes de API REST (Postman) | SQL | Especialista em Testes Financeiros (PIX, SPI, SPB)';
  const success = await linkedin.updateHeadline(newHeadline);
  
  if (success) {
    console.log(`✅ Headline atualizado com sucesso para:\n"${newHeadline}"`);
  } else {
    console.error('❌ Falha ao atualizar o Headline.');
  }

  await linkedin.close();
}

main().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});
