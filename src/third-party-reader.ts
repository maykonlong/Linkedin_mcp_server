import { Page } from 'playwright';

export interface ThirdPartyExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  duration: string;
  location: string;
  description: string;
}

export interface ThirdPartyEducation {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface ThirdPartySkill {
  name: string;
  endorsements?: number;
}

export interface ThirdPartyCertification {
  name: string;
  issuer: string;
  date: string;
}

export interface ThirdPartyProfile {
  profileUrl: string;
  name: string;
  headline: string;
  about: string;
  location: string;
  currentCompany: string;
  currentSchool: string;
  website: string;
  connectionsLabel: string;
  openToWork: boolean;
  experience: ThirdPartyExperience[];
  education: ThirdPartyEducation[];
  skills: ThirdPartySkill[];
  certifications: ThirdPartyCertification[];
  languages: string[];
  profilePictureUrl: string;
  bannerUrl: string;
  scrapedAt: string;
}

const FOOTER_MARKERS = ['Acessibilidade', 'Soluções de Talentos', 'LinkedIn Corporation', 'Central de Ajuda', 'Termos e Privacidade'];
const SKIP_CATEGORIES = new Set(['Todos', 'All', 'Conhecimento do setor', 'Industry knowledge',
  'Ferramentas e tecnologias', 'Tools & technologies', 'Competências interpessoais',
  'Interpersonal skills', 'Idiomas', 'Languages', 'Idioma do perfil', 'Profile language']);

export class ThirdPartyReader {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async readProfile(targetUrl: string): Promise<ThirdPartyProfile> {
    const cleanUrl = targetUrl.replace(/\/$/, '');

    const profile: ThirdPartyProfile = {
      profileUrl: cleanUrl,
      name: '',
      headline: '',
      about: '',
      location: '',
      currentCompany: '',
      currentSchool: '',
      website: '',
      connectionsLabel: '',
      openToWork: false,
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      profilePictureUrl: '',
      bannerUrl: '',
      scrapedAt: new Date().toISOString(),
    };

    // ── 1. Main Profile Page ───────────────────────────────────────────────
    await this.page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this.page.waitForTimeout(3000);

    const currentUrl = this.page.url();
    if (currentUrl.includes('/authwall') || currentUrl.includes('/login')) {
      throw new Error('Sessão expirada. Execute: node scripts/login.mjs');
    }

    await this.page.evaluate(() => window.scrollTo(0, 1200));
    await this.page.waitForTimeout(1500);

