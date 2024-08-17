// ==UserScript==
// @name Tags Auto Complete
// @namespace https://github.com/ciccabanana/e-hentai-helper-suite
// @homepageURL https://github.com/ciccabanana/e-hentai-helper-suite
// @version 0.3.0
// @encoding utf-8
// @author      ciccabanana
// @description     Replace normal search bar with new one whit autocomplete of tags
// @icon            https://e-hentai.org/favicon.ico
// @supportURL https://github.com/ciccabanana/e-hentai-helper-suite/issues
// @updateURL   https://github.com/ciccabanana/e-hentai-helper-suite/raw/develop/e-hentai-tags-helper.user.js
// @include     *://e-hentai.org/
// @include     *://exhentai.org/
// @include     /https?:\/\/e(-|x)hentai\.org\/(uploader\/.*|watched.*|tag\/.*|\?f_search.*|\?f_cats.*|doujinshi.*|manga.*|artistcg.*|gamecg.*|western.*|non-h.*|imageset.*|cosplay.*|asianporn.*|misc.*|\?tag_name_bar.*|\?f_shash.*|\?next.*|\?prev.*|favorites\.php.*)/
// @require https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js

// @require https://cdn.jsdelivr.net/npm/@yaireo/tagify@4.27.0/dist/tagify.min.js
// @resource    TagifyCSS https://github.com/ciccabanana/e-hentai-helper-suite/raw/develop/resource/tagify.css

// @require https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js
// @require https://cdn.jsdelivr.net/npm/jquery-sortablejs@latest/jquery-sortable.js
// @run-at document-start

// @grant   GM_getResourceText
// @grant   GM.getResourceUrl

// ==/UserScript==

// IndexedDB
const DB_NAME = 'TagAutoComplete';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
const DB_STORE_NAME_R = 'research';
const DB_STORE_NAME_B = 'bookmarks';
var tacDB;

