var unicorn = require('./index.js');
var gulp = require('gulp');

gulp.task('default', function () {


  return gulp.src('wet.csv')
      .pipe(unicorn())
      .pipe(gulp.dest('./crap/'));
  });
