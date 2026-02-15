const BLOCKERS = {
	aristotle: "1469494085327786024",
	blocksi: "1434414053450715176",
	blocksi_ai: "1434414053450715176",
	cisco: "1434414716712783953",
	contentkeeper: "1434414349828751511",
	deledao: "1454329323220897977",
	fortiguard: "1434414122820436078",
	goguardian: "1434413934885994559",
	iboss: "1434414803387941037",
	lanschool: "1434414206452065310",
	lightspeed: "1434413800794230865",
	linewize: "1434421092042276934",
	paloalto: "1434414644428148746",
	securly: "1434414200951804036",
	senso: "1469459031780229172",
};

const BLOCKER_NAMES = {
	aristotle: "Aristotle",
	blocksi: "BlockSI",
	blocksi_ai: "BlockSI AI",
	cisco: "Cisco",
	contentkeeper: "ContentKeeper",
	deledao: "DeLedao",
	fortiguard: "FortiGuard",
	goguardian: "GoGuardian",
	iboss: "iBoss",
	lanschool: "LANSchool",
	lightspeed: "LightSpeed",
	linewize: "Linewize",
	paloalto: "Palo Alto",
	securly: "Securly",
	senso: "Senso Cloud",
};

export const getBlockerRole = (blocker) => {
	return BLOCKERS[blocker.toLowerCase()] || null;
};

export const getBlockerName = (blocker) => {
	return BLOCKER_NAMES[blocker.toLowerCase()] || blocker;
};

export const getAllBlockers = () => {
	return Object.keys(BLOCKERS);
};

export const check = async (url, blockerFilter = "all") => {
	let unblocked = [];
	const list = await fetch(
		`http://40.160.3.200:8000/api?link=${url}&blocker=${blockerFilter}`,
	).then((res) => res.json());

	for (let i = 0; i < list.length; i++) {
		if (list[i].blocked == false) {
			const blocker = list[i].blocker.toLowerCase();
			const roleId = BLOCKERS[blocker];
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
		`http://40.160.3.200:8000/api?link=${url}&blocker=${blockerFilter}`,
	).then((res) => res.json());

	for (let i = 0; i < list.length; i++) {
		const blocker = list[i].blocker.toLowerCase();
		results.push({
			blocker: blocker,
			name: BLOCKER_NAMES[blocker] || blocker,
			blocked: list[i].blocked,
			roleId: BLOCKERS[blocker] || null,
		});
	}
	return results;
};
