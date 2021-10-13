'use strict';

const {src ,dest, parallel, series, watch} = require('gulp');
const gulpif = require('gulp-if');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const sass = require('gulp-dart-sass');
const sourcemaps = require('gulp-sourcemaps');
const twig = require('gulp-twig');
const pretty = require('gulp-pretty-html');
const data = require('gulp-data');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const browserSync = require('browser-sync');
const del = require('del');
const fs = require('fs');
const path = require('path');

const destPath = 'dest';
const Paths = {
    html: {
        src: [
            'src/*.html',
            'src/*.twig'
        ],
        dest: destPath,
        watch: ['src/*.html','src/*.twig','src/template/**/*','src/data/**/*']
    },
    css: {
        src: [
            'src/style/export/**/*',
        ],
        dest: destPath + '/css',
        watch: ['src/style/**/*']
    },
    javascript: {
        src: [
            'src/js/**/*.js',
        ],
        dest: destPath + '/js',
        watch: ['src/js/**/*.js']
    },
    fonts: {
        src: 'src/fonts/**/*.*',
        dest: destPath + '/fonts',
        watch: 'src/fonts/**/*.*'
    },
    img: {
        src: [
            'src/img/**/*',
        ],
        dest: destPath + '/img',
        watch: ['src/img/**/*']
    },
    data: 'src/data/'
};

const browserSyncConfig = {
    server:{baseDir: destPath + '/'},
    notify: false,
};

function html() {
    return src(Paths.html.src)
        .pipe(gulpif(_isTwig, data(_getJsonData)))
        .pipe(gulpif(_isTwig, twig().on('error', console.log)))
        .pipe(pretty())
        .pipe(dest(Paths.html.dest))
        .pipe(browserSync.reload({stream: true}))
}

function css() {
    return src(Paths.css.src)
        .pipe(sourcemaps.init().on('error', console.log))
        .pipe(gulpif(_isScss, sass({ errLogToConsole: true }).on('error', console.log)))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 4 versions'], grid : true}).on('error', console.log))
        .pipe(cleanCss({level:{1:{specialComments: 0}},}))
        .pipe(sourcemaps.write())
        .pipe(dest(Paths.css.dest))
        .pipe(browserSync.reload({stream: true}))
}

function javascript() {
    return src(Paths.javascript.src)
        .pipe(dest(Paths.javascript.dest))
        .pipe(browserSync.reload({stream: true}))
}

function fonts() {
    return src(Paths.fonts.src)
        .pipe(dest(Paths.fonts.dest))
}

function img() {
    return src(Paths.img.src)
        .pipe(newer(Paths.img.dest))
        .pipe(imagemin())
        .pipe(dest(Paths.img.dest))
}

function clean() {
    return del(destPath + '/**/*', {force: true});
}

function _watch(cb) {
    watch(Paths.css.watch, parallel(css));
    watch(Paths.html.watch, parallel(html));
    watch(Paths.javascript.watch, parallel(javascript));
    watch(Paths.fonts.watch, parallel(fonts));
    watch(Paths.img.watch, parallel(img));
    cb();
}

function _webserver(cb) {
    browserSync(browserSyncConfig);
    cb();
}

function _isScss(file) {
    return file.extname === '.scss';
}

function _isTwig(file) {
    return file.extname === '.twig';
}

function _getJsonData(file) {
    const json = `${Paths.data}${path.basename(file.path).split('.').slice(0, -1).join('.')}.json`;
    if (fs.existsSync(json)) {
        return JSON.parse(fs.readFileSync(json));
    }
    return {};
}
exports.html = html;
exports.css = css;
exports.javascript = javascript;
exports.img = img;
exports.clean = clean;
exports.build = series(clean, parallel(html, css, javascript,fonts, img));
exports.default = series(clean, parallel(html, css, javascript,fonts, img), _webserver, _watch);

/**
 * if (process.env.NODE_ENV === 'production') {
  exports.build = series(transpile, minify);
} else {
  exports.build = series(transpile, livereload);
}
 */
