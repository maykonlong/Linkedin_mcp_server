import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { loadConfig } from '../build/config.js';
import { writeFileSync } from 'fs';

const config = loadConfig();

async function main() {
  const linkedin = new LinkedInAutomation(config.profileUrl, config.email, config.password);
  await linkedin.init();
  await linkedin.login();
  const cleanUrl = config.profileUrl.replace(/\/$/, '');
  
  await linkedin.page.goto(cleanUrl, { waitUntil: 'domcontentloaded' });
  await linkedin.page.waitForTimeout(4000);
  
  // click "Edit about"
  const editAboutBtn = await linkedin.page.$('button[aria-label*="about" i], a[href*="summary"]');
  if (editAboutBtn) {
     console.log('Found edit about button!');
     await editAboutBtn.click();
     await linkedin.page.waitForTimeout(2000);
  } else {
     console.log('Did not find edit about button.');
  }
  
  const text = await linkedin.page.evaluate(() => document.body.innerHTML);
  writeFileSync('debug-summary-btn.html', text);
  await linkedin.close();
}

main().catch(console.error);
