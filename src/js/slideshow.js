var SlideShow;

(function () {
    const confEnabled = "general.slideshow";
	const conflargeImages = "general.largeImages";
    SlideShow = {
        modalID: "WG-PRN-MODAL",
        timeout: null,
        timeoutOverride: null,
        currentThumb: null,
        enabled: () => Config.get(confEnabled) ? true : false,
        modalOpen: () => $("#" + SlideShow.modalID).is(":visible"),
        init: () => {
            Keys.registerKeyUp(SlideShow.handleKeyUp, 20, "slide");
            Keys.registerKeyDown(SlideShow.handleKeyDown, 20, "slide");
            Config.hook("slideshow.speed", SlideShow.timeoutUpdate);
            return Promise.resolve();
        },
        htmlInit: () => {
            SlideShowHTML.init();
            return Promise.resolve();
        },
        contentToLoad: (thumb) => {
            SlideShow.currentThumb = thumb;
			if (Config.get(conflargeImages)){
				thumb.data("content").find("#image").attr("src", thumb.data("content").attr("data-file-url"));
			}
            SlideShowHTML.modalImg.html(thumb.data("content"));
            SlideShowHTML.modalImg.find("#note-container").remove();
            var id = thumb.data("id");
            SlideShowHTML.modalDL.data({ download: thumb.data("download"), postID: id });
            SlideShowHTML.modalLink.attr("href", thumb.data("link"));
            if (User.loggedIn()) {
                $("#WG-PRN-VOTE-SCORE").text(thumb.data("score"));
                $(".WG-voted").removeClass("WG-voted");
                var voted = thumb.data("voted");
                var faved = thumb.data("faved");
                $("#WG-PRN-VOTE-UP").toggleClass("WG-voted", voted > 0).data("postID", id).attr("data-id", id);
                $("#WG-PRN-VOTE-DOWN").toggleClass("WG-voted", voted < 0).data("postID", id).attr("data-id", id);
                $("#WG-PRN-FAVE").toggleClass("WG-faved", faved).data("postID", id).attr("data-id", id);
            }
            var vid = SlideShowHTML.getVideo();
            if (vid.length > 0 && SlideShow.modalOpen()) {
                vid.prop('muted', $("#WG-PRN-MUTE").data("mute"));
                SlideShowHTML.setVideoLoop();
                //SlideShowHTML.resetVideo();
                let vide = vid.get(0);
                vide.pause();
                if ($("#WG-PRN-AUTOPLAY").is(':checked')) {
                    vide.play();
                    SlideShow.timeoutOverride = (vide.duration + 2) * 1000;
                    if (SlideShow.timeout != null) {
                        window.clearInterval(SlideShow.timeout);
                        SlideShow.scheduleSlide(SlideShow.timeoutOverride);
                    }
                }
            }
            $("#WG-PRN-TAGS").html(thumb.data("tags"));
        },
        display: (thumb) => {
            SlideShowHTML.modalImg.data(
                Thumbs.loadContent(thumb, SlideShow.contentToLoad)
            );
        },
        open: (thumb) => {
            SlideShow.display(thumb);
            SlideShowHTML.modal.show();
        },
        close: () => {
            SlideShowHTML.empty();
            SlideShow.stop();
        },
        start: () => {
            if (SlideShow.timeout !== null) {
                SlideShow.stop();
            } else {
                $("#WG-PRN-SLIDE-RANGE-DIV").show();
                $("#WG-PRN-SLIDE-START").hide();
                $("#WG-PRN-SLIDE-STOP").show();
                SlideShow.scheduleSlide(SlideShowHTML.getSlideSpeed());
            }
        },
        timeoutUpdate: () => {
            if (SlideShow.timeout !== null) {
                window.clearTimeout(SlideShow.timeout);
                SlideShow.scheduleSlide(SlideShowHTML.getSlideSpeed());
            }
        },
        scheduleSlide: (time) => {
            SlideShow.timeout = window.setTimeout(SlideShow.slideNext, time);
            SlideShow.timeoutOverride = null;
        },
        slideNext: () => {
            SlideShow.timeout = null;
            if (SlideShow.modalOpen()) {
                SlideShow.next();
                SlideShow.scheduleSlide(
                    SlideShow.timeoutOverride != null ? SlideShow.timeoutOverride : SlideShowHTML.getSlideSpeed()
                );
            }
        },
        stop: () => {
            window.clearTimeout(SlideShow.timeout);
            $("#WG-PRN-SLIDE-RANGE-DIV").hide();
            $("#WG-PRN-SLIDE-START").show();
            $("#WG-PRN-SLIDE-STOP").hide();
            SlideShow.timeout = null;
        },
        next: (loop) => {
            if (loop !== true) loop = false;
            let next = SlideShowHTML.getDisplayNext();
            if (next.length > 0) {
                SlideShow.display(next);
            } else if (!loop) {
                SlideShow.display(SlideShowHTML.getDisplayCurrent());
                SlideShow.next(true);
            } else {
                Page.loadNext(SlideShow.next);
            }
        },
        prev: () => {
            let prev = SlideShowHTML.getDisplayPrev();
            if (prev.length) {
                SlideShow.display(prev);
            }
        },
        progress: (dir) => {
            SlideShow.stop();
            if (dir > 0) {
                SlideShow.next();
            } else if (dir < 0) {
                SlideShow.prev();
            }
        },
        handleKeyDown: (e, key) => {
            if (SlideShow.modalOpen()) {
                if (Keys.isAnyKey(key, ["up", "down", "play"])) {
                    return true;
                } else if (Keys.isKey(key, "download")) {
                    SlideShowHTML.modalDL.trigger("click");
                    return true;
                }
            }
            return false;
        },
        handleKeyUp: (e, key) => {
            if (SlideShow.modalOpen()) {
                let lr = Keys.isKeyOrKey(key, "slidePrev", "slideNext");
                let ud = Keys.isKeyOrKey(key, "voteDown", "voteUp");
                if (lr) {
                    SlideShow.progress(lr);
                } else if (ud) {
                    if (ud < 0) {
                        $("#WG-PRN-VOTE-DOWN").trigger("click")
                    } else if (ud > 0) {
                        $("#WG-PRN-VOTE-UP").trigger("click");
                    }
                    e.preventDefault();
                } else if (Keys.isKey(key, "close")) {
                    e.preventDefault();
                    $("#WG-PRN-EXIT").trigger("click");
                } else if (Keys.isKey(key, "play")) {
                    e.preventDefault();
                    SlideShow.start();
                } else if (Keys.isKey(key, "favorite")) {
                    e.preventDefault();
                    $("#WG-PRN-FAVE").trigger("click");
                }
                return true;
            }
            return false;
        },
    }

    let SlideShowHTML = {
        modal: null,
        modalImg: null,
        modalDL: null,
        modalLink: null,
        modalSpeed: null,
        init: () => {
            SlideShowHTML.bind();
            SlideShowHTML.modalImg = $("#WG-PRN-IMG");
            SlideShowHTML.modal = $("#WG-PRN-MODAL");
            SlideShowHTML.modalDL = $("#WG-PRN-DOWN");
            SlideShowHTML.modalDL.on("click", SlideShowHTML.downloadCurrentSlide);
            SlideShowHTML.modalLink = $("#WG-PRN-LINK");
            SlideShowHTML.modalSpeed = $("#WG-PRN-SLIDE-RANGE-DISP");

            $("#WG-PRN-SLIDE-RANGE").val(Config.get("slideshow.speed"));
            return Promise.resolve();
        },
        getDisplayData: () => SlideShowHTML.modalImg.data(),
        getDisplayPrev: () => SlideShowHTML.getDisplayData().prev,
        getDisplayCurrent: () => SlideShowHTML.getDisplayData().current,
        getDisplayNext: () => SlideShowHTML.getDisplayData().next,
        getVideo: () => $("#WG-PRN-IMG video"),
        setVideoLoop: () => SlideShowHTML.getVideo().prop('loop', $("#WG-PRN-LOOP").is(':checked')),
        resetVideo: () => SlideShowHTML.getVideo().prop('currentTime', 0),
        downloadCurrentSlide: (e) => {
            Posts.save($(e.currentTarget).data("postID"));
        },
        getSlideSpeed: () => Config.get("slideshow.speed") * 1000,
        bind: () => {
            $("#WG-PRN-LOOP").on("input", SlideShowHTML.setVideoLoop);
            $("#WG-PRN-PREV").on("click", () => SlideShow.progress(-1));
            $("#WG-PRN-NEXT").on("click", () => SlideShow.progress(1));
            $("#WG-PRN-EXIT").on("click", SlideShow.close);
            $("#WG-PRN-SLIDE").on("click", SlideShow.start);
            // $("#WG-PRN-TAGS-TOGGLE").on("click", () => {
            //     $("#WG-PRN-TAGS").slideToggle(200);
            //     return false;
            // });
            $("#WG-PRN-MUTE").on("click", (e) => {
                var mute = !($(e.currentTarget).data("mute"));
                $(e.currentTarget).data("mute", mute);
                $("#WG-PRN-MUTE-YES").toggle(mute);
                $("#WG-PRN-MUTE-NO").toggle(!mute);
                var vid = $("#WG-PRN-IMG video");
                if (vid.length > 0) {
                    vid.prop('muted', mute);
                }
                return false;
            });
            if (User.loggedIn()) {
                $("#WG-PRN-VOTE a").on("click", SlideShowHTML.vote);
                $("#WG-PRN-FAVE").on("click", SlideShowHTML.fave);
            }
        },
        empty: () => {
            SlideShowHTML.modalImg.empty();
        },
        vote: (e) => {
            if (!User.loggedIn()) return;
            let lnk = $(e.currentTarget);
            let data = lnk.data();
            const dir = parseInt(data.score);
            const thumb = SlideShow.currentThumb;
            PageScript.vote(data.postID, dir)
                .then(d => {
                    $("#WG-PRN-VOTE a").removeClass("WG-voted");
                    lnk.toggleClass("WG-voted", d.our_score === dir);
                    $("#WG-PRN-VOTE-SCORE").text(d.score);
                    thumb.data("score", d.score);
                    thumb.data("voted", d.our_score === dir ? dir : 0);
                })
                .catch(() => console.log("VOTE FAIL", dir));
        },

        fave: (e) => {
            if (!User.loggedIn()) return;
            const lnk = $(e.currentTarget);
            let data = lnk.data();
            const thumb = SlideShow.currentThumb;
            const fave = !lnk.hasClass("WG-faved");
            PageScript.fave(data.postID, fave)
                .then(r => { lnk.toggleClass("WG-faved", fave); thumb.data("faved", fave); })
                .catch(() => console.log("FAVE FAIL", fave));
        }
    }
})();
