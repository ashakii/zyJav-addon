class Offline {
  static defaultDir = "云下载";

  static defaultType = "plain";

  static defaultColor = "is-info";

  static defaultRename = "${top250}${wuma}${gongyan}${zh}${crack}${fourk} [${year}] [${nvyou}] ${code}";

  static defaultOptions = {
    tags: ["genres", "actors"],
    clean: true,
    cover: true,
  };

  static defaultMagnetOptions = {
    filter: ({ size }) => {
      const magnetSize = parseFloat(size);
      return magnetSize > 314572800 || magnetSize < 1;
    },
    max: 2,
  };

  static defaultVerifyOptions = {
    filter: ({ s }) => s > 1 * 1024 ** 3, // 1G
    clean: false,
    max: 10,
  };

  static defaultRenameTxt = {
    no: "-cd${no}",
    zh: "[中字]",
    crack: "[破解]",
    fourk: "[4K]",
    gongyan: "[共演]",
    wuma: "[无码]",
    top250: "[TOP250]",
  };

  static parseVar(txt, params, rep = "") {
    const reg = /\$\{(\w+)\}/g;
    return txt.replace(reg, (_, key) => (params.hasOwnProperty(key) ? params[key].toString() : rep)).trim();
  }

  static parseDir(dir, params) {
    const rep = "$0";
    return (typeof dir === "string" ? dir.split("/") : dir).map((item) => {
      const txt = this.parseVar(item, params, rep);
      return txt.includes(rep) ? null : txt;
    });
  }

  static getActions(config, params) {
    return config
      .flatMap(({ type = this.defaultType, match = [], exclude = [], ...item }, index) => {
        let { name, dir = this.defaultDir, rename = this.defaultRename } = item;
        if (!name) return null;

        rename = rename?.toString().trim();
        if (rename) {
          rename = rename.replaceAll("${top250}", "$top250");
          rename = rename.replaceAll("${zh}", "$zh");
          rename = rename.replaceAll("${crack}", "$crack");
          rename = rename.replaceAll("${fourk}", "$fourk");
          rename = rename.replaceAll("${gongyan}", "$gongyan");
          rename = rename.replaceAll("${wuma}", "$wuma");
          if (!rename.includes("${code}")) rename = "${code} " + rename;
        }

        if (type === "plain") return { ...item, dir: this.parseDir(dir, params), rename, idx: 0, index };

        let classes = params[type];
        if (!Array.isArray(classes) || !classes.length) return null;

        if (match.length) classes = classes.filter((item) => match.some((key) => item.includes(key)));
        if (exclude.length) classes = classes.filter((item) => !exclude.some((key) => item.includes(key)));
        if (!classes.length) return null;

        const typeItemKey = type.replace(/s$/, "");
        const typeItemTxt = "${" + typeItemKey + "}";

        return classes.map((cls, idx) => {
          const val = cls.replace(/♀|♂/, "").trim();
          return {
            ...item,
            dir: this.parseDir(dir, { ...params, [typeItemKey]: val }),
            rename: rename.replaceAll(typeItemTxt, val),
            name: name.replaceAll(typeItemTxt, val),
            index,
            idx,
          };
        });
      })
      .filter((item) => Boolean(item) && item.dir.every(Boolean))
      .map(({ color = this.defaultColor, desc, ...options }) => {
        return { ...options, color, desc: desc ? desc.toString() : options.dir.join("/") };
      });
  }

  static getOptions(
    { magnetOptions = {}, verifyOptions = {}, renameTxt = {}, rename, ...options },
    { codes, regex, cover, ...details },
  ) {
    options = { ...this.defaultOptions, ...options };
    magnetOptions = { ...this.defaultMagnetOptions, ...magnetOptions };
    verifyOptions = { ...this.defaultVerifyOptions, ...verifyOptions };
    renameTxt = { ...this.defaultRenameTxt, ...renameTxt };

    return {
      ...options,
      magnetOptions,
      verifyOptions,
      renameTxt,
      codes,
      regex,
      code: details.code,
      cover: options.cover ? cover : "",
      rename: this.parseVar(rename, details),
      tags: options.tags.flatMap((key) => details[key]).filter(Boolean),
      ...details,
      // gongyan: details.gongyan,
      // wuma: details.wuma,
      // title: details.title,
      // actorLinks: details.actorLinks,
      // series: details.series,
      // serieshref: details.serieshref,
      // top250: details.top250,
      // year: details.year,
    };
  }

  static getMagnets(magnets, { filter, sort, max }) {
    if (!magnets?.length) return [];
    if (filter) magnets = magnets.filter(filter);
    if (sort) magnets = magnets.toSorted(sort);
    if (max) magnets = magnets.slice(0, max);
    return magnets;
  }
}
