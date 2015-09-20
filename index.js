'use strict';
var through = require('through2');
var csvParse = require('csv-parse');
var gutil = require('gulp-util');
var File = require('vinyl');

module.exports = function (options) {
    options = options || {};

    // stringifies JSON and makes it pretty if asked
    function stringify(jsonObj) {
        if (options.pretty) {
            return JSON.stringify(jsonObj, null, 4);
        } else {
            return JSON.stringify(jsonObj);
        }
    }

    function filePath(jsonObj, lang) {
        var savePath;
        var opSplit;
        var nslngSplit;

        if (options.resPath) {
            opSplit = options.resPath.split('/');
            if (opSplit.length === 2) {
                nslngSplit = opSplit[1].split('-');
                if (nslngSplit[0] === '__ns__') {
                    nslngSplit[0] = 'translation';
                }

                savePath = '/' + opSplit[0] + '/' + nslngSplit[0] + '-' + lang + '.json';
            } else if (opSplit.length === 3) {
                if (opSplit[2] === '__ns__.json') {
                    opSplit[2] = 'translation.json';
                }

                savePath = '/' + opSplit[0] + '/' + lang + '/' + opSplit[2];
            }
        } else {
            savePath = '/' + lang + '/' + 'translation.json';
        }

        return new File({
            cwd: '/',
            path: savePath, // put each translation file in a folder
            contents: new Buffer(stringify(jsonObj)),
        });
    }

    // parse array to JSON object and write to JSON file
    function parseArray(csvArray, task) {
        var csvErr = 'CSV poor format. Do not assign string value to key' +
                     ' if there will be more subkeys nested within that key.';
        var lang;
        var jsonObj;
        var i;
        var j;
        var key;
        var subkeyArray;
        var value;
        var k;
        var node;

        for (i = 2; i < csvArray[0].length; i++) {
            lang = csvArray[0][i]; // get language from the CSV header row
            jsonObj = {}; // JSON object to be created

            for (j = 0; j < csvArray.length; j++) {
                // append to JSON string
                key = csvArray[j][1];
                subkeyArray = key.split('.');
                value = csvArray[j][i];
                k = 0;
                node = jsonObj;

                while (node && (k < subkeyArray.length - 1)) {
                    if (!node[subkeyArray[k]]) {
                        node[subkeyArray[k]] = {};
                    } else {
                        if (typeof node[subkeyArray[k]] !== 'object') {
                            throw csvErr;
                        }
                    }

                    node = node[subkeyArray[k]];
                    k++;
                }

                if (node) {
                    if (!node[subkeyArray[k]]) {
                        node[subkeyArray[k]] = value;
                    } else {
                        if (typeof node[subkeyArray[k]] === 'object') {
                            throw csvErr;
                        }
                    }
                }
            }

            // do not write files from the gulp plugin itself
            // create a file object and push it back to through stream
            // so main gulpfile
            task.push(filePath(jsonObj, lang));
        }
    }

    return through.obj(function (file, enc, cb) {
        var self = this; // task is a reference to the through stream
        var csvArray = [];
        var parser;

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        // STREAM BLOCK
        if (file.isStream()) {
            parser = csvParse();

            parser.on('readable', function () {
                var record = parser.read();
                while (record) {
                    csvArray.push(record);
                    record = parser.read();
                }
            });

            parser.on('error', function (err) {
                //console.log('on error', err.message);
                this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
            });

            parser.on('finish', function () {
                //console.log('on finish');
                parseArray(csvArray, self);
                parser.end();
                cb();
            });

            file.contents.pipe(parser);
        } else {
            // BUFFER BLOCK
            try {
                csvParse(file.contents.toString('utf-8'),
                    function (err, output) {
                        parseArray(output, self);
                        cb();
                    });
            } catch (err) {
                this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
            }
        }
    });
};
