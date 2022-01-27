const puppeteer = require('puppeteer');


const fetchData = async () => {
    const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.1601_48.9661_2.5391_48.6926&page=1&price=60000"
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.goto(URL)//, { waitUntil: "networkidle2" });
    await page.waitForSelector(".SearchResults-item");
    const names = await page.$$eval(".Frame-subtitle", (subtitles) => {
        return subtitles.map(subtitle => subtitle.innerHTML)
    })
    console.log(names);
}

fetchData()