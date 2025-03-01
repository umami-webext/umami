var Config;
var ConfigTableHTML = {};
var ConfigArrayTableHTML = {};
var DefaultConfig = {};

(function() {
	const defaultConf = {
		version: "0.0.0",
		versionCheck: null,
		general: {
			infiniteScroll: true,
			slideshow: true,
			keyBinds: true,
			largeImages: false,
			activeLanguage: "en",
		},
		keys: {
			up: ["ArrowUp", "w"],
			down: ["ArrowDown", "s"],
			left: ["ArrowLeft", "a"],
			right: ["ArrowRight", "d"],
			close: ["Escape"],
			play: [" "],
			slideNext: ["ArrowRight", "d"],
			slidePrev: ["ArrowLeft", "a"],
			open: ["Enter"],
			openInTab: ["ctrl + Enter"],
			voteUp: ["ArrowUp"],
			voteDown: ["ArrowDown"],
			favorite: ["f"],
			download: ["ctrl + s"],
		},
		slideshow: {
			speed: 5,
			video: {
				autoplay: false,
				loop: false,
			}
		},
		download: {
			fileNameString: "[%a]-%cd_%id_%t_(%wx%h)",
			poolNameString: "[%a]-%pn-%cd",
			poolFileNameString: "%pn_%pI",
			timeString: "%H-%I-%S",
			dateString: "%Y-%M-%D",
			//seperator: "_",
			tagsToKeep: ["solo", "feral", "anthro"],
			skipDeleted: true,
		},
		share: {
			messages: {
				post: "Look at this post",
				pool: "Look at this pool",
				page: "Look at this page",
			},
			platforms: [
				{ name: "Telegram", uri: "tg://msg_url?url=%url&text=%msg" }
			]
		},
		selectors: {
			thumb: "article.thumbnail",
			blacklisted: ".blacklisted-active,.blacklisted"
		}
	};
	DefaultConfig.get = () => JSON.parse(JSON.stringify(defaultConf));
})();

