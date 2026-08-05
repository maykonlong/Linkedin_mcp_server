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

console.log('=== INSPEÇÃO DO MODAL DE FORMAÇÃO ACADÊMICA ===');

const browser = await chromium.launch({ headless: false, channel: 'msedge', args: ['--no-sandbox'] });
const context = await browser.newContext({ storageState: sessionFile, viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  // Acessar diretamente a página de detalhes de educação para facilitar
  const educationUrl = `${profileUrl}/details/education/`;
  console.log(`Acessando ${educationUrl}...`);
  await page.goto(educationUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Procurar o botão de adicionar formação (+)
  console.log('Procurando o botão de Adicionar Formação...');
  const addClicked = await page.evaluate(() => {
    // Tenta encontrar um link (a) ou botão com aria-label de "Adicionar" ou href "new"
    const links = Array.from(document.querySelectorAll('a[href*="/edit/forms/education/new/"]'));
    if (links.length > 0) {
      links[0].click();
      return { via: 'link /edit/forms/education/new/' };
    }
    
    // Tenta o ícone add-medium
    const addSvgs = Array.from(document.querySelectorAll('svg[id="add-medium"]'));
    if (addSvgs.length > 0) {
      const btn = addSvgs[0].closest('button') || addSvgs[0].closest('a');
      if (btn) {
        btn.click();
        return { via: 'svg[id=add-medium]' };
      }
    }
    return null;
  });

  if (addClicked) {
    console.log(`✅ Botão de adicionar clicado via ${addClicked.via}. Aguardando modal...`);
    await page.waitForTimeout(4000);
  } else {
    console.error('❌ Não achou o botão de Adicionar Formação na página de detalhes.');
    console.log('Tentando via URL direta de formulário...');
    await page.goto(`${profileUrl}/edit/forms/education/new/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }

  // Agora vamos mapear os campos do modal
  console.log('\n--- MAPEAMENTO DOS CAMPOS DO MODAL ---');
  const fields = await page.evaluate(() => {
    const getLabel = (el) => {
      const id = el.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.innerText.trim();
      }
      const parentLabel = el.closest('label');
      if (parentLabel) return parentLabel.innerText.trim();
      return el.getAttribute('aria-label') || 'Sem label visível';
    };

    const inputs = Array.from(document.querySelectorAll('.artdeco-modal input')).map(i => ({
      type: 'input ' + i.type,
      id: i.id,
      label: getLabel(i),
      placeholder: i.getAttribute('placeholder')
    }));

    const textareas = Array.from(document.querySelectorAll('.artdeco-modal textarea')).map(t => ({
      type: 'textarea',
      id: t.id,
      label: getLabel(t)
    }));

    const selects = Array.from(document.querySelectorAll('.artdeco-modal select')).map(s => ({
      type: 'select',
      id: s.id,
      label: getLabel(s)
    }));

    return { inputs, textareas, selects };
  });

  console.log('\n[INPUTS]');
  fields.inputs.forEach(f => console.log(`- ${f.type} | ID: ${f.id} | Label: "${f.label}" | Placeholder: "${f.placeholder || ''}"`));

  console.log('\n[TEXTAREAS]');
  fields.textareas.forEach(f => console.log(`- ${f.type} | ID: ${f.id} | Label: "${f.label}"`));

  console.log('\n[SELECTS]');
  fields.selects.forEach(f => console.log(`- ${f.type} | ID: ${f.id} | Label: "${f.label}"`));

  console.log('\n--- VERIFIQUE O TERMINAL PARA OS CAMPOS MAPEADOS ---');

} catch (err) {
  console.error('[ERRO]', err.message);
} finally {
  await browser.close();
}
