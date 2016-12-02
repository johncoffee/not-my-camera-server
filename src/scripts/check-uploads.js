"use strict";
const fs = require("fs");
const path = require("path");
const fs_1 = require("fs");
let pathTo = path.resolve(path.join(__dirname, "/../../uploads"));
fs.stat(pathTo, (err, stats) => {
    if (err || !stats.isDirectory()) {
        fs_1.mkdir(pathTo, () => {
            console.log("all good");
        });
    }
});
