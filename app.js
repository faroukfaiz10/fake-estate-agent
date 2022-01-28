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

const isResidenceAvailable = async (id) => {
    const URL = `https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${id}/availabilities?occupationMode=alone&arrivalDate=2022-01-29&departureDate=2022-08-31`;
    const response = await fetch(URL);
    const data = await response.json();
    return data.periodsAvailable.length != 0;
};

const fetchData = async () => {
    const NO_AVAILAVILITIES_MESSAGE =
        "Aucun logement disponible pour vos critères.";
    const URL =
        "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.2431_48.9244_2.4345_48.7714";
    // const URL =
    //     "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=1.3268_49.5854_3.3472_48.0984";
    const browser = await puppeteer.launch();
    let last_residences_ids = [];
    setInterval(async () => {
        const page = await browser.newPage();
        await page.goto(URL);
        let unfilteredResidences = [];
        await page.waitForSelector(".Pagination");
        const paginationMessage = await page.$$eval(
            ".Pagination",
            (results) => results[0].firstChild.innerText
        );
        if (paginationMessage != NO_AVAILAVILITIES_MESSAGE) {
            await page.waitForSelector(".SearchResults-item");
            unfilteredResidences = await page.$$eval(
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
        }
        const residences = await asyncFilter(
            unfilteredResidences,
            async (residence) => await isResidenceAvailable(residence.id)
        );
        // console.log(residences);
        const residences_ids = residences.map((residence) => residence.id);
        if (
            residences.length &&
            !haveSameElements(last_residences_ids, residences_ids)
        ) {
            const residencesListMessage = residences
                .map(
                    (residence) =>
                        `  - [${residence.name}](https://trouverunlogement.lescrous.fr/tools/flow/21/accommodations/${residence.id})`
                )
                .join("\n");
            notifyDiscord(
                `Hey, I found ${residences.length} available residence${
                    residences.length > 1 ? "s" : ""
                }!\n${residencesListMessage}`
            );
        }
        last_residences_ids = residences_ids;
    }, 1000 * 60);
};

const notifyDiscord = async (message) => {
    // const DISCORD_URL =
    // "https://discord.com/api/webhooks/936304587244204073/MDHxQYyzB5UqsFYkk8AfEfSFhXc19oXTk1BaN7LKLv7_ZZl8BDGgWousKN_SUjaXgRx3";
    const DISCORD_URL =
        "https://discord.com/api/webhooks/936586097474035732/-at6PePUZXtep28ICJ2tBu4KIN4dSuQyGJNgYvk61IgagYMOh2W1rhwG7dqm-dxcvM4b";
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
