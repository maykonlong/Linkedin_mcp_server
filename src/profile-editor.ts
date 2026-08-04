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
