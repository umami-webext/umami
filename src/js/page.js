var Page;
(function () {
    const confInfinitScroll = "general.infiniteScroll";
    const afterPaginates = [];
    Page = {
        enabled: () => Config.get(confInfinitScroll) ? true : false,
        nextUrl: null,
        nextContent: null,
        nextPager: null,
        scrollInterval: null,
        shouldPaginate: () => {
            if (Page.enabled()) {
                switch (Util.getPageCategory()) {
                    case "/":
                    case "":
                    case "/posts":
                    case "/pools/<number>":
                    case "/pools":
                        return true;
					case "/pools/gallery":
						SlideShow.enabled = () => false;
						return true;
                    default:
                        break;

                }
            }
            return false;
        },
        registerAfterPaginate: cb => afterPaginates.push(cb),
        init: () => {
            Page.nextUrl = Page.getNextPageUrl();
            if (typeof Page.nextUrl === "string" && Page.nextUrl.length > 0 && Page.shouldPaginate()) {
                if (Page.preloadNext()) {
                    Page.startScrollInterval();
                }
            }
            Config.hook(confInfinitScroll, Page.infiniteScrollToggle);
            return Promise.resolve();
        },
        infiniteScrollToggle: (conf, val) => {
            Page.clearScrollInterval();
            if (Page.shouldPaginate()) {
                if (Page.preloadNext()) {
                    Page.startScrollInterval();
                }
            }
        },
        startScrollInterval: () => {
            Page.clearScrollInterval();
            Page.scrollInterval = window.setInterval(Page.scrollDetect, 250);
        },
        clearScrollInterval: () => {
            if (Page.scrollInterval === null) return;
            window.clearInterval(Page.scrollInterval);
            Page.scrollInterval = null;
        },
        getNextPageUrl: (data) => { let link = $("a#paginator-next", data); return link.length > 0 ? link.attr("href") : null; },
        loadNext: (cb) => {
            if (Page.nextContent !== null && Page.shouldPaginate()) {
                const insertAfter = Page.getInsertAfter();
                if (insertAfter.length === 1) {
                    $(Page.nextContent).insertAfter(insertAfter);
                }
                $("div.paginator").not(":first").remove();
                $("div.paginator").replaceWith(Page.nextPager);
                Page.clearPreload();
                if (!Page.preloadNext()) {
                    Page.clearScrollInterval();
                }
                Thumbs.htmlInit();
                if (typeof (cb) == "function") {
                    window.setTimeout(cb, 100);
                }
                Page.processBL();
                afterPaginates.forEach(cb => cb());
                return true;
            }
            return false;
        },
        clearPreload: () => {
            Page.nextContent = null;
            Page.nextPager = null;
        },
        preloadNext: () => {
            if (Page.nextUrl !== null) {
                var pnu = Page.nextUrl;
                Page.nextUrl = null;
                Page.clearPreload();
                Request.get(pnu)
                    .then((data) => {
                        let content = Page.getContentDiv(data);
                        Page.nextContent = $(content).html();
                        Page.nextPager = Page.getPaginator(data);
                        Page.nextUrl = Page.getNextPageUrl(data);
                    });
                return true;
            }
            return false;
        },
        scrollDetect: () => {
            if (Page.pixFromBottom() < 60) {
                Page.loadNext();
            }
        },
        getInsertAfter: () => {
            switch (Util.getPageCategory()) {
                case "/":
                case "":
                case "/posts":
                case "/pools/<number>":
                    return $(Thumbs.cssThumb).last();
                case "/pools":
                    return $("tr[id^=pool-]").last();
                default:
                    break;
            }
            return { length: 0 };
        },
        getContentDiv: (data) => {
            switch (Util.getPageCategory()) {
                case "/":
                case "":
                case "/posts":
                case "/pools/<number>":
                    return $(Thumbs.cssThumb, data).parent();
                case "/pools":
                    return $("tr[id^=pool-]", data).parent();
                default:
                    break;
            }
            return "";
        },
        getPaginator: (data) => $("div.paginator", data),
        pixFromBottom: () => $(document).height() - (Math.ceil($(window).height() + $(window).scrollTop())),
        processBL: () => PageScript.applyBlacklist(),
    };
})();
