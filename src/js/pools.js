var Pools;
(function() {
	const PoolList = {};
	Pools = {
		list: {},
		init: () => {
			// Pools.afterPaginate();
			// Page.registerAfterPaginate(Pools.afterPaginate);
			return Promise.resolve();
		},
		afterPaginate: () => {
			// const path = Util.getPageCategory();
			// switch (path) {
			//     case "/pools/<number>":
			//         Pools.addPoolHashToThumbs();
			//         break;
			// }
		},
		addPoolHashToThumbs: () => {
			// $(Thumbs.cssThumb + " a:not(.WG-POOL-PAGINATED)").each(function () {
			//     $(this)
			//         .attr("href", $(this).attr("href") + "#WG-PAGINATE|POOL|" + location.pathname.split("/")[2])
			//         .addClass("WG-POOL-PAGINATED");
			// });
		},
		getIDs: () => Object.keys(PoolList),
		isPost: (pool) => pool.hasOwnProperty("id") && pool.hasOwnProperty("name"),
		add: pool => PoolList[pool.id] = pool,
		get: id => PoolList[id] || null,
		saveFolder: (poolID, skipDl, _downloadID) => Pools.save(poolID, skipDl, _downloadID),
		save: (poolID, skipDl, _downloadID) => {
			const downloadID = _downloadID || "down" + Date.now();
			Save.modalCB(downloadID, "start", 0, 100);
			Pools.download(poolID)
				.then((pool) => {
					Save.modalCB(downloadID, "collect", 0, pool.post_count);
					let postCount = 0;
					Posts.bulkDownloadTags({ pool: pool.id }, (posts) => { postCount += posts.length;
							Save.modalCB(downloadID, "collect", postCount, pool.post_count); }, skipDl)
						.then(() => {
							const folderName = Pools.toFileName(pool, undefined, undefined, skipDl);
							Save.modalCB(downloadID, "collect", 0, 100, folderName);
							Pools.getZipData(pool, downloadID)
								.then(zipData => {
									BrowserMessage.dlBulk(downloadID, zipData, folderName);
								})
								.catch(e => console.log(e));
						})
						.catch(e => console.log("Bulk DL ERROR", e));
				})
				.catch((r, s, x) => { console.log("Pool DL For Save Failed", { r: r, s: s, x: x }); });
		},
		// save: (id, skipDl, _downloadID) => {
		//     const downloadID = _downloadID || "down" + Date.now();
		//     Save.modalCB(downloadID, "start", 0, 100);
		//     console.log("DL", id, "skip", skipDl);
		//     Pools.download(id)
		//         .then((pool) => {
		//             Save.modalCB(downloadID, "collect", 0, pool.post_count);
		//             let postCount = 0;
		//             Posts.bulkDownloadTags({ pool: pool.id }, (posts) => { postCount += posts.length; Save.modalCB(downloadID, "collect", postCount, pool.post_count); }, skipDl)
		//                 .then(() => {
		//                     Pools.getZipData(pool, downloadID)
		//                         .then(zipData => {
		//                             Save.multiple(Pools.toFileName(pool, undefined, undefined, skipDl) + ".zip", zipData)
		//                                 .then(() => {
		//                                     //console.log("SAVED");
		//                                 })
		//                                 .catch(console.log);
		//                         })
		//                         .catch(e => console.log(e));
		//                 })
		//                 .catch(e => console.log("Bulk DL ERROR", e));
		//         })
		//         .catch((r, s, x) => { console.log("Pool DL For Save Failed", { r: r, s: s, x: x }); });
		// },
		getZipData: (pool, downloadID) => {
			return Promise.all(pool.post_ids.map(
				(postID, i, ar) => Pools.getZipDataPart(pool, postID, i, ar, downloadID)
			));
		},
		getZipDataPart: (pool, postID, i, ar, downloadID) => {
			return new Promise((res, rej) => {
				Posts.download(postID)
					.then(post => {
						Save.modalCB(downloadID, "calculate", i + 1, ar.length);
						if (post.flags.deleted) {
							if (Config.get("download.skipDeleted")) {

							} else {
								post.file.url = Util.baseURL + "/images/deleted-preview.png";
							}
							console.log(post.file.url);
						} else if (typeof post.file.url !== "string") {
							post.file.url = "https://static1.e621.net/data/" + post.file.md5.substring(0, 2) + "/" + post.file.md5.substring(2, 4) + "/" + post.file.md5 + "." + post.file.ext;
						}
						const zipData = {
							url: post.file.url,
							name: Posts.toFileName( // TODO : Error here with fileName because tags are split up into groups now
								post,
								Config.get("download.poolFileNameString"),
								{
									"%pI": Util.strPadLeft((i + 1).toString(), "0", pool.post_count.toString().length),
									"%pi": (i + 1).toString(),
									"%pz": i.toString(),
									"%pZ": Util.strPadLeft((i).toString(), "0", pool.post_count.toString().length),
									"%pn": Pools.getCleanName(pool),
									"%pc": pool.post_ids.length,
								}
							),
						};
						res(zipData);
					})
					.catch(rej);
			});
		},
		getCleanName: pool => pool.name.split("_").join(" "),
		download: id => {
			return new Promise((res, rej) => {
				let pool = Pools.get(id);
				if (pool !== null) {
					res(pool);
				} else {
					Request.get("/pools/" + id + ".json")
						.then(pool => { Pools.add(pool);
							res(pool); })
						.catch(rej);
				}
			});
		},
		toFileName: (pool, str, map, fake) => {
			if (typeof str !== "string") str = Config.get("download.poolNameString");
			return Pools.stringReplace(str, pool, map, fake);
		},
		getRating: pool => {
			if (typeof pool !== "object") {
				pool = Pools.get(pool);
			}
			let rating = "s";
			pool.post_ids.forEach(postID => {
				let r = Posts.getRating(postID);
				if (r !== "s") {
					if (rating === "s" || rating === "q") {
						rating = r === "q" ? "q" : "r";
					}
				}
			});
			return rating;
		},
		getAllTags: pool => {
			if (typeof pool !== "object") {
				pool = Pools.get(pool);
			}
			let tags = [];
			pool.post_ids.forEach(postID => {
				tags = [...tags, ...Posts.getAllTags(postID)];
			});
			return [...new Set(tags)];
		},
		getArtists: pool => {
			if (typeof pool !== "object") {
				pool = Pools.get(pool);
			}
			let artists = [];
			pool.post_ids.forEach(postID => {
				artists = [...artists, ...Posts.getArtists(postID)];
			});
			return artists.filter((e, i, a) => a.indexOf(e) === i);
		},
		stringReplace: (str, post, map, fake) => {
			if (typeof map !== "object" || map === null || map instanceof Array) {
				map = {};
			}
			map = Object.assign({}, map, {
				"%id": pool => pool.id,
				"%n": pool => pool.name,
				"%pn": pool => Pools.getCleanName(pool),
				"%a": fake ? "Bulk Download" : pool => Pools.getArtists(pool).join("+"),
				"%r": pool => Pools.getRating(pool),
				"%t": pool => Pools.getAllTags(pool).filter(tag => Config.get("download.tagsToKeep").includes(tag)).join("_"),
				"%ud": pool => Trans.unixTimeToDateString(pool.created_at.s * 1000, Config.get("download.dateString")),
				"%cd": () => Trans.unixTimeToDateString(Date.now(), Config.get("download.dateString")),
				"%ut": pool => Trans.unixTimeToDateString(pool.created_at.s * 1000, Config.get("download.timeString")),
				"%ct": () => Trans.unixTimeToDateString(Date.now(), Config.get("download.timeString")),
			});
			return Util.stringMap(str, post, map);
		},
		getPagePoolID: () => {
			let path = window.location.pathname.split("/").filter(str => str.length);
			if (path.length < 2) return false;
			if (path[0] !== "pool" || path[1] !== "show") return false;
			let id = NaN;
			if (path.length > 2) {
				id = path[2].split(".")[0];
			}
			var urlParams = new URLSearchParams(window.location.search);
			if (urlParams.has("id")) {
				id = urlParams.get("id");
			}
			if (isNaN(id)) {
				return false;
			}
			return id;
		},
		saveBtn: (e) => {
			const poolID = $(e.currentTarget).data("pool_id");
			Pools.save(poolID);
		},
		createFakePool: (postIDs, search) => {
			let name = "Bulk Download";
			if (search.hasOwnProperty("tags")) {
				name = search.tags.join("+");
			}
			const pool = {
				id: "f" + Date.now(),
				name: name,
				created_at: "2018-11-14T17:19:19.956-05:00",
				updated_at: "2020-03-12T16:29:00.715-04:00",
				creator_id: 278376,
				description: "",
				is_active: true,
				category: "collection",
				is_deleted: false,
				post_ids: [...postIDs],
				creator_name: "itsadoggydogworld",
				post_count: postIDs.length,
			};
			Pools.add(pool);
			return pool;
		},
	};
})();