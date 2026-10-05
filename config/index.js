import {defineConfig} from "@tarojs/cli";

import devConfig from "./dev";
import prodConfig from "./prod";

export default defineConfig(async(merge) => {
  const baseConfig = {
    projectName: "openagent-miniprogram",
    date: "2026-10-6",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: [],
    defineConstants: {},
    // Defaults, overridden by .env.local
    env: {
      TARO_APP_SERVER_URL: JSON.stringify("https://demo.openagentai.org"),
      TARO_APP_NAME: JSON.stringify("OpenAgent"),
    },
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    cache: {
      enable: false,
    },
    mini: {
      compile: {
        include: [modulePath => /node_modules[\\/]marked[\\/]/.test(modulePath)],
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
        },
      },
    },
  };

  if (process.env.NODE_ENV === "development") {
    return merge({}, baseConfig, devConfig);
  }
  return merge({}, baseConfig, prodConfig);
});
