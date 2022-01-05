twOpenOriginalImage
========================================
- add to specify the file name format based on https://github.com/furyutei/twOpenOriginalImage (ver.0.1.8.20)

### user script (Greasemonkey / Tampermonkey）
> [smallbomb modifyー(twOpenOriginalImage.user.js)](https://github.com/smallbomb/twOpenOriginalImage/raw/master/src/js/twOpenOriginalImage.user.js) 

```js
/* FORMAT_FILENAME support:
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
 *      {twtext} => first line if tweet text have new line character('\n').
 *    suffix:
 *      {suffix} => '-orig'
 *    extension:
 *      {ext}
 */

/* code example */
var OPTIONS = {
 ...
 ...
 ...
, FORMAT_FILENAME: '[{yyyy}-{mm}-{dd}]({username}){twtext}_{tweet_id}_{i}.{ext}' // you can modify it!
  // => [2021-10-06](Google)Available now_ the new indoor #NestCam (wired) from Google. _1445486492734816268_1.jpg
}

