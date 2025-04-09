// ==UserScript==
// @name            test
// @namespace       test@blc
// @version         0.0.1
// @author          blc
// @description     获取磁力链接
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @run-at          document-end
// @grant           unsafeWindow
// ==/UserScript==

(function () {
  const img = document.querySelector(".bigImage").src;
  const { gid, lang, uc } = unsafeWindow;
  const floor = Math.floor(1e3 * Math.random() + 1);
  if (!gid) return;

  unsafeWindow.$.ajax({
    type: "GET",
    url: `${location.origin}/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=${lang}&img=${img}&uc=${uc}&floor=${floor}`,
    success: console.log,
  });
})();

const getMags = (img) => {
  const { gid, lang, uc } = unsafeWindow;
  const floor = Math.floor(1e3 * Math.random() + 1);
  if (!gid) return;

  unsafeWindow.$.ajax({
    type: "GET",
    url: `${location.origin}/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=${lang}&img=${img}&uc=${uc}&floor=${floor}`,
    success: success,
  });
  return success;
}

async function getBusMagnets(dom = document) {
  return new Promise((resolve, reject) => {
    const img = dom.querySelector(".bigImage").src;
    const { gid, lang, uc } = unsafeWindow;
    const floor = Math.floor(1e3 * Math.random() + 1);
    if (!gid) return reject(new Error("gid is undefined"));

    unsafeWindow.$.ajax({
      type: "GET",
      url: `${location.origin}/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=${lang}&img=${img}&uc=${uc}&floor=${floor}`,
      success: (response) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");
        resolve(doc);
      },
      error: reject,
    });
  });
}

// 调用示例：
(async () => {
  const img = document.querySelector(".bigImage").src;
  try {
    const htmlDoc = await fetchHtmlDocument(img);
    console.log(htmlDoc);
  } catch (error) {
    console.error("Error fetching HTML document:", error);
  }
})();
