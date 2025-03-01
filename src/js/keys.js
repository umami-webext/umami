var Keys;
(function() {
	const confEnabled = "general.keyBinds";
	Keys = {
		enabled: () => Config.get(confEnabled) ? true : false,
		hooks: {
			down: [],
			up: [],
		},
		init: () => {
			Keys.setupKeyEvents();
			Config.hook(confEnabled, Keys.enabledToggle);
			return Promise.resolve();
		},
		htmlInit: () => {
			$("#WG-PRN-CONFIG-KEYS").toggle(Keys.enabled());
			return Promise.resolve();
		},
		enabledToggle: (path, value) => {
			$("#WG-PRN-CONFIG-KEYS").toggle(value);
		},
		registerKeyEvent: (event, cb, priority, tag) => {
			if (typeof tag !== "string" || tag.length < 3) {
				console.log("MISSING TAG IN key register");
			}
			if (typeof priority !== "number")
				priority = 100000;
			Keys.hooks[event] = [...Keys.hooks[event], { priority: priority, cb: cb, tag: tag }]
				.sort((a, b) => a.priority < b.priority ? -1 : (a.priority > b.priority ? 1 : 0));
		},
		registerKeyUp: (cb, priority, tag) => Keys.registerKeyEvent("up", cb, priority, tag),
		registerKeyDown: (cb, priority, tag) => Keys.registerKeyEvent("down", cb, priority, tag),
		setupKeyEvents: () => {
			document.addEventListener("keyup", (e) => Keys.keyEvent(e, "up"), true);
			document.addEventListener("keydown", (e) => Keys.keyEvent(e, "down"), true);
		},
		keyEvent: (e, type) => {
			if (!Keys.enabled()) return;
			const focus = $(":focus");
			if (!focus.hasClass("WG-cap-key")) {
				switch (focus.prop("tagName")) {
					case "INPUT":
					case "SELECT":
					case "TEXTAREA":
						return;
				}
			}
			let key = Keys.eventToKeyString(e);
			try {
				let used = false;
				if (!Debug.on) {
					used = Keys.hooks[type].some(hook => hook.cb(e, key));
				} else {
					used = Keys.hooks[type].some(hook => { if (hook.cb(e, key)) { console.log(type, hook.priority, hook.tag); return true; } return false; });
				}
				if (used) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
				}
			}
			catch (er) {
				console.log(er);
			}
		},
		eventToKeyString: (e) => {
			let prfx = "";
			if (e.ctrlKey) {
				prfx += "ctrl + ";
			}
			if (e.altKey) {
				prfx += "alt + ";
			}
			if (e.shiftKey) {
				prfx += "shift + ";
			}
			return prfx + e.key;
		},
		getBinds: () => Config.get("keys"),
		isKey: (key, type) => Keys.getBinds()[type].includes(key),
		isKeyOrKey: (key, a, b) => Keys.isKey(key, a) ? -1 : (Keys.isKey(key, b) ? 1 : 0),
		keyLR: key => Keys.isKeyOrKey(key, "left", "right"),
		keyUD: key => Keys.isKeyOrKey(key, "up", "down"),
		isAnyKey: (key, keys) => keys.some((test) => Keys.isKey(key, test)),
	};
})();