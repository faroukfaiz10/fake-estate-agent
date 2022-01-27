import puppeteer from 'puppeteer';
import fetch from 'node-fetch';


const asyncFilter = async (arr, predicate) => {
	const results = await Promise.all(arr.map(predicate));
	return arr.filter((_v, index) => results[index]);
}

const fetchData = async () => {
    const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.1601_48.9661_2.5391_48.6926&page=1&price=60000"
    // const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=4.3781_46.2596_6.2622_42.8317"
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.goto(URL)//, { waitUntil: "networkidle2" });
    await page.waitForSelector(".SearchResults-item");
    const results = await page.$$eval(".SearchResults-item", (results) => {
        return results.map(result => {
            const id = result.querySelector("[id^='accommodations-']").id.split("-")[1]
            const name = result.querySelector(".Frame-subtitle").innerHTML
            return {id, name}
        })
    })
    const availabilities = await asyncFilter(results, async result => {
        const response = await fetch(`https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${result.id}/availabilities?occupationMode=alone&arrivalDate=2022-01-29&departureDate=2022-08-31`)
        const data = await response.json()
        console.log(data.periodsAvailable.length != 0)
        return data.periodsAvailable.length != 0
    })
    console.log(availabilities)
}

fetchData()