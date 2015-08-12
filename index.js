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

module.exports = function (options) {
	 // parse array to JSON object and write to JSON file
	function parseArray(csvArray) {
		var jsonObj;
		
		for (var i = 2; i < csvArray[0].length; i++) {
			// initiate JSON file for output[0][i] language here
			var file = './translation-' + csvArray[0][i] + '.json';
			// initiate JSON string to write here
			var jsonObj = {};
			for (var j = 1; j < csvArray.length; j++) {
				// append to JSON string
				var key = csvArray[j][1];
				var value = csvArray[j][i];
				jsonObj[key] = value;
			}
			// write to jsonfile
			jsonfile.writeFile(file, jsonObj);
		}
	}
	
	function checkPrefix() { // check for prefix
	}
	
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}
		// STREAM BLOCK
		if (file.isStream()) {
			var csvArray = [];
			var fileName = JSON.stringify(file);
			var wetStream = fs.createReadStream(file);
			csv().from.stream(
			  wetStream
			).on('error', function(error) { 
					console.log(error.message);
				}
			).on('record', function(row, index) {
					csvArray.push(JSON.parse(JSON.stringify(row)));
				}
			).on('end', function () {
					parseArray(csvArray);
				}
			);
		}
		// BUFFER BLOCK
		try {
		    var task = this;
			csvParse(file.contents.toString('utf-8'), {comment: '#'}, function(err, output){
				parseArray(output);
			});
			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
		}

		cb();
	});
};
