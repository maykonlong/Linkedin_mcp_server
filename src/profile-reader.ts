import { Page } from 'playwright';

export interface LinkedInProfile {
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

export class ProfileReader {
  private page: Page;
  private profileUrl: string;

  constructor(page: Page, profileUrl: string) {
    this.page = page;
    this.profileUrl = profileUrl;
  }

  async getProfile(): Promise<LinkedInProfile> {
    await this.page.goto(this.profileUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await this.page.waitForTimeout(3000);
    await this.page.evaluate(async () => {
      for (let i = 0; i < 8; i++) {
        window.scrollBy(0, 600);
        await new Promise((r) => setTimeout(r, 800));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 1000));
    });
    await this.page.waitForTimeout(2000);

    const profile: LinkedInProfile = {
      headline: '',
      about: '',
      location: '',
      currentPosition: '',
      experience: [],
      education: [],
      skills: [],
    };

    try {
      const fullText = await this.page.evaluate(() => document.body.innerText);
      const allLines = fullText.split('\n').map((l: string) => l.trim());
      const lines = allLines.filter((l: string) => l.length > 0);

      const profileName = await this.page.evaluate(() => {
        const h1 = document.querySelector('h1.text-heading-xlarge, h1');
        if (h1 && h1.textContent) return h1.textContent.trim();
        const title = document.title;
        if (title.includes('|')) return title.split('|')[0].trim();
        return '';
      });

      const nameIndex = profileName ? lines.findIndex((l: string) => l === profileName || (l.length > 3 && profileName.includes(l))) : -1;
      if (nameIndex >= 0) {
        let hl = lines[nameIndex + 1] || '';
        if (['He/Him', 'She/Her', 'They/Them', 'Ele/Dele', 'Ela/Dela'].includes(hl)) {
          hl = lines[nameIndex + 2] || '';
        }
        if (hl && !hl.includes('Recursos') && !hl.includes('Aprimorar') && !hl.includes('Adicionar')) {
          profile.headline = hl;
        } else {
          const allNameIndices: number[] = [];
          lines.forEach((l: string, i: number) => { if (l === profileName) allNameIndices.push(i); });
          if (allNameIndices.length >= 1) {
            const firstHl = lines[allNameIndices[0] + 1] || '';
            if (firstHl && !['He/Him', 'She/Her', 'They/Them', 'Ele/Dele', 'Ela/Dela'].includes(firstHl)) {
              profile.headline = firstHl;
            } else {
              profile.headline = lines[allNameIndices[0] + 2] || '';
            }
          }
        }
      }

      const contatoIdx = lines.findIndex((l: string) => l === 'Dados de contato' || l === 'Contact info');
      if (contatoIdx >= 2) {
        const candidate = lines[contatoIdx - 2];
        if (candidate && !candidate.includes('·') && candidate.length > 3) {
          profile.location = candidate;
        } else {
          for (let i = contatoIdx - 1; i >= Math.max(0, contatoIdx - 5); i--) {
            if (lines[i] && (lines[i].includes('Região') || lines[i].includes('Brasil') || lines[i].includes('Paulo') || lines[i].includes('State') || lines[i].includes('area'))) {
              profile.location = lines[i].replace(/·/g, '').trim();
              break;
            }
          }
        }
      }

      if (contatoIdx >= 0 && lines.length > contatoIdx + 1) {
        const empresa = lines[contatoIdx + 1];
        if (empresa && !empresa.includes('500') && !empresa.includes('conex') && !empresa.includes('English') && !empresa.includes('connections')) {
          profile.currentPosition = empresa;
        }
      }

      const aboutStart = lines.findIndex((l: string) => l === 'Sobre' || l === 'About');
      const aboutEnd = lines.findIndex((l: string, i: number) =>
        i > aboutStart && (l === 'Atividades' || l === 'Activity' || l === 'Posts')
      );
      if (aboutStart >= 0 && aboutEnd > aboutStart) {
        const aboutLines = lines.slice(aboutStart + 1, aboutEnd);
        profile.about = aboutLines.join('\n').replace('… mais', '').replace('… more', '').replace('... more', '').trim();
      }

      const expHeader = lines.findIndex((l: string) => l === 'Experiência' || l === 'Experience');
      if (expHeader >= 0) {
        const nextSection = lines.findIndex((l: string, i: number) =>
          i > expHeader &&
          ['Formação acadêmica', 'Education', 'Licenças e certificados', 'Licenses & certifications', 'Competências', 'Skills'].includes(l)
        );
        const expLines = lines.slice(expHeader + 1, nextSection > expHeader ? nextSection : lines.length);

        let currentExp: { title: string; company: string; dateLine: string; descLines: string[] } | null = null;

        for (let i = 0; i < expLines.length; i++) {
          const line = expLines[i];
          const nextLine = expLines[i + 1] || '';
          const nextNextLine = expLines[i + 2] || '';

          if (!currentExp) {
            if (line && !line.includes('·') && !line.startsWith('+') && line.length > 2) {
              currentExp = { title: line, company: '', dateLine: '', descLines: [] };
            }
            continue;
          }

          if (!currentExp.company && !line.includes('·')) {
            currentExp.company = line;
            continue;
          }

          if (line.includes('·') && !currentExp.dateLine) {
            currentExp.dateLine = line;
            continue;
          }

          if (currentExp.dateLine && line && !line.includes('·') && !line.startsWith('+') && !line.includes('competência') && !line.includes('skill')) {
            currentExp.descLines.push(line);
          }

          if (nextLine && !nextLine.includes('·') && nextLine.length > 2 && !nextLine.startsWith('+') &&
              nextNextLine && !nextNextLine.includes('·') && nextNextLine.length > 2) {
            const dateParts = currentExp.dateLine.split('·')[0].trim().split('–').map((s: string) => s.trim());
            profile.experience.push({
              title: currentExp.title,
              company: currentExp.company,
              startDate: dateParts[0] || '',
              endDate: (dateParts[1] && dateParts[1] !== 'o momento' && dateParts[1] !== 'Present') ? dateParts[1] : null,
              description: currentExp.descLines.join(' | '),
            });
            currentExp = null;
          }
        }

        if (currentExp && currentExp.title) {
          const dateParts = currentExp.dateLine.split('·')[0].trim().split('–').map((s: string) => s.trim());
          profile.experience.push({
            title: currentExp.title,
            company: currentExp.company,
            startDate: dateParts[0] || '',
            endDate: (dateParts[1] && dateParts[1] !== 'o momento' && dateParts[1] !== 'Present') ? dateParts[1] : null,
            description: currentExp.descLines.join(' | '),
          });
        }
      }

      const skillsIdx = lines.findIndex((l: string) => l === 'Competências' || l === 'Skills');
      if (skillsIdx >= 0) {
        const skillsEnd = lines.findIndex((l: string, i: number) =>
          i > skillsIdx &&
          ['Idiomas', 'Languages', 'Recomendações', 'Recommendations', 'Exibir tudo', 'Show all'].includes(l)
        );
        const skillsSlice = lines.slice(skillsIdx + 1, skillsEnd > skillsIdx ? skillsEnd : skillsIdx + 25);
        profile.skills = skillsSlice
          .filter((l: string) =>
            l && !l.includes('·') && !l.includes('+') && !l.startsWith('Exibir') && !l.startsWith('Show') &&
            !l.includes('Recomenda') && !l.includes('Recommend') && l.length > 1 && l.length < 50
          )
          .slice(0, 15);
      }
    } catch (error) {
      console.error('Error parsing profile:', error);
    }

    return profile;
  }
}
