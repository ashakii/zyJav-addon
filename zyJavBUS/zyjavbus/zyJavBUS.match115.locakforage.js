// ==UserScript==
// @name            zyjavBUS-match.localforage
// @version         0.1
// @author          zyashakii
// @description     javbus-115 网盘匹配
// @match           https://www.javbus.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=javbus.com
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Grant.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Magnet.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req115.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Util.lib.js
// @require         https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js
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
const TARGET_CLASS = "zy-match";

const VOID = "javascript:void(0);";
const CHANNEL = new BroadcastChannel(GM_info.script.name);
const MATCH_API = "reMatch";

const match115 = localforage.createInstance({
  name: "match115"
});

const now = Date.now();
const days = 3 * 24 * 60 * 60 * 1000;
const save_time = GM_getValue("save_time") || 0;
if (save_time < now - days) {
  match115.clear();
  GM_setValue("save_time", now);
}


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
  const getHref = (node) => node.closest(`a.zy-match`)?.href;
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

// #region 详情页
(function () {
  const CONT = document.querySelector(".col-md-3.info");
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
      ${data.s} ${data.n}
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
      await match115.setItem(code, sources);
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

    CONT.insertAdjacentHTML(
      "beforeend",
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

  const code = CONT.querySelector("p span+span").textContent.trim();
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
// #endregion

// #region 列表页
(function () {
  const MOVIE_SELECTOR = "#waterfall .item";
  const CODE_SELECTOR = ".photo-info date";
  const TARGET_HTML =
    ` <div class="zymatch-container">
        <a href="${VOID}" class="rematch zy-match is-nomatch" title='点我刷新'></a>
      </div>
    `;

  const movieList = document.querySelectorAll(MOVIE_SELECTOR);
  if (!movieList.length) return;

  const parseCodeCls = (code) => ["x", ...code.split(/\s|\.|-|_/)].filter(Boolean).join("-");

  // const matchAfter = ({ code, regex, target }, data) => {
  //   target.closest(MOVIE_SELECTOR).classList.add(parseCodeCls(code));
  //   const sources = data.filter((it) => regex.test(it.n));
  //   const len = sources.length;
  //   const container = target.querySelector(".zymatch-container");
  //   const rematch_ball = container.querySelector('.rematch');
  //   let ball_color = null;
  //   const ball_list = ["is-uc", "is-wuma", "is-zh", "is-crack", "is-fourk"];

  //   if (len) {
  //     sources.forEach((item) => {
  //       const newTagNode = document.createElement('a');
  //       newTagNode.title = item.n;
  //       newTagNode.dataset.pc = item.pc;
  //       newTagNode.dataset.cid = item.cid;
  //       newTagNode.dataset.fid = item.fid;
  //       newTagNode.dataset.size = item.s;
  //       newTagNode.dataset.time = item.t;
  //       newTagNode.className = `${TARGET_CLASS} zy-match is-normal`;

  //       const classListToAdd = [];

  //       if (Magnet.wumaReg.test(item.n)) {
  //         classListToAdd.push("is-wuma");
  //       }
  //       if (Magnet.zhReg.test(item.n) && Magnet.crackReg.test(item.n)) {
  //         classListToAdd.push("is-uc");
  //       }
  //       if (Magnet.fourkReg.test(item.n) && !Magnet.zhReg.test(item.n)) {
  //         classListToAdd.push("is-fourk");
  //       }
  //       if (Magnet.zhReg.test(item.n)) {
  //         if (!classListToAdd.includes("is-uc")) {
  //           classListToAdd.push("is-zh");
  //         }
  //       }
  //       if (Magnet.crackReg.test(item.n) && !Magnet.wumaReg.test(item.n)) {
  //         if (!classListToAdd.includes("is-uc")) {
  //           classListToAdd.push("is-crack");
  //         }
  //       }

  //       if (classListToAdd.length) {
  //         newTagNode.classList.add(...classListToAdd);
  //         // 根据优先级更新 ball_color
  //         if (!ball_color || ball_list.indexOf(classListToAdd[0]) < ball_list.indexOf(ball_color)) {
  //           ball_color = classListToAdd[0];
  //         }
  //       }

  //       newTagNode.textContent = `${item.s} ${item.n.slice(0, 4)}`;
  //       container.appendChild(newTagNode);
  //     });

  //     if (ball_color) {
  //       rematch_ball.className = `rematch zy-match is-nomatch ${ball_color}`;
  //     } else { rematch_ball.className = `rematch zy-match is-normal`; }
  //   } else {
  //     rematch_ball.className = "rematch zy-match is-nomatch";
  //     const newTagNode = document.createElement('a');
  //     newTagNode.textContent = '暂无匹配';
  //     newTagNode.className = "is-nomatch";
  //     container.appendChild(newTagNode);
  //   }
  // };

  const matchAfter = ({ code, regex, target }, data) => {
    target.closest(MOVIE_SELECTOR).classList.add(parseCodeCls(code));
    const sources = data.filter((it) => regex.test(it.n));
    const len = sources.length;
    const container = target.querySelector(".zymatch-container");
    const rematch_ball = container.querySelector('.rematch');

    if (len) {
      // 用于追踪最高优先级的类
      let highestPriorityClass = "is-normal";
      const priorityOrder = ["is-uc", "is-wuma", "is-zh", "is-crack", "is-fourk", "is-normal"];

      sources.forEach((item) => {
        const newTagNode = document.createElement('a');
        newTagNode.title = item.n;
        newTagNode.dataset.pc = item.pc;
        newTagNode.dataset.cid = item.cid;
        newTagNode.dataset.fid = item.fid;
        newTagNode.dataset.size = item.s;
        newTagNode.dataset.time = item.t;
        newTagNode.className = `${TARGET_CLASS} zy-match is-normal`; // 默认添加 is-normal

        // 按优先级定义匹配规则
        const classConditions = [
          {
            condition: Magnet.zhReg.test(item.n) && Magnet.crackReg.test(item.n),
            className: "is-uc" // 中文破解组合类优先级最高
          },
          {
            condition: Magnet.fourkReg.test(item.n) && !Magnet.zhReg.test(item.n),
            className: "is-fourk"
          },
          {
            condition: Magnet.crackReg.test(item.n) && !Magnet.wumaReg.test(item.n),
            className: "is-crack"
          },
          {
            condition: Magnet.zhReg.test(item.n),
            className: "is-zh"
          },
          {
            condition: Magnet.wumaReg.test(item.n),
            className: "is-wuma"
          }
        ];

        // 移除默认的 is-normal，后续根据匹配结果重新添加
        newTagNode.classList.remove("is-normal");

        // 遍历匹配规则
        let hasMatch = false;
        let nodeClasses = [];

        classConditions.forEach(({ condition, className }) => {
          if (condition) {
            newTagNode.classList.add(className);
            nodeClasses.push(className);
            hasMatch = true;

            // 更新最高优先级的类
            const currentPriority = priorityOrder.indexOf(className);
            const highestPriority = priorityOrder.indexOf(highestPriorityClass);
            if (currentPriority < highestPriority) {
              highestPriorityClass = className;
            }
          }
        });

        // 特殊处理无码和中文破解共存的情况
        if (newTagNode.classList.contains("is-uc") && Magnet.wumaReg.test(item.n)) {
          newTagNode.classList.add("is-wuma");
          nodeClasses.push("is-wuma");
          // 由于is-uc的优先级最高，所以不需要更新highestPriorityClass
        }

        // 如果没有任何匹配则保留 is-normal
        if (!hasMatch && !newTagNode.classList.contains("is-wuma")) {
          newTagNode.classList.add("is-normal");
          nodeClasses.push("is-normal");
        }

        newTagNode.textContent = `${item.s} ${item.n.slice(0, 4)}`;
        container.appendChild(newTagNode);
      });

      // 根据最高优先级的类给rematch_ball添加对应的类
      rematch_ball.className = `rematch zy-match ${highestPriorityClass}`;

    } else {
      rematch_ball.className = "rematch zy-match is-nomatch";
      const newTagNode = document.createElement('a');
      newTagNode.textContent = '暂无匹配';
      newTagNode.className = "is-nomatch";
      container.appendChild(newTagNode);
    }
  };

  const matchBefore = (node) => {
    const target = node.querySelector(".movie-box");
    const code = node.querySelector(CODE_SELECTOR)?.textContent.trim();
    if (!code) return;

    let container = target.querySelector(".zymatch-container");

    if (container) {
      // 清空除rematch按钮以外的内容
      [...container.children].forEach((el, idx) => {
        if (idx !== 0) el.remove();
      });
    } else {
      // 第一次创建
      target.insertAdjacentHTML("beforeend", TARGET_HTML);
      container = target.querySelector(".zymatch-container");
    }

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
        await match115.setItem(prefix, sources);
        over(prefix, sources);
      } catch (err) {
        over(prefix);
        Util.print(err?.message);
      }

      loading = false;
      queue.shift();
      match();
    };

    const dispatch = async (node) => {
      const details = before?.(node);
      if (!details) return;

      const { code, prefix } = details;

      // 异步获取缓存数据
      const cache = (await match115.getItem(code)) ?? (await match115.getItem(prefix));
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

  CHANNEL.onmessage = ({ data }) => matchQueue(document.querySelectorAll(`.${parseCodeCls(data)}`));

  const publish = (code) => {
    matchQueue(document.querySelectorAll(`.${parseCodeCls(code)}`));
    CHANNEL.postMessage(code);
  };

  const matchCode = async (node) => {
    const movie = node.closest(MOVIE_SELECTOR);
    if (!movie) return;

    const code = movie.querySelector('.photo-info date')?.textContent.trim();
    const target = movie.querySelector('.rematch');
    if (!code || !target) return;

    const { codes, regex } = Util.codeParse(code);
    const UUID = crypto.randomUUID();
    target.dataset.uid = UUID;

    try {
      const { data = [] } = await Req115.filesSearchAllVideos(codes.join(" "));
      if (target.dataset.uid !== UUID) return;

      const sources = extractData(data.filter((it) => regex.test(it.n)));
      await match115.setItem(code, sources);
    } catch (err) {
      if (target.dataset.uid !== UUID) return;
      Util.print(err?.message);
    }

    publish(code);
  };

  const refresh = ({ type, target }) => {
    if (type === "click") return matchCode(target);
  };

  unsafeWindow[MATCH_API] = matchCode;
  listenClick(matchCode, refresh);
})();
// #endregion
