// ==UserScript==
// @name        Tags Autocomplete Import Settings & Bookmarks
// @namespace   https://github.com/ciccabanana/e-hentai-helper-suite
// @homepageURL https://github.com/ciccabanana/e-hentai-helper-suite
// @version 0.1.0
// @author      ciccabanana
// @description Replace normal search bar with new one whit autocomplete of tags
// @icon        https://e-hentai.org/favicon.ico
// @supportURL  https://github.com/ciccabanana/e-hentai-helper-suite/issues
// @updateURL   https://github.com/ciccabanana/e-hentai-helper-suite/raw/develop/e-hentai-setting.user.js
// @match       *://e-hentai.org/
// @match       *://e-hentai.org/doujinshi*
// @match       *://e-hentai.org/manga*
// @match       *://e-hentai.org/artistcg*
// @match       *://e-hentai.org/gamecg*
// @match       *://e-hentai.org/western*
// @match       *://e-hentai.org/non-h*
// @match       *://e-hentai.org/imageset*
// @match       *://e-hentai.org/cosplay*
// @match       *://e-hentai.org/asianporn*
// @match       *://e-hentai.org/misc*
// @match       *://e-hentai.org/uploader/*
// @match       *://e-hentai.org/watched*
// @match       *://e-hentai.org/tag/*
// @match       *://e-hentai.org/?f_search*
// @match       *://e-hentai.org/?f_cats*
// @match       *://e-hentai.org/?f_shash*
// @match       *://e-hentai.org/?next*
// @match       *://e-hentai.org/?prev*
// @match       *://e-hentai.org/favorites.php*
// @match       *://e-hentai.org/?tag_name_bar*
// @match       *://exhentai.org/
// @match       *://exhentai.org/doujinshi*
// @match       *://exhentai.org/manga*
// @match       *://exhentai.org/artistcg*
// @match       *://exhentai.org/gamecg*
// @match       *://exhentai.org/western*
// @match       *://exhentai.org/non-h*
// @match       *://exhentai.org/imageset*
// @match       *://exhentai.org/cosplay*
// @match       *://exhentai.org/asianporn*
// @match       *://exhentai.org/misc*
// @match       *://exhentai.org/uploader/*
// @match       *://exhentai.org/watched*
// @match       *://exhentai.org/tag/*
// @match       *://exhentai.org/?f_search*
// @match       *://exhentai.org/?f_cats*
// @match       *://exhentai.org/?f_shash*
// @match       *://exhentai.org/?next*
// @match       *://exhentai.org/?prev*
// @match       *://exhentai.org/favorites.php*
// @match       *://exhentai.org/?tag_name_bar*
// @run-at      document-start
// ==/UserScript==


var userBookmakrs =
    // Paste bookmarks below
    []
    // Paste bookmarks above
    ;


var customUserSettings =
    // Paste Settings data below
    {"debugConsole":false,"originalBar":false,"debugText":false,"editableTag":false,"showNoMatch":false,"urlParameter":false,"pasteAsTags":false,"expiration":1,"dropdownPosition":"all","style":{"base":{"female":"#F75F57","male":"#435BD5","language":"#10A911","cosplayer":"#902BDC","parody":"#902BDC","character":"#D973D2","group":"#F2A019","artist":"#D2D204","mixed":"#ab9f60","other":"#808080","reclass":"#808080","temp":"#808080","tag1":"#F75F57","tag2":"#435BD5","default":"#808080"},"exhentai":{"female":"#9E2720","male":"#325CA2","language":"#6A936D","cosplayer":"#6A32A2","parody":"#6A32A2","character":"#A23282","group":"#DB6C24","artist":"#D38F1D","mixed":"#AB9F60","other":"#777777","reclass":"#777777","temp":"#777777","tag1":"#9E2720","tag2":"#325CA2","default":"#777777"}},"shortcut":{"ctrlKey":true,"shiftKey":false,"altKey":false,"key":"B"},"version":3} 
    // Paste Settings data above
    ;


/***
 * 
 * Don't edit below this
 * 
 */


// Class wrapper for custom console
class CustomConsole {
    log = (() => {
        return Function.prototype.bind.call(console.log, console, '%cTAC Import Settings & Bookmarks', 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;');
    })();

    error = (() => {
        return Function.prototype.bind.call(console.error, console, '%cTAC Import Settings & Bookmarks', 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;');
    })();

    info = (() => {
        return Function.prototype.bind.call(console.info, console, '%cTAC Import Settings & Bookmarks', 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;');
    })();

    debug = (() => {
        return Function.prototype.bind.call(console.debug, console, '%cTAC Import Settings & Bookmarks', 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;');
    })();

    warn = (() => {
        return Function.prototype.bind.call(console.warn, console, '%cTAC Import Settings & Bookmarks', 'background-color: #F5B932; color: black; padding: 2px 10px; border-radius: 3px;');
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
            return Function.prototype.bind.call(console.log, console, `%cTACIS&B ${moduleText}`, 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.error = (() => {
            return Function.prototype.bind.call(console.error, console, `%cTACIS&B ${moduleText}`, 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.info = (() => {
            return Function.prototype.bind.call(console.info, console, `%cTACIS&B ${moduleText}`, 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.debug = (() => {
            return Function.prototype.bind.call(console.debug, console, `%cTACIS&B ${moduleText}`, 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
        })();
        temp.warn = (() => {
            return Function.prototype.bind.call(console.warn, console, `%cTACIS&B ${moduleText}`, 'background-color: #F5B932; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
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

// Create custom mConsole
var mConsole = new CustomConsole();

try{
    sessionStorage.setItem('tac-settings', JSON.stringify({ ...customUserSettings }));
}
catch(error) {
    mConsole.m('Import Settings').warn('Something went wrong while importing settings', error)
}

try{
    sessionStorage.setItem('tac-bookmarks', JSON.stringify({ ...userBookmakrs }));
}
catch(error) {
    mConsole.m('Import Bookmarks').warn('Something went wrong while importing Bookmarks', error)
}

// Set the prefence of the scripts
sessionStorage.setItem('tac-settings-importer', true)


