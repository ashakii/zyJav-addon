// ==UserScript==
// @name            zyJavBUS.replaceImage
// @version         0.1
// @author          zyashakii
// @description     JAVBUS替换图片
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @run-at          document-end
// ==/UserScript==

// JAVBUS替换图片

const fixLayoutAndImage = () => {
  const container = document.querySelector('#waterfall');
  if (!container) return;
  const items = container.querySelectorAll('.item');
  items.forEach(item => {
    // 替换图片地址
    const img = item.querySelector('.photo-frame img');
    if (img) {
      const originalSrc = img.src;
      if (originalSrc.match(/\/(imgs|pics)\/(thumb|thumbs)\//)) {
        img.src = ''; // 关键：先清空
        const newSrc = originalSrc
          .replace(/\/(imgs|pics)\/(thumb|thumbs)\//, '/$1/cover/')
          .replace(/(\.jpg|\.jpeg|\.png)$/i, '_b$1');
        img.src = newSrc;
      }
    }

  });
};

// 监听页面变化，防止页面异步加载内容后又覆盖
const observer = new MutationObserver(() => {
  const container = document.querySelector('#waterfall');
  if (container && container.querySelector('.item')) {
    fixLayoutAndImage();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// 页面首次加载也执行一次
fixLayoutAndImage();