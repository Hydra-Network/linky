import {
  Events,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from "discord.js";

import { getItem } from "../db.js";
import logger from "../utils/logger.js";

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error({ err: error });
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    if (interaction.isButton()) {
      const buttonInteraction = interaction;

      if (buttonInteraction.customId === "create_ticket") {
        const modal = new ModalBuilder()
          .setCustomId("ticket_modal")
          .setTitle("Create a Ticket");

        const reasonInput = new TextInputBuilder()
          .setCustomId("ticket_reason")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Please describe your issue or question...")
          .setRequired(true);

        const labeledInput = new LabelBuilder()

          .setLabel("Reason for creating a ticket")
          .setTextInputComponent(reasonInput);

        modal.addLabelComponents(labeledInput);

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

        const ticketCategory = getItem("ticketCategory");

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
