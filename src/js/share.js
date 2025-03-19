var Share;
(function() {
	Share = {
		init: () => {
			//Config.registerUi("share", Share.uiInit);
			return Promise.resolve();
		},
		send: (name, data) => {
			const platform = Share.getPlatform(name);
			if (platform) {
				const uri = Util.stringMap(platform.uri, data, {
					"%url": data => data.url,
					"%msg": data => data.msg,
				});
				return BrowserMessage.send("openUri", { uri: uri });
			}
			return Promise.reject(Trans.translate("share.error", "missingPlatform"));
		},
		uiInit: (id) => {
			ShareConfigHTML.create(id);
			return Promise.resolve(id);
		},
		getPlatforms: () => Config.get("share.platforms").map(p => Object.assign({}, p)),
		setPlatForms: platforms => Config.set("share.platforms", platforms.map(p => Object.assign({}, p))),
		clearPlatforms: () => Share.setPlatForms([]),
		getPlatform: (name) => Share.getPlatforms().filter(platform => platform.name === name),
	};

	let ShareConfigHTML = {
		sectionID: null,
		addRowID: "WG-PRN-SHARE-TABLE-ADD-ROW",
		getSection: () => $("#" + ShareConfigHTML.sectionID),
		create: id => {
			ShareConfigHTML.sectionID = id;
			ShareConfigHTML.addRows();
			ShareConfigHTML.bind();
			ShareConfigHTML.getSection().append(ConfigTableHTML.create("share.messages"));
			ShareConfigHTML.getSection().append(ConfigArrayTableHTML.create("share.platforms", "name", "uri"));
		},
		addRows: () => Share.getPlatforms().forEach(ShareConfigHTML.addRow),
		addRow: (platform) => {
			try {
				$("<tr>")
					.addClass("WG-share-platform-data")
					.append($("<td>").append($("<input>").addClass("WG-key").val(platform.name)))
					.append($("<td>").append($("<input>").addClass("WG-val").val(platform.uri)).addClass("WG-column-main"))
					.append($("<td>").append(ShareConfigHTML.removeRowLink()).addClass("WG-column-btn"))
					.insertBefore($("#" + ShareConfigHTML.addRowID));
			} catch (error) {
				console.log(error);
			}

		},
		removeRowLink: () => Util.glyphiconLink("remove", "WG-remove-row"),
		bind: () => {
			$("#WG-PRN-SHARE-TABLE").on("click", ".WG-remove-row", ShareConfigHTML.update);
			$("#WG-PRN-SHARE-TABLE").on("blur", "input", ShareConfigHTML.update);
			$("#" + ShareConfigHTML.addRowID).on("click", () => ShareConfigHTML.addRow({ name: "", uri: "" }));
		},
		update: (e) => {
			Share.clearPlatforms();
			let platforms = [];
			$("#" + ShareConfigHTML.sectionID + " tr.WG-share-platform-data").each((i, e) => {
				const name = $(e).find("input.WG-key").val();
				const uri = $(e).find("input.WG-val").val();
				if (typeof name === "string" && name.length > 0) {
					platforms = [...platforms, { name: name, uri: uri }];
				}
			});
			Share.setPlatForms(platforms);
			console.log(Share.getPlatforms());
			Config.save();
		},
	};
})();