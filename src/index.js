"use strict";
const http = require("http");
const router_1 = require("./router");
const Busboy = require("busboy");
const fs = require("fs");
const url = require("url");
const path = require("path");
let port = process.env.PORT || 3000;
let router = new router_1.default();
console.log("Listening on " + port);
// routes
router.GET("/view", (req, res) => {
    let contents = "";
    let filePath = path.resolve(path.join(__dirname, "/view.html"));
    fs.readFile(filePath, "utf8", (err, data) => {
        if (!err) {
            contents = data;
        }
        res.end(contents);
    });
});
router.GET("/", (req, res) => {
    let contents = "";
    let filePath = path.resolve(path.join(__dirname, "/upload.html"));
    fs.readFile(filePath, "utf8", (err, data) => {
        if (!err) {
            contents = data;
        }
        res.end(contents);
    });
});
router.POST("/api/image", (req, res) => {
    // let keys:string[] = ["alpha", "beta", "gamma"]
    let busboy = new Busboy({
        headers: req.headers,
        limits: {
            fieldSize: 1000,
            fields: 10,
            fileSize: 12 * 1000000,
            files: 1
        }
    });
    let metadata = {};
    let dest = `./uploads/` + new Date().toISOString() + "_" + (Math.random() + '').replace('.', '') + `.jpg`;
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
        let stream = fs.createWriteStream(dest);
        file.pipe(stream);
        file.on('end', function () {
            console.log('File "' + fieldname + '" Finished, writing meta data');
        });
    });
    // busboy.on('field', function(fieldname:string, val:string, fieldnameTruncated, valTruncated, encoding, mimetype) {
    busboy.on('field', function (fieldname, val) {
        // console.log('Field [' + fieldname + ']: value: ' + val);
        metadata[fieldname] = val;
    });
    busboy.on('finish', function () {
        console.log('Done parsing form!');
        fs.writeFile(dest.replace(/\.\w+$/, `.json`), JSON.stringify(metadata), (err) => {
            console.log(err ? err : "Done");
        });
        res.writeHead(303, { Location: "/" });
        res.end();
    });
    return req.pipe(busboy);
});
router.GET("/api/image/search", (req, res) => {
    let params = url.parse(req.url, true).query;
    let keys = ["alpha", "beta", "gamma"];
    let searchProps = keys.map((key) => {
        return parseFloat(params[key]);
    });
    var walkPath = './uploads';
    let bestImage = '';
    let bestDistance = -1;
    function walk(dir, done) {
        fs.readdir(dir, function (error, list) {
            if (error) {
                return done(error);
            }
            let i = 0;
            (function next() {
                var file = list[i++];
                if (!file) {
                    return done(null, bestImage);
                }
                file = dir + '/' + file;
                fs.stat(file, function (error, stat) {
                    if (stat && stat.isDirectory()) {
                        walk(file, function () {
                            next();
                        });
                    }
                    else {
                        if (file.indexOf(".json") > -1) {
                            // do stuff to file here
                            let json = fs.readFileSync(file, 'utf8');
                            let contents = JSON.parse(json);
                            let fileProps = keys.map((key) => {
                                return parseFloat(contents[key]);
                            });
                            let dist = distance(fileProps, searchProps);
                            if (bestDistance === -1 || dist < bestDistance) {
                                // console.log(searchProps,"vs",fileProps, bestDistance, " > ", dist)
                                bestDistance = dist;
                                bestImage = file.replace(`.json`, `.jpg`);
                            }
                        }
                        else {
                        }
                        next();
                    }
                });
            })();
        });
    }
    walk(walkPath, (error) => {
        if (!error) {
            fs.readFile(bestImage, (err, data) => {
                res.writeHead(200, { "Content-Type": "image/jpeg" });
                res.end(data);
            });
        }
        else {
            res.writeHead(500);
            res.end();
        }
    });
    function distance(a, b) {
        return Math.sqrt(distanceSquared(a, b));
    }
    function distanceSquared(a, b) {
        var sum = 0;
        for (let n = 0; n < a.length; n++) {
            sum += Math.pow(a[n] - b[n], 2);
        }
        return sum;
    }
});
const server = http.createServer((req, res) => {
    router.handle(req, res);
});
server.listen(port);
// distance in linked list; months, hour, etc
// c = abs(a - b)
// max = 24
// if (c > max/2) {
//     c = max - c
// }
