import { LinkedInAutomation } from './build/linkedin-automation.js';
import { loadConfig } from './build/config.js';
import { writeFileSync } from 'fs';

const config = loadConfig();

async function main() {
  const linkedin = new LinkedInAutomation(config.profileUrl, config.email, config.password);
  await linkedin.init();
  await linkedin.login();
  const cleanUrl = config.profileUrl.replace(/\/$/, '');
  
  await linkedin.page.goto(cleanUrl + '/details/education/', { waitUntil: 'domcontentloaded' });
  await linkedin.page.waitForTimeout(3000);
  
  const text = await linkedin.page.evaluate(() => document.body.innerText);
  writeFileSync('debug-edu.txt', text);
  await linkedin.close();
}

main().catch(console.error);
