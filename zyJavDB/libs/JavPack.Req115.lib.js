/**
 * @require JavPack.Req.lib.js
 *
 * @connect 115.com
 */
class Drive115 extends Req {
  static defaultGetResponseType = "json";

  static files(cid = "0", params = {}) {
    return this.request({
      url: "https://webapi.115.com/files",
      params: { cid, ...params },
    });
  }

  static filesSearch(search_value, params = {}) {
    return this.request({
      url: "https://webapi.115.com/files/search",
      params: { search_value, ...params },
    });
  }

  static lixianTaskLists(page = 1) {
    return this.request({
      url: "https://115.com/web/lixian/",
      params: { ct: "lixian", ac: "task_lists", page },
    });
  }

  static labelList() {
    return this.request({
      url: "https://webapi.115.com/label/list",
      params: { keyword: "", limit: 11150 },
    });
  }

  /**
   * @connect anxia.com
   */
  static filesVideo(pickcode) {
    return this.request({
      url: "https://115vod.com/webapi/files/video",
      params: { pickcode, local: 1 },
    });
  }

  static post(details) {
    return this.request({ method: "POST", ...details });
  }

  static filesAdd(cname, pid) {
    return this.post({
      url: "https://webapi.115.com/files/add",
      data: { cname, pid },
    });
  }

  static lixianAddTaskUrl(url, wp_path_id) {
    return this.post({
      url: "https://115.com/web/lixian/",
      params: { ct: "lixian", ac: "add_task_url" },
      data: { url, wp_path_id },
    });
  }

  /**
   * Bulk delete offline tasks and source files
   * @param {string[]} hash Array of info_hashes
   */
  static lixianTaskDel(hash) {
    return this.post({
      url: "https://115.com/web/lixian/",
      params: { ct: "lixian", ac: "task_del" },
      data: { hash },
    });
  }

  /**
   * Bulk delete files
   * @param {string[]} fid Array of file IDs
   * @param {string} pid Parent folder ID
   */
  static rbDelete(fid, pid = "") {
    return this.post({
      url: "https://webapi.115.com/rb/delete",
      data: { fid, pid, ignore_warn: 1 },
    });
  }

  /**
   * Batch move files
   * @param {string[]} fid Array of file IDs
   * @param {string} pid Destination folder ID
   */
  static filesMove(fid, pid) {
    return this.post({
      url: "https://webapi.115.com/files/move",
      data: { fid, pid, move_proid: "" },
    });
  }

  /**
   * Bulk label files
   * @param {string} file_ids fid1,fid2,fid3...
   * @param {string} file_label label_id1,label_id2,label_id3...
   * @returns
   */
  static filesBatchLabel(file_ids, file_label, action = "add") {
    return this.post({
      url: "https://webapi.115.com/files/batch_label",
      data: { file_ids, file_label, action },
    });
  }

  /**
   * Bulk rename files
   * @param {object} files_new_name { [fid]: rename }
   */
  static filesBatchRename(files_new_name) {
    return this.post({
      url: "https://webapi.115.com/files/batch_rename",
      data: { files_new_name },
    });
  }

  static sampleInitUpload({ filename, filesize, cid }) {
    return this.post({
      url: "https://uplb.115.com/3.0/sampleinitupload.php",
      data: { filename, filesize, target: `U_1_${cid}` },
    });
  }

  /**
   * @connect aliyuncs.com
   */
  static upload({
    host: url,
    filename: name,
    object: key,
    policy,
    accessid: OSSAccessKeyId,
    callback,
    signature,
    file,
  }) {
    return this.post({
      url,
      data: {
        name,
        key,
        policy,
        OSSAccessKeyId,
        success_action_status: "200",
        callback,
        signature,
        file,
      },
    });
  }

  static filesEdit(fid, fid_cover) {
    return this.post({
      url: "https://webapi.115.com/files/edit",
      data: { fid, fid_cover },
    });
  }
  //备注 '<p><span+style="font-size:+32px;">神谷姬</span></p>'
  static descEdit(fid, file_desc) {
    return this.post({
      url: "https://webapi.115.com/files/edit",
      data: { fid, file_desc },
    });
  }
}

class Req115 extends Drive115 {
  static async filesAll(cid, params = {}) {
    const res = await this.files(cid, params);
    const { count, page_size, data } = res;
    return count > page_size && data.length ? this.files(cid, { ...params, limit: count }) : res;
  }

  static filesAllVideos(cid, params = {}) {
    return this.filesAll(cid, { ...params, type: 4 });
  }

  static filesAllSRTs(cid, params = {}) {
    return this.filesAll(cid, { ...params, suffix: "srt" });
  }

