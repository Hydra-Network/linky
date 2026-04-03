import type {
  GuildMember,
  PermissionResolvable,
  PermissionsBitField,
} from "discord.js";
import { ROLES } from "@/config/roles.js";

export interface PermissionCheckResult {
  ok: boolean;
  reason?: string;
}

export interface HierarchyCheckOptions {
  botMember: GuildMember;
  targetMember: GuildMember;
  executingMember: GuildMember;
  guildOwnerId: string;
  action: string;
}

export interface HierarchyCheckResult {
  ok: boolean;
  reason?: string;
  targetAboveBot: boolean;
  targetAboveExecutor: boolean;
  executorIsOwner: boolean;
}

export const hasPermission = (
  member: GuildMember,
  permission: PermissionResolvable,
): boolean => {
  return member.permissions.has(permission);
};

export const hasAnyPermission = (
  member: GuildMember,
  permissions: PermissionResolvable[],
): boolean => {
  return permissions.some((perm) => member.permissions.has(perm));
};

export const hasAllPermissions = (
  member: GuildMember,
  permissions: PermissionResolvable[],
): boolean => {
  return permissions.every((perm) => member.permissions.has(perm));
};

export const memberHasPermission = (
  memberPermissions: Readonly<bigint>,
  permission: PermissionResolvable,
): boolean => {
  return (memberPermissions & BigInt(permission as bigint)) !== 0n;
};

export const checkUserAndBotPermissions = (
  userPermissions: Readonly<PermissionsBitField>,
  botPermissions: Readonly<PermissionsBitField>,
  permission: PermissionResolvable,
): PermissionCheckResult => {
  const userHas = userPermissions.has(permission);
  const botHas = botPermissions.has(permission);

  if (!userHas && !botHas) {
    return {
      ok: false,
      reason: "Both you and the bot need the required permission.",
    };
  }

  if (!userHas) {
    return {
      ok: false,
      reason: "You do not have the required permission.",
    };
  }

  if (!botHas) {
    return {
      ok: false,
      reason: "The bot does not have the required permission.",
    };
  }

  return { ok: true };
};

export const checkRoleHierarchy = (
  options: HierarchyCheckOptions,
): HierarchyCheckResult => {
  const { botMember, targetMember, executingMember, guildOwnerId, action } =
    options;

  const targetHighest = targetMember.roles.highest.position;
  const botHighest = botMember.roles.highest.position;
  const executorHighest = executingMember.roles.highest.position;
  const executorIsOwner = executingMember.id === guildOwnerId;

  const targetAboveBot = targetHighest >= botHighest;
  const targetAboveExecutor = targetHighest >= executorHighest;

  if (targetAboveBot) {
    return {
      ok: false,
      reason: `Cannot ${action} a member with a role equal to or higher than the bot's highest role.`,
      targetAboveBot: true,
      targetAboveExecutor: false,
      executorIsOwner,
    };
  }

  if (targetAboveExecutor && !executorIsOwner) {
    return {
      ok: false,
      reason: `Cannot ${action} a member with a role equal to or higher than your highest role.`,
      targetAboveBot: false,
      targetAboveExecutor: true,
      executorIsOwner,
    };
  }

  return {
    ok: true,
    targetAboveBot: false,
    targetAboveExecutor: false,
    executorIsOwner,
  };
};

export const isGuildOwner = (
  member: GuildMember,
  guildOwnerId: string,
): boolean => {
  return member.id === guildOwnerId;
};

export const hasRole = (member: GuildMember, roleId: string): boolean => {
  return member.roles.cache.has(roleId);
};

export const hasAnyRole = (member: GuildMember, roleIds: string[]): boolean => {
  return roleIds.some((id) => member.roles.cache.has(id));
};

export const hasAllRoles = (
  member: GuildMember,
  roleIds: string[],
): boolean => {
  return roleIds.every((id) => member.roles.cache.has(id));
};

export const hasHigherRoleThan = (
  member: GuildMember,
  targetMember: GuildMember,
): boolean => {
  return member.roles.highest.position > targetMember.roles.highest.position;
};

export const getHighestRolePosition = (member: GuildMember): number => {
  return member.roles.highest.position;
};

export const memberHasRoleFromConfig = (
  member: GuildMember,
  roleKey: keyof typeof ROLES,
): boolean => {
  const roleId = ROLES[roleKey];
  if (typeof roleId === "string") {
    return hasRole(member, roleId);
  }
  return false;
};

export const canBypassHierarchy = (
  member: GuildMember,
  guildOwnerId: string,
): boolean => {
  return isGuildOwner(member, guildOwnerId);
};
