import puppeteer from "puppeteer";
import fetch from "node-fetch";

const asyncFilter = async (arr, predicate) => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

const haveSameElements = (arr1, arr2) => {
    let s = new Set([...arr1, ...arr2]);
    return s.size == arr1.length && s.size == arr2.length;
};

const fetchData = async () => {
    const URL =
        "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.1601_48.9661_2.5391_48.6926";
    // const URL = "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=4.3781_46.2596_6.2622_42.8317"
    const browser = await puppeteer.launch();
    let last_residences_ids = [];
    setInterval(async () => {
        const page = await browser.newPage();
        await page.goto(URL);
        await page.waitForSelector(".SearchResults-item");
        const unfilteredResidences = await page.$$eval(
            ".SearchResults-item",
            (results) => {
                return results.map((result) => {
                    const id = result
                        .querySelector("[id^='accommodations-']")
                        .id.split("-")[1];
                    const name =
                        result.querySelector(".Frame-subtitle").innerHTML;
                    return { id, name };
                });
            }
        );
        const residences = await asyncFilter(
            unfilteredResidences,
            async (residence) => {
                const response = await fetch(
                    `https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${residence.id}/availabilities?occupationMode=alone&arrivalDate=2022-01-29&departureDate=2022-08-31`
                );
                const data = await response.json();

                return data.periodsAvailable.length != 0;
            }
        );
        console.log(residences);
        const residences_ids = residences.map((residence) => residence.id);
        if (
            residences.length &&
            !haveSameElements(last_residences_ids, residences_ids)
        ) {
            const residencesListMessage = residences
                .map((residence) => `  - ${residence.name}`)
                .join("\n");
            notifyDiscord(
                `Hey, I found ${residences.length} available residence${
                    residences.length > 1 ? "s" : ""
                }!\n${residencesListMessage}`
            );
        }
        last_residences_ids = residences_ids;
    }, 1000 * 60 * 5);
};

const notifyDiscord = async (message) => {
    const DISCORD_URL =
        "https://discord.com/api/webhooks/936304587244204073/MDHxQYyzB5UqsFYkk8AfEfSFhXc19oXTk1BaN7LKLv7_ZZl8BDGgWousKN_SUjaXgRx3";
    const AVARTAR_URL =
        "https://p7.hiclipart.com/preview/866/59/617/estate-agent-real-estate-computer-icons-house-property-house.jpg";
    var payload = JSON.stringify({
        username: "Fake estate agent",
        avatar_url: AVARTAR_URL,
        content: message,
    });
    var params = {
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
        body: payload,
        muteHttpExceptions: true,
    };

    await fetch(DISCORD_URL, params);
};

fetchData();
