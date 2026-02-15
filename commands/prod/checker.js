export const check = async (url) => {
		let unblocked = [];
		const list = await fetch(
			`http://40.160.3.200:8000/api?link=${url}&blocker=all`,
		).then(res => res.json());
		for (let i = 0; i < list.length; i++) {
			if (list[i].blocked == false) {
				if (list[i].blocker == "aristotle") {
					unblocked.push("<@&1469494085327786024>");
				} else if (list[i].blocker == "blocksi") {
					unblocked.push("<@&1434414053450715176>");
				} else if (list[i].blocker == "cisco") {
					unblocked.push("<@&1434414716712783953>");
				} else if (list[i].blocker == "contentkeeper") {
					unblocked.push("<@&1434414349828751511>");
				} else if (list[i].blocker == "deledao") {
					unblocked.push("<@&1454329323220897977>");
				} else if (list[i].blocker == "fortiguard") {
					unblocked.push("<@&1434414122820436078>");
				} else if (list[i].blocker == "goguardian") {
					unblocked.push("<@&1434413934885994559>");
				} else if (list[i].blocker == "iboss") {
					unblocked.push("<@&1434414803387941037>");
				} else if (list[i].blocker == "lanschool") {
					unblocked.push("<@&1434414206452065310>");
				} else if (list[i].blocker == "lightspeed") {
					unblocked.push("<@&1434413800794230865>");
				} else if (list[i].blocker == "linewize") {
					unblocked.push("<@&1434421092042276934>");
				} else if (list[i].blocker == "paloalto") {
					unblocked.push("<@&1434414644428148746>");
				} else if (list[i].blocker == "securly") {
					unblocked.push("<@&1434414200951804036>");
				} else if (list[i].blocker == "senso") {
					unblocked.push("<@&1469459031780229172>");
				} else {
				}
			}
		}
		return unblocked;
	};
