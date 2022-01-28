// 1 - get bearer token (7 days expiration time): Easiest way is to go to https://ibail.arpej.fr/residences/KR/reservation-d-un-logement and get it from netwok calls
// Other method is to get itby posting to https://admin.arpej.fr/api/oauth/token with the crediantials in https://ibail.arpej.fr/js/app.0c2f44e6.js (file name likely to change@@)

// 2 - Call https://www.arpej.fr/wp-json/sn/residences?lang=fr&display=map&related_city[]=52524&price_from=0&price_to=1000&show_if_full=false&show_if_colocations=false to get list of residences and their urls.

// 3 - Get two letters id (e.g. KR) from reserver button url link in residence page that u got from step 2 (e.g. https://www.arpej.fr/fr/residence/porte-ditalie-residence-etudiante-le-kremlin-bicetre/)

// 4 - Get number id by calling https://admin.arpej.fr/api/customer/residences/KR (replace KR with the residence 2letter id got from step 3)

// 5 - Replace {ID} in https://admin.arpej.fr/api/customer/residences/{ID}/availabilities/2022-01/offers with the id from step 4 to get the availabilities for that residence.

import { Utils } from "./utils.js";

export class Arpej {
    TOKEN = "cbdd386fc36735d87184ee603b5b85f5526189f55a3ee3c3a42d740c421f54aa";
    GET_RESIDENCES_URL =
        "https://www.arpej.fr/wp-json/sn/residences?lang=fr&display=map&related_city[]=52524&price_from=0&price_to=1000&show_if_full=false&show_if_colocations=false";
    RESERVATION_LINK_SELECTOR = "a[href^='https://ibail.arpej.fr/residences/']";

    constructor(page, discordNotifier) {
        this.page = page;
        this.discordNotifier = discordNotifier;
    }

    async fetch() {
        const residences = (await Utils.fetchJson(this.GET_RESIDENCES_URL))
            .residences;
        for (const residence of residences) {
            await this.page.goto(residence.link);
            await this.page.waitForSelector(this.RESERVATION_LINK_SELECTOR);
            const reservationLink = await this.page.$$eval(
                this.RESERVATION_LINK_SELECTOR,
                (links) => links[0].href
            );
            const splitLink = reservationLink.split("/");
            const tmpId = splitLink[splitLink.length - 2]; // TODO: Maybe store it
            const id = (
                await Utils.fetchJson(
                    `https://admin.arpej.fr/api/customer/residences/${tmpId}`,
                    this.TOKEN
                )
            ).id;

            const offers = await Utils.fetchJson(
                `https://admin.arpej.fr/api/customer/residences/${id}/availabilities/2022-02/offers`,
                this.TOKEN
            );

            console.log(`${offers.length} ${residence.title}`);
        }
    }
}