(function() {
	let settings = {};
	let hooks = {};
	let lastSave = null;
	Config = {
		modalID: "WG-PRN-CONFIG",
		get: (path) => Object.getByPath(settings, path),
		set: (path, value) => {
			Object.setByPath(settings, path, value);
			window.setTimeout(() => Config.triggerHooks(path, value), 100);
			Config.save();
			ConfigHTML.autoDisplay(path);
			return value;
		},
		triggerHooks: (path, value) => {
			let hookSets = Config.getHooksByPath(path);
			hookSets.forEach(set => set.hooks.forEach(cb => cb(path, value)))
		},
		hook: (path, cb) => {
			if (hooks.hasOwnProperty(path)) {
				hooks[path].hooks = [...hooks[path].hooks, cb];
			} else {
				hooks[path] = {
					regex: Util.pathWildCardRegex(path, ".", true),
					hooks: [cb],
				};
			}
		},
		getHooksByPath: path => Object.values(hooks).filter(set => set.regex.test(path)),
		getDefault: path => Object.getByPath(DefaultConfig.get(), path),
		resetValue: path => Config.set(path, Config.getDefault(path)),
		modalOpen: () => $("#" + Config.modalID).is(":visible"),
		init: () => {
			Keys.registerKeyUp(Config.handleKeyUp, 10, "config");
			Keys.registerKeyDown(Config.handleKeyDown, 10, "config");
			browser.storage.onChanged.addListener(Config.storageChange);
			return new Promise((resolve, reject) => {
				browser.storage.local.get("config")
					.then(Config.load)
					.then(Config.save)
					.then(resolve)
					.catch(reject);
			});
		},
		//settings: null,
		keyGroups: [
			["up", "down", "left", "right", "open", "openInTab"],
			["close", "play", "slideNext", "slidePrev", "voteUp", "voteDown", "favorite", "download"],
		],
		isCaptureingKeys: () => Config.keyCapture !== null,
		keyCapture: null,

		saveTimeout: null,
		save: () => {
			return new Promise((resolve, reject) => {
				if (Config.saveTimeout !== null) {
					window.clearTimeout(Config.saveTimeout);
				}
				Config.saveTimeout = window.setTimeout(function() {
					Config.saveTimeout = null;
					lastSave = Date.now();
					settings.version = Version.current();
					browser.storage.local.set({ config: settings }).then(resolve);
				}, 1000);
			});
		},
		storageChange: (changed, area) => {
			if (area === "local" && changed.hasOwnProperty("config")) {
				Config.load({ config: changed.newValue });
			}
		},
		loadDefault: () => {
			settings = DefaultConfig.get();
		},

		load: (stored) => {
			if (!stored.hasOwnProperty("config")) {
				let str = localStorage.getItem("WG_UMAMI_CONFIG");
				if (str === null) {
					str = "{}";
				}
				let cfg = JSON.parse(str);
				if (!cfg) cfg = {};
				stored.config = cfg;

			}
			ConfigMigrator.migrate(stored.config, Version.current(), stored.config.version || "0.0.0");
			Config.loadDefault();
			Util.mergeOverObject(settings, stored.config);
			return Promise.resolve();
		},

		confirmReset: () => {
			if (window.confirm("Are you sure you want to reset config?")) {
				Config.reset();
			}
		},

		reset: () => {
			Config.loadDefault();
			Config.save();
			ConfigHTML.reload();
		},

		htmlInit: () => {
			ConfigHTML.init();
			return Promise.resolve();
		},

		handleKeyUp: (e, key) => {
			if (Config.modalOpen()) {
				if (Config.isCaptureingKeys()) {
					ConfigHTML.captureKey(e);
				} else if (Keys.isKey(key, "close")) {
					ConfigHTML.closeModal();
				}
				return true;
			}
			return false;
		},

		handleKeyDown: (e, key) => {
			if (Config.modalOpen()) {
				if (Config.isCaptureingKeys()) {
					e.preventDefault();
				}
				return true;
			}
			return false;
		},

		registerUi: (name, cb) => ConfigHTML.register(name, cb),
	};

	let ConfigHTML = {
		uis: {},
		rendered: false,
		init: () => {
			$("<li>").attr("id", "nav-umami").addClass("WG-reload-remove").append(
				$("<a>").attr("href", "#!").text("Umami")
				.on("click", () => { $("#WG-PRN-CONFIG").show(); })
			).insertBefore($("li#nav-more"));
			ConfigHTML.bind();
			ConfigHTML.render();
			ConfigHTML.autoConfig();
			ConfigHTML.autoDisplay();
			return Promise.resolve();
		},
		reload: () => {
			ConfigHTML.clear();
			ConfigHTML.render();
		},
		bind: () => {
			$("#WG-PRN-CONFIG-OPEN").on("click", ConfigHTML.openModal);
			$("#WG-PRN-CONFIG-EXIT").on("click", ConfigHTML.closeModal);
			$("#WG-PRN-CONFIG-RESET").on("click", Config.confirmReset);
			$("#WG-PRN").on("input", ".WG-auto-config", ConfigHTML.autoUpdate);
			//$("#WG-PRN").on("changed", "input[type='range'].WG-auto-config", ConfigHTML.autoUpdate);
		},
		openModal: () => $("#WG-PRN-CONFIG").show(),
		closeModal: () => $("#WG-PRN-CONFIG").hide(),
		autoUpdate: e => {
			e = $(e.currentTarget);
			let val = e.val();
			if (e.attr("type") === "checkbox") {
				val = e.prop("checked");
			}
			Config.set(e.attr("rel"), val);
		},
		autoConfig: path => {
			$("#WG-PRN input.WG-auto-config" + ConfigHTML.pathToRelFilter(path)).each((i, e) => {
				let val = Config.get($(e).attr("rel"));
				if ($(e).attr("type") === "checkbox") {
					$(e).prop("checked", val === true);
				} else {
					$(e).val(val);
				}
			});
		},
		autoDisplay: path => {
			$("#WG-PRN .WG-auto-config-disp" + ConfigHTML.pathToRelFilter(path)).each((i, e) => {
				let val = Config.get($(e).attr("rel"));
				$(e).text(val);
			});
		},
		pathToRelFilter: path => (typeof path === "string" && path.length > 0) ? '[rel="' + path + '"]' : "",
		register: (name, cb) => {
			ConfigHTML.uis[name] = cb;
			if (ConfigHTML.rendered) {
				ConfigHTML.reload();
			}
		},

		clear: () => {
			$("#WG-PRN-CONFIG tbody").empty();
			$(".WG-CONFIG-CLEAR").remove();
		},

		render: () => {
			for (name in ConfigHTML.uis) {
				ConfigHTML.addSection(name);
			}
			ConfigHTML.renderKeyTable();
		},

		addSection: name => {
			const sectionID = ConfigHTML.getSectionID(name);
			const containerID = ConfigHTML.getContainerID(name);
			try {
				let container = $("<div>")
					.attr({ id: containerID })
					.append(ConfigHTML.createSectionAccordionLink(name))
					.append($("<br>"))
					.append($('<div style="display:none;">').attr({ id: sectionID }));

				$("#WG-PRN-CONFIG-BODY")
					.append($("<hr>").addClass("WG-CONFIG-CLEAR"))
					.append(container.addClass("WG-CONFIG-CLEAR"));

			} catch (e) {
				console.log(e);
			}
			//console.log(ConfigHTML.uis, name);
			ConfigHTML.uis[name](sectionID)
				.then(() => {
					Trans.translateUI("#" + containerID);
				})
				.catch(error => console.log("Config Section Load Failed", name, e));
		},

		getSectionID: name => "WG-PRN-CONFIG-" + name + "-SECTION",
		getContainerID: name => "WG-PRN-CONFIG-" + name + "-CONTAINER",

		createSectionAccordionLink: (name) => {
			return $('<a>')
				.attr({ href: "#!" })
				.data({ toggle: "#" + ConfigHTML.getSectionID(name) })
				.addClass("WG-toggle-link")
				.append(Trans.createElem(name + ".config", "title"))
				.append('&nbsp;')
				.append('<span class="glyphicon glyphicon-plus WG-toggle-disp">')
				.append('<span class="glyphicon glyphicon-minus WG-toggle-disp" style="display: none;">')
		},

		renderKeyTable: () => {
			let odd = true;
			Object.keys(Config.get("keys")).forEach((key) => {
				let row = $("<tr>").addClass("rounded-" + (odd ? "odd" : "even"));

				row.append($("<td>").append($("<span>").text(Trans.translate("keys", key))));

				row.append(ConfigHTML.createRecapKeyTD(key, 0));
				row.append(ConfigHTML.createRecapKeyTD(key, 1));

				$("#WG-PRN-KEY-TABLE tbody").append(row);
				odd = !odd;
			});

			ConfigHTML.keyConflictCheck();
		},

		createRecapKeyTD: (key, index) => {
			return $("<td>")
				.append(ConfigHTML.createRecapKeyBtn(key, index))
				.append(ConfigHTML.createKeyClearBtn(key, index));
		},

		createRecapKeyBtn: (key, index) => {
			return $('<input type="button">')
				.addClass("WG-keycap-btn")
				.addClass("WG-cap-key")
				.val(Trans.key(Config.get("keys")[key][index]))
				.attr("id", "WG-KEY-CAP-" + key + "-" + index)
				.data({ key: key, index: index })
				.on("click", ConfigHTML.recapKey);
		},

		createKeyClearBtn: (key, index) => {
			return $("<a>")
				.on("click", ConfigHTML.resetKey)
				.addClass("WG-keycap-reset")
				.data({ key: key, index: index })
				.append(
					$("<span>").addClass("glyphicon glyphicon-remove")
				);
		},


		updateKeyCapBtn: (key, index) => {
			$("#WG-KEY-CAP-" + key + "-" + index).val(Trans.translate("keyCode", Config.get("keys")[key][index]));
		},


		setupCaptureKey: (key, index) => {
			Config.keyCapture = {
				key: key,
				index: index,
			};
			$("#WG-PRN-KEY-CAPTURE").show();
		},

		captureKey: (e) => {
			if (Config.keyCapture !== null) {
				ConfigHTML.setKey(Config.keyCapture.key, Config.keyCapture.index, Keys.eventToKeyString(e));
			}
			Config.keyCapture = null;
			$("#WG-PRN-KEY-CAPTURE").hide();
		},

		setKey: (key, index, str) => {
			if (Config.get("keys").hasOwnProperty(key)) {
				Config.get("keys")[key][index] = str;
				ConfigHTML.updateKeyCapBtn(key, index);
				Config.save();
				ConfigHTML.keyConflictCheck();
			}
		},

		resetKey: (e) => {
			let data = $(e.currentTarget).data();
			ConfigHTML.setKey(data.key, data.index, "");
			return false;
		},

		recapKey: (e) => {
			let cap = $(e.currentTarget).data();
			ConfigHTML.setupCaptureKey(cap.key, cap.index);
			$("#WG-PRN-KEY-CAPTURE span")[0].focus();
		},

		keyConflictCheck: () => {
			$(".WG-keycap-btn").removeClass("conflict");
			let conflicts = [];
			Object.keys(Config.get("keys")).forEach(function(key) {
				conflicts = [...conflicts, ...ConfigHTML.getConflictsWith(key, 0), ...ConfigHTML.getConflictsWith(key, 1)];
			});
			conflicts = conflicts.filter((item, index, self) => {
				return self.indexOf(item) === index;
			});
			conflicts.forEach((item) => {
				$("#WG-KEY-CAP-" + item).addClass("conflict");
			});
		},

		getConflictsWith: (key, index) => {
			var str = Config.get("keys")[key][index];
			let conflicts = [];
			if (typeof str === "string" && str.length > 0) {
				let sets = Config.keyGroups.filter((group) => { return group.includes(key); });
				sets.forEach((set) => {
					set.forEach((key2) => {
						if (key2 !== key) {
							let index2 = Config.get("keys")[key2].indexOf(str);
							if (index2 >= 0) {
								conflicts.push(key2 + "-" + index2);
							}
						}
					});
				});
			}
			return conflicts;
		},
		createDownloadOptColumn: (opt) => {
			let td = $("<td>")
				.text(Trans.translate("configOption", opt));
			let help = Trans.translate("stringVars", opt);
			if (typeof help === "string" && help.length > 5) {
				td.append(
					$("<a>")
					.attr({ href: "#!", title: help })
					.text("?")
					.addClass("WG-float-right WG-pad-10-r")
				);
			}
			return td;
		},
		createDownloadInpColumn: (opt) => {
			let val = Config.get("download")[opt];
			let inp = '<input type="text">';
			if (val instanceof Array) {
				inp = "<textarea>";
				val = val.join(" ");
			}
			return $("<td>")
				.addClass("WG-column-main")
				.append(
					$(inp)
					.val(val)
					.attr("id", "WG-DOWNLOAD-OPT-" + opt)
					.on("blur", ConfigHTML.saveDownloadOpt)
					.data("opt", opt)
				);
		},
		createDownloadRstColumn: (opt) => {
			return $("<a>")
				.on("click", ConfigHTML.resetDownloadOpt)
				.addClass("WG-keycap-reset")
				.data({ opt: opt })
				.append(
					$("<span>").addClass("glyphicon glyphicon-remove")
				);
		},
		saveDownloadOpt: function(e) {
			let opt = $(e.currentTarget).data("opt");
			let val = $(e.currentTarget).val();
			let org = Config.get("download")[opt];
			if (org instanceof Array) {
				val = val.split(" ");
			}
			Config.get("download")[opt] = val;
			Config.save();
		},
		resetDownloadOpt: (e) => {
			let opt = $(e.currentTarget).data("opt");
			Config.get("download")[opt] = Config._settings.download[opt];
			Config.save();
			let val = Config.get("download")[opt];
			if (val instanceof Array) {
				val = val.join(" ");
			}
			$("#WG-DOWNLOAD-OPT-" + opt).val(val);
		}
	};

	const ConfigMigrator = {
		migrate: (settings, targetVersion, currentVersion) => {
			console.log("Migrate config from ", currentVersion, "to", targetVersion);
		},
	}
})();

