import type {
  ChatInputCommandInteraction,
  GuildChannel,
  GuildMember,
} from "discord.js";
import {
  ApplicationIntegrationType,
  ChannelType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  DATABASE_KEYS,
  ERROR_MESSAGES,
  MIN_AGE_ERRORS,
  STATUS_MESSAGES,
} from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { hasPermission } from "@/utils/permissions.js";
import { validateWithSchema, SettingsSchema, GuildSettingsSchema, WelcomeMessageSchema } from "@/utils/validation.js";
import * as v from "valibot";

type DbGetItem = (key: string) => unknown;
type DbSetItem = (key: string, value: unknown) => void;

async function handleCheckEmoji(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  if (!interaction.guildId) {
    await interaction.reply("This setting can only be used in a server.");
    return;
  }
  if (
    !hasPermission(
      interaction.member as GuildMember,
      PermissionFlagsBits.Administrator,
    )
  ) {
    await interaction.reply(ERROR_MESSAGES.ADMIN_REQUIRED);
    return;
  }
  const allSettings = validateWithSchema(
    GuildSettingsSchema,
    (await getItem(DATABASE_KEYS.SETTINGS)) || {},
  );
  const settings = allSettings.valid ? allSettings.data[interaction.guildId] || {} : {};
  const currentValue = settings.checkEmojis !== false;
  const updatedSettings = {
    ...(allSettings.valid ? allSettings.data : {}),
    [interaction.guildId]: { ...settings, checkEmojis: !currentValue },
  };
  await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
  await interaction.reply(
    `Check emojis ${!currentValue ? "enabled" : "disabled"} for this server`,
  );
}

async function handleTicketCategory(
  interaction: ChatInputCommandInteraction,
  setItem: DbSetItem,
) {
  const category = interaction.options.getChannel("category") as GuildChannel;
  await setItem(DATABASE_KEYS.TICKET_CATEGORY, category.id);
  await interaction.reply(`Ticket category set to ${category.name}`);
}

async function handleLinkChannelAdd(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
    | Record<string, string[]>
    | undefined;
  const channels = linkChannels?.[interaction.guildId] || [];
  await setItem(DATABASE_KEYS.LINK_CHANNELS, {
    ...linkChannels,
    [interaction.guildId]: [...channels, channel.id],
  });
  await interaction.reply(`Link channel added: ${channel.name}`);
}

async function handleLinkChannelRemove(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
    | Record<string, string[]>
    | undefined;
  const channels = linkChannels?.[interaction.guildId] || [];
  const index = channels.indexOf(channel.id);
  if (index === -1) {
    await interaction.reply(`Channel ${channel.name} is not a link channel`);
  } else {
    await setItem(DATABASE_KEYS.LINK_CHANNELS, {
      ...linkChannels,
      [interaction.guildId]: channels.filter((c) => c !== channel.id),
    });
    await interaction.reply(`Link channel removed: ${channel.name}`);
  }
}

async function handleLinkChannelList(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
) {
  const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
    | Record<string, string[]>
    | undefined;
  const channels = linkChannels?.[interaction.guildId] || [];
  if (channels.length === 0) {
    await interaction.reply("No link channels set");
  } else {
    await interaction.reply(`Link channels: ${channels.join(", ")}`);
  }
}

async function handleBoostChannel(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const settings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...settings,
    [interaction.guildId]: {
      ...(settings?.[interaction.guildId] || {}),
      boostChannel: channel.id,
    },
  });
  await interaction.reply(`Boost thank you channel set to ${channel.name}`);
}

async function handleMinAge(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const days = interaction.options.getInteger("days");
  const allSettings = validateWithSchema(
    GuildSettingsSchema,
    (await getItem(DATABASE_KEYS.SETTINGS)) || {},
  );
  const settings = allSettings.valid ? (allSettings.data[interaction.guildId] || {}) : {};

  if (days === null || days === undefined) {
    const currentAge = (settings as Record<string, unknown>).minAge as number | undefined;
    if (currentAge) {
      await interaction.reply(
        `Current minimum account age: ${currentAge} days`,
      );
    } else {
      await interaction.reply(MIN_AGE_ERRORS.NO_MIN_AGE_SET);
    }
    return;
  }

  if (days === 0) {
    const updatedSettings = {
      ...(allSettings.valid ? allSettings.data : {}),
      [interaction.guildId]: { ...settings, minAge: undefined },
    };
    await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
    await interaction.reply(MIN_AGE_ERRORS.MIN_AGE_REMOVED);
    return;
  }

  const updatedSettings = {
    ...(allSettings.valid ? allSettings.data : {}),
    [interaction.guildId]: { ...settings, minAge: days },
  };
  await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
  await interaction.reply(
    MIN_AGE_ERRORS.MIN_AGE_SET.replace("{minAge}", String(days)),
  );
}

