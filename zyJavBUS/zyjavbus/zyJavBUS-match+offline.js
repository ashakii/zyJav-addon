// ==UserScript==
// @name            zyJavBUS-match+offline
// @version         0.2
// @author          zyashakii
// @description     javbus-115 网盘匹配和离线
// @match           https://www.javbus.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=javbus.com
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Grant.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Magnet.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Req.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Offline.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Req115.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Util.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/libs/JavBUS.Verify115.lib.js
// @resource        pend https://github.com/ashakii/zyJav-addon/blob/main/assets/pend.png
// @resource        warn https://github.com/ashakii/zyJav-addon/blob/main/assets/warn.png
// @resource        error https://github.com/ashakii/zyJav-addon/blob/main/assets/error.png
// @resource        success https://github.com/ashakii/zyJav-addon/blob/main/assets/success.png
// @require         https://raw.githubusercontent.com/mozilla/localForage/master/dist/localforage.min.js
// @connect         aliyuncs.com
// @connect         javbus.com
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
// @grant           GM_removeValueChangeListener
// @grant           GM_addValueChangeListener
// @grant           GM_getResourceURL
// @grant           GM_notification
// @grant           GM_addElement
// @grant           window.close
// @updateURL       https://raw.githubusercontent.com/ashakii/zyJav-addon/main/zyJavBUS/zyjavbus/zyJavBUS-match+offline.js
// @downloadURL     https://raw.githubusercontent.com/ashakii/zyJav-addon/main/zyJavBUS/zyjavbus/zyJavBUS-match+offline.js
// @require         https://github.com/Tampermonkey/utils/raw/d8a4543a5f828dfa8eefb0a3360859b6fe9c3c34/requires/gh_2215_make_GM_xhr_more_parallel_again.js
// ==/UserScript==

Util.upStore();

// #region 自定义配置
//offline按钮配置,支持颜色is-uc,is-zh,iscrack,is-fourk,is-wuma,is-normal,is-nomatch支持女优,类别
const config = [
  {
    name: "云下载",
    color: "is-normal",
    inMagnets: true,
  },
  {
    name: "无码",
    rename: "${zh}${crack}[无码]${fourk} ${nvyou} ${code}",
    color: "is-wuma",
    inMagnets: true,
  },
  {
    name: "破解",
    color: "is-crack",
    inMagnets: true,
  },
  {
    name: "字幕",
    color: "is-zh",
    inMagnets: true,
  },
  {
    name: "中文破解",
    color: "is-uc",
    inMagnets: true,
  },
  {
    name: "番号",
    dir: "番号/${prefix}",
    color: "is-normal",
    inMagnets: true,
  },
  {
    name: "片商",
    dir: "片商/${maker}",
    color: "is-normal",
    inMagnets: true,
  },
  {
    name: "系列",
    dir: "系列/${series}",
    color: "is-normal",
    inMagnets: true,
  },
  {
    type: "genres",
    name: "${genre}",
    dir: "类别/${genre}",
    match: ["屁股", "連褲襪", "巨乳", "亂倫"],
    color: "is-normal",
  },
  {
    type: "actors",
    name: "${actor}",
    dir: "演员/${actor}",
    color: "is-normal",
  },
];

//match菜单rename配置
const renameConfig = {
  rename: "$zh$crack$wuma$fourk [$nvyou] $code",
  clean: true,
  cover: true,
}

const parseName = (name) => {
  return {
    zh: Magnet.zhReg.test(name),
    crack: Magnet.crackReg.test(name),
    fourk: Magnet.fourkReg.test(name),
    wuma: Magnet.wumaReg.test(name),
  }
};
const preRename = (details, matchRename) => {
  const { code, nvyou } = details;
  matchRename = matchRename.replaceAll("$nvyou", nvyou);
  matchRename = matchRename.replaceAll("$code", code);
  matchRename = matchRename.trim();
  return matchRename;
}
// #endregion

