// ==UserScript==
// @name            zyJavDB.offline115
// @namespace       JavDB.offline115@blc
// @version         0.0.2
// @author          blc
// @description     115 网盘离线
// @match           https://javdb.com/*
// @match           https://captchaapi.115.com/*
// @icon            https://javdb.com/favicon.ico
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Grant.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Magnet.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Offline.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req115.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Util.lib.js
// @require         https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Verify115.lib.js
// @resource        pend https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/assets/pend.png
// @resource        warn https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/assets/warn.png
// @resource        error https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/assets/error.png
// @resource        success https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/assets/success.png
// @connect         jdbstatic.com
// @connect         aliyuncs.com
// @connect         javdb.com
// @connect         115.com
// @connect         localhost
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

const magtags = localforage.createInstance({
  name: "magtags"
});

// 获取当前日期
const date = new Date();

// 使用toISOString方法并截取日期部分
const today = date.toISOString().split('T')[0];

const CONFIG = [
  {
    name: "普通",
    // dir: "0000小姐姐仓库/0X04普通片库/JAV_output",
    dir: `0000小姐姐仓库/${today}/${today}普通片库`,
    color: "is-primary",
    magnetOptions: {
      filter: ({ size, number }) => {
        const magnetSize = parseFloat(size);
        return magnetSize > 3 * 1024 ** 3 && number <= 9;
      },
      sort: (a, b) => {
        if (a.torr !== b.torr) return a.torr ? -1 : 1;; // 优先.torrent
        // if (a.zh !== b.zh) return a.zh ? -1 : 1; // 优先中字
        // if (a.crack !== b.crack) return a.crack ? -1 : 1; // 优先破解
        return parseFloat(b.size) - parseFloat(a.size); // 优先大文件
      },
    },
  },
  {
    name: "破解",
    dir: `0000小姐姐仓库/${today}/${today}破解片库`,
    // dir: "0000小姐姐仓库/0X01破解片库/JAV_output",
    color: "is-link",
    magnetOptions: {
      filter: ({ size, crack, number }) => {
        const magnetSize = parseFloat(size);
        return magnetSize > 3 * 1024 ** 3 && crack && number <= 6;
      },
      sort: (a, b) => {
        return parseFloat(b.size) - parseFloat(a.size);
      },
    },
  },
  {
    name: "字幕",
    dir: `0000小姐姐仓库/${today}/${today}字幕片库`,
    // dir: "0000小姐姐仓库/0X02字幕片库/JAV_output",
    color: "is-warning",
    magnetOptions: {
      filter: ({ size, zh, number }) => {
        const magnetSize = parseFloat(size);
        return magnetSize > 3 * 1024 ** 3 && zh && number <= 8;
      },
    },
  },
  {
    name: "字幕2",
    dir: `0000小姐姐仓库/${today}/${today}字幕片库`,
    // dir: "0000小姐姐仓库/0X02字幕片库/JAV_output",
    color: "is-warning",
    inMagnets: true,
    magnetOptions: {
      filter: ({ zh, number }) => {
        return zh && number <= 8;
      },
    },
  },
  {
    name: "4K",
    dir: `0000小姐姐仓库/${today}/${today}高清片库`,
    // dir: "0000小姐姐仓库/0X03高清片库/JAV_output",
    color: "is-fourk",
    magnetOptions: {
      filter: ({ fourk, number }) => {
        return fourk && number <= 10;
      },
      sort: (a, b) => {
        //if (a.zh !== b.zh) return a.zh ? -1 : 1; // 优先中字
        if (a.crack !== b.crack) return a.crack ? -1 : 1; // 优先破解
        if (a.fourk !== b.fourk) return a.fourk ? -1 : 1;
        return parseFloat(b.size) - parseFloat(a.size); // 优先大文件
      },
    },
  },
  {
    name: "中文破解",
    dir: `0000小姐姐仓库/${today}/${today}中破片库`,
    // dir: "0000小姐姐仓库/0X00破解字幕/JAV_output",
    color: "is-danger",
    magnetOptions: {
      filter: ({ uc, zh, crack }) => {
        return uc || (zh && crack);
      },
    },
  },
  {
    name: "共演",
    dir: `0000小姐姐仓库/${today}/${today}梦幻共演`,
    // dir: "0000小姐姐仓库/0X05梦幻共演/JAV_output",
    color: "is-danger",
    magnetOptions: {
      filter: ({ size, number }) => {
        const magnetSize = parseFloat(size);
        return magnetSize > 3 * 1024 ** 3 && number <= 9;
      },
      sort: (a, b) => {
        if (a.torr !== b.torr) return a.torr ? -1 : 1;; // 优先.torrent
        // if (a.zh !== b.zh) return a.zh ? -1 : 1; // 优先中字
        // if (a.crack !== b.crack) return a.crack ? -1 : 1; // 优先破解
        return parseFloat(b.size) - parseFloat(a.size); // 优先大文件
      },
    },
  },
  {
    name: "无码",
    dir: `0000小姐姐仓库/${today}/${today}无码片库`,
    // dir: "0000小姐姐仓库/1X03无码片库/JAV_output",
    color: "is-wuma",
    magnetOptions: {
      filter: ({ size, number }) => {
        const magnetSize = parseFloat(size);
        return magnetSize > 3 * 1024 ** 3 && number <= 9;
      },
      sort: (a, b) => {
        if (a.torr !== b.torr) return a.torr ? -1 : 1;; // 优先.torrent
        // if (a.zh !== b.zh) return a.zh ? -1 : 1; // 优先中字
        // if (a.crack !== b.crack) return a.crack ? -1 : 1; // 优先破解
        return parseFloat(b.size) - parseFloat(a.size); // 优先大文件
      },
    },
  },
  {
    name: "流出",
    dir: `0000小姐姐仓库/${today}/${today}无码流出`,
    // dir: "0000小姐姐仓库/0X06无码流出/JAV_output",
    color: "is-wuma",
    inMagnets: true,
    magnetOptions: {
      filter: ({ number, wuma }) => {
        return wuma && number <= 9;
      },
      sort: (a, b) => {
        if (a.torr !== b.torr) return a.torr ? -1 : 1;; // 优先.torrent
        // if (a.zh !== b.zh) return a.zh ? -1 : 1; // 优先中字
        // if (a.crack !== b.crack) return a.crack ? -1 : 1; // 优先破解
        return parseFloat(b.size) - parseFloat(a.size); // 优先大文件
      },
    },
  },

];

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
    fourk: Magnet.fourkReg.test(name) || transToByte(meta.split(",")[0]) >= 8.6 * 1024 ** 3,
    uc: Magnet.ucReg.test(name),
    torr: Magnet.torrentReg.test(name),
    gg5: Magnet.gg5Reg.test(name),
    wuma: Magnet.wumaReg.test(name),
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


