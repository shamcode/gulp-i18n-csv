var unicorn = require('./index.js');
var gulp = require('gulp');

gulp.task('default', function() {
	return gulp.src('./sample/wet.csv')
		.pipe(unicorn({pretty: true, split: ['cal', 'langs']}))
		.pipe(gulp.dest('./crap/'));
});