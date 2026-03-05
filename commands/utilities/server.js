import {
	SlashCommandBuilder,
	ApplicationIntegrationType,
	InteractionContextType,
	EmbedBuilder,
	ChannelType,
} from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server.")
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel]),
	async execute(interaction) {
		const { guild } = interaction;
		const fullGuild = await guild.fetch();
		const owner = await guild.fetchOwner();
		const allMembers = await guild.members.fetch();

		const totalMembers = fullGuild.memberCount;
		const botCount = allMembers.filter((m) => m.user.bot).size;
		const humanCount = totalMembers - botCount;

		const channels = guild.channels.cache;
		const textChannels = channels.filter(
			(c) =>
				c.type === ChannelType.GuildText ||
				c.type === ChannelType.GuildAnnouncement,
		).size;
		const voiceChannels = channels.filter(
			(c) =>
				c.type === ChannelType.GuildVoice ||
				c.type === ChannelType.GuildStageVoice,
		).size;
		const categoryChannels = channels.filter(
			(c) => c.type === ChannelType.GuildCategory,
		).size;

		const emojis = guild.emojis.cache;
		const regularEmojis = emojis.filter((e) => !e.animated).size;
		const animatedEmojis = emojis.filter((e) => e.animated).size;

		// Emoji limits based on boost level
		const emojiLimits = { 0: 50, 1: 100, 2: 150, 3: 250 };
		const maxEmojis = emojiLimits[guild.premiumTier] || 50;

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(guild.name)
			.setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
			.setDescription(
				`**ID:** ${guild.id}\n` +
				`**Owner:** <@${owner.id}>\n` +
				`**Created Date:** <t:${Math.floor(guild.createdTimestamp / 1000)}:f> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
			)
			.addFields(
				{
					name: "Member Count",
					value: `Total: ${totalMembers}\nHumans: ${humanCount}\nBots: ${botCount}`,
					inline: true,
				},
				{
					name: "Boosts",
					value: `Level ${guild.premiumTier}\n${guild.premiumSubscriptionCount} boosts`,
					inline: true,
				},
				{
					name: "Roles",
					value: `${guild.roles.cache.size} roles`,
					inline: true,
				},
				{
					name: "Channels",
					value: `Textual: ${textChannels}\nVoice: ${voiceChannels}\nCategory: ${categoryChannels}`,
					inline: true,
				},
				{
					name: "Emojis",
					value: `Regular: ${regularEmojis}/${maxEmojis}\nAnimated: ${animatedEmojis}/${maxEmojis}\nTotal: ${emojis.size}/${maxEmojis * 2}`,
					inline: true,
				},
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
