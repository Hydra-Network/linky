import { ROLES } from "@/config/roles.js";
import { RequestQueue } from "@/services/request-queue.js";

const NORMAL_BLOCKER_NAMES: Record<string, string> = {
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

const NORMAL_BLOCKER_EMOJIS: Record<string, string> = {
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

const DNS_BLOCKER_NAMES: Record<string, string> = {
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

const DNS_BLOCKER_EMOJIS: Record<string, string> = {
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

const queue = new RequestQueue<
	Array<{ blocked: boolean; blocker: string; category: string }>
>(1000, 3, 1000);

export const NORMAL_BLOCKERS = Object.keys(NORMAL_BLOCKER_NAMES);
export const DNS_BLOCKERS = Object.keys(DNS_BLOCKER_NAMES);
export const ALL_BLOCKERS = Object.keys(ALL_BLOCKER_NAMES);

export const getNormalBlockers = () => NORMAL_BLOCKERS;
export const getDnsBlockers = () => DNS_BLOCKERS;

export const getBlockerRole = (blocker: string) => {
	return (
		ROLES.BLOCKERS[blocker.toLowerCase() as keyof typeof ROLES.BLOCKERS] || null
	);
};

export const getBlockerEmoji = (blocker: string) => {
	return ALL_BLOCKER_EMOJIS[blocker.toLowerCase()] || null;
};

export const getBlockerName = (blocker: string) => {
	return ALL_BLOCKER_NAMES[blocker.toLowerCase()] || blocker;
};

export const getAllBlockers = () => {
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
	const timeout = setTimeout(() => controller.abort(), 15000);
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
): Promise<CheckResult> => {
	const unblockedRoles: string[] = [];
	const unblocked: string[] = [];

	const list = await queue.enqueue(() => fetchApi(url, blockerFilter));

	for (let i = 0; i < list.length; i++) {
		if (list[i].blocked === false) {
			const blocker = list[i].blocker.toLowerCase();
			unblocked.push(getBlockerName(blocker));
			const roleId = ROLES.BLOCKERS[blocker as keyof typeof ROLES.BLOCKERS];
			if (roleId) {
				unblockedRoles.push(`<@&${roleId}>`);
			}
		}
	}
	return { unblocked, unblocked_roles: unblockedRoles };
};

export const checkWithDetails = async (
	url: string,
	blockerFilter = "all",
): Promise<BlockerDetail[]> => {
	const results: BlockerDetail[] = [];
	const filter = blockerFilter.toLowerCase();

	let typeFilter: string[] | null = null;

	if (filter === "dns") {
		typeFilter = DNS_BLOCKERS;
	} else if (filter === "non_dns") {
		typeFilter = NORMAL_BLOCKERS;
	} else if (ALL_BLOCKERS.includes(filter)) {
		typeFilter = [filter];
	}

	const list = await queue.enqueue(() => fetchApi(url, "all"));

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
			roleId: ROLES.BLOCKERS[blocker as keyof typeof ROLES.BLOCKERS],
		});
	}
	return results;
};
