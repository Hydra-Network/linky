import type { ChatInputCommandInteraction } from "discord.js";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("show")
    .setDescription("Shows a large version of an emoji and its details.")
    .addStringOption((option) =>
      option
        .setName("emoji")
        .setDescription("The emoji to show")
        .setRequired(true),
    )
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),

  async execute(interaction: ChatInputCommandInteraction) {
    const rawEmoji = interaction.options.getString("emoji");

    const match = rawEmoji.match(/<(a?):(\w+):(\d+)>/);

    if (!match) {
      return interaction.reply({
        content: "Invalid emoji! Make sure it's a custom emoji from a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const isAnimated = match[1] === "a";
    const name = match[2];
    const id = match[3];

    const timestamp = Math.floor(
      Number((BigInt(id) >> 22n) + 1420070400000n) / 1000,
    );
    const discordTime = `<t:${timestamp}:F>`;

    const extension = isAnimated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096`;

    const embed = new EmbedBuilder()
      .setTitle("Show Emoji")
      .setColor("#5865F2")
      .addFields(
        { name: "Name", value: name, inline: true },
        {
          name: "Animated",
          value: isAnimated ? "true" : "false",
          inline: true,
        },
        { name: "ID", value: id, inline: true },
        { name: "Uploaded", value: discordTime },
        { name: "URL", value: url },
        { name: isAnimated ? "GIF" : "PNG", value: "\u200B" },
      )
      .setImage(url);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Download")
        .setStyle(ButtonStyle.Link)
        .setURL(url),
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
