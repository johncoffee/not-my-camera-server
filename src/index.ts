import * as http from "http"
import {ServerResponse} from "http";
import {IncomingMessage} from "http";
import Router from "./router";
import * as Busboy from "busboy"
import * as fs from "fs"
import * as url from "url"
import * as path from "path"
import {ICerealizeable} from "./ICerealizeable"

let port = process.env.PORT || 3000

let router = new Router()

console.log("Listening on " + port)

// routes
router.GET("/view", (req:IncomingMessage, res:ServerResponse) => {
    let contents = ""
    let filePath = path.resolve(path.join(__dirname, "/view.html"))
    fs.readFile(filePath, "utf8", (err:Error, data:string) => {
        if (!err) {
            contents = data
        }
        res.end(contents)
    })
})

router.GET("/", (req:IncomingMessage, res:ServerResponse) => {
    let contents = ""
    let filePath = path.resolve(path.join(__dirname, "/upload.html"))
    fs.readFile(filePath, "utf8", (err:Error, data:string) => {
        if (!err) {
            contents = data
        }
        res.end(contents)
    })
})

router.POST("/api/image", (req:IncomingMessage, res:ServerResponse) => {
    // let keys:string[] = ["alpha", "beta", "gamma"]

    let busboy = new Busboy({
        headers: req.headers,
        limits: {
            fieldSize: 1000,
            fields: 10,
            fileSize: 12 * 1000000,
            files: 1
        }
    })

    let metadata = <ICerealizeable>{}
    let dest = `./uploads/` + new Date().toISOString() + "_" + (Math.random() + '').replace('.','') + `.jpg`

    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype)

        let stream = fs.createWriteStream(dest)
        file.pipe(stream)

        file.on('end', function () {
            console.log('File "' + fieldname + '" Finished, writing meta data')
        });
    });

    // busboy.on('field', function(fieldname:string, val:string, fieldnameTruncated, valTruncated, encoding, mimetype) {
    busboy.on('field', function (fieldname: string, val: string) {
        // console.log('Field [' + fieldname + ']: value: ' + val);
        metadata[fieldname] = val
    });

    busboy.on('finish', function () {
        console.log('Done parsing form!')

        fs.writeFile(dest.replace(/\.\w+$/, `.json`), JSON.stringify(metadata), (err:Error) => {
            console.log(err ? err : "Done")
        })

        res.writeHead(303, {Location: "/"})
        res.end()
    });

    return req.pipe(busboy)
})

router.GET("/api/image/search", (req:IncomingMessage, res:ServerResponse) => {
    let params = url.parse(req.url, true).query

    let keys:string[] = ["alpha", "beta", "gamma"]

    let searchProps:number[] = keys.map((key):number => {
        return parseFloat(params[key])
    })

    var walkPath = './uploads';

    let bestImage:string = ''
    let bestDistance = -1

    function walk(dir:string, done:Function) {
        fs.readdir(dir, function (error, list) {
            if (error) {
                return done(error);
            }
            let i:number = 0;
            (function next () {
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
                            let json = fs.readFileSync(file, 'utf8')
                            let contents = JSON.parse(json)

                            let fileProps:number[] = keys.map((key):number => {
                                return parseFloat(contents[key])
                            })

                            let dist = distance(fileProps, searchProps)

                            if (bestDistance === -1 || dist < bestDistance) {
                                // console.log(searchProps,"vs",fileProps, bestDistance, " > ", dist)
                                bestDistance = dist
                                bestImage = file.replace(`.json`,`.jpg`)
                            }
                        }
                        else {
                            // console.log("NOT handled", file)
                        }
                        next()
                    }
                })
            })()
        })
    }

    walk(walkPath, (error:Error) => {
        if (!error) {
            fs.readFile(bestImage, (err, data) => {
                res.writeHead(200, {"Content-Type":"image/jpeg"})
                res.end(data)
            })
        }
        else {
            res.writeHead(500)
            res.end()
        }
    })

    function distance(a:number[], b:number[]):number {
        return Math.sqrt(distanceSquared(a,b))
    }

    function distanceSquared(a:number[], b:number[]):number {
        var sum = 0
        for (let n = 0; n < a.length; n++) {
            sum += Math.pow(a[n] - b[n], 2)
        }
        return sum
    }
})



const server = http.createServer((req:IncomingMessage, res:ServerResponse) => {
    router.handle(req, res)
})
server.listen(port)



// distance in linked list; months, hour, etc
// c = abs(a - b)
// max = 24
// if (c > max/2) {
//     c = max - c
// }
