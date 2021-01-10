
//  TYPE 'npm i' TO START DOWNLOADING DEPENDENCIES //

const { src, dest, watch, parallel, series } = require('gulp');

const scss  = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const del = require('del');
const pug = require('gulp-pug');
const pugLinter = require('gulp-pug-linter');

function pugLinterControl() {               // проверяет на ошибки pug файлы
    return src('#src/*pug')
        .pipe(pugLinter({
            failAfterError: true
        }))
}

function pug2html() {                       // конвертит index.pug в index.html
    return src('#src/pug/*.pug')
        .pipe(pug({
            pretty: true                    // не в одну строку, а как привычно
        }))
        .pipe(dest('#src'))                 // в папку #src 
}

function browsersync() {
    browserSync.init({
        server: {
            baseDir: '#src',      //папка с проектом
        },
        notify: false,         // отключить уведомление Connected в правом углу браузера
    })
}

function cleanDist() {
    return del('dist');
}

function styles() {
    return src('#src/scss/style.scss')     // файл(ы) с которым мы работаем
        .pipe(scss({
            outputStyle: 'compressed'       // сжимаем файл (expanded - без сжатия)
        }))
        .pipe(concat('style.min.css'))      // общий файл стилей (объединяет все из src)
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 version'],
            grid: true
        }))
        .pipe(dest('#src/css'))  // куда кладем результат
        .pipe(browserSync.stream()); // обновляем браузер
}

function scripts() {
    return src([
        /* 'node_modules/jquery/dist/jquery.js', */ // если нужен jQuery
        '#src/js/main.js'   // должен идти в конце
    ])
    .pipe(concat('main.min.js')) // соединяем все файлы
    .pipe(uglify())             // минифицируем main.min.js
    .pipe(dest('#src/js'))      // кидаем в папку js
    .pipe(browserSync.stream()); // обновляем браузер
}   

function images() {
    return src('#src/img/**/*')
        .pipe(imagemin([
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('dist/img'))
}

function watching() {
    watch(['#src/scss/**/*.scss'], styles) //следит за всеми папками и файлами в /scss и запускает styles
    watch(['#src/js/*.js','!#src/js/main.min.js'], scripts) //следит за всем, кроме (!) main.min.js и запускает ф-ю scripts, если что изменилось
    watch(['#src/*.html']).on('change', browserSync.reload) //перезагрузит страничку если измениться любой html
    watch(['#src/*.pug'], pug2html)
}

// ручной ввод 'gulp build', когда нужно сохранить уже общий результат работы
function build() {
    return src([
        '#src/css/style.min.css',
        '#src/fonts/**/*',
        '#src/js/main.min.js',
        '#src/*.html'
    ], {base: '#src'})      // сохранить иерархию файлов и папок как в #src
    .pipe(dest('dist'))     // кидаем все в dist
}

exports.styles = styles;
exports.scripts = scripts;
exports.watching = watching;
exports.browsersync = browsersync;
exports.images = images;
exports.cleanDist = cleanDist;
exports.pug2html = pug2html;
exports.pugLinterControl = pugLinterControl;

exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, scripts, pugLinterControl, watching, pug2html, browsersync) // запускаются параллельно