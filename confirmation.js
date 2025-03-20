const client = require('./bot');
require('dotenv').config();
const CONFIRM_CHANNEL_ID = process.env.CONFIRM_CHANNEL_ID;


const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

async function sendConfirmationMessage(amongUsPlayers) {
    const channel = await client.channels.fetch(CONFIRM_CHANNEL_ID);
    if (!channel) {
        console.error("Confirmation channel not found.");
        return;
    }

    let description = "🔍 **Among Us game started!**\nReact with your number to confirm your in-game name:\n\n";
    let emojiToName = {};

    amongUsPlayers.forEach((playerName, index) => {
        if (index < numberEmojis.length) {
            const emoji = numberEmojis[index];
            description += `${emoji} - **${playerName}**\n`;
            emojiToName[emoji] = playerName;
        }
    });

    const message = await channel.send(description);

    // Add emoji reactions for confirmation
    for (const emoji of Object.keys(emojiToName)) {
        await message.react(emoji);
    }

    // Store message ID and mappings
    pendingConfirmations[message.id] = emojiToName;
}

// Listen for reactions to map players
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return; 
    
    const messageId = reaction.message.id;
    if (pendingConfirmations[messageId]) {
        const emoji = reaction.emoji.name;
        const amongUsName = pendingConfirmations[messageId][emoji];

        if (amongUsName) {
            playerMapping[amongUsName] = user.id;
            reaction.message.channel.send(`${user} confirmed as **${amongUsName}**.`);
        }
    }
});
