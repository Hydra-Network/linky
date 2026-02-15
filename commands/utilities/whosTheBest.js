import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder().setName('whosthebest').setDescription('Who is the best?'),
	async execute(interaction) {
		await interaction.reply('Rogo is the best!');
	},
};
