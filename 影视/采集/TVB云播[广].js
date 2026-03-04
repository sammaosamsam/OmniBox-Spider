// @name TVB云播[广]
/**
 * OmniBox 爬虫脚本 - TVB云播[广]
 *
 * 说明：
 * 1. 本脚本由 `本地调试/TVB云播.js` 转换为 OmniBox 标准接口结构。
 * 2. 实现接口：`home` / `category` / `search` / `detail` / `play`。
 * 3. 详情接口将旧式 `vod_play_from + vod_play_url` 转换为 `vod_play_sources`。
 * 4. 参考 `影视/采集/热播.js` 增加弹幕匹配能力（`DANMU_API`）。
 *
 * 环境变量：
 * - `TVBYB_HOST`：站点地址，默认 `http://www.viptv01.com`
 * - `DANMU_API`：弹幕服务地址（可选）
 */

const axios = require("axios");
const http = require("http");
const https = require("https");
const cheerio = require("cheerio");
const OmniBox = require("omnibox_sdk");

// ==================== 配置区域 ====================
const HOST = process.env.TVBYB_HOST || "http://www.viptv01.com";
const DANMU_API = process.env.DANMU_API || "";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
  "User-Agent": UA,
  Referer: `${HOST}/`,
};

const axiosInstance = axios.create({
  timeout: 30 * 1000,
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
  httpAgent: new http.Agent({ keepAlive: true }),
});

// ==================== 日志工具 ====================
function logInfo(message, data = null) {
  const output = data ? `${message}: ${JSON.stringify(data)}` : message;
  OmniBox.log("info", `[TVB云播] ${output}`);
}

function logError(message, error) {
  OmniBox.log("error", `[TVB云播] ${message}: ${error?.message || error}`);
}

// ==================== 通用工具 ====================
function e64(text) {
  try {
    return Buffer.from(String(text || ""), "utf8").toString("base64");
  } catch {
    return "";
  }
}

