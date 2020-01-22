const TASK_UPDATE_INTERVAL = 500 // ms
const STATUS_IN_PROGESS = new Set(['PENDING', 'RECEIVED', 'STARTED'])
// const GLOBAL_MIN_TIMEOUT = 20000
// const GLOBAL_MAX_TIMEOUT = 180000

const MAX_SOCKET_FAILED_CNT = 5

export default {
  data () {
    return {
      apiTaskCheck: {
        socket: null,
        interval: null,
        started: null,
        eta: null,
        statusCb: null,
        promiseReturned: false,
        failedCnt: 0
      }
    }
  },

  beforeDestroy () {
    this.clearApiTaskWatch()
  },

  methods: {
    updateApiTaskStatus () {
      if (this.apiTaskCheck.eta === null || this.apiTaskCheck.statusCb === null) return

      let dt = this.apiTaskCheck.started.diff(this.$moment(), 'seconds') + this.apiTaskCheck.eta
      let perc = Math.max(100 - dt / this.apiTaskCheck.eta * 100, 3)
      perc = (perc > 100 ? null : perc)

      dt = (dt / 10).toFixed() * 10 // Round up to the next 10 seconds

      let duration = this.$moment.duration(dt, 'seconds')

      let eta
      if (dt < 10) eta = this.$t('task.eta_any_moment')
      else if (dt < 60) {
        let duration = this.$moment.localeData()._relativeTime.ss.replace('%d', dt)
        eta = this.$t('task.eta_duration_roughly', { duration })
      } else eta = this.$t('task.eta_duration_roughly', { duration: duration.humanize() })

      this.apiTaskCheck.statusCb(eta, perc)
    },

    clearApiTaskWatch () {
      clearInterval(this.apiTaskCheck.interval)
      this.apiTaskCheck.interval = null
      this.apiTaskCheck.started = null
      this.apiTaskCheck.eta = null
      this.apiTaskCheck.statusCb = null
      if (this.apiTaskCheck.socket) this.apiTaskCheck.socket.close()
    },

    getApiTaskStatus (id, eta = null, statusCb = null, etaFactorTimeout = 3) {
      return new Promise((resolve, reject) => {
        if (statusCb !== null && typeof eta !== 'number') {
          throw Error('When giving status callback function, pass valid number as eta')
        }

        /* let timeout = 0
        if (typeof eta === 'number' && typeof etaFactorTimeout === 'number') {
          timeout = Math.max(eta * etaFactorTimeout * 1000, GLOBAL_MIN_TIMEOUT)
        } else timeout = GLOBAL_MAX_TIMEOUT */

        this.apiTaskCheck.eta = eta
        this.apiTaskCheck.statusCb = statusCb
        this.apiTaskCheck.started = this.$moment()
        this.updateApiTaskStatus()

        this.apiTaskCheck.promiseReturned = false

        let openTaskObserverFn = () => window.ws.open(`ws/tasks/${id}/`).then(socket => {
          this.apiTaskCheck.socket = socket
          this.apiTaskCheck.failedCnt = 0
          socket.onmessage = (event) => {
            let data = JSON.parse(event.data)
            if (!STATUS_IN_PROGESS.has(data.status)) {
              this.clearApiTaskWatch()
              this.apiTaskCheck.promiseReturned = true
              if (data.status === 'SUCCESS') resolve(data)
              else reject(new Error(`Task ${id} failed with status ${data.status}`))
            }
          }

          socket.onclose = (event) => {
            this.apiTaskCheck.socket = null
            if (event.wasClean && this.apiTaskCheck.promiseReturned) return
            else if (event.wasClean) reject(new Error(`Socket closed cleanly but promise not resolved yet.`))
            else {
              console.error(`API call for task check failed. Code=${event.code} reason=${event.reason}`)
              setTimeout(openTaskObserverFn, 7500)
            }
          }
        }).catch(({ err, event }) => {
          this.apiTaskCheck.socket = null
          this.apiTaskCheck.failedCnt += 1
          if (this.apiTaskCheck.failedCnt >= MAX_SOCKET_FAILED_CNT) {
            this.$onError(new Error(`Failed to connect to socket ${MAX_SOCKET_FAILED_CNT} times, stopping.`))
            this.clearApiTaskWatch()
            reject(new Error(`Websocket connection for task check ${id} failed.`))
          } else setTimeout(openTaskObserverFn, 7500)
          console.error(err)
          console.error('Task observer failed to connect.')
        })

        openTaskObserverFn()
        this.apiTaskCheck.interval = setInterval(this.updateApiTaskStatus, TASK_UPDATE_INTERVAL)
      })
    }
  }
}
