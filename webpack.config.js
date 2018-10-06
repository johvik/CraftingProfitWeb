const webpack = require("webpack");
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
require("dotenv").config();

module.exports = (_, argv) => {
  return {
    entry: "./src/index.ts",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
      new CleanWebpackPlugin(["dist"]),
      new CopyWebpackPlugin([{ from: "index.html", to: "" }]),
      new webpack.DefinePlugin({
        REALM_ID: 1,
        BASE_URL: JSON.stringify(argv.mode === "production" ? "" : (process.env.BASE_URL || "https://localhost:3000"))
      })
    ],
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist")
    },
    devServer: {
      contentBase: path.join(__dirname, "dist")
    }
  }
}