async function handleTriggerWords(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  if (!interaction.guildId) {
    await interaction.reply("This setting can only be used in a server.");
    return;
  }
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  const currentValue =
    (settings as Record<string, unknown>).triggerWords !== false;
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: { ...settings, triggerWords: !currentValue },
  });
  await interaction.reply(
    `Trigger words ${!currentValue ? "enabled" : "disabled"} for this server`,
  );
}

async function handleWelcomeChannel(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: {
      ...settings,
      welcomeChannel: channel.id,
    },
  });
  await interaction.reply(
    STATUS_MESSAGES.WELCOME_CHANNEL_SET.replace("{channel}", channel.name),
  );
}

async function handleWelcomeChannelRemove(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  settings.welcomeChannel = undefined;
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: settings,
  });
  await interaction.reply(STATUS_MESSAGES.WELCOME_DISABLED);
}

async function handleWelcomeMessage(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const message = interaction.options.getString("message");
  const reset = interaction.options.getBoolean("reset");
  const allSettings = validateWithSchema(
    GuildSettingsSchema,
    (await getItem(DATABASE_KEYS.SETTINGS)) || {},
  );
  const settings = allSettings.valid ? (allSettings.data[interaction.guildId] || {}) : {};

  if (reset) {
    const updatedSettings = {
      ...(allSettings.valid ? allSettings.data : {}),
      [interaction.guildId]: { ...settings, welcomeMessage: undefined },
    };
    await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
    await interaction.reply(STATUS_MESSAGES.WELCOME_RESET);
    return;
  }

  if (message) {
    const validation = validateWithSchema(WelcomeMessageSchema, message);
    if (!validation.valid) {
      await interaction.reply(`Invalid message: ${validation.errors[0]?.message || "Validation failed"}`);
      return;
    }
    const updatedSettings = {
      ...(allSettings.valid ? allSettings.data : {}),
      [interaction.guildId]: { ...settings, welcomeMessage: message },
    };
    await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
    await interaction.reply(STATUS_MESSAGES.WELCOME_MESSAGE_SET);
  }
}

async function handleModLog(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: {
      ...(allSettings?.[interaction.guildId] || {}),
      modLogChannel: channel.id,
    },
  });
  await interaction.reply(`Moderation log channel set to ${channel.name}`);
}

async function handleLeaveChannel(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const channel = interaction.options.getChannel("channel") as GuildChannel;
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: {
      ...settings,
      leaveChannel: channel.id,
    },
  });
  await interaction.reply(
    STATUS_MESSAGES.LEAVE_CHANNEL_SET.replace("{channel}", channel.name),
  );
}

async function handleLeaveChannelRemove(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
    | Record<string, Record<string, unknown>>
    | undefined;
  const settings = allSettings?.[interaction.guildId] || {};
  settings.leaveChannel = undefined;
  await setItem(DATABASE_KEYS.SETTINGS, {
    ...allSettings,
    [interaction.guildId]: settings,
  });
  await interaction.reply(STATUS_MESSAGES.LEAVE_DISABLED);
}