    try {
      const mainData = await this.page.evaluate(
        ({ footerMarkers }: { footerMarkers: string[] }) => {
          const allText = document.body.innerText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

          const footerIdx = allText.findIndex(l => footerMarkers.some(f => l.includes(f)));
          const safeLines = footerIdx > 0 ? allText.slice(0, footerIdx) : allText;

          const name = document.querySelector('h1')?.textContent?.trim()
            || document.title.split('|')[0].trim();

          let headline = '';
          // Try multiple CSS selectors for the headline
          const headlineSelectors = [
            '.text-body-medium.break-words',
            '[data-field="headline"]',
            'div.ph5 .text-body-medium',
          ];
          for (const sel of headlineSelectors) {
            const el = document.querySelector(sel);
            const t = el?.textContent?.trim() || '';
            if (t && t.length > 5 && t !== name) { headline = t; break; }
          }
          const contactIdx = safeLines.findIndex(l => l === 'Dados de contato' || l === 'Contact info');
          let location = '';
          if (contactIdx >= 2) {
            const cand = safeLines[contactIdx - 2];
            if (cand && cand.length > 3 && cand.length < 100) location = cand;
          }

          // Fallback: find name in safeLines and take next non-trivial line
          if (!headline) {
            const nameIdx = safeLines.findIndex(l => l === name || l.startsWith(name.split(' ')[0]));
            if (nameIdx >= 0) {
              for (let k = nameIdx + 1; k < Math.min(nameIdx + 8, safeLines.length); k++) {
                const cand = safeLines[k];
                if (!cand || cand === location || cand === name) continue;
                if (['Ele/Dele', 'Ela/Dela', 'He/Him', 'She/Her', 'They/Them'].includes(cand)) continue;
                if (/^\d+/.test(cand) || cand.includes('conex') || cand.includes('follower')) continue;
                // Skip short company badge (< 30 chars and no spaces = likely a company name badge)
                // A real headline usually has spaces and is descriptive (> 20 chars)
                if (cand.includes('•') || cand.includes('·')) continue;
                // Skip lines that look like connection degree badges
                if (/^[•\s]*\d[ºª]\s*$/.test(cand)) continue;
                // Skip own profile UI elements
                if (
                  cand === 'Recursos' || cand.includes('Disponível para') || 
                  cand === 'Resources' || cand.includes('Aprimorar') || 
                  cand.includes('Adicionar seção') || cand.includes('Add section')
                ) continue;
                // Accept any non-trivial line
                if (cand.length > 5) { headline = cand; break; }
              }
            }
          }

          const openToWork = !!document.querySelector('[aria-label*="Disponível para trabalho"], [aria-label*="Open to work"], .open-to-work-badge');

          let profilePictureUrl = '';
          const pic = document.querySelector('img[alt*="foto de perfil" i], img[alt*="profile photo" i]') as HTMLImageElement | null;
          if (pic) profilePictureUrl = pic.src || '';

          let bannerUrl = '';
          const banner = document.querySelector('img[alt*="foto de capa" i], img[alt*="background" i]') as HTMLImageElement | null;
          if (banner) bannerUrl = banner.src || '';

          const sobreIdx = safeLines.findIndex(l => l === 'Sobre' || l === 'About');
          const afterSobre = ['Atividades', 'Activity', 'Experiência', 'Experience', 'Competências', 'Skills'];
          const endSobre = safeLines.findIndex((l, i) => i > sobreIdx && afterSobre.some(a => l === a));
          let about = '';
          if (sobreIdx >= 0 && endSobre > sobreIdx) {
            about = safeLines.slice(sobreIdx + 1, endSobre).join(' ').replace(/…\s*mais|…\s*more/gi, '').trim();
          }

          let currentCompany = '';
          let currentSchool = '';
          if (contactIdx >= 0) {
            const topLines = safeLines.slice(Math.max(0, contactIdx - 6), contactIdx);
            const SKIP_TOP = new Set(['Seguir', 'Follow', 'Conectar', 'Connect', 'Mensagem', 'Message', 'Mais', 'More', 'Recursos', 'Resources', 'Aprimorar perfil', 'Aprimorar']);
          for (const l of topLines) {
            // Filter: bullet indicators, degree indicators ("2º"), own name, open-to-work labels, pronouns
            const hasBullet = l.includes('•') || l.includes('·') || /•\s*\d/.test(l);
            const isDegree = /^[•\-]?\s*\d[ºª]$/.test(l.trim());
            const isOpenToWork = l.includes('Disponível para') || l.includes('Open to work');
            const isPronoun = ['Ele/Dele', 'Ela/Dela', 'He/Him', 'She/Her', 'They/Them'].includes(l);
            if (!currentCompany && l.length > 2 && l.length < 100 && !hasBullet && !isDegree && !isOpenToWork && !isPronoun && l !== location && !SKIP_TOP.has(l) && l !== name) {
              currentCompany = l;
            }
          }  }

          return { name, headline, location, openToWork, profilePictureUrl, bannerUrl, about, currentCompany, currentSchool };
        },
        { footerMarkers: FOOTER_MARKERS }
      );

      Object.assign(profile, mainData);
    } catch (e) {
      console.error('[ThirdPartyReader] Main page parsing error:', e);
    }

