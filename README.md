# 使用说明

修改自 [bolin 大佬的 JavPack 项目](https://github.com/bolin-dev/JavPack?tab=readme-ov-file)  
感谢大佬!!

---

## JAVBUS 使用相关

1. 安装 uBlock 去广告扩展：  
   [https://github.com/gorhill/uBlock](https://github.com/gorhill/uBlock)

2. 添加三条静态去广告规则：
   ```
   ||javbus.com/js/jquery.masonry.min.js$script
   ||javbus.com/css/main.css$stylesheet
   ||javbus.com/css/main-uncensored.css$stylesheet
   ```

3. 安装脚本：
   - `zyJavBUS.style.switch.js` 和 `zyJavBUS.replaceImage.js`（**基础！不然样式不会生效，默认 3 列，如需改动请在 `zyJavBUS.style.switch` 添加注释**）

4. 安装 `zyJavBUS-match+offline`，提供资源匹配和离线整理等操作  
   按钮颜色支持：`is-uc`、`is-zh`、`is-crack`、`is-fourk`、`is-normal`、`is-nomatch`  
   其他配置基本与 JavPack 项目一致，请参考 [原项目文档](https://github.com/bolin-dev/JavPack)

5. 匹配支持重命名：默认流程为 `自动清理 > 重命名 > 上传封面`，如需更改请自行修改

6. 在列表页中，鼠标悬停并按下 `"z"` 键，可进行离线整理等操作

7. **没有经过大量测试... 不确定是否存在 BUG**
