<template>
  <div style="width: 100%; height: 100%">
    <chart-scaffold v-bind="scaffoldProps"
                    v-on="scaffoldEvents"
                    ref="scaffold">

      <template v-slot:actions>
        <slot name="actions" />
      </template>

      <control-pane v-model="config"
                    :codes="codes"
                    :codes-available="codesAvailable"
                    :color-palettes="colorPalettes"
                    ref="control-pane"
                    slot="control-pane">
        <template v-slot:general>
          <control-tile>
            <v-switch v-model="config.showPie"
                      color="green"
                      hide-details
                      :label="$t('controls.general.show_pie')" />
          </control-tile>

          <control-tile>
            <v-radio-group v-model="config.sortBy" :label="$t('controls.general.sort_by.title')" row hide-details>
              <v-radio :label="$t('controls.general.sort_by.none')" :value="null" />
              <v-radio :label="$t('controls.general.sort_by.frequency')" value="frequency" />
              <v-radio :label="$t('controls.general.sort_by.alphabet')" value="alphabet" />
            </v-radio-group>
          </control-tile>

          <control-tile>
            <v-radio-group v-model="config.yField.field" :label="$t('controls.general.yfield.title')" row hide-details>
              <v-radio :label="$t('controls.general.yfield.codes')" value="codes" />
              <v-radio :label="$t('controls.general.yfield.categories')" value="categories" />
              <v-radio :label="$t('controls.general.yfield.groups')" value="groups" />
            </v-radio-group>
          </control-tile>

          <control-tile class="overheight no-bg" v-show="config.yField.field === 'groups'">
            <code-groups v-model="config.yField.group"
                         :codes="codes" />
          </control-tile>
        </template>

        <template v-slot:value-axis>

          <control-tile>
            <v-switch v-model="config.percentages"
                      color="green"
                      :label="$t('controls.value_axis.percentages')"
                      hide-details
                      :disabled="config.yField.field === 'groups'" />

          </control-tile>
        </template>
      </control-pane>

      <slot name="datasets" slot="datasets" />

      <template v-slot:default="{ chartStyle }">
        <v-chart ref="chart"
                 v-if="initialReady"
                 :style="chartStyle"
                 v-bind="chartProps"
                 v-on="chartEvents" />
      </template>
    </chart-scaffold>
  </div>
</template>

<script>

import ChartScaffold from '@/components/visualize/ChartScaffold'
import CodeGroups from '@/components/visualize/CodeGroups'
import ControlPane from '@/components/visualize/ControlPane'
import ControlDrawer from '@/components/visualize/ControlDrawer'
import ControlTile from '@/components/visualize/ControlTile'

import { N_ROWS_KEY, chartMixin } from '@/mixins/chart'

import 'echarts/lib/chart/line'
import 'echarts/lib/chart/pie'

