const { SlashCommandBuilder } = require("discord.js");
const { getLinks } = require("../../db.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("showlinks")
    .setDescription("Shows all links in the database for today."),

  async execute(interaction) {
    const allowedRoles = ["1446283390327324692", "1307886745534332978"];

    if (
      !interaction.member.roles.cache.some((role) =>
        allowedRoles.includes(role.id),
      )
    ) {
      return interaction.reply({
        content: "You don't have permission.",
        ephemeral: true,
      });
    }

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

      const entry = `**${link.url}**
${link.blocker.join(" ")}
Created by: <@${link.userId}>`;

      if (link.site === "galaxy") {
        galaxy.push(entry);
      } else if (link.site === "glint") {
        glint.push(entry);
      } else if (link.site === "bromine") {
        bromine.push(entry);
      }
    }

    await interaction.reply({
      content: `## Galaxy Links
${galaxy.length ? galaxy.join("\n\n") : ""}`,
    });

    await interaction.followUp({
      content: `## Glint Links
${glint.length ? glint.join("\n\n") : ""}`,
    });

    await interaction.followUp({
      content: `## Bromine Links
${bromine.length ? bromine.join("\n\n") : ""}`,
    });
  },
};