(function() {
	const ConfATableHTML = {
		key: null,
		val: null,
		create: (path, key, val) => {
			ConfATableHTML.key = key;
			ConfATableHTML.val = val;
			return ConfATableHTML.bind(ConfATableHTML.build(path))
		},
		build: path => ConfATableHTML.createTable(path).append(ConfATableHTML.createContent(path, Config.get(path))),
		createTable: (path) => $('<table class="rounded">').data({ path: path, key: ConfATableHTML.key, val: ConfATableHTML.val }),
		createContent: (path, config) => [ConfATableHTML.createHead(path + ".config.tableTitle"), ConfATableHTML.createBody(config)],
		///HEAD
		createHead: trans => $("<thead>").append(ConfATableHTML.createHeadRow(trans)),
		createHeadRow: trans => $("<tr>").append(["Option", "Value", "Remove"].map(column => ConfATableHTML["createHead" + column](trans))),
		createHeadOption: trans => ConfATableHTML.createTH(trans, "option"),
		createHeadValue: trans => ConfATableHTML.createTH(trans, "value").addClass("WG-column-main"),
		createHeadRemove: trans => ConfATableHTML.createTH(trans, "remove").addClass("WG-column-btn"),
		createTH: (section, str) => Trans.createElem(section, str, "th"),
		///BODY
		createBody: (conf) => $("<tbody>").append([...ConfATableHTML.createRows(conf), ConfATableHTML.createAddRow()]),
		createRows: (conf) => conf.map(c => ConfATableHTML.createRow(c[ConfATableHTML.key], c[ConfATableHTML.val])),
		createRow: (opt, val) => $("<tr>").append(ConfATableHTML.createColumns(opt, val)).addClass("WG-data-row"),
		createColumns: (opt, val) => ["Option", "Value", "Remove"].map(column => ConfATableHTML["createColumn" + column](opt, val)),
		createColumnOption: (opt) => $("<td>").append($("<input>").val(opt).addClass("WG-key")),
		createColumnValue: (opt, val) => $("<td>").append($("<input>").val(val).addClass("WG-val")).addClass("WG-column-main"),
		createColumnRemove: () => $("<td>").append(Util.glyphiconLink("remove", "WG-remove-row")).addClass("WG-column-btn"),
		createAddRow: () => $("<tr>").append([$("<td>"), $("<td>"), $("<td>").append(Util.glyphiconLink("plus", "WG-add-row")).addClass("WG-column-btn")]),
		///BIND
		bind: table => table.on("blur", "input", ConfATableHTML.input).on("click", ".WG-remove-row", ConfATableHTML.input).on("click", ".WG-add-row", ConfATableHTML.addRow),
		addRow: e => ConfATableHTML.createRow("", "").insertBefore($(e.currentTarget).closest("tr")),
		getElemRow: e => $(e).closest("tr"),
		getRowOpt: e => ConfATableHTML.getElemRow(e).data("option"),
		getRowPath: e => ConfATableHTML.getElemRow(e).data("path"),
		input: e => {
			const table = $(e.currentTarget).closest("table");
			const data = table.data();
			let conf = [];
			table.find("tr.WG-data-row").each((i, tr) => {
				const k = $(tr).find("input.WG-key").val();
				if (typeof k === "string" && k.length > 0) {
					const v = $(tr).find("input.WG-val").val();
					conf = [...conf, {
						[data.key]: k, [data.val]: v }];
				}
			});
			Config.set(data.path, conf);
		},
	};
	ConfigArrayTableHTML.create = ConfATableHTML.create;
})();

