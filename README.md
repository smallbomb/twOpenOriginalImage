twOpenOriginalImage
========================================
- add to specify the file name format based on https://github.com/furyutei/twOpenOriginalImage (ver.0.1.8.16) ()

### user script (Greasemonkey / Tampermonkey）
> [smallbomb modilfiedー(twOpenOriginalImage.user.js)](https://github.com/smallbomb/twOpenOriginalImage/raw/master/src/js/twOpenOriginalImage.user.js) 

```js
/* FORMATER_FILENAME support:
 *    filename:
 *      {base}
 *    tweet create date:
 *      {yyyy} => fullyear
 *      {mm} => Month
 *      {dd} => day
 *      {HH} => hours
 *      {MM} => minutes
 *      {SS} => seconds
 *    author:
 *      {fullname} => nickname
 *      {username} => account
 *    image index:
 *      {i} => 1, 2, ...
 *    tweet id:
 *      {tweet_id}
 *    tweet text:
 *      {twtext} => first line only if tweet text have new line character('\n').
 *    suffix:
 *      {suffix} => '-orig'
 *    extension:
 *      {ext}
 */
/* example */
var OPTIONS = {
 FORMATER_FILENAME: '[{yyyy}-{mm}-{dd}]({username}){twtext}_{tweet_id}_{i}.{ext}'
 // => [2021-10-06](Google)Available now_ the new indoor #NestCam (wired) from Google. _1445486492734816268_1.jpg
}

