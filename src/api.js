import router from './router.js'
import * as Sentry from '@sentry/browser'
import axios from 'axios'

let API = axios.create({
  baseURL: process.env.API_HTTP_BASE_URI,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-language': ''
  },
  validateStatus: function (status) {
    return status >= 200 && status <= 400
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFTOKEN',
  withCredentials: true
})

API.interceptors.request.use(
  function (config) {
    config.headers['Accept-language'] = window.language
    return config
  }
)

function maybeDoReport (response) {
  if (response === undefined || response.status === undefined || response.status >= 400) {
    let dontReport = !response || !response.config || response.config.dontReport
    if (!dontReport || (dontReport !== true && dontReport.indexOf(response.status) === -1)) {
      // This error is now "allowed" to be, i.e. it is not expected by the application logic
      // like a 400 sometimes is
      if (response.status === 401 || response.status === 403) router.app.$root.on403()
      else if (response.status === 404) {
        router.app.$root.on404()
        response.apiErrReported = true
      } else {
        // Overly verbose option to capture extra data with new client
        // See https://github.com/getsentry/sentry-javascript/issues/1607
        Sentry.withScope(scope => {
          scope.setExtra('response', response)
          Sentry.captureException(new Error('Invalid API response'))
        })
        response.apiErrReported = true
      }
    }
  }
}

API.interceptors.response.use(
  function (response) {
    maybeDoReport(response)
    return response
  },
  (error) => {
    maybeDoReport(error.response)
    return Promise.reject(error)
  }
)

class WSFactory {
  open (path) {
    return new Promise((resolve, reject) => {
      // The actual connection object
      let socket = new WebSocket(`${process.env.API_WS_BASE_URI}/${path}`)
      // Will be populated with error on onError
      let error = null

      // Resolve and return socket when connection has been opened
      socket.onopen = function () { resolve(socket) }

      // On connection close, check if an error might have occurred
      // If yes, generate message which is as meaningful as possible and reject
      socket.onclose = function (event) {
        if (!event.wasClean || error) {
          let err = new Error(`Status code=${event.code}, reason=${event.reason}`)
          reject({ err, event })
        }
      }
      socket.onerror = function (err) {
        // This error doesn't actually tell su a lot, rather fire the error on the onclose event
        error = err
      }
    })
  }
}

const WS = new WSFactory()

export { API, WS }
