import { Client, GatewayIntentBits } from "discord.js";
import { DATABASE_KEYS } from "./config/constants";
import { getItem, setItem } from "./db/index";
import { cache } from "./services/cache";
import "dotenv/config";

const clientId = process.env.clientId ?? "";
const clientSecret = process.env.clientSecret ?? "";
const redirectUri = process.env.redirectUri || "http://localhost:3000/callback";
const callbackUrl = redirectUri;
const tokenUrl = "https://discord.com/api/oauth2/token";
const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=identify%20guilds`;

const oauthClient = new Client({ intents: [GatewayIntentBits.Guilds] });

await oauthClient.login(process.env.token);

type Settings = Record<string, Record<string, unknown>>;

const loginHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Linky Settings</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1b1e; color: #fff; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .login-box { text-align: center; }
    h1 { font-size: 28px; margin-bottom: 15px; color: #5865f2; }
    p { color: #b5b7bb; margin-bottom: 20px; }
    a { background: #5865f2; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; display: inline-block; font-weight: 500; }
    a:hover { background: #4752c4; }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>⚙️ Linky Settings</h1>
    <p>Sign in with Discord to manage your server settings</p>
    <a href="${authorizeUrl}">Login with Discord</a>
  </div>
</body>
</html>`;

const serversHtml = (
  servers: Array<{ id: string; name: string; icon: string | null }>,
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Linky Settings</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1b1e; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 20px; color: #5865f2; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .logout { color: #b5b7bb; text-decoration: none; font-size: 14px; }
    .logout:hover { color: #fff; }
    .server { display: flex; align-items: center; gap: 15px; background: #2b2d31; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; }
    .server:hover { background: #35373c; }
    .server-icon { width: 48px; height: 48px; border-radius: 50%; background: #5865f2; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
    .server-name { font-size: 16px; font-weight: 500; }
    .empty { text-align: center; color: #b5b7bb; padding: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚙️ Your Servers</h1>
      <a href="/logout" class="logout">Logout</a>
    </div>
    ${
      servers.length === 0
        ? '<div class="empty">No servers found where you are admin and Linky is installed.</div>'
        : servers
            .map(
              (s) => `
        <div class="server" onclick="window.location.href='/settings/${s.id}'">
          <div class="server-icon">${s.icon ? `<img src="${s.icon}" style="width:48px;height:48px;border-radius:50%">` : s.name.charAt(0)}</div>
          <div class="server-name">${s.name}</div>
        </div>
      `,
            )
            .join("")
    }
  </div>
</body>
</html>`;

const guildSettingsHtml = (
  guildId: string,
  guildName: string,
  settings: Record<string, unknown>,
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${guildName} Settings</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1b1e; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 5px; color: #5865f2; }
    .subtitle { color: #b5b7bb; margin-bottom: 20px; font-size: 14px; }
    .back { color: #b5b7bb; text-decoration: none; font-size: 14px; margin-bottom: 20px; display: inline-block; }
    .back:hover { color: #fff; }
    .guild { background: #2b2d31; border-radius: 8px; padding: 20px; }
    .setting { margin-bottom: 15px; }
    .setting label { display: block; margin-bottom: 5px; font-size: 14px; color: #b5b7bb; }
    .setting input, .setting textarea { width: 100%; padding: 10px; background: #1a1b1e; border: 1px solid #3f4147; border-radius: 4px; color: #fff; font-size: 14px; }
    .setting textarea { min-height: 80px; resize: vertical; }
    .setting .checkbox { display: flex; align-items: center; gap: 10px; }
    .setting .checkbox input { width: auto; }
    button { background: #5865f2; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
    button:hover { background: #4752c4; }
    .save-btn { width: 100%; margin-top: 10px; }
    .status { padding: 10px; border-radius: 4px; margin-bottom: 15px; }
    .status.success { background: #235c4a; color: #8cf5b1; }
    .status.error { background: #593c2a; color: #ffdfba; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/servers" class="back">← Back to servers</a>
    <h1>${guildName}</h1>
    <div class="subtitle">Server Settings</div>
    <div id="status"></div>
    <div class="guild">
      <div class="setting">
        <label>Ticket Category Channel ID</label>
        <input type="text" name="ticketCategory" value="${settings.ticketCategory || ""}" placeholder="Channel ID">
      </div>
      <div class="setting">
        <label>Boost Thank You Channel ID</label>
        <input type="text" name="boostChannel" value="${settings.boostChannel || ""}" placeholder="Channel ID">
      </div>
      <div class="setting">
        <label>Min Account Age (days)</label>
        <input type="number" name="minAge" value="${settings.minAge || ""}" placeholder="0" min="0" max="365">
      </div>
      <div class="setting">
        <label>Welcome Channel ID</label>
        <input type="text" name="welcomeChannel" value="${settings.welcomeChannel || ""}" placeholder="Channel ID">
      </div>
      <div class="setting">
        <label>Welcome Message Template</label>
        <textarea name="welcomeMessage" placeholder="{member}, {server}, {count}, {tag}">${settings.welcomeMessage || ""}</textarea>
      </div>
      <div class="setting">
        <label>Moderation Log Channel ID</label>
        <input type="text" name="modLogChannel" value="${settings.modLogChannel || ""}" placeholder="Channel ID">
      </div>
      <div class="setting checkbox">
        <input type="checkbox" name="checkEmojis" id="checkEmojis" ${settings.checkEmojis !== false ? "checked" : ""}>
        <label for="checkEmojis">Check Emojis (show command)</label>
      </div>
      <div class="setting checkbox">
        <input type="checkbox" name="triggerWords" id="triggerWords" ${settings.triggerWords !== false ? "checked" : ""}>
        <label for="triggerWords">Enable Trigger Words</label>
      </div>
      <button class="save-btn" onclick="saveSettings('${guildId}')">Save Settings</button>
    </div>
  </div>
  <script>
    async function saveSettings(guildId) {
      const form = document.querySelector('.guild');
      const formData = new FormData(form);
      const settings = {
        ticketCategory: formData.get('ticketCategory') || null,
        boostChannel: formData.get('boostChannel') || null,
        minAge: formData.get('minAge') ? parseInt(formData.get('minAge')) : null,
        welcomeChannel: formData.get('welcomeChannel') || null,
        welcomeMessage: formData.get('welcomeMessage') || null,
        modLogChannel: formData.get('modLogChannel') || null,
        checkEmojis: formData.get('checkEmojis') === 'on',
        triggerWords: formData.get('triggerWords') === 'on',
      };

      const status = document.getElementById('status');
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guildId, settings })
        });
        const data = await res.json();
        if (data.success) {
          status.className = 'status success';
          status.textContent = 'Settings saved!';
        } else {
          status.className = 'status error';
          status.textContent = data.error || 'Error saving settings';
        }
      } catch {
        status.className = 'status error';
        status.textContent = 'Error saving settings';
      }
    }
  </script>
</body>
</html>`;

async function getSettings(guildId: string): Promise<Record<string, unknown>> {
  const all = (await getItem(DATABASE_KEYS.SETTINGS, cache)) as
    | Settings
    | undefined;
  return all?.[guildId] || {};
}

async function updateSettings(
  guildId: string,
  updates: Record<string, unknown>,
) {
  const all = (await getItem(DATABASE_KEYS.SETTINGS, cache)) as
    | Settings
    | undefined;
  const settings = { ...all?.[guildId], ...updates };
  await setItem(DATABASE_KEYS.SETTINGS, { ...all, [guildId]: settings }, cache);
}

interface OAuthToken {
  access_token: string;
  token_type: string;
}

async function getAccessToken(code: string): Promise<string> {
  if (!(clientId && clientSecret)) {
    throw new Error("OAuth not configured");
  }
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", callbackUrl);

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const token = (await res.json()) as OAuthToken;
  return token.access_token;
}

async function getUserGuilds(
  accessToken: string,
): Promise<Array<{ id: string; name: string; icon: string | null }>> {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (await res.json()) as Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;
}

function getSessionKey(accessToken: string): string {
  return Buffer.from(accessToken).toString("base64");
}

declare const Bun: {
  serve: (options: {
    port: number;
    fetch: (req: Request) => Promise<Response>;
  }) => { port: number };
};

const sessions = new Map<string, { accessToken: string; expires: number }>();

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, v] = c.trim().split("=");
        return [k, v];
      }),
    );

    const sessionToken = cookies.session;
    const session = sessionToken ? sessions.get(sessionToken) : null;
    const isAuthenticated = session && session.expires > Date.now();
    const accessToken = session?.accessToken;

    if (path === "/" || path === "/login") {
      if (isAuthenticated) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/servers" },
        });
      }
      return new Response(loginHtml(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (path === "/callback" && method === "GET") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("No code provided", { status: 400 });
      }

      const token = await getAccessToken(code);
      const sessionKey = getSessionKey(token);
      sessions.set(sessionKey, {
        accessToken: token,
        expires: Date.now() + 3600000,
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/servers",
          "Set-Cookie": `session=${sessionKey}; Path=/; HttpOnly; Max-Age=3600`,
        },
      });
    }

    if (path === "/logout") {
      const sessionKey = sessionToken || "";
      if (sessionKey) {
        sessions.delete(sessionKey);
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": "session=; Path=/; Max-Age=0",
        },
      });
    }

    if (!(isAuthenticated && accessToken)) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    if (path === "/servers" || path === "/servers/") {
      const userGuilds = await getUserGuilds(accessToken);
      const botGuilds = await oauthClient.guilds.fetch();
      const botGuildIds = new Set(botGuilds.map((g) => g.id));

      const servers = userGuilds
        .filter((g) => botGuildIds.has(g.id))
        .map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`
            : null,
        }));

      return new Response(serversHtml(servers), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const settingsMatch = path.match(/^\/settings\/(.+)$/);
    if (settingsMatch) {
      const guildId = settingsMatch[1];
      const guild = oauthClient.guilds.cache.get(guildId);
      const guildName = guild?.name || "Server";
      const settings = await getSettings(guildId);

      return new Response(guildSettingsHtml(guildId, guildName, settings), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (path === "/api/settings" && method === "POST") {
      try {
        const body = (await req.json()) as {
          guildId?: string;
          settings?: Record<string, unknown>;
        };
        const guildId = body?.guildId;
        const settings = body?.settings;
        if (!guildId) {
          return new Response(JSON.stringify({ error: "guildId required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        await updateSettings(guildId, settings || {});
        return new Response(JSON.stringify({ success: true }));
      } catch {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

// biome-ignore lint/suspicious/noConsole: Web server startup log
console.log(`Server running at http://localhost:${server.port}`);
