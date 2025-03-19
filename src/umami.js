(function() {

	console.clear();
	if (typeof browser === "undefined") {
		if (typeof chrome === "undefined") {
			console.log("UMAMI", "COULD NOT FIND BROWSER OR CHROME");
			return;
		}
		browser = chrome;
	}

	// window.setInterval(() => {
	//     browser.runtime.sendMessage({
	//         from_background: "BEEP",
	//     });
	// }, 1000);

	browser.runtime.onMessage.addListener(onMessage);

	const umamiTabs = {};

	const sendToTabs = (type, data) => {
		browser.tabs.query({}).then(tabs => {
			const tabIDs = tabs.map(tab => parseInt(tab.id));
			umamiTabs.forEach((tab, k) => {
				if (tabIDs.includes(parseInt(tab.id))) {
					browser.tabs.sendMessage(tab.id, { type: type, data: data, src: "umami-background" });
				} else {
					delete umamiTabs[k];
				}
			});
		});
	};

	s2t = sendToTabs;

	console.log("UMAMI", "INIT");

	const bulkDLs = {};
	const activeBulkDLs = {};
	let bulkDlInterval = null;

	const cleanFileName = name => name.replace(/[^a-z0-9 \\\/\(\)\.\-\[\]]/gi, '_');
	const cleanFolderName = name => name.replace(/[^a-z0-9 \(\)\.\-\[\]]/gi, '_');

	const bulkDL = (files, folder, root, id) => {
		files = JSON.parse(JSON.stringify(files));

		const key = "bdl" + Date.now();

		bulkDLs[key] = {
			id: id,
			root: root || "",
			folder: folder,
			files: files,
			count: files.length,
			done: [],
		};

		if (bulkDlInterval === null) {
			window.setInterval(startBulkDL, 200);
		}
	};

	const completeBulkDL = (key) => {
		browser.downloads.show(bulkDLs[key].done[0]);
		delete bulkDLs[key];
	};

	const completeBulkDLItem = (obj) => {
		const id = obj.id;
		const key = activeBulkDLs[id];
		const dl = bulkDLs[key];
		dl.done.push(id);
		browser.downloads.erase({ id: id }).then(() => {
			console.log("ERASED", id);
			sendToTabs("bulk_dl_step", { id: dl.id, count: dl.count, done: dl.done.length, name: dl.folder, file: "file" });
			if (bulkDLs[key].done.length === bulkDLs[key].count) {
				completeBulkDL(key);
			}
			delete activeBulkDLs[id];
		});
	};

	const pathCombine = (arr) => arr.join("/").split("/").map(val => val.trim()).filter(val => val.length).join("/");

	const getBulkDL = () => {
		const key = Object.keys(bulkDLs).sort().shift();
		if (typeof key === "undefined") return null;
		const result = { key: key };
		const folder = cleanFolderName(bulkDLs[key].folder);
		const root = cleanFolderName(bulkDLs[key].root);
		const file = bulkDLs[key].files.shift();
		if (typeof file === "undefined") {
			result.file = null;
		} else {
			result.url = file.url;
			result.file = pathCombine([root, folder, cleanFileName(file.name)]);
		}
		return result;
	};

	const startBulkDL = () => {
		if (Object.keys(activeBulkDLs).length >= 5) {
			return;
		}
		const dl = getBulkDL();
		if (dl === null) {
			window.clearInterval(bulkDlInterval);
			bulkDlInterval = null;
			return;
		}
		if (dl.file === null) {
			return;
		}
		const fake = "p" + Date.now();
		activeBulkDLs[fake] = false;
		browser.downloads.download({
			url: dl.url,
			filename: dl.file,
			saveAs: false,
			conflictAction: browser.downloads.FilenameConflictAction.OVERWRITE,
		}).then((dlID) => {
			activeBulkDLs[dlID] = dl.key;
			delete activeBulkDLs[fake];
		}).catch(e => {
			delete activeBulkDLs[fake];
		});
	};

	const bulkDLChange = (obj) => {
		const id = obj.id;
		if (typeof activeBulkDLs[id] === "string") {
			if (obj.state.current === "complete") {
				window.setTimeout(() => {
					completeBulkDLItem(obj);
				}, 500);
			}
		}
	};

	browser.downloads.onChanged.addListener(bulkDLChange);

	let commands = {
		openTab: (cmd) => {
			return new Promise((res, rej) => {
				browser.tabs.create({
					active: true,
					url: cmd.url,
				});
				res("done");
			});
		},
		download: (cmd) => {
			return new Promise((res, rej) => {
				browser.downloads.download({
					url: cmd.url,
					filename: cmd.filename,
				});
				res("done");
			});
		},
		bulk_download: cmd => {
			bulkDL(cmd.files, cmd.foldername, cmd.root, cmd.id);
			return Promise.resolve();
		},
		request: request,
		openUri: data => {
			return commands.openTab({ url: data.uri });
		},
		ping: () => Promise.resolve(),
	};

	// commands.openTab(
	//     {
	//         url: 'tg://msg_url?url=https://static1.e926.net/data/sample/59/7d/597dab4e8ff4bfdd0fc87878beb485c9.jpg&text=LOOK NOT PORN'
	//     }
	// );

	function runCommand(type, data) {
		if (commands.hasOwnProperty(type)) {
			if (typeof commands[type] === "function") {
				return commands[type](data);
			}
		}
		console.log("MISSING COMMAND", type);
		return Promise.reject({ err: "NO FUNC TYPE" });
	}

	function onMessage(message, sender, sr) {
		const { type, data, src } = message;
		if (src !== "umami-content") return;
		umamiTabs[sender.tab.id] = sender.tab;
		try {
			return new Promise((resolve, reject) => {
				try {
					runCommand(type, data)
						.then(resolve)
						.catch(reject);
				} catch (e) {
					console.log("onmsg prom error", e);
					reject(e);
				}
			});
		} catch (e) {
			console.log("onmsg error", e);
			return Promise.reject(e);
		}
	}

	function processRequest() {
		const request = pendingReqs.shift();
		const data = request.data;
		const resolve = request.resolve;
		const reject = request.reject;
		let url = data.url;
		let params = data.params || {};
		if (params.query) {
			url += (url.indexOf('?') === -1 ? '?' : '&') + queryParams(params.query);
			delete params.query;
		}

		fetch(url, params)
			.then(requestResponseCast)
			.then(resolve)
			.catch(reject)
			.finally(() => {
				reqTimeout = null;
				if (pendingReqs.length > 0) {
					reqTimeout = setTimeout(processRequest, 1000);
				}
			});
	}

	let reqTimeout = null;
	const pendingReqs = [];

	function request(data) {
		return new Promise((resolve, reject) => {
			pendingReqs.push({
				data: data,
				resolve: resolve,
				reject: reject,
			});
			if (reqTimeout === null) {
				reqTimeout = setTimeout(processRequest, 1);
			}
		});
	}

	function requestResponseCast(response) {
		const contentType = response.headers.get("content-type");
		if (contentType && contentType.indexOf("application/json") !== -1) {
			try {
				return response.json();
			} catch (e) {

			}
		}
		return response.text();
	}

	function queryParams(params) {
		return Object.keys(params)
			.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
			.join('&');
	}

	// function notify(msg) {
	//     browser.notifications.create({
	//         "type": "basic",
	//         "iconUrl": browser.extension.getURL("icons/salt.png"),
	//         "title": "You clicked a link!",
	//         "message": msg
	//     });
	// }

})();