import { Page } from 'playwright';

export interface JobItem {
  title: string;
  company: string;
  location: string;
  link: string;
}

export class JobSearch {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async search(keywords: string, location: string = 'Brasil'): Promise<JobItem[]> {
    const encodedKeywords = encodeURIComponent(keywords);
    const encodedLocation = encodeURIComponent(location);
    const url = `https://www.linkedin.com/jobs/search/?keywords=${encodedKeywords}&location=${encodedLocation}`;

    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await this.page.waitForTimeout(3000);

    const jobs = await this.page.evaluate(() => {
      const cardNodes = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
      const results: JobItem[] = [];

      cardNodes.forEach((card) => {
        const titleEl = card.querySelector('.job-card-list__title, a.job-card-container__link');
        const companyEl = card.querySelector('.job-card-container__primary-description, .job-card-container__company-name');
        const locationEl = card.querySelector('.job-card-container__metadata-item');
        const linkEl = card.querySelector('a[href*="/jobs/view/"]');

        const title = titleEl?.textContent?.trim() || '';
        const company = companyEl?.textContent?.trim() || '';
        const loc = locationEl?.textContent?.trim() || '';
        let link = linkEl?.getAttribute('href') || '';

        if (link && !link.startsWith('http')) {
          link = `https://www.linkedin.com${link}`;
        }

        if (title) {
          results.push({ title, company, location: loc, link });
        }
      });

      return results;
    });

    return jobs.slice(0, 15);
  }
}
