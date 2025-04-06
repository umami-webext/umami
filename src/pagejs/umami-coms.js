(function() {

	const START = Date.now();

	window.postMessage({ src: "UMAMI", op: "KILL", data: START });

	const respondSuccess = (token, data) => {
		window.postMessage({ src: "UMAMI-PAGE", status: "success", data: data, token: token }, "*");
	};

	const respondFail = (token, data) => {
		window.postMessage({ src: "UMAMI-PAGE", status: "failure", data: data, token: token }, "*");
	};

	const handleMessage = ev => {
		const { src, op, data, token } = ev.data;
		if (src !== "UMAMI") return;
		switch (op.toUpperCase().trim()) {
			case "KILL":
				if (data !== START) {
					window.removeEventListener("message", handleMessage);
				}
				return;
			case "APPLY_BLACKLIST":
				Danbooru.Blacklist.apply();
				break;
			case "VOTE":
				$.post("/posts/" + data.id + "/votes.json", { score: data.dir, no_unvote: false })
					.done((a, b, c) => { respondSuccess(token, a); })
					.fail(() => respondFail(token));
				return;
			case "FAVE":
				$.post("/favorites.json", { post_id: data })
					.done(() => respondSuccess(token))
					.fail(() => respondFail(token));
				return;
			case "UNFAVE":
				$.ajax({ url: "/favorites/" + data + ".json", type: "DELETE" })
					.done(() => respondSuccess(token))
					.fail(() => respondFail(token));
				return;
			case "BLACK_TEST":
				respondSuccess(token, is_post_bl(data));
				return;
		}
		respondSuccess(token, "done " + op);
	}

	window.addEventListener("message", handleMessage);

	const interrogateObj = (obj) => {
		const keys = Object.keys(obj);
		const desc = {};
		keys.forEach(k => {
			const o = obj[k];
			if (typeof o === "object") {
				if (o instanceof Array) {
					desc[k] = "Array";
				} else if (o === null) {
					desc[k] = null;
				} else {
					desc[k] = interrogateObj(o);
				}
			} else {
				desc[k] = typeof o;
			}
		});
		return desc;
	};

	const Post2Flat = (post) => {
		const p = {};
		p.id = post.id;
		p.score = parseInt(post.score.total, 10);
		p.tags = [];
		Object.keys(post.tags).forEach(grp => {
			p.tags = [...p.tags, ...post.tags[grp]];
		});
		p.tags = [...new Set(p.tags)].join(" ");
		p.rating = post.rating;
		p.uploader_id = post.uploader_id;
		p.user = post.uploader_name || post.uploader_id;
		p.flags = [];
		Object.keys(post.flags).forEach(flag => {
			if (post.flags[flag]) {
				p.flags.push(flag);
			}
		});
		p.flags = p.flags.join(" ");
		return p;
	};

	const is_post_bl = (p) => {
		const post = Post2Flat(p);
		let black = false;
		Danbooru.Blacklist.entries.forEach(e => {
			if (Danbooru.Blacklist.post_match_object(post, e)) {
				black = true;
			}
		});
		return black;
	};

	window.interrogateObj = interrogateObj;

	interrogateObj($);

})();