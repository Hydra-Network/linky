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
} from "@/config/index.js";
import type { AppContainer } from "@/services/container.js";
import { hasPermission } from "@/utils/permissions.js";

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
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    container: AppContainer,
  ) {
    const { getItem, setItem } = container.get("db");

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();

    if (subcommand === "check-emoji") {
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
      const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
        | Record<string, Record<string, unknown>>
        | undefined;
      const settings = allSettings?.[interaction.guildId] || {};
      const currentValue =
        (settings as Record<string, unknown>).checkEmojis !== false;
      await setItem(DATABASE_KEYS.SETTINGS, {
        ...allSettings,
        [interaction.guildId]: { ...settings, checkEmojis: !currentValue },
      });
      await interaction.reply(
        `Check emojis ${!currentValue ? "enabled" : "disabled"} for this server`,
      );
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

    if (subcommand === "ticket-category") {
      const category = interaction.options.getChannel(
        "category",
      ) as GuildChannel;
      await setItem(DATABASE_KEYS.TICKET_CATEGORY, category.id);
      await interaction.reply(`Ticket category set to ${category.name}`);
      return;
    }

    if (subcommandGroup === "link-channel") {
      if (subcommand === "add") {
        const channel = interaction.options.getChannel(
          "channel",
        ) as GuildChannel;
        const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
          | Record<string, string[]>
          | undefined;
        const channels = linkChannels?.[interaction.guildId] || [];
        await setItem(DATABASE_KEYS.LINK_CHANNELS, {
          ...linkChannels,
          [interaction.guildId]: [...channels, channel.id],
        });
        await interaction.reply(`Link channel added: ${channel.name}`);
        return;
      }

      if (subcommand === "remove") {
        const channel = interaction.options.getChannel(
          "channel",
        ) as GuildChannel;
        const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
          | Record<string, string[]>
          | undefined;
        const channels = linkChannels?.[interaction.guildId] || [];
        const index = channels.indexOf(channel.id);
        if (index === -1) {
          await interaction.reply(
            `Channel ${channel.name} is not a link channel`,
          );
        } else {
          await setItem(DATABASE_KEYS.LINK_CHANNELS, {
            ...linkChannels,
            [interaction.guildId]: channels.filter((c) => c !== channel.id),
          });
          await interaction.reply(`Link channel removed: ${channel.name}`);
        }
        return;
      }

      if (subcommand === "list") {
        const linkChannels = (await getItem(DATABASE_KEYS.LINK_CHANNELS)) as
          | Record<string, string[]>
          | undefined;
        const channels = linkChannels?.[interaction.guildId] || [];
        if (channels.length === 0) {
          await interaction.reply("No link channels set");
        } else {
          await interaction.reply(`Link channels: ${channels.join(", ")}`);
        }
        return;
      }
    }

    if (subcommand === "boost-channel") {
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
      return;
    }

    if (subcommand === "min-age") {
      const days = interaction.options.getInteger("days");
      const allSettings = (await getItem(DATABASE_KEYS.SETTINGS)) as
        | Record<string, Record<string, unknown>>
        | undefined;
      const settings: Record<string, unknown> =
        allSettings?.[interaction.guildId] || {};

      if (days === null || days === undefined) {
        const currentAge = settings.minAge as number | undefined;
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
        settings.minAge = undefined;
        await setItem(DATABASE_KEYS.SETTINGS, {
          ...allSettings,
          [interaction.guildId]: settings,
        });
        await interaction.reply(MIN_AGE_ERRORS.MIN_AGE_REMOVED);
        return;
      }

      await setItem(DATABASE_KEYS.SETTINGS, {
        ...allSettings,
        [interaction.guildId]: { ...settings, minAge: days },
      });
      await interaction.reply(
        MIN_AGE_ERRORS.MIN_AGE_SET.replace("{minAge}", String(days)),
      );
    }
  },
};
