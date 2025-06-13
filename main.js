import { Actor, launchPuppeteer } from 'apify';

await Actor.init();

const input = await Actor.getInput();
const { startUrl = "https://www.linkedin.com/search/results/people/?keywords=recruiter&origin=GLOBAL_SEARCH_HEADER&geoUrn=%5B%22102113901%22%5D" } = input;

import { launchPuppeteer } from 'apify';

const browser = await launchPuppeteer({ headless: true });

const page = await browser.newPage();

await page.goto(startUrl, { waitUntil: 'networkidle2' });

let results = [];

for (let pageNum = 0; pageNum < 3; pageNum++) {
    await page.waitForSelector('.reusable-search__result-container');

    const profiles = await page.$$eval('.reusable-search__result-container', cards =>
        cards.map(card => {
            const fullName = card.querySelector('span[aria-hidden="true"]')?.innerText || '';
            const title = card.querySelector('.entity-result__primary-subtitle')?.innerText || '';
            const company = card.querySelector('.entity-result__secondary-subtitle')?.innerText || '';
            const location = card.querySelector('.entity-result__simple-insight span')?.innerText || '';
            const [firstName, ...lastNameParts] = fullName.split(' ');
            const lastName = lastNameParts.join(' ');
            return { firstName, lastName, title, company, city: location };
        })
    );

    results.push(...profiles);

    const nextBtn = await page.$('button[aria-label="Next"]');
    if (!nextBtn) break;

    await nextBtn.click();
    await page.waitForTimeout(4000);
}

for (const profile of results) {
    await Actor.pushData(profile);
}

await browser.close();
await Actor.exit();
