var gulp = require('gulp');
var sass = require('gulp-sass');
var coffee = require('gulp-coffee');
var react = require('gulp-react');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var config = {
	environment: 'development'
};

var mainTasks = ['sass', 'coffee', 'jsx', 'concatenate', 'minify'];

gulp.task('watch', function() {
	gulp.watch('./source/**/*.*', mainTasks);
});

gulp.task('sass', function() {
	var options = (config.environment !== 'production' ? {} : { outputStyle: 'compressed' });
	gulp.src('./source/style/*.scss')
		.pipe(sass(options))
		.pipe(gulp.dest('./public/style/'));
});

gulp.task('coffee', function() {
	var serverDest ='./server/',
		logicDest = (config.environment !== 'production' ? './public/logic/' : './.tmp/logic/'),
		modelsDest = (config.environment !== 'production' ? './public/models/' : './.tmp/models/');

	gulp.src('./source/logic/*.coffee')
		.pipe(coffee())
		.pipe(gulp.dest(logicDest));
	gulp.src('./source/models/*.coffee')
		.pipe(coffee())
		.pipe(gulp.dest(modelsDest));
	gulp.src('./source/server/*.coffee')
		.pipe(coffee({bare: true}))
		.pipe(gulp.dest(serverDest));
});

gulp.task('jsx', function() {
	var dest = (config.environment !== 'production' ? './public/components/' : './.tmp/components/');
	gulp.src('./source/components/*.jsx')
		.pipe(react())
		.pipe(gulp.dest(dest));
});

gulp.task('concatenate', ['coffee', 'sass'], function() {
	if (config.environment === 'production') {
		// TODO: fix
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
		// TODO: fix
		gulp.src('./.tmp/js/script.js')
			.pipe(uglify())
			.pipe(gulp.dest('./public/js/dist/'))
	}
});

gulp.task('default', ['watch'].concat(mainTasks), function() {});