function d64(text) {
  try {
    return Buffer.from(String(text || ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function toAbsUrl(pathOrUrl) {
  const v = String(pathOrUrl || "");
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `${HOST}${v.startsWith("/") ? "" : "/"}${v}`;
}

function parsePlayJsonFromHtml(html) {
  const text = String(html || "");
  const regs = [
    /r\s*player_.*?=\s*(\{[\s\S]*?\})\s*</,
    /player_\w+\s*=\s*(\{[\s\S]*?\})\s*;\s*</,
    /player_\w+\s*=\s*(\{[\s\S]*?\})\s*$/,
  ];

  for (const reg of regs) {
    const m = text.match(reg);
    if (!m || !m[1]) continue;
    try {
      return JSON.parse(String(m[1]).trim());
    } catch {
      // ignore and try next
    }
  }

  return null;
}

// ==================== 弹幕工具 ====================
function preprocessTitle(title) {
  if (!title) return "";
  return title
    .replace(/4[kK]|[xX]26[45]|720[pP]|1080[pP]|2160[pP]/g, " ")
    .replace(/[hH]\. ?26[45]/g, " ")
    .replace(/BluRay|WEB-DL|HDR|REMUX/gi, " ")
    .replace(/\.mp4|\.mkv|\.avi|\.flv/gi, " ");
}

function chineseToArabic(cn) {
  const map = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (!isNaN(cn)) return parseInt(cn, 10);
  if (cn.length === 1) return map[cn] || cn;
  if (cn.length === 2) {
    if (cn[0] === "十") return 10 + map[cn[1]];
    if (cn[1] === "十") return map[cn[0]] * 10;
  }
  if (cn.length === 3) return map[cn[0]] * 10 + map[cn[2]];
  return cn;
}

function extractEpisode(title) {
  if (!title) return "";
  const processedTitle = preprocessTitle(title).trim();

  const cnMatch = processedTitle.match(/第\s*([零一二三四五六七八九十0-9]+)\s*[集话章节回期]/);
  if (cnMatch) return String(chineseToArabic(cnMatch[1]));

  const seMatch = processedTitle.match(/[Ss](?:\d{1,2})?[-._\s]*[Ee](\d{1,3})/i);
  if (seMatch) return seMatch[1];

  const epMatch = processedTitle.match(/\b(?:EP|E)[-._\s]*(\d{1,3})\b/i);
  if (epMatch) return epMatch[1];

  return "";
}

function buildFileNameForDanmu(vodName, episodeTitle) {
  if (!vodName) return "";
  if (!episodeTitle || episodeTitle === "正片" || episodeTitle === "播放") return vodName;

  const digits = extractEpisode(episodeTitle);
  if (digits) {
    const epNum = parseInt(digits, 10);
    if (epNum > 0) {
      if (epNum < 10) return `${vodName} S01E0${epNum}`;
      return `${vodName} S01E${epNum}`;
    }
  }
  return vodName;
}

async function matchDanmu(fileName) {
  if (!DANMU_API || !fileName) return [];

  try {
    const matchUrl = `${DANMU_API}/api/v2/match`;
    const response = await OmniBox.request(matchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({ fileName }),
    });

    if (response.statusCode !== 200) return [];

    const matchData = JSON.parse(response.body);
    if (!matchData.isMatched) return [];

    const matches = matchData.matches || [];
    if (matches.length === 0) return [];

    const firstMatch = matches[0];
    const episodeId = firstMatch.episodeId;
    const animeTitle = firstMatch.animeTitle || "";
    const episodeTitle = firstMatch.episodeTitle || "";
    if (!episodeId) return [];

    let danmakuName = "弹幕";
    if (animeTitle && episodeTitle) {
      danmakuName = `${animeTitle} - ${episodeTitle}`;
    } else if (animeTitle) {
      danmakuName = animeTitle;
    } else if (episodeTitle) {
      danmakuName = episodeTitle;
    }

    return [{
      name: danmakuName,
      url: `${DANMU_API}/api/v2/comment/${episodeId}?format=xml`,
    }];
  } catch (error) {
    logInfo(`弹幕匹配失败: ${error.message}`);
    return [];
  }
}

// ==================== 业务工具 ====================
function getClasses() {
  return [
    { type_id: "1", type_name: "电影" },
    { type_id: "2", type_name: "电视剧" },
    { type_id: "3", type_name: "综艺" },
    { type_id: "4", type_name: "动漫" },
    { type_id: "16", type_name: "日韩剧" },
    { type_id: "13", type_name: "国产剧" },
    { type_id: "15", type_name: "欧美剧" },
    { type_id: "14", type_name: "港台剧" },
  ];
}

function parseListHtml(html) {
  const $ = cheerio.load(html || "");
  const list = [];

  $(".myui-vodlist__box").each((_, element) => {
    const $el = $(element);
    const $a = $el.find("a.myui-vodlist__thumb").first();
    const href = $a.attr("href") || "";
    if (!href) return;

    list.push({
      vod_id: href,
      vod_name: $a.attr("title") || "",
      vod_pic: $a.attr("data-original") || "",
      vod_remarks: $el.find(".tag").text().trim() || "",
    });
  });

  return list;
}

async function getCategoryList(tid, pg = 1) {
  try {
    const url = `${HOST}/vod/show/id/${tid}/page/${pg}.html`;
    const response = await axiosInstance.get(url, { headers: { ...DEFAULT_HEADERS } });
    const list = parseListHtml(response.data);

    return {
      list,
      page: Number(pg),
      pagecount: 999,
      limit: 20,
      total: 999999,
    };
  } catch (error) {
    logError("获取分类失败", error);
    return { list: [], page: Number(pg), pagecount: 0, limit: 0, total: 0 };
  }
}

function convertPlayToSources(vodPlayFrom, vodPlayUrl, vodName = "") {
  const playSources = [];
  const froms = String(vodPlayFrom || "").split("$$$");
  const urls = String(vodPlayUrl || "").split("$$$");

  for (let i = 0; i < froms.length; i++) {
    const sourceName = froms[i] || `线路${i + 1}`;
    const sourceItems = urls[i] ? urls[i].split("#") : [];

    const episodes = sourceItems
      .map((item, index) => {
        const parts = item.split("$");
        const epName = parts[0] || `第${index + 1}集`;
        const epId = parts[1] || "";
        if (!epId) return null;

        const playData = {
          id: epId,
          v: vodName,
          e: epName,
        };

        return {
          name: epName,
          playId: e64(JSON.stringify(playData)),
        };
      })
      .filter(Boolean);

    if (episodes.length > 0) {
      playSources.push({
        name: sourceName,
        episodes,
      });
    }
  }

  return playSources;
}

async function getDetailById(id) {
  try {
    const detailUrl = toAbsUrl(id);
    const response = await axiosInstance.get(detailUrl, { headers: { ...DEFAULT_HEADERS } });
    const $ = cheerio.load(response.data || "");

    const vod = {
      vod_id: id,
      vod_name: $("h1.title").first().text().trim() || "",
      vod_pic: $(".lazyload").first().attr("data-original") || "",
      vod_type: $(".data:eq(0) a:eq(1)").text().trim() || "",
      vod_year: $(".data:eq(0) a:eq(2)").text().trim() || "",
      vod_area: $(".data:eq(0) a:eq(0)").text().trim() || "",
      vod_content: $(".text-collapse span").text().trim() || "",
      vod_play_from: [],
      vod_play_url: [],
    };

    $(".myui-panel__head h3").each((i, el) => {
      const from = $(el).text().trim();
      if (from.includes("播放列表") || !/热门资讯|热播|猜你喜欢/.test(from)) {
        const urls = [];
        $(`.myui-content__list:eq(${i}) li a`).each((_, a) => {
          const name = $(a).text().trim();
          const href = $(a).attr("href") || "";
          if (href) urls.push(`${name}$${href}`);
        });

        if (urls.length > 0) {
          vod.vod_play_from.push(from || `线路${vod.vod_play_from.length + 1}`);
          vod.vod_play_url.push(urls.join("#"));
        }
      }
    });

    return {
      vod_id: vod.vod_id,
      vod_name: vod.vod_name,
      vod_pic: vod.vod_pic,
      vod_type: vod.vod_type,
      vod_year: vod.vod_year,
      vod_area: vod.vod_area,
      vod_content: vod.vod_content,
      vod_play_sources: convertPlayToSources(
        vod.vod_play_from.join("$$$"),
        vod.vod_play_url.join("$$$"),
        vod.vod_name
      ),
    };
  } catch (error) {
    logError("获取详情失败", error);
    return null;
  }
}

// ==================== 标准接口：home ====================
async function home(params) {
  const classes = getClasses();
  const firstType = classes[0]?.type_id || "1";
  const categoryData = await getCategoryList(firstType, 1);

  return {
    class: classes,
    list: categoryData.list || [],
  };
}

// ==================== 标准接口：category ====================
async function category(params) {
  const tid = params?.categoryId || params?.id || "1";
  const pg = parseInt(params?.page, 10) || 1;
  return getCategoryList(tid, pg);
}

// ==================== 标准接口：search ====================
async function search(params) {
  const wd = params?.keyword || params?.wd || "";
  const pg = parseInt(params?.page, 10) || 1;
  if (!wd) return { list: [], page: pg, pagecount: 0, total: 0, limit: 0 };

  const candidates = [
    `${HOST}/vod/search/wd/${encodeURIComponent(wd)}/page/${pg}.html`,
    `${HOST}/vod/search/page/${pg}/wd/${encodeURIComponent(wd)}.html`,
  ];

  for (const url of candidates) {
    try {
      const response = await axiosInstance.get(url, { headers: { ...DEFAULT_HEADERS } });
      const list = parseListHtml(response.data);
      if (list.length > 0) {
        return {
          list,
          page: pg,
          pagecount: pg + 1,
          total: 999999,
          limit: 20,
        };
      }
    } catch {
      // ignore and try next
    }
  }

  return { list: [], page: pg, pagecount: 0, total: 0, limit: 0 };
}

// ==================== 标准接口：detail ====================
async function detail(params) {
  try {
    const id = params?.videoId || params?.id || "";
    if (!id) return { list: [] };
    const vod = await getDetailById(id);
    return { list: vod ? [vod] : [] };
  } catch (error) {
    logError("detail 失败", error);
    return { list: [] };
  }
}

// ==================== 标准接口：play ====================
async function play(params) {
  let rawPlayId = params?.playId || params?.id || "";
  let vodName = params?.vodName || "";
  let episodeName = params?.episodeName || "";

  try {
    // 优先解析 Base64(JSON)
    const decoded = d64(rawPlayId);
    if (decoded && decoded.startsWith("{")) {
      const parsed = JSON.parse(decoded);
      rawPlayId = parsed.id || rawPlayId;
      vodName = parsed.v || vodName;
      episodeName = parsed.e || episodeName;
    }
  } catch {
    // ignore
  }

  try {
    const playPageUrl = toAbsUrl(rawPlayId);
    const response = await axiosInstance.get(playPageUrl, { headers: { ...DEFAULT_HEADERS } });
    const playerData = parsePlayJsonFromHtml(response.data || "");

    if (!playerData || !playerData.url) {
      return {
        urls: [{ name: "播放", url: playPageUrl }],
        parse: 1,
        header: { ...DEFAULT_HEADERS },
      };
    }

    let playUrl = playerData.url;
    if (String(playerData.encrypt) === "1") {
      playUrl = unescape(playUrl);
    } else if (String(playerData.encrypt) === "2") {
      playUrl = unescape(Buffer.from(playUrl, "base64").toString());
    }

    const playResponse = {
      urls: [{ name: "默认", url: playUrl }],
      parse: 0,
      header: { ...DEFAULT_HEADERS },
    };

    if (DANMU_API && vodName) {
      const fileName = buildFileNameForDanmu(vodName, episodeName);
      if (fileName) {
        const danmakuList = await matchDanmu(fileName);
        if (danmakuList.length > 0) {
          playResponse.danmaku = danmakuList;
        }
      }
    }

    return playResponse;
  } catch (error) {
    logError("play 失败", error);
    return {
      urls: [{ name: "播放", url: toAbsUrl(rawPlayId) }],
      parse: 1,
      header: { ...DEFAULT_HEADERS },
    };
  }
}

module.exports = {
  home,
  category,
  search,
  detail,
  play,
};

const runner = require("spider_runner");
runner.run(module.exports);

