import {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} from "discord.js";
import { getLinks } from "../../db.js";
import { ROLES } from "../../utils/roles.js";

export default {
  data: new SlashCommandBuilder()
    .setName("showlinks")
    .setDescription("Shows all links in the database for today.")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .addBooleanOption((option) =>
      option.setName("ping").setDescription("Ping roles it's unblocked for?"),
    ),

  async execute(interaction) {
    const allowedRoles = [
      ROLES.galaxy,
      ROLES.multiverse,
      ROLES.LINK_BOTS.head,
      ROLES.LINK_BOTS.elite,
      ROLES.LINK_BOTS.honorary,
    ];

    if (
      !interaction.member ||
      !interaction.member.roles.cache.some((role) =>
        allowedRoles.includes(role.id),
      )
    ) {
      return interaction.reply({
        content: "You don't have permission.",
        ephemeral: true,
      });
    }
    const shouldPing = interaction.options.getBoolean("ping") ?? false;
    const links = await getLinks();
    const today = new Date();
    const options = { month: "short", day: "numeric" };
    const todayStr = today.toLocaleDateString("en-US", options);

    let galaxy = [];
    let glint = [];
    let bromine = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      if (link.timestamp !== todayStr) continue;

      let entry = "";

      if (shouldPing) {
        entry = `**${link.url}**\n${link.blocker.join(" ")}\nCreated by: <@${link.userId}>`;
      } else {
        entry = `**${link.url}**\nCreated by: <@${link.userId}>`;
      }

      if (link.site === "galaxy") {
        galaxy.push(entry);
      } else if (link.site === "glint") {
        glint.push(entry);
      } else if (link.site === "bromine") {
        bromine.push(entry);
      }
    }

    await interaction.reply({
      content: `## Galaxy Links\n${galaxy.length ? galaxy.join("\n\n") : "No links found"}`,
    });

    await interaction.followUp({
      content: `## Glint Links\n${glint.length ? glint.join("\n\n") : "No links found"}`,
    });

    await interaction.followUp({
      content: `## Bromine Links\n${bromine.length ? bromine.join("\n\n") : "No links found"}`,
    });
  },
};
