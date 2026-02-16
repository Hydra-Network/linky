export const filterURL = async (url) => {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : "https://" + url);
    const hostname = urlObj.hostname.replace(/^www\./, "");
    const parts = hostname.split(".");

    if (parts.length < 2) return hostname;

    const twoLevelTLDs = [
      "co.uk",
      "com.au",
      "co.jp",
      "com.br",
      "co.za",
      "com.cn",
      "co.in",
    ];
    const lastTwo = parts.slice(-2).join(".");

    return twoLevelTLDs.includes(lastTwo) && parts.length >= 3
      ? parts.slice(-3).join(".")
      : lastTwo;
  } catch {
    return null;
  }
};
//ty claude :heart:
