const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();

    const { startUrl } = input;

    const browser = await Apify.launchPuppeteer({ headless: true });
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
        await page.waitForTimeout(4000); // wait to load next page
    }

    for (const profile of results) {
        await Apify.pushData(profile);
    }

    await browser.close();
});
