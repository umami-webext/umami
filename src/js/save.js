var Save;
(function() {
	Save = {
		modalID: "WG-PRN-SAVE",
		modalOpen: () => $("#" + Save.modalID).is(":visible"),
		init: () => {
			Keys.registerKeyDown(Save.handleKeys, -100, "save");
			Keys.registerKeyUp(Save.handleKeys, -100, "save");
			Config.registerUi("download", Save.uiInit);
			Page.registerAfterPaginate(Save.paginate);
			$(".WG-SAVE-PROC").removeClass("WG-SAVE-PROC");
			BrowserMessage.register("bulk_dl_step", Save.bulkDlStep);
			return Promise.resolve();
		},
		uiInit: id => {
			return new Promise(resolve => {
				ConfigTableHTML.createIn("#" + id, "download");
				resolve(id);
			});
		},
		downloadMethods: {
			"/pools/<number>": () => {
				Save.basicDlButton(location.pathname.split("/")[2]).insertAfter("a.pool-category-series");
				Trans.translateUI("#c-pools");
			},
			"/posts/<number>": () => {
				$('#pool-nav span.pool-name a').each((i, e) => {
					Save.basicDlButton($(e).attr("href").substr(7)).insertAfter(e);
				});
				Trans.translateUI("#pool-nav");
			},
			"/pools": () => {
				if ($("#c-pools").length < 1) return;
				$("#c-pools table:not(.search) tbody tr:not(.WG-SAVE-PROC)").each((i, e) => {
					$(e).addClass("WG-SAVE-PROC");
					let a = $(e).find("a").first();
					Save.basicDlButton(a.attr("href").split("/")[2])
						.addClass("WG-float-right")
						.insertAfter(a)
				});
				Trans.translateUI("#c-pools");
			},
			"/": "/posts",
			"": "/posts",
			"/posts": () => {
				const count = $(Thumbs.cssThumb).length;
				const pages = parseInt($("div.paginator li.numbered-page a").last().text()) || 1;
				if ((count * pages) <= 1000) {
					$("menu#post-sections li.active")
						.append(
							$("<button>")
							.addClass("WG-reload-remove WG-pool-show-dl-btn")
							.data({ params: window.location.search, total: count * pages })
							.on("click", (e) => { Posts.genericDownload(Util.urlParams($(e.currentTarget).data("params")), $(e.currentTarget).data("total")); })
							.append(Trans.createElem("ui", "downloadAsZip"))
							//.append(Trans.createElem("ui", "warningNotBlacklisted").addClass("WG-WARN"))
						);
					Trans.translateUI("menu#post-sections");
				}
			}
		},
		basicDlButton: (id) => Trans.createElem("ui", "downloadAsZip", "button")
			.addClass("WG-reload-remove WG-pool-show-dl-btn")
			.data({ pool_id: id })
			.on("click", Pools.saveBtn)
			.attr("rel", "pool|" + id),
		getDownloadMethodForPage: () => {
			let path = Util.getPageCategory();
			let method = Object.keys(Save.downloadMethods).find((method) => {
				return path.startsWith(method);
			});
			if (typeof method === "string") {
				method = Save.downloadMethods[method];
				if (typeof method === "string") {
					method = Save.downloadMethods[method];
				}
				if (typeof method === "function") {
					return method;
				}
			}
			return () => {};
		},
		paginate: () => {
			Save.getDownloadMethodForPage()();
		},
		htmlInit: () => {
			Save.paginate();
			return Promise.resolve();
		},
		handleKeys: (e, key) => {
			if (Save.modalOpen()) {
				e.preventDefault();
				return true;
			}
			return false;
		},
		single: (url, fileName) => BrowserMessage.download(url, fileName),
		setProgress: (downloadID, c, t, txt1, txt2) => {
			if (typeof txt1 !== "string") txt1 = "";
			if (typeof txt2 !== "string") txt2 = "";
			if (txt2.length > 0) txt2 = " : " + txt2;
			const bar = Save.getCreateSaveBar(downloadID);
			let w = Math.ceil((c / t) * 100);
			if (txt2.length > 0) {
				bar.find("p").text(txt2);
			}
			bar.find(".progress-bar").css("width", w + "%").text(w + "%");
		},
		bulkDlStep: data => {
			const { count, done, id, name, file } = data;
			Save.modalCB(id, count == done ? "done" : "download", done, count, name);
		},
		// setText: (txt1, txt2) => {
		//     if (typeof txt1 !== "string") txt1 = "";
		//     if (typeof txt2 !== "string") txt2 = "";
		//     const bar = Save.getCreateSaveBar(downloadID);
		//     bar.find("")
		//     $("#WG-PRN-SAVE-TXT1").text(txt1);
		//     $("#WG-PRN-SAVE-TXT2").text(txt2);
		// },
		modalCB: (downloadID, step, c, t, f) => {
			switch (step) {
				case "done":
					$("#DL-BAR-" + downloadID).remove();
					if ($("#" + Save.modalID + " .progress").length < 1) {
						$("#" + Save.modalID).hide();
					}
					return;
				default:
					$("#" + Save.modalID).show();
					break;
			}
			Save.setProgress(downloadID, c, t, Trans.translate("save", step), f);
		},
		getCreateSaveBar: downloadID => {
			let id = "DL-BAR-" + downloadID;
			let bar = $("#" + id);
			if (bar.length < 1) {
				bar = $("<div>")
					.attr({ id: id })
					.append($("<p>"))
					.append(
						$("<div>")
						.addClass("progress")
						.append(
							$("<div>")
							.attr({ class: "progress-bar progress-bar-striped active" })
							.text("0%")
						)
					);
				$("#WG-PRN-SAVE-BAR-CONTAINER").append(bar);
			}
			return bar;
		},
		// inProgress: false,
		// multiple: (zipName, files, cb) => {
		//     if (typeof cb !== "function") cb = Save.modalCB;
		//     return new Promise((res, rej) => {
		//         try {
		//             if (Save.inProgress) {
		//                 rej(false);
		//                 return;
		//             }
		//             Save.inProgress = true;
		//             cb("start", 0, 100);
		//             Save.download(files, cb)
		//                 .then((zip) => {
		//                     Save.compress(zip, cb)
		//                         .then((content) => {
		//                             cb("done", 1, 1, zipName);
		//                             saveAs(content, zipName);
		//                             Save.inProgress = false;
		//                             res(true);
		//                         })
		//                         .catch(rej);
		//                 })
		//                 .catch(rej);
		//         } catch (e) { console.log(e); }
		//     });
		// },
		// compress: (zip, cb) => {
		//     return new Promise((res, rej) => {
		//         cb("zipup", 0, 100);
		//         zip.generateAsync(
		//             { type: "blob" },
		//             (meta) => {
		//                 cb("zip", meta.percent.toFixed(2), 100, meta.currentFile);
		//             }
		//         ).then((content) => {
		//             res(content);
		//         })
		//             .catch(rej);
		//     });
		// },
		// download: (files, cb) => {
		//     return new Promise((res, rej) => {
		//         let zip = new JSZip();
		//         let count = 0;
		//         let dlCount = 0;
		//         let intv = window.setInterval(() => {
		//             if (count < dlCount) {
		//                 return;
		//             }
		//             let file = files[dlCount];
		//             dlCount++;
		//             if (dlCount >= files.length) {
		//                 window.clearInterval(intv);
		//             }
		//             if (file.url === null) {
		//                 count++;
		//                 cb("download", count, files.length, file.name);
		//             } else {
		//                 try {
		//                     JSZipUtils.getBinaryContent(file.url, (err, data) => {
		//                         if (err) {
		//                             window.clearInterval(intv);
		//                             rej(err);
		//                         }
		//                         try {
		//                             zip.file(file.name, data, { binary: true });
		//                             count++;
		//                             cb("download", count, files.length, file.name);
		//                             if (count == files.length) {
		//                                 res(zip);
		//                             }
		//                         } catch (e) {
		//                             rej(e);
		//                             window.clearInterval(intv);
		//                         }
		//                     });
		//                 } catch (e) {
		//                     console.log(e, file.url);
		//                 }
		//             }
		//         }, 500);
		//     });
		// },
	};
})();