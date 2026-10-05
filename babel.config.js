// https://docs.taro.zone/docs/next/babel-config
module.exports = {
  presets: [
    ["taro", {
      framework: "react",
      ts: false,
      compiler: "webpack5",
    }],
  ],
  // marked uses class private methods, which the mini program runtime may not support.
  plugins: [
    ["@babel/plugin-transform-class-properties", {loose: true}],
    ["@babel/plugin-transform-private-methods", {loose: true}],
    ["@babel/plugin-transform-private-property-in-object", {loose: true}],
  ],
};
