const Updates = {};
(function() {
    const data = {
        v02: {
            v00: {
                v00: {
                    text: "Pool Downloading! (also complete rewrite)",
                    added: [
                        "Pool Downloading",
                        "Slideshow loop video option",
                    ],
                    fixed: [
                        "Failing web requests on chrome canary",
                    ],
                },
                v04: {
                    fixed: [
                        "Chrome manifest error",
                        "Keybinding to close slideshow failing",
                    ]
                },
                v02: {
                    fixed: [
                        "Pool downloading in chrome",
                        "Removed Permission request for notifications (not needed, left in from an experiment)",
                    ]
                }
            },
            v01: {
                v00: {
                    text: "Update to the new e621 layout<br>Mobile support (With e621's new more mobile friendly version the plugin has been updated to support mobile better)<br><br>There are some known issues as the updatre isn't finished yet, but core functionality should be ok",
                    added: [
                        "Translation support - (contact me if you wish to help translate a language)", [
                            "Options to disable features",
                            "Slideshow",
                            "Infinite Scroll",
                            "Keybinds",
                        ],
                    ],
                    fixed: [
                        "Entire plugin for new e621 update",
                        "Various css improvments (courtesy of user &lt;<a href=\"/users/301733\">Perspectra @perspectracoon</a>&gt;)"
                    ],
                },
                v01: {
                    fixed: [
                        "Vote and fave features on slideshow fixed",
                        "Download fixed",
                    ]
                },
                v02: {
                    fixed: [
                        "Remove cookies permission requirement (accidentally left in from testing stuff)",
                    ]
                },
                v03: {
                    fixed: [
                        "Stopped pagination of unsupported pages like forums, and pools index (will look into supporting more)",
                    ]
                },
                v04: {
                    added: [
                        "Pools index paginationd",
                    ]
                },
                v05: {
                    added: [
                        "Build automation",
                    ]
                },
                v06: {
                    fixed: [
                        "Fixes for missing script, and voting/fave buttons (thanks to user &lt;<a href=\"/users/263619\">AttackHelicopter</a>&gt; for the report)",
                    ]
                }
            },
            v02: {
                v00: {
                    text: "Generic downloading!<br>Download your searches (so long as they produce under 1000 results)",
                    added: [
                        "Generic downloader"
                    ],
                    fixed: [
                        "Config moved to browser storage rather than session storage, may fix bug with private browsing showing update notice too often"
                    ]
                },
                v01: {
                    changed: [
                        "Downloads now download through your browsers default downloader",
                    ]
                },
                v02: {
                    fixed: [
                        "Bug with loading default config, preventing new plugin users",
                    ]
                }
            },
            v03: {
                v00: {
                    text: "Fixed blacklisting for slideshows etc",
                    fixed: [
                        "Updated blacklisting detection"
                    ]
                },
                v01: {
                    text: "Updated to use new css tags",
                    fixed: [
                        "e621 changed name of css tags"
                    ]
                }
            }
        },
        v01: {
            v07: {
                v00: {
                    text: "Key Rebinding! (also config & favoriting)",
                    added: [
                        "Configurable key bindings",
                        "Config Panel (access through cog icon in top right of slideshow overlay)",
                        "Patch history notice", [
                            "Settings Persistence: (not sync's between browsers yet)",
                            "Key bindings",
                            "Slideshow playback speed",
                        ],
                        "Link to favourite on slideshow",
                        "keyboard shortcut to favorite ( \"F\" by default)",
                    ],
                    fixed: [
                        "Post score sometimes displaying wrong in slideshow",
                    ],
                    changed: [
                        "Disabled notes/translations in slideshowview for now (will work on making them optional)"
                    ]
                }
            },
            v06: {
                v00: {
                    text: "Blacklists Work!",
                    fixed: [
                        "Slideshow should now skip blacklisted items",
                        "Content loaded for infinite scrolling should now respect blacklist",
                    ],
                },
                v01: {
                    fixed_and_changed: [
                        "Fixed bug causing keys to not respond",
                        "Set slideshow speed incremetns to 1s instead of 5s",
                    ]
                }
            }
        }
    };
    Updates.data = () => JSON.parse(JSON.stringify(data));
})();