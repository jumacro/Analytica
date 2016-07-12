/**
 * Created by suman on 12/4/16.
 */

// including plugins
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var notify = require('gulp-notify');

// task
gulp.task('minify-js', function () {

  gulp.src('resources/assets/js/*.js')
    .pipe(minify({
      ext:{
        //src:'-debug.js',
        min:'.min.js'
      },
      noSource: true,
      exclude: ['tasks'],
      ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('api/js'))
    .pipe(notify({message: "Minify completed."}))
});

gulp.task('default', ['minify-js']);
