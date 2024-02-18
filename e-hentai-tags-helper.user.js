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
// @include     /https?:\/\/e(-|x)hentai\.org\/(uploader\/.*|watched.*|tag\/.*|\?f_search.*|\?f_cats.*|doujinshi.*|manga.*|artistcg.*|gamecg.*|western.*|non-h.*|imageset.*|cosplay.*|asianporn.*|misc.*|\?tag_name_bar.*|\?f_shash.*|\?next.*|\?prev.*|favorites\.php.*)/
// @require https://code.jquery.com/jquery-3.7.1.min.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/library/jQuery.tagify.min.js
// @resource    TagifyCSS https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/resource/tagify.css
// @run-at document-start

// @grant   GM_getResourceText
// @grant   GM.getResourceUrl

// ==/UserScript==

// Object that contain the default settings
const defaultSettings = {
    debugConsole: true, // True => Print on console all the events
    originalBar: false, // True => Show the original search bar
    debugText: false, // True => Show the Tagify Text Area
    editableTag: false, // True => All tag are editable
    showNoMatch: false, // True => Enable the footer "No tag Found for: xxxxx"
    urlParameter: false, // True => Enale the this pluggin url parameter
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

    let open_settinga = async () => {
        var container = $(`
        <div class="tac-overlay">
            <div class="tac-settings">
                <nav id="tac-topNav">
                    <span id="tac-home" style="float: left; border: none; padding: 0 0 0 15px;">Tags auto complete settings</span>
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
                            <span>: Print on the console all the event. For debug purpose</span>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" class="tacCheck" id="originalBar" ${userSettings.originalBar ? 'checked' : ''}>Original Search Bar
                            </label>
                            <span>: Show the Original search bar</span>
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
                        <span>: Use this pluggin url parameter</span>
                        </div>
                        <br>
                        <div>
                            <p>Position of the suggestion list:</p>
                            <input type="radio" id="all" name="drdpos" class="tacRadio" value="all" ${userSettings.dropdownPosition == 'all' ? 'checked' : ''}>
                            <label for="all">Under the shearch bar</label>
                            <input type="radio" id="input" name="drdpos" class="tacRadio" value="input" ${userSettings.dropdownPosition == 'input' ? 'checked' : ''}>
                            <label for="input">Next to input</label>
                            <input type="radio" id="text" name="drdpos" class="tacRadio" value="text" ${userSettings.dropdownPosition == 'text' ? 'checked' : ''}>
                            <label for="text">Next to text</label>
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
        $('body').append(container);
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
            tagStyle.default = $('#tcpdefault').val();
            // Save the new settings
            localStorage.setItem('tac-settings', JSON.stringify(userSettings));

            // Applay userSettings without reload
            document.querySelector(selector).style.display = userSettings.originalBar ? '' : 'none';
            tag_bar.style.display = userSettings.debugText ? 'block' : 'none';

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
            $('#tcpdefault').val(tagStyle.default).trigger('change');
        });
    };

    //#region Support funtion

    /**
     * Add the string (CSS) to the page <head>
     * @param {string} CSS - CSS to add to the page
     * @returns {string}
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
     * Return a Promise of the substitution
     * @param {string} imput_string
     * @returns {Promise}
     */
    const regex_replace = (imput_string) => {
        return new Promise(function (resolve, reject) {
            // ^(x|mix|mis|co|t|f|m|r|l|p|c|g|a|o).*:

            // Regexp take from /mytags page
            var text = imput_string.replace(/["\']/g, '');
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
            if (2 > text.replace(/^.*:/i, '').length) reject('Length < 2');
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
    const makeXMLRequest = (url, method = 'GET', body = null) => {
        clearTimeout(typingDebounce); // abort last request
        var request = new XMLHttpRequest();

        // Return it as a Promise
        return new Promise(function (resolve, reject) {
            typingDebounce = setTimeout(function () {
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
            }, 350);
        });
    };

    /**
     * Get the resource and handle it with the Callback
     * @param {string} resurce
     * @param {addStyle} callback
     */
    // prettier-ignore
    const getResourceText = async (resurce, callback) => {
        if (typeof GM_getResourceText !== 'undefined') {
            // Tampermonkey and Violentmonkey
            callback(GM_getResourceText(resurce));
        } else if (typeof GM.getResourceUrl !== 'undefined') {
            // Greasemonkey and Tampermonkey (If TM compatibility is on)
            GM.getResourceUrl(resurce).then((blobURL) => {
                makeXMLRequest(blobURL).then((result) => {
                    callback(result.responseText);
                }).catch((reason) => {
                    mConsole.m('getResource').error('Reasion: ', reason);
                });
            }).catch((reason) => {
                mConsole.m('getResource').error('Reasion: ', reason);
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

    const populatelist = (value, tagElm) => {
        tagify.whitelist = null; // Reset the whitelist

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
            tagElm ? tagify.tagLoading(tagElm, true) : tagify.loading(true);

            makeXMLRequest(api_url, 'POST', JSON.stringify({
                method: 'tagsuggest',
                text: pre_elab_result
            })).then((result) => {

                // Prepare the prefix for the key
                let prefix = state || 0 ? (state > 0 ? `~` : `-`) : '';

                result = JSON.parse(result.responseText);
                var p = new RegExp('(^| |:)' + pre_elab_result, 'ig');
                var a = Object.values(result.tags).map((key) => {
                    return {
                        key: key.tn.indexOf(' ') != -1 ? prefix + key.ns + ':"' + key.tn + '$"' : prefix + key.ns + ':' + key.tn + '$',
                        value: key.ns + ':' + key.tn,
                        ...(!userSettings.editableTag && { editable: false }),
                        highlights: (key.ns + ':' + key.tn).match(p) ? (key.ns + ':' + key.tn).replace(p, '<strong>$&</strong>') : key.ns + ':' + key.tn,
                        ...(state && { state: state }),
                    };
                });
                // replace tagify "whitelist" array values with new values
                // and add back the ones already choses as Tags
                tagify.settings.whitelist.push(...a, ...tagify.value);

                // Render the suggestions dropdown.
                // tagify.loading(false).dropdown.show.call(tagify, pre_elab_result);
                // tagify.loading(false).dropdown.show(); // BUG? If show has no param there is some case that the dropdown don't show
                // IF xx:tag => take only the tag
                // If xx:tag => undefined take pre_elab_result
                tagElm ? tagify.tagLoading(tagElm, false).dropdown.show(pre_elab_result.split(':')[1] ?? pre_elab_result) : tagify.loading(false).dropdown.show(pre_elab_result.split(':')[1] ?? pre_elab_result);
            })
                .catch((reason) => {
                    mConsole.m('Input').error('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
                });
        })
            .catch((reason) => {
                if (userSettings.debugConsole) mConsole.m('Input').debug('Pre-request elab failed. Reasion: ', reason);
            });
    };

    const onAddTag = (e) => {
        if (userSettings.debugConsole) mConsole.m('Tag Add').debug(e.detail.data);
        tagify.whitelist = null;
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
        if (userSettings.debugConsole) mConsole.m('Dropdown Select').debug(e.detail);
    };

    const onKeyDown = (e) => {
        if (
            e.detail.event.keyCode == 13 &&
            !tagify.state.inputText && // assuming user is not in the middle oy adding a tag
            !tagify.state.editing // user not editing a tag
        ) {
            e.preventDefault();
            var selector = '#searchbox > form';
            if (location.pathname == '/favorites.php') {
                selector = 'body > div.ido > div:nth-child(3) > form';
            }
            $(selector).submit();
        }
        if (userSettings.debugConsole) mConsole.m('Key Down').debug(e.type, e.detail);
    };

    const tagAnalyzer = (tagData, oldtagData) => {
        if (userSettings.debugConsole) mConsole.m('Tag-Analyzer').debug(tagData, oldtagData);
        // Analize the tag before add it to the tagbar

        // If key don't exist add it to tagData
        tagData.key = tagData.key ?? tagData.value;

        // If i'm editing a tag i need to update the key with the new value
        tagData.key = tagify.state.editing ? tagData.value : tagData.key;

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

        // set bakground color by category
        var category = tagData.value.split(':')[0];
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
            default:
                tagData.style = '--tag-bg:' + tagStyle.default;
                tagData.class = 'tac_default';
                break;
        }
    };

    const onInput = (e) => {
        if (userSettings.debugConsole) mConsole.m('Input').debug(e.detail);
        populatelist(e.detail.value);
    };

    const onChange = (e) => {
        // outputs a String
        if (userSettings.debugConsole) mConsole.m('Change').debug(e.detail);
        var text = '';
        if (e.detail.value) {
            var list = JSON.parse(e.detail.value);
            list = list.map((x) => x.key || x.value); // extract key is exist otherwise value
            text = list.join(' ');
        }
        $('[name="f_search"]')[0].value = text;
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
        populatelist(e.detail.data.newValue, e.detail.tag);
    };

    const onEditKeyDown = (e) => {
        if (userSettings.debugConsole) mConsole.m('edit:Key Down').debug(e.detail);

        // https://github.com/yairEO/tagify/blob/9d8b577860e961c40eb436629a35c5ad1fcbda9a/src/parts/dropdown.js#L389
        let selectedElm = tagify.DOM.dropdown.querySelector(tagify.settings.classNames.dropdownItemActiveSelector),
            selectedElmData = tagify.dropdown.getSuggestionDataByNode(selectedElm);

        switch (e.detail.event.code) {
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Down': // >IE11
            case 'Up': {
                // >IE11
                e.preventDefault();
                // get all the dwropdown item
                let dropdownItems = tagify.dropdown.getAllSuggestionsRefs();
                // ceck if si an upkey
                let actionUp = e.detail.event.code == 'ArrowUp' || e.detail.event.code == 'Up';
                if (selectedElm) {
                    selectedElm = tagify.dropdown.getNextOrPrevOption(selectedElm, !actionUp);
                }
                // if no element was found OR current item is not a "real" item, loop
                if (!selectedElm /*|| !selectedElm.matches(tagify.settings.classNames.dropdownItemSelector)*/) {
                    selectedElm = dropdownItems[actionUp ? dropdownItems.length - 1 : 0];
                }
                tagify.dropdown.highlightOption(selectedElm, true);
                break;
            }
            case 'Escape':
            case 'Esc': // IE11
                tagify.dropdown.hide();
                break;
            case 'Enter': {
                e.preventDefault();
                tagify.settings.hooks
                    .suggestionClick(e, { tagify: tagify, tagData: selectedElmData, suggestionElm: selectedElm })
                    .then(() => {
                        if (selectedElm) {
                            tagify.dropdown.selectOption(selectedElm);
                            // highlight next option
                            selectedElm = tagify.dropdown.getNextOrPrevOption(selectedElm, !actionUp);
                            tagify.dropdown.highlightOption(selectedElm);
                            return;
                        } else tagify.dropdown.hide();

                        if (tagify.settings.mode != 'mix') tagify.addTags(tagify.state.inputText.trim(), true);
                    })
                    .catch((err) => err);
                break;
            }
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
    let tagStyle = {}; // For the tag style
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

    // #region element creation

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
        editTags: {
            clicks: 2,
            keepInvalid: false,
        },
        dropdown: {
            enabled: 2, // suggest tags after a single character input
            position: userSettings.dropdownPosition,
            includeSelectedTags: true,
            // highlightFirst: true, // Don't otherwise can't insert normal text
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
                        <span>${item.highlights}</span>
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
    });

    /**
     * regexp match for f_search:
     * G1 - taggroup:tag$        
     * G1 - taggroup:"tag with space$"
     * G2 - "tag with space$"
     * G2 - tagwithoutspace$
     * G3 - "some specific term to search"
     * G4 - various tag that will be matched separately
     */
    // Get current search value
    const urlParams = new URLSearchParams(window.location.search);
    let old_input = urlParams.get('tag_name_bar');
    old_input = JSON.parse(old_input == '' ? null : old_input);
    if (old_input == null) {
        old_input = $('[name="f_search"]')[0].value.match(/([~-]?\w+:\"?[^\$\"]+\$\"?)|([~-]?\"?[\w\s.-]+\$\"?)|([~-]?\"[^\"]+\")|([^\"\$ \n]+)/g);
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
        .on('edit:updated', onEditUpdated);

    // Add possibility to Remove tag with Middle Click
    // prettier-ignore
    document.addEventListener('mousedown', (event1) => {
        // https://jsfiddle.net/KyleMit/1jr12rd3/
        // https://stackoverflow.com/questions/30880757/javascript-equivalent-to-on
        // Ceck for impossible problem 
        (event1.button == 1 && event1.buttons != 4) || (event1.button != 1 && event1.buttons == 4) ? mConsole.m('Middle Click').log('Something go wrong', 'button:', event1.button, 'buttons:', event1.buttons) : '';
        // Ceck if the button pressed is a middle click
        if (event1.button == 1) {
            // Ceck if mousedown is over a tagify__tag for prevent the scrolling
            let t = event1.target;
            while (t && t !== document) {
                if (t.matches('.tagify__tag')) {
                    mConsole.m('Mid Click').m('Down').log('Tag pressed:', t);
                    event1.preventDefault();
                    // addEventListener for ceck if the mouseup is over the same element
                    document.addEventListener('mouseup', (event2) => {
                        if (event1.target == event2.target) {
                            // Create custom event middleclick
                            mConsole.m('Mid Click').m('Up').log(event1, event2);
                            mConsole.m('Mid Click').m('Tag Remove').log(t);
                            tagify.removeTags(t);
                        }
                    }, { once: true });
                    break;
                }
                t = t.parentNode;
            }
        }
    });

    mConsole.log('Ended Injection');
    if (userSettings.debugConsole) console.timeEnd('[Tags Auto Complete]: Inject time', 'Website loded');

    // Your code here...
})();
if (userSettings.debugConsole) console.timeEnd('[Tags Auto Complete]: Loading time');