export default {
  codit: true,
  name: 'ChartLinePie',

  components: {
    'chart-scaffold': ChartScaffold,
    'code-groups': CodeGroups,
    'control-pane': ControlPane,
    'control-drawer': ControlDrawer,
    'control-tile': ControlTile
  },

  mixins: [chartMixin],

  data () {
    return {
      config: {
        // General
        title: undefined,
        yField: { field: 'categories', group: {} },
        sortBy: 'frequency',

        dimensions: undefined,
        showPie: true,

        // Color
        colorPalette: undefined,

        // Ordinal axis
        ordinalAxisName: 'Datasets',
        reverseOrdinal: undefined,

        // Value axis
        valueAxisName: undefined,

        percentages: true,

        // Labels
        maxLabelLength: undefined,

        // labelPosition: 'outside',
        // labelsTotal: false,

        // Outputs
        plotCodes: undefined
      },

      chartContainerWidth: 0,
      pieSeriesIdx: 0,
      fullscreen: false
    }
  },

  computed: {
    chartContainerStyle () {
      return {
        'min-width': this.config.dimensions.auto ? `${this.minContainerWidth}px` : '',
        'min-height': this.config.dimensions.auto ? `${this.minContainerHeight}px` : ''
      }
    },

    countGroupMapping () {
      return this.config.yField.group
    },

    /**
     * Makes sure codes of same category come after each other
     * performs all sorting if `plotCategories` is activated
     * @return {list} List of codes
     */
    codesSorted () {
      let codes = _.clone(this.codes)
      if (this.config.sortBy === 'alphabet') codes = _.orderBy(codes, c => c.label.toLowerCase())
      if (this.config.sortBy === 'frequency') codes = _.orderBy(codes, c => this.counts.codes[0][c.id], 'desc')
      return codes
    },

    codeCatsSorted () {
      let codeCats = _.clone(this.codeCats)
      if (this.config.sortBy === 'alphabet') codeCats = _.orderBy(codeCats, c => c.toLowerCase())
      if (this.config.sortBy === 'frequency') codeCats = _.orderBy(codeCats, c => this.counts.categories[0][c], 'desc')
      return codeCats
    },

    groupsSorted () {
      let groups = _.uniq(_.map(this.config.yField.group, (name, mapping) => name))
      if (this.config.sortBy === 'alphabet') groups = _.orderBy(groups, g => g.toLowerCase())
      if (this.config.sortBy === 'frequency') groups = _.orderBy(groups, c => this.counts.groups[0][c], 'desc')
      return groups
    },

    seriesNames () {
      let names
      switch (this.config.yField.field) {
        case 'codes':
          names = _.map(this.codesSorted, 'label')
          break
        case 'categories':
          names = this.codeCatsSorted
          break
        case 'groups':
          names = this.groupsSorted
          break
        default:
          throw Error(`Unknown yField ${this.config.yField}!`)
      }

      return _.map(names, this.maybeTruncateLabel)
    },

    chartDataset () {
      let dsNamesUsed = {}

      let header = ['yfield']
      let resCounts = _.map(this.seriesNames, c => [c])
      let resPercentages = _.map(this.seriesNames, c => [c])

      let maxLabelLength = Math.round((this.chartContainerWidth - 230) / (12 * this.datasets.length))

      this.datasets.forEach((ds, dsIdx) => {
        let dsName = this.maybeTruncateLabel(ds.settings.name, { maxLabelLength })
        if (dsName in dsNamesUsed) dsName = `${dsName} [${dsNamesUsed[dsName]++}]`
        else dsNamesUsed[dsName] = 1

        let nRows = this.counts.codes[dsIdx][N_ROWS_KEY]

        header.push(dsName)

        switch (this.config.yField.field) {
          case 'codes':
            this.codesSorted.forEach((code, codeIdx) => {
              let cc = this.counts.codes[dsIdx][code.id]
              resCounts[codeIdx].push(cc)
              resPercentages[codeIdx].push(Math.round(100 * cc / nRows))
            })
            break
          case 'categories':
            this.codeCatsSorted.forEach((category, codeIdx) => {
              let cc = this.counts.categories[dsIdx][category]
              resCounts[codeIdx].push(cc)
              resPercentages[codeIdx].push(Math.round(100 * cc / nRows))
            })
            break
          case 'groups':
            this.groupsSorted.forEach((group, codeIdx) => {
              let cc = this.counts.groups[dsIdx][group]
              resCounts[codeIdx].push(cc)
              resPercentages[codeIdx].push(Math.round(100 * cc / nRows))
            })
            break
          default:
            throw Error(`Unknown yField ${this.config.yField}!`)
        }
      })

      return { counts: [header].concat(resCounts), percentages: [header].concat(resPercentages) }
    },

    ordinalAxis () {
      return {
        type: 'category',
        name: this.config.ordinalAxisName,
        nameLocation: this.config.reverseOrdinal ? 'start' : 'end',
        nameTextStyle: { fontStyle: 'italic', color: 'grey', padding: [60, 0, 0, -15 - this.config.ordinalAxisName.length * 6] },
        inverse: this.config.reverseOrdinal,
        triggerEvent: true
      }
    },

    valueAxis () {
      return {
        name: this.config.valueAxisName,
        nameTextStyle: { fontStyle: 'italic', color: 'grey' },
        triggerEvent: true,
        gridIndex: 0,
        axisLabel: { formatter: (value) => `${Math.round(value)}${this.valueUnit}` }
      }
    },

    xAxis () {
      return this.ordinalAxis
    },

    yAxis () {
      return this.valueAxis
    },

    minContainerWidth () {
      return this.seriesNames.length * 18 + 100
    },

    minContainerHeight () {
      return this.grid.top + 150
    },

    nLegendRows () {
      return (8 * _.sumBy(this.seriesNames, c => c.length) + this.seriesNames.length * 20) / this.chartContainerWidth
    },

    legendHeight () {
      return Math.ceil(this.nLegendRows * 24) + 40
    },

    pieOffsetTop () {
      return this.legendHeight + (this.config.showPie ? 150 : 0)
    },

    valueUnit () { return this.config.percentages ? '%' : '' },

    grid () {
      return {
        top: this.pieOffsetTop + (this.config.showPie ? 1 : 0.5) * (this.fullscreen ? 200 : 150),
        left: 40 + (this.isHorizontal ? this.xLabelPadding : 0),
        bottom: 40 + (this.isVertical ? this.xLabelPadding : 0),
        right: 10
      }
    },

    series () {
      let series = _.map(this.chartDataset[this.config.percentages ? 'percentages' : 'counts'].slice(1), (ds, dsIdx) => ({
        type: 'line',
        smooth: true,
        seriesLayoutBy: 'row'
      }))

      if (this.config.showPie) {
        series.push({
          type: 'pie',
          id: 'pie',
          radius: '30%',
          center: ['50%', this.pieOffsetTop],
          label: {
            formatter: (el) => {
              let res = ''
              let cnt = this.chartDataset.counts[el.dataIndex + 1][this.pieSeriesIdx + 1]
              let perc = this.chartDataset.percentages[el.dataIndex + 1][this.pieSeriesIdx + 1]
              if (this.config.yField.field === 'codes') res += `${this.codesSorted[el.dataIndex].category} \n`
              res += `${el.name}: ${Math.round(cnt)} (${perc}%)`
              return res
            }
          },
          encode: {
            itemName: 'yfield',
            value: this.chartDataset.counts[0][this.pieSeriesIdx + 1],
            tooltip: this.chartDataset.counts[0][this.pieSeriesIdx + 1]
          }
        })
      }

      return series
    },

    title () {
      return {
        text: this.config.title,
        triggerEvent: true
      }
    },

    legend () {
      return {
        top: 30
      }
    },

    tooltip () {
      return {
        trigger: 'axis',
        showContent: true,
        confine: true
      }
    },

    chartOptions () {
      return {
        ...this.defaultOptions,
        dataset: { source: this.chartDataset[this.config.percentages ? 'percentages' : 'counts'] },
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        series: this.series,
        grid: this.grid,
        legend: this.legend,
        tooltip: this.tooltip,
        color: this.colors
      }
    }
  },

  watch: {
    initialReady: {
      immediate: false,
      handler () {
        setTimeout(() => {
          this.$refs.chart.chart.on('updateAxisPointer', this.setPieSeries)
        }, 100)
      }
    }
  },

  methods: {
    setPieSeries (event) {
      let xAxisInfo = event.axesInfo[0]
      if (xAxisInfo) {
        this.pieSeriesIdx = xAxisInfo.value
      }
    },

    chartClick ($evt) {
      let controlPaneHighlight = null
      switch ($evt.componentType) {
        case 'title':
          controlPaneHighlight = 'title'
          break
        case 'xAxis':
          if ($evt.targetType === 'axisName') controlPaneHighlight = 'ordinalAxisName'
          break
        case 'yAxis':
          if ($evt.targetType === 'axisName') controlPaneHighlight = 'valueAxisName'
          break
      }
      if (controlPaneHighlight) this.$refs['control-pane'].highlight(controlPaneHighlight)
    }
  }
}

</script>

<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
<i18n src='@/i18n/components/visualize/ChartLinePie.json'></i18n>
