// ==UserScript==
// @name            zyJavBUS.style.switch
// @version         0.1
// @author          zyashakii
// @description     样式调整
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @resource        zystyle https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/zyJavbus.zystyle.css
// @resource        style3 https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/JavBUS.style3.css
// @resource        style4 https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/JavBUS.style4.css
// @resource        style5 https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/JavBUS.style5.css
// @resource        style6 https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/JavBUS.style6.css
// @updateURL       https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/zyjavbus/zyJavBUS.style.switch.js
// @run-at          document-start
// @grant           GM_getResourceText
// @grant           GM_addStyle
// ==/UserScript==

// 修改JAVBUS页面的样式
GM_addStyle(GM_getResourceText("zystyle"));
GM_addStyle(GM_getResourceText("style3")); //3列
//GM_addStyle(GM_getResourceText("style4")); //4列
//GM_addStyle(GM_getResourceText("style5")); //5列
//GM_addStyle(GM_getResourceText("style6")); //6列
