import { ROLES } from "./roles.js";

const NORMAL_BLOCKER_NAMES = {
  blocksi: "Blocksi",
  blocksi_ai: "Blocksi AI",
  cisco: "Cisco",
  contentkeeper: "ContentKeeper",
  deledao: "Deledao",
  fortiguard: "FortiGuard",
  goguardian: "GoGuardian",
  iboss: "iBoss",
  lanschool: "LanSchool",
  lightspeed: "LightSpeed",
  linewize: "Linewize",
  paloalto: "Palo Alto",
  securly: "Securly",
  senso: "Senso Cloud",
  gaggle: "Gaggle",
  sophos: "Sophos",
  qustodio: "Qustodio",
  smoothwall: "Smoothwall",
};

const NORMAL_BLOCKER_EMOJIS = {
  blocksi: ":bricks:",
  blocksi_ai: ":bricks:",
  cisco: ":cloud:",
  contentkeeper: ":broom:",
  deledao: ":smiling_imp:",
  fortiguard: ":shield:",
  goguardian: ":lock:",
  iboss: ":briefcase:",
  lanschool: ":school:",
  lightspeed: ":vertical_traffic_light:",
  linewize: ":globe_with_meridians:",
  paloalto: ":fire:",
  securly: ":atom:",
  senso: ":deciduous_tree:",
  gaggle: ":duck:",
  sophos: ":leopard:",
  qustodio: ":jigsaw:",
  smoothwall: ":rocket:",
};

const DNS_BLOCKER_NAMES = {
  adguarddns: "Adguard DNS",
  aristotle: "Aristotle",
  barracuda: "Barracuda",
  dnsfilter: "DNSFilter",
  e2guardian: "E2Guardian",
  nextdns: "NextDNS",
  opendns: "Open DNS",
  pihole: "Pi-Hole",
  squid: "Squid",
};

const DNS_BLOCKER_EMOJIS = {
  adguarddns: ":flag_ad:",
  barracuda: ":shark:",
  dnsfilter: ":satellite_orbital:",
  e2guardian: ":guard:",
  nextdns: ":track_next:",
  opendns: ":open_file_folder:",
  aristotle: ":flying_disc:",
  pihole: ":pie:",
  squid: ":squid:",
};

const ALL_BLOCKER_NAMES = { ...NORMAL_BLOCKER_NAMES, ...DNS_BLOCKER_NAMES };
const ALL_BLOCKER_EMOJIS = { ...NORMAL_BLOCKER_EMOJIS, ...DNS_BLOCKER_EMOJIS };

const API_URL = process.env.API_URL || "http://5.188.124.60:8000/api";

export const NORMAL_BLOCKERS = Object.keys(NORMAL_BLOCKER_NAMES);
export const DNS_BLOCKERS = Object.keys(DNS_BLOCKER_NAMES);
export const ALL_BLOCKERS = Object.keys(ALL_BLOCKER_NAMES);

export const getNormalBlockers = () => NORMAL_BLOCKERS;
export const getDnsBlockers = () => DNS_BLOCKERS;

export const getBlockerRole = (blocker) => {
  return ROLES.BLOCKERS[blocker.toLowerCase()] || null;
};
export const getBlockerEmoji = (blocker) => {
  return ALL_BLOCKER_EMOJIS[blocker.toLowerCase()] || null;
};

export const getBlockerName = (blocker) => {
  return ALL_BLOCKER_NAMES[blocker.toLowerCase()] || blocker;
};

export const getAllBlockers = () => {
  return Object.keys(ROLES.BLOCKERS);
};

export const check = async (url, blockerFilter = "all") => {
  let unblocked_roles = [];
  let unblocked = [];
  const list = await fetch(
    `${API_URL}?link=${url}&blocker=${blockerFilter}`,
  ).then((res) => res.json());

  for (let i = 0; i < list.length; i++) {
    if (list[i].blocked == false) {
      const blocker = list[i].blocker.toLowerCase();
      unblocked.push(getBlockerName(blocker));
      const roleId = ROLES.BLOCKERS[blocker];
      if (roleId) {
        unblocked_roles.push(`<@&${roleId}>`);
      }
    }
  }
  return { unblocked, unblocked_roles };
};

export const checkWithDetails = async (url, blockerFilter = "all") => {
  const results = [];
  const filter = blockerFilter.toLowerCase();

  let typeFilter = null;

  if (filter === "dns") {
    typeFilter = DNS_BLOCKERS;
  } else if (filter === "non_dns") {
    typeFilter = NORMAL_BLOCKERS;
  } else if (ALL_BLOCKERS.includes(filter)) {
    typeFilter = [filter];
  }

  const list = await fetch(`${API_URL}?link=${url}&blocker=all`).then((res) =>
    res.json(),
  );

  for (let i = 0; i < list.length; i++) {
    const blocker = list[i].blocker.toLowerCase();

    if (typeFilter && !typeFilter.includes(blocker)) {
      continue;
    }

    results.push({
      blocker: blocker,
      emoji: ALL_BLOCKER_EMOJIS[blocker],
      category: list[i].category,
      name: ALL_BLOCKER_NAMES[blocker],
      blocked: list[i].blocked,
      roleId: ROLES.BLOCKERS[blocker],
    });
  }
  return results;
};
