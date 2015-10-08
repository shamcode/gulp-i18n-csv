/* jshint jasmine: true */
'use strict';
var File = require('vinyl');
var es = require('event-stream');
var i18nCsv = require('../');

describe("Buffer mode",function () {

    it('should work for a basic En/Fr case', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en,fr\nuseless notes,key,enval,frval\nuseless notes,key2,enval,frval')});
        var files = [];
        var plugin = i18nCsv();
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
            } catch (e) {
                fail('Could not parse the generated file');
            }
        });
        plugin.on('end', function () {
            expect(files.length).toBe(2);
            done();
        });

    });

    it('should use indentation when asked to pretty print the JSON', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en\nuseless notes,key.one,enval\nuseless notes,key.two,enval')});
        var files = [];
        var plugin = i18nCsv({pretty:true});
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
                // check that it uses return and space characters
                expect(file.contents.toString().match(/\n/g).length).toBe(6);
                expect(file.contents.toString().match(/\ /g).length).toBe(32);
            } catch (e) {
                fail('Could not parse the generated file');
            }
            done();
        });
    });

    it('should break if a subkey tries to attach to a string', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en\nuseless notes,key,enval\nuseless notes,key.two,enval')});
        var files = [];
        var plugin = i18nCsv({pretty:true});
        plugin.write(data);
        plugin.end();
        plugin.on('error', function (x) {
            expect(x.message).toBeDefined();
            done();
        });
    });

    it('should use the resPath option when requested', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en\nuseless notes,key.one,enval\nuseless notes,key.two,enval')});
        var files = [];
        var plugin = i18nCsv({resPath: 'locales/__lng__-__ns__.json'});
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
                expect(file.basename).toEqual('en-translation.json');
            } catch (e) {
                fail('Could not parse the generated file: '+e.message);
            }
            done();
        });
    });

    it('should split the top level keys when requested', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en\nuseless notes,key.one,enval\nuseless notes,key.two,enval')});
        var files = [];
        var plugin = i18nCsv({split:true});
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
            } catch (e) {
                fail('Could not parse the generated file: '+e.message);
            }
        });
        plugin.on('end', function (x) {
            expect(files.length).toBe(2);
            done();
        });
    });

    it('should name files properly when using custom resPath', function (done) {
        var data = new File({contents: new Buffer('headers,lang,en\nuseless notes,key.one,enval\nuseless notes,split,enval')});
        var files = [];
        var plugin = i18nCsv({split:'split',resPath:'__lng__-__ns__.json'});
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
            } catch (e) {
                fail('Could not parse the generated file: '+e.message);
            }
        });
        plugin.on('end', function (x) {
            var names =  files.map(function(f) { return f.basename; });
            expect(names.length).toBe(2);
            expect(names).toContain('en-translation.json');
            expect(names).toContain('en-split.json');
            done();
        });
    });
});

describe("Stream mode",function () {
    xit('should not convert a stream into a buffer', function (done) {
        var data = new File({contents: es.readArray(['headers,lang,en,fr\n','useless notes,key,enval,frval\n','useless notes,key2,enval,frval'])});
        var files = [];
        var plugin = i18nCsv();
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            expect(file.isStream()).toBe(true);
            try {
                JSON.parse(file.contents);
            } catch (e) {
                fail('Could not parse the generated file');
            }
        });
        plugin.on('end', function () {
            expect(files.length).toBe(2);
            done();
        });
    });

    it('should work when the stream is broken in the middle of word boundaries', function (done) {
        var data = new File({contents: es.readArray(['headers,la','ng,en,fr\n','useless',' notes,key,enval,frval\n','useless notes,ke','y2,enval,frval'])});
        var files = [];
        var plugin = i18nCsv();
        plugin.write(data);
        plugin.end();
        plugin.on('data', function (file) {
            files.push(file);
            try {
                JSON.parse(file.contents);
            } catch (e) {
                fail('Could not parse the generated file');
            }
        });
        plugin.on('end', function () {
            expect(files.length).toBe(2);
            done();
        });
    });
});
