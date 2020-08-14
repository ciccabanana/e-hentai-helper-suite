// ==UserScript==
// @name Tags Auto Complete [N] 0.1
// @namespace https://github.com/ciccabanana/e-hentai-helper-suite
// @homepageURL https://github.com/ciccabanana/e-hentai-helper-suite
// @version 0.1
// @description     Add search bar with autocomplete e-hentai / exhentai
// @include     /https?:\/\/e(-|x)hentai\.org\/(watched.*|tag\/.*|\?f_.*|)/

// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/develop/@saninn__logger.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/develop/tagify.js

// @resource    customCSS https://raw.githubusercontent.com/yairEO/tagify/develop/dist/tagify.css

// @grant GM_getResourceText
// @grant GM_addStyle
// ==/UserScript==


// Create custom mConsole
const mConsole = new SaninnLogger('Tags Auto');

var newCSS = GM_getResourceText("customCSS");
GM_addStyle(newCSS);

// Print curent wesite
mConsole.log("Site api: " + location.hostname);
mConsole.log(location.pathname);

var api_url = "https://api.e-hentai.org/api.php";
var style = document.createElement('style');

style.innerHTML = `.tagcomplete{position:relative;display:inline-block;margin:auto;}.tagcomplete-items{position:absolute;border:1px solid#B5A4A4;border-top:none;border-bottom:none;z-index:99;top:100%;left:1px;width:502px}.tagcomplete-items div{padding:10px;cursor:pointer;background-color:#EDEBDF;text-align:left}.tagcomplete-items div:not(:last-child){border-bottom:1px solid#D4D4D4}.tagcomplete-items div:last-child{border-bottom:1px solid#B5A4A4}.tagcomplete-items div:hover{background-color:#F3F0E0}.tagcomplete-active{background-color:#5C0D12!important;color:#EDEBDF}`;

if (location.hostname == "exhentai.org") {
    api_url = "https://exhentai.org/api.php";
}
    style.innerHTML = `

`;
//}

var ref = document.querySelector('script');
ref.parentNode.insertBefore(style, ref);

var tagify;
var inputElm;

