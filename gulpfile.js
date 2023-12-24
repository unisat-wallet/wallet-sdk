const gulp = require("gulp");
const babel = require("gulp-babel");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const SRC_PATH = "src";

const BUILD_MODE = {
  ESM: {
    PATH: "es",
  },
  CJS: {
    PATH: "lib",
  },
};
const CURRENT_MODE = BUILD_MODE[process.env.BABEL_ENV.toUpperCase()];
gulp.task("build-esm", () => {
  return gulp
    .src([`${SRC_PATH}/**/*.ts`])
    .pipe(babel())
    .pipe(gulp.dest(BUILD_MODE.ESM.PATH));
});

gulp.task("build-cjs", () => {
  return gulp
    .src([`${SRC_PATH}/**/*.ts`])
    .pipe(tsProject())
    .pipe(gulp.dest(BUILD_MODE.CJS.PATH));
});

if (CURRENT_MODE == BUILD_MODE.ESM) {
  gulp.task("build", gulp.series("build-esm"));
} else if (CURRENT_MODE == BUILD_MODE.CJS) {
  gulp.task("build", gulp.series("build-cjs"));
}
