// ==UserScript==
// @name         zyjavDb.addon+
// @version      2025-03-01
// @description  访问女优加边框,重命名,显示磁力资源信息
// @author       zyashakii
// @match        https://javdb.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=javdb.com
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Grant.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Magnet.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Req115.lib.js
// @require         https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/libs/JavPack.Util.lib.js
// @connect         jdbstatic.com
// @connect         aliyuncs.com
// @connect         115.com
// @connect         self
// @connect         localhost
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           GM_openInTab
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_deleteValue
// @grant           GM_notification
// ==/UserScript==

const { pathname: PATHNAME } = location;
const IS_ACTOR = PATHNAME.startsWith("/actors");
const IS_VIDEO = PATHNAME.startsWith("/v/");
const IS_ITEMS = PATHNAME.startsWith("/items");
const MOVIE_SELECTOR = ".movie-list .item";
const TARGET_CLASS = "zy-match";
const MATCH_API = "reMatch";
const MATCH_DELAY = 750;
const requestDelay = 1000; // 请求延迟时间（毫秒）
const cacheTTL = 48 * 60 * 60 * 1000; // 缓存有效时间 72小时
const faker = ['VR', '糞便', '變性者', '精選綜合', '食糞'];
const fuck = false;
const top_pid = "3108915122903448717";
const wuma_pid = "3108914385746132896";
const gongyan_pid = "3108912314330381523";
const uc_pid = "3108911001840385991"; //UC/AAAAAAAAA
const fourk_pid = "3108911728822320269";
const zh_pid = "3106756794941177855";
const crack_pid = "3108911351183965861";
const normal_pid = "3108911913438805883";
const def_pid = "3107567083261525296"; ///0000小姐姐仓库/0X08[TOP250]片库/AAAA

//数据库相关
const DB_NAME = "JavDBCache";
const DB_VERSION = 1;
const STORE_NAME = "movieData";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("❌ IndexedDB 打开失败:", event.target.error);
      reject("IndexedDB 打开失败");
    };

    request.onsuccess = (event) => {
      console.log("✅ IndexedDB 打开成功");
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log("📌 创建新存储:", STORE_NAME);
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};


const saveData = async (id, data) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put({ id, ...data });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log(`✅ 数据 ${id} 已存入 IndexedDB`, data);
      resolve(true);
    };
    transaction.onerror = (event) => reject("❌ 保存失败: " + event.target.error);
  });
};


const getData = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      console.log(`🔍 尝试获取 IndexedDB 数据 ${id}`, request.result);
      resolve(request.result || null);
    };
    request.onerror = (event) => {
      console.error("❌ 获取失败: " + event.target.error);
      resolve(null);
    };
  });
};

const deleteData = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject("删除失败: " + event.target.error);
  });
};



const transToByte = Magnet.useTransByte();
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
    gg5: Magnet.gg5Reg.test(name),
    torr: Magnet.torrentReg.test(name),
    wuma: Magnet.wumaReg.test(name),
    meta,
    name,
  };
};

