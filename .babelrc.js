module.exports = function (api) {
  api.cache(true);

  const ENV = process.env.BABEL_ENV || "umd";
  //  esm cjs
  console.log("++++++++++++++++++++++++++++++");
  console.log("BABEL_ENV: ", ENV);
  console.log("++++++++++++++++++++++++++++++");
  const presets = [
    [
      "@babel/preset-env",
      {
        modules: false,
        browserslistEnv: ENV,
        loose: true,
        bugfixes: true,
      },
    ],
    "@babel/preset-typescript",
  ];
  const plugins = [
    [
      "@babel/plugin-transform-runtime",
      {
        useESModules: true,
      },
    ],
  ];

  return { presets, plugins, ignore: [/@babel[\\|/]runtime/] };
};