    // ── 2. Experience ─────────────────────────────────────────────────────
    try {
      await this.page.goto(`${cleanUrl}/details/experience/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await this.page.waitForTimeout(2500);

      const expUrl = this.page.url();
      if (!expUrl.includes('/authwall') && !expUrl.includes('/login')) {
        const rawText = await this.page.evaluate(() => document.body.innerText);
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const startIdx = lines.findIndex(l => l === 'Experiência' || l === 'Experience');

        if (startIdx >= 0) {
          const expLines = lines.slice(startIdx + 1);
          let i = 0;
          while (i < expLines.length) {
            const l = expLines[i];
            if (FOOTER_MARKERS.some(f => l.includes(f))) break;
            if (l.startsWith('+') || l === 'Mostrar mais') { i++; continue; }

            const isDate = (l.includes('·') && (/\d{4}/.test(l) || l.includes('Presente') || l.includes('Present')));
            if (isDate || l.includes('recomendação') || l.includes('endorsement')) { i++; continue; }

            const next = expLines[i + 1] || '';
            const nnext = expLines[i + 2] || '';
            const nextIsDate = next.includes('·') && (/\d{4}/.test(next) || next.includes('Presente') || next.includes('Present'));

            if (l.length >= 2 && l.length <= 120 && !l.includes('·')) {
              const title = l;
              if (title.toLowerCase().includes('cargo:') || title.toLowerCase().includes('position:')) { i++; continue; }
              
              let company = '';
              let dateLine = '';
              let j = i + 1;

              if (next && !nextIsDate && next.length < 120) { company = next; j++; }

              const potentialDate = expLines[j] || '';
              const potentialDateIsDate = potentialDate.includes('·') && (/\d{4}/.test(potentialDate) || potentialDate.includes('Presente') || potentialDate.includes('Present'));
              if (potentialDateIsDate) { dateLine = potentialDate; j++; }

              // FILTER: known garbage patterns
              if (
                title.includes('me ajudou a conseguir') ||
                title.includes('helped me get') ||
                title.length > 150 ||
                /\.pdf$|\.ppt$|\.doc$|\.xls$|\.png$|\.jpg$/i.test(title) ||
                title.includes('competência') || title.includes('competenc')
              ) {
                i++;
                continue;
              }

              // Only emit an experience if we have a date line — without it, it's noise
              if (!dateLine) {
                i++;
                continue;
              }

              const parts = dateLine.split('·')[0].split('–').map(s => s.trim());
              profile.experience.push({
                title,
                company,
                startDate: parts[0] || '',
                endDate: parts[1] || null,
                duration: dateLine.split('·')[1]?.trim() || '',
                location: '',
                description: '',
              });
              i = j;
              continue;
            }
            i++;
          }
        }
      }
    } catch (e) {
      console.error('[ThirdPartyReader] Experience parsing error:', e);
    }

    // ── 3. Education ─────────────────────────────────────────────────────
    try {
      await this.page.goto(`${cleanUrl}/details/education/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await this.page.waitForTimeout(2500);

      const eduUrl = this.page.url();
      if (!eduUrl.includes('/authwall') && !eduUrl.includes('/login')) {
        const rawText = await this.page.evaluate(() => document.body.innerText);
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const startIdx = lines.findIndex(l => l === 'Educação' || l === 'Education');

        if (startIdx >= 0) {
          const eduLines = lines.slice(startIdx + 1);
          let i = 0;
          while (i < eduLines.length) {
            const l = eduLines[i];
            if (FOOTER_MARKERS.some(f => l.includes(f))) break;
            if (l.startsWith('+')) { i++; continue; }

            const next = eduLines[i + 1] || '';
            const nnext = eduLines[i + 2] || '';

            const yearPattern = /\d{4}/;
            const looksLikeYear = yearPattern.test(nnext);

            if (l.length > 2 && l.length < 120 && !yearPattern.test(l) && !l.includes('·')) {
              const school = l;
              let degree = '';
              let field = '';
              if (next && !yearPattern.test(next)) {
                if (next.includes(',')) {
                  const [d, ...rest] = next.split(',');
                  degree = d.trim();
                  field = rest.join(',').trim();
                } else {
                  degree = next;
                }
              }
              const yearMatch = nnext.match(/(\d{4})\s*[-–]\s*(\d{4}|Presente|Present)?/);
              profile.education.push({
                school,
                degree,
                fieldOfStudy: field,
                startYear: yearMatch?.[1] || '',
                endYear: yearMatch?.[2] || '',
              });
              i += looksLikeYear ? 3 : 2;
              continue;
            }
            i++;
          }
        }
      }
    } catch (e) {
      console.error('[ThirdPartyReader] Education parsing error:', e);
    }

    // ── 4. Skills ─────────────────────────────────────────────────────────
    try {
      await this.page.goto(`${cleanUrl}/details/skills/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await this.page.waitForTimeout(2500);

      const skillsUrl = this.page.url();
      if (!skillsUrl.includes('/authwall') && !skillsUrl.includes('/login')) {
        const rawText = await this.page.evaluate(() => document.body.innerText);
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const startIdx = lines.findIndex(l => l === 'Competências' || l === 'Skills');

        if (startIdx >= 0) {
          for (let i = startIdx + 1; i < lines.length; i++) {
            const l = lines[i];
            if (FOOTER_MARKERS.some(f => l.includes(f))) break;
            if (SKIP_CATEGORIES.has(l)) continue;
            // Own profile empty state / sidebars
            if (l.includes('Nada para ver') || l.includes('Nothing to see')) break;
            if (l.includes('visitantes também') || l.includes('Exibido apenas')) break;
            if (l.includes('Adicionar idiomas') || l.includes('Add languages')) break;
            if (l.startsWith('+') || l.includes('·') || /^\d+$/.test(l)) continue;
            // Filter endorsement count lines: singular AND plural
            if (/^\d+\s+recomenda/i.test(l)) continue;
            if (/recomenda[çc][aã]o(es)?\s+de\s+compet/i.test(l)) continue;
            if (l.includes('recomendaç') || l.includes('endorsement')) continue;
            // Filter skill count labels and media attachments
            if (/^\d+\s+compet/i.test(l)) continue;
            if (/\.(pdf|ppt|doc|xls|png|jpg)$/i.test(l)) continue;
            // Skills should be short (max 50 chars) and not contain company-like patterns
            if (l.length < 2 || l.length > 50) continue;
            // Filter lines that look like experience titles repeated in skills (contain "da empresa")
            if (l.includes('da empresa') || l.includes('of company')) continue;

            const endorseMatch = lines[i + 1]?.match(/^(\d+)\s*(recomendação|endorsement)/i);
            const endorsements = endorseMatch ? parseInt(endorseMatch[1]) : undefined;

            if (!profile.skills.find(s => s.name === l)) {
              profile.skills.push({ name: l, endorsements });
            }
          }
        }
      }
    } catch (e) {
      console.error('[ThirdPartyReader] Skills parsing error:', e);
    }

    // ── 5. Certifications ───────────────────────────────────────────────
    try {
      await this.page.goto(`${cleanUrl}/details/certifications/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(2000);

      const certUrl = this.page.url();
      if (!certUrl.includes('/authwall') && !certUrl.includes('/login')) {
        const rawText = await this.page.evaluate(() => document.body.innerText);
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const startIdx = lines.findIndex(l => l === 'Certificações' || l.includes('Licenças') || l.includes('Licenses'));

        if (startIdx >= 0) {
          let i = startIdx + 1;
          while (i < lines.length) {
            const l = lines[i];
            if (FOOTER_MARKERS.some(f => l.includes(f))) break;
            if (l.startsWith('+')) { i++; continue; }
            if (l.length > 2 && l.length < 150 && !l.includes('·')) {
              const name = l;
              const issuer = lines[i + 1] || '';
              const date = lines[i + 2] || '';
              profile.certifications.push({ name, issuer, date });
              i += 3;
              continue;
            }
            i++;
          }
        }
      }
    } catch (e) {
      console.error('[ThirdPartyReader] Certifications parsing error:', e);
    }

    // ── 6. Languages ────────────────────────────────────────────────────
    try {
      await this.page.goto(`${cleanUrl}/details/languages/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(2000);

      const langUrl = this.page.url();
      if (!langUrl.includes('/authwall') && !langUrl.includes('/login')) {
        const rawText = await this.page.evaluate(() => document.body.innerText);
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const startIdx = lines.findIndex(l => l === 'Idiomas' || l === 'Languages');

        if (startIdx >= 0) {
          // Language names are typically short, no numbers, no parentheses
          for (let i = startIdx + 1; i < Math.min(startIdx + 30, lines.length); i++) {
            const l = lines[i];
            if (FOOTER_MARKERS.some(f => l.includes(f))) break;
            if (l === 'Idioma do perfil' || l === 'Profile language') break;
            // Stop when we hit sidebar-like content ("Mais perfis para você" etc.) or own-profile empty states
            if (l === 'Mais perfis para você' || l === 'People you may know' || l === 'Sobre' || l === 'About') break;
            if (l.includes('Nada para ver') || l.includes('Nothing to see')) break;
            if (l.includes('visitantes também') || l.includes('Exibido apenas') || l.includes('Adicionar idiomas') || l.includes('Add languages')) break;
            // Language: short, no digits, no parens, no dots
            if (l.length >= 2 && l.length <= 40 && !/\d/.test(l) && !l.includes('(') && !l.includes('·') && !l.startsWith('+')) {
              // Skip proficiency levels like "Nível intermediário", "Native or bilingual" etc
              const proficiencyWords = ['nível', 'level', 'native', 'bilingual', 'elementary', 'básico', 'intermediário', 'avançado', 'fluente', 'proficiente'];
              if (!proficiencyWords.some(w => l.toLowerCase().includes(w))) {
                if (!profile.languages.includes(l)) profile.languages.push(l);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[ThirdPartyReader] Languages parsing error:', e);
    }

    return profile;
  }
}
