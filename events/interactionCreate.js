import {
  Events,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { getTicketCategory } from "../db.js";

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (interaction.isButton()) {
      const buttonInteraction = interaction;
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
