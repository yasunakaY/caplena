import ECharts from 'vue-echarts'

import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/visualMap'
import 'echarts/lib/component/legend'
import 'echarts/lib/component/dataset'
import 'echarts/lib/component/graphic'

import answerFilters from '@/mixins/answerFilters'
import codeUtils from '@/mixins/codeUtils'
import colorPalettes from '@/mixins/colorPalettes'

const N_ROWS_KEY = '____N_ROWS____'

import Vuex from 'vuex'

const chartMixin = {
  mixins: [answerFilters, codeUtils, colorPalettes],

  components: {
    'v-chart': ECharts
  },

  props: {
    value: { type: Object, default: () => ({}) },
    datasets: { type: Array, default: () => [] },
    hideControls: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false }
  },

  data () {
    return {
      defaultOptionsValues: {
        tooltip: {},

        animationDuration: 500
      },

      initialReady: false,
      chartContainerWidth: 0,

      defaultConfigValues: {
        // General
        title: this.$t('chart_title'),

        dimensions: { auto: true, width: 500, height: 500 },

        // Color
        colorBy: { field: 'codeCategory', group: {} },
        colorPalette: 'default',

        // Labels
        maxLabelLength: 25,

        // Ordinal Axis
        reverseOrdinal: false,

        // Value axis
        valueAxisName: this.$t('controls.value_axis_name'),

        // Outputs
        plotCodes: { mode: 'all', select: [] }
      }
    }
  },

  computed: {
    defaultOptions () {
      return {
        ...this.defaultOptionsValues,
        title: this.hideControls ? null : this.title
      }
    },
    /**
     * Computes the intersection of all codes available in the given datasets
     * @return {array} List of codes
     */
    codesAvailable () {
      return _.intersectionBy(...this.datasets.map(ds => ds.question.codebook), 'id')
    },

    codes () {
      let filter
      let codes = this.codesAvailable
      let codesSet = new Set(this.config.plotCodes.select)
      if (this.config.plotCodes.mode === 'all') filter = c => true
      if (this.config.plotCodes.mode === 'exclude') filter = c => !codesSet.has(c.id)
      if (this.config.plotCodes.mode === 'include') filter = c => codesSet.has(c.id)
      return codes.filter(filter)
    },

    counts () {
      let codeCountsAll = []
      let catCountsAll = []
      let groupCountsAll = []

      this.datasets.forEach((ds, dsIdx) => {
        let codeCounts = Object.assign({}, ...this.codes.map(code => ({[code.id]: 0})))
        let catCounts = Object.assign({}, ...this.codeCats.map(cat => ({[cat]: 0})))
        let groupCounts = Object.assign({}, ..._.map(this.countGroupMapping, (group, codeID) => ({[group]: 0})))

        codeCountsAll.push(codeCounts)
        catCountsAll.push(catCounts)
        groupCountsAll.push(groupCounts)

        let nAnswers = 0

        ds.result.forEach(row => {
          let catsPresent = new Set()
          let groupsPresent = new Set()
          let rowWeight = this.getAnsWeight(row, dsIdx)

          nAnswers += rowWeight
          row.codes.forEach(codeID => {
            catsPresent.add(this.codeID2Cat[codeID])
            // Only count codes which are in the mapping. If they are not, it probably means
            // they have been filtered in the "outputs" section.
            if (codeID in this.countGroupMapping) groupsPresent.add(this.countGroupMapping[codeID])
            codeCounts[codeID] += rowWeight
          })
          catsPresent.forEach(cat => { catCounts[cat] += rowWeight })
          groupsPresent.forEach(group => { groupCounts[group] += rowWeight })
        })
        codeCounts[N_ROWS_KEY] = nAnswers
      })

      return { codes: codeCountsAll, categories: catCountsAll, groups: groupCountsAll }
    },

    cooccurrences () {
      if (!this.datasets.length) return {}

      let coocs = Object.assign({}, ...this.codesAvailable.map(code => ({
        [code.id]: Object.assign({}, ...this.codesAvailable.map(code => ({[code.id]: 0})))
      })))

      this.datasets[0].result.forEach(row => {
        row.codes.forEach((codeID1, codeIdx1) => {
          for (let codeIdx2 = codeIdx1 + 1; codeIdx2 < row.codes.length; codeIdx2++) {
            let codeID2 = row.codes[codeIdx2]
            let ansWeight = this.getAnsWeight(row, 0)
            coocs[codeID1][codeID2] += ansWeight
            coocs[codeID2][codeID1] += ansWeight
          }
        })
      })

      return coocs
    },

    nonCooccurrences () {
      if (!this.datasets.length) return {}

      let nonCoocs = Object.assign({}, ...this.codesAvailable.map(code => ({
        [code.id]: Object.assign({}, ...this.codesAvailable.map(code => ({[code.id]: 0})))
      })))

      this.datasets[0].result.forEach(row => {
        let rowCodes = new Set(row.codes)
        row.codes.forEach((codeID1, codeIdx1) => {
          this.codesAvailable.forEach((code2, codeIdx2) => {
            nonCoocs[codeID1][code2.id] += this.getAnsWeight(row, 0) * !rowCodes.has(code2.id)
          })
        })
      })

      return nonCoocs
    },

    jaccards () {
      if (!this.datasets.length) return {}

      let jaccards = Object.assign({}, ...this.codesAvailable.map(code => ({
        [code.id]: Object.assign({}, ...this.codesAvailable.map(code => ({[code.id]: 0})))
      })))

      this.codesAvailable.forEach((code1, codeIdx1) => {
        for (let codeIdx2 = codeIdx1 + 1; codeIdx2 < this.codesAvailable.length; codeIdx2++) {
          let code2 = this.codesAvailable[codeIdx2]
          let cooc = this.cooccurrences[code1.id][code2.id]
          let j = cooc / (this.counts.codes[0][code1.id] + this.counts.codes[0][code2.id] - cooc)

          jaccards[code1.id][code2.id] = j
          jaccards[code2.id][code1.id] = j
        }
      })

      return jaccards
    },

    /* yulesYs () {
      if (!this.datasets.length) return {}

      let yules = Object.assign({}, ...this.codesAvailable.map(code => ({
        [code.id]: Object.assign({}, ...this.codesAvailable.map(code => ({[code.id]: 0})))
      })))

      this.codesAvailable.forEach((code1, codeIdx1) => {
        for (let codeIdx2 = codeIdx1 + 1; codeIdx2 < this.codesAvailable.length; codeIdx2++) {
          let code2 = this.codesAvailable[codeIdx2]

          let d = this.cooccurrences[code1.id][code2.id]
          let c = this.nonCooccurrences[code1.id][code2.id]
          let b = this.nonCooccurrences[code2.id][code1.id]
          let a = this.counts.codes[0][N_ROWS_KEY] - b - c - d

          let y = (Math.sqrt(a * d) - Math.sqrt(b * c)) / (Math.sqrt(a * d) + Math.sqrt(b * c))

          yules[code1.id][code2.id] = y
          yules[code2.id][code1.id] = y
        }
      })

      return yules
    }, */

    // https://stats.stackexchange.com/questions/61705/similarity-coefficients-for-binary-data-why-choose-jaccard-over-russell-and-rao
    kulczynski () {
      if (!this.datasets.length) return {}

      let kulc = Object.assign({}, ...this.codesAvailable.map(code => ({
        [code.id]: Object.assign({}, ...this.codesAvailable.map(code => ({[code.id]: 0})))
      })))

      this.codesAvailable.forEach((code1, codeIdx1) => {
        for (let codeIdx2 = codeIdx1 + 1; codeIdx2 < this.codesAvailable.length; codeIdx2++) {
          let code2 = this.codesAvailable[codeIdx2]

          let a = this.cooccurrences[code1.id][code2.id]
          let b = this.nonCooccurrences[code1.id][code2.id]
          let c = this.nonCooccurrences[code2.id][code1.id]

          let k = 0.5 * (a / (a + b) + a / (a + c))

          kulc[code1.id][code2.id] = k
          kulc[code2.id][code1.id] = k
        }
      })

      return kulc
    },

    colors () {
      let cp = this.colorPalettes[this.config.colorPalette]
      if (this.colorClasses) {
        let colors = []
        for (let k = 0; k < Math.ceil(this.colorClasses.length / cp.length); k++) colors = colors.concat(cp)
        return colors
      } else return cp
    },

    countGroupMapping () {
      return {}
    },

    ready () {
      return _.every(this.datasets, ds => !ds.status.loading && !ds.status.dirty)
    },

    failed () {
      return _.some(this.datasets, ds => ds.status.failed)
    },

    hasVisualizationsAccess () {
      return this.user.subscription.plan.visualizations_access
    },

    /**
     * Factor to normalize the weighting: n_rows / sum(weighting_column)
     * Used to make sure the total still matches the number of rows
     * @return {Number} Weighting factor
     */
    weightingNormalizationFactor () {
      return this.datasets.map(ds => {
        if (ds.settings.weighting_column === null || !ds.settings.weighting_normalize) return 1
        else return ds.answers.length / _.sumBy(ds.answers, a => a.auxiliary_columns[ds.settings.weighting_column])
      })
    },

    /**
     * The properties that will be passed to the chart-scaffold component through v-bind
     * @return {Object}   chart-scaffold properties
     */
    scaffoldProps () {
      return {
        config: this.config,
        datasets: this.datasets,
        'codes-available': this.codesAvailable,
        'container-style': this.chartContainerStyle,
        ready: this.ready,
        failed: this.failed,
        helptip: this.$t('helptip'),
        readOnly: this.readOnly,
        hideControls: this.hideControls
      }
    },

    /**
     * The chart-scaffold events object that will be passed to the v-chart component through v-on
     * @return {Object} chart-scaffold events object
     */
    scaffoldEvents () {
      return {
        download: this.download,
        'container-width': ($event) => { this.chartContainerWidth = $event }
      }
    },

    /**
     * The default properties that will be passed to the v-chart component through v-bind
     * Same for all chart types, is only used through chartProps property
     * @return {Object} Chart properties object
     */
    chartPropsDefault () {
      return {
        options: this.chartOptions,
        autoresize: true
      }
    },

    /**
     * The chart properties that will be passed to the v-chart component through v-bind
     * Can be customized by each chart, this is just the default value
     * @return {Object} Chart properties object
     */
    chartProps () { return this.chartPropsDefault },

    /**
     * The chart events object that will be passed to the v-chart component through v-on
     * @return {Object} Chart events object
     */
    chartEvents () {
      return {
        click: this.chartClick
      }
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    ready: {
      immediate: true,
      handler (val) {
        if (!this.initialReady && val && !this.failed) setTimeout(() => { this.initialReady = true }, 1000)
      }
    },

    // When the internal config value changes, notify parent of change
    config: {
      deep: true,
      handler (val) { this.$emit('input', val) }
    },

    // When the external config value changes, update the internal state
    value: 'updateInternalConfig'
  },

  created () {
    this.updateInternalConfig()

    // Add watermark if visualizations are not included in users subscription
    if (!this.hasVisualizationsAccess && !this.user.isAnonymous) {
      let dpr = window.devicePixelRatio || 1
      let canvasText = document.createElement('canvas')
      canvasText.width = canvasText.height = 300
      let ctxText = canvasText.getContext('2d')
      ctxText.textAlign = 'center'
      ctxText.textBaseline = 'middle'
      ctxText.globalAlpha = 0.4
      ctxText.fillStyle = '#FF0000'
      ctxText.font = '48px Roboto'
      ctxText.translate(140, 100)
      ctxText.rotate(-Math.PI / 6)
      ctxText.fillText('caplena.com', 0, 0)

      let canvasPattern = document.createElement('canvas')
      canvasPattern.width = canvasPattern.height = 4000 * dpr
      let ctxPattern = canvasPattern.getContext('2d')
      ctxPattern.scale(1 / dpr, 1 / dpr)
      ctxPattern.beginPath()
      ctxPattern.fillStyle = ctxPattern.createPattern(canvasText, 'repeat')
      ctxPattern.fillRect(0, 0, canvasPattern.width, canvasPattern.height)

      this.defaultOptions.graphic = [{
        type: 'image',
        left: 0,
        top: 0,
        z: 100,
        silent: true,
        style: {
          image: canvasPattern,
          width: canvasPattern.width / dpr,
          height: canvasPattern.height / dpr
        }
      }]
    }
  },

  methods: {
    /**
     * Updates the internal data "config" with values given by external "value"
     */
    updateInternalConfig () {
      // If the given external and internal configs are the same, do nothing
      if (_.isEqual(this.config, this.value)) return
      // Go through all config keys defined on *this* chart
      // All other elements of config will be ignored
      _.each(this.config, (val, key) => {
        // Undefined value is treated in special way: It is assigned the global default, defined in this mixin
        if (val === undefined) {
          if (!(key in this.defaultConfigValues)) throw Error(`No default value for config '${key}' available!`)
          // Don't assign default if value is given by external config
          if (!(key in this.value)) this.$set(this.config, key, _.cloneDeep(this.defaultConfigValues[key]))
        }
        if (key in this.value) this.$set(this.config, key, this.value[key])
      })
    },

    maybeTruncateLabel (text, { maxLabelLength } = { maybeTruncateLabel: undefined }) {
      if (text === undefined) return ''
      if (maxLabelLength === undefined) maxLabelLength = this.config.maxLabelLength
      return text.length > maxLabelLength ? text.slice(0, maxLabelLength) + '...' + (text.endsWith('}') ? '}' : '') : text
    },

    getAnsWeight (ans, dsIdx) {
      let ds = this.datasets[dsIdx]
      let factor = this.weightingNormalizationFactor[dsIdx]
      return (ds.settings.weighting_column === null ? 1 : factor * ans.auxiliary_columns[ds.settings.weighting_column])
    },

    download () {
      let link = document.createElement('a')
      link.download = `${this.config.title}.png`
      link.href = this.$refs.chart.getDataURL('png')
      link.setAttribute('type', 'hidden')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export { N_ROWS_KEY, chartMixin }
