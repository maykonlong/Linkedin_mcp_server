import { Page } from 'playwright';
import { Experience, Education } from './profile-reader.js';

export class ProfileEditor {
  private page: Page;
  private profileUrl: string;

  constructor(page: Page, profileUrl: string) {
    this.page = page;
    this.profileUrl = profileUrl;
  }

  async updateHeadline(headline: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/forms/`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.page.waitForSelector('input[name="headline"]', { timeout: 10000 }).catch(async () => {
        const headlineBtn = await this.page.$(`button[aria-label*="headline" i], button:has-text("Headline")`);
        if (headlineBtn) await headlineBtn.click();
        const editIntroBtn = await this.page.$(`a[href*="/edit/forms/intro/"], button[aria-label*="Edit intro"]`);
        if (editIntroBtn) await editIntroBtn.click();
      });

      await this.page.fill('input[name="headline"], #headline', headline);
      await this.page.click('button[type="submit"], button:has-text("Save")');
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Error updating headline:', error);
      return false;
    }
  }

  async updateAbout(about: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/forms/summary/`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.page.waitForSelector('textarea[id*="summary"], textarea[name*="summary"]', {
        timeout: 10000,
      });

      await this.page.fill('textarea[id*="summary"], textarea[name*="summary"]', about);
      await this.page.click('button[type="submit"], button:has-text("Save")');
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Error updating about:', error);
      return false;
    }
  }

  async addExperience(exp: Experience): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/forms/position/new/`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });

      await this.page.fill('input[name="title"]', exp.title);
      await this.page.fill('input[name="companyName"]', exp.company);
      if (exp.location) await this.page.fill('input[name="location"]', exp.location);
      if (exp.description) await this.page.fill('textarea[name="description"]', exp.description);

      if (exp.startDate) await this.page.fill('input[name="timePeriodStartDate"]', exp.startDate);
      if (exp.endDate) {
        await this.page.fill('input[name="timePeriodEndDate"]', exp.endDate);
      } else {
        const currentCheckbox = await this.page.$('input[name="currentJob"]');
        if (currentCheckbox) await currentCheckbox.check();
      }

      await this.page.click('button[type="submit"], button:has-text("Save")');
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Error adding experience:', error);
      return false;
    }
  }

  async addEducation(edu: Education): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/forms/education/new/`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });

      await this.page.fill('input[name="schoolName"]', edu.school);
      await this.page.fill('input[name="degree"]', edu.degree);
      await this.page.fill('input[name="fieldOfStudy"]', edu.fieldOfStudy);

      if (edu.startYear) await this.page.fill('input[name="timePeriodStartDate"]', edu.startYear);
      if (edu.endYear) await this.page.fill('input[name="timePeriodEndDate"]', edu.endYear);

      await this.page.click('button[type="submit"], button:has-text("Save")');
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Error adding education:', error);
      return false;
    }
  }

  async addCertification(cert: any): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/details/certifications/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(3000);

      const clicked = await this.page.evaluate(() => {
        const addSvgs = Array.from(document.querySelectorAll('svg[id="add-medium"]'));
        if (addSvgs[0]) {
          const btn = addSvgs[0].closest('button') || addSvgs[0].closest('a');
          if (btn) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) {
        await this.page.goto(`${this.profileUrl}/edit/forms/certification/new/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      await this.page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
      await this.page.waitForTimeout(2000);

      const nomeInput = await this.page.$('input[id*="custom-typeahead"], input[aria-label="Nome*"]');
      if (nomeInput) {
        await nomeInput.click();
        await this.page.keyboard.type(cert.name, { delay: 30 });
        await this.page.waitForTimeout(1000);
        await this.page.keyboard.press('Escape');
      }

      const orgInput = await this.page.$('input[aria-label="Organização emissora*"]');
      if (orgInput) {
        await orgInput.click();
        await this.page.keyboard.type(cert.issuer, { delay: 30 });
        await this.page.waitForTimeout(1500);
        const orgDropdown = await this.page.$$('div[role="listbox"] div[role="option"]');
        if (orgDropdown.length > 0) {
          await orgDropdown[0].click();
        } else {
          await this.page.keyboard.press('Escape');
        }
      }

      const startMonth = await this.page.$('div[aria-label*="Mês"] select');
      if (startMonth && cert.issueMonth) await startMonth.selectOption(cert.issueMonth);
      
      const startYear = await this.page.$('div[aria-label*="Ano"] select');
      if (startYear && cert.issueYear) await startYear.selectOption(cert.issueYear);

      if (cert.credentialId) {
        const codigoLabelHandle = await this.page.$('label:has-text("Código da credencial")');
        if (codigoLabelHandle) {
          const forAttr = await codigoLabelHandle.getAttribute('for');
          if (forAttr) await this.page.fill(`input[id="${forAttr}"]`, cert.credentialId);
        }
      }
      
      if (cert.credentialUrl) {
        const urlLabelHandle = await this.page.$('label:has-text("URL da credencial")');
        if (urlLabelHandle) {
          const forAttr = await urlLabelHandle.getAttribute('for');
          if (forAttr) await this.page.fill(`input[id="${forAttr}"]`, cert.credentialUrl);
        }
      }

      const saveBtns = await this.page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar")');
      const saveBtn = saveBtns[saveBtns.length - 1];
      
      if (saveBtn) {
        await saveBtn.click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (error) {
      console.error('Error adding certification:', error);
      return false;
    }
  }

  async updateCurrentPosition(title: string, company: string, description: string): Promise<boolean> {
    try {
      const currentExpBtn = await this.page.$('#experience ~ div a[href*="/edit/forms/position/"]');
      if (currentExpBtn) {
        await currentExpBtn.click();
        await this.page.waitForTimeout(2000);

        await this.page.fill('input[name="title"]', title);
        await this.page.fill('input[name="companyName"]', company);
        await this.page.fill('textarea[name="description"]', description);

        await this.page.click('button[type="submit"], button:has-text("Save")');
        await this.page.waitForTimeout(2000);
      }
      return true;
    } catch (error) {
      console.error('Error updating current position:', error);
      return false;
    }
  }

  async addSkill(skill: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/forms/skills/new/`, {
        waitUntil: 'domcontentloaded', timeout: 30000
      });

      await this.page.fill('input[name="name"]', skill);
      await this.page.click('button[type="submit"], button:has-text("Save")');
      await this.page.waitForTimeout(2000);

      return true;
    } catch (error) {
      console.error('Error adding skill:', error);
      return false;
    }
  }

  async addSecondaryLanguage(languageValue: string, firstName: string, lastName: string, headline: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/edit/secondary-language/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      // Clicar em "+ Adicionar idioma" se ele existir (quando já tem idiomas configurados)
      const clickedAdd = await this.page.evaluate(() => {
        const addSvg = document.querySelector('svg[id="add-medium"]');
        if (addSvg) {
          const btn = addSvg.closest('button') || addSvg.closest('a') || addSvg.parentElement;
          if (btn) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (clickedAdd) {
        await this.page.waitForTimeout(3000);
      }

      // Selecionar idioma
      const selectEl = await this.page.waitForSelector('select', { timeout: 10000 });
      await selectEl.selectOption(languageValue);
      await this.page.waitForTimeout(2000);

      // Preencher nome, sobrenome e headline (exigido pelo LinkedIn para o novo idioma)
      const inputs = await this.page.$$('input[type="text"]:visible');
      if (inputs.length >= 2) {
        await inputs[0].fill('');
        await inputs[0].fill(firstName);
        
        await inputs[1].fill('');
        await inputs[1].fill(lastName);
      }

      const textarea = await this.page.$('textarea');
      if (textarea) {
        await textarea.fill('');
        await textarea.fill(headline);
      }
      
      await this.page.waitForTimeout(1000);

      // Clicar em Salvar
      const saveBtns = await this.page.$$('button:has-text("Salvar"), button:has-text("Save")');
      const saveBtn = saveBtns[saveBtns.length - 1];
      if (saveBtn) {
        await saveBtn.click();
      }

      await this.page.waitForTimeout(3000);

      // Modal de Sucesso "Concluído"
      const doneBtns = await this.page.$$('button:has-text("Concluído"), button:has-text("Done")');
      if (doneBtns.length > 0) {
        await doneBtns[doneBtns.length - 1].click();
      }

      await this.page.waitForTimeout(2000);
      return true;
    } catch (error) {
      console.error('Error adding secondary language:', error);
      return false;
    }
  }

  async removeSkill(skillName: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      const editButtons = await this.page.$$(`a[aria-label*="Editar ${skillName}"]`);
      if (editButtons.length === 0) return false;

      await editButtons[0].click();
      await this.page.waitForTimeout(3000);

      const deleteBtn = await this.page.$('button:has-text("Exclua a competência"), button:has-text("Excluir")');
      if (!deleteBtn) {
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(1000);
        const retryDelete = await this.page.$('button:has-text("Exclua a competência"), button:has-text("Excluir")');
        if(retryDelete) await retryDelete.click();
        else return false;
      } else {
        await deleteBtn.click();
      }

      await this.page.waitForTimeout(2000);
      
      const confirmDeleteBtn = await this.page.$$('dialog button:has-text("Excluir"), div[role="dialog"] button:has-text("Excluir")');
      if (confirmDeleteBtn.length > 0) {
        await confirmDeleteBtn[confirmDeleteBtn.length - 1].click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (error) {
      console.error('Error removing skill:', error);
      return false;
    }
  }

  async linkSkill(skillName: string, targetExperience: string): Promise<boolean> {
    try {
      await this.page.goto(`${this.profileUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      const editButtons = await this.page.$$(`a[aria-label*="Editar ${skillName}"]`);
      if (editButtons.length === 0) return false;

      await editButtons[0].click();
      await this.page.waitForTimeout(3000);

      const checkboxContainer = await this.page.$(`div[role="checkbox"]:has(p:has-text("${targetExperience}"))`);
      if (checkboxContainer) {
          const isChecked = await checkboxContainer.getAttribute('aria-checked');
          if (isChecked === 'false') {
              await checkboxContainer.click();
              await this.page.waitForTimeout(1000);
          }
      } else {
          return false;
      }

      const saveBtns = await this.page.$$('button:has-text("Salvar")');
      const saveBtn = saveBtns[saveBtns.length - 1];
      if (saveBtn) {
        await saveBtn.click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (error) {
      console.error('Error linking skill:', error);
      return false;
    }
  }

  async updateLocationAndIndustry(country: string, city: string, industry: string): Promise<boolean> {
    try {
      const cleanUrl = this.profileUrl.replace(/\/$/, '');
      await this.page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      const clicked = await this.page.evaluate(() => {
        const editBtn = document.querySelector('button[aria-label*="introdução" i], button[aria-label*="intro" i], a[href*="edit/forms/intro"]');
        if (editBtn) { (editBtn as any).click(); return true; }
        const allBtns = document.querySelectorAll('button svg[data-test-icon="edit-small"]');
        if (allBtns.length > 0) {
          const btn = allBtns[0].closest('button');
          if (btn) { btn.click(); return true; }
        }
        return false;
      });

      if (!clicked) return false;

      await this.page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
      await this.page.waitForTimeout(2000);

      if (industry) {
        const industryInput = await this.page.$('input[aria-label*="Setor" i], input[aria-label*="Industry" i]');
        if (industryInput) {
          await industryInput.click();
          await industryInput.fill('');
          await this.page.keyboard.type(industry, { delay: 30 });
          await this.page.waitForTimeout(1500);
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
        }
      }

      if (country) {
        const countryInput = await this.page.$('input[aria-label*="País" i], input[aria-label*="Country" i]');
        if (countryInput) {
          await countryInput.click();
          await countryInput.fill('');
          await this.page.keyboard.type(country, { delay: 30 });
          await this.page.waitForTimeout(1500);
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(1000);
        }
      }

      if (city) {
        const cityInput = await this.page.$('input[aria-label*="Cidade" i], input[aria-label*="City" i]');
        if (cityInput) {
          await cityInput.click();
          await cityInput.fill('');
          await this.page.keyboard.type(city, { delay: 30 });
          await this.page.waitForTimeout(1500);
          await this.page.keyboard.press('ArrowDown');
          await this.page.keyboard.press('Enter');
        }
      }

      const saveBtns = await this.page.$$('dialog button:has-text("Salvar"), dialog button:has-text("Save"), div[role="dialog"] button:has-text("Salvar")');
      if (saveBtns.length > 0) {
        await saveBtns[saveBtns.length - 1].click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (e) {
      console.error('Error updating location and industry', e);
      return false;
    }
  }

  async updateContactInfo(phone?: string, phoneType?: 'HOME'|'WORK'|'MOBILE', address?: string): Promise<boolean> {
    try {
      const cleanUrl = this.profileUrl.replace(/\/$/, '');
      await this.page.goto(`${cleanUrl}/edit/forms/contact-info/new/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      await this.page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
      await this.page.waitForTimeout(2000);

      if (phone !== undefined) {
        const phoneInput = await this.page.$('input[aria-label*="telefone" i], input[aria-label*="phone" i], label:has-text("Número de telefone") + * input, label:has-text("Phone number") + * input');
        if (phoneInput) {
          await phoneInput.click();
          await phoneInput.fill('');
          await this.page.keyboard.type(phone, { delay: 30 });
        }
      }

      if (phoneType !== undefined) {
        const typeSelect = await this.page.$('select[aria-label*="Tipo de telefone" i], select[aria-label*="Phone type" i], label:has-text("Tipo de telefone") + * select, label:has-text("Phone type") + * select');
        if (typeSelect) {
          const typeValueMap: Record<string, string> = {
            'HOME': 'ProfilePhoneNumberType_HOME',
            'WORK': 'ProfilePhoneNumberType_WORK',
            'MOBILE': 'ProfilePhoneNumberType_MOBILE'
          };
          const val = typeValueMap[phoneType] || 'ProfilePhoneNumberType_MOBILE';
          await typeSelect.selectOption(val);
        }
      }

      if (address !== undefined) {
        const addressInput = await this.page.$('textarea[aria-label*="Endereço" i], textarea[aria-label*="Address" i], label:has-text("Endereço") + * textarea, label:has-text("Address") + * textarea');
        if (addressInput) {
          await addressInput.click();
          await addressInput.fill('');
          await this.page.keyboard.type(address, { delay: 30 });
        }
      }

      // save
      const saveBtns = await this.page.$$('dialog button:has-text("Salvar"), dialog button:has-text("Save"), div[role="dialog"] button:has-text("Salvar")');
      if (saveBtns.length > 0) {
        await saveBtns[saveBtns.length - 1].click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (e) {
      console.error('Error updating contact info', e);
      return false;
    }
  }

  async updateOpenToWork(visibility?: 'RECRUITERS' | 'LOGGED_IN_MEMBERS', startDate?: 'ACTIVELY_SEEKING' | 'CASUALLY_BROWSING'): Promise<boolean> {
    try {
      const cleanUrl = this.profileUrl.replace(/\/$/, '');
      await this.page.goto(`${cleanUrl}/opportunities/job-opportunities/edit/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForTimeout(4000);

      await this.page.waitForSelector('dialog, div[role="dialog"]', { timeout: 10000 });
      await this.page.waitForTimeout(2000);

      if (visibility) {
        // The radio input might be hidden by CSS, so we can try to click its label or force click
        const radio = await this.page.$(`input[name="urn:li:fsd_openToWorkPreferencesFormElement:VISIBILITY"][value="${visibility}"]`);
        if (radio) {
          await radio.evaluate((el: any) => el.click());
        }
      }

      if (startDate) {
        const radio = await this.page.$(`input[name="urn:li:fsd_openToWorkPreferencesFormElement:START_DATE"][value="${startDate}"]`);
        if (radio) {
          await radio.evaluate((el: any) => el.click());
        }
      }

      const saveBtns = await this.page.$$('dialog button:has-text("Salvar"), div[role="dialog"] button:has-text("Salvar"), dialog button:has-text("Save")');
      if (saveBtns.length > 0) {
        await saveBtns[saveBtns.length - 1].click();
      }

      await this.page.waitForTimeout(3000);
      return true;
    } catch (e) {
      console.error('Error updating open to work', e);
      return false;
    }
  }

  async publishPost(content: string): Promise<boolean> {
    try {
      await this.page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const postBox = await this.page.$('button:has-text("Start a post"), div[role="textbox"]');
      if (postBox) await postBox.click();

      await this.page.waitForTimeout(1000);

      await this.page.fill('div[role="textbox"]:visible, div.ql-editor[contenteditable="true"]', content);
      await this.page.waitForTimeout(1000);

      await this.page.click('button:has-text("Post"):not([disabled])');
      await this.page.waitForTimeout(3000);

      return true;
    } catch (error) {
      console.error('Error publishing post:', error);
      return false;
    }
  }
}
