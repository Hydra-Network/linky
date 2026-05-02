import { ROLES } from "@/config/roles.js";
import { RequestQueue } from "@/services/request-queue.js";

export const BLOCKER_NAMES: Record<string, string> = {
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
  aristotle: "Aristotle",
  qustodio: "Qustodio",
  barracuda: "Barracuda",
  dnsfilter: "DNSFilter",
  smoothwall: "Smoothwall",
};

export const BLOCKER_EMOJIS: Record<string, string> = {
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
  dnsfilter: ":satellite_orbital:",
  paloalto: ":fire:",
  securly: ":atom:",
  senso: ":deciduous_tree:",
  aristotle: ":flying_disc:",
  gaggle: ":duck:",
  barracuda: ":shark:",
  sophos: ":leopard:",
  qustodio: ":jigsaw:",
  smoothwall: ":rocket:",
};

const API_URL = process.env.API_URL || "http://5.188.124.60:8000/api";

const queue = new RequestQueue<
  Array<{ blocked: boolean; blocker: string; category: string }>
>(1000, 3, 1000);

export const getBlockerName = (blocker: string) => {
  return BLOCKER_NAMES[blocker.toLowerCase()] || blocker;
};

export const getBlockers = () => {
  return Object.keys(ROLES.BLOCKERS);
};

export interface CheckResult {
  unblocked: string[];
  unblocked_roles: string[];
}

export interface BlockerDetail {
  blocker: string;
  emoji: string | undefined;
  category: string;
  name: string;
  blocked: boolean;
  roleId: string | undefined;
}

const fetchApi = async (url: string, blockerFilter: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  try {
    const res = await fetch(`${API_URL}?link=${url}&blocker=${blockerFilter}`, {
      signal: controller.signal,
    });
    return (await res.json()) as Array<{
      blocked: boolean;
      blocker: string;
      category: string;
    }>;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Request timed out. Please try again later.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

export const check = async (
  url: string,
  blockerFilter = "all",
): Promise<BlockerDetail[]> => {
  const results: BlockerDetail[] = [];
  const filter = blockerFilter.toLowerCase();

  const list = await queue.enqueue(() => fetchApi(url, filter));

  for (let i = 0; i < list.length; i += 1) {
    const blocker = list[i].blocker.toLowerCase();

    results.push({
      blocker: blocker,
      emoji: BLOCKER_EMOJIS[blocker],
      category: list[i].category,
      name: BLOCKER_NAMES[blocker],
      blocked: list[i].blocked,
      roleId: ROLES.BLOCKERS[blocker as keyof typeof ROLES.BLOCKERS],
    });
  }
  return results;
};
