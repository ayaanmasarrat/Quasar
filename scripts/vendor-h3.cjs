// Keep browser H3 local so IBM Z only needs to serve static JavaScript.
const fs = require("node:fs");
const path = require("node:path");
const root = path.dirname(require.resolve("h3-js/package.json"));
const target = "quasar/static/vendor";
fs.mkdirSync(target, {recursive:true});
for (const [source, destination] of [["dist/h3-js.umd.js", "h3-js.umd.js"], ["LICENSE", "h3-LICENSE"], ["NOTICE", "h3-NOTICE"]]) {
  fs.copyFileSync(path.join(root, source), path.join(target, destination));
}
