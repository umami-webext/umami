/* jshint esversion: 6*/
/* globals browser, chrome, $ */
(function () {
    console.clear();
    if (typeof browser === "undefined") {
        if (typeof chrome === "undefined") {
            console.log("UMAMI", "COULD NOT FIND BROWSER OR CHROME");
            return;
        }
        browser = chrome;
    }

    const initMods = mods => Promise.all(mods.map(mod => mod.init()));

    const htmlInitMods = mods => Promise.all(mods.map(mod => mod.htmlInit()));

    $(document).ready(() => {
        $(".WG-reload-remove").remove();
        initMods([Config]).then(() => {
            initMods([Util, Keys, Debug, User, Save, Posts, Pools, Version, Thumbs, SlideShow, Page, Share, Trans, PageScript, BrowserMessage]).then(() => {
                var htmlURL = browser.extension.getURL("html/content.html");
                var scriptURL = browser.extension.getURL("pagejs/umami-coms.js");
                $("head").append($("<script>").addClass("WG-reload-remove").attr("src", scriptURL));
                overlay = $("<div>").attr("id", "WG-PRN").addClass("WG-reload-remove").appendTo("body").load(htmlURL, function (data) {
                    htmlInitMods([Config, Version, Util, User, Thumbs, SlideShow, Save, Keys]).then(() => {
                        Trans.translateUI("#WG-PRN");
                        try {
                            Version.check();
                        } catch (e) {
                            console.log(e);
                        }
                    });
                });
            });
        });
    });

})();