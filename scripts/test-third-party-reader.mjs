/**
 * Testa a leitura de perfil de terceiros.
 * Uso: node scripts/test-third-party-reader.mjs [url_do_perfil]
 */

import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { ThirdPartyReader } from '../build/third-party-reader.js';
import { readFileSync, writeFileSync } from 'fs';

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

const TARGET_URL = process.argv[2] || 'https://www.linkedin.com/in/eduardo-amorim-885386/';

async function run() {
  console.log(`\n🔍 Iniciando leitura de perfil: ${TARGET_URL}`);
  console.log('📡 Conectando ao LinkedIn com sua sessão...\n');

  const automation = new LinkedInAutomation(config.profile_url, config.email, config.password);
  await automation.init();
  
  const loggedIn = await automation.login();
  if (!loggedIn) {
    console.error('❌ Sessão expirada. Execute: node scripts/login.mjs');
    await automation.close();
    process.exit(1);
  }
  
  console.log('✅ Sessão autenticada!\n');

  // Acessa a page interna para o ThirdPartyReader
  const page = automation.page;
  const reader = new ThirdPartyReader(page);

  try {
    console.log('⏳ Lendo perfil (pode levar 30-40s para visitar todas as abas)...\n');
    const profile = await reader.readProfile(TARGET_URL);

    console.log('═══════════════════════════════════════════════════════');
    console.log(`  👤 PERFIL: ${profile.name}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  📝 Headline: ${profile.headline || '(vazio)'}`);
    console.log(`  📍 Localização: ${profile.location || '(vazio)'}`);
    console.log(`  🏢 Empresa atual: ${profile.currentCompany || '(não extraído)'}`);
    console.log(`  🎓 Escola: ${profile.currentSchool || '(não extraído)'}`);
    console.log(`  🌐 Site: ${profile.website || '(vazio)'}`);
    console.log(`  💼 Open to Work: ${profile.openToWork ? 'Sim' : 'Não'}`);
    console.log('');
    console.log(`  📄 Sobre (${profile.about.length} chars): ${profile.about.slice(0, 200)}${profile.about.length > 200 ? '...' : ''}`);
    console.log('');
    console.log(`  💼 Experiências (${profile.experience.length}):`);
    for (const exp of profile.experience.slice(0, 3)) {
      console.log(`     • ${exp.title} @ ${exp.company} (${exp.startDate} - ${exp.endDate || 'Presente'})`);
      if (exp.description) console.log(`       ${exp.description.slice(0, 100)}...`);
    }
    console.log('');
    console.log(`  🎓 Educação (${profile.education.length}):`);
    for (const edu of profile.education) {
      console.log(`     • ${edu.school} — ${edu.degree} ${edu.fieldOfStudy}`);
    }
    console.log('');
    console.log(`  🛠️  Competências (${profile.skills.length}): ${profile.skills.slice(0, 10).map(s => s.name).join(', ')}${profile.skills.length > 10 ? '...' : ''}`);
    console.log('');
    console.log(`  📜 Certificações (${profile.certifications.length})`);
    console.log(`  🌍 Idiomas (${profile.languages.length}): ${profile.languages.join(', ')}`);

    // Salva resultado completo em arquivo JSON
    const outputFile = `profile-${Date.now()}.json`;
    writeFileSync(outputFile, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`\n✅ Perfil completo salvo em: ${outputFile}`);

  } catch (err) {
    console.error('❌ Erro ao ler perfil:', err.message);
  } finally {
    await automation.close();
  }
}

run().catch(console.error);
