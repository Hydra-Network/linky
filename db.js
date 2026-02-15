const fs = require("fs");
const path = require("path");
const db = path.join(__dirname, "data/database.json");

if (!fs.existsSync(db)) {
  fs.writeFileSync(db, JSON.stringify({ links: [] }, null, 2));
}

module.exports = {
  addLink: (url, site, userId, blocker) => {
    const data = JSON.parse(fs.readFileSync(db, "utf8"));

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

    fs.writeFileSync(db, JSON.stringify(data, null, 2));
  },

  getLinks: () => {
    const data = JSON.parse(fs.readFileSync(db, "utf8"));
    return data.links;
  },
};