const getMagnets = (dom = document) => {
  return [...dom.querySelectorAll("#magnets-content > .item")].map(parseMagnet).toSorted(Magnet.magnetSort);
};
const getDetails = (dom = document) => {
  const infoNode = dom.querySelector(".movie-panel-info");
  if (!infoNode) return;

  const info = { cover: dom.querySelector(".video-cover")?.src ?? "" };
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
        info.serieshref = item.querySelector(".value a")?.href;
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
          .slice(0, 4);
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

  info.gongyan = info.actors?.length > 1 && !info.genres?.includes("精選綜合");
  info.wuma = info.genres?.includes("無碼流出") || dom.querySelector(".title.is-4").textContent.includes("無碼") || fc2;
  info.fake = info.genres?.some(genre => faker.includes(genre));

  // 获取磁力链接信息
  info.magnets = getMagnets(dom);

  if (info.magnets && info.magnets.length > 0) {
    info.tagNames = {
      UC: [], // 既匹配字幕又匹配破解
      WUMA: [],
      ZH: [], // 仅匹配字幕
      FOURK: [], // 匹配 4K 或 size/time > 393,529,344
      CRACK: [], // 仅匹配破解
      BIG: [],
      NORMAL: [], // 既不匹配字幕也不匹配破解
    };

    // 用于记录已经分配到高优先级组的磁力链接
    const assignedMagnets = new Set();

    info.magnets.forEach((magnet) => {
      const { zh, crack, fourk, uc, wuma, torr, gg5, size, url, meta, name, number } = magnet;

      if (assignedMagnets.has(url)) return; // 如果已经分配过，跳过
      const nameTXT = `${meta} ${name}`

      if (uc || (zh && crack)) {
        info.tagNames.UC.push(nameTXT);
      } else if (wuma) {
        info.tagNames.WUMA.push(nameTXT);
      } else if (crack) {
        info.tagNames.CRACK.push(nameTXT);
      } else if (zh && torr || gg5) {
        info.tagNames.ZH.push(nameTXT);
      } else if (fourk || (info.time && size / info.time > 123456789)) {
        info.tagNames.FOURK.push(nameTXT);
      } else if (number < 10 && size > 3 * 1024 ** 3) {
        info.tagNames.NORMAL.push(nameTXT);
      }

      assignedMagnets.add(url); // 标记为已分配
    });
  }

  return { ...Util.codeParse(code), ...info };
};


console.log(getDetails());

const reName = (cid, fid, cover, code, renametxt, have_cover) => {
  if (!have_cover) Req115.handleCover(cover, cid, `${code}.cover.jpg`);
  const cidObj = { [cid]: renametxt };
  const fidObj = { [fid]: renametxt };
  Req115.filesBatchRename(cidObj);
  Req115.filesBatchRename(fidObj);
};

async function loadItemDetails(movie, retryCount = 0) {
  try {
    const link = movie.querySelector("a").getAttribute("href");
    const mid = link.split('/').pop();
    console.log(`🔍 处理影片: ${mid}`);

    const now = Date.now();

    // 获取缓存
    const cachedData = await getData(`mags-${mid}`);
    if (cachedData && (now - cachedData.timestamp < cacheTTL)) {
      console.log(`✅ 读取到有效缓存: ${mid}`, cachedData);
      const { series, serieshref, actorLinks, tagNames, gongyan, fake } = cachedData;
      if (gongyan) movie.classList.add("gongyan");
      if (fake) movie.classList.add("fake");
      creatactorlink(movie, actorLinks);
      creatserieslink(movie, series, serieshref);
      displayTags(movie, tagNames);
      return;
    }

    console.log(`🚀 无有效缓存，开始请求数据: ${mid}`);
    const dom = await Req.request(link);
    const detail = getDetails(dom);
    const { series, serieshref, actorLinks, tagNames, nvyou, cover, gongyan, fake, ...others } = detail;

    if (gongyan) movie.classList.add("gongyan");
    if (fake) movie.classList.add("fake");

    creatactorlink(movie, actorLinks);
    creatserieslink(movie, series, serieshref);

    // 存入 IndexedDB
    await saveData(`mags-${mid}`, {
      timestamp: now,
      tagNames, actorLinks, nvyou, cover, series, serieshref, gongyan, fake, ...others
    });

    console.log(`✅ 数据存入 IndexedDB: ${mid}`);

    displayTags(movie, tagNames);
  } catch (err) {
    console.error(`❌ 处理影片 ${mid} 失败:`, err);
    if (retryCount < 3) {
      console.log(`⏳ 重试 (${retryCount + 1}/3)`);
      await new Promise(r => setTimeout(r, 1000));
      return loadItemDetails(movie, retryCount + 1);
    }
  }
}


