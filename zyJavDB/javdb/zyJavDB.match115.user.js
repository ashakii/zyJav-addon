// ==UserScript==
// @name            zyJavDB.match115
// @namespace       JavDB.match115@blc
// @version         0.0.2
// @author          blc
// @description     115 网盘匹配
// @match           https://javdb.com/*
// @icon            https://javdb.com/favicon.ico
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Grant.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Magnet.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req115.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Util.lib.js
// @connect         115.com
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM_deleteValues
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           GM_openInTab
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_info
// @require         https://github.com/Tampermonkey/utils/raw/d8a4543a5f828dfa8eefb0a3360859b6fe9c3c34/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// ==/UserScript==

Util.upStore();

const TARGET_TXT = "匹配中";
const TARGET_CLASS = "x-match";

const VOID = "javascript:void(0);";
const CHANNEL = new BroadcastChannel(GM_info.script.name);
const MATCH_API = "reMatch";

const listenClick = (onclose, defaultAction) => {
  const actions = {
    click: {
      val: "pc",
      url: "https://115vod.com/?pickcode=%s",
    },
    contextmenu: {
      val: "cid",
      url: "https://115.com/?cid=%s&offset=0&tab=&mode=wangpan",
    },
  };

  const timer = {};
  const getHref = (node) => node.closest(`a:not(.${TARGET_CLASS})`)?.href;
  const getTimerKey = location.pathname.startsWith("/v/") ? () => location.href : getHref;

  const debounce = (target) => {
    const key = getTimerKey(target);
    if (!key) return;

    if (timer[key]) clearTimeout(timer[key]);

    timer[key] = setTimeout(() => {
      onclose?.(target);
      delete timer[key];
    }, 750);
  };

  const onclick = (e) => {
    const { target, type } = e;
    if (!target.classList.contains(TARGET_CLASS)) return;

    e.preventDefault();
    e.stopPropagation();

    const action = actions[type];
    if (!action) return;

    const val = target.dataset[action.val];
    if (!val) return defaultAction?.(e);

    const tab = Grant.openTab(action.url.replaceAll("%s", val));
    tab.onclose = () => debounce(target);
  };

  document.addEventListener("click", onclick);
  document.addEventListener("contextmenu", onclick);
};

