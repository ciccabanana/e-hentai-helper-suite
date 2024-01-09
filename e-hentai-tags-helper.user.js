// ==UserScript==
// @name Tags Auto Complete
// @namespace https://github.com/ciccabanana/e-hentai-helper-suite
// @homepageURL https://github.com/ciccabanana/e-hentai-helper-suite
// @version 0.2.2
// @encoding utf-8
// @author      ciccabanana
// @description     Replace normal search bar with new one whit autocomplete of tags
// @supportURL https://github.com/ciccabanana/e-hentai-helper-suite/issues
// @updateURL   https://github.com/ciccabanana/e-hentai-helper-suite/raw/master/e-hentai-tags-helper.user.js
// @include     *://e-hentai.org/
// @include     *://exhentai.org/
// @include     /https?:\/\/e(-|x)hentai\.org\/(uploader\/.*|watched.*|tag\/.*|\?f_search.*|\?f_cats.*|doujinshi.*|manga.*|artistcg.*|gamecg.*|western.*|non-h.*|imageset.*|cosplay.*|asianporn.*|misc.*|\?tag_name_bar.*|\?f_shash.*|\?next.*|favorites\.php.*)/
// @require https://code.jquery.com/jquery-3.7.1.min.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/library/jQuery.tagify.min.js
// @resource    TagifyCSS https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/resource/tagify.css
// @run-at document-start

// @grant   GM_getResourceText
// @grant   GM.getResourceUrl

// ==/UserScript==

// Object that contain the default settings
const defaultSettings = {
    debugConsole: false,
    hideOriginal: true,
    debugText: false,
    editableTag: false,
    dropdownPosition: 'all',
    style: {
        base: {
            female: "#F75F57",
            male: '#435BD5',
            language: "#10A911",
            cosplayer: "#902BDC",
            parody: "#902BDC",
            character: "#D973D2",
            group: "#F2A019",
            artist: "#D2D204",
            mixed: "#ab9f60", //  #3cd230 or #38d42f
            other: "#808080",
            reclass: "#808080",
            temp: "#808080",
            default: "#808080",
            // NON-H => #0cb8ce / 0cb9cf / #0cbad0
        },
        exhentai: {
            female: "#9E2720",      // (Red) (Doujinshi)
            male: "#325CA2",        // (Blue) (Image Set)
            language: "#6A936D",    // (Green) (Game CG)
            cosplayer: "#6A32A2",   // (Purple ) (Cosplay)
            parody: "#6A32A2",      // (Purple ) (Cosplay)
            character: "#A23282",   // (Orchid) (Asian)
            group: "#DB6C24",       // (Oragne) (Manga)
            artist: "#D38F1D",      // (YelloW) (Artistig CG)
            mixed: "#AB9F60",       // Teak (Western)
            other: "#777777",       // (Gray) (Misc)
            reclass: "#777777",     // (Gray) (Misc)
            temp: "#777777",        // (Gray) (Misc)
            default: "#777777",     // (Gray) (Misc)
            // Non-H => 
        }
    }
};

