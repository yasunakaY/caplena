'use strict'
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const PrerenderSpaPlugin = require('prerender-spa-plugin')

var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : config.build.env

var webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      // allChunks: true
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: config.build.productionSourceMap
        ? { safe: true, map: { inline: false } }
        : { safe: true }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      chunks: ['manifest', 'vendor-global', 'vendor-app', 'app'],
      filename: process.env.NODE_ENV === 'testing'
        ? 'app/index.html'
        : config.build.application,
      template: 'app.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      // update: With multiple entry points somehow fails, make sure to define correct order by your own
      chunksSortMode: 'manual'
    }),
    // The landing page
    new HtmlWebpackPlugin({
      chunks: ['manifest', 'vendor-global', 'vendor-landing', 'landing'],
      filename: process.env.NODE_ENV === 'testing'
        ? 'index.html'
        : config.build.landing,
      template: 'landing.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      // update: With multiple entry points somehow fails, make sure to define correct order by your own
      chunksSortMode: 'manual'
    }),
    // split vendor js into its own file, but only stuff that is used in both our entries
    new webpack.optimize.CommonsChunkPlugin({
      chunks: ['app', 'landing'],
      name: 'vendor-global',
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0 && count === 2
        )
      }
    }),
    // split vendor js into its own file for app js
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor-app',
      chunks: ['app'],
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // split vendor js into its own file for landing js
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor-landing',
      chunks: ['landing'],
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor-global', 'vendor-app', 'vendor-landing']
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*', 'robots*.txt', 'sitemap.xml', 'google*.html']
      }
    ]),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.join(path.resolve(__dirname, '../static'), (process.env.CODIT_ENV === 'prod' ? 'robots_prod.txt' : 'robots_dev.txt')),
        to: path.join(config.build.assetsRoot, 'robots.txt')
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(path.resolve(__dirname, '../static'), 'sitemap.xml'),
        to: path.join(config.build.assetsRoot, 'sitemap.xml')
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(path.resolve(__dirname, '../static'), 'google4ce5625b90acf543.html'),
        to: path.join(config.build.assetsRoot, 'google4ce5625b90acf543.html')
      }
    ]),
    new PrerenderSpaPlugin({
      // Path to compiled app
      staticDir: path.join(__dirname, '../dist'),
      // List of endpoints you wish to prerender
      routes: ['/de/', '/en/']
    })
  ]
})

if (config.build.productionGzip) {
  var CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
