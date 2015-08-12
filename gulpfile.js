var unicorn = require('./index.js');
var gulp = require('gulp');

gulp.task('default', function () {
  
  
  return gulp.src('WET.csv')
      .pipe(unicorn())
      .pipe(gulp.dest('./crap/'));
  });
