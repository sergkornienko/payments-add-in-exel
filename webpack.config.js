/* eslint-disable no-undef */

const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const urlDev = "https://localhost:3005/";
const urlProd = "https://sergkornienko.github.io/payments-add-in-exel/"; // CHANGE THIS TO YOUR PRODUCTION DEPLOYMENT LOCATION

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/ui/taskpane/taskpane.ts", "./src/ui/taskpane/taskpane.html"],
      // summary: ["./src/ui/summary/summary.ts", "./src/ui/summary/summary.html"],
      medical: ["./src/ui/medical/medical.ts", "./src/ui/medical/medical.html"],
      accrual: ["./src/ui/accrual/accrual.ts", "./src/ui/accrual/accrual.html"],
      instructors: ["./src/ui/instructors/instructors.ts", "./src/ui/instructors/instructors.html"],
      audit: ["./src/ui/audit/audit.ts", "./src/ui/audit/audit.html"],
      commands: "./src/ui/commands/commands.ts",
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/ui/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane", "functions", "commands"],
        inject: "body",
        scriptLoading: "defer",
      }),
      new HtmlWebpackPlugin({
        filename: "medical.html",
        template: "./src/ui/medical/medical.html",
        chunks: ["polyfill", "medical"],
        inject: "body",
        scriptLoading: "defer",
      }),
      new HtmlWebpackPlugin({
        filename: "accrual.html",
        template: "./src/ui/accrual/accrual.html",
        chunks: ["polyfill", "accrual"],
        inject: "body",
        scriptLoading: "defer",
      }),
      new HtmlWebpackPlugin({
        filename: "instructors.html",
        template: "./src/ui/instructors/instructors.html",
        chunks: ["polyfill", "instructors"],
        inject: "body",
        scriptLoading: "defer",
      }),
      new HtmlWebpackPlugin({
        filename: "audit.html",
        template: "./src/ui/audit/audit.html",
        chunks: ["polyfill", "audit"],
        inject: "body",
        scriptLoading: "defer",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/ui/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
    ],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options:
          env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3005,
    },
  };

  return config;
};
