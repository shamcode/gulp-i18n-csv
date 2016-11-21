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

	function filePath(jsonObj, lang, key) {
		var savePath;
		var writeObj = {};

		// give default path if resPath not provided
		if (options.resPath) {
			savePath = options.resPath;
		} else {
			savePath = 'locales/__lng__/__ns__.json';
		}

		if (key) {
			savePath = savePath.replace('__ns__', key);
			writeObj[key] = jsonObj;
		} else {
			savePath = savePath.replace('__ns__', 'translation');
			writeObj = jsonObj;
		}

		savePath = savePath.replace('__lng__', lang);

		return new File({
			cwd: '.',
			path: savePath, // put each translation file in a folder
			contents: new Buffer(stringify(writeObj)),
		});
	}

	// split language files further into subsections (ie. help) if unused much
	function splitFile(jsonObj, lang) {
		var key;
		var files = [];
		if (options.split) {
			// when true
			if (options.split === true) {
				Object.keys(jsonObj).forEach(function (key) {
					files.push(filePath(jsonObj[key], lang, key));
					delete jsonObj[key];
				});
			} else if (typeof options.split === 'string') {
				Object.keys(jsonObj).forEach(function (key) {
					if (key === options.split) {
						files.push(filePath(jsonObj[key], lang, key));
						delete jsonObj[key];
					}
				});
			} else if (options.split instanceof Array) {
				Object.keys(jsonObj).forEach(function (key) {
					if (options.split.indexOf(key) !== -1) {
						files.push(filePath(jsonObj[key], lang, key));
						delete jsonObj[key];
					}
				});
			}
		}

		if (options.split !== true) {
			files.push(filePath(jsonObj, lang, key));
		}

		return files;
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
		var jsfile;
		var x;

		for (i = 1; i < csvArray[0].length; i++) {
			lang = csvArray[0][i]; // get language from the CSV header row
			jsonObj = {}; // JSON object to be created

			for (j = 0; j < csvArray.length; j++) {
				// append to JSON string
				key = csvArray[j][0];
				subkeyArray = key.split('.');
				value = csvArray[j][i];
				k = 0;
				node = jsonObj;


				while (node && (k < subkeyArray.length - 1)) {

					if (!node[subkeyArray[k]]) {
						node[subkeyArray[k]] = {};
					} else if ( typeof node[subkeyArray[k]] === 'string' ) {
						subkeyArray[k + 1] = subkeyArray[k] + '.' + subkeyArray[k + 1];
						k++;
						continue;
					} else {
						if (typeof node[subkeyArray[k]] !== 'object') {
							task.emit('error', new gutil.PluginError('gulp-i18n-csv',csvErr));
							return;
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
							task.emit('error', new gutil.PluginError('gulp-i18n-csv',csvErr));
							return;
						}
					}
				}
			}

			jsfile = splitFile(jsonObj, lang);

			// do not write files from the gulp plugin itself
			// create a file object and push it back to through stream
			// so main gulpfile
			for (x = 0; x < jsfile.length; x++) {
				task.push(jsfile[x]);
			}
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
