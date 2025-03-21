const client = require('./bot');
require('dotenv').config();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const APPLICATION_ID = process.env.APPLICATION_ID;
// Register the command with Discord
const commands = [
    new SlashCommandBuilder()
        .setName('confirm')
        .setDescription('Manually confirm your Among Us name.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Your in-game name')
                .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(TOKEN);

rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), { body: commands })
    .then(() => console.log("Successfully registered commands."))
    .catch(console.error);

// Handle confirmation command
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'confirm') {
        const amongUsName = interaction.options.getString('name');
        playerMapping[amongUsName] = interaction.user.id;
        await interaction.reply(`${interaction.user} has confirmed as **${amongUsName}**.`);
    }
});
