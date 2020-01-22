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
            <v-radio-group v-model="config.groupBy.field" :label="$t('controls.general.group_by.title')" row hide-details>
              <v-radio :label="$t('controls.general.group_by.categories')" value="categories" />
              <v-radio :label="$t('controls.general.group_by.groups')" value="groups" />
            </v-radio-group>
          </control-tile>

          <control-tile class="overheight no-bg" v-show="config.groupBy.field === 'groups'">
            <code-groups v-model="config.groupBy.group"
                         :codes="codes" />
          </control-tile>
        </template>

        <template v-slot:labels>
          <control-tile>
            <v-switch v-model="config.percentages"
                      color="green"
                      :label="$t('controls.labels.percentages')"
                      hide-details />
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

import 'echarts/lib/chart/treemap'

export default {
  codit: true,
  name: 'ChartTreemap',

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
        groupBy: { field: 'categories', group: {} },

        dimensions: undefined,

        // Color
        colorPalette: undefined,

        // Labels
        percentages: false,

        // Outputs
        plotCodes: undefined
      },

      chartContainerWidth: 0,
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
      return this.config.groupBy.group
    },

    codesByGroup () { return _.groupBy(this.codes, c => this.config.groupBy.group[c.id]) },

    chartDataset () {
      if (!this.datasets.length) return []

      let childMapping = this.config.groupBy.field === 'categories' ? this.codesByCat : this.codesByGroup
      let res = []
      let nRows = this.counts.codes[0][N_ROWS_KEY]

      _.each(this.counts[this.config.groupBy.field][0], (gcnt, gname) => {
        if (gname in childMapping) {
          let children = childMapping[gname].map(code => ({
            value: this.counts.codes[0][code.id],
            perc: Math.round(100 * this.counts.codes[0][code.id] / nRows),
            name: code.label
          }))
          res.push({
            value: gcnt,
            perc: Math.round(100 * gcnt / nRows),
            name: gname,
            children
          })
        }
      })

      return res
    },

    series () {
      return {
        name: this.datasets[0].settings.name,
        width: '98%',
        height: '85%',
        type: 'treemap',
        top: 35,
        percentages: this.config.percentages, // required to make it responsive
        label: {
          show: true,
          formatter: (el) => el.data.name + (this.config.percentages ? `\n(${el.data.perc}%)` : '')
        },
        upperLabel: {
          normal: {
            show: true,
            height: 30
          }
        },
        levels: [{
          itemStyle: {
            normal: {
              borderWidth: 0,
              gapWidth: 5
            }
          },
          upperLabel: {
            normal: {
              show: false
            }
          }
        },
        {
          itemStyle: {
            normal: {
              gapWidth: 1,
              borderColorSaturation: 0.6,
              borderWidth: 10
            }
          },
          upperLabel: { fontWeight: '900' }
        },
        {
          itemStyle: {
            normal: {
              gapWidth: 1,
              borderColorSaturation: 0.6
            }
          }
        }],
        data: this.chartDataset
      }
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
        formatter: (el) => {
          let tt = ''
          if (el.treePathInfo.length > 2) tt = `${el.treePathInfo[1].name}<br />`
          tt += `${el.data.name}: ${Math.round(el.data.value)} (${el.data.perc}%)`
          return tt
        },
        confine: true
      }
    },

    chartOptions () {
      return {
        ...this.defaultOptions,
        series: this.series,
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

<style lang=scss>

</style>

<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
<i18n src='@/i18n/components/visualize/ChartTreemap.json'></i18n>
