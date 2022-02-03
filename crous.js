import { Utils } from "./utils.js";

export class Crous {
    NO_AVAILAVILITIES_MESSAGE = "Aucun logement disponible pour vos critères.";
    URL =
        "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.2431_48.9244_2.4345_48.7714";

    constructor(page, discordNotifier) {
        this.page = page;
        this.last_residences_ids = [];
        this.discordNotifier = discordNotifier;
    }

    async fetch() {
        await this.page.goto(this.URL);
        const residences = await this.getUnfilteredResidences();
        const filteredresidences = await Utils.asyncFilter(
            residences,
            async (residence) => await this.isResidenceAvailable(residence.id)
        );
        this.handleNotification(filteredresidences);
    }

    async getUnfilteredResidences() {
        await this.page.waitForSelector(".Pagination");
        const paginationMessage = await this.page.$$eval(
            ".Pagination",
            (results) => results[0].firstChild.innerText
        );
        if (paginationMessage == this.NO_AVAILAVILITIES_MESSAGE) {
            return [];
        }
        await this.page.waitForSelector(".SearchResults-item");
        return await this.page.$$eval(".SearchResults-item", (results) => {
            return results.map((result) => {
                const id = result
                    .querySelector("[id^='accommodations-']")
                    .id.split("-")[1];
                const name = result.querySelector(".Frame-subtitle").innerHTML;
                return { id, name };
            });
        });
    }

    async handleNotification(residences) {
        const residences_ids = residences.map((residence) => residence.id);
        if (
            residences.length &&
            !Utils.haveSameElements(this.last_residences_ids, residences_ids)
        ) {
            const residencesListMessage = residences
                .map(
                    (residence) =>
                        `  - [${residence.name}](https://trouverunlogement.lescrous.fr/tools/flow/21/accommodations/${residence.id})`
                )
                .join("\n");
            const message = `Hey, I found ${
                residences.length
            } available residence${
                residences.length > 1 ? "s" : ""
            }!\n${residencesListMessage}`;
            this.discordNotifier.notify(message);
        }
        this.last_residences_ids = residences_ids;
    }

    async isResidenceAvailable(id) {
        const URL = `https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${id}/availabilities?occupationMode=alone&arrivalDate=2022-01-29&departureDate=2022-08-31`;
        const data = await Utils.fetchJson(URL);
        return data.periodsAvailable.length != 0;
    }
}
