export const ERROR_MESSAGES = {
  NO_PERMISSION: "You don't have permission.",
  ADMIN_REQUIRED: "You need Administrator permission.",
  MANAGE_MESSAGES_REQUIRED: "You need Manage Messages permission.",
  BAN_PERMISSION: "You or I don't have permission to ban members.",
  KICK_PERMISSION: "You or I don't have permission to kick members.",
  MODERATE_PERMISSION: "You or I don't have permission to moderate members.",
  UNBAN_PERMISSION: "You or I don't have permission to unban members.",
  CHANNEL_PERMISSION:
    "I don't have permission to manage messages in this channel.",
  PURGE_ERROR:
    "There was an error while trying to purge messages. Make sure I have permissions to manage messages.",
  GUILD_ONLY: "This command can only be used in a server.",
  NO_REASON_PROVIDED: "No reason provided",
  HIERARCHY_BOT:
    "I cannot {action} this member due to role hierarchy restrictions.",
  HIERARCHY_USER:
    "You cannot {action} this member due to role hierarchy restrictions.",
  VALID_MEMBER: "Please mention a valid member to {action}.",
  NOT_IN_SERVER: "That member is not in this server.",
  ACTION_ERROR: "There was an error while trying to {action} this member.",
  ACTION_SUCCESS: "Successfully {action} {target}. Reason: {reason}",
  TICKET_ONLY_IN_CHANNEL: "This command can only be used in a ticket channel.",
} as const;

export const STATUS_MESSAGES = {
  TICKET_CREATED: "Ticket created successfully!",
  TICKET_CLOSED: "Ticket closed.",
  TICKET_ONLY_IN_CHANNEL: "This command can only be used in a ticket channel.",
  STICKY_SET: "Sticky message set!",
  STICKY_REMOVED: "Sticky message removed.",
  STICKY_NO_MESSAGE: "There is no sticky message in this channel.",
  HONEYPOT_SET: "Honeypot channel has been set to {channel}.",
  HONEYPOT_REMOVED: "Honeypot channel has been removed.",
  HONEYPOT_NO_CHANNEL: "No honeypot channel is currently set.",
  HONEYPOT_STATUS: "Honeypot channel: {channel}",
  LOCKED: "Channel has been locked.",
  UNLOCKED: "Channel has been unlocked.",
  NO_RESULTS: "No results returned.",
  NONE: "None",
  CLOSED: "Channel closed by {user}. Reason: {reason}",
} as const;

export const CHANNEL_PATTERNS = {
  TICKET: "ticket-",
} as const;

export const DATABASE_KEYS = {
  LINKS: "links",
  STICKY: "sticky",
  SETTINGS: "settings",
  TICKETS: "tickets",
  AUTOMOD_WORDS: "automodWords",
  LINK_CHANNELS: "linkChannels",
  TICKET_CATEGORY: "ticketCategory",
  AFK: "afk",
  HONEYPOT_CHANNEL: "honeypotChannel",
  MIN_AGE: "minAge",
  TRIGGER_WORDS: "triggerWords",
} as const;

export const LINKY_ID = "1469170337810743478" as const;

export const MIN_AGE_ERRORS = {
  ACCOUNT_TOO_NEW:
    "Your Discord account is too new. You must wait until your account is at least {minAge} days old before joining this server.",
  NO_MIN_AGE_SET: "No minimum account age is currently set for this server.",
  MIN_AGE_SET: "Minimum account age set to {minAge} days.",
  MIN_AGE_REMOVED: "Minimum account age has been removed.",
  INVALID_MIN_AGE: "Please provide a valid minimum age in days (1-365).",
} as const;
