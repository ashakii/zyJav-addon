// ==UserScript==
// @name            JavDB.offline115
// @namespace       JavDB.offline115@blc
// @version         0.0.2
// @author          blc
// @description     115 网盘离线
// @match           https://javdb.com/*
// @match           https://captchaapi.115.com/*
// @icon            https://javdb.com/favicon.ico
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Grant.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Magnet.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Offline.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Req.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Req115.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Util.lib.js
// @require         https://github.com/bolin-dev/JavPack/raw/main/libs/JavPack.Verify115.lib.js
// @resource        pend https://github.com/bolin-dev/JavPack/raw/main/assets/pend.png
// @resource        warn https://github.com/bolin-dev/JavPack/raw/main/assets/warn.png
// @resource        error https://github.com/bolin-dev/JavPack/raw/main/assets/error.png
// @resource        success https://github.com/bolin-dev/JavPack/raw/main/assets/success.png
// @connect         jdbstatic.com
// @connect         aliyuncs.com
// @connect         javdb.com
// @connect         115.com
// @run-at          document-end
// @grant           GM_removeValueChangeListener
// @grant           GM_addValueChangeListener
// @grant           GM_getResourceURL
// @grant           GM_xmlhttpRequest
// @grant           GM_notification
// @grant           GM_addElement
// @grant           unsafeWindow
// @grant           GM_openInTab
// @grant           window.close
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_info
// @noframes
// @require         https://github.com/Tampermonkey/utils/raw/d8a4543a5f828dfa8eefb0a3360859b6fe9c3c34/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// ==/UserScript==


const TARGET_CLASS = "x-offline";
const LOAD_CLASS = "is-loading";

const MATCH_API = "reMatch";
const MATCH_DELAY = 750;

const { HOST, STATUS_KEY, STATUS_VAL } = Verify115;
const { PENDING, VERIFIED, FAILED } = STATUS_VAL;

const transToByte = Magnet.useTransByte();

//修改处
const parseMagnet = (node) => {
  const name = node.querySelector(".name")?.textContent.trim() ?? "";
  const meta = node.querySelector(".meta")?.textContent.trim() ?? "";
  const number = meta.split(",")[1]?.match(/\d+/)?.[0] ?? "1";
  return {
    url: node.querySelector(".magnet-name a").href.split("&")[0].toLowerCase(),
    zh: !!node.querySelector(".tag.is-warning") || Magnet.zhReg.test(name),
    size: transToByte(meta.split(",")[0]),
    number: number,
    crack: Magnet.crackReg.test(name),
    fourk: Magnet.fourkReg.test(name),
    uc: Magnet.ucReg.test(name),
    torr: Magnet.torrentReg.test(name),
    meta,
    name,
  };
};

const getMagnets = (dom = document) => {
  return [...dom.querySelectorAll("#magnets-content > .item")].map(parseMagnet).toSorted(Magnet.magnetSort);
};

const checkCrack = (magnets, uncensored) => {
  return uncensored ? magnets.map((item) => ({ ...item, crack: false })) : magnets;
};


const getDetails = (dom = document) => {
  const infoNode = dom.querySelector(".movie-panel-info");
  if (!infoNode) return;

  const info = { cover: dom.querySelector(".video-cover")?.src ?? "" };
  const codeNode = infoNode.querySelector(".first-block .value");
  const prefix = codeNode.querySelector("a")?.textContent.trim();
  const code = codeNode.textContent.trim();
  info.codeFirstLetter = code[0].toUpperCase();
  if (prefix) info.prefix = prefix;

  const titleNode = dom.querySelector(".title.is-4");
  const label = titleNode.querySelector("strong").textContent;
  const origin = titleNode.querySelector(".origin-title");
  const current = titleNode.querySelector(".current-title");
  info.title = `${label}${(origin ?? current).textContent}`.replace(code, "").trim();

  infoNode.querySelectorAll(".movie-panel-info > .panel-block").forEach((item) => {
    const label = item.querySelector("strong")?.textContent.trim();
    const value = item.querySelector(".value")?.textContent.trim();
    if (!label || !value || value.includes("N/A")) return;

    switch (label) {
      case "日期:":
        info.date = value;
        break;
      case "時長:":
        info.time = value.split(" ")[0];
        break;
      case "導演:":
        info.director = value;
        break;
      case "片商:":
        info.maker = value;
        break;
      case "發行:":
        info.publisher = value;
        break;
      case "系列:":
        info.series = value;
        break;
      case "類別:":
        info.genres = value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        break;
      case "演員:":  //修改处
        info.actors = value
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item && !item.includes("♂"))
          .slice(0, 3);
        info.nvyou = info.actors.join(" ").trim();
        break;
    }
  });

  if (info.date) {
    const [year, month, day] = info.date.split("-");
    info.year = year;
    info.month = month;
    info.day = day;
  }

  info.gongyan = info.actors.length > 1 && !info.genres.includes("精選綜合");

  // 获取磁力链接信息
  info.magnets = getMagnets(dom);

  // 分组磁力链接
  if (info.magnets && info.magnets.length > 0) {
    info.magnetGroups = {
      UC: [], // 既匹配字幕又匹配破解
      ZH: [], // 仅匹配字幕
      FOURK: [], // 匹配 4K 或 size/time > 393,529,344
      CRACK: [], // 仅匹配破解
    };

    // 用于记录已经分配到高优先级组的磁力链接
    const assignedMagnets = new Set();

    info.magnets.forEach((magnet) => {
      const { zh, crack, fourk, size } = magnet;

      // UC 组：既匹配字幕又匹配破解
      if (zh && crack && !assignedMagnets.has(magnet.url)) {
        info.magnetGroups.UC.push(magnet);
        assignedMagnets.add(magnet.url); // 标记为已分配
      }
      // ZH 组：仅匹配字幕
      else if (zh && !assignedMagnets.has(magnet.url)) {
        info.magnetGroups.ZH.push(magnet);
        assignedMagnets.add(magnet.url); // 标记为已分配
      }
      // 4K 组：匹配 4K 或 size/time > 393,529,344
      else if ((fourk || (info.time && size / info.time > 123456789)) && !assignedMagnets.has(magnet.url)) {
        info.magnetGroups.FOURK.push(magnet);
        assignedMagnets.add(magnet.url); // 标记为已分配
      }
      // CRACK 组：仅匹配破解
      else if (crack && !assignedMagnets.has(magnet.url)) {
        info.magnetGroups.CRACK.push(magnet);
        assignedMagnets.add(magnet.url); // 标记为已分配
      }
    });
  }

  return { ...Util.codeParse(code), ...info };
};