// Class wrapper for custom console
class CustomConsole {
    log = (() => {
        return Function.prototype.bind.call(console.log, console, '%cTags Auto Complete', 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;');
    })();

    error = (() => {
        return Function.prototype.bind.call(console.error, console, '%cTags Auto Complete', 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;');
    })();

    info = (() => {
        return Function.prototype.bind.call(console.info, console, '%cTags Auto Complete', 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;');
    })();

    debug = (() => {
        return Function.prototype.bind.call(console.debug, console, '%cTags Auto Complete', 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;');
    })();

    m = (name, color = '', blocks = []) => {
        let fontColor = 'white';
        if (!color) color = this.stringToColour(name);
        if (color[0] === '#') fontColor = this.getColorByBgColor(color);
        const style = `background-color: ${color}; color: ${fontColor}; padding: 2px 10px; border-radius: 3px; margin-left: -5px; border-left: 1px solid white;`;
        blocks.push({ name, style });

        const temp = {};
        temp.m = (name2, color2 = '') => {
            return this.m(name2, color2, [...blocks]);
        };
        const moduleText = blocks.reduce((sum, el) => `${sum}%c${el.name}`, '');
        const moduleStyle = blocks.map(el => el.style);
        temp.log = (() => {
            return Function.prototype.bind.call(console.log, console, `%cTAC ${moduleText}`, 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.error = (() => {
            return Function.prototype.bind.call(console.error, console, `%cTAC ${moduleText}`, 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.info = (() => {
            return Function.prototype.bind.call(console.info, console, `%cTAC ${moduleText}`, 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.debug = (() => {
            return Function.prototype.bind.call(console.debug, console, `%cTAC ${moduleText}`, 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        return temp;
    };

    // https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
    stringToColour(str) {
        if (!str) return '#ffffff';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let colour = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            colour += value.toString(16).padStart(2, '0');
        }
        return colour;
    }

    // https://stackoverflow.com/questions/64600665/javascript-is-there-a-way-for-a-point-to-see-the-background-color
    getColorByBgColor(bgColor) {
        return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000' : '#fff';
    }
}

// Load Settings
var userSettings = localStorage.getItem('tac-settings') ? JSON.parse(localStorage.getItem('tac-settings')) : { ...defaultSettings };

// Create custom mConsole
var mConsole = new CustomConsole();

// Ceck if Settings version undefined or if is older => if is update
if (userSettings.version === undefined || userSettings.version < defaultSettings.version) {
    mConsole.m('Settings').log('Updating the settings');

    const updateObject = (obj1, obj2) => {
        /**
         * More accurately check the type of a JavaScript object
         * @param  {Object} obj The object
         * @return {String}     The object type
         */
        const getType = obj => {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
        };

        const areObjects = () => {
            let result = {};
            // Check each item in the object
            for (let key in obj1) {
                if (obj1.hasOwnProperty(key)) {
                    // If obj1 has the key
                    if (!obj2.hasOwnProperty(key) || key == 'version') {
                        /**
                         * If the obj2 don't have the key => new settings => add in the result
                         * The key is 'version' => update version value
                         */
                        result[key] = obj1[key];
                    } else {
                        // If obj2 has the key iterate
                        result[key] = updateObject(obj1[key], obj2[key]);
                    }
                }
                // Else If the obj1 don't has the key the settigs was removed
            }
            return result;
        };

        const areArrays = () => {
            let result = {};
            // Check each item in the array
            for (let i = 0; i < obj1.length; i++) {
                result[i] = updateObject(obj1[i], obj2[i]);
            }
            return result;
        };

        const arePrimatives = () => {
            // If the element is a primitive return obj2
            return obj2;
        };

        // Get the object type
        let type = getType(obj1);

        // If the two items are not the same type, return obj1
        if (type !== getType(obj2)) return obj1;

        if (type === 'object') return areObjects();
        if (type === 'array') return areArrays();
        return arePrimatives();
    };
    // Get updated settings
    let newSettings = updateObject(defaultSettings, userSettings);
    // Save the new settings in the storage
    localStorage.setItem('tac-settings', JSON.stringify(newSettings));
    // Set the new setting as curent settings
    userSettings = newSettings;
}

if (userSettings.debugConsole)
    console.time('[Tags Auto Complete]: Loading time');

(async function () {
    'use strict';

    let open_settinga = async () => {
        var container = $(`
        <div class="tac-overlay">
            <div class="tac-settings">
                <nav id="tac-topNav">
                    <span id="tac-home" style="float: left; border: none; padding: 0 0 0 15px;">Tags auto complete settings</span>
                    <span id="setNotice" style="width: 100%; margin-left: 8px; font-weight: lighter; opacity: 0.5; -webkit-opacity: 0.5; text-align: center; position: absolute; left: 0;">${(reload ? 'Applied Settings Will Take Effect On Reload' : '')}</span>
                    <div>
                        <a id="tac-settings-close">&#128939</a>
                    </div>
                </nav>
                <div class="section-container">
                    <fieldset>
                        <legend>Settings</legend>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="dbConsole" ${(userSettings.debugConsole ? 'checked' : '')}>Debug console
                            </label>
                            <span>: Print on console all the event for debug purpose</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="hideOriginal" ${(userSettings.hideOriginal ? 'checked' : '')}>Original Search Bar
                            </label>
                            <span>: Hide Original seach bar</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="dbText" ${(userSettings.debugText ? 'checked' : '')}>Tagify Text Area
                            </label>
                            <span>: Text area used by tagify <b>⚠ Don't edit the content of the Text area ⚠ Only for debug</b></span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="editAllTags" ${(userSettings.editableTag ? 'checked' : '')}>All Tags editable
                            </label>
                            <span>: Allow to edit all the tag, not only the plain text tag <b>⚠ Comingsoon</b><p style="display: inline; font-size: xx-small;"> (maybe...)</p></span>
                        </div>
                        <br>
                        <div>
                            <p>Position of the suggestion list:</p>
                            <input type="radio" id="all" name="drdpos" class="tacRadio" value="all" ${userSettings.dropdownPosition == 'all' ? 'checked' : ''}>
                            <label for="all">Under the shearch bar</label>
                            <input type="radio" id="input" name="drdpos" class="tacRadio" value="input" ${userSettings.dropdownPosition == 'input' ? 'checked' : ''}>
                            <label for="input">Next to input</label>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Custom CSS</legend>
                        <h3>Tag CSS
                            <div class="tac-control" id="tac-visControls">
                                <button id="tagcssReset">Reset</button>
                            </div>
                        </h3>
                        <div class="ckpiker" style="width: 680px;display: flex;justify-content: space-between; flex-wrap: wrap;">
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpfemale" value="${sadpanda.female}">
                                <label for="tcpfemale">Female:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexfemale" value="${sadpanda.female.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpmale" value="${sadpanda.male}">
                                <label for="tcpmale">Male:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexmale" value="${sadpanda.male.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcplanguage" value="${sadpanda.language}">
                                <label for="tcplanguage">Language:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexlanguage" value="${sadpanda.language.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpcosplayer" value="${sadpanda.cosplayer}">
                                <label for="tcpcosplayer">Cosplayer:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexcosplayer" value="${sadpanda.cosplayer.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpparody" value="${sadpanda.parody}">
                                <label for="tcpparody">Parody:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexparody" value="${sadpanda.parody.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpcharacter" value="${sadpanda.character}">
                                <label for="tcpcharacter">Character:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexcharacter" value="${sadpanda.character.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpgroup" value="${sadpanda.group}">
                                <label for="tcpgroup">Group:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexgroup" value="${sadpanda.group.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpartist" value="${sadpanda.artist}">
                                <label for="tcpartist">Artist:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexartist" value="${sadpanda.artist.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpmixed" value="${sadpanda.mixed}">
                                <label for="tcpmixed">Mixed:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexmixed" value="${sadpanda.mixed.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpother" value="${sadpanda.other}">
                                <label for="tcpother">Other:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexother" value="${sadpanda.other.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpreclass" value="${sadpanda.reclass}">
                                <label for="tcpreclass">Reclass:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexreclass" value="${sadpanda.reclass.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcptemp" value="${sadpanda.temp}">
                                <label for="tcptemp">Temp:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hextemp" value="${sadpanda.temp.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpdefault" value="${sadpanda.default}">
                                <label for="tcpdefault">Default:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexdefault" value="${sadpanda.default.slice(1)}">
                                </span>
                            </span>
                        </div>
                    </fieldset>
                </div>
                <div class="applyContainer">
                    <div class="tac-control"  style="padding-right: 5px;">
                        <button id="tac-apply">Apply</button>
                    </div>
                </div>
            </div>
        </div>
        `);
        $('body').append(container);
        $('body').addClass('noscroll');
        $('#tac-settings-close').click(e => {
            $('.tac-overlay').remove();
            $('body').removeClass('noscroll');
        });
        $('body').click(e => {
            if (e.target.className == "tac-overlay") { // Exit if settings menu isn't clicked
                $('.tac-overlay').remove();
            }
            if (!$('.tac-overlay').length) $('body').removeClass('noscroll');
        });
        $('.tacColorPiker').on("change", e => {
            document.getElementById('hex' + e.target.id.slice(3)).value = e.target.value.slice(1);
            $('#setNotice').text('Applied Settings Will Take Effect On Reload');
            reload = 1;
        });
        $('.tacColorText').on("change", e => {
            if (/[0-9A-Fa-f]{6}/.test(e.target.value)) {
                document.getElementById('tcp' + e.target.id.slice(3)).value = '#' + e.target.value;
            }
            else {
                e.target.value = document.getElementById('tcp' + e.target.id.slice(3)).value.slice(1);
            }
            $('#setNotice').text('Applied Settings Will Take Effect On Reload');
            reload = 1;
        });
        $('.tacCheck').on("change", e => {            
            $('#setNotice').text('Applied Settings Will Take Effect On Reload');
            reload = 1;
        });
        $('#tac-apply').click(e => {
            userSettings.debugConsole = $("#dbConsole").is(":checked");
            userSettings.hideOriginal = $("#hideOriginal").is(":checked");
            userSettings.debugText = $("#dbText").is(":checked");
            userSettings.editableTag = $("#editAllTags").is(":checked");
            userSettings.dropdownPosition = $('input[name="drdpos"]:checked').val();

            sadpanda.female = $("#tcpfemale").val();
            sadpanda.male = $("#tcpmale").val();
            sadpanda.language = $("#tcplanguage").val();
            sadpanda.cosplayer = $("#tcpcosplayer").val();
            sadpanda.parody = $("#tcpparody").val();
            sadpanda.character = $("#tcpcharacter").val();
            sadpanda.group = $("#tcpgroup").val();
            sadpanda.artist = $("#tcpartist").val();
            sadpanda.mixed = $("#tcpmixed").val();
            sadpanda.other = $("#tcpother").val();
            sadpanda.reclass = $("#tcpreclass").val();
            sadpanda.temp = $("#tcptemp").val();
            sadpanda.default = $("#tcpdefault").val();

            localStorage.setItem('tac-settings', JSON.stringify(userSettings));
        });
        $('#tagcssReset').click(e => {
            // reset variable
            if (location.hostname == "e-hentai.org") {
                userSettings.style.base = { ...defaultSettings.style.base }
                sadpanda = userSettings.style.base;
            }
            else {
                userSettings.style.exhentai = { ...defaultSettings.style.exhentai }
                sadpanda = userSettings.style.exhentai;
            }
            // reset the display color
            $("#tcpfemale").val(sadpanda.female).trigger('change');
            $("#tcpmale").val(sadpanda.male).trigger('change');
            $("#tcplanguage").val(sadpanda.language).trigger('change');
            $("#tcpcosplayer").val(sadpanda.cosplayer).trigger('change');
            $("#tcpparody").val(sadpanda.parody).trigger('change');
            $("#tcpcharacter").val(sadpanda.character).trigger('change');
            $("#tcpgroup").val(sadpanda.group).trigger('change');
            $("#tcpartist").val(sadpanda.artist).trigger('change');
            $("#tcpmixed").val(sadpanda.mixed).trigger('change');
            $("#tcpother").val(sadpanda.other).trigger('change');
            $("#tcpreclass").val(sadpanda.reclass).trigger('change');
            $("#tcptemp").val(sadpanda.temp).trigger('change');
            $("#tcpdefault").val(sadpanda.default).trigger('change');
            $('#setNotice').text('Applied Settings Will Take Effect On Reload');
            reload = 1;

        });
    }

    //#region Support funtion

    /**
     * Add the string (CSS) to the page <head>
     * @param {string} CSS - CSS to add to the page
     * @returns {string}
     */
    const addStyle = async (CSS) => {
        let head,
            style;
        head = document.getElementsByTagName('head')[0];
        //if (!head) { return; }
        style = document.createElement('style');
        style.textContent = CSS;
        head.appendChild(style);
        return style; //optional, but convenient for changing the styling later.
    };

    /**
     * Return a Promise of the substitution
     * @param {string} imput_string 
     * @returns {Promise}
     */
    const regex_replace = (imput_string) => {
        return new Promise(function (resolve, reject) {
            // ^(x|mix|mis|co|t|f|m|r|l|p|c|g|a|o).*:

            // Regexp take from /mytags page
            var text = imput_string.replace(/["\']/g, "");
            text = text.match(/^(x|mix).*:/) ? text.replace(/^(x|mix).*:/, "mixed:") : text.match(/^(mis).*:/) ? text.replace(/^(mis).*:/, "temp:") : text.match(/^(co).*:/) ? text.replace(/^(co).*:/, "cosplayer:") : text.replace(/^t.*:/, "temp:").replace(/^f.*:/, "female:").replace(/^m.*:/, "male:").replace(/^r.*:/, "reclass:").replace(/^l.*:/, "language:").replace(/^p.*:/, "parody:").replace(/^c.*:/, "character:").replace(/^g.*:/, "group:").replace(/^a.*:/, "artist:").replace(/^o.*:/, "other:");
            if (2 > text.replace(/^.*:/, "").length)
                reject("Length < 2");
            else {
                resolve(text);
            }
        });
    };

    /**
     * Make a XMLHttpRequest request to the api
     * @param {string} url - API URL
     * @param {string} method - Request method GET | POST
     * @param {Object} [body=null] - Request body
     * @returns Promise
     */
    const makeXMLRequest = (url, method = "GET", body = null) => {

        clearTimeout(typingDebounce); // abort last request
        var request = new XMLHttpRequest();

        // Return it as a Promise
        return new Promise(function (resolve, reject) {
            typingDebounce = setTimeout(function () {
                // Setup our listener to process compeleted requests
                request.onreadystatechange = function () {
                    // Only run if the request is complete
                    if (request.readyState !== 4)
                        return;
                    // Process the response
                    if (request.status >= 200 && request.status < 300) {
                        // If successful                        
                        resolve(request);
                    } else {
                        // If failed
                        reject({
                            status: request.status,
                            statusText: request.statusText
                        });
                    }

                };

                // Setup our HTTP request
                request.open(method, url, true);
                request.setRequestHeader("Content-Type", "application/json");
                request.withCredentials = true;

                // Send the request
                request.send(body);
            }, 350);
        });
    };

    /**
     * Get the resource and handle it with the Callback
     * @param {string} resurce 
     * @param {addStyle} callback 
     */
    const getResourceText = async (resurce, callback) => {
        if (typeof (GM_getResourceText) !== 'undefined') {
            // Tampermonkey and Violentmonkey
            callback(GM_getResourceText(resurce))
        } else if (typeof (GM.getResourceUrl) !== 'undefined') {
            // Greasemonkey and Tampermonkey (If TM compatibility is on)
            GM.getResourceUrl(resurce).then(function (blobURL) {
                makeXMLRequest(blobURL).then(function (result) {
                    callback(result.responseText);
                }).catch((reason) => {
                    mConsole.m("getResource").error('Reasion: ', reason);
                });
            }).catch((reason) => {
                mConsole.m("getResource").error('Reasion: ', reason);
            });
        }
    };

    /**
     * async wait for the element
     * @param {string} selectors - string containing one selectors to match 
     * @param {HTML DOM} [rootElement=document.documentElement]
     * @returns 
     */
    const waitForElement = (selector, rootElement = document.documentElement) => {
        // REF: https://stackoverflow.com/questions/66795663/document-queryselector-inside-mutationobserver-good-or-bad-practice
        // REF: https://gist.github.com/jwilson8767/db379026efcbd932f64382db4b02853e
        return new Promise((resolve, reject) => {
            let el = document.querySelector(selector);
            if (el) {
                resolve(el);
            }
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(rootElement, {
                childList: true,
                subtree: true,
            });
        });
    };

    //#endregion

    //#region Tagify Events

    const populatelist = (value) => {
        tagify.whitelist = null // Reset the whitelist

        let clear_value = value;
        let state = null;

        // Analyze the key if has 'Exclusion' or 'Or' prefix
        // If has it change the state and remove it for the search
        switch (clear_value.charAt(0)) {
            case '-':
                state = -1;
                clear_value = clear_value.slice(1);
                break;
            case '~':
                state = 1;
                clear_value = clear_value.slice(1);
                break;
        }

        // Analyze for Qualifiers "tag:" / "weak:" / "title:" / "uploader:" / "uploaduid:" / "gid:" / "comment:" / "favnote:"
        // TODO

        regex_replace(clear_value).then((pre_elab_result) => {
            // show the loader animation
            tagify.loading(true);

            makeXMLRequest(api_url, "POST", JSON.stringify({
                method: "tagsuggest",
                text: pre_elab_result
            })).then((result) => {

                // Prepare the prefix for the key
                let prefix = state || 0 ? state > 0 ? `~` : `-` : "";

                result = JSON.parse(result.responseText);
                var p = new RegExp("(^| |:)" + pre_elab_result, "ig");
                var a = Object.values(result.tags).map((key) => {
                    return {
                        key: key.tn.indexOf(" ") != -1 ? prefix + key.ns + ":\"" + key.tn + "$\"" : prefix + key.ns + ":" + key.tn + "$",
                        value: (key.ns + ":" + key.tn),
                        editable: false,
                        highlights: (key.ns + ":" + key.tn).match(p) ? (key.ns + ":" + key.tn).replace(p, "<strong>$&</strong>") : key.ns + ":" + key.tn,
                        ...(state) && { state: state }
                    };
                });
                // replace tagify "whitelist" array values with new values
                // and add back the ones already choses as Tags
                tagify.settings.whitelist.push(...a, ...tagify.value)

                // Render the suggestions dropdown.
                // tagify.loading(false).dropdown.show.call(tagify, pre_elab_result);
                // tagify.loading(false).dropdown.show(); // BUG? If show has no param there is some case that the dropdown don't show 
                // IF xx:tag => take only the tag
                // If xx:tag => undefined take pre_elab_result
                tagify.loading(false).dropdown.show(pre_elab_result.split(':')[1] ?? pre_elab_result);

            }).catch((reason) => {
                mConsole.m("Input").error('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
            });
        }).catch((reason) => {
            if (userSettings.debugConsole)
                mConsole.m("Input").debug('Pre-request elab failed. Reasion: ', reason);
        });
    }

    const onAddTag = (e) => {
        if (userSettings.debugConsole)
            mConsole.m("Tag Add").debug(e.detail.data);
        tagify.whitelist = null;
    };

    const onRemoveTag = (e) => {
        if (userSettings.debugConsole)
            mConsole.m("Tag Remove").debug(e.detail.data);
    };

    const onDropdownSelect = (e) => {
        if (userSettings.debugConsole)
            mConsole.m("Dropdown Select").debug(e.detail);
    };

    const onKeyDown = (e) => {
        if (e.detail.event.keyCode == 13 &&
            !tagify.state.inputText && // assuming user is not in the middle oy adding a tag
            !tagify.state.editing // user not editing a tag
        ) {
            e.preventDefault();
            var selector = "#searchbox > form";
            if (location.pathname == "/favorites.php") {
                selector = "body > div.ido > div:nth-child(3) > form";
            }
            $(selector).submit();
        }
        if (userSettings.debugConsole)
            mConsole.m("Key Down").debug(e.type, e.detail);
    };

    const tagAnalyzer = (tagData) => {
        if (userSettings.debugConsole)
            mConsole.m("Tag-Analyzer").debug(tagData);
        // Analize the tag before add it to the tagbar

        // If key don't exist add it to tagData
        tagData.key = tagData.key ?? tagData.value;

        // If i'm editing a tag i need to update the key with the new value
        tagData.key = tagify.state.editing ? tagData.value : tagData.key

        // Analyze the key if has 'Exclusion' or 'Or' prefix
        // If the prefix exist remove it from value
        switch (tagData.value.charAt(0)) {
            case '-':
                tagData.state = -1
                tagData.value = tagData.value.slice(1)
                break;
            case '~':
                tagData.state = 1
                tagData.value = tagData.value.slice(1)
                break;
        }

        // set bakground color by category 
        var category = tagData.value.split(":")[0];
        switch (category) {
            case 'female':
                tagData.style = "--tag-bg:" + sadpanda.female;
                break;
            case 'male':
                tagData.style = "--tag-bg:" + sadpanda.male;
                break;
            case 'language':
                tagData.style = "--tag-bg:" + sadpanda.language;
                break;
            case 'cosplayer':
                tagData.style = "--tag-bg:" + sadpanda.cosplayer;
                break;
            case 'parody':
                tagData.style = "--tag-bg:" + sadpanda.parody;
                break;
            case 'character':
                tagData.style = "--tag-bg:" + sadpanda.character;
                break;
            case 'group':
                tagData.style = "--tag-bg:" + sadpanda.group;
                break;
            case 'artist':
                tagData.style = "--tag-bg:" + sadpanda.artist;
                break;
            case 'mixed':
                tagData.style = "--tag-bg:" + sadpanda.mixed;
                break;
            case 'other':
                tagData.style = "--tag-bg:" + sadpanda.other;
                break;
            case 'reclass':
                tagData.style = "--tag-bg:" + sadpanda.reclass;
                break;
            case 'temp':
                tagData.style = "--tag-bg:" + sadpanda.temp;
                break;
            default:
                tagData.style = "--tag-bg:" + sadpanda.default;
                break;
        }
    };

    // on character(s) added/removed (user is typing/deleting)
    const onInput = (e) => {
        if (userSettings.debugConsole)
            mConsole.m("Input").debug(e.detail);

        populatelist(e.detail.value);
    };

    const onChange = (e) => {
        // outputs a String
        if (userSettings.debugConsole)
            mConsole.m("Change").debug(e.detail);
        var text = "";
        if (e.detail.value) {
            var list = JSON.parse(e.detail.value);
            list = list.map(x => x.key || x.value); // extract key is exist otherwise value
            text = list.join(" ");
        }
        $('[name="f_search"]')[0].value = text;
    };

    const onEditStart = (e) => {
        if (userSettings.debugConsole)
            mConsole.m("edit:start").debug(e.detail);
        const { tag: tagElm, data: tagData } = e.detail;
        tagify.setTagTextNode(tagElm, `${tagData.key}`)
    }

    const onClick = (e) => {
        // Switch between Normal -> Exclusion -> Or tags
        const { tag: tagElm, data: tagData } = e.detail;
        if (tagify.state.editing) // If editing return
            return
        // Delay needed to distinguish between regular click and double-click.
        // This allows enough time for a possible double-click, and noly fires if such
        // did not occur.
        clearTimeout(clickDebounce);
        clickDebounce = setTimeout(() => {
            switch (tagData.state || 0) {
                case -1:
                    tagData.state = 1;
                    tagData.key = tagData.key.slice(1);
                    tagData.key = "~" + tagData.key;
                    mConsole.m("click").debug("Transform to Or");
                    break;
                case 0:
                    tagData.state = -1
                    tagData.key = "-" + tagData.key;
                    mConsole.m("click").debug("Transform to Exclusion");
                    break;
                case 1:
                    tagData.state = 0;
                    tagData.key = tagData.key.slice(1);
                    mConsole.m("click").debug("Transform to Normal");
                    break;
            }
            tagify.replaceTag(tagElm, tagData);
        }, 250);
    };

    const ondblClick = (e) => {
        // when souble clicking, do not change the color of the tag
        clearTimeout(clickDebounce);
    };

    //#endregion

    let typingDebounce = null; // Debounce while typing less server request
    let clickDebounce = null; // Debounce while cliccking, allow doubleclick
    let api_url = null; // Url for api request
    let sadpanda = {}; // For the tag style
    let reload = false; // For request of reload
    let CSSxSite = null;

    // Print site details
    mConsole.log("Site api: ", location.hostname);
    mConsole.log("Location: ", location.pathname);

    if (location.hostname == 'e-hentai.org') {
        api_url = 'https://api.e-hentai.org/api.php';
        sadpanda = userSettings.style.base;
        CSSxSite = `
        :root{
            --tagify-dd-bg-color: #EDEBDF;
            --tagify-dd-color-primary: #5C0D11;

            /* Moved from .tagify to :root*/
            --tags-border-color: #B5A4A4;
            --tags-hover-border-color: #B5A4A4;
            --tags-focus-border-color: #B5A4A4;
            --placeholder-color: #5C0D11;
            --placeholder-color-focus: #5C0D11;

            /*New var */
            --tagify-hover-bg-color: #F3F0E0;
        }
        `;
    } else {
        api_url = 'https://exhentai.org/api.php';
        sadpanda = userSettings.style.exhentai;
        CSSxSite = `
        :root{
            --tagify-dd-bg-color: #4F535B;
            --tagify-dd-color-primary: #F1F1F1;

            /* Moved from .tagify to :root*/
            --tags-border-color: #8D8D8D;
            --tags-hover-border-color: #8D8D8D;
            --tags-focus-border-color: #8D8D8D;
            --placeholder-color: #F1F1F1;
            --placeholder-color-focus: #F1F1F1;

            /*New var */
            --tagify-hover-bg-color: #43464E;
        }
        `;
    }

    // #region element creation

    // Create base container
    var container = document.createElement("DIV");
    container.setAttribute("class", "tagcomplete");
    container.setAttribute("id", "c_aut_comp");
    container.style.position = "relative";

    // Create input text
    // var tag_bar = document.createElement("input");
    // tag_bar.setAttribute("type", "text");
    var tag_bar = document.createElement("textarea");
    tag_bar.style.display = userSettings.debugText ? 'block' : 'none'
    tag_bar.setAttribute("id", "tag_name_bar");
    tag_bar.setAttribute("name", "tag_name_bar"); // Remove this for disable the URL param
    tag_bar.setAttribute("placeholder", "Insert tags ");
    tag_bar.setAttribute("autofocus", '');

    // Create settings container
    var settings = document.createElement("DIV");
    settings.setAttribute("class", "settings");
    settings.onclick = (e) => { open_settinga(); };

    // Create svg icon
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconSvg.setAttribute('viewBox', '0 -960 960 960');
    iconSvg.setAttribute('height', '24');
    iconSvg.setAttribute('width', '24');
    iconPath.setAttribute('d', 'm370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z');
    iconSvg.appendChild(iconPath);

    settings.appendChild(iconSvg); // append SVG icon inside settings

    container.appendChild(tag_bar); // Append tab_ga inside container

    container.appendChild(settings); // Append settings inside container 

    // #endregion

    let selector = location.pathname == "/favorites.php" ? "body > div.ido > div:nth-child(3) > form > div" : "#searchbox > form > div:nth-child(3)";

    mConsole.log("Preload complete. Waintg for website...");
    // Wait the element before assembly all the things
    await waitForElement(selector);
    mConsole.log("Website loded");

    // Append all the style at the head
    getResourceText("TagifyCSS", addStyle);
    addStyle(CSSxSite);

    // Hide the original search bar
    userSettings.hideOriginal ? $(selector).attr('style', 'display:none;') : '';
    // Append
    $(selector).after(container);

    // Clone and append button "Clear Filter"
    $(selector.concat(" > input[type=button]:nth-child(3)")).clone().insertAfter("#c_aut_comp");
    // Clone and append button "Apply Filter"
    $(selector.concat(" > input[type=submit]:nth-child(2)")).clone().insertAfter("#c_aut_comp");

    // Create tagify bar
    var tagify = new Tagify(tag_bar, {
        transformTag: tagAnalyzer,
        delimiters: null,
        // originalInputValueFormat: valuesArr => JSON.stringify(valuesArr.map((item) => { return { key: item.key, value: item.value, editable: item.editable, ...(item.state != 0) && { state: item.state } }; })),
        originalInputValueFormat: valuesArr => JSON.stringify(valuesArr.map((item) => { return { key: item.key, value: item.value, editable: item.editable }; })),
        editTags: {
            clicks: 2,
            keepInvalid: false
        },
        dropdown: {
            enabled: 2, // suggest tags after a single character input
            position: userSettings.dropdownPosition,
            // highlightFirst: true, // Don't otherwise can't insert normal text
        },
        templates: {
            tag(tagData) {
                return `<tag title='${tagData.key || tagData.value}' contenteditable='false' spellcheck="false" class='${this.settings.classNames.tag} ${tagData.class || ""}' ${this.getAttributes(tagData)}>
                        <x title='' class='${this.settings.classNames.tagX}' role='button' aria-label='remove tag'></x>
                        <div>                           
                            <span class='${this.settings.classNames.tagText}'>${tagData.value}</span>
                        </div>
                    </tag>`;
            },
            dropdownItem(item) {
                return `<div ${this.getAttributes(item)} class='${this.settings.classNames.dropdownItem} ${item.class ?? ""}' tabindex="0" role="option">
                        <span>${item.highlights}</span>
                    </div>`;
            },
            dropdownItemNoMatch(data) {
                return `<div class='${tagify.settings.classNames.dropdownItem}' value="noMatch" tabindex="0" role="option">
                    No tag found for: <strong>${data.value}</strong>
                </div>`
            },
        }
    });

    // Get current search value
    const urlParams = new URLSearchParams(window.location.search);
    let old_input = urlParams.get('tag_name_bar')
    old_input = JSON.parse(old_input == "" ? null : old_input);
    if (old_input == null) {
        // old_input = $('[name="f_search"]')[0].value.match(/([~-]?\w+:(?:\")?(?:[^\$\"]*)\$(?:\")?)|((?:[^ ])(?:\")?(?:[\w\s]*)\$(?:\")?)|([~-]?\"(?:[^\"]*)\")|([^\"\$ \n]+)/g);
        old_input = $('[name="f_search"]')[0].value.match(/([~-]?\w+:\"?[^\$\"]*\$\"?)|(\"?[\w\s]*\$\"?)|([~-]?\"[^\"]*\")|([^\"\$ \n]+)/g);
        if (old_input) {
            old_input = old_input.map(function (item, index) {
                return {
                    key: item.match(/^.*:.*$/g) ? item : null,
                    value: item.match(/^.*:.*$/g) ? item.replace(/["\'\$]/g, '') : item.replace(/[\'\$]/g, ''), // Don't remove " if a specific request
                    editable: item.match(/^.*:.*$/g) ? false : true
                };
            });
        }
    }

    tagify.addTags(old_input);

    // Set event listeners
    tagify.on('add', onAddTag)
        .on('remove', onRemoveTag)
        .on('input', onInput)
        .on('dropdown:select', onDropdownSelect)
        .on('change', onChange)
        .on('keydown', onKeyDown)
        .on('click', onClick)
        .on('dblclick', ondblClick)
        .on('edit:start', onEditStart);

    // Your code here...
})();
if (userSettings.debugConsole)
    console.timeEnd('[Tags Auto Complete]: Loading time');