// #region 获取详情页
const getDetails = (dom = document, link = window.location.href) => {
  const url = "https://javdb.com" + link;
  const infoNode = dom.querySelector(".movie-panel-info");
  if (!infoNode) return;

  const info = { cover: dom.querySelector(".video-cover")?.src ?? "", nvyou: "未知演员♀" };
  const codeNode = infoNode.querySelector(".first-block .value");
  const prefix = codeNode.querySelector("a")?.textContent.trim();
  const code = codeNode.textContent.trim();
  const fc2 = Magnet.fc2Reg.test(code);
  info.top250 = infoNode.querySelector(".ranking-tags") ? true : false;
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
        const actorLinks = Array.from(item.querySelectorAll(".value a"));
        // 过滤掉男演员（通过查找下一个相邻的 strong 标签是否包含 ♂）
        const femaleActors = actorLinks.filter(link => {
          const nextSymbol = link.nextElementSibling;
          return !nextSymbol?.textContent.includes("♂");
        });
        const topActors = femaleActors.slice(0, 4);
        info.actorLinks = topActors.map(link => ({
          name: link.textContent.trim(),
          href: link.href
        }));
        info.actors = value
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item && !item.includes("♂"))
        info.nvyou = info.actors?.slice(0, 4).join(" ").trim() || '未知演员♀';
        break;
    }
  });

  if (info.date) {
    const [year, month, day] = info.date.split("-");
    info.year = year;
    info.month = month;
    info.day = day;
  }

  info.wuma = info.genres?.includes("無碼流出") || dom.querySelector(".title.is-4").textContent.includes("無碼") || fc2;
  info.gongyan = info.actors?.length > 1 && !info.genres?.includes("精選綜合");

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
      else if ((fourk && (info.time && size / info.time > 123456789)) && !assignedMagnets.has(magnet.url)) {
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

  return { ...Util.codeParse(code), ...info, url };
};