  static async filesSearchAll(search_value, params = {}) {
    const res = await this.filesSearch(search_value, params);
    const { count, page_size, data } = res;
    return count > page_size && data.length ? this.filesSearch(search_value, { ...params, limit: count }) : res;
  }

  static filesSearchAllVideos(search_value, params = {}) {
    return this.filesSearchAll(search_value, { ...params, cid: "3021243513179208790", type: 4 });
  }

  static filesSearchAllFolders(search_value, params = {}) {
    return this.filesSearchAll(search_value, { ...params, fc: 1 });
  }

  static async handleDir(routes) {
    if (routes.length === 1 && /^\d+$/.test(routes[0])) return routes[0];

    let cid;
    const routesStr = routes.join("/");
    const cachedCid = localStorage.getItem(routesStr);

    if (cachedCid) {
      const res = await this.files(cachedCid);
      if (res?.path?.length) {
        const path = res.path.slice(1).map((p) => p.name);
        if (path.join("/") === routesStr) cid = cachedCid;
      }
    }

    if (!cid) {
      cid = "0";

      for (const route of routes) {
        const { data } = await this.filesSearchAllFolders(route, { cid });
        let folder = data.find((folder) => folder.n === route);
        if (!folder) folder = await this.filesAdd(route, cid);
        cid = folder?.cid;
        if (!cid) break;
      }
    }

    const month = new Date().getMonth().toString();
    if (localStorage.getItem("115_CD") !== month) {
      localStorage.clear();
      localStorage.setItem("115_CD", month);
    }

    if (cid) localStorage.setItem(routesStr, cid);
    return cid;
  }

  static async handleVerify(info_hash, { regex, codes }, { max, filter }) {
    const sleep = () => {
      return new Promise((r) => {
        setTimeout(r, 1000);
      });
    };

    let file_id = "";
    let videos = [];

    for (let index = 0; index < max; index++) {
      if (index) await sleep();
      const { tasks } = await this.lixianTaskLists();

      const task = tasks.find((task) => task.info_hash === info_hash);
      if (!task || task.status === -1) break;

      file_id = task.file_id;
      if (file_id) break;
    }

    if (!file_id) return { file_id, videos };

    for (let index = 0; index < max; index++) {
      if (index) await sleep();
      const { data } = await this.filesAllVideos(file_id);

      videos = data.filter((item) => regex.test(item.n));
      if (videos.length) break;
    }

    if (!videos.length) {
      const { tasks } = await this.lixianTaskLists();
      const task = tasks.find((task) => task.info_hash === info_hash);

      if (task.status === 2) {
        const { data } = await this.filesAllVideos(file_id);
        codes = codes.map((code) => code.toUpperCase());

        videos = data.filter((item) => {
          const name = item.n.toUpperCase();
          return codes.some((code) => name.includes(code));
        });
      }
    }

    return { videos: videos.filter(filter), file_id };
  }

  static async handleClean(keepFiles, cid) {
    const needMove = keepFiles.filter((file) => file.cid !== cid).map((file) => file.fid);
    if (needMove.length) await this.filesMove(needMove, cid);

    const { data } = await this.filesAll(cid);

    const needRemove = data
      .filter((item) => !keepFiles.some((file) => file.fid === item.fid))
      .map((item) => item.fid ?? item.cid);

    if (needRemove.length) return this.rbDelete(needRemove, cid);
  }

  static async handleTags(files, tags) {
    const { data } = await this.labelList();
    if (!data?.list?.length) return;

    const { list } = data;
    const labels = [];

    tags.forEach((tag) => {
      const item = list.find((item) => item.name === tag);
      if (item) labels.push(item.id);
    });

    if (labels.length) return this.filesBatchLabel(files.map((it) => it.fid).toString(), labels.toString());
  }