//刷新磁力标签
async function retag(movie) {
  const link = movie.querySelector("a").getAttribute("href");
  const mid = link.split('/').pop(); // 从链接中提取唯一标识
  const dom = await Req.request(link);

  const { tagNames } = getDetails(dom);
  GM_setValue(`mags-${mid}`, { tagNames: tagNames });
  displayTags(movie, tagNames);
}
function displayTagsName(tagNames) {
  if (!tagNames || tagNames.length === 0) {
    return undefined;
  }
  const firstTag = tagNames[0];
  if (!firstTag) {
    return undefined;
  }
  const name = firstTag.includes(',') ? firstTag.split(',')[0].trim() : firstTag.split(' ')[0].trim();
  return name;
}
function displayTags(movie, tagNames) {
  const tagsDiv = movie.querySelector(".tags.has-addons");
  if (!tagsDiv || tagNames == undefined) return;
  const tagspan = tagsDiv.querySelector("span");
  if (tagspan) {
    tagspan.classList.add("x-retag");
    tagspan.innerHTML = "刷新标签";
  }
  createTag(tagsDiv, displayTagsName(tagNames.NORMAL), tagNames.NORMAL, 'is-success');
  createTag(tagsDiv, displayTagsName(tagNames.FOURK), tagNames.FOURK, 'is-fourk');
  createTag(tagsDiv, displayTagsName(tagNames.CRACK), tagNames.CRACK, 'is-info');
  createTag(tagsDiv, displayTagsName(tagNames.ZH), tagNames.ZH, 'is-warning');
  createTag(tagsDiv, displayTagsName(tagNames.WUMA), tagNames.WUMA, 'is-wuma');
  createTag(tagsDiv, displayTagsName(tagNames.UC), tagNames.UC, 'is-danger');
}

//创建资源数量标签
function createTag(tagsDiv, label, names, className) {
  if (names.length > 0) {
    const tag = document.createElement('span');
    tag.className = `tag ${className} x-tag`;
    tag.innerHTML = `${label} (${names.length})`;
    tag.title = names.join('\n');
    tag.style.marginLeft = "2px";
    tagsDiv.appendChild(tag);
  }
}

//创建系列链接
function creatserieslink(movie, series, serieshref) {
  if (!series) return;
  const tagsDiv = movie.querySelector(".meta");
  const scoreDiv = movie.querySelector(".score");
  if (tagsDiv) {
    tagsDiv.insertAdjacentHTML('beforeend', `
      <a class="meta is-addon" href= ${serieshref}?f=cnsub style="margin-left: 2px;">系列:${series}</a>
      `)
  } else {
    scoreDiv.insertAdjacentHTML('afterend', `
      <a class="meta is-addon" href= ${serieshref}?f=cnsub style="margin-left: 2px;">系列:${series}</a>
      `)
  }
}

//创建女优超链接
function creatactorlink(movie, actors) {
  const valueSpan = movie.querySelector('.score .value');
  valueSpan.innerHTML = valueSpan.querySelector('.score-stars').outerHTML;
  if (Array.isArray(actors)) { // 检查 actors 是否为数组
    const actorTxt = actors.map(actor => `<a class="is-addon" href="${actor.href}?t=c&sort_type=0" target=_blank>${actor.name}♀</a>`).join(' ');
    valueSpan.insertAdjacentHTML('beforeend', actorTxt);
  }
};


//test重命名名称tag
const renameTags = "${top250}${wuma}${gongyan}${zh}${crack}${fourk}"
const nameTagTest = (name, tags, size, gongyan, wuma, top250) => {
  tags = tags.replaceAll("${top250}", top250 ? "[TOP250]" : "");
  tags = tags.replaceAll("${wuma}", wuma || Magnet.wumaReg.test(name) ? "[无码]" : "");
  tags = tags.replaceAll("${zh}", Magnet.zhReg.test(name) ? "[中字]" : "");
  tags = tags.replaceAll("${crack}", (Magnet.crackReg.test(name) && !wuma) ? "[破解]" : "");
  tags = tags.replaceAll("${fourk}", Magnet.fourkReg.test(name) || transToByte(size) > 8.6 * 1024 ** 3 ? "[4K]" : "");
  tags = tags.replaceAll("${gongyan}", gongyan ? "[共演]" : "");
  tags = tags.trim();
  return tags;
};


