const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/index.mjs",
  mode: "development",
  devtool: "inline-source-map",
  experiments: {
    topLevelAwait: true
  },
  devServer: {
    headers: [
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "require-corp",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
    ],
  },
  output: {
    filename: "[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    globalObject: "typeof self !== 'undefined' ? self : window",
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      // If you don't actually need these modules in the browser, just disable them:
      os: false,
      child_process: false,
      tty: false
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "src/pageStyle.css",
          to: "pageStyle.css" // copies to dist/pageStyle.css
        },
        {
          from: "src/stats.min.js",
          to: "stats.min.js"
        },
        {
          from: "./node_modules/@creooxag/cx-converter/dist/*.wasm",
          to() {
            return "[name][ext]";
          },
        },
      ],
    }),
  ],
};
