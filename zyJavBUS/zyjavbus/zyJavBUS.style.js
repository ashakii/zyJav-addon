// ==UserScript==
// @name            zyJavBUS.style
// @version         0.1
// @author          zyashakii
// @description     样式调整
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @resource        style https://raw.githubusercontent.com/ashakii/javlibs/refs/heads/main/Javbus/static/JavBUS.style.user.css
// @run-at          document-start
// @grant           GM_getResourceText
// @grant           GM_addStyle
// ==/UserScript==

// 修改JAVBUS页面的样式并替换图片
GM_addStyle(GM_getResourceText("style"));