//给访问过的女优添加边框
(function () {
  if (!IS_ACTOR) return;
  // 获取所有演员链接
  const actorLinks = document.querySelectorAll("#actors a");

  actorLinks.forEach((link) => {
    link.href = `${link.href}?t=c&sort_type=0`;
    // 提取演员 ID
    const actorId = link.getAttribute("href").split("/").pop();

    // 获取访问次数
    const visitCount = GM_getValue(`visit_count_${actorId}`, 0);

    // 判断是否需要添加边框
    if (visitCount >= 1) {
      const actorBox = link.closest(".box.actor-box");
      if (actorBox) {
        actorBox.style.border = "2px solid red";
      }
    }

    // 监听点击事件，记录访问次数
    link.addEventListener("click", () => {
      const newVisitCount = visitCount + 1;
      GM_setValue(`visit_count_${actorId}`, newVisitCount);

      if (newVisitCount >= 1) {
        const actorBox = link.closest(".box.actor-box");
        if (actorBox) {
          actorBox.style.border = "2px solid red";
        }
      }
    });

  });
})();

// 自动加载详情 gpt
(function () {
  if (IS_VIDEO) return;

  const MOVIE_SELECTOR = ".movie-list .item";
  const VISIBLE_RANGE = 10; // 观察当前视口 + 后续6个元素
  let debounceTimer;

  // 动态获取视口内及后续未加载的元素
  const getVisibleAndNextElements = () => {
    const allElements = Array.from(document.querySelectorAll(MOVIE_SELECTOR));
    const unloadedElements = allElements.filter(el => !el.dataset.loaded);

    // 获取当前视口内的未加载元素
    const elementsInViewport = unloadedElements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight && rect.bottom > 0; // 判断元素是否在视口内
    });

    // 返回当前视口内及后续元素
    const firstVisibleIndex = unloadedElements.indexOf(elementsInViewport[0]);
    return unloadedElements.slice(firstVisibleIndex, firstVisibleIndex + VISIBLE_RANGE);
  };
  // 初始化观察者
  let observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting || target.dataset.loaded) return;

      loadItemDetails(target);
      target.dataset.loaded = "true";
      observer.unobserve(target); // 加载后停止观察
    });
  }, {
    rootMargin: '0px 0px 300px 0px',
    threshold: 0.1
  });

  // 初始化 observer 只需一次
  const initObserver = () => {
    const elementsToObserve = getVisibleAndNextElements();
    if (!elementsToObserve.length) return;

    elementsToObserve.forEach(el => observer.observe(el));
  };


  // 防抖函数
  const debounce = (func, delay) => {
    return () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(func, delay);
    };
  };

  // 首次加载
  initObserver();

  // 监听滚动事件（停止滚动1秒后触发）
  window.addEventListener("scroll", debounce(initObserver, 300));
  // 监听点击事件（重新加载）
  document.body.addEventListener("click", (e) => {
    const targetRetag = e.target.closest('.x-retag');
    if (targetRetag) {
      // 专门处理 .x-retag 的逻辑
      e.preventDefault();
      e.stopPropagation();

      const movie = targetRetag.closest('div.item');
      if (movie) {
        const link = movie.querySelector("a").getAttribute("href");
        const mid = link.split('/').pop();

        const tagsDiv = movie.querySelector(".tags.has-addons");
        if (tagsDiv) {
          tagsDiv.innerHTML = `<span class="tag is-warning x-retag">刷新标签</span>`;
        }

        GM_deleteValue(`mags-${mid}`);
        retag(movie);  // 重新加载详情
      }
      return;
    }
  });
})();