const formatBytes = (bytes, k = 1024) => {
  if (bytes < k) return "0KB";
  const units = ["KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)) - 1, units.length - 1);
  const size = (bytes / Math.pow(k, i + 1)).toFixed(2);
  return `${size}${units[i]}`;
};

const extractData = (data, keys = ["pc", "cid", "fid", "n", "s", "t"], format = "s") => {
  return data.map((item) => ({ ...JSON.parse(JSON.stringify(item, keys)), [format]: formatBytes(item[format]) }));
};

const formatTip = ({ n, s, t }) => `${n} - ${s} / ${t}`;

const API_URL = 'https://192.168.100.1:5002';

const matchStrm = async (pickcode) => {
  try {
    const response = await fetch(`${API_URL}/strms?pickcode=${pickcode}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    // 如果返回的是 { "exists": false }，说明没有匹配到
    if (data.exists === false) {
      return false;
    }

    // 如果匹配到，返回完整对象
    return data;
  } catch (error) {
    console.log(`没有匹配${pickcode}的strm!`);
    return false; // 或者根据需求返回其他默认值
  }
};


(function () {
  const CONT = document.querySelector(".movie-panel-info");
  if (!CONT) return;

  const render = ({ pc, cid, ...data }) => {
    return `
    <a
      href="${VOID}"
      class="${TARGET_CLASS}"
      title="${formatTip(data)}"
      data-pc="${pc}"
      data-cid="${cid}"
    >
      ${data.n}
    </a>
    `;
  };

  const matchCode = async ({ code, codes, regex }, { load, cont }) => {
    const UUID = crypto.randomUUID();
    load.dataset.uid = UUID;

    try {
      const { data = [] } = await Req115.filesSearchAllVideos(codes.join(" "));
      if (load.dataset.uid !== UUID) return;

      const sources = extractData(data.filter((it) => regex.test(it.n)));
      cont.innerHTML = sources.map(render).join("") || "暂无匹配";
      GM_setValue(code, sources);
    } catch (err) {
      if (load.dataset.uid !== UUID) return;
      cont.innerHTML = "匹配失败";
      Util.print(err?.message);
    }

    load.textContent = "115";
  };

  const addBlock = () => {
    const load = `${TARGET_CLASS}-load`;
    const cont = `${TARGET_CLASS}-cont`;

    CONT.querySelector(".review-buttons + .panel-block").insertAdjacentHTML(
      "afterend",
      `<div class="panel-block">
        <strong><a href="${VOID}" class="${load}">${TARGET_TXT}</a>:</strong>
        &nbsp;<span class="value ${cont}">...</span>
      </div>`,
    );

    return {
      load: CONT.querySelector(`.${load}`),
      cont: CONT.querySelector(`.${cont}`),
    };
  };

  const code = CONT.querySelector(".first-block .value").textContent.trim();
  const codeDetails = Util.codeParse(code);
  const block = addBlock();
  const matcher = () => matchCode(codeDetails, block);

  matcher();
  listenClick(matcher);
  unsafeWindow[MATCH_API] = matcher;

  const refresh = ({ target }) => {
    if (target.textContent === TARGET_TXT) return;
    target.textContent = TARGET_TXT;
    matcher();
  };

  block.load.addEventListener("click", refresh);
  window.addEventListener("beforeunload", () => CHANNEL.postMessage(code));
})();

(function () {
  const MOVIE_SELECTOR = ".movie-list .item";
  const CODE_SELECTORS = [".video-title", "strong"];
  const CODE_SELECTOR = CODE_SELECTORS.join(" ");
  const TARGET_HTML =
    `<div class="zy-match">
    <a href="${VOID}" class="tag is-normal ${TARGET_CLASS}">刷新</a>
  </div>`;

  const movieList = document.querySelectorAll(MOVIE_SELECTOR);
  if (!movieList.length) return;

  const parseCodeCls = (code) => ["x", ...code.split(/\s|\.|-|_/)].filter(Boolean).join("-");

  const matchAfter = ({ code, regex, target }, data) => {
    target.closest(MOVIE_SELECTOR).classList.add(parseCodeCls(code));
    const sources = data.filter((it) => regex.test(it.n));
    const len = sources.length;
    const container = target.querySelector(".zy-match");
    const existingTags = container.querySelectorAll(`.${TARGET_CLASS}:not(:first-child)`);
    existingTags.forEach(tag => tag.remove());

    if (len) {
      sources.forEach((item) => {
        const newTagNode = document.createElement('a');
        newTagNode.title = item.n;
        newTagNode.dataset.pc = item.pc;
        newTagNode.dataset.cid = item.cid;
        newTagNode.dataset.fid = item.fid;
        newTagNode.dataset.size = item.s;
        newTagNode.dataset.time = item.t;
        newTagNode.textContent = `已匹配`;
        newTagNode.className = `${TARGET_CLASS} tag zy-match is-success`;

        const classListToAdd = [];

        if (Magnet.topReg.test(item.n)) {
          classListToAdd.push("is-top250");
        }
        if (Magnet.gongyanReg.test(item.n)) {
          classListToAdd.push("is-gongyan");
        }
        if (Magnet.wumaReg.test(item.n)) {
          classListToAdd.push("is-wuma");
        }
        if (Magnet.zhReg.test(item.n) && Magnet.crackReg.test(item.n)) {
          classListToAdd.push("is-danger");
        }
        if (Magnet.fourkReg.test(item.n) && !Magnet.zhReg.test(item.n)) {
          classListToAdd.push("is-fourk");
        }
        if (Magnet.zhReg.test(item.n)) {
          if (!classListToAdd.includes("is-danger")) {
            classListToAdd.push("is-warning");
          }
        }
        if (Magnet.crackReg.test(item.n) && !Magnet.wumaReg.test(item.n)) {
          if (!classListToAdd.includes("is-danger")) {
            classListToAdd.push("is-info");
          }
        }

        if (classListToAdd.length) {
          newTagNode.classList.add(...classListToAdd);
        }


        matchStrm(item.pc).then(exists => {
          if (exists) {
            newTagNode.className += " is-strm";
          }
        });
        newTagNode.style.marginRight = '2px'; // 添加右侧间隔
        newTagNode.textContent = `${item.s} ${item.n.slice(0, 4)}`;
        container.appendChild(newTagNode);
      });
    } else {
      container.querySelector("a").textContent = "暂无匹配";
    }

  };
  //待完善版
  // const matchAfter = async ({ code, regex, target }, data) => {
  //   target.closest(MOVIE_SELECTOR).classList.add(parseCodeCls(code));
  //   const sources = data.filter((it) => regex.test(it.n));
  //   const len = sources.length;
  //   const container = target.querySelector(".zy-match");
  //   const existingTags = container.querySelectorAll(`.${TARGET_CLASS}:not(:first-child)`);
  //   existingTags.forEach(tag => tag.remove());

  //   // 调用 searchStrm 获取服务器返回的数据
  //   const strmData = await searchStrm(code);
  //   const pickcodeMap = new Map(); // 使用 Map 存储 pickcode 对应的数据
  //   if (Array.isArray(strmData)) {
  //     strmData.forEach(item => pickcodeMap.set(item.pickcode, item));
  //   }

  //   const matchedPickcodes = new Set(); // 用于记录已匹配的 pickcode

  //   if (len) {
  //     sources.forEach((item) => {
  //       const newTagNode = document.createElement('a');
  //       newTagNode.title = item.n;
  //       newTagNode.dataset.pc = item.pc;
  //       newTagNode.dataset.cid = item.cid;
  //       newTagNode.dataset.fid = item.fid;
  //       newTagNode.dataset.size = item.s;
  //       newTagNode.dataset.time = item.t;
  //       newTagNode.textContent = `已匹配`;

  //       let className = "is-normal";
  //       if (Magnet.zhReg.test(item.n) && Magnet.crackReg.test(item.n)) {
  //         className = "is-danger";
  //       } else if (Magnet.fourkReg.test(item.n) && !Magnet.zhReg.test(item.n)) {
  //         className = "is-fourk";
  //       } else if (Magnet.zhReg.test(item.n)) {
  //         className = "is-warning";
  //       } else if (Magnet.crackReg.test(item.n) && !Magnet.wumaReg.test(item.n)) {
  //         className = "is-info";
  //       } else if (Magnet.wumaReg.test(item.n)) {
  //         className = "is-wuma";
  //       } else {
  //         className = "is-success";
  //       }

  //       newTagNode.className = `${TARGET_CLASS} tag ${className} zy-match`;

  //       // 如果 pickcode 匹配 item.pc，则添加 is-strm
  //       if (pickcodeMap.has(item.pc)) {
  //         newTagNode.classList.add("is-strm");
  //         matchedPickcodes.add(item.pc); // 记录已匹配的 pickcode
  //       }

  //       newTagNode.style.marginRight = '2px'; // 添加右侧间隔
  //       newTagNode.textContent = `${item.s} ${item.n.slice(0, 4)}`;
  //       container.appendChild(newTagNode);
  //     });
  //   } else {
  //     container.querySelector("a").textContent = "暂无匹配";
  //   }

  //   // 如果 pickcode 没有匹配任何 item.pc，则创建一个按钮
  //   pickcodeMap.forEach(({ pickcode, name, path }) => {
  //     if (!matchedPickcodes.has(pickcode)) { // 只处理未匹配的 pickcode
  //       const newButton = document.createElement("a");
  //       newButton.textContent = `未匹配: ${name}`;
  //       newButton.className = `${TARGET_CLASS} tag is-unmatched zy-match`;
  //       newButton.dataset.pickcode = pickcode;
  //       newButton.dataset.name = name;
  //       newButton.dataset.path = path;
  //       newButton.title = `${name} - ${path}`;
  //       container.appendChild(newButton);
  //     }
  //   });
  // };


  const matchBefore = (node) => {
    if (node.classList.contains("is-hidden")) return;

    const target = node.querySelector(CODE_SELECTORS[0]);
    if (!target) return;

    const code = target.querySelector(CODE_SELECTORS[1])?.textContent.trim();
    if (!code) return;

    if (!target.querySelector(`.${TARGET_CLASS}`)) target.insertAdjacentHTML("afterbegin", TARGET_HTML);
    return { ...Util.codeParse(code), target };
  };

  const useMatchQueue = (before, after) => {
    const wait = {};
    const queue = [];
    let loading = false;

    const over = (pre, data = []) => {
      wait[pre].forEach((it) => after?.(it, data));
      delete wait[pre];
    };

    const match = async () => {
      if (loading || !queue.length) return;
      const prefix = queue[0];
      loading = true;

      try {
        const { data = [] } = await Req115.filesSearchAllVideos(prefix);
        const sources = extractData(data);
        GM_setValue(prefix, sources);
        over(prefix, sources);
      } catch (err) {
        over(prefix);
        Util.print(err?.message);
      }

      loading = false;
      queue.shift();
      match();
    };

    const dispatch = (node) => {
      const details = before?.(node);
      if (!details) return;

      const { code, prefix } = details;
      const cache = GM_getValue(code) ?? GM_getValue(prefix);
      if (cache) return after?.(details, cache);

      if (!wait[prefix]) wait[prefix] = [];
      wait[prefix].push(details);

      if (queue.includes(prefix)) return;
      queue.push(prefix);
      match();
    };

    const callback = (entries, obs) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) obs.unobserve(target) || requestAnimationFrame(() => dispatch(target));
      });
    };

    const obs = new IntersectionObserver(callback, { threshold: 0.25 });
    return (nodeList) => nodeList.forEach((node) => obs.observe(node));
  };

  const matchQueue = useMatchQueue(matchBefore, matchAfter);
  matchQueue(movieList);

  window.addEventListener("JavDB.scroll", ({ detail }) => matchQueue(detail));
  CHANNEL.onmessage = ({ data }) => matchQueue(document.querySelectorAll(`.${parseCodeCls(data)}`));

  const publish = (code) => {
    matchQueue(document.querySelectorAll(`.${parseCodeCls(code)}`));
    CHANNEL.postMessage(code);
  };

  const matchCode = async (node) => {
    const movie = node.closest(MOVIE_SELECTOR);
    if (!movie) return;

    const code = movie.querySelector(CODE_SELECTOR)?.textContent.trim();
    const target = movie.querySelector(`.${TARGET_CLASS}`);
    if (!code || !target) return;

    const { codes, regex } = Util.codeParse(code);
    const UUID = crypto.randomUUID();
    target.dataset.uid = UUID;

    try {
      const { data = [] } = await Req115.filesSearchAllVideos(codes.join(" "));
      if (target.dataset.uid !== UUID) return;

      const sources = extractData(data.filter((it) => regex.test(it.n)));
      GM_setValue(code, sources);
    } catch (err) {
      if (target.dataset.uid !== UUID) return;
      Util.print(err?.message);
    }

    publish(code);
    target.textContent = "刷新";
  };

  const refresh = ({ type, target }) => {
    if (target.textContent === TARGET_TXT) return;
    target.textContent = TARGET_TXT;
    const container = target.parentNode;
    const existingTags = container.querySelectorAll(`.${TARGET_CLASS}:not(:first-child)`);
    existingTags.forEach(tag => tag.remove());


    if (type === "contextmenu") return matchCode(target);
    if (type !== "click") return;
    const code = target.closest(MOVIE_SELECTOR)?.querySelector(CODE_SELECTOR)?.textContent.trim();
    if (code) setTimeout(() => {
      publish(code);
      target.textContent = "刷新";
    }, 750);
  };

  unsafeWindow[MATCH_API] = matchCode;
  listenClick(matchCode, refresh);
})();