// Object that contain the default settings
const defaultSettings = {
    debugConsole: true, // True => Print on console all the events
    originalBar: false, // True => Show the original search bar
    debugText: false, // True => Show the Tagify Text Area
    editableTag: false, // True => All tag are editable
    showNoMatch: false, // True => Enable the footer "No tag Found for: xxxxx"
    urlParameter: false, // True => Enale the this plugin url parameter
    expiration: 1,
    dropdownPosition: 'all',
    style: {
        base: {
            female: '#F75F57',
            male: '#435BD5',
            language: '#10A911',
            cosplayer: '#902BDC',
            parody: '#902BDC',
            character: '#D973D2',
            group: '#F2A019',
            artist: '#D2D204',
            mixed: '#ab9f60', //  #3cd230 or #38d42f
            other: '#808080',
            reclass: '#808080',
            temp: '#808080',
            tag1: '#F75F57',
            tag2: '#435BD5',
            default: '#808080',
            // NON-H => #0cb8ce / 0cb9cf / #0cbad0
        },
        exhentai: {
            female: '#9E2720', // (Red) (Doujinshi)
            male: '#325CA2', // (Blue) (Image Set)
            language: '#6A936D', // (Green) (Game CG)
            cosplayer: '#6A32A2', // (Purple ) (Cosplay)
            parody: '#6A32A2', // (Purple ) (Cosplay)
            character: '#A23282', // (Orchid) (Asian)
            group: '#DB6C24', // (Oragne) (Manga)
            artist: '#D38F1D', // (YelloW) (Artistig CG)
            mixed: '#AB9F60', // Teak (Western)
            other: '#777777', // (Gray) (Misc)
            reclass: '#777777', // (Gray) (Misc)
            temp: '#777777', // (Gray) (Misc)
            tag1: '#9E2720', // (Red) (Doujinshi)
            tag2: '#325CA2', // (Blue) (Image Set)
            default: '#777777', // (Gray) (Misc)
            // Non-H =>
        },
    },
    version: 2,
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

    warn = (() => {
        return Function.prototype.bind.call(console.warn, console, '%cTags Auto Complete', 'background-color: #F5B932; color: black; padding: 2px 10px; border-radius: 3px;');
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
        const moduleStyle = blocks.map((el) => el.style);
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
        temp.warn = (() => {
            return Function.prototype.bind.call(console.warn, console, `%cTAC ${moduleText}`, 'background-color: #F5B932; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
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

    // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    getColorByBgColor(bgColor) {
        if (bgColor.length == 7) {
            bgColor = bgColor.substring(1);
        }
        let R = parseInt(bgColor.substring(0, 2), 16);
        let G = parseInt(bgColor.substring(2, 4), 16);
        let B = parseInt(bgColor.substring(4, 6), 16);
        return Math.sqrt(R * R * 0.241 + G * G * 0.691 + B * B * 0.068) < 130 ? '#fff' : '#000';
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
        const getType = (obj) => {
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

if (userSettings.debugConsole) console.time('[Tags Auto Complete]: Loading time');

(async function () {
    'use strict';

    mConsole.log('Start Injection');
    if (userSettings.debugConsole) console.time('[Tags Auto Complete]: Inject time');

    const open_settinga = async () => {
        let settingsHTML = $(`
        <div class="tac-overlay">
            <div class="tac-settings">
                <nav id="tac-topNav">
                    <span id="tac-home" style="float: left; border: none; padding: 0 0 0 15px;">
                        Tags auto complete 3.0 • 
                        <b><a href="https://github.com/Mayriad/Mayriads-EH-Master-Script" target="_blank" rel="noopener noreferrer">GitHub Repository</a></b> • 
                        <b><a href="https://forums.e-hentai.org/index.php?showtopic=242709" target="_blank" rel="noopener noreferrer">Support Thread</a></b> 
                    </span>
                    <div>
                        <a id="tac-settings-close">&#128939</a>
                    </div>
                </nav>
                <div class="section-container">
                    <fieldset>
                        <legend>Settings</legend>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="dbConsole" ${userSettings.debugConsole ? 'checked' : ''}>Debug console
                            </label>
                            <span>: Print on the console all the events. For debug purpose</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="originalBar" ${userSettings.originalBar ? 'checked' : ''}>Original Search Bar
                            </label>
                            <span>: Show the website original search bar</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="dbText" ${userSettings.debugText ? 'checked' : ''}>Tagify Text Area
                            </label>
                            <span>: Text area used by tagify <b>⚠ Don't edit the content of the Text area ⚠ Only for debug</b></span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="editAllTags" ${userSettings.editableTag ? 'checked' : ''}>All Tags editable
                            </label>
                            <span>: Allow to edit all the tag, not only the plain text tag</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="showNoMatch" ${userSettings.showNoMatch ? 'checked' : ''}>Dropsown no result
                            </label>
                        <span>: Show the dropdown fotter "No tag Found for: xxxxx"</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="urlParameter" ${userSettings.urlParameter ? 'checked' : ''}>Plugin URL Parameter
                            </label>
                        <span>: Use this plugin url parameter</span>
                        </div>
                        <div>
                            <p>Position of the suggestion list:</p>
                            <input type="radio" id="all" name="drdpos" class="tacRadio" value="all" ${userSettings.dropdownPosition == 'all' ? 'checked' : ''}>
                            <label for="all">Under the search bar</label>
                            <input type="radio" id="input" name="drdpos" class="tacRadio" value="input" ${userSettings.dropdownPosition == 'input' ? 'checked' : ''}>
                            <label for="input">Next to input</label>
                            <input type="radio" id="text" name="drdpos" class="tacRadio" value="text" ${userSettings.dropdownPosition == 'text' ? 'checked' : ''}>
                            <label for="text">Next to text</label>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Cache</legend>
                        <h3>
                            <div class="tac-control" id="tac-visControls">
                                <button title="Remove all expired seach from the cache" id="tagCacheRemoveExpired">Clear Expired</button>
                                <button title="Remove all values from the cache" id="tagCacheReset">Clear All</button>
                            </div>
                        </h3>
                        <div>
                            <b>Search's cache will be refresh after X days:</b>
                            <input type="number" class="field" id="expiration" min="1" max="365" step="1" onkeypress='return event.charCode >= 48 && event.charCode <= 57' value="${userSettings.expiration}">
                            (Min: 1 day / Max: 365 days) 
                            </br>
                        &#9432; When a term is searched it will be saved in the cache along with the website response, so that when it is searched again it will not need to query the website.
                        When a saved term will be searched but the date exceeds X days, the cached information will be updated through the website.                         
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend>Bookmarks</legend>
                        <h3>Bookmarks list <small>&#9432; (Max 50, only the first 25 will be showed from dropdown)</small>
                            <div class="tac-control"">
                                <button title="Remove all bookmarks" id="tagbkmReset">Reset</button>
                            </div>
                        </h3>                        
                        <textarea name='bookmarks' class='tagify--outside' placeholder='Search tags 'autofocus></textarea>
                    </fieldset>
                    <fieldset>
                        <legend>Custom CSS</legend>
                        <h3>Tag CSS
                            <div class="tac-control"">
                                <button id="tagcssReset">Reset</button>
                            </div>
                        </h3>
                        <div class="ckpiker" style="width: 680px;display: flex;justify-content: space-between; flex-wrap: wrap;">
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpfemale" value="${tagStyle.female}">
                                <label for="tcpfemale">Female:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexfemale" value="${tagStyle.female.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpmale" value="${tagStyle.male}">
                                <label for="tcpmale">Male:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexmale" value="${tagStyle.male.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcplanguage" value="${tagStyle.language}">
                                <label for="tcplanguage">Language:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexlanguage" value="${tagStyle.language.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpcosplayer" value="${tagStyle.cosplayer}">
                                <label for="tcpcosplayer">Cosplayer:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexcosplayer" value="${tagStyle.cosplayer.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpparody" value="${tagStyle.parody}">
                                <label for="tcpparody">Parody:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexparody" value="${tagStyle.parody.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpcharacter" value="${tagStyle.character}">
                                <label for="tcpcharacter">Character:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexcharacter" value="${tagStyle.character.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpgroup" value="${tagStyle.group}">
                                <label for="tcpgroup">Group:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexgroup" value="${tagStyle.group.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpartist" value="${tagStyle.artist}">
                                <label for="tcpartist">Artist:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexartist" value="${tagStyle.artist.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpmixed" value="${tagStyle.mixed}">
                                <label for="tcpmixed">Mixed:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexmixed" value="${tagStyle.mixed.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpother" value="${tagStyle.other}">
                                <label for="tcpother">Other:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexother" value="${tagStyle.other.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpreclass" value="${tagStyle.reclass}">
                                <label for="tcpreclass">Reclass:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexreclass" value="${tagStyle.reclass.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcptemp" value="${tagStyle.temp}">
                                <label for="tcptemp">Temp:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hextemp" value="${tagStyle.temp.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcptag1" value="${tagStyle.tag1}">
                                <label for="tcptag1">Tag C 1:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hextag1" value="${tagStyle.tag1.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcptag2" value="${tagStyle.tag2}">
                                <label for="tcptag2">Tag C 2:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hextag2" value="${tagStyle.tag2.slice(1)}">
                                </span>
                            </span>
                            <span>
                                <input type="color" class="tacColorPiker" id="tcpdefault" value="${tagStyle.default}">
                                <label for="tcpdefault">Default:</label>
                                <span class="hexwrapper">
                                    <span class="prefix">#</span>
                                    <input type="text" class="tacColorText" maxlength="6" pattern="[0-9A-Fa-f]{6}" id="hexdefault" value="${tagStyle.default.slice(1)}">
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

        $('body').append(settingsHTML);

        // Add possibility to Remove tag with Middle Click
        // prettier-ignore
        let settings = document.querySelector('.tac-settings')

        // The DOM element you wish to replace with Tagify
        let bookmarksDebugText = document.querySelector('textarea[name=bookmarks]');
        bookmarksDebugText.style.display = userSettings.debugText ? 'block' : 'none';
        // Initialize Tagify on the above input node reference
        // prettier-ignore
        let tagifyBooks = new Tagify(bookmarksDebugText, {
            validate(data) { return /\w+:\"?[^\$\"]+\$\"?$/.test(data.key); },
            maxTags: 50, // Let's have more Bookmarks
            dropdown: { position: userSettings.dropdownPosition, highlightFirst: false, },
            keepInvalidTags: false,
            transformTag: tagAnalyzer,
            originalInputValueFormat: (valuesArr) => JSON.stringify(valuesArr.map((item) => { return { key: item.key, value: item.value, state: item.state, bookmarks: true }; })),
            editTags: false,
        });

        middleclickChecker(settings, '.tagify__tag', tagifyBooks);

        // Use await for not trigger add event of Tagify
        try {
            let tBookmarks = await getBookmarks();
            await tagifyBooks.addTags(tBookmarks);
        } catch (error) {
            mConsole.m('open_settinga').error('Error on retrieve bookmarks', error);
        }

        // listen to tagify "change" event and print updated value
        tagifyBooks
            .on('change', (e) => {
                if (userSettings.debugConsole) mConsole.m('Change').debug(e.detail);
            })
            .on('input', (e) => {
                if (userSettings.debugConsole) mConsole.m('Input').debug(e.detail);
                populatelist(e.detail, tagifyBooks);
            })
            .on('add', (e) => {
                if (userSettings.debugConsole) mConsole.m('Tag Add').debug(e.detail.data);
                tagifyBooks.whitelist = null;
            });

        let sorableTags = document.querySelector('.tagify--outside');
        // Grid demo
        new Sortable(sorableTags, {
            animation: 150,
            onMove: (evt) => {
                if (evt.related) {
                    return !evt.related.classList.contains('tagify__input');
                }
            },
            onEnd: (evt) => {
                tagifyBooks.updateValueByDOMTags();
            },
        });

        $('body').addClass('noscroll');
        $('#tac-settings-close').click((e) => {
            $('.tac-overlay').remove();
            $('body').removeClass('noscroll');
        });
        $('body').click((e) => {
            // Exit if clicked otside settings menu
            if (e.target.className == 'tac-overlay') {
                $('.tac-overlay').remove();
            }
            if (!$('.tac-overlay').length) $('body').removeClass('noscroll');
        });
        $('.tacColorPiker').on('change', (e) => {
            document.getElementById('hex' + e.target.id.slice(3)).value = e.target.value.slice(1);
        });
        $('.tacColorText').on('change', (e) => {
            if (/[0-9A-Fa-f]{6}/.test(e.target.value)) {
                document.getElementById('tcp' + e.target.id.slice(3)).value = '#' + e.target.value;
            } else {
                e.target.value = document.getElementById('tcp' + e.target.id.slice(3)).value.slice(1);
            }
        });
        $('#tac-apply').click((e) => {
            // Refresh userSettings variables
            userSettings.debugConsole = $('#dbConsole').is(':checked');
            userSettings.originalBar = $('#originalBar').is(':checked');
            userSettings.debugText = $('#dbText').is(':checked');
            userSettings.editableTag = $('#editAllTags').is(':checked');
            userSettings.showNoMatch = $('#showNoMatch').is(':checked');
            userSettings.urlParameter = $('#urlParameter').is(':checked');
            userSettings.expiration = parseInt($('#expiration').val());
            userSettings.dropdownPosition = $('input[name="drdpos"]:checked').val();
            // Refresh website style
            tagStyle.female = $('#tcpfemale').val();
            tagStyle.male = $('#tcpmale').val();
            tagStyle.language = $('#tcplanguage').val();
            tagStyle.cosplayer = $('#tcpcosplayer').val();
            tagStyle.parody = $('#tcpparody').val();
            tagStyle.character = $('#tcpcharacter').val();
            tagStyle.group = $('#tcpgroup').val();
            tagStyle.artist = $('#tcpartist').val();
            tagStyle.mixed = $('#tcpmixed').val();
            tagStyle.other = $('#tcpother').val();
            tagStyle.reclass = $('#tcpreclass').val();
            tagStyle.temp = $('#tcptemp').val();
            tagStyle.tag1 = $('#tcptag1').val();
            tagStyle.tag2 = $('#tcptag2').val();
            tagStyle.default = $('#tcpdefault').val();
            // Save the new settings
            localStorage.setItem('tac-settings', JSON.stringify(userSettings));

            // Applay userSettings without reload
            document.querySelector(selector).style.display = userSettings.originalBar ? '' : 'none';
            tag_bar.style.display = userSettings.debugText ? 'block' : 'none';
            bookmarksDebugText.style.display = userSettings.debugText ? 'block' : 'none';

            // If need to enable all tag editable: => remove editable atributes
            // If need to disable all tag editable: => set corectly editable atributes
            if (tag_bar.value) {
                // If tag_bar.value != ''
                tag_bar.value = userSettings.editableTag
                    ? JSON.stringify(JSON.parse(tag_bar.value).map(({ editable, ...keepAttrs }) => keepAttrs))
                    : JSON.stringify(JSON.parse(tag_bar.value).map((item) => ({ ...item, ...(!userSettings.editableTag && { editable: item.key.match(/^.*:.*$/g) ? false : true }) })));
            }
            userSettings.urlParameter ? tag_bar.setAttribute('name', 'tag_name_bar') : tag_bar.removeAttribute('name');

            tagify.settings.dropdown.position = userSettings.dropdownPosition;
            tagifyBooks.settings.dropdown.position = userSettings.dropdownPosition;

            addBookmarks(JSON.parse(tagifyBooks.DOM.originalInput.tagifyValue ? tagifyBooks.DOM.originalInput.tagifyValue : '[]'));
            setTBookmarks();

            // Applay the new style
            Array.from(document.getElementsByClassName('tac_female')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.female;
            });
            Array.from(document.getElementsByClassName('tac_male')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.male;
            });
            Array.from(document.getElementsByClassName('tac_language')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.language;
            });
            Array.from(document.getElementsByClassName('tac_cosplayer')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.cosplayer;
            });
            Array.from(document.getElementsByClassName('tac_parody')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.parody;
            });
            Array.from(document.getElementsByClassName('tac_character')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.character;
            });
            Array.from(document.getElementsByClassName('tac_group')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.group;
            });
            Array.from(document.getElementsByClassName('tac_artiste')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.artist;
            });
            Array.from(document.getElementsByClassName('tac_mixed')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.mixed;
            });
            Array.from(document.getElementsByClassName('tac_other')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.other;
            });
            Array.from(document.getElementsByClassName('tac_reclass')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.reclass;
            });
            Array.from(document.getElementsByClassName('tac_temp')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.temp;
            });
            Array.from(document.getElementsByClassName('tac_tag')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.tag1 + '; --tag-bg2:' + tagStyle.tag2;
            });
            Array.from(document.getElementsByClassName('tac_default')).forEach((elem) => {
                elem.style = '--tag-bg:' + tagStyle.default;
            });
        });
        $('#tagcssReset').click((e) => {
            // reset variable
            if (location.hostname == 'e-hentai.org') {
                userSettings.style.base = { ...defaultSettings.style.base };
                tagStyle = userSettings.style.base;
            } else {
                userSettings.style.exhentai = { ...defaultSettings.style.exhentai };
                tagStyle = userSettings.style.exhentai;
            }
            // reset the display color
            $('#tcpfemale').val(tagStyle.female).trigger('change');
            $('#tcpmale').val(tagStyle.male).trigger('change');
            $('#tcplanguage').val(tagStyle.language).trigger('change');
            $('#tcpcosplayer').val(tagStyle.cosplayer).trigger('change');
            $('#tcpparody').val(tagStyle.parody).trigger('change');
            $('#tcpcharacter').val(tagStyle.character).trigger('change');
            $('#tcpgroup').val(tagStyle.group).trigger('change');
            $('#tcpartist').val(tagStyle.artist).trigger('change');
            $('#tcpmixed').val(tagStyle.mixed).trigger('change');
            $('#tcpother').val(tagStyle.other).trigger('change');
            $('#tcpreclass').val(tagStyle.reclass).trigger('change');
            $('#tcptemp').val(tagStyle.temp).trigger('change');
            $('#tcptag1').val(tagStyle.tag1).trigger('change');
            $('#tcptag2').val(tagStyle.tag2).trigger('change');
            $('#tcpdefault').val(tagStyle.default).trigger('change');
        });
        $('#tagCacheRemoveExpired').click((e) => {
            removeOldResearch();
        });
        $('#tagCacheReset').click((e) => {
            clearResearch();
        });
        $('#tagbkmReset').click((e) => {
            tagifyBooks.removeAllTags();
        });
    };

    //#region Support funtion

    /**
     * Adds a new style element to the document's head with the provided CSS content.
     *
     * This function creates a new `<style>` element, sets its text content to the given CSS,
     * and appends it to the document's head.
     *
     * @param {string} CSS - The CSS styles to be added.
     * @returns {HTMLStyleElement} The created style element, or undefined if the head element is not found.
     */
    const addStyle = async (CSS) => {
        let head, style;
        head = document.getElementsByTagName('head')[0];
        //if (!head) { return; }
        style = document.createElement('style');
        style.textContent = CSS;
        head.appendChild(style);
        return style; //optional, but convenient for changing the styling later.
    };

    /**
     * Replaces specific tag groups in an input string with standardized tags.
     *
     * This function iterates through a list of tag patterns and replaces matching
     * groups with their corresponding standardized tags. The function also throws an
     * error if the resulting string is less than 2 characters long.
     *
     * @param {string} imput_string - The input string containing tags to be replaced.
     * @returns {string} The modified string with replaced tags.
     * @throws {Error} If the resulting string after tag replacement is less than 2 characters.
     */
    const replaceTagGroups = (imput_string) => {
        // ^(x|mix|mis|co|t|f|m|r|l|p|c|g|a|o).*:
        // Regexp take from /mytags page
        let text = imput_string.replace(/["\']/g, '');
        text = text.match(/^(x|mix).*:/i)
            ? text.replace(/^(x|mix).*:/i, 'mixed:')
            : text.match(/^(mis).*:/i)
                ? text.replace(/^(mis).*:/i, 'temp:')
                : text.match(/^(co).*:/i)
                    ? text.replace(/^(co).*:/i, 'cosplayer:')
                    : text
                        .replace(/^t.*:/i, 'temp:')
                        .replace(/^f.*:/i, 'female:')
                        .replace(/^m.*:/i, 'male:')
                        .replace(/^r.*:/i, 'reclass:')
                        .replace(/^l.*:/i, 'language:')
                        .replace(/^p.*:/i, 'parody:')
                        .replace(/^c.*:/i, 'character:')
                        .replace(/^g.*:/i, 'group:')
                        .replace(/^a.*:/i, 'artist:')
                        .replace(/^o.*:/i, 'other:');
        if (2 > text.replace(/^.*:/i, '').length)
            throw {
                reason: 'Length < 2',
                input: imput_string,
            };
        return text;
    };

    /**
     * Makes an XML HTTP request to the specified URL.
     *
     * This function uses the Fetch API (polyfilled with XMLHttpRequest) to send an HTTP request
     * and returns a Promise that resolves with the request object on success or rejects with an error object on failure.
     *
     * @param {string} url - The URL to which the request is sent.
     * @param {string} method - The HTTP method to use (default: 'GET'). Can be 'GET', 'POST', 'PUT', etc.
     * @param {any} body - Optional data to send in the request body (default: null).
     *                     For POST or PUT requests, the body should be a valid JSON string.
     * @returns {Promise<XMLHttpRequest>} A Promise that resolves with the XMLHttpRequest object
     *                                      containing the response data on success.
     *                                      Rejects with an error object containing status and statusText on failure.
     */
    const makeXMLRequest = (url, method = 'GET', body = null) => {
        let request = new XMLHttpRequest();
        // Return it as a Promise
        return new Promise((resolve, reject) => {
            // Setup our listener to process compeleted requests
            request.onreadystatechange = function () {
                // Only run if the request is complete
                if (request.readyState !== 4) return;
                // Process the response
                if (request.status >= 200 && request.status < 300) {
                    // If successful
                    resolve(request);
                } else {
                    // If failed
                    reject({
                        status: request.status,
                        statusText: request.statusText,
                    });
                }
            };
            // Setup our HTTP request
            request.open(method, url, true);
            request.setRequestHeader('Content-Type', 'application/json');
            request.withCredentials = true;

            // Send the request
            request.send(body);
        });
    };

    /**
     * Get the resource and handle it with the Callback
     * @param {string} resurce
     * @param {addStyle} callback
     */
    const getResourceText = async (resurce, callback) => {
        mConsole.m('getResourceText').log('adsdasdasdasda', resurce);

        if (typeof GM_getResourceText !== 'undefined') {
            // Tampermonkey and Violentmonkey
            callback(GM_getResourceText(resurce));
        } else if (typeof GM.getResourceUrl !== 'undefined') {
            // Greasemonkey and Tampermonkey (If TM compatibility is on)
            // GM.getResourceUrl(resurce).then((blobURL) => {
            //     makeXMLRequest(blobURL).then((result) => {
            //         callback(result.responseText);
            //     }).catch((reason) => {
            //         mConsole.m('getResourceText').error('Reasion: ', reason);
            //     });
            // }).catch((reason) => {
            //     mConsole.m('getResourceText').error('Reasion: ', reason);
            // });

            let blobURL;
            try {
                blobURL = await GM.getResourceUrl(resurce);
                let result = await makeXMLRequest(blobURL);
                callback(result.responseText);
            } catch (reason) {
                mConsole.m('getResourceText').error('Reasion: ', reason);
            }
        }
    };

    /**
     * Waits for an element matching the provided selector to be added to the DOM.
     *
     * This function uses a MutationObserver to monitor changes in the DOM and
     * resolves a Promise with the first matching element found based on the selector.
     * If the element already exists in the DOM when the function is called,
     * the Promise resolves immediately with that element.
     *
     * @param {string} selector - A valid CSS selector string to identify the element.
     * @param {HTMLElement} rootElement (optional) - The root element from which to start observing changes (default: document.documentElement).
     * @returns {Promise<HTMLElement>} A Promise that resolves with the first matching element found,
     *                                   or rejects if the element is not found within a reasonable timeframe.
     */
    const waitForElement = (selector, rootElement = document.documentElement) => {
        // REF: https://stackoverflow.com/questions/66795663/document-queryselector-inside-mutationobserver-good-or-bad-practice
        // REF: https://gist.github.com/jwilson8767/db379026efcbd932f64382db4b02853e
        return new Promise((resolve, reject) => {
            let el = document.querySelector(selector);
            if (el) resolve(el);
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

    /**
     * Attaches a listener to a container element to handle middle click events on elements matching the selector.
     *
     * This function adds a `mousedown` event listener to the provided `container` element.
     * When a middle click (button 1) occurs, it checks if the click targets element is a closest of the `selector`.
     * If a matching element is found, it prevents default behavior (scrolling) and adds a one-time `mouseup` listener
     * to the container. The `mouseup` listener checks if the mouse is released over the same element and triggers
     * the removal of the clicked tag
     *
     * @param {Element} container - The element to attach the event listener to.
     * @param {string} selector - A CSS selector to identify target elements for middle click handling.
     * @param {object} barr - An Tagify likely containing a `removeTags` function to remove tags (specific functionality unknown).
     */
    const middleclickChecker = (container, selector, barr) => {
        container.addEventListener('mousedown', (event1) => {
            // Ceck for impossible problem
            (event1.button == 1 && event1.buttons != 4) || (event1.button != 1 && event1.buttons == 4) ? mConsole.m('Middle Click').log('Something go wrong', 'button:', event1.button, 'buttons:', event1.buttons) : '';
            // Ceck if the button pressed is a middle click
            if (event1.button == 1) {
                // Ceck if mousedown is over a tagify__tag for prevent the scrolling
                let t = event1.target.closest(selector);
                if (t !== null) {
                    if (userSettings.debugConsole) mConsole.m('Middle Click').m('Down').log('Tag pressed:', t);
                    event1.preventDefault();
                    // addEventListener for ceck if the mouseup is over the same element
                    container.addEventListener(
                        'mouseup',
                        (event2) => {
                            if (t == event2.target.closest(selector)) {
                                // Create custom event middleclick
                                // mConsole.m('Middle Click').m('Up').log(event1, event2);
                                if (userSettings.debugConsole) mConsole.m('Middle Click').m('Tag Remove').log(t);
                                barr.removeTags(t);
                            }
                        },
                        { once: true }
                    );
                }
            }
        });
    };

    /**
     * Handles user interactions with the currently active suggestion element in the Tagify dropdown, specifically for adding or removing bookmarks for suggested tags.
     *
     * This function assumes the existence of a `tagify` object that manages the tag suggestions and whitelist.
     * It also expects suggestion elements in the dropdown to have attributes named `key`, `value`, `state`, and potentially `bookmarks`.
     *
     */
    const bookmarksEvent = () => {
        let suggestionElm = tagify.DOM.dropdown.querySelector(tagify.settings.classNames.dropdownItemActiveSelector),
            key = suggestionElm.getAttribute('key'),
            value = suggestionElm.getAttribute('value'),
            state = Number(suggestionElm.getAttribute('state')),
            qualifiers = suggestionElm.getAttribute('qualifiers'),
            generic = suggestionElm.getAttribute('generic'),
            bookmarks = suggestionElm.getAttribute('bookmarks') == null ? false : suggestionElm.getAttribute('bookmarks').toLowerCase() === 'true' ? true : false,
            elm_key = suggestionElm.getAttribute('key'),
            operation;
        // Corection for generic type (tag or weak)
        key = generic ? qualifiers + ':' + key.substring(key.indexOf(':') + 1) : qualifiers ? qualifiers + ':' + key : key;
        value = generic ? qualifiers + ':' + value.substring(value.indexOf(':') + 1) : qualifiers ? qualifiers + ':' + value : value;
        if (bookmarks) {
            operation = removeBookmark;
        } else {
            operation = addBookmark;
        }
        operation({ key: key, value: value, ...(state && { state: state }), bookmarks: true }).then(async () => {
            if (userSettings.debugConsole) mConsole.m('Quick suggestion').debug('Add/Remove', suggestionElm, value, operation.name);
            // var foundIndex = tagify.whitelist.findIndex((x) => x.key == key);
            let indexes = tagify.whitelist.map((el, idx) => ((el.generic ? el.qualifiers + ':' + el.key.substring(el.key.indexOf(':') + 1) : el.qualifiers ? el.qualifiers + ':' + el.key : el.key) == key ? idx : '')).filter(String);
            indexes.forEach((idx) => (tagify.whitelist[idx]['bookmarks'] = !bookmarks));
            tagify.dropdown.refilter.call(tagify);
            tagify.dropdown.highlightOption(tagify.DOM.dropdown.querySelector(`[key='${elm_key}']`));
        });
    };

    //#endregion

    //#region Indexdb funtion

    /**
     * Opens a connection to the indexedDB database asynchronously.
     *
     * This function opens a connection to the database specified by `DB_NAME` and `DB_VERSION`
     * (assumed to be defined elsewhere). It uses Promises to handle the asynchronous nature of
     * indexedDB operations.
     *
     * @returns {Promise<IDBDatabase>} A Promise that resolves with the opened IDBDatabase object on success,
     *                                  or rejects with an error message if the database fails to open.
     */
    const openDb = async () => {
        return new Promise(function (resolve, reject) {
            mConsole.m('IndexDB').m('openDb').log('Opening...');
            let req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onsuccess = (evt) => {
                tacDB = evt.target.result;
                mConsole.m('IndexDB').m('openDb').log('Success');
                resolve(tacDB);
            };

            req.onerror = (evt) => {
                mConsole.m('IndexDB').m('openDb').error(evt.target.errorCode);
                reject('error opening database ' + evt.target.errorCode);
            };

            req.onupgradeneeded = (evt) => {
                mConsole.m('IndexDB').m('openDb').log('Upgrade needed');
                let research = evt.target.result.createObjectStore(DB_STORE_NAME_R, { keyPath: 'id' });
                research.createIndex('timestamp', 'timestamp', { unique: false });
                let bookmarks = evt.target.result.createObjectStore(DB_STORE_NAME_B, { keyPath: DB_STORE_NAME_B });
                // bookmarks.createIndex('key', 'key', { unique: true });

                // let bookmarks = evt.target.result.createObjectStore(DB_STORE_NAME_B, { keyPath: 'key' });
                // bookmarks.createIndex('sort', 'sort', { autoIncrement: true });
            };
        });
    };

    /**
     * Retrieves an object store from the indexedDB database.
     *
     * This function opens a transaction on the specified store name and mode,
     * and returns the corresponding object store.
     *
     * @param {string} store_name - The name of the object store to retrieve.
     * @param {string} mode - The transaction mode ('readonly', 'readwrite', or 'versionchange').
     * @returns {IDBObjectStore} The requested object store.
     */
    const getObjectStore = (store_name, mode) => {
        let tx = tacDB.transaction(store_name, mode);
        return tx.objectStore(store_name);
    };

    /**
     * Adds a research entry to the indexedDB database.
     *
     * This function attempts to add a new research entry with the provided search input and search result.
     * If an entry with the same search input already exists and is expired (based on user settings),
     * it updates the existing entry with the new search result and timestamp.
     *
     * @param {string} searchInput - The unique search term used for the research.
     * @param {array} searchResult - The research data retrieved for the search input.
     * @returns {Promise<IDBRequest>} A Promise that resolves (undefined) upon successful addition or update,
     *                                or rejects with an error message if something goes wrong with the transaction.
     */
    const addResearch = async (searchInput, searchResult) => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('addResearch').debug('Search Input:', searchInput, 'Search Result:', searchResult);

        let objStore = getObjectStore(DB_STORE_NAME_R, 'readwrite');
        let openRequest = objStore.openCursor(searchInput);

        let obj = { id: searchInput, result: searchResult, timestamp: Date.now() };

        openRequest.onsuccess = (e) => {
            let cursor = openRequest.result;
            if (cursor) {
                if ((Date.now() - cursor.value.timestamp) / 86_400_000 > userSettings.expiration) {
                    // Update entry if key exists and is expired
                    cursor.update(obj);
                    if (userSettings.debugConsole) mConsole.m('IndexDB').m('addResearch').debug('Updated', searchInput);
                }
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addResearch').debug('Not expired', searchInput);
            } else {
                // Otherwise, add entry
                objStore.add(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addResearch').log('Added', searchInput);
            }
        };
        openRequest.onerror = (e) => {
            mConsole.m('IndexDB').m('addResearch').error('Something bad happened with the Research:', searchInput, ':', e.target.error);
        };
    };

    /**
     * Retrieves research data from the indexedDB database for a given search key.
     *
     * This function retrieves research data associated with the provided search key from the
     * 'research' object store. It checks for expiration based on user settings (`userSettings.expiration`)
     * and only resolves with valid, non-expired results.
     *
     * @param {string} searchKey - The unique search term used to identify the research data.
     * @returns {Promise<array>} A Promise that resolves with the retrieved research data if found and valid,
     *                          or resolves with an empty array (`[]`) if no matching record is found
     *                          or the existing record is expired. Rejects with an error object
     *                          containing the search key and error details if an error occurs during retrieval.
     */
    const getResearch = (searchKey) => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('getResearch').debug('Search key:', searchKey);
        return new Promise((resolve, reject) => {
            let objStore = getObjectStore(DB_STORE_NAME_R, 'readonly');
            let request = objStore.get(searchKey);
            request.onsuccess = (e) => {
                if (typeof e.target.result !== 'undefined' && (Date.now() - e.target.result.timestamp) / 86_400_000 <= userSettings.expiration) {
                    if (userSettings.debugConsole) mConsole.m('IndexDB').m('getResearch').debug('Search result for:', e.target.result.id, 'found:', e.target.result.result);
                    resolve(e.target.result.result);
                } else {
                    if (userSettings.debugConsole) mConsole.m('IndexDB').m('getResearch').debug('No matching record found');
                    resolve([]);
                }
            };
            request.onerror = (e) => {
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('getResearch').error('Something bad happened with the Research', searchKey, ':', e.target.error);
                reject({ element: searchKey, error: e.target.error });
            };
        });
    };

    /**
     * Clears all research data from the indexedDB database.
     *
     * This function removes all entries from the 'research' object store.
     *
     * @returns {Promise<any[]>} A Promise that resolves with an empty array (`[]`) upon successful deletion,
     *                          or rejects with an error object containing details if the operation fails.
     */
    const clearResearch = () => {
        mConsole.m('IndexDB').m('clearResearch').log('Start');
        return new Promise((resolve, reject) => {
            let objStore = getObjectStore(DB_STORE_NAME_R, 'readwrite');
            let request = objStore.clear();
            request.onsuccess = (e) => {
                mConsole.m('IndexDB').m('clearResearch').log("The Search's cache was cleared");
                resolve([]);
            };
            request.onerror = (e) => {
                mConsole.m('IndexDB').m('clearResearch').error("Something bad happened with the Search's cache");
                reject({ element: idResearch, error: e.target.error });
            };
        });
    };

    /**
     * Removes old and expired research entries from the indexedDB database.
     *
     * This function iterates through the 'timestamp' index of the 'research' object store and deletes
     * entries with timestamps older than the specified expiration time based on `userSettings.expiration`.
     *
     * @returns {Promise<any[]>} A Promise that resolves with an empty array (`[]`) upon successful deletion,
     *                          or rejects with an error object containing details if the operation fails.
     */
    const removeOldResearch = () => {
        mConsole.m('IndexDB').m('removeOldResearch').log('Start');
        return new Promise((resolve, reject) => {
            let objStore = getObjectStore(DB_STORE_NAME_R, 'readwrite');
            let myIndex = objStore.index('timestamp');
            let keyRange = IDBKeyRange.upperBound(Date.now() - 86_400_000 * userSettings.expiration);
            let request = myIndex.openCursor(keyRange);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const request = cursor.delete();
                    request.onsuccess = () => {
                        mConsole.m('IndexDB').m('removeOldResearch').log(cursor.value);
                    };
                    cursor.continue();
                } else {
                    mConsole.m('IndexDB').m('removeOldResearch').log("The Search's cache was cleared from old values");
                    resolve([]);
                }
            };
            request.onerror = (e) => {
                mConsole.m('IndexDB').m('removeOldResearch').error("Something bad happened with the Search's cache");
                reject({ error: e.target.error });
            };
        });
    };

    /**
     * Sets the Tagify whitelist based on retrieved bookmarks.
     *
     * This function fetches bookmarks, filters them to exclude existing Tagify values,
     * and updates the Tagify whitelist with the remaining bookmarks.
     *
     * @returns {Promise<void>} A Promise that resolves when the Tagify whitelist is updated,
     *                          or rejects if an error occurs during bookmark retrieval.
     */
    const setTBookmarks = async () => {
        // Use await for not trigger add event of Tagify
        try {
            let tBookmarks = await getBookmarks();
            // TODO coreggere funzione di compare
            const isSameTag = (a, b) => a.key === b.key && a.value === b.value;
            const onlyInLeft = (left, right, compareFunction) => left.filter((leftValue) => !right.some((rightValue) => compareFunction(leftValue, rightValue)));
            let filtered = onlyInLeft(tBookmarks, tagify.value, isSameTag);
            if (userSettings.debugConsole) mConsole.m('Set Tagify whitelist').debug(filtered);
            tagify.whitelist = filtered;
        } catch (error) {
            mConsole.m('Set Tagify whitelist').error('Error on retive bookmarks', error);
        }
    };

    /**
     * Adds a bookmark entry to the indexedDB database.
     *
     * This function attempts to add a new bookmark entry with the provided input (`bmInput`).
     * If an entry with the same key (`DB_STORE_NAME_B`) already exists, it updates the existing entry
     * with the new `fav` value and timestamp.
     *
     * @param {array} bmInput - The value to be stored as the bookmark.
     * @returns {Promise<undefined>} A Promise that resolves (undefined) upon successful addition or update,
     *                                or rejects with an error message if something goes wrong with the transaction.
     */
    const addBookmarks = async (bmInput) => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmarks').debug('shInput:', bmInput);

        let objStore = getObjectStore(DB_STORE_NAME_B, 'readwrite');
        let openRequest = objStore.openCursor(DB_STORE_NAME_B);

        let obj = { bookmarks: DB_STORE_NAME_B, fav: bmInput, timestamp: Date.now() };

        openRequest.onsuccess = (e) => {
            let cursor = openRequest.result;
            if (cursor) {
                // Update entry if key exists and is expired
                cursor.update(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmarks').debug('Updated', bmInput);
            } else {
                // Otherwise, add entry
                objStore.add(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmarks').debug('Added', bmInput);
            }
        };
        openRequest.onerror = (e) => {
            mConsole.m('IndexDB').m('addBookmarks').error('Something bad happened with the Research:', bmInput, ':', e.target.error);
        };
    };

    /**
     * Adds a single bookmark entry to the indexedDB database.
     *
     * This function attempts to add a new bookmark entry with the provided input (`bmInput`).
     * If an entry with the same key (`DB_STORE_NAME_B`) already exists, it updates the existing entry
     * with a new array containing the previous bookmarks and the new `bmInput`.
     *
     * @param {string} bmInput - The value to be added as a bookmark.
     * @returns {Promise<undefined>} A Promise that resolves (undefined) upon successful addition or update,
     *                                or rejects with an error message if something goes wrong with the transaction.
     */
    const addBookmark = async (bmInput) => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmark').debug('shInput:', bmInput);

        let temp = await getBookmarks();
        temp.push(bmInput);

        let objStore = getObjectStore(DB_STORE_NAME_B, 'readwrite');
        let openRequest = objStore.openCursor(DB_STORE_NAME_B);

        let obj = { bookmarks: DB_STORE_NAME_B, fav: temp, timestamp: Date.now() };

        openRequest.onsuccess = (e) => {
            let cursor = openRequest.result;
            if (cursor) {
                // Update entry if key exists and is expired
                cursor.update(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmark').debug('Updated', bmInput);
            } else {
                // Otherwise, add entry
                objStore.add(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('addBookmark').debug('Added', bmInput);
            }
        };
        openRequest.onerror = (e) => {
            mConsole.m('IndexDB').m('addBookmark').error('Something bad happened with the Research:', bmInput, ':', e.target.error);
        };
    };

    /**
     * Removes a bookmark entry from the indexedDB database based on its unique key.
     *
     * This function retrieves all bookmarks, filters them to exclude the entry with the matching key provided in `bmInput.key`,
     * and updates the 'bookmarks' object store with the remaining bookmarks.
     *
     * @param {object} bmInput - An object containing a `key` property that uniquely identifies the bookmark to remove.
     * @returns {Promise<undefined>} A Promise that resolves (undefined) upon successful removal or update,
     *                                or rejects with an error message if something goes wrong with the transaction.
     */
    const removeBookmark = async (bmInput) => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('removeBookmark').debug('shInput:', bmInput);

        let temp = await getBookmarks();

        temp = temp.filter((x) => x.key !== bmInput.key);

        let objStore = getObjectStore(DB_STORE_NAME_B, 'readwrite');
        let openRequest = objStore.openCursor(DB_STORE_NAME_B);

        let obj = { bookmarks: DB_STORE_NAME_B, fav: temp, timestamp: Date.now() };

        openRequest.onsuccess = (e) => {
            let cursor = openRequest.result;
            if (cursor) {
                // Update entry if key exists and is expired
                cursor.update(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('removeBookmark').debug('Updated', bmInput);
            } else {
                // Otherwise, add entry
                objStore.add(obj);
                if (userSettings.debugConsole) mConsole.m('IndexDB').m('removeBookmark').debug('Added', bmInput);
            }
        };
        openRequest.onerror = (e) => {
            mConsole.m('IndexDB').m('removeBookmark').error('Something bad happened with the Research:', bmInput, ':', e.target.error);
        };
    };

    /**
     * Retrieves bookmark entries from the indexedDB database.
     *
     * This function retrieves the bookmark data associated with the key (`DB_STORE_NAME_B`)
     * from the 'bookmarks' object store. It resolves with an empty array (`[]`) if no record is found.
     *
     * @returns {Promise<any[]>} A Promise that resolves with the retrieved bookmark data as an array,
     *                          or resolves with an empty array (`[]`) if no record is found.
     *                          Rejects with an error object containing details if the operation fails.
     */
    const getBookmarks = () => {
        if (userSettings.debugConsole) mConsole.m('IndexDB').m('getBookmarks').debug('Entered');
        return new Promise((resolve, reject) => {
            let objStore = getObjectStore(DB_STORE_NAME_B, 'readonly');
            let request = objStore.get(DB_STORE_NAME_B);
            request.onsuccess = (e) => {
                if (typeof e.target.result !== 'undefined') {
                    if (userSettings.debugConsole) mConsole.m('IndexDB').m('getBookmarks').debug('Bookmarks found:', e.target.result.fav);
                    resolve(e.target.result.fav);
                } else {
                    if (userSettings.debugConsole) mConsole.m('IndexDB').m('getBookmarks').debug('No matching record found');
                    resolve([]);
                }
            };
            request.onerror = (e) => {
                mConsole.m('IndexDB').m('getBookmarks').error('Something bad happened with the Bookmarks', e.target.error);
                reject({ error: e.target.error });
            };
        });
    };

    //#endregion

    //#region Tagify Events

    /**
     * Determines the qualifier type based on the input string.
     *
     * This function analyzes the provided input string and returns a corresponding qualifier type based on the string's prefix.
     *
     * @param {string} strInput - The input string to be analyzed.
     * @returns {string|undefined} The determined qualifier type (e.g., 'tag', 'weak', 'title', etc.), or undefined if no match is found.
     */
    const analyzerQualifier = (strInput) => {
        let text = strInput.replace(/["\']/g, '');
        if (text.match(/^(tg|tag).*:/i)) {
            return 'tag';
            // substring
        } else if (text.match(/^(wk|we).*:/i)) {
            return 'weak';
            // substring
        } else if (text.match(/^(tt|ti).*:/i)) {
            return 'title';
        } else if (text.match(/^(upd).*:/i)) {
            return 'uploaduid';
        } else if (text.match(/^(up).*:/i)) {
            return 'uploader';
        } else if (text.match(/^(gd|gi).*:/i)) {
            return 'gid';
        } else if (text.match(/^(cm).*:/i)) {
            return 'comment';
        } else if (text.match(/^(fv|fav).*:/i)) {
            return 'favnote';
        }
    };

    const populatelist = async (detail, tagifybar = tagify) => {
        tagifybar.whitelist = null; // Reset the whitelist

        let tagElm = detail.tag;
        //  Take newValue if data defined (when edit) | If undefined take value
        let value = detail.data !== undefined ? detail.data.newValue : detail.value;
        if (userSettings.debugConsole) mConsole.m('Populate').debug('Raw input: ', value);

        let state = null;
        // Analyze the key if has 'Exclusion' or 'Or' prefix
        // If has it change the state and remove it for the search
        switch (value.charAt(0)) {
            case '-':
                state = -1;
                value = value.slice(1);
                break;
            case '~':
                state = 1;
                value = value.slice(1);
                break;
        }

        /**
         * Analyze for Qualifiers "tag:" / "weak:" / "title:" / "uploader:" / "uploaduid:" / "gid:" / "comment:" / "favnote:"
         * Qualifiers:
         * - tag:
         *      when elem is selected from the dropdown need to remove the middle part
         *      e.g. tag:namespace:text_of_the_tag => tag:text_of_the_tag
         * - weak:
         *      depends from user,
         *      it can be either weak:f:rimjob$ OR e.g. weak:rimjob$
         * - title / uploader / uploaduid / gid / comment / favnote
         *      need to disable the server request
         *      Autocomplete are only for parameter
         */
        let query = true,
            generic = null;

        let qualifiers = analyzerQualifier(value) ?? null;
        switch (qualifiers) {
            case 'tag':
                generic = true;
            case 'weak':
                value = value.substring(value.indexOf(':') + 1);
                break;
            case 'title':
            case 'uploaduid':
            case 'uploader':
            case 'gid':
            case 'comment':
            case 'favnote':
                query = false;
                break;
        }

        if (!query) return;

        let pre_elab_replace, cache, whitelist, bookmarks;

        // Replace taggrups
        try {
            pre_elab_replace = replaceTagGroups(value);
            if (qualifiers == 'weak' && pre_elab_replace == value) generic = true;
        } catch (reason) {
            if (userSettings.debugConsole) mConsole.m('Populate').debug('Pre-elab failed. Reasion: ', reason.reason, 'Input:', reason.input);
            return;
        }

        // show the loader animation
        tagElm ? tagifybar.tagLoading(tagElm, true) : tagifybar.loading(true);

        // Timeout for typing request
        clearTimeout(typingDebounce); // Abort last request
        typingDebounce = setTimeout(async () => {
            // Try to Get Research froma cache
            try {
                cache = await getResearch(pre_elab_replace);
                mConsole.m('Populate').m('getResearch').debug('Trovato', cache);
            } catch (reason) {
                mConsole.m('Populate').m('getResearch').debug('Non trovato', reason);
                return;
            }

            // try to get Get Bookmarks
            try {
                bookmarks = await getBookmarks();
            } catch (reason) {
                mConsole.m('Populate').m('getBookmarks').error('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
                return;
            }

            if (Array.isArray(cache) && !cache.length) {
                /**
                 * No result in the cache or the result is expired
                 * Try to make a new request to the server
                 */
                let result_API_new;
                try {
                    result_API_new = await makeXMLRequest(api_url, 'POST', JSON.stringify({ method: 'tagsuggest', text: pre_elab_replace }));
                    mConsole.m('Populate').m('makeXMLRequest').log(result_API_new);
                } catch (reason) {
                    mConsole.m('Populate').error('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
                    return;
                }

                whitelist = JSON.parse(result_API_new.responseText);
                let p = new RegExp('(^| |:)' + pre_elab_replace, 'ig');
                whitelist = Object.values(whitelist.tags).map((key) => {
                    return {
                        key: key.tn.indexOf(' ') != -1 ? key.ns + ':"' + key.tn + '$"' : key.ns + ':' + key.tn + '$',
                        value: key.ns + ':' + key.tn,
                        ...(!userSettings.editableTag && { editable: false }),
                        highlights: (key.ns + ':' + key.tn).match(p) ? (key.ns + ':' + key.tn).replace(p, '<strong>$&</strong>') : key.ns + ':' + key.tn,
                        ...(state && { state: state }),
                        ...(qualifiers && { qualifiers: qualifiers }),
                        ...(generic && { generic: generic }),
                    };
                });

                // Don't store the state, editable & qualifiers
                const newArray = whitelist.map(({ editable, state, qualifiers, generic, ...keepAttrs }) => keepAttrs);
                addResearch(pre_elab_replace, newArray);

                whitelist = addBookmarkState(bookmarks, whitelist);
                mConsole.m('Populate').m('Response').m('Api').log(...whitelist);
            } else {
                // Add state & editable & qualifiers & feneric that not stored
                cache = cache.map((elm) => ({ ...elm, ...(!userSettings.editableTag && { editable: false }), ...(state && { state: state }), ...(qualifiers && { qualifiers: qualifiers }), ...(generic && { generic: generic }) }));
                whitelist = addBookmarkState(bookmarks, cache);
                mConsole.m('Populate').m('Response').m('Cached').log(...whitelist);
            }

            tagifybar.whitelist.push(...whitelist);
            // Render the suggestions dropdown.
            tagElm ? tagifybar.tagLoading(tagElm, false).dropdown.show(pre_elab_replace.split(':')[1] ?? pre_elab_replace) : tagifybar.loading(false).dropdown.show(pre_elab_replace.split(':')[1] ?? pre_elab_replace);

        }, 350);
    };

    /**
     * Adds a bookmark state property to each element in an array based on a bookmarks array.
     *
     * This function iterates through an array of `apiResponse` elements and adds a `bookmarks` property to each element.
     * The `bookmarks` property is set to `true` if a matching element is found in the `bookmarks` array, otherwise it's omitted.
     
     * @param {Array} bookmarks - An array of bookmark objects, each with a `key` and `state` property.
     * @param {Array} apiResponse - An array of objects (Api/Cache result) to which the `bookmarks` property will be added.
     * @returns {Array} A new array with the same elements as `apiResponse`, but with an additional `bookmarks` property if applicable.
     */
    const addBookmarkState = (bookmarks, apiResponse) => {
        let output = [];
        apiResponse.forEach((resEl) => {
            let valueTime = bookmarks.find((bkmEl) => bkmEl.key === (resEl.generic ? resEl.qualifiers + ':' + resEl.key.substring(resEl.key.indexOf(':') + 1) : resEl.qualifiers ? resEl.qualifiers + ':' + resEl.key : resEl.key) && bkmEl.state === resEl.state);
            if (valueTime) {
                output.push({ ...resEl, bookmarks: true });
            } else {
                output.push({ ...resEl });
            }
        });
        return output;
    };

    const onAddTag = (e) => {
        if (userSettings.debugConsole) mConsole.m('Tag Add').debug(e.detail.data);
        tagify.whitelist = null;

        setTBookmarks();

        // If taping fast and add a tag need to abort the request
        // remove the dropdown end remove the loading symble
        clearTimeout(typingDebounce);
        tagify.dropdown.hide();
        tagify.loading(false);
    };

    const onRemoveTag = (e) => {
        if (userSettings.debugConsole) mConsole.m('Tag Remove').debug(e.detail.data);
    };

    const onDropdownSelect = (e) => {
        if (userSettings.debugConsole) mConsole.m('Dropdown Select').debug(e);
    };

    const onKeyDown = (e) => {
        if (userSettings.debugConsole) mConsole.m('Key Down').debug(e.type, e.detail);
        if (
            e.detail.event.keyCode == 13 &&
            !tagify.state.inputText && // assuming user is not in the middle oy adding a tag
            !tagify.state.editing && // user not editing a tag
            !tagify.state.ddItemElm // there is no dropdown item active
        ) {
            e.preventDefault();
            let selector = '#searchbox > form';
            if (location.pathname == '/favorites.php') {
                selector = 'body > div.ido > div:nth-child(3) > form';
            }
            $(selector).submit();
        }
        if (e.detail.event.ctrlKey && e.detail.event.keyCode == 66) {
            // ctrl + B
            bookmarksEvent();
        }
    };

    const tagAnalyzer = (tagData, oldtagData) => {
        if (userSettings.debugConsole) mConsole.m('Tag-Analyzer').debug(tagData, oldtagData);
        // Analize the tag before add it to the tagbar

        // Analyze the key if has 'Exclusion' or 'Or' prefix
        // If the prefix exist remove it from value
        switch (tagData.value.charAt(0)) {
            case '-':
                tagData.state = -1;
                tagData.value = tagData.value.slice(1);
                break;
            case '~':
                tagData.state = 1;
                tagData.value = tagData.value.slice(1);
                break;
        }

        // Prepare the prefix for the key
        let prefix = tagData.state || 0 ? (tagData.state > 0 ? `~` : `-`) : '';

        /**
         * If qualifiers is not defined or
         * If i'm editing re-ceck the qualifiers
         * (I can edit the qualifiers)
         */
        if (tagData.qualifiers === null || tagData.qualifiers === undefined || tagify.state.editing) {
            // If the new analisis is undefined is a edit without modifying the qualifier so take tagData.qualifiers, is neither set to null
            tagData.qualifiers = analyzerQualifier(tagData.value) ?? tagData.qualifiers ?? null;
            switch (tagData.qualifiers) {
                case 'tag':
                case 'weak':
                    if (tagData.key !== undefined) tagData.key = tagData.key.substring(tagData.key.indexOf(':') + 1); // Remove the posible qualifier
                case 'title':
                case 'uploaduid':
                case 'uploader':
                case 'gid':
                case 'comment':
                case 'favnote':
                    tagData.value = tagData.value.substring(tagData.value.indexOf(':') + 1); // Remove the posible qualifier
                    break;
            }
        }

        // Ceck the category if edited it can be shortered
        if (tagify.state.editing) {
            try {
                tagData.value = replaceTagGroups(tagData.value);
            } catch (reason) {
                if (userSettings.debugConsole) mConsole.m('Tag-Analyzer').debug('Pre-elab failed. Reasion: ', reason.reason, 'Input:', reason.imput_string);
                return;
            }
        }

        if (tagData.generic) {
            tagData.key = tagData.key.substring(tagData.key.indexOf(':') + 1);
            tagData.value = tagData.value.substring(tagData.value.indexOf(':') + 1);
        }

        /**
         * Note: oldtagData is defined only when editing & the new walue is a plain text (Not a dropdown select)
         * If the key is undefined => Happen only when plaintext is added
         *      tagData.key = prefix + tagData.value
         * If I'm editing AND oldtagData not undefined I need to update the key with the new value inserted
         *      tagData.key = prefix + tagData.value
         * If I'm not editing AND the key is defined
         *      tagData.key = prefix + tagData.key
         */
        // Compact logic
        let t1, t2;
        t1 = t2 = tagData.qualifiers !== null ? tagData.qualifiers + ':' + tagData.value : tagData.value;
        if (!((tagify.state.editing && oldtagData !== undefined) || tagData.key === undefined)) {
            t2 = tagData.qualifiers !== null ? tagData.qualifiers + ':' + tagData.key : tagData.key;
        }
        tagData.value = t1;
        tagData.key = (!(t2.charAt(0) == '~' || t2.charAt(0) == '-') ? prefix : '') + t2;

        // set bakground color by category
        let category = tagData.value.split(':')[0];
        switch (category) {
            case 'female':
                tagData.style = '--tag-bg:' + tagStyle.female;
                tagData.class = 'tac_female';
                break;
            case 'male':
                tagData.style = '--tag-bg:' + tagStyle.male;
                tagData.class = 'tac_male';
                break;
            case 'language':
                tagData.style = '--tag-bg:' + tagStyle.language;
                tagData.class = 'tac_language';
                break;
            case 'cosplayer':
                tagData.style = '--tag-bg:' + tagStyle.cosplayer;
                tagData.class = 'tac_cosplayer';
                break;
            case 'parody':
                tagData.style = '--tag-bg:' + tagStyle.parody;
                tagData.class = 'tac_parody';
                break;
            case 'character':
                tagData.style = '--tag-bg:' + tagStyle.character;
                tagData.class = 'tac_character';
                break;
            case 'group':
                tagData.style = '--tag-bg:' + tagStyle.group;
                tagData.class = 'tac_group';
                break;
            case 'artist':
                tagData.style = '--tag-bg:' + tagStyle.artist;
                tagData.class = 'tac_artiste';
                break;
            case 'mixed':
                tagData.style = '--tag-bg:' + tagStyle.mixed;
                tagData.class = 'tac_mixed';
                break;
            case 'other':
                tagData.style = '--tag-bg:' + tagStyle.other;
                tagData.class = 'tac_other';
                break;
            case 'reclass':
                tagData.style = '--tag-bg:' + tagStyle.reclass;
                tagData.class = 'tac_reclass';
                break;
            case 'temp':
                tagData.style = '--tag-bg:' + tagStyle.temp;
                tagData.class = 'tac_temp';
                break;
            case 'tag':
                tagData.style = '--tag-bg:' + tagStyle.tag1 + '; --tag-bg2:' + tagStyle.tag2;
                tagData.class = 'tac_tag';
                // tagData.style = '--tag-bg:linear-gradient(135deg, ' + sadpanda.female + ' 0%, ' + sadpanda.male + ' 100%);'
                break;
            case 'weak':
                tagData.style = '--tag-bg:' + tagStyle.tag2 + '; --tag-bg2:' + tagStyle.tag1;
                tagData.class = 'tac_tag';
                // tagData.style = '--tag-bg:linear-gradient(135deg, ' + sadpanda.female + ' 0%, ' + sadpanda.male + ' 100%);'
                break;
            default:
                tagData.style = '--tag-bg:' + tagStyle.default;
                tagData.class = 'tac_default';
                break;
        }
        if (userSettings.debugConsole) mConsole.m('Tag-Analyzer2').debug(tagData, oldtagData);
    };

    const onInput = (e) => {
        if (userSettings.debugConsole) mConsole.m('Input').debug(e.detail);
        populatelist(e.detail);
        if (userSettings.debugConsole) mConsole.m('Input2').debug(e.detail);
    };

    const onChange = (e) => {
        // outputs a String
        if (userSettings.debugConsole) mConsole.m('Change').debug(e.detail);
        let text = '';
        if (e.detail.value) {
            let list = JSON.parse(e.detail.value);
            // list = list.map(x => x.key ? x.key : `${x.value}`); // extract key is exist otherwise value
            list = list.map((x) => x.key); // extract key
            text = list.join(' ');
        }
        $('[name="f_search"]')[0].value = text;
        setTBookmarks();
    };

    const onEditStart = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Start').debug(e.detail);
        const { tag: tagElm, data: tagData } = e.detail;
        // Need the prefix during the edit
        let prefix = '';
        switch (tagData.state || 0) {
            case -1:
                prefix = '-';
                break;
            case 1:
                prefix = '~';
                break;
        }
        // Set the editing text the value not the key
        tagify.setTagTextNode(tagElm, `${prefix}${tagData.value}`);
    };

    const onEditInput = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Input').debug(e.detail);
        populatelist(e.detail);
    };

    const onEditKeyDown = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Key Down').debug(e.detail);
        if (e.detail.event.ctrlKey && e.detail.event.keyCode == 66) {
            // ctrl + B
            bookmarksEvent();
        }
    };

    const onEditbeforeUpdate = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Before Update').debug(e.detail);
        // Manualy call transformTag
        // tagify.settings.transformTag.call(tagify, e.detail.data, e.detail.previousData)
    };

    const onEditUpdated = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Updated').debug(e.detail);
    };

    const onClick = (e) => {
        // Switch between Normal -> Exclusion -> Or tags
        const { tag: tagElm, data: tagData } = e.detail;
        // If editing don't interrupt the edit
        if (tagify.state.editing) return;
        // Delay needed to distinguish between regular click and double-click.
        // This allows enough time for a possible double-click, and noly fires if such
        // did not occur.
        clearTimeout(clickDebounce);
        clickDebounce = setTimeout(() => {
            switch (tagData.state || 0) {
                case -1:
                    tagData.state = 1;
                    tagData.key = tagData.key.slice(1);
                    tagData.key = '~' + tagData.key;
                    mConsole.m('click').debug('Transform to Or');
                    break;
                case 0:
                    tagData.state = -1;
                    tagData.key = '-' + tagData.key;
                    mConsole.m('click').debug('Transform to Exclusion');
                    break;
                case 1:
                    tagData.state = 0;
                    tagData.key = tagData.key.slice(1);
                    mConsole.m('click').debug('Transform to Normal');
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
    let tagStyle = {}; // For the current tag style
    let CSSxSite = null;

    // Print site details
    mConsole.log('Site api: ', location.hostname);
    mConsole.log('Location: ', location.pathname);

    if (location.hostname == 'e-hentai.org') {
        api_url = 'https://api.e-hentai.org/api.php';
        tagStyle = userSettings.style.base;
        CSSxSite = `
        @charset "UTF-8";
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
        tagStyle = userSettings.style.exhentai;
        CSSxSite = `
        @charset "UTF-8";
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

    // #region Elements Creations

    // Create base container
    var container = document.createElement('DIV');
    container.setAttribute('class', 'tagcomplete');
    container.setAttribute('id', 'c_aut_comp');
    container.style.position = 'relative';

    // Create input text
    // var tag_bar = document.createElement("input");
    // tag_bar.setAttribute("type", "text");
    var tag_bar = document.createElement('textarea');
    tag_bar.setAttribute('id', 'tag_auto_bar');
    tag_bar.style.display = userSettings.debugText ? 'block' : 'none';
    userSettings.urlParameter ? tag_bar.setAttribute('name', 'tag_name_bar') : ''; // Remove this for disable the URL param
    tag_bar.setAttribute('placeholder', 'Insert tags ');
    tag_bar.setAttribute('autofocus', '');

    // Create settings container
    var settings = document.createElement('DIV');
    settings.setAttribute('class', 'settings');
    settings.onclick = (e) => {
        open_settinga();
    };

    // Create svg icon
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconSvg.setAttribute('viewBox', '0 -960 960 960');
    iconSvg.setAttribute('height', '24');
    iconSvg.setAttribute('width', '24');
    // prettier-ignore
    iconPath.setAttribute('d', 'm370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z');
    iconSvg.appendChild(iconPath);

    settings.appendChild(iconSvg); // append SVG icon inside settings

    container.appendChild(tag_bar); // Append tab_ga inside container

    container.appendChild(settings); // Append settings inside container

    // #endregion

    let selector = location.pathname == '/favorites.php' ? 'body > div.ido > div:nth-child(3) > form > div' : '#searchbox > form > div:nth-child(3)';

    mConsole.log('Preload complete. Waintg for website...');
    if (userSettings.debugConsole) console.timeLog('[Tags Auto Complete]: Inject time', 'Waintg for website...');
    // Wait the element before assembly all the things
    await waitForElement(selector);
    mConsole.log('Website loded');

    if (userSettings.debugConsole) console.timeLog('[Tags Auto Complete]: Inject time', 'Website loded');

    // Append all the style at the head
    getResourceText('TagifyCSS', addStyle);
    addStyle(CSSxSite);

    // Hide the original search bar
    userSettings.originalBar ? '' : $(selector).attr('style', 'display:none;');

    // Append
    $(selector).after(container);

    // Clone and append button "Clear Filter"
    $(selector.concat(' > input[type=button]:nth-child(3)')).clone().insertAfter('#c_aut_comp');
    // Clone and append button "Apply Filter"
    $(selector.concat(' > input[type=submit]:nth-child(2)')).clone().insertAfter('#c_aut_comp');

    // Create tagify bar
    var tagify = new Tagify(tag_bar, {
        transformTag: tagAnalyzer,
        delimiters: null,
        // originalInputValueFormat: valuesArr => JSON.stringify(valuesArr.map((item) => { return { key: item.key, value: item.value, editable: item.editable, ...(item.state != 0) && { state: item.state } }; })),
        // prettier-ignore
        originalInputValueFormat: (valuesArr) => JSON.stringify(valuesArr.map((item) => { return { key: item.key, value: item.value, editable: item.editable }; })),
        editTags: { keepInvalid: false },
        dropdown: {
            enabled: 0, // Suggest tags when clicked for bookmarks
            maxItems: 25, // For Bookmarks limit to the first 25
            // classname: 'extra-properties', // custom class for the suggestions dropdown
            includeSelectedTags: true, // Useful while edit tag
            position: userSettings.dropdownPosition,
            highlightFirst: false, // false otherwise can't insert normal text
        },
        templates: {
            tag(tagData) {
                return `<tag title='${tagData.key || tagData.value}' contenteditable='false' spellcheck="false" class='${this.settings.classNames.tag} ${tagData.class || ''}' ${this.getAttributes(tagData)}>
                        <x title='' class='${this.settings.classNames.tagX}' role='button' aria-label='remove tag'></x>
                        <div>                           
                            <span class='${this.settings.classNames.tagText}'>${tagData.value}</span>
                        </div>
                    </tag>`;
            },
            dropdownItem(item) {
                return `<div ${this.getAttributes(item)} class='${this.settings.classNames.dropdownItem} ${item.class || ''}' tabindex="0" role="option">
                    <x title='' class='bookmarks' role='button' aria-label='bookmarks'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="19" viewBox="0 0 560 720">
                            <rect width="450" height="580" x="50" y="20" ${item.bookmarks ? 'style="fill: var(--tagify-dd-color-primary);"' : 'style="fill: none;'}" />
                            <path d="M 0 720 v -640 q 0 -33 23.5 -56.5 T 80 0 h 400 q 33 0 56.5 23.5 T 560 80 v 640 L 280 600 L 0 720 Z m 80 -122 l 200 -86 l 200 86 v -518 H 80 v 518 Z M 280 360 Z" style="fill: var(--tagify-dd-color-primary);"/>
                        </svg>
                    </x>
                        <span class='middle'>${item.qualifiers != undefined && item.qualifiers != 'null' ? item.qualifiers + ' ' : ''}${item.highlights ?? item.value}</span>
                    </div>`;
            },
            dropdownItemNoMatch(data) {
                return userSettings.showNoMatch
                    ? `<div class='${tagify.settings.classNames.dropdownItem}' value="noMatch" tabindex="0" role="option">
                    No tag found for: <strong>${data.value}</strong>
                </div>`
                    : '';
            },
        },
        hooks: {
            suggestionClick(e) {
                let isAction = e.target.classList !== undefined ? e.target.classList.contains('bookmarks') || e.target.closest('.bookmarks') : false;
                return new Promise((resolve, reject) => {
                    if (isAction) {
                        bookmarksEvent();
                        reject();
                    }
                    resolve();
                });
            },
        },
    });

    await openDb();
    setTBookmarks();

    /**
     * regexp match for f_search:
     * G1 - taggroup:"tag with space$"
     * G2 - taggroup:tag$
     * G3 - "tag with space$"
     * G3 - tagwithoutspace$
     * G4 - "some specific term to search"
     * G5 - various tag that will be matched separately
     */
    // Get current search value
    const urlParams = new URLSearchParams(window.location.search);
    let old_input = urlParams.get('tag_name_bar');
    old_input = JSON.parse(old_input == '' ? null : old_input);
    if (old_input == null) {
        // old_input = $('[name="f_search"]')[0].value.match(/([~-]?\w+:\"[^\$\"]+\$\")|([~-]?\w+:[^\$\" ]+\$)|([~-]?\"?[\w\s.-]+\$\"?)|([~-]?\"[^\"]+\")|([^\"\$ \n]+)/g);
        old_input = $('[name="f_search"]')[0].value.match(/([~-]?(?:\w+:){1,2}\"[^\$\"]+\$\")|([~-]?(?:\w+:){1,2}[^\$\" ]+\$)|([~-]?\"?[\w\s.-]+\$\"?)|([~-]?\"[^\"]+\")|([^\"\$ \n]+)/g);
        if (old_input) {
            old_input = old_input.map((item, index) => {
                return {
                    key: item.trimStart(),
                    value: item.match(/^.*:.*$/g) ? item.replace(/["\'\$]/g, '') : item.replace(/[\'\$]/g, ''), // Don't remove " if a specific request
                    ...(!userSettings.editableTag && { editable: item.match(/^.*:.*$/g) ? false : true }),
                };
            });
        }
    }

    tagify.addTags(old_input);

    // Set event listeners
    tagify
        .on('add', onAddTag)
        .on('remove', onRemoveTag)
        .on('input', onInput)
        .on('dropdown:select', onDropdownSelect)
        .on('change', onChange)
        .on('keydown', onKeyDown)
        .on('click', onClick)
        .on('dblclick', ondblClick)
        .on('edit:start', onEditStart)
        .on('edit:keydown', onEditKeyDown)
        .on('edit:input', onEditInput)
        .on('edit:beforeUpdate', onEditbeforeUpdate)
        .on('edit:updated', onEditUpdated)
        .on('dropdown:show', (e) => {
            mConsole.m('dropdown:show').log(e, tagify.whitelist);
        })
        .on('focus', (e) => {
            mConsole.m('focus').log(e);
        });

    // Add possibility to Remove tag with Middle Click
    // prettier-ignore
    middleclickChecker(container, ".tagify__tag", tagify);

    mConsole.log('Ended Injection');
    if (userSettings.debugConsole) console.timeEnd('[Tags Auto Complete]: Inject time', 'Website loded');

    // Your code here...
})();

if (userSettings.debugConsole) console.timeEnd('[Tags Auto Complete]: Loading time');