(function() {
	const ConfTableHTML = {
		keys: [],
		types: {},
		create: (path, keys) => {
			ConfTableHTML.types = {};
			if (!(keys instanceof Array)) {
				if (typeof keys === "object" && keys !== null) {
					ConfTableHTML.types = { ...keys };
					keys = Object.keys(keys);
				} else {
					keys = Object.keys(Config.get(path));
				}
			}
			ConfTableHTML.keys = [...keys];
			const res = ConfTableHTML.bind(ConfTableHTML.build(path));
			return res;
		},
		build: path => ConfTableHTML.createTable().append(ConfTableHTML.createContent(path, Config.get(path))),
		createTable: () => $('<table class="rounded">'),
		createContent: (path, config) => [ConfTableHTML.createHead(path + ".config.table"), ConfTableHTML.createBody(path, config, path + ".config.table")],
		///HEAD
		createHead: trans => $("<thead>").append(ConfTableHTML.createHeadRow(trans)),
		createHeadRow: trans => $("<tr>").append(["Option", "Value", "Reset"].map(column => ConfTableHTML["createHead" + column](trans))),
		createHeadOption: trans => ConfTableHTML.createTH(trans, "option"),
		createHeadValue: trans => ConfTableHTML.createTH(trans, "value").addClass("WG-column-main"),
		createHeadReset: trans => ConfTableHTML.createTH(trans, "reset").addClass("WG-column-btn"),
		createTH: (section, str) => Trans.createElem(section + "Title", str, "th", "config.default.tableTitle"),
		///BODY
		createBody: (path, conf, trans) => $("<tbody>").append(ConfTableHTML.createRows(path, conf, trans)),
		createRows: (path, conf, trans) => ConfTableHTML.keys.map(key => ConfTableHTML.createRow(path, key, conf[key], trans)),
		createRow: (path, opt, val, trans) => $("<tr>").append(ConfTableHTML.createColumns(path, opt, val, trans)).data({ path: path + "." + opt }),
		createColumns: (path, opt, val, trans) => ["Option", "Value", "Reset"].map(column => ConfTableHTML["createColumn" + column](path, opt, val, trans)),
		createColumnOption: (path, opt, val, trans) => $("<td>").append(Trans.createElem(trans, opt)).append(ConfTableHTML.createHelpLink(trans, opt)),
		createHelpLink: (trans, opt) => {
			let help = Trans.translate(trans + "Help", opt);
			if (typeof help === "string" && help.length > 1 && help != opt) {
				return $("<a>")
					.attr({ href: "#!", title: help })
					.text("?")
					.addClass("WG-float-right WG-pad-10-r");
			}
			return [];
		},
		createColumnValue: (path, opt, val, trans) => $("<td>").append(ConfTableHTML.columnValueSwitch(path, opt, val, trans)).addClass("WG-column-main"),
		//createColumnValue: (path, opt, val) => $("<td>").append((val instanceof Array) ? $("<textarea>").val(val.join(" ")) : $("<input>").val(val)).addClass("WG-column-main"),
		columnValueSwitch: (path, opt, val, trans) => {
			if (val instanceof Array) {
				return $("<textarea>").val(val.join(" "));
			}
			const type = ConfTableHTML.types[opt] || ((val === true || val === false) ? "bool" : "text");
			if (type instanceof Array) {
				;
				return $("<select>").append(type.map(oval => Trans.createElem(trans + "Option." + opt, oval, "option").val(oval).attr("selected", val == oval ? "selected" : "")));
			} else {
				switch (type.type || type) {
					case "bool":
						return $("<input>").attr("type", "checkbox").prop("checked", val);
						break;
					case "range":
						return $("<input>").attr({ type: "range", min: type.min || 1, max: type.max || 100, step: type.step || 1 }).val(val);
						break;
					default:
						return $("<input>").val(val);
						break;
				}
			}
		},
		createColumnReset: () => $("<td>").append(Util.glyphiconLink("remove", "WG-reset-row")).addClass("WG-column-btn"),
		///BIND
		bind: table => table
			.on("blur", "input[type=text],textarea", ConfTableHTML.input)
			.on("click", ".WG-reset-row", ConfTableHTML.reset)
			.on("input", "input:not([type='text']),select", ConfTableHTML.input),
		input: e => Config.set(ConfTableHTML.getRowPath(e.currentTarget), $(e.currentTarget).is("textarea") ? $(e.currentTarget).val().split(" ") : ($(e.currentTarget).attr("type") == "checkbox" ? $(e.currentTarget).prop("checked") : $(e.currentTarget).val())),
		reset: e => ConfTableHTML.update(e.currentTarget, Config.resetValue(ConfTableHTML.getRowPath(e.currentTarget))),
		update: (e, v) => $(e).closest("tr").find("input").val(v),
		getElemRow: e => $(e).closest("tr"),
		getRowPath: e => ConfTableHTML.getElemRow(e).data("path"),
	};
	ConfigTableHTML.create = ConfTableHTML.create;
	ConfigTableHTML.createIn = (sel, path, keys) => $(sel).append(ConfigTableHTML.create(path, keys));
})();