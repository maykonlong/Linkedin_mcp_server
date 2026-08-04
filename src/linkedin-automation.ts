import { chromium, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import { SessionManager } from './session-manager.js';
import { ProfileReader, LinkedInProfile, Experience, Education } from './profile-reader.js';
import { ProfileEditor } from './profile-editor.js';

export { LinkedInProfile, Experience, Education };

export class LinkedInAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private profileUrl: string;
  private email: string;
  private password: string;
  private sessionManager: SessionManager;
  private reader: ProfileReader | null = null;
  private editor: ProfileEditor | null = null;

  constructor(profileUrl: string, email: string, password: string) {
    this.profileUrl = profileUrl;
    this.email = email;
    this.password = password;
    this.sessionManager = new SessionManager();
  }

  async init(): Promise<void> {
    const launchOptions: any = {
      headless: true,
      channel: 'msedge',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--window-size=1280,800',
      ],
    };

    this.browser = await chromium.launch(launchOptions);

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';
    const sessionPath = this.sessionManager.getSessionPath();
    
    if (this.sessionManager.hasSession()) {
      this.context = await this.browser.newContext({
        storageState: sessionPath,
        viewport: { width: 1280, height: 800 },
        userAgent: ua,
      });
    } else {
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: ua,
      });
    }

    this.page = await this.context.newPage();
    this.reader = new ProfileReader(this.page, this.profileUrl);
    this.editor = new ProfileEditor(this.page, this.profileUrl);
  }

  async login(): Promise<boolean> {
    if (!this.page || !this.context) throw new Error('Browser não inicializado');

    try {
      await this.page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.page.waitForTimeout(2000);
      const currentUrl = this.page.url();

      if (currentUrl.includes('/feed') && !currentUrl.includes('/login')) {
        await this.sessionManager.saveSession(this.context);
        return true;
      }

      if (currentUrl.includes('/login')) {
        console.error('Sessão expirada ou não encontrada. Por favor, execute o script de login para renovar.');
        return false;
      }

      await this.page.goto(this.profileUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await this.page.waitForTimeout(2000);

      const profileUrl = this.page.url();
      if (profileUrl.includes('/in/') && !profileUrl.includes('/login')) {
        await this.sessionManager.saveSession(this.context);
        return true;
      }

      console.error('Não foi possível confirmar o login. URL atual:', profileUrl);
      return false;
    } catch (error) {
      console.error('Erro de verificação de login:', error);
      return false;
    }
  }

  async getProfile(): Promise<LinkedInProfile> {
    if (!this.reader) throw new Error('Browser não inicializado');
    return await this.reader.getProfile();
  }

  async updateHeadline(headline: string): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.updateHeadline(headline);
  }

  async updateAbout(about: string): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.updateAbout(about);
  }

  async addExperience(exp: Experience): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.addExperience(exp);
  }

  async addEducation(edu: Education): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.addEducation(edu);
  }

  async updateCurrentPosition(title: string, company: string, description: string): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.updateCurrentPosition(title, company, description);
  }

  async addSkill(skill: string): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.addSkill(skill);
  }

  async publishPost(content: string): Promise<boolean> {
    if (!this.editor) throw new Error('Browser não inicializado');
    return await this.editor.publishPost(content);
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}