import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { readFileSync, writeFileSync } from 'fs';

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

async function debugOpenToWork() {
  console.log('Inicializando LinkedIn...');
  const linkedin = new LinkedInAutomation(config.profile_url, config.email, config.password);
  
  await linkedin.init();
  await linkedin.login();

  const cleanUrl = config.profile_url.replace(/\/$/, '');
  const page = linkedin.page;
  
  await page.goto(`${cleanUrl}/opportunities/job-opportunities/edit/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  const modalHtml = await page.evaluate(() => {
    const dialog = document.querySelector('dialog, div[role="dialog"]');
    return dialog ? dialog.innerHTML : 'No dialog found';
  });

  writeFileSync('debug-opentowork.html', modalHtml);
  console.log('HTML do modal salvo em debug-opentowork.html');

  await linkedin.close();
}

debugOpenToWork().catch(console.error);
