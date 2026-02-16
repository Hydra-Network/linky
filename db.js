import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "data/database.json");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
	fs.writeFileSync(dbPath, JSON.stringify({ links: [] }, null, 2));
}

export const addLink = (url, site, userId, blocker) => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));

	data.links.push({
		url,
		site,
		userId,
		timestamp: new Date().toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		blocker,
	});

	fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const getLinks = () => {
	const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
	return data.links;
};

export const clear = () => {
	if (!fs.existsSync(dbPath)) {
		fs.rmdirSync(dbPath, { recursive: true });
	}
}