// #region 必要声明
const { HOST, STATUS_KEY, STATUS_VAL } = Verify115;
const { PENDING, VERIFIED, FAILED } = STATUS_VAL;
const transToByte = Magnet.useTransByte();
const MATCH_CLASS = "zy-match";
const OFFLINE_CLASS = "zy-offline";
const LOAD_CLASS = "is-loading";
const MATCH_DELAY = 750;
const VOID = "javascript:void(0);";
const CHANNEL = new BroadcastChannel(GM_info.script.name);
const MATCH_API = "reMatch";
// #endregion

// #region offline 115 功能函数
const getDetails = (dom = document) => {
  const infoNode = dom.querySelector(".col-md-3.info");
  if (!infoNode) return;

  const getValue = (keyword) => {
    const el = [...document.querySelectorAll('.info .header')]
      .find(e => e.textContent.includes(keyword));
    if (!el) return '';
    return (el.nextElementSibling || el.nextSibling)?.textContent.trim() || '';
  };
  let info = {};
  info.cover = dom.querySelector(".bigImage img")?.src ?? ""
  info.code = getValue('識別碼:');
  info.prefix = info.code.split('-')[0];
  info.codeFirstLetter = info.code[0].toUpperCase();
  info.title = dom.querySelector(".container h3")?.textContent.replace(info.code, "")?.trim() ?? "";
  info.date = getValue('發行日期:');
  info.length = getValue('長度:');
  info.director = getValue('導演:');
  info.studio = getValue('製作商:');
  info.label = getValue('發行商:');
  info.series = getValue('系列:');

  info.genres = [...document.querySelectorAll('.info .genre a')]
    .map(a => a.textContent.trim());

  info.actors = [...document.querySelectorAll('.star-box li .star-name')]
    .map(a => a.textContent.trim());

  info.nvyou = info.actors.slice(0, 4).join(" ").trim() || '未知演员♀';

  if (info.date) {
    const [year, month, day] = info.date.split("-");
    info.year = year;
    info.month = month;
    info.day = day;
  }

  return { ...Util.codeParse(info.code), ...info };
};

