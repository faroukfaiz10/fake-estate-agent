import puppeteer from 'puppeteer';
import fetch from 'node-fetch';


const fetchData = async () => {
    const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.1601_48.9661_2.5391_48.6926&page=1&price=60000"
    // const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=4.3781_46.2596_6.2622_42.8317"
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.goto(URL)//, { waitUntil: "networkidle2" });
    await page.waitForSelector(".SearchResults-item");
    const names = await page.$$eval(".Frame-subtitle", (subtitles) => {
        return subtitles.map(subtitle => subtitle.innerHTML)
    })
    console.log(names);
    // Works as long as order doesn't change between the evals
    const ids = await page.$$eval("[id^='accommodations-']", (subtitles) => {
        return subtitles.map(subtitle => subtitle.id.split("-")[1])
    })
    console.log(ids);

    ids.forEach(async id => {
        const response = await fetch(`https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${id}/availabilities?occupationMode=alone&arrivalDate=2022-01-29&departureDate=2022-08-31`)
        const data = await response.json()
        console.log(id)
        console.log(data)
    })
}

fetchData()