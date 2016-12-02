import * as fs from "fs"
import * as path from "path"
import {Stats} from "fs";
import {mkdir} from "fs";

let pathTo = path.resolve(path.join(__dirname, "/../../uploads"))

fs.stat(pathTo, (err:Error, stats:Stats) => {
    if (err || !stats.isDirectory()) {
        mkdir(pathTo,()=> {
            console.log("all good")
        })
    }
})