async function handleLeaveMessage(
  interaction: ChatInputCommandInteraction,
  getItem: DbGetItem,
  setItem: DbSetItem,
) {
  const message = interaction.options.getString("message");
  const reset = interaction.options.getBoolean("reset");
  const allSettings = validateWithSchema(
    GuildSettingsSchema,
    (await getItem(DATABASE_KEYS.SETTINGS)) || {},
  );
  const settings = allSettings.valid ? (allSettings.data[interaction.guildId] || {}) : {};

  if (reset) {
    const updatedSettings = {
      ...(allSettings.valid ? allSettings.data : {}),
      [interaction.guildId]: { ...settings, leaveMessage: undefined },
    };
    await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
    await interaction.reply(STATUS_MESSAGES.LEAVE_RESET);
    return;
  }

  if (message) {
    const validation = validateWithSchema(WelcomeMessageSchema, message);
    if (!validation.valid) {
      await interaction.reply(`Invalid message: ${validation.errors[0]?.message || "Validation failed"}`);
      return;
    }
    const updatedSettings = {
      ...(allSettings.valid ? allSettings.data : {}),
      [interaction.guildId]: { ...settings, leaveMessage: message },
    };
    await setItem(DATABASE_KEYS.SETTINGS, updatedSettings);
    await interaction.reply(STATUS_MESSAGES.LEAVE_MESSAGE_SET);
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage bot settings")
    .setIntegrationTypes([
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    ])
    .setContexts([
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check-emoji")
        .setDescription("Toggle emojis in check command"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticket-category")
        .setDescription("Set ticket category")
        .addChannelOption((option) =>
          option
            .setName("category")
            .setDescription("Category for tickets")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("link-channel")
        .setDescription("Manage link channels")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Add a link channel")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel where links must be posted")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Remove a link channel")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel to remove")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("list").setDescription("List all link channels"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("boost-channel")
        .setDescription("Set the boost thank you channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel for boost thank you messages")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("min-age")
        .setDescription("Set minimum account age (days) to join")
        .addIntegerOption((option) =>
          option
            .setName("days")
            .setDescription("Minimum age in days (1-365, 0 to disable)")
            .setMinValue(0)
            .setMaxValue(365)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("trigger-words")
        .setDescription("Toggle trigger words feature"),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("welcome")
        .setDescription("Manage welcome messages")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set-channel")
            .setDescription(
              "Set welcome message channel (enables welcome messages)",
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel for welcome messages")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove-channel")
            .setDescription(
              "Remove welcome channel (disables welcome messages)",
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set-message")
            .setDescription("Set custom welcome message template")
            .addStringOption((option) =>
              option
                .setName("message")
                .setDescription(
                  "Message template ({member}, {server}, {count}, {tag})",
                ),
            )
            .addBooleanOption((option) =>
              option
                .setName("reset")
                .setDescription("Reset to default message"),
            ),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName("leave")
        .setDescription("Manage leave messages")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set-channel")
            .setDescription(
              "Set leave message channel (enables leave messages)",
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("Channel for leave messages")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove-channel")
            .setDescription("Remove leave channel (disables leave messages)"),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("set-message")
            .setDescription("Set custom leave message template")
            .addStringOption((option) =>
              option
                .setName("message")
                .setDescription("Message template ({member}, {server}, {tag})"),
            )
            .addBooleanOption((option) =>
              option
                .setName("reset")
                .setDescription("Reset to default message"),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mod-log")
        .setDescription("Set the moderation log channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel for moderation logs")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const { getItem, setItem } = container.get("db");

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();

    if (subcommand === "check-emoji") {
      await handleCheckEmoji(interaction, getItem, setItem);
      return;
    }

    if (
      !hasPermission(
        interaction.member as GuildMember,
        PermissionFlagsBits.Administrator,
      )
    ) {
      await interaction.reply(ERROR_MESSAGES.ADMIN_REQUIRED);
      return;
    }

    const subcommandHandlers: Record<
      string,
      Record<string, () => Promise<void>>
    > = {
      "link-channel": {
        add: () => handleLinkChannelAdd(interaction, getItem, setItem),
        remove: () => handleLinkChannelRemove(interaction, getItem, setItem),
        list: () => handleLinkChannelList(interaction, getItem),
      },
      welcome: {
        "set-channel": () =>
          handleWelcomeChannel(interaction, getItem, setItem),
        "remove-channel": () =>
          handleWelcomeChannelRemove(interaction, getItem, setItem),
        "set-message": () =>
          handleWelcomeMessage(interaction, getItem, setItem),
      },
      leave: {
        "set-channel": () => handleLeaveChannel(interaction, getItem, setItem),
        "remove-channel": () =>
          handleLeaveChannelRemove(interaction, getItem, setItem),
        "set-message": () => handleLeaveMessage(interaction, getItem, setItem),
      },
    };

    const groupHandler = subcommandGroup
      ? subcommandHandlers[subcommandGroup]?.[subcommand]
      : undefined;
    if (groupHandler) {
      await groupHandler();
      return;
    }

    const directHandlers: Record<string, () => Promise<void>> = {
      "ticket-category": () => handleTicketCategory(interaction, setItem),
      "boost-channel": () => handleBoostChannel(interaction, getItem, setItem),
      "min-age": () => handleMinAge(interaction, getItem, setItem),
      "trigger-words": () => handleTriggerWords(interaction, getItem, setItem),
      "mod-log": () => handleModLog(interaction, getItem, setItem),
    };

    const directHandler = directHandlers[subcommand];
    if (directHandler) {
      await directHandler();
    }
  },
};
