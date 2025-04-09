// ==UserScript==
// @name            JavDB.style
// @namespace       JavDB.style@blc
// @version         0.0.2
// @author          blc
// @description     样式调整
// @match           https://javdb.com/*
// @icon            https://javdb.com/favicon.ico
// @resource        style https://raw.githubusercontent.com/ashakii/zyjavdb/refs/heads/main/static/JavDB.style.user.css
// @run-at          document-start
// @grant           GM_getResourceText
// @grant           GM_addStyle
// ==/UserScript==

GM_addStyle(GM_getResourceText("style"));
