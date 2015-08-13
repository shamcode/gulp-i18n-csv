# gulp-i18n-csv

[![Join the chat at https://gitter.im/fgpv-vpgf/gulp-i18n-csv](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/fgpv-vpgf/gulp-i18n-csv?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Create internationalized files from a CSV translations file


## Install

```
$ npm install --save-dev gulp-i18n-csv
```


## Usage

```js
var gulp = require('gulp');
var gulpi18nCsv = require('gulp-i18n-csv');

gulp.task('default', function () {
	return gulp.src('node_modules/gulp-i18n-csv/sample/wet.csv')
		.pipe(gulpi18nCsv())
		.pipe(gulp.dest('./output'));
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
