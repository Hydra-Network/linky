import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Purges up to 100 messages.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Number of messages to purge (1-100)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100)
		).setIntegrationTypes([
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		]),
	async execute(interaction) {
		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
		}
		const targetChannel = interaction.channel;
		const amount = interaction.options.getInteger('amount');

		const botMember = interaction.guild.members.me;
		if (!targetChannel.permissionsFor(botMember).has(PermissionFlagsBits.ManageMessages)) {
			return interaction.reply({ content: 'I don\'t have permission to manage messages in this channel.', flags: MessageFlags.Ephemeral });
		}

		try {
			await targetChannel.bulkDelete(amount, true).then(async messages => {
				await interaction.reply({ content: `Successfully purged ${messages.size} messages.`, flags: MessageFlags.Ephemeral });
			})
				.catch(console.error);
		} catch (error) {
			console.error('Purge error:', error);
			await interaction.reply({ content: 'There was an error while trying to purge messages. Make sure I have permissions to manage messages.', flags: MessageFlags.Ephemeral });
		}
	}
};
