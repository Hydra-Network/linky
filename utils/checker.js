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
};
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
	let unblocked = [];
	const list = await fetch(
		`http://5.188.124.60:8000/api?link=${url}&blocker=${blockerFilter}`,
	).then((res) => res.json());

	for (let i = 0; i < list.length; i++) {
		if (list[i].blocked == false) {
			const blocker = list[i].blocker.toLowerCase();
			const roleId = ROLES.BLOCKERS[blocker];
			if (roleId) {
				unblocked.push(`<@&${roleId}>`);
			}
		}
	}
	return unblocked;
};

export const checkWithDetails = async (url, blockerFilter = "all") => {
	const results = [];
	const list = await fetch(
		`http://5.188.124.60:8000/api?link=${url}&blocker=${blockerFilter}`,
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
