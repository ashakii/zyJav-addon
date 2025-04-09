// ==UserScript==
// @name            zyJavBUS.replaceImage.deep
// @version         0.1
// @author          zyashakii
// @description     javbus替换缩略图为封面图
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @run-at          document-end
// ==/UserScript==

(function () {
  'use strict';
  function processImage(img) {
    let src = img.src || img.dataset.src;
    if (!src) return;

    // 匹配原始路径并替换
    const isThumb = /\/(imgs|pics)\/(thumb|thumbs)\//.test(src);
    if (!isThumb) return;

    const newSrc = src
      .replace(/\/(imgs|pics)\/(thumb|thumbs)\//, '/$1/cover/')
      .replace(/(\.jpe?g|\.png)$/i, '_b$1');

    // 同时替换src和data-src属性
    if (img.src) img.src = newSrc;
    if (img.dataset.src) img.dataset.src = newSrc;
  }

  function processItems() {
    document.querySelectorAll('#waterfall .item:not([data-processed])').forEach(item => {
      item.dataset.processed = 'true'; // 标记已处理
      const img = item.querySelector('.photo-frame img');
      if (img) processImage(img);
    });
  }

  // 初始化MutationObserver
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) processItems();
    });
  });

  // 安全初始化逻辑
  function init() {
    processItems(); // 初始处理
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  // 确保DOM已加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();