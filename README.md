# gulp-i18n-csv [![Build Status](https://travis-ci.org/cynngah/gulp-i18n-csv.svg?branch=master)](https://travis-ci.org/cynngah/gulp-i18n-csv)

[![Join the chat at https://gitter.im/fgpv-vpgf/gulp-i18n-csv](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/fgpv-vpgf/gulp-i18n-csv?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> My wondrous gulp plugin


## Install

```
$ npm install --save-dev gulp-i18n-csv
```


## Usage

```js
var gulp = require('gulp');
var i18nCsv = require('gulp-i18n-csv');

gulp.task('default', function () {
	return gulp.src('src/file.ext')
		.pipe(i18nCsv())
		.pipe(gulp.dest('dist'));
});
```


## API

### i18nCsv(options)

#### options

##### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [Cynthia (Qingwei) Li](http://unicorn.com)