// #endregion

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

// #region 详情页
(async function () {
  const details = getDetails();
  if (!details) return;

  const actions = Offline.getActions(CONFIG, details);
  if (!actions.length) return;

  const UNC = isUncensored();

  const insertActions = (actions) => {
    document.querySelector(".movie-panel-info").insertAdjacentHTML(
      "beforeend",
      `<div class="panel-block"><div class="columns"><div class="column"><div class="buttons">
        ${actions.map(renderAction).join("")}
      </div></div></div></div>`,
    );

    const inMagnets = actions.filter((item) => Boolean(item.inMagnets));
    if (!inMagnets.length) return;

    const inMagnetsStr = inMagnets.map(renderAction).join("");
    const magnetsNode = document.querySelector("#magnets-content");

    const insert = (node) => node.querySelector(".buttons.column").insertAdjacentHTML("beforeend", inMagnetsStr);
    const insertMagnets = () => magnetsNode.querySelectorAll(".item.columns").forEach(insert);

    window.addEventListener("JavDB.magnet", insertMagnets);
    insertMagnets();
  };

  const onstart = (target) => {
    Util.setFavicon("pend");
    target.classList.add(LOAD_CLASS);
    document.querySelectorAll(`.${TARGET_CLASS}`).forEach((item) => item.setAttribute("disabled", ""));
  };

  const onfinally = (target, res) => {
    document.querySelectorAll(`.${TARGET_CLASS}`).forEach((item) => item.removeAttribute("disabled"));
    target.classList.remove(LOAD_CLASS);
    if (!res) return;

    Grant.notify(res);
    Util.setFavicon(res);
    setTimeout(() => unsafeWindow[MATCH_API]?.(), MATCH_DELAY);
  };

  const onclick = (e) => {
    const { target } = e;
    if (!target.classList.contains(TARGET_CLASS)) return;

    e.preventDefault();
    e.stopPropagation();

    const action = findAction(target.dataset, actions);
    if (!action) return;

    const inMagnets = target.closest("#magnets-content > .item");
    const { magnetOptions, ...options } = Offline.getOptions(action, details);

    const magnets = inMagnets ? [parseMagnet(inMagnets)] : Offline.getMagnets(getMagnets(), magnetOptions);
    if (!magnets.length) return;

    offline({
      options,
      magnets: checkCrack(magnets, UNC),
      onstart: () => onstart(target),
      onprogress: Util.setFavicon,
      onfinally: (res) => onfinally(target, res),
    });
  };

  insertActions(actions);
  document.addEventListener("click", onclick);
})();
// #endregion

