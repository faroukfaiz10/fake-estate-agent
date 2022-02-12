import fetch from "node-fetch";

export class Discord {
    async notify(message) {
        // const DISCORD_URL =
        //     "https://discord.com/api/webhooks/936304587244204073/MDHxQYyzB5UqsFYkk8AfEfSFhXc19oXTk1BaN7LKLv7_ZZl8BDGgWousKN_SUjaXgRx3";
        const DISCORD_URL =
            "https://discord.com/api/webhooks/936586097474035732/-at6PePUZXtep28ICJ2tBu4KIN4dSuQyGJNgYvk61IgagYMOh2W1rhwG7dqm-dxcvM4b";
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

        await fetch(DISCORD_URL, params);
    }
}