(function () {
    'use strict';

    var new_div = document.createElement("DIV");

    new_div.setAttribute("class", "tagcomplete");

    var new_input = document.createElement("input");
    new_input.setAttribute("type", "text");
    new_input.setAttribute("id", "tagname_new_test");
    new_input.setAttribute("name", "tagname_new_test");
    new_input.setAttribute("class", "mycustomclass")
    new_input.setAttribute("placeholder", "My new tag complete");
    new_input.setAttribute("autofocus", '');

    new_div.appendChild(new_input)

    $("#searchbox > form > p:nth-child(3)").after(new_div);

    inputElm = document.querySelector('input[name=tagname_new_test]');
    tagify = new Tagify(inputElm, {
        editTags: false,
        transformTag: mytransformTag,
        templates: {
            dropdownItem: function (tagData) {
                try {
                    return `<div ${this.getAttributes(tagData)} 
                        class='${this.settings.classNames.dropdownItem} ${tagData.class ? tagData.class : ""}'
                        tabindex=\"0\" role=\"option\">
                            <strong>${tagData.value}</strong>
                        </div>`;
                }
                catch (err) { }
            }
        }
    }
    );

    //var temp = $("#f_search")[0].value.match(/([^: ]+:[^\$]+\$\"?)|("[^\"]+\")/g)
    var temp = $("#f_search")[0].value.match(/\w+:(?:\")?(?:[^\$\"]*)\$(?:\")?|(?:[^ ])(?:\")?(?:[\w\s]*)\$(?:\")?|\"(?:[^\"]*)\"/g)
    if (temp) {
        temp = temp.map(function (item, index) {
            return { value: item.replace(/["\'\$]/g, ''), detail: (item.match(/^.*:.*$/g)) ? item : NaN }
        });
        tagify.addTags(temp);
    }

    // Chainable event listeners
    tagify.on('add', onAddTag)
        .on('remove', onRemoveTag)
        .on('input', onInput)
        .on('edit', onTagEdit)
        .on('invalid', onInvalidTag)
        .on('click', onTagClick)
        .on('focus', onTagifyFocusBlur)
        .on('blur', onTagifyFocusBlur)
        .on('dropdown:hide dropdown:show', e => mConsole.log(e.type))
        .on('dropdown:select', onDropdownSelect)
        .on('change', onChange)
        .on('click', e => mConsole.log(e.detail))

    // Your code here...
})();

// tag added callback
function onAddTag(e) {
    mConsole.log("onAddTag: ", e.detail);
    mConsole.log("original input value: ", inputElm.value)
}

// tag remvoed callback
function onRemoveTag(e) {
    mConsole.log("onRemoveTag:", e.detail, "tagify instance value:", tagify.value)
}

// on character(s) added/removed (user is typing/deleting)
function onInput(e) {
    mConsole.log("onInput: ", e.detail);
    tagify.settings.whitelist.length = 0; // reset current whitelist

    pre_elab(e.detail.value.value)
        .then(function (result) {
            tagify.loading(true).dropdown.hide.call(tagify) // show the loader animation

            //mConsole.log(result);
            makeRequest(result)
                .then(function (result) {
                    // replace tagify "whitelist" array values with new values
                    // and add back the ones already choses as Tags
                    //a = Object.keys(result.tags).map(function(key){   return result.tags[key]; });
                    //a = Object.values(result.tags).map(function (key) { return key.ns + ":" + key.tn; })
                    a = Object.values(result.tags).map(function (key) {
                        return {
                            value: key.ns + ":" + key.tn,
                            detail: (key.tn.indexOf(" ") != -1) ? key.ns + ":\"" + key.tn + "$\"" : key.ns + ":" + key.tn + "$"
                        }
                    })

                    tagify.settings.whitelist.splice(0, a.length, ...a)
                    //tagify.settings.whitelist.push(...a, ...tagify.value)

                    // render the suggestions dropdown.
                    pre_elab(e.detail.value.value).then(function (result) {
                        tagify.loading(false).dropdown.show.call(tagify, result);
                    })

                })
                .catch((reason) => {
                    mConsole.log('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
                });
        })
        .catch(
            // Log the rejection reason
            (reason) => {
                mConsole.log('Eloboration pre request failed.\nReasion: ', reason);
            });
    // get new whitelist from a delayed mocked request (Promise)

}

function onTagEdit(e) {
    mConsole.log("onTagEdit: ", e.detail);
}

// invalid tag added callback
function onInvalidTag(e) {
    mConsole.log("onInvalidTag: ", e.detail);
}

function onChange(e) {
    // outputs a String
    mConsole.log("onChange: ", e.detail)
    var text = "";
    if (e.detail.value) {
        list = JSON.parse(e.detail.value)
        list2 = list.map(x => x.detail ? x.detail : `"${x.value}"`); // estraggo i dettagli
        text = list2.join(" ")
    }

    $("#f_search")[0].value = text

}

// invalid tag added callback
function onTagClick(e) {
    mConsole.log(e.detail);
    mConsole.log("onTagClick: ", e.detail);
}

function onTagifyFocusBlur(e) {
    mConsole.log(e.type, "event fired")
}

function onDropdownSelect(e) {
    mConsole.log("onDropdownSelect: ", e.detail)
}

function mytransformTag(tagData) {

    var trasform = tagData.value.split(":")[0];
    switch (trasform) {
        case 'female':
            tagData.style = "--tag-bg:" + '#940000'; // rosso,rosa
            break;
        case 'male':
            tagData.style = "--tag-bg:" + '#325ca2'; // blu,azzurro
            break;
        case 'reclass':
            //tagData.style = "--tag-bg:" + '#ff6666'; // rosso,rosa            
            //break;
        case 'language':
            tagData.style = "--tag-bg:" + '#66d65c'; // rosso
            break;
        case 'parody':
            tagData.style = "--tag-bg:" + '#ff6666'; // rosso
            break;
        case 'character':
            tagData.style = "--tag-bg:" + '#ff6666'; // rosso
            break;
        case 'group':
            tagData.style = "--tag-bg:" + '#ff6666'; // rosso
            break;
        case 'artist':
            tagData.style = "--tag-bg:" + '#ff6666'; // rosso
            break;
        default:
            tagData.style = "--tag-bg:" + '#777777'; // rosso
            //mConsole.log("Default");
            break;
    }
}

function makeRequest(stext) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", api_url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.withCredentials = true;

            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    //var a = JSON.parse(xhr.responseText);
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            var rbody = {
                method: "tagsuggest",
                text: stext
            };
            xhr.send(JSON.stringify(rbody));
        }, 200);
    });
}

function pre_elab(inp_text) {
    return new Promise(function (resolve, reject) {
        // ^(x|mi|f|m|r|l|p|c|g|a).*:
        var reg = inp_text.replace(/["\']/g, "");

        if (reg.match(/^(x|mi).*:/)) {
            reg = reg.replace(/^(x|mi).*:/, "misc:")
        } else {
            reg = reg.replace(/^f.*:/, "female:").replace(/^m.*:/, "male:").replace(/^r.*:/, "reclass:").replace(/^l.*:/, "language:").replace(/^p.*:/, "parody:").replace(/^c.*:/, "character:").replace(/^g.*:/, "group:").replace(/^a.*:/, "artist:")
        }
        if (reg.replace(/^.*:/, "").length < 2) {
            reject(false)
        } else {
            resolve(reg)
        }
    });
}

function search_beauty(s) {
    if (s.indexOf(":") != -1) {
        // tag whit :
        var splitString = s.split(":");
        if (splitString[1].indexOf(" ") != -1) {
            return splitString[0] + ":\"" + splitString[1] + "$\"";
        }
        return splitString[0] + ":" + splitString[1] + "$";
    }
    return s;
}