'use strict';
var through = require('through2');
var fs = require('fs');
var path = require('path');
var csv = require('csv');
var csvParse = require('csv-parse');
var chalk = require('chalk');
var gulp = require('gulp');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var jsonfile = require('jsonfile');
var simple = require('./lib/simple');
var template = require('./lib/template');
var File = require('vinyl');

module.exports = function (options) {
    // parse array to JSON object and write to JSON file
    function parseArray(csvArray, task) {
        var jsonObj;
        var lang;

        for (var i = 2; i < csvArray[0].length; i++) {
            // initiate JSON file for output[0][i] language here
            lang = csvArray[0][i];
            // use the same name for the translation files
            var file = 'translation.json';
            // initiate JSON string to write here
            var jsonObj = {};
            for (var j = 0; j < csvArray.length; j++) {
                // append to JSON string
				var key = csvArray[j][1];
                var subkeyArray = checkPrefix(key);
                var value;
                if (subkeyArray) {
                    var subkey = subkeyArray[1];
                    var superkey = subkeyArray[0]
                    value = csvArray[j][i];
					if (!jsonObj[superkey]){
						jsonObj[superkey] = {};
					}
                    jsonObj[superkey][subkey] = value;
                } else{
                    value = csvArray[j][i];
					console.log(key, value);
                    jsonObj[key] = value;
                }
                var jsfile = new File({
                    cwd: '/',
                    path: '/' + lang + '/' + file, // put each translation file in a folder
                    contents: new Buffer(JSON.stringify(jsonObj))
                });
            }
            // do not write files from the gulp plugin itself
            // create a file object and push it back to through stream
            // so main gulpfile
            task.push(jsfile)
        }
    }

    function checkPrefix(word) { // check for prefix
        if (word){
            var prefixArray = word.split('.');
            if (prefixArray.length > 1) {
                console.log(prefixArray);
                return prefixArray;
            }
        }
    }

    return through.obj(function (file, enc, cb) {
	    if (file.isNull()) {
			cb(null, file);
			return;
		}
		
		//console.log(file.contents);
        
        // STREAM BLOCK
		console.log(file.isStream(), file.isBuffer());
        if (file.isStream()) {
            var csvArray = [];
			console.log(file.path);
            //var fileName = JSON.stringify(file);
            var wetStream = fs.createReadStream(file.path);
			var task = this;
			console.log("MERRY CHRISTMAS");
            csv().from.stream(
                wetStream
                ).on('error', function (error) {
                    console.log(error.message);
                })
                .on('record', function (row, index) {
                    csvArray.push(JSON.parse(JSON.stringify(row)));
                })
                .on('end', function () {
				    console.log("MERRY CHRISTMAS");
                    parseArray(csvArray, task);
                });
        }
		else{
        // BUFFER BLOCK
			
			try {
				var task = this; // task is a reference to the through stream
				csvParse(file.contents.toString('utf-8'), { comment: '#' }, function (err, output) {
					parseArray(output, task);
				});
			} catch (err) {
				this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
			}
        }
        cb();
    });
};
