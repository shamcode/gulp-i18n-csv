'use strict';
var through = require('through2');
var fs = require('fs');
var csv = require('csv');
var csvParse = require('csv-parse');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = require('vinyl');

module.exports = function (options) {
    // parse array to JSON object and write to JSON file
    function parseArray(csvArray, task) {
        var jsonObj;
        var lang;
        var jsfile;

        for (var i = 2; i < csvArray[0].length; i++) {
            // use the same name for the translation files
            var file = 'translation.json';

            // initiate JSON file for output[0][i] language here
            lang = csvArray[0][i];
            // initiate JSON string to write here
            jsonObj = {};

            for (var j = 0; j < csvArray.length; j++) {
                // append to JSON string
                var key = csvArray[j][1];
                var subkeyArray = checkPrefix(key);
                var value;

                if (subkeyArray) {
                    var subkey = subkeyArray[1];
                    var superkey = subkeyArray[0]

                    value = csvArray[j][i];
                    if (!jsonObj[superkey]) {
                        jsonObj[superkey] = {};
                    }
                    jsonObj[superkey][subkey] = value;
                } else {
                    value = csvArray[j][i];
                    //console.log(key, value);
                    jsonObj[key] = value;
                }

                jsfile = new File({
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
        if (word) {
            var prefixArray = word.split('.');
            if (prefixArray.length > 1) {
                //console.log(prefixArray);
                return prefixArray;
            }
        }
    }

    return through.obj(function (file, enc, cb) {
        var task = this; // task is a reference to the through stream

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        // STREAM BLOCK - no working yet
        console.log(file.isStream(), file.contents);
        if (file.isStream()) {
            var csvArray = [];
			var wetStream = fs.createReadStream(file.path);
			console.log(file.path.type);
			var parser = csvParse();
			var task = this;
			
			parser.on('readable', function(){
				console.log('on readable');
				var record;
				while(record = parser.read()){
					csvArray.push(record);
					//console.log('1');
				}
			});

			// AND/OR
			parser.on('error', function(err){
				console.log('on error', err.message);
			});

			// now pump some data into it (and pipe it somewhere else)
			parser.on('finish', function(){
				console.log('on finish');
				parseArray(csvArray, task);
				parser.end();
				cb();
			});
			
			//wetStream.pipe(parser);//.pipe(process.stdout);
			file.contents.pipe(parser);
			
			//parser.write(file.path);

            /*csv().from.stream(
                wetStream
                ).on('error', function (error) {
                    console.log(error.message);
                })
                .on('record', function (row, index) {
                    csvArray.push(JSON.parse(JSON.stringify(row)));
                })
                .on('end', function () {
                    //console.log("MERRY CHRISTMAS");
                    parseArray(csvArray, task);
                });*/
        }
        else {
            // BUFFER BLOCK
            try {
                csvParse(file.contents.toString('utf-8'), { comment: '#' }, function (err, output) {
                    parseArray(output, task);
					cb();
                });
            } catch (err) {
                this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
            }
        }
    });
};
