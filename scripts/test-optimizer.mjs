import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { ProfileOptimizer } from '../build/profile-optimizer.js';
import { readFileSync } from 'fs';

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

async function test() {
  console.log('Inicializando LinkedIn Automation...');
  const linkedin = new LinkedInAutomation(config.profile_url, config.email, config.password);
  
  await linkedin.init();
  const loggedIn = await linkedin.login();
  if (!loggedIn) {
    console.error('Falha ao logar. Verifique a sessão.');
    process.exit(1);
  }

  console.log('Obtendo dados do perfil...');
  const profile = await linkedin.getProfile();
  
  console.log('Analisando perfil com Profile Optimizer (Algoritmo 2026)...');
  const analysis = ProfileOptimizer.analyze(profile);
  
  console.log('\n================ RESULTADO ================');
  console.log(`Pontuação Total: ${analysis.totalScore}/100`);
  console.log(`Nível: ${analysis.level}`);
  console.log(`Resumo: ${analysis.summary}`);
  console.log('===========================================\n');
  
  console.log(JSON.stringify(analysis, null, 2));

  await linkedin.close();
}

test().catch(console.error);
