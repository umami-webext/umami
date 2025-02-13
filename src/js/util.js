var User;
(function () {
    User = {
        login: null,
        apiKey: null,
        loggedIn: () => $(".sign-in").length == 0,
        init: () => {
            // User.login = Cookie.get("login");
            // User.loadApiKey();
            return Promise.resolve();
        },
        htmlInit: () => {
            if (!User.loggedIn()) {
                $(".WG-login-required").remove();
            }
            return Promise.resolve();
        },
        loadApiKey: () => {
            // console.log("LOAD API KEY", User.login, User.loggedIn());
            // console.log("LOGGED IN");
            // $("<script>jQuery.get('/user/api_key',function(data){})</script>").insertAfter("#content");
            // Request.get(Util.url("/user/api_key"))
            //     .then(data => {
            //         const html = $(data).filter("#content");
            //         console.log(html);
            //     })
            //     .catch(e => console.log("APIK", Util.url("/user/api_key"), e));
        }
    };
})();

var Request;
(function () {
    const send = (url, params) => BrowserMessage.request(Util.baseURL + url, params);
    Request = {
        get: (url, data) => send(url, { query: data }),
        post: (url, data) => send(url, { method: "POST", headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
        postJSON: (url, data) => send(url, { method: "POST", body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
    };
})();

var PageScript;
(function () {
    const pending = {};
    let tokenID = 0;
    const send = (op, data) => {
        return new Promise((resolve, reject) => {
            ++tokenID;
            const token = Date.now() + "-" + tokenID + "-" + Math.floor(Math.random() * 100000);
            window.postMessage({ src: "UMAMI", op: op, data: data, token: token }, "*");
            pending[token] = { resolve: resolve, reject: reject };
        });
    };
    PageScript = {
        init: () => {
            window.addEventListener("message", PageScript.response);
            return Promise.resolve();
        },
        response: (ev) => {
            const { src, data, token, status } = ev.data;
            if (src !== "UMAMI-PAGE") return;
            // console.log("PAGE RESP",[src,data,token,status]);
            if (pending.hasOwnProperty(token)) {
                if (status === "success") {
                    pending[token].resolve(data);
                } else {
                    pending[token].reject(data);
                }
                delete pending[token];
            }
        },
        applyBlacklist: () => send("APPLY_BLACKLIST"),
        vote: (id, dir) => send("VOTE", { id: id, dir: dir }),
        fave: (id, create) => send(create ? "FAVE" : "UNFAVE", id),
        blackCheck: post => send("BLACK_TEST", post),
    };
})();

var BrowserMessage;
(function () {
    const hooks = {};
    const send = (type, data) => browser.runtime.sendMessage({ type: type, data: data, src: "umami-content" });
    const onMessage = (msg) => {
        if (msg.src !== "umami-background") return;
        const cbs = hooks[msg.type] || [];
        cbs.forEach(cb => cb(msg.data));
    };

    BrowserMessage = {
        download: (url, filename) => send("download", { url: url, filename: filename }),
        dlBulk: (downloadID, files, foldername) => send("bulk_download", { files: files, foldername: foldername, id: downloadID }),
        openTab: (url) => send("openTab", { url: url }),
        request: (url, params) => send("request", { url: url, params: params }),
        ping: () => send("ping"),
        send: (type, data) => {
            return browser.runtime.sendMessage({
                type: type,
                data: data
            });
        },
        init: () => {
            browser.runtime.onMessage.addListener(onMessage);
            BrowserMessage.ping();
        },
        register: (type, cb) => {
            type = type.toLowerCase();
            if (!hooks.hasOwnProperty(type)) {
                hooks[type] = [];
            }
            hooks[type].push(cb);
        },
    };
})();

var Util;
(function () {
    Util = {
        baseURL: window.location.origin,
        url: (end) => Util.baseURL + end,
        getPageCategory: () => window.location.pathname.split("/").map(txt => isNaN(txt) || txt.length < 1 ? txt : "<number>").join("/"),
        init: () => {
            Util.baseURL = window.location.origin;
            UtilHTML.init();
            Config.registerUi("general", Util.configUiInit);
            return Promise.resolve();
        },
        configUiInit: (id) => {
            ConfigTableHTML.createIn("#" + id, "general", { slideshow: "bool", infiniteScroll: "bool", keyBinds: "bool", "activeLanguage": Object.keys(Lang) });
            return Promise.resolve(id);
        },
        pathWildCardRegex: (path, seperator, caseInsensetive) => {
            return new RegExp("^" + path.split(seperator).map((e, i, a) => {
                if (e !== "*") return e;
                else if (i < (a.length - 1)) {
                    return "[^\\" + seperator + "]+";
                } else {
                    return ".*";
                }
            }).join("\\.") + "$", (caseInsensetive === true ? "i" : ""));
        },
        isObj: (a) => {
            return (typeof a === "object" && a !== null && !(a instanceof Array));
        },

        htmlInit: () => {
            UtilHTML.bind();
            return Promise.resolve();
        },

        mergeOverObject: (a, b) => {
            Object.keys(a).forEach((key) => {
                if (!b.hasOwnProperty(key)) {
                    return;
                }
                if (Util.isObj(a[key])) {
                    if (Util.isObj(b[key])) {
                        Util.mergeOverObject(a[key], b[key]);
                    }
                } else {
                    a[key] = b[key];
                }
            });
        },
        movePage(dir) {
            if (dir < 0 && UtilHTML.prevLink.length) {
                window.location.href = UtilHTML.prevLink.attr("href");
            } else if (dir > 0 && UtilHTML.nextLink.length) {
                window.location.href = UtilHTML.nextLink.attr("href");
            }
        },
        scrollTo: (elem) => {
            if (!Util.isInView(elem)) {
                $('html, body').animate({
                    scrollTop: elem.offset().top
                }, 100);
            }
            return elem;
        },
        isInView: (elem) => {
            let docViewTop = $(window).scrollTop();
            let docViewBottom = docViewTop + $(window).height();

            let elemTop = $(elem).offset().top;
            let elemBottom = elemTop + $(elem).height();

            return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        },

        dateStrPad: (str) => Util.strPadLeft(str, "0", 2),
        strPadLeft: (str, pad, len) => {
            pad += "";
            str += "";
            while (str.length < len) {
                str = pad + "" + str;
            }
            return str;
        },
        strPadRight: (str, pad, len) => {
            while (str.length < len) {
                str = [str, pad].join("");
            }
            return str;
        },
        stringMap: (string, data, map) => {
            let res = string;
            Object.keys(map).forEach(key => {
                let val = map[key];
                if (typeof val === "function") {
                    val = val(data);
                }
                res = res.split(key).join(val);
            });
            return res;
        },
        glyphiconLink: (type, classes) => $("<a>").attr({ href: "#!" }).append('<span class="glyphicon glyphicon-' + type + '">').addClass(classes),
        urlParams: (str) => {
            const res = {};
            (new URLSearchParams(str || window.location.search)).forEach((val, key) => {
                if (key === "tags" && typeof val === "string") {
                    val = val.split(" ");
                }
                res[key] = val;
            });
            return res;
        }
    };

    let UtilHTML = {
        prevLink: null,
        nextLink: null,
        // paginateType: null,
        // paginateKey: null,
        // testIfCustomPaginate: () => {
        //     if (location.hash.startsWith("#WG-PAGINATE")) {
        //         let hash = location.hash.split("|");
        //         hash.shift();
        //         window.sessionStorage.setItem("WG-PAGINATE", JSON.stringify(hash));
        //         location.hash = "";
        //     }
        // },
        // testIfCustomPaginateExists: () => {
        //     if (Util.getPageCategory() !== "/posts/<number>") {
        //         window.sessionStorage.removeItem("WG-PAGINATE");
        //     }
        //     const type = JSON.parse(window.sessionStorage.getItem("WG-PAGINATE"));
        //     if (type instanceof Array && type.length === 2) {
        //         UtilHTML.paginateType = type[0];
        //         UtilHTML.paginateKey = type[1];
        //     }
        // },
        getNextLink: () => {
            let next = $("div#pool-nav li.pool-selected-true a.next").first();
            if (next.length < 1) {
                next = $("div#search-seq-nav a.next").first();
            }
            return next;
        },
        getPrevLink: () => {
            let prev = $("div#pool-nav li.pool-selected-true a.prev").first();
            if (prev.length < 1) {
                prev = $("div#search-seq-nav a.prev").first();
            }
            return prev;
        },
        init: () => {
            // UtilHTML.testIfCustomPaginate();
            // UtilHTML.testIfCustomPaginateExists();
            UtilHTML.prevLink = UtilHTML.getPrevLink();
            UtilHTML.nextLink = UtilHTML.getNextLink();
            $("<link>").attr("href", browser.extension.getURL("css/umami.css")).attr("rel", "stylesheet").addClass("WG-reload-remove").appendTo("head");
            $("<link>").attr("href", browser.extension.getURL("css/bootstrap.min.css")).attr("rel", "stylesheet").addClass("WG-reload-remove").appendTo("head");
            return Promise.resolve();
        },
        bind: () => {
            $("body").on("click", ".WG-toggle-link-slide", (e) => {
                console.log("CLICKY SLIDE");
                $($(e.currentTarget).data("toggle")).slideToggle();
                $(e.currentTarget).find(".WG-toggle-disp").toggle();
                return false;
            });
            $("body").on("click", ".WG-toggle-link", (e) => {
                $($(e.currentTarget).data("toggle")).toggle();
                $(e.currentTarget).find(".WG-toggle-disp").toggle();
                return false;
            });
            $("body").on("click", ".WG-remove-row", e => $(e.currentTarget).closest("tr").remove());
        },
    };
})();

var Debug;
(function () {
    Debug = {
        on: false,
        init: () => {
            Keys.registerKeyUp(Debug.handleKeyUp, -100, "debug");
            return Promise.resolve();
        },
        handleKeyUp: (e, key) => {
            if (key === "ctrl + alt + shift + D") {
                Debug.on = !Debug.on;
                let post = Posts.get(Posts.getIDs()[0]);
                console.log(Config.settings);
                Trans.reTranslateUI();
            }
            return false;
        }
    };
})();

var Version;
(function () {
    const confVersion = "versionCheck";
    Version = {
        current: () => browser.runtime.getManifest().version,
        init: () => {
            Keys.registerKeyUp(Version.handleKeyUp, 0, "version");
            Keys.registerKeyDown(Version.modalOpen, 0, "version");
            return Promise.resolve();
        },
        handleKeyUp: (e, key) => {
            if (Version.modalOpen()) {
                if (Keys.isKey(key, "close")) {
                    $("#WG-PRN-NOTICE").hide();
                }
                return true;
            }
            return false;
        },
        modalID: "WG-PRN-NOTICE",
        modalOpen: () => $("#" + Version.modalID).is(":visible"),
        check: () => {
            $(".WG-umami-version").text(Version.current());
            let stored = Config.get(confVersion);
            if (stored !== Version.current() && $("nav#nav").length > 0) {
                $("#WG-PRN-NOTICE").show();
                Config.set(confVersion, Version.current());
            }
        },
        htmlInit: () => {
            let firstMinor = true;
            const updates = Updates.data();
            Object.keys(updates).sort().reverse().forEach(vMajor => {
                const major = parseInt(vMajor.substring(1)) + "";
                Object.keys(updates[vMajor]).sort().reverse().forEach(vMinor => {
                    const minor = parseInt(vMinor.substring(1)) + "";
                    const blockID = "#WG-NOTICE-" + major + "-" + minor;
                    $("#WG-PRN-NOTICE-CONTENT").append(
                        $("<div>")
                            .append(
                                $("<h4>")
                                    .append(
                                        $("<a>")
                                            .addClass("WG-toggle-link-slide")
                                            .attr("href", "#!")
                                            .data("toggle", blockID)
                                            .html(major + "." + minor + "&nbsp;")
                                            .append($('<span class="glyphicon glyphicon-plus WG-toggle-disp"' + (firstMinor ? ' style="display: none;"' : '') + '></span>'))
                                            .append($('<span class="glyphicon glyphicon-minus WG-toggle-disp"' + (firstMinor ? '' : ' style="display: none;"') + '></span>'))

                                    )
                            )
                            .append($("<div>").attr({ id: blockID.substring(1), style: (firstMinor ? '' : 'display: none;') }))
                            .append($("<hr>"))
                    );
                    firstMinor = false;
                    const v00 = updates[vMajor][vMinor].v00;
                    delete updates[vMajor][vMinor].v00;
                    $(blockID).append($("<p>").html(v00.text));
                    delete v00.text;
                    Object.keys(v00).sort().forEach(type => {
                        $(blockID).append(Version.featureLists(type, v00[type], ""));
                    });

                    const patchDiv = $('<div>').attr({ style: "padding-left:25px;" });
                    const patches = updates[vMajor][vMinor];

                    let firstPatch = true;
                    Object.keys(patches).sort().reverse().forEach(vPatch => {
                        const patch = parseInt(vPatch.substring(1)) + "";
                        Object.keys(patches[vPatch]).sort().forEach(type => {
                            patchDiv.prepend(Version.featureLists(type, patches[vPatch][type], major + "." + minor + "." + patch + " - "));
                            firstPatch = false;
                        });
                    });
                    $(blockID).append(patchDiv);
                });
            });

            return Promise.resolve();
        },
        featureLists: (name, list, text) => {
            const ul = $("<ul>");
            list.forEach(note => {
                if (note instanceof Array) {
                    const li = $("<li>").html(note.shift());
                    const sul = $("<ul>");
                    note.forEach(n => sul.append($("<li>").html(n)));
                    ul.append(li.append(sul));
                } else {
                    ul.append($("<li>").html(note));
                }
            });
            const div = $("<div>");
            const h5 = $("<h5>");
            if (typeof text === "string" && text.length > 0) {
                h5.text(text);
            }
            h5.append(Trans.createElem("version.modal", name))
            return div
                .append(h5)
                .append(ul);
        },
    };
})();

