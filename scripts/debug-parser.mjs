import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { readFileSync, writeFileSync } from 'fs';

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

async function debug() {
  console.log('Inicializando LinkedIn...');
  const linkedin = new LinkedInAutomation(config.profile_url, config.email, config.password);
  
  await linkedin.init();
  await linkedin.login();

  const page = linkedin.page;
  await page.goto(config.profile_url + '/details/experience/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) {
      window.scrollBy(0, 800);
      await new Promise((r) => setTimeout(r, 500));
    }
  });
  await page.waitForTimeout(1000);

  const fullText = await page.evaluate(() => document.body.innerText);
  writeFileSync('debug-exp.txt', fullText);
  console.log('Text dumped to debug-exp.txt');

  await linkedin.close();
}

debug().catch(console.error);
