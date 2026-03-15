import {
	Events,
	ChannelType,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	MessageFlags,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	PermissionFlagsBits,
} from "discord.js";
import { setTicketCategory, getTicketCategory, getUserSettings, setUserSetting } from "../db.js";

const getMainEmbed = () => {
	return new EmbedBuilder()
		.setColor(0x00ae86)
		.setTitle("⚙️ Settings")
		.setDescription("Select a category to view its settings.");
};

const getEditEmbed = (userId, setting) => {
	const settings = getUserSettings(userId);
	const emojisEnabled = settings.checkEmojis !== false;
	const ticketCategoryId = getTicketCategory();

	if (setting === "check_emojis") {
		return new EmbedBuilder()
			.setColor(0x00ae86)
			.setTitle("⚙️ Settings > Check Emojis")
			.setDescription("Show emojis in the check command")
			.addFields({
				name: "Current Value",
				value: emojisEnabled ? "✅ On" : "❌ Off",
			})
			.addFields({
				name: "Valid Values",
				value: "✅ On / ❌ Off",
			})
			.setFooter({ text: "User-specific Settings" });
	} else if (setting === "ticket_category") {
		return new EmbedBuilder()
			.setColor(0x00ae86)
			.setTitle("⚙️ Settings > Ticket Category")
			.setDescription("Category for ticket channels")
			.addFields({
				name: "Current Value",
				value: ticketCategoryId || "Not set",
			})
			.setFooter({ text: "Server Settings" });
	}
};

const getMainComponents = () => {
	const categorySelect = new StringSelectMenuBuilder()
		.setCustomId("settings_category_select")
		.setPlaceholder("Select a category")
		.addOptions([
			{
				label: "Check Command",
				value: "check_command",
				description: "Settings for the check command",
			},
			{
				label: "Tickets",
				value: "tickets",
				description: "Settings for tickets",
			},
		]);

	const selectRow = new ActionRowBuilder().addComponents(categorySelect);

	return [selectRow];
};

const getCategoryEmbed = (category, userId, guild) => {
	const settings = getUserSettings(userId);
	const emojisEnabled = settings.checkEmojis !== false;
	const ticketCategoryId = getTicketCategory();

	if (category === "check_command") {
		let ticketCategoryName = "Not set";
		if (ticketCategoryId && guild) {
			const category = guild.channels.cache.get(ticketCategoryId);
			if (category) {
				ticketCategoryName = category.name;
			}
		}

		return new EmbedBuilder()
			.setColor(0x00ae86)
			.setTitle("⚙️ Check Command Settings")
			.setDescription("Configure the check command")
			.addFields({
				name: "Check Emojis",
				value: `Current: ${emojisEnabled ? "✅ On" : "❌ Off"}`,
				inline: true,
			})
			.setFooter({ text: "User-specific Settings" });
	} else if (category === "tickets") {
		let ticketCategoryName = "Not set";
		if (ticketCategoryId && guild) {
			const category = guild.channels.cache.get(ticketCategoryId);
			if (category) {
				ticketCategoryName = category.name;
			}
		}

		return new EmbedBuilder()
			.setColor(0x00ae86)
			.setTitle("⚙️ Ticket Settings")
			.setDescription("Configure ticket settings")
			.addFields({
				name: "Ticket Category",
				value: `Current: ${ticketCategoryName}`,
				inline: true,
			})
			.setFooter({ text: "Server Settings" });
	}
};

const getCategoryComponents = (category) => {
	const settingsSelect = new StringSelectMenuBuilder()
		.setCustomId("settings_select")
		.setPlaceholder("Select a setting")
		.addOptions([]);

	if (category === "check_command") {
		settingsSelect.addOptions([
			{
				label: "Check Emojis",
				value: "check_emojis",
				description: "Show emojis in the check command",
			},
		]);
	} else if (category === "tickets") {
		settingsSelect.addOptions([
			{
				label: "Ticket Category",
				value: "ticket_category",
				description: "Category for ticket channels",
			},
		]);
	}

	const backRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("settings_back")
			.setLabel("Back")
			.setStyle(ButtonStyle.Secondary),
	);

	const selectRow = new ActionRowBuilder().addComponents(settingsSelect);

	return [selectRow, backRow];
};

const getEditComponents = (setting) => {
	const settingsSelect = new StringSelectMenuBuilder()
		.setCustomId("settings_select")
		.setPlaceholder("Select a setting")
		.addOptions([
			{
				label: "Check Emojis",
				value: "check_emojis",
				description: "Show emojis in the check command",
			},
			{
				label: "Ticket Category",
				value: "ticket_category",
				description: "Category for ticket channels",
			},
		]);

	const toggleRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("settings_toggle")
			.setLabel("Toggle")
			.setStyle(ButtonStyle.Primary),
	);

	const backRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("settings_back")
			.setLabel("Back")
			.setStyle(ButtonStyle.Secondary),
	);

	const selectRow = new ActionRowBuilder().addComponents(settingsSelect);

	if (setting === "ticket_category") {
		return [selectRow, backRow];
	}

	return [selectRow, toggleRow, backRow];
};

