import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import {
  ChannelType,
  Events,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { DATABASE_KEYS } from "@/config/index.js";
import { defineEvent, type EventContext } from "./base.js";

async function handleCommandExecution(
  interaction: ChatInputCommandInteraction,
  ctx: EventContext,
) {
  const { logger, container } = ctx;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const commandName = interaction.commandName;

  try {
    await command.execute(interaction, container);
  } catch (error) {
    logger.error(
      {
        err: error,
        commandName,
        userId: interaction.user?.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
      },
      `Command execution failed: ${commandName}`,
    );
    const replyContent = {
      content: "There was an error while executing this command!",
      flags: MessageFlags.Ephemeral as const,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyContent);
    } else {
      await interaction.reply(replyContent);
    }
  }
}

function createTicketModal(): ModalBuilder {
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
  return modal;
}

async function handleTicketModal(
  modalInteraction: ModalSubmitInteraction,
  ctx: EventContext,
) {
  const { db, client } = ctx;
  const reason = modalInteraction.fields.getTextInputValue("ticket_reason");
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

  const ticketCategory = (await db.getItem(DATABASE_KEYS.TICKET_CATEGORY)) as
    | string
    | null;

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: ticketCategory ?? undefined,
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

export default defineEvent(
  Events.InteractionCreate,
  async (
    [interaction]: [
      ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
    ],
    ctx: EventContext,
  ) => {
    if (interaction.isChatInputCommand()) {
      await handleCommandExecution(interaction, ctx);
    }

    if (interaction.isButton()) {
      const buttonInteraction = interaction as ButtonInteraction;

      if (buttonInteraction.customId === "create_ticket") {
        const modal = createTicketModal();
        await buttonInteraction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      const modalInteraction = interaction as ModalSubmitInteraction;
      if (modalInteraction.customId === "ticket_modal") {
        await handleTicketModal(modalInteraction, ctx);
      }
    }
  },
);