const renderAction = ({ color, index, idx, desc, name }) => {
  return `
  <button
    class="${OFFLINE_CLASS} ${color}"
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

const parseMagnet = (node) => {
  let [first, meta, date] = node.querySelectorAll("td");
  if (!first || !meta || !date) return;
  const link = first.querySelector("a");
  const url = link.href.split("&")[0];
  const name = link?.textContent?.trim() ?? "";
  const sizestr = meta?.textContent?.trim() ?? ""
  const size = transToByte(sizestr.split(",")[0]);
  const uc = Magnet.ucReg.test(name) || (Magnet.zhReg.test(name) && Magnet.crackReg.test(name));
  const crack = Magnet.crackReg.test(name);
  const zh = !!first.querySelector(".a.btn-warning") || Magnet.zhReg.test(name);
  const fourk = Magnet.fourkReg.test(name);
  const type = uc ? "uc" : zh ? "zh" : crack ? "crack" : fourk ? "fourk" : "normal";
  return {
    url,
    uc,
    crack,
    zh,
    size,
    fourk,
    sizestr,
    name,
    type,
  };
};

const newParseMagnet = (node) => {
  const mag = node.querySelector(".mag-name")
  const link = mag.querySelector("a");
  const url = link.href.trim();
  const name = link?.textContent?.trim() ?? "";
  const uc = link.className.includes('is-uc') || Magnet.ucReg.test(name) || (Magnet.zhReg.test(name) && Magnet.crackReg.test(name));
  const crack = link.className.includes('is-crack') || Magnet.crackReg.test(name);
  const zh = link.className.includes('is-zh') || Magnet.zhReg.test(name);
  const fourk = link.className.includes('is-fourk') || Magnet.fourkReg.test(name);
  return {
    url,
    uc,
    crack,
    zh,
    fourk,
    name,
  };
};

const getMagnets = (dom = document) => {
  return [...dom.querySelectorAll("#magnet-table tr")].slice(1).map(parseMagnet).toSorted(Magnet.magnetSort);
};

// #region 重构磁力表格
const parseMagnetTable = (magnets, inMagnetsStr) => {
  const html = `
        ${magnets.map(m => `
          <div class="mag-item flex">
            <div class="mag-name">
              <a class="is-${m.type}" href="${m.url}" title="${m.name}">${m.name}</a>
            </div>
            <div class="mag-info">
              <span class="size is-${m.type}">${m.sizestr}</span>
              <span class="is-${m.type}">${m.type.toUpperCase()}</span>
            </div>
            <div class="zy_btns">${inMagnetsStr}</div>
          </div>
        `).join('')}
  `;
  return html;
}
// #endregion

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
// #endregion

// #region match115 功能函数
//创建localforage数据库实例
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

const getClassName = (n) => {
  let classadd = "is-normal";
  switch (true) {
    case (Magnet.zhReg.test(n) && Magnet.crackReg.test(n)):
      classadd = "is-uc";
      break;
    case Magnet.zhReg.test(n):
      classadd = "is-zh";
      break;
    case Magnet.crackReg.test(n):
      classadd = "is-crack";
      break;
    case Magnet.fourkReg.test(n):
      classadd = "is-fourk";
  }
  return classadd;
}

// #region 点击事件
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
    if (target.classList.contains(MATCH_CLASS)) {
      e.preventDefault();
      e.stopPropagation();

      const action = actions[type];
      if (!action) return;

      const val = target.dataset[action.val];
      if (!val) return defaultAction?.(e);

      const tab = Grant.openTab(action.url.replaceAll("%s", val));
      tab.onclose = () => debounce(target);
    };
  };

  document.addEventListener("click", onclick);
  document.addEventListener("contextmenu", onclick);
};


// #endregion
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

// #endregion

// #region 详情页
(async function () {
  const CONT = document.querySelector(".row.movie");
  if (!CONT) return;

  const details = getDetails();
  const actions = Offline.getActions(config, details);

  const crateOfflineBtn = (actions) => {
    const inMagnets = actions.filter((item) => Boolean(item.inMagnets));

    return {
      btnStr: `${actions.map(renderAction).join("")}`,
      inMagnetsStr: inMagnets.map(renderAction).join("")
    }
  };

  const insertActionsToMagnet = (actions) => {
    const inMagnetsStr = crateOfflineBtn(actions).inMagnetsStr;

    const observer = new MutationObserver(() => {
      const table = document.querySelector('.movie #magnet-table');
      const zy_magnets = document.querySelector('.zymagnets-box')
      if (table && table.querySelector('a')) {
        observer.disconnect();
        const magnets = getMagnets().filter(m => m !== undefined);
        if (magnets.length) {
          const htmlString = parseMagnetTable(magnets, inMagnetsStr);
          zy_magnets.innerHTML = htmlString;
        } else {
          const magTable = document.querySelector('.zymagnets-box');
          magTable.innerHTML = "没有磁力链接!!!";
        }

        // insertMagnets();
        // window.addEventListener("JavDB.magnet", insertMagnets);
        // observer.disconnect();
        // console.log(getMagnets());
        // const magTable = parseMagnetTable(table);
        // previewBox.innerHTML = htmlString + magTable;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };


  const onstart = (target) => {
    Util.setFavicon("pend");
    target.classList.add(LOAD_CLASS);
    document.querySelectorAll(`.${OFFLINE_CLASS}`).forEach((item) => item.setAttribute("disabled", ""));
  };

  const onfinally = (target, res) => {
    document.querySelectorAll(`.${OFFLINE_CLASS}`).forEach((item) => item.removeAttribute("disabled"));
    target.classList.remove(LOAD_CLASS);
    if (!res) return;

    Grant.notify(res);
    Util.setFavicon(res);
    setTimeout(() => unsafeWindow[MATCH_API]?.(), MATCH_DELAY);
  };
  const onclick = (e) => {
    const { target } = e;
    if (!target.classList.contains(OFFLINE_CLASS)) return;

    e.preventDefault();
    e.stopPropagation();

    const action = findAction(target.dataset, actions);
    if (!action) return;

    const inMagnets = target.closest(".zymagnets-box .mag-item");
    const { magnetOptions, ...options } = Offline.getOptions(action, details);

    const magnets = inMagnets ? [newParseMagnet(inMagnets)] : Offline.getMagnets(getMagnets(), magnetOptions);
    if (!magnets.length) return;

    offline({
      options,
      magnets: magnets,
      onstart: () => onstart(target),
      onprogress: Util.setFavicon,
      onfinally: (res) => onfinally(target, res),
    });
  };

  insertActionsToMagnet(actions);
  document.addEventListener("click", onclick);


  // #region 构建匹配元素html
  const render = ({ pc, cid, fid, n, ...data }) => {
    const classadd = getClassName(n);
    return `
    <a href="${VOID}" class="is-rename ${classadd}">重命名</a>
    <a href="${VOID}" class="is-cover ${classadd}">上传封面</a>
    <a href="${VOID}" class="is-delviedo ${classadd}">删除视频</a>
    <a href="${VOID}" class="is-delfolder ${classadd}">删除文件夹</a>
    <a
      href="${VOID}"
      class="${MATCH_CLASS} ${classadd}"
      title="${n}"
      data-pc="${pc}"
      data-cid="${cid}"
      data-fid="${fid}"
    >
      ${data.s} ${n}
    </a>
    `;
  };
  // #endregion

  const matchCode = async ({ code, codes, regex }, { load, cont }) => {
    const UUID = crypto.randomUUID();
    load.dataset.uid = UUID;

    try {
      const { data = [] } = await Req115.filesSearchAllVideos(codes.join(" "));
      if (load.dataset.uid !== UUID) return;
      const matched = document.querySelectorAll('.zymatch-item');
      if (matched.length) {
        matched.forEach((item) => item.remove());
      };

      const sources = extractData(data.filter((it) => regex.test(it.n)));
      if (!sources.length) {
        cont.classList.add("is-nomatch");
        cont.textContent = "暂无匹配";
        await match115.setItem(code, sources);
        return;
      }
      sources.forEach((source) => {
        const newTagNode = document.createElement('div')
        newTagNode.classList.add("zymatch-item");
        const matchHtml = render(source);
        newTagNode.innerHTML = matchHtml;
        load.appendChild(newTagNode);
      })
      cont.textContent = `已匹配${sources.length}个`;
      cont.classList.add("is-normal");
      await match115.setItem(code, sources);
    } catch (err) {
      if (load.dataset.uid !== UUID) return;
      Util.print(err?.message);
    }
  };

  // #region 构造zyjav-box原始html
  const addBlock = () => {
    CONT.insertAdjacentHTML(
      "afterend",
      `<div class="zy-box flex-col">
        <div class="zyjavbus-box flex-col">
          <div class="zyoffline-box flex-col">
            <div class="zy_btns">
              <button class="zy-rematch" title='点我刷新'>正在匹配</button>
                ${crateOfflineBtn(actions).btnStr}
              </div>
            </div>
            <div class="zymatch-box flex-col"></div>
          </div>
          <div class="zymagnets-box flex-col">正在加载磁力信息....</div>
        </div>`,
    );

    return {
      load: document.querySelector(".zymatch-box"),
      cont: document.querySelector(".zy-rematch"),
    };
  };
  // #endregion

  const code = CONT.querySelector(".col-md-3.info p span+span").textContent.trim();
  const codeDetails = Util.codeParse(code);
  const block = addBlock();
  const matcher = () => matchCode(codeDetails, block);

  matcher();
  listenClick(matcher);
  unsafeWindow[MATCH_API] = matcher;

  const refresh = ({ target }) => {
    if (target.classList.contains('.zy-rematch')) return;
    target.textContent = '正在刷新...';
    matcher();
  };

  const zy_tools = async ({ target }) => {
    const details = getDetails();
    const { cover, codes, code } = details;
    const zymatch_item = target.closest('.zymatch-item');
    const zymatch_box = target.closest('.zymatch-box');
    const match_item = zymatch_item.querySelector('.zy-match');
    const { cid, fid } = match_item.dataset;
    const file_name = match_item.title;
    const filter = ({ s }) => s > 157286400;
    if (target.classList.contains('is-rename')) {
      const rename = preRename(details, renameConfig.rename);
      const renameTxt = Offline.defaultRenameTxt;
      const { videos } = await Req115.localVerify(cid, codes, filter);
      const { zh, crack, fourk, wuma } = parseName(file_name);
      if (renameConfig.clean) await Req115.handleClean(videos, cid);
      await Req115.handleRename(videos, cid, { rename, renameTxt, zh, crack, fourk, wuma });
      if (renameConfig.cover) {
        const { data } = await Req115.handleCover(cover, cid, `${code}.cover.jpg`);
        if (data?.file_id) Req115.filesEdit(cid, data.file_id);
      }
      matcher();
    }
    if (target.classList.contains('is-cover')) {
      const allfiles = await Req115.filesAll(cid);
      const cover_data = allfiles.data;
      console.log(cover_data);

      const cover = cover_data.filter((it) => it.n.includes('cover'));
      if (cover.length) return Grant.notify({ icon: "error", msg: "已有封面!" });
      const { data } = await Req115.handleCover(cover, cid, `${code}.cover.jpg`);
      if (data?.file_id) Req115.filesEdit(cid, data.file_id);
    }
    if (target.classList.contains('is-delviedo')) {
      Req115.rbDelete([fid], cid);
      zymatch_box.remove();
      Grant.notify({ icon: "success", msg: "删除视频成功!" });

    }
    if (target.classList.contains('is-delfolder')) {
      Req115.rbDelete([cid], cid);
      zymatch_box.remove();
      Grant.notify({ icon: "success", msg: "删除文件夹成功!" });
    }
  }
  document.querySelector(".zymatch-box").addEventListener("click", zy_tools);
  block.cont.addEventListener("click", refresh);
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
        newTagNode.className = `${MATCH_CLASS} zy-match is-normal`; // 默认添加 is-normal

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



(function () {
  let currentIframe = null;

  document.addEventListener('mouseover', function (e) {
    const item = e.target.closest('.item');
    if (!item) return;

    const onKeyDown = (ev) => {
      if (ev.key.toLowerCase() === 'z') {
        showIframe(item);
        document.removeEventListener('keydown', onKeyDown);
      }
    };
    document.addEventListener('keydown', onKeyDown, { once: true });

    item.addEventListener('mouseleave', () => {
      document.removeEventListener('keydown', onKeyDown);
    }, { once: true });
  });

  function showIframe(item) {
    const link = item.querySelector('a');
    if (!link) return;

    if (currentIframe) currentIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'iframeBox';
    iframe.src = link.href;

    iframe.onload = () => {
      try {
        const style = iframe.contentDocument.createElement('style');
        style.innerHTML = `
                    /* 隐藏指定元素示例 */
                    .navbar,h3,.row.movie,h4,#related-waterfall,footer {
                        display: none !important;
                    }
                `;
        iframe.contentDocument.head.appendChild(style);
      } catch (err) {
        console.warn('iframe style insert error', err);
      }
    };

    document.body.appendChild(iframe);
    currentIframe = iframe;

    // 点击空白关闭
    const onClick = (ev) => {
      if (!iframe.contains(ev.target)) {
        iframe.remove();
        currentIframe = null;
        document.removeEventListener('click', onClick);
      }
    };
    setTimeout(() => { // 防止立即触发关闭
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', e => e.key === 'Escape' && onClick(e));
    }, 100);
  }
})();
