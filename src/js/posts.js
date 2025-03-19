var Posts;
(function() {
	const PostList = {};
	Posts = {
		init: () => {
			Keys.registerKeyDown(Posts.handleKeyDown, 300, "posts");
			return Promise.resolve();
		},
		getIDs: () => Object.keys(PostList),
		count: () => Posts.getIDs().length,
		isPost: (post) => typeof post === "object" && post !== null && post.hasOwnProperty("id") && post.hasOwnProperty("tags"),
		add: post => PostList[post.id] = post,
		get: id => PostList[id] || null,
		download: (id) => {
			return new Promise((res, rej) => {
				let post = Posts.get(id);
				if (post !== null) {
					res(post);
				} else {
					Request.get("/posts/" + id + ".json")
						.then((data) => {
							Posts.add(data.post);
							res(data.post);
						})
						.catch(rej);
				}
			});
		},
		genericDownload: (tags, total) => {
			const downloadID = "down" + Date.now();
			Save.modalCB(downloadID, "start", 0, 100);
			let postIDs = [];
			const colation = (posts) => {
				postIDs = [...postIDs, ...posts.map(post => post.id)];
				Save.modalCB(downloadID, "collect", postIDs.length, total);
			};
			const blacklisting = () => {
				Save.modalCB(downloadID, "blacklisting", 90, 100);
			};
			Posts.bulkDownloadTags(tags, colation)
				.then(() => {
					Promise.all(postIDs.map(postID => {
							return new Promise((res, rej) => {
								Posts.download(postID)
									.then(post => {
										blacklisting();
										PageScript.blackCheck(post)
											.then(black => {
												res(black ? null : postID);
											});
									});
							});
						}))
						.then(bPostIDs => {
							bPostIDs = bPostIDs.filter(v => v !== null);
							const pool = Pools.createFakePool(bPostIDs, tags);
							Pools.saveFolder(pool.id, true, downloadID);
						});
				});
		},
		bulkDownloadTags: (tags, cb, skipDl) => {
			tags = JSON.parse(JSON.stringify(tags));
			let params = [];
			if (tags.hasOwnProperty("tags")) {
				params = [...tags.tags];
				delete tags["tags"];
			}

			Object.keys(tags).forEach(k => {
				params.push(k + ":" + tags[k]);
			});

			return Posts.bulkDownload({ tags: params.join(" ") }, cb, skipDl);
		},
		bulkDownload: (params, cb, skipDl) => {
			if (skipDl === true) {
				return Promise.resolve();
			}
			params.limit = 300;
			return new Promise((resolve, reject) => {
				Posts.bulkDownloadStep(resolve, reject, params, 1, cb);
			});
		},
		bulkDownloadStep: (resolve, reject, params, page, cb) => {
			if (typeof cb !== "function") {
				cb = () => {};
			}
			params.page = page;
			Request.get("/posts.json", params)
				.then(resp => {
					let posts = [];
					if (resp.hasOwnProperty("posts")) {
						posts = resp.posts;
					} else {
						reject("Did not get expected posts object response");
					}
					if (posts instanceof Array) {
						posts.forEach(Posts.add);
						cb(posts);
						if (posts.length < params.limit) {
							resolve();
						} else {
							Posts.bulkDownloadStep(resolve, reject, params, page + 1, cb);
						}
					} else {
						reject("Did not get array response");
					}
				})
				.catch(e => { console.log("BULK DL REQUEST ERROR", e, [params, page]);
					reject(e); });
		},
		handleKeyDown: (e, key) => {
			if (Util.getPageCategory() === "/posts/<number>") {
				if (Keys.isKey(key, "download")) {
					console.log("SAVING", location.pathname.split("/")[2]);
					try {
						Posts.save(location.pathname.split("/")[2]);
					} catch (e) {
						console.log("Thumb Save", e);
					}
					return true;
				}
			}
			return false;
		},
		save: (id) => {
			Posts.download(id)
				.then(post => {
					Save.single(post.file.url, Posts.stringReplace(Config.get("download.fileNameString"), post) + "." + post.file.ext);
				});
		},
		fave: (id, create) => PageScript.fave(id, create),
		vote: (id, score) => PageScript.vote(id, score),
		toFileName: (post, str, map) => {
			if (typeof str !== "string") str = Config.get("download.fileNameString");
			let res = Posts.stringReplace(str, post, map) + "." + post.file.ext;
			return res;
		},
		stringReplace: (str, post, map) => {
			if (typeof map !== "object" || map === null || map instanceof Array) {
				map = {};
			}
			map = Object.assign({}, map, {
				"%id": post => post.id,
				"%s": post => post.score,
				"%r": post => post.rating,
				"%R": post => Trans.translate("post.rating", post.rating),
				"%NSFW": post => post.rating !== "s" ? Trans.translate("post.rating", "nsfw") : "",
				"%h": post => post.file.height,
				"%w": post => post.file.width,
				"%a": post => Posts.getArtists(post).join("+"),
				"%t": post => Posts.getAllTags(post).filter(tag => Config.get("download.tagsToKeep").includes(tag)).join("_"),
				"%ud": post => Trans.unixTimeToDateString(post.created_at.s * 1000, Config.get("download.dateString")),
				"%cd": () => Trans.unixTimeToDateString(Date.now(), Config.get("download.dateString")),
				"%ut": post => Trans.unixTimeToDateString(post.created_at.s * 1000, Config.get("download.timeString")),
				"%ct": () => Trans.unixTimeToDateString(Date.now(), Config.get("download.timeString")),
				"%TCH": post => [...new Set(post.tags.character)].join(" "),
				"%TCC": post => [...new Set(post.tags.copyright)].join(" "),
				"%TSP": post => [...new Set(post.tags.species)].join(" "),
			});
			return Util.stringMap(str, post, map);
		},
		getRating: post => {
			if (typeof post !== "object") {
				post = Posts.get(post);
			}
			return post.rating;
		},
		getAllTags: post => {
			if (typeof post !== "object") {
				post = Posts.get(post);
			}
			let tags = [];
			Object.keys(post.tags).forEach(section => {
				tags = [...tags, ...post.tags[section]];
			});
			return [...new Set(tags)];
		},
		getArtists: post => {
			if (typeof post !== "object") {
				post = Posts.get(post);
			}
			return post.tags.artist.map(a => a.replace("_(artist)", ""));
		}
	};
})();