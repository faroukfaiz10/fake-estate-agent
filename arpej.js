import { Utils } from "./utils.js";

export class Arpej {
    TOKEN = "9074c1048b5c81c5305c64dcb1b0cf6e5999b6d5c1a3db045db78eca2ef2641c"; // Expires in one week
    GET_RESIDENCES_URL =
        "https://www.arpej.fr/wp-json/sn/residences?lang=fr&display=map&related_city[]=52524&price_from=0&price_to=1000&show_if_full=false&show_if_colocations=false";
    RESERVATION_LINK_SELECTOR = "a[href^='https://ibail.arpej.fr/residences/']";

    WHITELIST = [
        "https://www.arpej.fr/fr/residence/neuilly-roule-residence-etudiante-neuilly-sur-seine/",
        "https://www.arpej.fr/fr/residence/le-rodrigue-residence-etudiante-montreuil/",
        "https://www.arpej.fr/fr/residence/jean-paul-goude-residence-etudiante-saint-mande/",
        "https://www.arpej.fr/fr/residence/renon-residence-etudiante-vincennes/",
        "https://www.arpej.fr/fr/residence/frida-kahlo-residence-etudiante-montreuil/",
        "https://www.arpej.fr/fr/residence/residence-etudiante-georges-melies-montreuil/",
        "https://www.arpej.fr/fr/residence/wangari-maathai-residence-etudiante-montreuil/",
        "https://www.arpej.fr/fr/residence/du-parc-residence-etudiante-charenton-le-pont/",
        "https://www.arpej.fr/fr/residence/carmen-caron-residence-etudiante-aubervilliers/",
        "https://www.arpej.fr/fr/residence/cite-de-la-musique-residence-etudiante-paris/",
        "https://www.arpej.fr/fr/residence/du-conservatoire-residence-etudiante-paris/",
        // "https://www.arpej.fr/fr/residence/les-bords-de-seine-residence-etudiante-alfortville/",
        "https://www.arpej.fr/fr/residence/nicolas-appert-residence-etudiante-ivry-sur-seine/",
        "https://www.arpej.fr/fr/residence/pierre-gilles-de-gennes-residence-etudiante-villejuif/",
        "https://www.arpej.fr/fr/residence/jacques-henri-lartigue-residence-etudiante-courbevoie/",
        "https://www.arpej.fr/fr/residence/chanzy-residence-etudiante-nanterre/",
        "https://www.arpej.fr/fr/residence/camille-see-residence-etudiante-saint-denis/",
        "https://www.arpej.fr/fr/residence/residence-etudiante-george-sand-saint-denis/",
        // "https://www.arpej.fr/fr/residence/alpha-residence-etudiante-aubervilliers/",
        "https://www.arpej.fr/fr/residence/omega-residence-etudiante-aubervilliers/",
        "https://www.arpej.fr/fr/residence/etudiante-pierre-vidal-naquet-saint-denis/",
    ];

    constructor(page, discordNotifier) {
        this.page = page;
        this.discordNotifier = discordNotifier;
        this.last_residences_ids = [];
    }

    async fetchAvailabilities() {
        const residences = (await Utils.fetchJson(this.GET_RESIDENCES_URL))
            .residences;
        const filteredResidences = residences.filter((residence) =>
            this.WHITELIST.includes(residence.link)
        );
        const availableResidences = [];
        for (const residence of filteredResidences) {
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

            if (await this.isResidenceAvailable(id)){
                availableResidences.push(residence);
            }
        }

        this.handleNotification(availableResidences);
    }

    async isResidenceAvailable(residenceId) {
        const februaryOffers = await Utils.fetchJson(
            `https://admin.arpej.fr/api/customer/residences/${residenceId}/availabilities/2022-02/offers`,
            this.TOKEN
        );

        const marchOffers = await Utils.fetchJson(
            `https://admin.arpej.fr/api/customer/residences/${residenceId}/availabilities/2022-03/offers`,
            this.TOKEN
        );

        const offers = februaryOffers.concat(marchOffers);
        for (const offer of offers) {
            if (offer.booking_restriction.enabled == false) {
                return true;
            }
        }
        return false;
    }

    async handleNotification(residences) {
        const residences_ids = residences.map((residence) => residence.ID);
        if (
            residences.length &&
            !Utils.includes(this.last_residences_ids, residences_ids)
        ) {
            const residencesListMessage = residences
                .map(
                    (residence) =>
                        `  - [${residence.title}](<${residence.link}>)`
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
}