console.log(getDetails());

const isUncensored = (dom = document) => {
  return dom.querySelector(".title.is-4").textContent.includes("無碼");
};

const renderAction = ({ color, index, idx, desc, name }) => {
  return `
  <button
    class="${TARGET_CLASS} button is-small x-un-hover ${color}"
    data-index="${index}"
    data-idx="${idx}"
    title="${desc}"
  >
    ${name}
  </button>
  `;
};

const findAction = ({ index, idx }, actions) => {
  return actions.find((act) => act.index === Number(index) && act.idx === Number(idx));
};


const offline = async ({ options, magnets, onstart, onprogress, onfinally }, currIdx = 0) => {
  onstart?.();
  const res = await Req115.handleOffline(options, magnets.slice(currIdx));
  if (res.status !== "warn") return onfinally?.(res);
  onprogress?.(res);

  if (GM_getValue(STATUS_KEY) !== PENDING) {
    Verify115.start();
    Grant.notify(res);
  }

  const listener = GM_addValueChangeListener(STATUS_KEY, (_name, _old_value, new_value) => {
    if (![VERIFIED, FAILED].includes(new_value)) return;
    GM_removeValueChangeListener(listener);
    if (new_value === FAILED) return onfinally?.();
    offline({ options, magnets, onstart, onprogress, onfinally }, res.currIdx);
  });
};

(function () {
  if (location.host === HOST) return Verify115.verify();

})();


(async function () {
  const COVER_SELECTOR = ".cover";
  const ITEM_SELECTOR = ".movie-list .item";
  const REQUEST_DELAY = 1000; // 1秒延迟

  // 监听页面滚动或动态加载事件
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        processItems();
      }
    });
  });

  // 开始观察页面变化
  observer.observe(document.body, { childList: true, subtree: true });

  // 初始处理
  processItems();

  // 处理 item 的函数
  async function processItems() {
    const movieList = document.querySelectorAll(ITEM_SELECTOR);
    if (!movieList.length) return;

    for (const item of movieList) {
      // 检查是否已经插入过按钮
      if (item.querySelector(`.${TARGET_CLASS}`)) continue;

      // 添加延迟
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));

      // 获取 item 的详细信息
      const details = await getDetailsForItem(item);
      if (!details) continue;

      // 根据 details 插入按钮
      insertButtonsForItem(item, details);
    }
  }

  // 获取 item 的详细信息
  async function getDetailsForItem(item) {
    const link = item.querySelector("a");
    if (!link) return null;

    try {
      const dom = await Req.request(link.href);
      return getDetails(dom);
    } catch (err) {
      console.error("Failed to get details for item:", err);
      return null;
    }
  }

  // 插入按钮到单个 item
  function insertButtonsForItem(item, details) {
    const { magnetGroups } = details;

    // 定义每个组的按钮配置
    const groupButtons = [
      {
        name: "UC",
        color: "is-primary",
        group: magnetGroups.UC,
        desc: "既匹配字幕又匹配破解的磁力链接",
      },
      {
        name: "ZH",
        color: "is-info",
        group: magnetGroups.ZH,
        desc: "仅匹配字幕的磁力链接",
      },
      {
        name: "4K",
        color: "is-success",
        group: magnetGroups.FOURK,
        desc: "匹配 4K 或 size/time > 393,529,344 的磁力链接",
      },
      {
        name: "CRACK",
        color: "is-warning",
        group: magnetGroups.CRACK,
        desc: "仅匹配破解的磁力链接",
      },
    ];

    // 过滤出有数据的组
    const validGroups = groupButtons.filter((group) => group.group.length > 0);

    // 如果没有有效的组，直接返回
    if (validGroups.length === 0) return;

    // 创建按钮 HTML
    const buttonsHTML = validGroups
      .map((group) =>
        renderAction({
          name: group.name,
          color: group.color,
          desc: group.desc,
          index: 0, // 可以根据需要调整
          idx: 0, // 可以根据需要调整
        })
      )
      .join("");

    // 插入按钮到 item
    const coverNode = item.querySelector(COVER_SELECTOR);
    if (coverNode) {
      coverNode.insertAdjacentHTML("beforeend", `<div class="buttons">${buttonsHTML}</div>`);
    }
  }
})();
