import fetch from "node-fetch";

export class Discord {
    async notify(message) {
        const AVARTAR_URL =
            "https://p7.hiclipart.com/preview/866/59/617/estate-agent-real-estate-computer-icons-house-property-house.jpg";
        const payload = JSON.stringify({
            username: "Fake estate agent",
            avatar_url: AVARTAR_URL,
            content: message,
        });
        const params = {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: payload,
            muteHttpExceptions: true,
        };

        await fetch(process.env.DISCORD_URL, params);
    }
}
