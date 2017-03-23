var args = require('yargs').argv,
    path = require('path'),
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    gulpsync = $.sync(gulp)

// production mode (see build task)
var isProduction = false;
// styles sourcemaps
var useSourceMaps = false;

// ignore everything that begins with underscore
var hidden_files = '**/_*.*';
var ignored_files = '!' + hidden_files;

// MAIN PATHS
var paths = {
    app: '../app/',
    styles: '../dev/less/',
    scripts: '../dev/js/'
}

// VENDOR CONFIG
var vendor = {
    app: {
        source: require('./vendor.json'),
        dest: '../vendor'
    }
};

// SOURCES CONFIG
var source = {
    scripts: {
        app: [paths.scripts + 'app.init.js',
            paths.scripts + 'modules/*.js',
            paths.scripts + 'custom/**/*.js'
        ]
    },
    styles: {
        app: [paths.styles + '*.*'],
        watch: [paths.styles + '**/*', '!' + paths.styles + 'themes/*']
    }
};

// BUILD TARGET CONFIG
var build = {
    scripts: {
        app: {
            main: 'app.js',
            dir: paths.app + 'js'
        }
    },
    styles: paths.app + 'css'
};

// PLUGINS OPTIONS
var vendorUglifyOpts = {
    mangle: {
        except: ['$super'] // rickshaw requires this
    }
};

//---------------
// TASKS
//---------------


// JS APP
gulp.task('scripts:app', function () {
    log('Building scripts..');
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(source.scripts.app)
        .pipe($.jsvalidate())
        .on('error', handleError)
        .pipe($.if(useSourceMaps, $.sourcemaps.init()))
        .pipe($.concat(build.scripts.app.main))
        .on("error", handleError)
        .pipe($.if(isProduction, $.uglify({preserveComments: 'some'})))
        .on("error", handleError)
        .pipe($.if(useSourceMaps, $.sourcemaps.write()))
        .pipe(gulp.dest(build.scripts.app.dir));
});

// VENDOR BUILD
// copy file from bower folder into the app vendor folder
gulp.task('vendor', function () {
    log('Copying vendor assets..');

    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src(vendor.app.source, {base: 'bower_components'})
        .pipe($.expectFile(vendor.app.source))
        .pipe(jsFilter)
        .pipe($.if(isProduction, $.uglify(vendorUglifyOpts)))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.if(isProduction, $.cleanCss()))
        .pipe(cssFilter.restore())
        .pipe(gulp.dest(vendor.app.dest));

});

// APP LESS
gulp.task('styles:app', function () {
    log('Building application styles..');
    return gulp.src(source.styles.app)
        .pipe($.if(useSourceMaps, $.sourcemaps.init()))
        .pipe($.less())
        .on("error", handleError)
        .pipe($.if(isProduction, $.cleanCss()))
        .pipe($.if(useSourceMaps, $.sourcemaps.write()))
        .pipe(gulp.dest(build.styles));
});

//---------------
// WATCH
//---------------

// Rerun the task when a file changes
gulp.task('watch', function () {
    log('Starting watch and LiveReload..');

    $.livereload.listen();

    gulp.watch(source.scripts.app, ['scripts:app']);
    gulp.watch(source.styles.watch, ['styles:app']);

    // a delay before triggering browser reload to ensure everything is compiled
    var livereloadDelay = 1500;
    // list of source file to watch for live reload
    var watchSource = [].concat(
        source.scripts.app,
        source.styles.watch
    );

    gulp
        .watch(watchSource)
        .on('change', function (event) {
            setTimeout(function () {
                $.livereload.changed(event.path);
            }, livereloadDelay);
        });

});


//---------------
// MAIN TASKS
//---------------

// build for production (minify)
gulp.task('build', gulpsync.sync([
    'prod',
    'vendor',
    'assets'
]));

gulp.task('prod', function () {
    log('Starting production build...');
    isProduction = true;
});

// build with sourcemaps (no minify)
gulp.task('sourcemaps', ['usesources', 'default']);
gulp.task('usesources', function () {
    useSourceMaps = true;
});

// default (no minify)
gulp.task('default', gulpsync.sync([
    'vendor',
    'assets',
    'watch'
]), function () {

    log('************');
    log('* All Done * You can start editing your code, LiveReload will update your browser after any change..');
    log('************');

});

gulp.task('assets', [
    'scripts:app',
    'styles:app'
]);

/////////////////////


// Error handler
function handleError(err) {
    log(err.toString());
    this.emit('end');
}

// log to console using
function log(msg) {
    $.util.log($.util.colors.blue(msg));
}

