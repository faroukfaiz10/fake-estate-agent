import { Utils } from "./utils.js";
import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";

export class Crous {
    NO_AVAILAVILITIES_MESSAGE = "Aucun logement disponible pour vos critères.";
    URL =
        "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.2431_48.9244_2.4345_48.7714";
    ENTRY_DATE = 21; // Day of february
    PHPSESSID = "e8lsfse3fek8nrehnsm8is80t7";

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
        // if (filteredresidences.length > 0) {
        //     const residence = filteredresidences[0];
        //     console.log(
        //         `Making reservation for residence ${residence.name} with id ${residence.id}`
        //     );
        //     await this.addToSelection(residence.id);
        //     console.log("Residence added to selection");
        //     await this.makeReservation(residence.id);
        //     console.log("Reservation made ?");
        // }
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
            !Utils.includes(this.last_residences_ids, residences_ids) // TODO: See if new included in old instead
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
        const URL = `https://trouverunlogement.lescrous.fr/api/fr/tools/21/accommodations/${id}/availabilities?occupationMode=alone&arrivalDate=2022-02-${this.ENTRY_DATE}&departureDate=2022-08-31`;
        const data = await Utils.fetchJson(URL);
        return data.periodsAvailable.length != 0;
    }

    async addToSelection(residenceId) {
        const body = JSON.stringify({
            accommodation: residenceId,
            occupationMode: "alone",
            requestedArrivalDate: `2022-02-${this.ENTRY_DATE}`,
            requestedDepartureDate: "2022-08-31",
            selectedArrivalDate: `2022-02-${this.ENTRY_DATE}T00:00:00+01:00`,
            selectedDepartureDate: "2022-08-31T00:00:00+02:00",
        });

        await fetch(
            "https://trouverunlogement.lescrous.fr/api/fr/tools/21/carts/2821428/items", // 2821428 maybe cart id ?

            {
                headers: {
                    cookie: `PHPSESSID=${this.PHPSESSID}`,
                },
                body,
                method: "POST",
            }
        );
    }

    async makeReservation(residenceId) {
        const RESERVATION_URL = `https://trouverunlogement.lescrous.fr/tools/flow/21/cart/request/${residenceId}`;
        await this.page.goto(RESERVATION_URL);

        const formData = new FormData();
        const data = {
            "request_submit[occupationMode]": "alone",
            "request_submit[arrivalDate]": `2022-02-${this.ENTRY_DATE}`,
            "request_submit[departureDate]": "2022-08-31",
            accommodation: residenceId,
            "request_submit[pendingAttachments][1][attachmentId]": "1",
            "request_submit[pendingAttachments][1][file]": fs.createReadStream(
                "documents/attestation_bancaire_bnp.pdf"
            ),
            "request_submit[pendingAttachments][5][attachmentId]": "5",
            "request_submit[pendingAttachments][5][file]": fs.createReadStream(
                "documents/certificat_de_scolarite.pdf"
            ),
            "request_submit[pendingAttachments][2][attachmentId]": "2",
            "request_submit[pendingAttachments][2][file]": fs.createReadStream(
                "documents/attestation_de_reussite.pdf"
            ),
            "request_submit[pendingAttachments][4][attachmentId]": "4",
            "request_submit[pendingAttachments][4][file]": fs.createReadStream(
                "documents/internship_agreement_fr.pdf"
            ),
            "request_submit[studyLevel]": "5",
            "request_submit[purpose]": "internship",
            "request_submit[comment]":
                "Convention pas encore signée par l'entreprise. Elle le sera au cours de la semaine. Merci de votre compréhension.",
            "request_submit[taxesInFrance]": "1",
        };
        for (const field in data) {
            formData.append(field, data[field]);
        }
        const res = await fetch(
            "https://trouverunlogement.lescrous.fr/api/fr/tools/21/requests",
            {
                headers: {
                    cookie: `PHPSESSID=${this.PHPSESSID}`,
                },
                body: formData,
                method: "POST",
                mode: "cors",
            }
        );
    }
}
