var Lang;
(function() {
	Lang = {
		en: {
			notice: {
				about: "About",
			},
			keys: {
				up: "Thumbnail Up",
				down: "Thumbnail Down",
				left: "Thumbnail Left",
				right: "Thumbnail Right",
				slideNext: "Next Image (Slideshow)",
				slidePrev: "Previous Image (Slideshow)",
				close: "Close Slideshow",
				open: "Open Thumbnail",
				openInTab: "Open Thumbnail in new Tab",
				play: "State/Stop Slideshow",
				voteUp: "Up Vote",
				voteDown: "Down Vote",
				favorite: "Favorite",
				download: "Download Current Image",
			},
			keyCode: {
				ArrowLeft: "Left",
				ArrowRight: "Right",
				ArrowUp: "Up",
				ArrowDown: "Down",
				" ": "Space",
			},
			keyDesc: {
				open: "Open selected thumbnail in slideshow",
				up: "Move thumbnail selector up a row",
				down: "Move thumbnail selector down a row",
				left: "Move thumbnail selector left",
				right: "Move thumbnail selector right",
				voteUp: "Up vote the current slideshow image",
				voteDown: "Down vote the current slideshow image",
				favorite: "Favorite the current slideshow image",
			},
			config: {
				title: "Config",
				share: {
					title: "Sharing Options",
					table: {
						platform: "Platform",
					},
				},
				default: {
					tableTitle: {
						reset: "Reset",
						value: "Value",
						option: "Option",
					}
				}
			},
			post: {
				rating: {
					s: "safe",
					q: "questionable",
					e: "explicit",
					nsfw: "NSFW",
				}
			},
			download: {
				config: {
					title: "Download Options",
					tableTitle: {

					},
					table: {
						fileNameString: "Filename pattern for posts",
						poolNameString: "Filename pattern for pools",
						poolFileNameString: "Filename pattern for posts in a pool",
						timeString: "Pattern for time string",
						dateString: "Pattern for date string",
						tagsToKeep: "Tags to include for %t variable",
						seperator: "Seperator",
						skipDeleted: "Skip Deleted",
					},
					tableHelp: {
						fileNameString: "%id - Post id\n%s - Post score\n%r - Post rating\n%R - Post rating long\n%nsfw - NSFW if rated r/q\n%h - Post height\n%w - Post width\n%a - Post artist(s)\n%t - Post tags that match tag list\n%ud - Post upload date\n%ut - Post upload time\n%cd - Current date\n%ct - Current time\n%TCH - Character Tags\n$TCC - Copyright Tags\n%TSP - Species Tags",
						poolNameString: "%id - Pool id\n%n - Raw pool name (has '_')\n%pn - Pool name cleaned\n%a - artists\n%r - Rating (most explicit rating of a post in pool)\n%t - Tags (grouped from posts)\n%ud - Pool creation date\n%ut - Pool created time\n%cd - Current date\n%ct - Current time",
						poolFileNameString: "Same as Post +\n%pI - Position in pool (padded)\n%pi - Position in pool\n%pZ - Position in pool (padded) (Zero indexed)\n%pz - Position in pool (Zero indexed)\n%pn - Pool name",
						timeString: "%Y - 4 year (e.g 2019)\n%y - 2 year (e.g 19)\n%m - month (e.g 5 or 11)\n%M - month padded (e.g 05 or 11)\n%d - day (e.g 7 or 22)\n%D - day padded (e.g 07 or 22)\n%h - hour (e.g 8 or 17)\n%H - hour padded (e.g 08 or 17)\n%i - minute (e.g 3 or 45)\n%I - minute padded (e.g 03 or 45)\n%s - second (e.g 4 or 52)\n%S - second padded (e.g 04 or 52)",
						dateString: "%Y - 4 year (e.g 2019)\n%y - 2 year (e.g 19)\n%m - month (e.g 5 or 11)\n%M - month padded (e.g 05 or 11)\n%d - day (e.g 7 or 22)\n%D - day padded (e.g 07 or 22)\n%h - hour (e.g 8 or 17)\n%H - hour padded (e.g 08 or 17)\n%i - minute (e.g 3 or 45)\n%I - minute padded (e.g 03 or 45)\n%s - second (e.g 4 or 52)\n%S - second padded (e.g 04 or 52)",
						tagsToKeep: "Tags on a post will be\nmatched against these\nif they match they will\nbe included in the output\nof the %t variable",
						seperator: "Used to combine things\nthat have spaces\nlike the tags",
						skipDeleted: "Wether whislst downloading deleted images should be skipped\n(note that turning this off will not get the deleted image, but a deleted placeholder instead)",
					}
				}
			},
			save: {
				start: "Setting up download client...",
				collect: "Gathering Pool Data...",
				calculate: "Gathering Post Data",
				download: "Downloading",
				zipup: "Setting up Compression tool...",
				zip: "Compressing..."
			},
			ui: {
				downloadAsZip: "Download as Zip",
				warningNotBlacklisted: "(Warning Not Blacklisted Yet)",
			},
			slideshow: {
				ui: {
					loop: "Loop Video",
					autoplay: "Autoplay Video",
				},
			},
			general: {
				config: {
					title: "General",
					table: {
						slideshow: "Slideshow Enabled",
						infiniteScroll: "Infinite Scroll Enabled",
						keyBinds: "Key Binds Enabled",
						largeImages: "High Resolution Enabled",
						activeLanguage: "Language",
					},
					tableHelp: {
						slideshow: "Toggle slideshow on and off",
						infiniteScroll: "Toggle automatic loading of next page",
						keyBinds: "Toggle shortcut keys functionality",
						largeImages: "Toggle loading higher resolution images\nWARNING: this uses much more data and can cause slow loading",
						activeLanguage: "Language for text of umami plugin",
					},
					tableOption: {
						activeLanguage: {
							en: "English (GB)",
							owo: "OwO",
						},
					},
				},
			},
			version: {
				modal: {
					added: "Additions:",
					fixed: "Fixes:",
					changed: "Changes:",
					fixed_and_changed: "Fixes & Changes:",
				},
			},
		},
		owo: {}
	};
})();