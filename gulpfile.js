var gulp = require('gulp');
var sass = require('gulp-sass');
var server = require('gulp-server-livereload');

var cssmin = require('gulp-cssmin');

//style paths
var sassFiles = 'scss/style.scss',
    cssDest = './';

gulp.task('styles', function(){
    gulp.src(sassFiles)
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin())
        .pipe(gulp.dest(cssDest));
});

gulp.task('watch',function() {
    gulp.watch('scss/**',['styles']);
});

gulp.task('webserver', ['styles', 'watch'],function() {
  gulp.src('')
    .pipe(server({
      livereload: true,
      defaultFile: 'index.html',
      open: false
    }));
});