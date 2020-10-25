// ==UserScript==
// @name Tags Auto Complete
// @namespace https://github.com/ciccabanana/e-hentai-helper-suite
// @homepageURL https://github.com/ciccabanana/e-hentai-helper-suite
// @version 0.1.2
// @encoding utf-8
// @author      ciccabanana
// @description     Replace normal search bar with new one whit autocomplete of tags
// @supportURL https://github.com/ciccabanana/e-hentai-helper-suite/issues
// @updateURL   https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/e-hentai-tags-helper.js
// @include     *://e-hentai.org/
// @include     *://exhentai.org/
// @include     /https?:\/\/e(-|x)hentai\.org\/(watched.*|tag\/.*|\?f_search.*|\?f_cats.*|\?tag_name_bar.*|\?f_shash.*|\?page.*|favorites\.php\?.*)/
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/library/@saninn__logger.js
// @require https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/library/jQuery.tagify.min.js

// @resource    TagifyCSS https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/resource/tagify.css

// @grant   GM_getResourceText
// @grant   GM.getResourceUrl

// ==/UserScript==


var debug = false;

if (debug)
    console.time();
(function () {
    'use strict';

    let typingTimer; 
    var typing = false;

    // Create custom mConsole
    var mConsole = new SaninnLogger('Tags Auto');

    getResourceText("TagifyCSS", addStyle);

    // Print curent wesite
    mConsole.log("Site api: ", location.hostname);
    mConsole.log(location.pathname);

    if (location.hostname == "e-hentai.org") {
        var api_url = "https://api.e-hentai.org/api.php";
        var set_tag_color = set_tag_color_e;
        addStyle(`.tagify {
            background-color: #edeada;
            --tags-border-color: #B5A4A4;
        }
        .tagify:hover {
            background-color: #F3F0E0;
            border-color: #B5A4A4
        }
        .tagify__input::before {
            color: #5C0D12;
        }
        .tagify__dropdown__wrapper {
            background: #EDEBDF;
            border: 1px solid #D4D4D4;
        }
        .tagify__dropdown__item--active {
            background: #F3F0E0!important;
            color: #5C0D11
        }`);
    } else {

        api_url = "https://exhentai.org/api.php";
        var set_tag_color = set_tag_color_ex;

        addStyle(`.tagify {
            background-color: #34353b;
            --tags-border-color: #8d8d8d;
        }
        .tagify:hover {
            background-color: #43464e;
            border-color: #8d8d8d
        }
        .tagify__input::before {
            color: #f1f1f1;
        }
        .tagify__dropdown__wrapper {
            background: #4f535b;
            /*bakgound della lista*/
            border: 1px solid #8d8d8d;
        }
        .tagify__dropdown__item--active {
            background: #43464e!important;
            color: #f1f1f1
        }`);
    }

    // Create new container
    var container = document.createElement("DIV");
    container.setAttribute("class", "tagcomplete");    
    container.setAttribute("id", "c_aut_comp");

    // Create new input text
    var tag_bar = document.createElement("input");
    tag_bar.setAttribute("type", "text");
    tag_bar.setAttribute("id", "tag_name_bar");
    tag_bar.setAttribute("name", "tag_name_bar");
    tag_bar.setAttribute("placeholder", "Insert tags ");
    tag_bar.setAttribute("autofocus", '');

    var selector = "#searchbox > form > p:nth-child(3)";
    if(location.pathname == "/favorites.php"){
        selector = "body > div.ido > div:nth-child(3) > form > div";
    }
    
    // Hide the original search bar
    $(selector).attr('style', 'display:none;');
    // Append 
    container.appendChild(tag_bar);
    $(selector).after(container);

    // Clone and append button "Clear Filter"
    $(selector.concat(" > input[type=button]:nth-child(3)")).clone().insertAfter("#c_aut_comp");
    // Clone and append button "Apply Filter"
    $(selector.concat(" > input[type=submit]:nth-child(2)")).clone().insertAfter("#c_aut_comp");


    // Create tagify bar
    var tagify = new Tagify(tag_bar, {
        transformTag: set_tag_color,
        templates: {
            tag: function (tagData) {
                try {
                    tagData.value = tagData.value.replace(/@|#/g, '');
                    return `<tag title='${tagData.value}' contenteditable='false' spellcheck="false" class='tagify__tag ${tagData.class ? tagData.class : ""}' ${this.getAttributes(tagData)}>
							<x title='' class='tagify__tag__removeBtn' role='button' aria-label='remove tag'></x>
							<div>
								<span class='tagify__tag-text'>${tagData.value}</span>
							</div>
						</tag>`;
                } catch (err) { }
            },
            dropdownItem: function (tagData) {
                try {
                    var value = tagData.value.split('#').map(element => element[0] == "@" ? "<strong>" + element.substring(1) + "</strong>" : element).join("");
                    tagData.value = tagData.value.replace(/@|#/g, '');
                    var html = `<div ${this.getAttributes(tagData)} 
                        class='${this.settings.classNames.dropdownItem} ${tagData.class ? tagData.class : ""}'
                        tabindex=\"0\" role=\"option\">
                            ${value}
						</div>`;
                    return html;
                } catch (err) { }
            }
        }
    });

    // Get current search value
    const urlParams = new URLSearchParams(window.location.search);
    var old_input = JSON.parse(urlParams.get('tag_name_bar'));
    if(old_input == null){
        old_input = $('[name="f_search"]')[0].value.match(/\w+:(?:\")?(?:[^\$\"]*)\$(?:\")?|(?:[^ ])(?:\")?(?:[\w\s]*)\$(?:\")?|\"(?:[^\"]*)\"/g);
        if (old_input) {
            old_input = old_input.map(function (item, index) {
                return {
                    value: item.replace(/["\'\$]/g, ''),
                    detail: item.match(/^.*:.*$/g) ? item : null,
                    editable: item.match(/^.*:.*$/g) ? false : true
                };
            });
        }
    }

    tagify.addTags(old_input);


    // Set event listeners
    tagify.on('add', onAddTag).on('remove', onRemoveTag).on('input', onInput).on('dropdown:select', onDropdownSelect).on('change', onChange).on('keydown', onKeyDown);

    // tag added callback
    function onAddTag(e) {
        if (debug)
            mConsole.log("onAddTag: ", e.detail.data);
        typing = false;
    }

    // tag remvoed callback
    function onRemoveTag(e) {
        if (debug)
            mConsole.log("onRemoveTag:", e.detail.data);
    }

    function onKeyDown(e) {
        if (e.detail.originalEvent.keyCode == 13 && !typing){
            $("#searchbox > form").submit();
            e.preventDefault();
        }
        if (debug)
            mConsole.log(e.type, e.detail, typing)
    }

    // on character(s) added/removed (user is typing/deleting)
    function onInput(e) {
        if (debug)
            mConsole.log("onInput: ", e.detail);
        typing = true;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(function () {
            tagify.settings.whitelist.length = 0; // reset current whitelist

            regex_replace(e.detail.value).then(function (pre_elab_result) {
                // show the loader animation
                tagify.loading(true).dropdown.hide.call(tagify);

                makeXMLRequest(api_url, "POST", JSON.stringify({
                    method: "tagsuggest",
                    text: pre_elab_result
                })).then(function (result) {

                        result = JSON.parse(result.responseText);
                        var p = new RegExp("(^| |:)" + pre_elab_result, "ig");
                        var a = Object.values(result.tags).map(function (key) {
                            return {
                                value: (key.ns + ":" + key.tn).match(p) ? (key.ns + ":" + key.tn).replace(p, "#@$&#") : key.ns + ":" + key.tn,
                                detail: key.tn.indexOf(" ") != -1 ? key.ns + ":\"" + key.tn + "$\"" : key.ns + ":" + key.tn + "$",
                                editable: false
                            };
                        });

                        // Add element in whitelist
                        tagify.settings.whitelist.splice(0, a.length, ...a);

                        // render the suggestions dropdown.
                        tagify.loading(false).dropdown.show.call(tagify, pre_elab_result);

                    }).catch((reason) => {
                        mConsole.log('Server request failed.\nStatus: ', reason.status, '\nResponse: ', reason.statusText);
                    });
            }).catch((reason) => {
                if (debug)
                    mConsole.log('Pre-request elab failed. Reasion: ', reason);
            });
        }, 400);

    }

    function onDropdownSelect(e) {
        if (debug)
            mConsole.log("onDropdownSelect: ", e.detail);
    }

    function onChange(e) {
        // outputs a String
        if (debug)
            mConsole.log("onChange: ", e.detail);
        var text = "";
        if (e.detail.value) {
            var list = JSON.parse(e.detail.value);
            list = list.map(x => x.detail ? x.detail : `${x.value}`); // estraggo i dettagli
            text = list.join(" ");
        }

        $('[name="f_search"]')[0].value = text;
    }

    function set_tag_color_e(tagData) {

        var trasform = tagData.value.split(":")[0].replace(/@|#/g, '');
        switch (trasform) {
            case 'female':
                tagData.style = "--tag-bg:" + '#f75e56'; //  (Red) (Doujinshi)
                break;
            case 'male':
                tagData.style = "--tag-bg:" + '#374eb3'; //  (Blue) (Image Set)
                break;
            case 'reclass':
                //    tagData.style = "--tag-bg:" + '#ab9f60'; // Teak (Western)          
                break;
            case 'language':
                tagData.style = "--tag-bg:" + '#0eac10'; //  (Green) (Game CG)
                break;
            case 'parody':
                tagData.style = "--tag-bg:" + '#902cdd'; // #8f2adb (Cosplay)
                break;
            case 'character':
                tagData.style = "--tag-bg:" + '#db75d5'; //  (Viola) (Asian)
                break;
            case 'group':
                tagData.style = "--tag-bg:" + '#f09e19'; // (Oragne) (Manga)
                break;
            case 'artist':
                tagData.style = "--tag-bg:" + '#d3d303'; //  (YelloW) (Artistig CG)
                break;
            default:
                tagData.style = "--tag-bg:" + '#808080'; //  (Gray) (Misc)
                break;
        }
    }

    function set_tag_color_ex(tagData) {

        var trasform = tagData.value.split(":")[0].replace(/@|#/g, '');
        switch (trasform) {
            case 'female':
                tagData.style = "--tag-bg:" + '#940000'; // Red Berry (Red) (Doujinshi)
                break;
            case 'male':
                tagData.style = "--tag-bg:" + '#325ca2'; // Azure (Blue) (Image Set)
                break;
            case 'reclass':
                //    tagData.style = "--tag-bg:" + '#ab9f60'; // Teak (Western)          
                break;
            case 'language':
                tagData.style = "--tag-bg:" + '#6a936d'; // Laurel (Green) (Game CG)
                break;
            case 'parody':
                tagData.style = "--tag-bg:" + '#6a32a2'; // Royal Purple (Cosplay)
                break;
            case 'character':
                tagData.style = "--tag-bg:" + '#a23282'; // Royal Heath (Viola) (Asian)
                break;
            case 'group':
                tagData.style = "--tag-bg:" + '#db6c24'; // Hot Cinnamon (Oragne) (Manga)
                break;
            case 'artist':
                tagData.style = "--tag-bg:" + '#d38f1d'; // Geebung (YelloW) (Artistig CG)
                break;
            default:
                tagData.style = "--tag-bg:" + '#777777'; // Boulder (Gray) (Misc)
                break;
        }
    }

    function regex_replace(inp_text) {
        return new Promise(function (resolve, reject) {
            // ^(x|mi|f|m|r|l|p|c|g|a).*:
            var reg = inp_text.replace(/["\']/g, "");

            if (reg.match(/^(x|mi).*:/)) {
                reg = reg.replace(/^(x|mi).*:/, "misc:");
            } else {
                reg = reg.replace(/^f.*:/, "female:").replace(/^m.*:/, "male:").replace(/^r.*:/, "reclass:").replace(/^l.*:/, "language:").replace(/^p.*:/, "parody:").replace(/^c.*:/, "character:").replace(/^g.*:/, "group:").replace(/^a.*:/, "artist:");
            }
            if (reg.replace(/^.*:/, "").length < 2) {
                reject("length < 2");
            } else {
                resolve(reg);
            }
        });
    }

    function addStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        //if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        head.appendChild(style);
        return style; //optional, but convenient for changing the styling later.
    };

    function makeXMLRequest(url, method = "GET", body = null) {
        var request = new XMLHttpRequest();

        // Return it as a Promise
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
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
                        statusText: request.statusText
                    });
                }

            };

            // Setup our HTTP request
            request.open(method, url, true);
            //request.setRequestHeader("Content-Type", "application/json");
            //request.withCredentials = true;

            // Send the request
            request.send(body);
            }, 200);
        });
    };

    function getResourceText (resource, func) {
        if (typeof (GM_getResourceText) !== 'undefined') {
            // Tampermonkey and Violentmonkey
            func(GM_getResourceText(resource))
        } else if (typeof (GM.getResourceUrl) !== 'undefined') {
            // Greasemonkey and Tampermonkey (If TM compatibility is on)
            GM.getResourceUrl(resource).then(function (blobURL) {

                makeXMLRequest(blobURL).then(function (result) {
                    func(result.responseText);
                }).catch((reason) => {
                    mConsole.log('Reasion: ', reason);
                });
            }).catch((reason) => {
                mConsole.log('Reasion: ', reason);
            });
        }
    };

    // Your code here...
})();
if (debug)
    console.timeEnd();