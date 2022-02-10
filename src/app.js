import puppeteer from "puppeteer";
import { Arpej } from "./arpej.js";
import { Crous } from "./crous.js";
import { Discord } from "./discord.js";

const main = async () => {
    const browser = await puppeteer.launch();
    const discord = new Discord();
    const crous = new Crous(await browser.newPage(), discord);
    const arpej = new Arpej(await browser.newPage(), discord);
    // setInterval(async () => {
    //     await arpej.run();
    //     // await crous.run();
    // }, 1000 * 60);
    await crous.bookResidence("1712");
};

main();
