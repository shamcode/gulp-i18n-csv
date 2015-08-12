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
            for (var j = 1; j < csvArray.length; j++) {
                // append to JSON string
                var key = csvArray[j][1];
                var value = csvArray[j][i];
                jsonObj[key] = value;
            }
            // do not write files from the gulp plugin itself
            // create a file object and push it back to through stream
            // so main gulpfile

            var jsfile = new File({
                cwd: '/',
                path: '/' + lang + '/' + file, // put each translation file in a folder
                contents: new Buffer(JSON.stringify(jsonObj))
            });

            task.push(jsfile)
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
                ).on('error', function (error) {
                    console.log(error.message);
                })
                .on('record', function (row, index) {
                    csvArray.push(JSON.parse(JSON.stringify(row)));
                })
                .on('end', function () {
                    parseArray(csvArray);
                });
        }
        // BUFFER BLOCK
        try {
            var task = this; // task is a reference to the through stream
            csvParse(file.contents.toString('utf-8'), { comment: '#' }, function (err, output) {
                parseArray(output, task);
            });
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-i18n-csv', err));
        }

        cb();
    });
};
