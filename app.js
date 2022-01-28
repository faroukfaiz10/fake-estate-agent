import puppeteer from "puppeteer";
import { Crous } from "./crous.js";
import { Discord } from "./discord.js";

const main = async () => {
    const browser = await puppeteer.launch();
    const discord = new Discord();
    const crous = new Crous(await browser.newPage(), discord);
    setInterval(async () => {
        await crous.fetch();
    }, 1000 * 5);
};

main();