// 鼠标悬停重命名
(function () {
  let hoverTarget = null;

  // 封装通知函数
  const notify = (message, success = true) => {
    GM_notification({
      text: message,
      title: success ? '操作成功' : '操作失败',
      timeout: 1000,
      image: success ?
        'https://cdn-icons-png.flaticon.com/128/7518/7518748.png' :
        'https://cdn-icons-png.flaticon.com/128/1828/1828843.png'
    });
  };

  const onMouseEnter = (e) => {
    hoverTarget = e.target;
  };

  const onMouseLeave = () => {
    hoverTarget = null;
  };

  const onKeyDown = async (e) => {
    if (!hoverTarget) return;

    const item = hoverTarget.closest(MOVIE_SELECTOR);
    if (!item) return;

    try {
      const key = e.key.toLowerCase();
      let pid;

      // 根据按键设置 pid
      if (key === 'q') pid = uc_pid;
      else if (key === 'w') pid = zh_pid;
      else if (key === 'e') pid = crack_pid;
      else if (key === 'r') pid = def_pid;

      if (['q', 'w', 'e', 'r'].includes(key)) {
        await handleRenameKey(hoverTarget, item, pid); // 调用重命名函数并传递 pid
      } else {
        switch (key) {
          case 'd':
          case 'f':
            await handleDeleteKey(key, hoverTarget);
            break;
          case 'a':
            await handleMoveKey(hoverTarget);
            break;
          case 'c':
            await handleCopyKey(hoverTarget);
            break;
          case 's':
            await handleStrmKey(hoverTarget, item);
            break;
        }
      }

      refreshMatchApi(hoverTarget);
    } catch (error) {
      handleError(error);
    }
  };


  // 公共工具函数
  const refreshMatchApi = (target) => {
    setTimeout(() => unsafeWindow[MATCH_API]?.(target), MATCH_DELAY);
  };

  //创建strm文件
  const handleStrmKey = async (target, item) => {
    const code = item.querySelector(".video-title strong").textContent.trim();
    const { pc } = target.dataset;
    const title = target.title.trim();

    const strmobj = { [pc]: title };
    const strmdir = ["1X11暂时存储"];
    await Req115.createStrm(strmobj, strmdir, code);
    notify(`成功创建strm文件${title}`);
  };
  // 删除处理
  const handleDeleteKey = async (key, target) => {
    const idType = key === 'd' ? 'cid' : 'fid';
    const id = target.dataset[idType];
    const pc = target.dataset.pc;
    if (!id) {
      notify('未找到文件CID', false);
      return;
    }
    await handleDelete(id);
    if (key === 'd') Req115.deleteStrm(pc);
  };

  // 移动处理
  const handleMoveKey = async (target) => {
    const cid = target.dataset.cid;
    if (!cid) {
      notify('未找到文件CID', false);
      return;
    }
    await handleMove(cid);
  };

  // 复制处理
  const handleCopyKey = async (target) => {
    const item = target.closest(MOVIE_SELECTOR);
    const strong = item.querySelector('.video-title strong').textContent.trim();
    try {
      await navigator.clipboard.writeText(strong);
      console.log(`文本已复制到剪切板: ${strong}`);
    } catch (err) {
      console.error('无法复制文本: ', err);
    }
  };

  // 重命名处理
  const handleRenameKey = async (target, item, pid) => {
    const url = item.querySelector("a").href;
    const mid = url.split('/').pop();
    // let details = GM_getValue(`mags-${mid}`);
    const details = await getData(`mags-${mid}`);

    if (!details) {
      const dom = await Req.request(url);
      details = getDetails(dom);
    }

    const { cid, fid, pc, size } = target.dataset;
    const { code, cover, nvyou = "未知演员♀", gongyan, wuma, title, actorLinks, serieshref, series, year } = details;
    const Wuma = wuma || Magnet.wumaReg.test(target.title) ? true : false;
    let actorLinksHtml = '';
    let file_desc = '';
    if (actorLinks) {
      actorLinksHtml = actorLinks.map(actor => `
      <p>
        <a href="${actor.href}" target="_blank" textvalue="${actor.href}" 
          style="background-color: rgb(255, 255, 255); color: rgb(242, 2, 87);">
          <span style="background-color: rgb(255, 255, 255); color: rgb(242, 2, 87);">
            <strong>${actor.name}</strong>
          </span>
        </a>
      </p>
    `).join('');

      file_desc = `
      <p><a href="${url}" target="_blank">${url}</a></p>
      <hr k_oof_k="line" style="border:0; border-top:1px #ccc dashed; height:0; overflow: hidden; margin: 10px 0;">
      <p><strong>${title}</strong></p>
      <hr k_oof_k="line" style="border:0; border-top:1px #ccc dashed; height:0; overflow: hidden; margin: 10px 0;">
      ${actorLinksHtml}
    `;
      if (series) file_desc += `<p>
          <a href="${serieshref}" target="_blank" textvalue="${serieshref}" 
            style="background-color: rgb(255, 255, 255); color: rgb(255, 6, 180);">
            <span style="background-color: rgb(255, 255, 255); color: rgb(255, 6, 180);">
              <strong>${series}</strong>
            </span>
          </a>
        </p>`;
    }

    const top250 = PATHNAME.includes('rankings') || details.top250;
    const episodeMatch = target.title.match(/-cd\d+/);
    const episode = episodeMatch ? episodeMatch[0] : '';
    const nameTags = nameTagTest(target.title, renameTags, size, gongyan, Wuma, top250);

    const renametxt = `${nameTags} [${year}] [${nvyou}] ${code}${episode}`;
    const strmobj = { [pc]: renametxt };
    const strmdir = ["1X11暂时存储"];

    const { data } = await Req115.filesAll(cid);
    const rmfid = data.filter(item => {
      // 如果 episodeMatch 存在并且当前 item.title 包含 episodeMatch，则排除该 item
      // || item.n.includes("cover") 删除封面
      if (episodeMatch && item.n.includes('-cd') || item.n.includes("cover")) {
        return false; // 排除该分集
      }
      return item.fid !== fid; // 排除当前的 fid
    }).map(item => item.fid);

    if (rmfid.length) {
      await Req115.rbDelete(rmfid, cid);
    }

    const have_cover = data.some(item => item.n.includes("cover"));

    await Promise.all([
      reName(cid, fid, cover, code, renametxt, have_cover),
      Req115.descEdit(cid, file_desc),
      Req115.descEdit(fid, file_desc),
      //Req115.createStrm(strmobj, strmdir, code),
      await handleMove(cid, pid)
    ]);



    notify('重命名成功!', true);
  };

  // 处理删除操作的函数
  const handleDelete = async (id) => {
    await Req115.rbDelete(id);
    notify(`成功删除文件(CID: ${id.slice(0, 6)}...)`);
  };

  // 处理移动操作的函数
  const handleMove = async (cid, pid) => {
    await Req115.filesMove(cid, pid);
    //notify(`成功移动文件夹(CID: ${cid.slice(0, 6)}...)`);
  };

  // 统一的错误处理函数
  const handleError = (error) => {
    notify(`操作失败: ${error.message || '未知错误'}`, false);
    console.error('操作失败:', error);
  };

  // 插入“自动重命名”按钮
  const button = document.createElement('button');
  button.innerText = '自动重命名';
  button.classList.add("btn-rename");
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px';
  button.style.padding = '10px';
  button.style.zIndex = '1000';
  document.body.appendChild(button);

  // 延时函数
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 自动重命名功能
  const autoRename = async () => {
    const items = document.querySelectorAll('a.zy-match'); // 获取所有 a.zy-match 元素
    for (const item of items) {
      const title = item.title;
      let pid;
      if (item.classList.contains("is-top250")) {
        pid = top_pid;
      } else if (item.classList.contains("is-gongyan")) {
        pid = gongyan_pid;
      } else if (item.classList.contains("is-wuma")) {
        pid = wuma_pid;
      } else if (item.classList.contains("is-danger")) {
        pid = uc_pid;
      } else if (item.classList.contains("is-fourk")) {
        pid = fourk_pid;
      } else if (item.classList.contains("is-warning")) {
        pid = zh_pid;
      } else if (item.classList.contains("is-info")) {
        pid = crack_pid;
      } else {
        pid = normal_pid;
      }

      // 检查是否包含年份，跳过包含年份的项
      if (/\[\d{4}\]/.test(title)) continue;

      // 获取 item 的其他必要数据
      const hoverTarget = item;
      const item_box = hoverTarget.closest(MOVIE_SELECTOR);
      await handleRenameKey(hoverTarget, item_box, pid); // 调用重命名函数

      // 延迟 1 秒，避免被屏蔽
      await delay(1000);
    }

    notify('自动重命名完成!', true);
    console.log('自动重命名完成!');

  };

  // 绑定按钮点击事件
  const renameBtn = document.querySelector('.btn-rename');
  renameBtn.addEventListener('click', autoRename);


  document.addEventListener("mouseenter", onMouseEnter, true);
  document.addEventListener("mouseleave", onMouseLeave, true);
  document.addEventListener("keydown", onKeyDown);
})();