// #region 列表页
(async function () {
  const COVER_SELECTOR = ".cover";
  const movieList = document.querySelectorAll(".movie-list .item");
  if (!movieList.length) return;

  const getParams = () => {
    const sectionName = document.querySelector(".section-name")?.textContent.trim() ?? "";
    const actorSectionName = document.querySelector(".actor-section-name")?.textContent.trim() ?? "";

    const getLastName = (txt) => txt.split(", ").at(-1).trim();

    const getOnTags = () => {
      const nodeList = document.querySelectorAll("#tags .tag_labels .tag.is-info");
      const genres = [...nodeList].map((item) => item.textContent.trim());
      return { genres };
    };

    const getOnActors = () => {
      const actor = getLastName(actorSectionName).trim();
      const nodeList = document.querySelectorAll(".actor-tags.tags .tag.is-medium.is-link:not(.is-outlined)");
      const genres = [...nodeList].map((item) => item.textContent.trim());
      return { actors: [actor], genres };
    };

    const getOnSeries = () => {
      return { series: sectionName };
    };

    const getOnMakers = () => {
      return { maker: getLastName(sectionName) };
    };

    const getOnDirectors = () => {
      return { director: getLastName(sectionName) };
    };

    const getOnVideoCodes = () => {
      return { prefix: sectionName, codeFirstLetter: sectionName[0].toUpperCase() };
    };

    const getOnLists = () => {
      return { list: actorSectionName };
    };

    const getOnPublishers = () => {
      return { publisher: getLastName(sectionName) };
    };

    const getOnUsersList = () => {
      const list = document.querySelector(".title.is-4 .is-active a")?.textContent.trim() ?? "";
      return { list };
    };

    const { pathname: PATHNAME } = location;
    if (PATHNAME.startsWith("/tags")) return getOnTags();
    if (PATHNAME.startsWith("/actors")) return getOnActors();
    if (PATHNAME.startsWith("/series")) return getOnSeries();
    if (PATHNAME.startsWith("/makers")) return getOnMakers();
    if (PATHNAME.startsWith("/directors")) return getOnDirectors();
    if (PATHNAME.startsWith("/video_codes")) return getOnVideoCodes();
    if (PATHNAME.startsWith("/lists")) return getOnLists();
    if (PATHNAME.startsWith("/publishers")) return getOnPublishers();
    if (PATHNAME.startsWith("/users/list_detail")) return getOnUsersList();
    return {};
  };

  const params = getParams();
  const actions = Offline.getActions(CONFIG, params);
  if (!actions.length) return;

  const insertActions = (actions) => {
    const actionsStr = `<div class="px-2 pt-2 buttons">${actions.map(renderAction).join("")}</div>`;

    const insert = (node) => node.querySelector(COVER_SELECTOR)?.insertAdjacentHTML("beforeend", actionsStr);
    const insertList = (nodeList) => nodeList.forEach(insert);

    insertList(movieList);
    window.addEventListener("JavDB.scroll", ({ detail }) => insertList(detail));
  };

  const videoFocus = (target) => target.closest(COVER_SELECTOR)?.querySelector("video")?.focus();

  const onstart = (target) => {
    target.classList.add(LOAD_CLASS);
    target.parentElement.querySelectorAll(`.${TARGET_CLASS}`).forEach((item) => item.setAttribute("disabled", ""));
  };

  const onfinally = (target, res) => {
    target.parentElement.querySelectorAll(`.${TARGET_CLASS}`).forEach((item) => item.removeAttribute("disabled"));
    target.classList.remove(LOAD_CLASS);
    if (res) setTimeout(() => unsafeWindow[MATCH_API]?.(target), MATCH_DELAY);
  };

  // #region 点击事件
  const onclick = async (e) => {
    const { target } = e;
    if (!target.classList.contains(TARGET_CLASS)) return;

    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => videoFocus(target));

    const action = findAction(target.dataset, actions);
    if (!action) return;
    onstart(target);

    try {
      const link = target.closest("a").href;
      const mid = link.split('/').pop();
      let details = await magtags.getItem(`mags-${mid}`);
      if (!details.actors.length) {
        const dom = await Req.request(target.closest("a").href);
        details = getDetails(dom, target.closest("a").href);
      }

      const { magnetOptions, ...options } = Offline.getOptions(action, details);

      // const magnets = Offline.getMagnets(getMagnets(dom), magnetOptions);
      const magnets = Offline.getMagnets(details.magnets, magnetOptions);
      if (!magnets.length) logger.warn("没有获取到磁力链接");

      const UNC = details.wuma;

      offline({
        options,
        magnets: checkCrack(magnets, UNC),
        onfinally: (res) => onfinally(target, res),
      });
    } catch (err) {
      onfinally(target);
      Util.print(err?.message);
    }
  };
  // #endregion

  insertActions(actions);
  document.addEventListener("click", onclick, true);
})();

// #endregion