var Thumbs;
(function() {
	const cssThumb = "article.thumbnail";
	const cssBlacklisted = ".blacklisted-active,.blacklisted";
	const cssThumbNotBlacklisted = cssThumb + ":not(" + cssBlacklisted + ")";
	Thumbs = {
		cssThumb: cssThumb,
		selected: 0,
		selection: false,
		init: () => {
			Keys.registerKeyUp(Thumbs.handleKeyUp, 30, "thumb");
			Keys.registerKeyDown(Thumbs.handleKeyDown, 30, "thumb");
			if (Thumbs.navigateToIndex(Thumbs.selected).length > 0) {
				Thumbs.selection = true;
			}
			return Promise.resolve();
		},
		htmlInit: () => {
			ThumbsHTML.init();
			return Promise.resolve();
		},
		openInTab: (thumb) => BrowserMessage.send("openTab", { url: Util.baseURL + thumb.find('a').attr("href") }),
		getSelected: () => $($(cssThumbNotBlacklisted).get(Thumbs.selected)),
		handleKeyDown: (e, key) => {
			if (!Thumbs.selection) return false;
			if (Keys.isKey(key, "download")) {
				console.log("SAVING", Thumbs.getSelected().data("id"));
				try {
					Posts.save(Thumbs.getSelected().data("id"));
				} catch (e) {
					console.log("Thumb Save", e);
				}
				return true;
			}
			return Thumbs.navigate(key);
		},
		handleKeyUp: (e, key) => {
			let lr = Keys.keyLR(key);
			if (lr) {
				Util.movePage(lr);
			}
			var sel = Thumbs.getSelected();
			if (sel.length > 0) {
				if (Keys.isKey(key, "open") && SlideShow.enabled()) {
					SlideShow.open(sel);
				} else if (Keys.isKey(key, "openInTab") || (Keys.isKey(key, "open") && !SlideShow.enabled())) {
					Thumbs.openInTab(sel);
				}
			}
			return true;
		},
		navigate: (key) => {
			let lr = Keys.keyLR(key);
			let ud = Keys.keyUD(key);
			if (lr === 0 && ud === 0) return false;
			let w = Thumbs.getCountAcross();
			let t = $(cssThumbNotBlacklisted).length;
			let s = Thumbs.selected;

			if (ud) {
				s += w * ud;
			}

			if (lr) {
				let c = s % w;
				if (c == 0 && lr < 0) {
					s += w - 1;
				} else if (c == (w - 1) && lr > 0) {
					s -= w - 1;
				} else {
					s += lr;
				}
			}

			if (s >= t) {
				Page.loadNext();
			}
			t = $(cssThumbNotBlacklisted).length;
			if (s >= 0 && s < t && s != Thumbs.selected) {
				Thumbs.selected = s;
				Util.scrollTo(Thumbs.navigateToIndex(s));
				return true;
			}
			return false;
		},
		navigateToIndex: (index) => {
			$(cssThumb).removeClass("WG-selected");
			var span = $($(cssThumbNotBlacklisted).get(index));
			if (span.length > 0) {
				span.addClass("WG-selected");
				Thumbs.selected = index;
			}
			return span;
		},
		getCountAcross: () => {
			let i = 1;
			const spans = $(cssThumbNotBlacklisted);
			const top = spans.first().position().top;
			while (i < spans.length && $(spans.get(i)).position().top == top) {
				i++;
			}
			return i;
		},
		getThumbIndex: (thumb) => $(cssThumbNotBlacklisted).index(thumb),
		loadContent: (thumb, cb) => {
			Util.scrollTo(Thumbs.navigateToIndex(Thumbs.getThumbIndex(thumb)));
			const prev = thumb.prevAll(cssThumbNotBlacklisted).first();
			const next = thumb.nextAll(cssThumbNotBlacklisted).first();

			$("#WG-PRN-PREV").toggle(prev.length > 0);
			$("#WG-PRN-NEXT").toggle(next.length > 0 || Page.nextContent != null);

			Thumbs.downloadContent(thumb, cb);
			Thumbs.downloadContent(next);
			Thumbs.downloadContent(prev);

			return {
				prev: prev,
				current: thumb,
				next: next,
			}
		},
		downloadContent: (thumb, cb) => {
			if (thumb.length < 1) return;
			if (typeof thumb.data("content") !== "undefined") {
				if (typeof cb === "function") {
					cb(thumb);
				}
			} else {
				const url = thumb.find("a").attr("href");
				thumb.data("link", url);
				Request.get(url)
					.then((data) => {
						if (typeof data !== "string" || data.length < 10) {
							throw "data empty";
						}

						const vup = $(".post-vote-up-link", data);
						const vdn = $(".post-vote-down-link", data);
						const fav = $(".fav-buttons", data);

						thumb.data("faved", fav.hasClass("fav-buttons-true"));
						thumb.data("voted", vup.find(".score-positive").hasClass("score-positive") ? 1 : vdn.find(".score-negative").hasClass("score-negative") ? -1 : 0);
						thumb.data("score", parseInt($("span.post-score", data).first().text()));

						const content = $("#image-container", data);
						thumb.data("content", content);

						const dl = $("h4>a:contains('Download')", data);
						if (dl.length > 0) {
							thumb.data("download", dl.attr("href"));
						}
						thumb.data("tags", $("section#tag-list", data));
						if (typeof cb === "function") {
							try {
								cb(thumb);
							} catch (e) {
								console.log(e);
							}
						}
					})
					.catch((err) => {
						console.log("THUMB ERR", url, err);
					});
			}
		},
	}

	let ThumbsHTML = {
		init: () => {
			ThumbsHTML.bind();
			return Promise.resolve();
		},

		bind: () => {
			$(cssThumb).off("click").on("click", ThumbsHTML.openModalClick);
			$(cssThumb + ">a").attr("target", "_blank");
		},

		openModalClick: (e) => {
			try {
				if (e.ctrlKey) return true;
				if (!SlideShow.enabled()) return true;
				e.preventDefault();
				SlideShow.open($(e.currentTarget));
			} catch (e) {
				console.log(e);
			}
			return false;
		},
	}
})();