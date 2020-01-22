// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')
const hosts = require('./hosts')

const USE_DEV_API = process.argv.indexOf('dev-api') !== -1
const USE_PROD_API = process.argv.indexOf('prod-api') !== -1
const REMOTE_API = USE_DEV_API && 'dev' || USE_PROD_API && 'prod' || false

const removeSecureFromCookies = (proxyRes, req, res) => {
  const sc = proxyRes.headers['set-cookie']
  if (Array.isArray(sc)) {
    proxyRes.headers['set-cookie'] = sc.map(sc => {
      return sc.split(';')
        .filter(v => v.trim().toLowerCase() !== 'secure')
        .join('; ')
    })
  }
}

module.exports = {
  build: {
    env: require('./prod.env'),
    landing: path.resolve(__dirname, '../dist/index.html'),
    application: path.resolve(__dirname, '../dist/app/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: true,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    // Run the build command with an extra argument to
    // View the bundle analyzer report after build finishes:
    // `npm run build --report`
    // Set to `true` or `false` to always turn it on or off
    bundleAnalyzerReport: process.env.npm_config_report
  },
  dev: {
    env: require('./dev.env'),
    port: 8080,
    autoOpenBrowser: true,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      '/de': {
        target: 'http://127.0.0.1:8080/',
        pathRewrite: { '/de': '' }
      },
      '/en': {
        target: 'http://127.0.0.1:8080/',
        pathRewrite: { '/en': '' }
      },
      '/api': {
        target: REMOTE_API ? hosts.API_HTTP_BASE_URIS[REMOTE_API] : `http://${hosts.API_HOSTS.local}`,
        changeOrigin: true,
        cookieDomainRewrite: { '*': '' },
        onProxyRes: removeSecureFromCookies,
        headers: {
          'Referer': REMOTE_API ? hosts.API_HTTP_BASE_URIS[REMOTE_API] : `http://${hosts.API_HOSTS.local}`
        }
        // pathRewrite: { '^/': '' }
      },
      '/ws': {
        target: REMOTE_API ? hosts.API_WS_BASE_URIS[REMOTE_API] : `ws://${hosts.API_HOSTS.local}`,
        ws: true,
        changeOrigin: true
        // pathRewrite: { '^/': '' }
      }
    },
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  }
}
