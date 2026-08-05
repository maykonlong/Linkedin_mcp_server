import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { ProfileEditor } from '../build/profile-editor.js';
import { loadConfig } from '../build/config.js';
import { logger } from '../build/utils/logger.js';

const config = loadConfig();

const ABOUT_TEXT = `Analista de QA Especialista em Meios de Pagamento (PIX, SPI, SPB) e Automação de Testes.

Com mais de 3 anos de experiência em engenharia da qualidade, atuo diretamente na prevenção de falhas (Shift-Left Testing) e na garantia de estabilidade para sistemas financeiros de altíssima volumetria e criticidade. 

Minha stack principal inclui validação de APIs REST utilizando Postman, construção e execução de consultas SQL complexas para validação de dados, e criação de cenários de teste automatizados (Playwright). 

🎯 Vamos conectar? Estou sempre aberto a trocar ideias sobre Qualidade de Software e a ajudar equipes a otimizarem seus fluxos de entrega contínua. Envie uma mensagem!`;

async function main() {
  logger.info('Inicializando robô para atualização 100/100...');
  const linkedin = new LinkedInAutomation(config.profileUrl, config.email, config.password);
  
  await linkedin.init();
  const loggedIn = await linkedin.login();
  if (!loggedIn) {
    logger.error('Falha ao logar. Execute npm run login:session.');
    process.exit(1);
  }

  const editor = new ProfileEditor(linkedin.page, config.profileUrl);
  
  logger.info('Atualizando seção Sobre (About)...');
  const aboutSuccess = await editor.updateAbout(ABOUT_TEXT);
  if (aboutSuccess) {
    logger.info('✅ Sobre atualizado com sucesso!');
  } else {
    logger.error('❌ Falha ao atualizar Sobre.');
  }

  await linkedin.close();
}

main().catch(console.error);
