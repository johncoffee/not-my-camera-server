"use strict";
const http = require("http");
const router_1 = require("./router");
const Busboy = require("busboy");
const fs = require("fs");
const url = require("url");
let port = process.env.PORT || 3000;
let router = new router_1.default();
console.log("Listening on " + port);
// routes
router.GET("/", (req, res) => {
    res.end(`<!doctype html>
    <html>
<head>
<meta charset="utf-8">
</head>
<body>
       <form method="POST" action="/api/image" enctype="multipart/form-data">
        <p> <input type="text" name="alpha" placeholder="alpha">
        <p> <input type="text" name="beta"  placeholder="beta">
        <p> <input type="text" name="gamma" placeholder="gamma">
        <p>
            <input name=filefield type="file" accept="image/*" capture="camera">
        <p><input type="submit">
      </form>
<script>     

let e = document.querySelector("[name=orientation]")
e.value = (window.screen.orientation.type.indexOf('landscape') > -1) ? 1 : 0
</script>
</body>
</html>
    `);
});
router.POST("/api/image", (req, res) => {
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
        res.writeHead(303, { Location: "/image" });
        res.end();
    });
    return req.pipe(busboy);
});
router.GET("/api/image/search", (req, res) => {
    let params = url.parse(req.url, true).query;
    let keys = ["alpha", "beta", "gamma"];
    console.log(keys);
    let searchProps = keys.map((key) => {
        return parseFloat(params[key]);
    });
    console.log(params);
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
                    return done(null);
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
                            console.log(contents);
                            console.log(searchProps, "vs", fileProps);
                            let dist = distance(fileProps, searchProps);
                            console.log(file, dist);
                            if (bestDistance < dist) {
                                bestImage = file;
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
        res.writeHead(error ? 500 : 200);
        if (!error) {
            console.log(bestImage);
        }
        res.end();
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
