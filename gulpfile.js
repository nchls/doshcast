var gulp = require('gulp');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var config = {
	environment: 'development'
};

var mainTasks = ['sass', 'coffee', 'concatenate', 'minify'];

gulp.task('watch', function() {
	gulp.watch('./source/**/*.*', mainTasks);
});

gulp.task('sass', function() {
	var options = (config.environment !== 'production' ? {} : { outputStyle: 'compressed' });
	gulp.src('./source/sass/*.scss')
		.pipe(sass(options))
		.pipe(gulp.dest('./public/css/'));
});

gulp.task('coffee', function() {
	var dest = (config.environment !== 'production' ? './public/js/' : './.tmp/js/');
	gulp.src('./source/coffee/**/*.coffee')
		.pipe(coffee())
		.pipe(gulp.dest(dest));
	gulp.src('./source/api/*.coffee')
		.pipe(coffee({bare: true}))
		.pipe(gulp.dest('./source/api/'));
});

gulp.task('concatenate', ['coffee', 'sass'], function() {
	if (config.environment === 'production') {
		gulp.src(
			[
				'./public/bower/lodash/dist/lodash.js',
				'./public/bower/angular/angular.js',
				'./public/bower/angular-filter/dist/angular-filter.js',
				'./public/bower/angular-resource/angular-resource.js',
				'./public/bower/moment/moment.js',
				'./public/bower/snap.svg/dist/snap.svg.js',
				'./.tmp/js/models/Model.js',
				'./.tmp/js/models/Stream.js',
				'./.tmp/js/models/StreamRevision.js',
				'./.tmp/js/models/ManualEntry.js',
				'./.tmp/js/util.js',
				'./.tmp/js/main.js'
			])
			.pipe(concat('script.js'))
			.pipe(gulp.dest('./.tmp/js/'))
	}
});

gulp.task('minify', ['concatenate'], function() {
	if (config.environment === 'production') {
		gulp.src('./.tmp/js/script.js')
			.pipe(uglify())
			.pipe(gulp.dest('./public/js/dist/'))
	}
});

gulp.task('default', ['watch'].concat(mainTasks), function() {});
