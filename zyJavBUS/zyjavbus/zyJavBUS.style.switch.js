// ==UserScript==
// @name            zyJavBUS.style.switch
// @version         0.2
// @author          zyashakii
// @description     样式调整
// @match           https://www.javbus.com/*
// @icon            https://www.javbus.com/favicon.ico
// @resource        zystyle https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/zyJavbus.zystyle.css
// @resource        style https://raw.githubusercontent.com/ashakii/zyJav-addon/refs/heads/main/zyJavBUS/static/JavBUS.style.css
// @updateURL       https://raw.githubusercontent.com/ashakii/zyJav-addon/main/zyJavBUS/zyjavbus/zyJavBUS.style.switch.js
// @downloadURL     https://raw.githubusercontent.com/ashakii/zyJav-addon/main/zyJavBUS/zyjavbus/zyJavBUS.style.switch.js
// @run-at          document-start
// @grant           GM_getResourceText
// @grant           GM_addStyle
// ==/UserScript==

// 修改JAVBUS页面的样式
const styles = {
  style3: `
    #waterfall .item:not(.item:has(.avatar-box)) {
      max-width: 30%;
      min-width: 260px;
      display: flex;
    }
  `,
  style4: `
    #waterfall .item:not(.item:has(.avatar-box)) {
      max-width: 23%;
      min-width: 260px;
      display: flex;
    }
  `,
  style5: `
    #waterfall .item:not(.item:has(.avatar-box)) {
      max-width: 19%;
      min-width: 260px;
      display: flex;
    }
  `,
  style6: `
    #waterfall .item:not(.item:has(.avatar-box)) {
      max-width: 15%;
      min-width: 260px;
      display: flex;
    }
  `,
};

GM_addStyle(GM_getResourceText("zystyle"));
GM_addStyle(GM_getResourceText("style"));
// GM_addStyle(styles.style3);
// GM_addStyle(styles.style4);
// GM_addStyle(styles.style5);
GM_addStyle(styles.style6);
