import { Page } from 'playwright';

export interface LinkedInProfile {
  name: string;
  headline: string;
  about: string;
  location: string;
  currentPosition: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string;
  location?: string;
}

export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface Certification {
  name: string;
  issuer: string;
  issueMonth: string;
  issueYear: string;
  credentialId?: string;
  credentialUrl?: string;
}

export class ProfileReader {
  private page: Page;
  private profileUrl: string;

  constructor(page: Page, profileUrl: string) {
    this.page = page;
    this.profileUrl = profileUrl;
  }
  async getProfile(): Promise<LinkedInProfile> {
    const cleanUrl = this.profileUrl.replace(/\/$/, '');

    // 1. Get Main Profile Data (Headline, About, Location)
    await this.page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.page.waitForTimeout(3000);
    
    const profile: LinkedInProfile = {
      name: '',
      headline: '',
      about: '',
      location: '',
      currentPosition: '',
      experience: [],
      education: [],
      skills: [],
    };

    try {
      const name = await this.page.evaluate(() => {
        const h1 = document.querySelector('h1.text-heading-xlarge, h1');
        if (h1 && h1.textContent) return h1.textContent.trim();
        return document.title.split('|')[0].trim();
      });
      profile.name = name;

      const mainText = await this.page.evaluate(() => document.body.innerText);
      const lines = mainText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      
      const nameIdx = lines.findIndex(l => l === profile.name || (l.length > 3 && profile.name.includes(l)));
      if (nameIdx >= 0) {
        let hl = lines[nameIdx + 1] || '';
        if (['He/Him', 'She/Her', 'They/Them', 'Ele/Dele', 'Ela/Dela'].includes(hl)) hl = lines[nameIdx + 2] || '';
        if (hl && !hl.includes('Recursos') && !hl.includes('Aprimorar')) profile.headline = hl;
      }

      const contatoIdx = lines.findIndex(l => l === 'Dados de contato' || l === 'Contact info');
      if (contatoIdx >= 2) profile.location = lines[contatoIdx - 2];
      
      if (contatoIdx >= 0 && lines.length > contatoIdx + 1) {
        const emp = lines[contatoIdx + 1];
        if (emp && !emp.includes('500') && !emp.includes('conex')) profile.currentPosition = emp;
      }

      const aboutStart = lines.findIndex(l => l === 'Sobre' || l === 'About');
      const aboutEnd = lines.findIndex((l, i) => i > aboutStart && (l === 'Atividades' || l === 'Activity' || l === 'Posts'));
      if (aboutStart >= 0 && aboutEnd > aboutStart) {
        profile.about = lines.slice(aboutStart + 1, aboutEnd).join('\n').replace(/… mais|… more/g, '').trim();
      }

    } catch (e) {
      console.error('Error parsing main profile:', e);
    }

    // 2. Get Experiences
    try {
      await this.page.goto(`${cleanUrl}/details/experience/`, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      const expText = await this.page.evaluate(() => document.body.innerText);
      const lines = expText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      
      const startIdx = lines.findIndex(l => l === 'Experiência' || l === 'Experience');
      if (startIdx >= 0) {
        const expLines = lines.slice(startIdx + 1);
        let currentExp: any = null;
        for (let i = 0; i < expLines.length; i++) {
          const l = expLines[i];
          if (l === 'Idioma do perfil' || l.includes('Profile language')) break; // End of list
          
          if (!currentExp) {
            if (l.length > 2 && !l.includes('·') && !l.startsWith('+')) currentExp = { title: l, company: '', dateLine: '', desc: [] };
            continue;
          }
          if (!currentExp.company && !l.includes('·')) { currentExp.company = l; continue; }
          if (l.includes('·') && !currentExp.dateLine) { currentExp.dateLine = l; continue; }
          if (currentExp.dateLine && !l.includes('·') && l.length > 2) currentExp.desc.push(l);
          
          const nextLine = expLines[i+1] || '';
          if (nextLine && !nextLine.includes('·') && nextLine.length > 2 && !nextLine.startsWith('+') && expLines[i+2] && !expLines[i+2].includes('·')) {
            const dates = currentExp.dateLine.split('·')[0].split('–').map((s: string) => s.trim());
            profile.experience.push({
              title: currentExp.title,
              company: currentExp.company,
              startDate: dates[0] || '',
              endDate: dates[1] || null,
              description: currentExp.desc.join(' | ')
            });
            currentExp = null;
          }
        }
        if (currentExp && currentExp.title) {
          const dates = currentExp.dateLine.split('·')[0].split('–').map((s: string) => s.trim());
          profile.experience.push({ title: currentExp.title, company: currentExp.company, startDate: dates[0] || '', endDate: dates[1] || null, description: currentExp.desc.join(' | ') });
        }
      }
    } catch (e) {}

    // 3. Get Skills
    try {
      await this.page.goto(`${cleanUrl}/details/skills/`, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(2000);
      const skillsText = await this.page.evaluate(() => document.body.innerText);
      const lines = skillsText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const startIdx = lines.findIndex(l => l === 'Competências' || l === 'Skills');
      if (startIdx >= 0) {
        const skillsLines = lines.slice(startIdx + 1);
        for (const l of skillsLines) {
          if (l === 'Idioma do perfil' || l.includes('Profile language')) break;
          if (l && !l.includes('·') && !l.startsWith('+') && l.length > 1 && l.length < 50) {
             if (!profile.skills.includes(l)) profile.skills.push(l);
          }
        }
      }
    } catch (e) {}

    return profile;
  }
}
