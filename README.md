# e-hentai-helper-suite

Collection of userscripts for a better navigation on e-hentai

## e-hentai-tags-helper

<p align="center">
  <img src="images/tag-helper.gif" width="80%" /><br>
  Replace normal search bar with new one whit autocomplete of tags
</p>

**Direct Install:** [install](https://raw.githubusercontent.com/ciccabanana/e-hentai-helper-suite/master/e-hentai-tags-helper.js)

### Features

* Compatible with Tampermonkey, Greasemonkey and Violentmonkey
* Fast loading ~40ms
* Autocomplete of tags using site API
* Delayed API request during typing for avoid server overload
* Fast autocomplete using category index (ignore case) [see below](#Category-index)
* Colored tags by category &nbsp;
![ ](https://img.shields.io/static/v1?label=&message=female&color=f75e56)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=male&color=374eb3)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=language&color=0eac10)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=parody&color=902cdd)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=character&color=db75d5)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=group&color=f09e19)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=artist&color=d3d303)&nbsp;
![ ](https://img.shields.io/static/v1?label=&message=misc&color=808080)
* No duplicate allowed.
* Works both in front page and favorites search bar.
* Works on both e-hentai and sadpanda.

#### Category index

* f: => female
* m: => male
* l: => language
* p: => parody
* c: => character
* g: => group
* a: => artist
* x: OR mi: => misc

### ToDo

* [ ] Settings interface
* [ ] Possibility of user to personalize tags color
* [ ] Compatibility to work in the insertion of new tags on the gallery page (Under evaluation)
* [ ] ...

## External Tools

* [tagify](https://github.com/yairEO/tagify) (v 3.17.7)
* [@saninn/logger](https://github.com/distante/saninn-logger)
