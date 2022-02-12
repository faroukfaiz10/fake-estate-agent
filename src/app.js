import puppeteer from "puppeteer";
import { Arpej } from "./arpej.js";
import { Crous } from "./crous.js";
import { Discord } from "./discord.js";

const main = async () => {
    const browser = await puppeteer.launch();
    const discord = new Discord();
    const runCrous = process.argv.includes("crous");
    const runArpej = process.argv.includes("arpej");
    let crous, arpej;

    if (runCrous) {
        crous = new Crous(await browser.newPage(), discord);
    }
    if (runArpej) {
        arpej = new Arpej(await browser.newPage(), discord);
        await arpej.init();
    }
    setInterval(async () => {
        if (runCrous) crous.run();
        if (runArpej) arpej.run();
    }, 1000 * 60);
};

main();
