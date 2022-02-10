import { Utils } from "./utils.js";
import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";
import cheerio from "cheerio";
import "dotenv/config";

export class Crous {
    NO_AVAILAVILITIES_MESSAGE = "Aucun logement disponible pour vos critères.";
    URL =
        "https://trouverunlogement.lescrous.fr/tools/flow/21/search?bounds=2.2431_48.9244_2.4345_48.7714";
    ENTRY_DATE = 17; // Day of february

    BLACKLIST = [
        "BERTELOTTE (28 RUE DU COLONEL PIERRE AVIA 75015 PARIS)",
        "CAVE (22/24 rue Cavé 75018 Paris)",
    ];

    constructor(page, discordNotifier) {
        this.page = page;
        this.last_residences_ids = [];
        this.discordNotifier = discordNotifier;
    }

    async run() {
        await this.page.goto(this.URL);
        const residences = await this.getUnfilteredResidences();
        const filteredresidences = await Utils.asyncFilter(
            residences,
            async (residence) => await this.isResidenceAvailable(residence.id)
        );
        const residenceToBook = filteredresidences.find(
            (residence) => !this.BLACKLIST.includes(residence.name)
        );
        this.handleNotification(filteredresidences);

        if (!residenceToBook) {
            return;
        }
        console.log(
            `Making reservation for residence ${residenceToBook.name} with id ${residenceToBook.id}`
        );
        this.bookResidence(residenceToBook.id);
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
            !Utils.includes(this.last_residences_ids, residences_ids)
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
        if (data.hasOwnProperty("errors")) {
            // Added for this error:
            // SOAP-ERROR: Parsing WSDL: Couldn't load from 'https://cite-u.crous-paris.fr/H3/ws/heberg3Service/2.8.0?wsdl'
            console.log(
                `Cannot get availabilities for residence with id ${id}!`
            );
        }
        return (
            data.hasOwnProperty("periodsAvailable") &&
            data.periodsAvailable.length != 0
        );
    }

    async addToSelection(residenceId, PHPSESSID) {
        const body = JSON.stringify({
            accommodation: residenceId,
            occupationMode: "alone",
            requestedArrivalDate: `2022-02-${this.ENTRY_DATE}`,
            requestedDepartureDate: "2022-08-31",
            selectedArrivalDate: `2022-02-${this.ENTRY_DATE}T00:00:00+01:00`,
            selectedDepartureDate: "2022-08-31T00:00:00+02:00",
        });

        await fetch(
            `https://trouverunlogement.lescrous.fr/api/fr/tools/21/carts/${process.env.CART_NUMBER}/items`,

            {
                headers: {
                    cookie: `PHPSESSID=${PHPSESSID}`,
                },
                body,
                method: "POST",
            }
        );
    }

    async bookResidence(residenceId) {
        const PHPSESSID = await this.getPHPSESSID();
        console.log(`PHPSESSID=${PHPSESSID}`);
        await this.addToSelection(residenceId, PHPSESSID);
        console.log("Residence added to selection");
        await this.bookSelectedResidence(residenceId, PHPSESSID);
        console.log("Reservation made");
    }

    async bookSelectedResidence(residenceId, PHPSESSID) {
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
                "documents/convention_de_stage.pdf"
            ),
            "request_submit[studyLevel]": "5",
            "request_submit[purpose]": "internship",
            "request_submit[taxesInFrance]": "1",
        };
        for (const field in data) {
            formData.append(field, data[field]);
        }
        await fetch(
            "https://trouverunlogement.lescrous.fr/api/fr/tools/21/requests",
            {
                headers: {
                    cookie: `PHPSESSID=${PHPSESSID}`,
                },
                body: formData,
                method: "POST",
            }
        );
    }

    async getPHPSESSID() {
        const res1 = await fetch(
            "https://trouverunlogement.lescrous.fr/saml/login?target=/tools/flow/21/search",
            {
                referrer:
                    "https://trouverunlogement.lescrous.fr/tools/flow/21/search",
                redirect: "manual", // Stoping redirects to get cookies
            }
        );

        const headers1 = res1.headers.raw();
        const cookies = headers1["set-cookie"];
        const SimpleSAMLSessionID = cookies[0].split(";")[0].split("=")[1];
        const tmpPHPSESSID = cookies[1].split(";")[0].split("=")[1];

        const res2 = await fetch(headers1["location"], {
            redirect: "manual",
        });
        const headers2 = res2.headers.raw();
        const cookies2 = headers2["set-cookie"];
        const JSESSIONID = cookies2[0].split(";")[0].split("=")[1];
        const IDP = cookies2[1].split(";")[0].split("=")[1];
        const execution = headers2["location"][0].split("=")[2];
        const executionNum = execution.substring(1, execution.length - 2); // Assuming format eXs1.
        console.log(`Execution number: ${executionNum}`);

        await fetch(
            `https://idp.messervices.etudiant.gouv.fr/idp/profile/SAML2/Redirect/SSO?execution=e${executionNum}s1`,
            {
                headers: {
                    cookie: `JSESSIONID=${JSESSIONID}; IDP=${IDP};`,
                },
            }
        );

        const res3 = await fetch(
            `https://idp.messervices.etudiant.gouv.fr/idp/profile/SAML2/Redirect/SSO?execution=e${executionNum}s1`,
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    cookie: `JSESSIONID=${JSESSIONID}; IDP=${IDP};`,
                },
                body: `j_username=${encodeURIComponent(
                    process.env.EMAIL
                )}&j_password=${encodeURIComponent(
                    process.env.PASSWORD
                )}&_eventId_proceed=`,
                method: "POST",
            }
        );

        const html = await res3.text();
        const $ = cheerio.load(html);
        const SAMLResponse = $("input[name='SAMLResponse']").attr("value");

        const res4 = await fetch(
            "https://trouverunlogement.lescrous.fr/saml/acs",
            {
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    cookie: `qpid=c816e0ql6fqieh00v9dg; SimpleSAMLSessionID=${SimpleSAMLSessionID}; PHPSESSID=${tmpPHPSESSID}`,
                },
                body: `RelayState=https%3A%2F%2Ftrouverunlogement.lescrous.fr%2Fsaml%2Flogin&SAMLResponse=${encodeURIComponent(
                    SAMLResponse
                )}`,
                method: "POST",
                redirect: "manual",
            }
        );

        if (res4.headers.raw()["set-cookie"].length != 4) {
            // Once only received 3 cookies. Couldn't reproduce.
            console.error("Assumed receiving 4 cookies");
        }

        const PHPSESSID = res4.headers
            .raw()
            ["set-cookie"][2].split("=")[1]
            .split(";")[0];
        return PHPSESSID;
    }
}
