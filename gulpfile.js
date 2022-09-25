import gulp from 'gulp';
import plumber from 'gulp-plumber';
import less from 'gulp-less';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import htmlmin from 'gulp-htmlmin';
import squoosh from 'gulp-libsquoosh';
import svgo from 'gulp-svgmin';
import svgstore from 'gulp-svgstore';
import rename from 'gulp-rename';
import { deleteAsync } from 'del';
import terser from 'gulp-terser';
import nunjucks from 'gulp-nunjucks';
import gh-pages from 'gulp-gh-pages';

const ghPages = require('gh-pages');
const path = require('path');

function deploy(cb) {
  ghPages.publish(path.join(process.cwd(), './build'), cb);
}
exports.deploy = deploy;

// Styles
export const styles = () => {
  return gulp.src('source/less/style.less', { sourcemaps: true })
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

//html
  const html = () => {
  return gulp.src('source/*.html')
  .pipe(nunjucks.compile())
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('build'))
  .pipe(browser.stream());
}

// scripts
  export const scripts = () => {
    return gulp.src('source/js/*.js')
    .pipe(terser())
    .pipe(gulp.dest('build/js'));
  }

// images
  const optimizeImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
  .pipe(squoosh())
  .pipe(gulp.dest('build/img'));
}

const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
  .pipe(gulp.dest('build/img'));
}

// webP
const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
  .pipe(squoosh({
    webp: {}
  }))
  .pipe(gulp.dest('build/img'));
}

// svg
const svg = () => {
  return gulp.src(['source/img/*.svg', '!source/img/icons/*.svg'])
  .pipe(svgo())
  .pipe(gulp.dest('build/img'));
}

// sprite
const sprite = () => {
  return gulp.src('source/img/icons/*.svg')
  .pipe(svgo())
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename('sprite.svg'))
  .pipe(gulp.dest('source/img'));
}

// copy
const copy = (done) => {
  gulp.src([
    'source/fonts/*.{woff2,woff}',
    'source/*.ico',
    'source/*.webmanifest',
  ], {
    base: 'source'
  })
  .pipe(gulp.dest('build'))
  done();
}

// clean
const clean = () => {
  return deleteAsync('build');
}

// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// reload
export const reload = (done) => {
  browser.reload();
  done();
}

// Watcher
const watcher = () => {
  gulp.watch('source/less/**/*.less', gulp.series(styles));
  gulp.watch('source/*.html').on('change', gulp.series(html));
}

// Build
export const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  sprite,
  gulp.parallel(
    styles,
    html,
    svg,
    scripts,
    createWebp
  ),
);

export default gulp.series(
  clean,
  copy,
  copyImages,
  sprite,
  gulp.parallel(
    svg,
    scripts,
    html,
    styles,
    createWebp
  ),
  gulp.series(
    server,
    watcher
));
