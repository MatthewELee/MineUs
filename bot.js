
const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');

require('dotenv').config();
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VC_CHANNEL_ID = process.env.VC_CHANNEL_ID;
const CONFIRM_CHANNEL_ID = process.env.CONFIRM_CHANNEL_ID;
const CAPTURE_API_URL = process.env.CAPTURE_API_URL;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
// Stores Among Us name -> Discord member mappings
let playerMapping = {};

// Stores pending confirmation messages
let pendingConfirmations = {};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    startCaptureApiListener();
});

function startCaptureApiListener() {
    const ws = new WebSocket(CAPTURE_API_URL);

    ws.on('message', async (data) => {
        const event = JSON.parse(data);

        if (event.event === "game_start") {
            const amongUsPlayers = event.players || [];
            await sendConfirmationMessage(amongUsPlayers);
        } else if (event.event === "meeting_started") {
            await unmuteAllPlayers();
        } else if (event.event === "player_died") {
            await unmutePlayer(event.player_name);
        } else if (event.event === "game_end") {
            await unmuteAllPlayers();
            playerMapping = {}; // Reset mappings
        }
    });

    ws.on('close', () => {
        console.log("Lost connection to Among Us Capture API. Reconnecting...");
        setTimeout(startCaptureApiListener, 5000);
    });

    ws.on('error', (err) => {
        console.error("WebSocket error:", err);
    });
}

// Mute all alive players
async function muteAlivePlayers() {
    const guild = await client.guilds.fetch(GUILD_ID);
    const vcChannel = await guild.channels.fetch(VC_CHANNEL_ID);

    for (const member of vcChannel.members.values()) {
        if (Object.values(playerMapping).includes(member.id)) {
            await member.voice.setMute(true);
        }
    }
}

// Unmute all players
async function unmuteAllPlayers() {
    const guild = await client.guilds.fetch(GUILD_ID);
    const vcChannel = await guild.channels.fetch(VC_CHANNEL_ID);

    for (const member of vcChannel.members.values()) {
        await member.voice.setMute(false);
    }
}

// Unmute dead player
async function unmutePlayer(amongUsName) {
    if (playerMapping[amongUsName]) {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(playerMapping[amongUsName]);
        await member.voice.setMute(false);
    }
}

client.login(TOKEN);

// Export client for use in other files
module.exports = client;  

require('./confirmation.js');
require('./commandConfirmation.js'); 
