var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var manifest = require("./src/manifest");

require('dotenv').config();

var scriptSets = [];

manifest.content_scripts.forEach((cs => {
    let c = scriptSets.length + 1;
    let name = "js/bundle." + c + ".js";
    scriptSets.push({
        name: name,
        files: cs.js
    });
    cs.js = [name];
}));

var config = {
    jsDir: 'js',
    outputDir: 'dist',
    outputDirJs: 'dist/js',
    production: true,
    sourceMaps: true
};

var app = {};

app.addScript = (paths, outputFilename) => {
    return gulp.src(paths.map(f => "src/" + f))
        .pipe(plugins.plumber())
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.init()))
        .pipe(plugins.concat(outputFilename))
        //.pipe(config.production ? plugins.uglifyEs.default() : plugins.noop())
        .pipe(plugins.if(config.sourceMaps, plugins.sourcemaps.write('.')))
        .pipe(gulp.dest(config.outputDir));
}

gulp.task('scripts', (done) => {
    scriptSets.forEach((set) => {
        app.addScript(set.files, set.name);
    });
    app.addScript(["umami.js"], "umami.js");
    done();
});

gulp.task('copy', (done) => {
    return gulp
        .src(["css/*", "fonts/*", "html/**/*", "pagejs/*", "icons/*", "LICENSE", "umami.html", "lib/browser-polyfill.js"].map(f => "src/" + f))
        .pipe(plugins.copy(config.outputDir, { prefix: 1 }))
        .pipe(gulp.dest(config.outputDir));
});

gulp.task('manifest', (done) => {
    return gulp.src('manifest.json', { read: false, allowEmpty: true })
        .pipe(plugins.file('manifest.json', JSON.stringify(manifest, null, 2)))
        .pipe(gulp.dest(config.outputDir));
});
gulp.task('chrome-manifest', (done) => {
    delete manifest.applications;
    return gulp.src('manifest.json', { read: false, allowEmpty: true })
        .pipe(plugins.file('manifest.json', JSON.stringify(manifest, null, 2)))
        .pipe(gulp.dest(config.outputDir));
});

gulp.task("firefox", (done) => {
    gulp.src(process.env.build_name || 'umami-ff-' + manifest.version + '.zip', { read: false, allowEmpty: true })
        .pipe(plugins.clean());
    return gulp.src('dist/**')
        .pipe(plugins.zip(process.env.build_name || 'umami-ff-' + manifest.version + '.zip'))
        .pipe(gulp.dest('.'));
});

gulp.task('clean', done => {
    return gulp.src('dist', { read: false, allowEmpty: true })
        .pipe(plugins.clean());
});

gulp.task('build', gulp.series(['clean', 'scripts', "manifest", "copy"]));

gulp.task('chrome', gulp.series(["chrome-manifest"], function () {
    gulp.src(process.env.build_name || 'umami-chrome-' + manifest.version + '.zip', { read: false, allowEmpty: true })
        .pipe(plugins.clean());
    return gulp.src('dist/**')
        .pipe(plugins.zip(process.env.build_name || 'umami-chrome.zip'))
        .pipe(gulp.dest('.'));
}));

gulp.task('src', gulp.series(["chrome-manifest"], function () {
    gulp.src('umami-src-' + manifest.version + '.zip', { read: false, allowEmpty: true })
        .pipe(plugins.clean());
    return gulp.src('dist/**')
        .pipe(plugins.zip('umami-src-' + manifest.version + '.zip'))
        .pipe(gulp.dest('.'));
}));

gulp.task('watch', gulp.series(['build'], done => {
    gulp
        .watch(['src/js/*.js', 'src/umami.js', 'src/html/**/*'], { delay: 2000 }, gulp.series(['copy', 'scripts']));
}));

gulp.task('default', gulp.series(['build']));