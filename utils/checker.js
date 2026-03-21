import { ROLES } from "./roles.js";

const BLOCKER_NAMES = {
	aristotle: "Aristotle",
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
	barracuda: "Barracuda",
	dnsfilter: "DNSFilter",
	sophos: "Sophos",
	qustodio: "Qustodio",
	nextdns: "NextDNS",
	pihole: "Pi-Hole",
	squid: "Squid",
	e2guardian: "E2Guardian",
	adguarddns: "Adguard DNS",
	opendns: "Open DNS",
};

const BLOCKER_EMOJIS = {
	aristotle: ":flying_disc:",
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
	barracuda: ":shark:",
	dnsfilter: ":satellite_orbital:",
	nextdns: ":track_next:",
	sophos: ":leopard:",
	qustodio: ":jigsaw:",
	pihole: ":pie:",
	squid: ":squid:",
	e2guardian: ":guard:",
	adguarddns: ":flag_ad:",
	opendns: ":open_file_folder:",
};
const API_URL = process.env.API_URL || "http://5.188.124.60:8000/api";

export const getBlockerRole = (blocker) => {
	return ROLES.BLOCKERS[blocker.toLowerCase()] || null;
};
export const getBlockerEmoji = (blocker) => {
	return BLOCKER_EMOJIS[blocker.toLowerCase()] || null;
};

export const getBlockerName = (blocker) => {
	return BLOCKER_NAMES[blocker.toLowerCase()] || blocker;
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
	const list = await fetch(
		`${API_URL}?link=${url}&blocker=${blockerFilter}`,
	).then((res) => res.json());

	for (let i = 0; i < list.length; i++) {
		const blocker = list[i].blocker.toLowerCase();
		results.push({
			blocker: blocker,
			emoji: BLOCKER_EMOJIS[blocker],
			category: list[i].category,
			name: BLOCKER_NAMES[blocker],
			blocked: list[i].blocked,
			roleId: ROLES.BLOCKERS[blocker],
		});
	}
	return results;
};
