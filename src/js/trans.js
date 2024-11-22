var Trans;
(function () {
    const confActive = "general.activeLanguage";
    Trans = {
        init: () => {
            //Config.registerUi("language", Trans.configUiInit);
            Config.hook(confActive, Trans.reTranslateUI);
            return Promise.resolve();
        },
        translate: (key, str, empty) => {
            if (Debug.on) {
                return "__" + key + ">" + str + "__";
            }
            return Trans.getTranslation(key, str) || ((empty === true) ? "" : str);
        },
        getTranslation: (path, item) => {
            const keyA = Config.get(confActive) + "." + path + "." + item;
            const keyB = "en." + path + "." + item;
            const a = Object.getByPath(Lang, keyA);
            const b = Object.getByPath(Lang, keyB);
            //console.log("trans (" + keyA + ") = " + a + "\ntrans (" + keyB + ") = " + b);
            return a || b;
        },
        translateUI: prefix => {
            if (typeof prefix !== "string") prefix = "";
            if (prefix.length > 1) prefix += " ";
            $(prefix + ".WG-translate-text:not(.translated)").each((i, e) => {
                const data = $(e).data();
                let trans =
                    (Trans.translate(data.section, data.str, true)
                        ||
                        (Trans.translate(data.fallback, data.str, true)
                            ||
                            data.section + ">" + data.str));

                $(e).text(trans).addClass("translated");
            });
        },
        clearUiTranslations: () => $(".WG-translate-text").removeClass("translated"),
        reTranslateUI: () => {
            Trans.clearUiTranslations();
            Trans.translateUI();
        },
        createElem: (section, str, type, fallback) => {
            if (typeof type !== "string") type = "span";
            return $("<" + type + ">").addClass("WG-translate-text").data({ section: section, str: str, fallback: fallback }).text(section + ">" + str);
        },
        key: (str) => {
            if (typeof str !== "string") {
                str = "";
            }
            return str.split(" + ").map(function (item) {
                return Trans.translate("keyCode", item);
            }).join(" + ");
        },
        unixTimeToDateString: (time, str) => {
            time = new Date(time);
            let map = {
                "%Y": time.getFullYear(),
                "%y": time.getFullYear().toString().substr(2),
                "%d": time.getDate(),
                "%D": Util.dateStrPad(time.getDate()),
                "%m": time.getMonth(),
                "%M": Util.dateStrPad(time.getMonth()),
                "%h": time.getHours(),
                "%H": Util.dateStrPad(time.getHours()),
                "%i": time.getMinutes(),
                "%I": Util.dateStrPad(time.getMinutes()),
                "%s": time.getSeconds(),
                "%S": Util.dateStrPad(time.getSeconds()),
            };
            return Util.stringMap(str, time, map);
        },
    };
})();
