const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class JobScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrapeLinkedInJobs(searchTerm, location = 'Tunisia', maxJobs = 10) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent(this.getRandomUserAgent());
            
            // LinkedIn job search URL
            const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`;
            
            console.log(`Scraping LinkedIn jobs for: ${searchTerm} in ${location}`);
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });
            
            // Wait for job listings to load
            await page.waitForSelector('.base-search-card', { timeout: 10000 });
            
            // Extract job data
            const jobs = await page.evaluate((maxJobs) => {
                const jobCards = document.querySelectorAll('.base-search-card');
                const jobData = [];
                
                for (let i = 0; i < Math.min(jobCards.length, maxJobs); i++) {
                    const card = jobCards[i];
                    
                    const titleElement = card.querySelector('.base-search-card__title');
                    const companyElement = card.querySelector('.base-search-card__subtitle');
                    const locationElement = card.querySelector('.job-search-card__location');
                    const linkElement = card.querySelector('.base-card__full-link');
                    const timeElement = card.querySelector('time');
                    
                    if (titleElement && companyElement) {
                        jobData.push({
                            title: titleElement.textContent.trim(),
                            company: companyElement.textContent.trim(),
                            location: locationElement ? locationElement.textContent.trim() : '',
                            link: linkElement ? linkElement.href : '',
                            postedTime: timeElement ? timeElement.textContent.trim() : '',
                            source: 'LinkedIn'
                        });
                    }
                }
                
                return jobData;
            }, maxJobs);
            
            return jobs;
            
        } catch (error) {
            console.error('LinkedIn scraping error:', error.message);
            return [];
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async scrapeTanitJobs(searchTerm, maxJobs = 10) {
        try {
            console.log(`Scraping TanitJobs for: ${searchTerm}`);
            
            const response = await axios.get('https://www.tanitjobs.com/emploi/', {
                headers: {
                    'User-Agent': this.getRandomUserAgent()
                },
                params: {
                    q: searchTerm
                }
            });
            
            const $ = cheerio.load(response.data);
            const jobs = [];
            
            $('.job-item, .job-listing, .offer-item').each((index, element) => {
                if (index >= maxJobs) return false;
                
                const $element = $(element);
                const title = $element.find('.job-title, .offer-title, h3 a, h2 a').first().text().trim();
                const company = $element.find('.company-name, .company, .employer').first().text().trim();
                const location = $element.find('.location, .job-location').first().text().trim();
                const link = $element.find('a').first().attr('href');
                const postedTime = $element.find('.date, .posted-date, .time').first().text().trim();
                
                if (title && company) {
                    jobs.push({
                        title,
                        company,
                        location,
                        link: link ? (link.startsWith('http') ? link : `https://www.tanitjobs.com${link}`) : '',
                        postedTime,
                        source: 'TanitJobs'
                    });
                }
            });
            
            return jobs;
            
        } catch (error) {
            console.error('TanitJobs scraping error:', error.message);
            return [];
        }
    }

    async scrapeAllJobs(searchTerm, location = 'Tunisia', maxJobsPerSite = 10) {
        console.log(`Starting job scraping for: ${searchTerm}`);
        
        const [linkedInJobs, tanitJobs] = await Promise.allSettled([
            this.scrapeLinkedInJobs(searchTerm, location, maxJobsPerSite),
            this.scrapeTanitJobs(searchTerm, maxJobsPerSite)
        ]);
        
        const allJobs = [
            ...(linkedInJobs.status === 'fulfilled' ? linkedInJobs.value : []),
            ...(tanitJobs.status === 'fulfilled' ? tanitJobs.value : [])
        ];
        
        // Remove duplicates based on title and company
        const uniqueJobs = allJobs.filter((job, index, self) => 
            index === self.findIndex(j => j.title === job.title && j.company === job.company)
        );
        
        console.log(`Found ${uniqueJobs.length} unique jobs`);
        return uniqueJobs;
    }
}

module.exports = JobScraper;
