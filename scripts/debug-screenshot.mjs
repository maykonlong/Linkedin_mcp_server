import { LinkedInAutomation } from '../build/linkedin-automation.js';
import { readFileSync, writeFileSync } from 'fs';

const configContent = readFileSync('conf.ini', 'utf-8');
const config = {};
for (const line of configContent.split('\n')) {
  const eqIndex = line.indexOf('=');
  if (eqIndex > 0) config[line.slice(0, eqIndex).trim()] = line.slice(eqIndex + 1).trim();
}

async function debugScreenshot() {
  console.log('Inicializando LinkedIn...');
  const linkedin = new LinkedInAutomation(config.profile_url, config.email, config.password);
  
  await linkedin.init();
  await linkedin.login();

  const cleanUrl = config.profile_url.replace(/\/$/, '');
  const page = linkedin.page;
  await page.goto(cleanUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: 'main_profile.png', fullPage: true });
  console.log('Screenshot saved to main_profile.png');
  
  // Dump all button text and aria-labels
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(el => {
      return {
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 50),
        ariaLabel: el.getAttribute('aria-label'),
        href: el.getAttribute('href'),
        className: el.className
      };
    }).filter(b => !!b.ariaLabel || (b.href && b.href.includes('edit')));
  });
  
  writeFileSync('buttons.json', JSON.stringify(buttons, null, 2));

  await linkedin.close();
}

debugScreenshot().catch(console.error);