export default {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction, client) {
		if (interaction.isStringSelectMenu()) {
			const selectInteraction = interaction;

			if (selectInteraction.customId === "settings_category_select") {
				const userId = selectInteraction.user.id;
				const category = selectInteraction.values[0];
				const guild = selectInteraction.guild;

				await selectInteraction.update({
					embeds: [getCategoryEmbed(category, userId, guild)],
					components: getCategoryComponents(category),
				});
				return;
			}

			if (selectInteraction.customId === "settings_select") {
				const userId = selectInteraction.user.id;
				const settingId = selectInteraction.values[0];
				const guild = selectInteraction.guild;

				if (settingId === "check_emojis") {
					await selectInteraction.update({
						embeds: [getEditEmbed(userId, settingId)],
						components: getEditComponents(settingId),
					});
				} else if (settingId === "ticket_category") {
					const categoryOptions = guild.channels.cache
						.filter((c) => c.type === ChannelType.GuildCategory)
						.map((c) => ({
							label: c.name,
							value: c.id,
						}));

					if (categoryOptions.length === 0) {
						await selectInteraction.update({
							embeds: [
								new EmbedBuilder()
									.setColor(0xff0000)
									.setTitle("⚙️ Error")
									.setDescription("No categories found in this server."),
							],
							components: getMainComponents(),
						});
						return;
					}

					const categorySelect = new StringSelectMenuBuilder()
						.setCustomId("settings_ticket_category_select")
						.setPlaceholder("Select a category")
						.addOptions(categoryOptions);

					await selectInteraction.update({
						embeds: [getEditEmbed(userId, settingId)],
						components: [
							new ActionRowBuilder().addComponents(categorySelect),
							new ActionRowBuilder().addComponents(
								new ButtonBuilder()
									.setCustomId("settings_back")
									.setLabel("Back")
									.setStyle(ButtonStyle.Secondary),
							),
						],
					});
				}
				return;
			}

			if (selectInteraction.customId === "settings_ticket_category_select") {
				if (
					!selectInteraction.memberPermissions.has(
						PermissionFlagsBits.ManageChannels,
					)
				) {
					await selectInteraction.update({
						embeds: [
							new EmbedBuilder()
								.setColor(0xff0000)
								.setTitle("⚙️ Permission Denied")
								.setDescription(
									"You need Manage Channels permission to change this setting.",
								),
						],
						components: [],
					});
					return;
				}

				const categoryId = selectInteraction.values[0];
				setTicketCategory(categoryId);

				const guild = selectInteraction.guild;
				const categoryName =
					guild?.channels.cache.get(categoryId)?.name || "Unknown";

				await selectInteraction.update({
					embeds: [
						new EmbedBuilder()
							.setColor(0x00ae86)
							.setTitle("⚙️ Setting Updated")
							.setDescription(`Ticket category set to ${categoryName}.`),
					],
					components: [],
				});
				return;
			}
		}

		if (interaction.isButton()) {
			const buttonInteraction = interaction;
			const userId = buttonInteraction.user.id;

			if (buttonInteraction.customId === "settings_back") {
				const guild = buttonInteraction.guild;
				await buttonInteraction.update({
					embeds: [getMainEmbed(userId, guild)],
					components: getMainComponents(),
				});
				return;
			}

			if (buttonInteraction.customId === "settings_category_back") {
				const guild = buttonInteraction.guild;
				await buttonInteraction.update({
					embeds: [getMainEmbed(userId, guild)],
					components: getMainComponents(),
				});
				return;
			}

			if (buttonInteraction.customId === "settings_toggle") {
				const settings = getUserSettings(userId);
				const currentValue = settings.checkEmojis !== false;
				setUserSetting(userId, "checkEmojis", !currentValue);

				await buttonInteraction.update({
					embeds: [getEditEmbed(userId, "check_emojis")],
					components: getEditComponents("check_emojis"),
				});
				return;
			}

			if (buttonInteraction.customId === "create_ticket") {
				const modal = new ModalBuilder()
					.setCustomId("ticket_modal")
					.setTitle("Create a Ticket");

				const reasonInput = new TextInputBuilder()
					.setCustomId("ticket_reason")
					.setLabel("Reason for creating a ticket")
					.setStyle(TextInputStyle.Paragraph)
					.setPlaceholder("Please describe your issue or question...")
					.setRequired(true);

				const row = new ActionRowBuilder().addComponents(reasonInput);

				modal.addComponents(row);

				await buttonInteraction.showModal(modal);
			}
		}

		if (interaction.isModalSubmit()) {
			const modalInteraction = interaction;
			if (modalInteraction.customId === "ticket_modal") {
				const reason =
					modalInteraction.fields.getTextInputValue("ticket_reason");
				const user = modalInteraction.user;
				const guild = modalInteraction.guild;

				if (!guild) {
					await modalInteraction.reply({
						content: "This can only be used in a server.",
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				const ticketId = Date.now().toString().slice(-6);
				const channelName = `ticket-${user.username}-${ticketId}`;

				const ticketCategory = await getTicketCategory();

				const ticketChannel = await guild.channels.create({
					name: channelName,
					type: ChannelType.GuildText,
					parent: ticketCategory,
					permissionOverwrites: [
						{
							id: guild.id,
							deny: ["ViewChannel"],
						},
						{
							id: user.id,
							allow: ["ViewChannel", "SendMessages", "AttachFiles"],
						},
						{
							id: client.user?.id ?? "",
							allow: ["ViewChannel", "SendMessages", "ManageChannels"],
						},
					],
				});

				await ticketChannel.send({
					content: `🎫 **New Ticket** | ${user} (\`${user.id}\`)\n📝 **Reason:** ${reason}`,
				});

				await modalInteraction.reply({
					content: `✅ Ticket created: ${ticketChannel}`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	},
};