  static async searchStrm(code) {
    try {
      const response = await fetch(`https://192.168.100.1:5002/strms?code=${code}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        mode: "cors"
      });

      if (!response.ok) console.log('无服务器返回数据...')

      const data = await response.json(); // 解析 JSON 数据
      return data;
    } catch (error) {
      console.error("Error fetching strm files:", error);
      return null;
    }
  }

  //strmobj: {[pickcode]: name}
  static async createStrm(strmObj, dir, code) {
    const pathname = dir[dir.length - 1];  // 获取 dir

    for (const [pickcode, name] of Object.entries(strmObj)) {
      if (!pickcode || !name) {
        console.error("无效的pickcode:", pickcode);
        continue;
      }

      fetch("https://192.168.100.1:5002/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickcode, pathname, name, code }),
        mode: "cors"
      })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error("Error:", error));
    }
  }

  static async deleteStrm(pickcode) {
    fetch("https://192.168.100.1:5002/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickcode }),
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error("Error:", error));
  }

  static createfile_desc(details) {
    const { url, title, actorLinks, series, serieshref } = details;
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
    return file_desc;
  }

  static handleRename(code, dir, files, cid, file_desc, { rename, renameTxt, zh, crack, fourk, gongyan, wuma, top250 }) {
    rename = rename.replaceAll("$top250", top250 ? renameTxt.top250 : "");
    rename = rename.replaceAll("$zh", zh ? renameTxt.zh : "");
    rename = rename.replaceAll("$crack", (crack && !wuma) ? renameTxt.crack : "");
    rename = rename.replaceAll("$fourk", fourk ? renameTxt.fourk : "");
    rename = rename.replaceAll("$gongyan", gongyan ? renameTxt.gongyan : "");
    rename = rename.replaceAll("$wuma", wuma ? renameTxt.wuma : "");
    rename = rename.trim();

    const renameObj = { [cid]: rename };
    const strmObj = {};

    if (files.length === 1) {
      const { fid, ico, pc } = files[0];
      renameObj[fid] = `${rename}.${ico}`;
      strmObj[pc] = rename;
      this.descEdit(fid, file_desc);
      this.createStrm(strmObj, dir, code);
      return this.filesBatchRename(renameObj);
    }

    const icoMap = files.reduce((acc, { ico, ...item }) => {
      acc[ico] ??= [];
      acc[ico].push(item);
      return acc;
    }, {});

    const noTxt = renameTxt.no;
    for (const [ico, items] of Object.entries(icoMap)) {
      if (items.length === 1) {
        renameObj[items[0].fid] = `${rename}.${ico}`;
        strmObj[items[0].pc] = rename;
        continue;
      }

      items
        .toSorted((a, b) => a.n.localeCompare(b.n))
        .forEach(({ fid, pc }, idx) => {
          const no = noTxt.replaceAll("${no}", `${idx + 1}`);
          renameObj[fid] = `${rename}${no}.${ico}`;
          strmObj[pc] = `${rename}${no}`;
          this.descEdit(fid, file_desc);
        });
    }

    this.createStrm(strmObj, dir, code);
    return this.filesBatchRename(renameObj);
  }

  static async handleCover(url, cid, filename) {
    const file = await this.request({ url, timeout: 60000, responseType: "blob" });
    if (!file) return;

    const res = await this.sampleInitUpload({ cid, filename, filesize: file.size });
    if (res?.host) return this.upload({ ...res, filename, file });
  }



  static async handleOffline(details, magnets) {
    const { dir, regex, codes, verifyOptions, code, rename, renameTxt, tags, clean, cover, gongyan, wuma, top250, year } = details;
    const newdir = [...dir, year];
    const res = { status: "error", msg: `获取目录失败: ${newdir.join("/")}` };
    const cid = await this.handleDir(newdir);
    if (!cid) return res;

    for (let index = 0, { length } = magnets; index < length; index++) {
      const { url, zh, crack, fourk } = magnets[index];
      const { state, error_msg, errcode, info_hash } = await this.lixianAddTaskUrl(url, cid);

      if (!state) {
        res.msg = error_msg;
        res.status = "error";
        res.currIdx = index;
        if (errcode === 10008) continue;
        if (errcode === 911) res.status = "warn";
        break;
      }

      const { videos, file_id } = await this.handleVerify(info_hash, { regex, codes }, verifyOptions);

      if (!videos.length) {
        if (verifyOptions.clean) this.lixianTaskDel([info_hash]);
        if (file_id && verifyOptions.clean) this.rbDelete([file_id], cid);

        res.msg = `${code} 离线验证失败`;
        res.status = "error";
        continue;
      }

      const { data: srts = [] } = await this.filesAllSRTs(file_id);
      const files = [...videos, ...srts];
      const file_desc = this.createfile_desc(details)
      this.descEdit(file_id, file_desc);

      if (clean) await this.handleClean(files, file_id);

      if (tags.length) this.handleTags(videos, tags);

      if (rename) this.handleRename(code, dir, files, file_id, file_desc, { rename, renameTxt, zh: zh || srts.length, crack, fourk, gongyan, wuma, top250 });

      if (cover) {
        try {
          const { data } = await this.handleCover(cover, file_id, `${code}.cover.jpg`);
          if (data?.file_id) this.filesEdit(file_id, data.file_id);
        } catch (err) {
          console.warn("[Req115.handleCover]", err?.message);
        }
      }

      res.msg = `${code} 离线任务成功`;
      res.status = "success";
      break;
    }

    return res;
  }
}
