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
            <v-radio-group v-model="config.plotValue" row hide-details>
              <template v-slot:label>
                <span>{{ $t('controls.general.plot_value.title') }}&nbsp;</span>
                <helptip position="bottom" :width="600">
                  <div v-html="$t('controls.general.plot_value.helptip', {
                    href_jaccard: 'https://en.wikipedia.org/wiki/Jaccard_index',
                    href_kulc: 'https://www.ibm.com/support/knowledgecenter/en/SSLVMB_22.0.0/com.ibm.spss.statistics.algorithms/alg_proximities_kulczynski2.htm'
                  })"/>
                </helptip>
              </template>

              <v-radio :label="$t('controls.general.plot_value.cooccurrences')" value="cooccurrences" />
              <v-radio :label="$t('controls.general.plot_value.jaccard')" value="jaccard" />
              <!-- <v-radio :label="$t('controls.general.plot_value.yule')" value="yule" /> -->
              <v-radio :label="$t('controls.general.plot_value.kulc')" value="kulc" />
            </v-radio-group>
          </control-tile>

          <control-tile>
            <v-slider :value="config.minEdgeThresh"
                      :max="maxCooccurrenceCount"
                      :min="0"
                      @input="setMinEdgeThreshDebounced"
                      thumb-label="always"
                      :step="1"
                      thumb-size="20"
                      :label="$t('controls.general.min_edge_value')"
                      dense
                      hide-details />
          </control-tile>

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

import 'echarts/lib/chart/graph'

export default {
  codit: true,
  name: 'ChartGraph',

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
        plotValue: 'kulc',
        minEdgeThresh: 0,
        dimensions: undefined,

        // Color
        colorPalette: undefined,

        // Labels
        maxLabelLength: 15,

        // Outputs
        plotCodes: undefined
      },

      chartContainerWidth: 0,
      fullscreen: false,

      setMinEdgeThreshDebounced: _.debounce(val => {
        this.config.minEdgeThresh = val
      }, 250)
    }
  },

  computed: {
    chartContainerStyle () {
      return {
        'min-width': this.config.dimensions.auto ? `${this.minContainerWidth}px` : '',
        'min-height': this.config.dimensions.auto ? `${this.minContainerHeight}px` : ''
      }
    },

    /**
     * Overrides the color palettes defined in chart mixin
     * We want the strong palette here, such that nodes are solid
     * @return {Object} Object with mapping of palette name -> palette
     */
    colorPalettes () {
      return { default: this.$color.paletteStrong, bold: this.colorPaletteBold, ...this.userColorPalettes }
    },

    /**
     * Custom group mapping used in computed property `count` in chart mixin
     */
    countGroupMapping () {
      return this.config.groupBy.group
    },

    /**
     * Get a list of unique group names from group mapping object
     * @return {Array} List of group names
     */
    groupNames () {
      return _.uniq(_.flatMap(this.config.groupBy.group))
    },

    /**
     * Mapping of group names to their unique index
     * @return {Object} Object with group names as keys and their index in `groupNames`` array as values
     */
    groupNamesToIdx () {
      let mapping = {}
      this.groupNames.forEach((gName, gIdx) => { mapping[gName] = gIdx })
      return mapping
    },

    codesByGroup () { return _.groupBy(this.codes, c => this.config.groupBy.group[c.id]) },

    maxCodeCount () {
      return _(this.counts.codes[0]).filter((val, key) => key !== N_ROWS_KEY).values().max()
    },

    codesSorted () {
      let codes = _.clone(this.codes)

      // Always order by code count globally first
      codes = _.orderBy(codes, c => this.counts.codes[0][c.id], 'desc')

      // Then group by the current groupBy variable
      let grouped
      switch (this.config.groupBy.field) {
        case 'categories':
          grouped = _.groupBy(codes, 'category')
          // Sort the categories by their cumulative count
          grouped = _.orderBy(grouped, (gList, gName) => this.counts.categories[0][gName], 'desc')
          break

        case 'groups':
          grouped = _.groupBy(codes, c => this.config.groupBy.group[c.id])
          // Sort the groups by their cumulative count
          grouped = _.orderBy(grouped, (gList, gName) => this.counts.groups[0][gName], 'desc')
          break
        default:
          throw Error(`Unrecognized grouping field ${this.config.groupBy.field}`)
      }

      codes = _.flatMap(grouped)

      return codes
    },

    /**
     * If the current grouping is by category or not
     * @return {Boolean}
     */
    isCategoryGrouped () {
      return this.config.groupBy.field === 'categories'
    },

    /**
     * The size of the biggest node, depending on the number of codes that we have to plot
     * @return {Number}
     */
    maxNodeSize () {
      return 60 * 20 / this.codes.length
    },

    /**
     * Create list of nodes
     * Every code has one node
     * @return {Array} Array of nodes
     */
    nodes () {
      let nRows = this.counts.codes[0][N_ROWS_KEY]

      return _.map(this.codesSorted, (code, codeIdx) => ({
        // Id needs to be string, identifies node for links
        id: String(code.id),
        // Truncated name, displayed as label
        name: this.maybeTruncateLabel(code.label),
        // Custom value: Untruncated name used for tooltip
        codeLabel: code.label,
        // Code count scaled such that largest node has value 75
        value: Math.max(this.maxNodeSize * this.counts.codes[0][code.id] / this.maxCodeCount, 10),
        // Same as value (both need to be set - symbolSize determines size of node and value determines distance to neighbours)
        symbolSize: Math.max(this.maxNodeSize * this.counts.codes[0][code.id] / this.maxCodeCount, 10),
        // Category needs to be integer value, which is then again mapped back to string in series definition
        category: this.isCategoryGrouped ? this.codeCats2CatIdx[code.category] : this.groupNamesToIdx[this.config.groupBy.group[code.id]],
        // Custom value: The category name used for tooltip
        categoryLabel: code.category,
        // Custom value: The unscaled counts used for tooltip
        cnt: this.counts.codes[0][code.id],
        // Custom value: The percentage used for tooltips
        perc: Math.round(100 * this.counts.codes[0][code.id] / nRows)
      }))
    },

    /**
     * The values of the edge links
     * Two dimensional array with link strength for every code pair
     * @return {Object} Object of links
     */
    edgeValues () {
      switch (this.config.plotValue) {
        case 'cooccurrences':
          return this.cooccurrences
        case 'jaccard':
          return this.jaccards
        case 'yule':
          return this.yulesYs
        case 'kulc':
          return this.kulczynski
        default:
          throw Error(`Unknown plotValue '${this.config.plotValue}`)
      }
    },

    /**
     * The maximum value of the edge link strenght
     * @return {Number}
     */
    maxEdgeValue () {
      return _(this.edgeValues).flatMap((val, key) => _.flatMap(val)).max()
    },

    /**
     * The maximum value of two codes' cooccurrences
     * @return {Number}
     */
    maxCooccurrenceCount () {
      return _(this.cooccurrences).flatMap((val, key) => _.flatMap(val)).max()
    },

    /**
     * Create list of links: A link is created for every pair of codes which has
     * a cooccurrence count >= config.minEdgeThresh
     * Links are created in both directions on purpose: This makes the edges
     * have colors mixed from both nodes.
     */
    links () {
      let links = []

      // Go through every code-code combination
      this.codes.forEach((code1, codeIdx1) => {
        this.codes.forEach((code2, codeIdx2) => {
          // Don't create links between one node
          if (codeIdx1 !== codeIdx2) {
            let edgeVal = this.edgeValues[code1.id][code2.id]
            if (this.cooccurrences[code1.id][code2.id] >= this.config.minEdgeThresh) {
              links.push({
                // ID of source node: Needs to be string value
                source: String(code1.id),
                // ID of target node: Needs to be string value
                target: String(code2.id),
                lineStyle: {
                  // Line width is corresponding to the number of cooccurrences,
                  // scaled such that the most important edge always has a value of 15
                  width: 15 * Math.abs(edgeVal) / this.maxEdgeValue,
                  color: this.config.plotValue === 'yule' ? edgeVal > 0 ? this.$color.soft.green : this.$color.soft.red : undefined
                }
              })
            }
          }
        })
      })

      return links
    },

    series () {
      return [{
        name: this.datasets.length ? this.datasets[0].settings.name : '',
        width: '60%',
        height: '45%',
        type: 'graph',
        layout: 'circular',
        nodes: this.nodes,
        links: this.links,
        // How much the nodes scale when zooming: 1.0 means they scale exactly as much as is zoomed
        nodeScaleRatio: 0.9,
        // Hover effect putting emphasis on specific nodes / links
        focusNodeAdjacency: true,
        categories: _.map((this.isCategoryGrouped ? this.codeCats : this.groupNames), cat => ({ name: cat })),
        circular: {
          // The label are displayed in star pattern
          rotateLabel: true
        },
        label: {
          normal: {
            show: true,
            position: 'right'
          }
        },
        // Allow panning and zooming
        roam: true,

        // For reference: The force settings, not relevant for circular mode
        force: {
          // repulsion: 500,
          initLayout: 'circular',
          // gravity: 2,
          repulsion: 500
          // edgeLength: [10, 100]
        },
        lineStyle: {
          normal: {
            // Always get the color from source, but as we plot both directions, the two edges
            // are overlayed and thus form the mixed color from source and destination
            color: 'source',
            curveness: 0.3,
            opacity: 0.3
          }
        }
      }]
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
          if (el.dataType === 'node') return `${el.data.categoryLabel}<br />${el.data.codeLabel}: ${Math.round(el.data.cnt)} (${el.data.perc}%)`
          else if (el.dataType === 'edge') {
            let c1 = this.codeID2Code[Number(el.data.source)]
            let c2 = this.codeID2Code[Number(el.data.target)]
            return `${c1.label} < > ${c2.label}: ${Math.round(this.cooccurrences[c1.id][c2.id])}`
          }
        },
        confine: true
      }
    },

    chartOptions () {
      return {
        ...this.defaultOptions,
        series: this.series,
        tooltip: this.tooltip,
        color: this.colors,
        legend: this.legend
      }
    }
  },

  watch: {
    initialReady: {
      immediate: false,
      handler () {
        setTimeout(() => {
          this.$refs.chart.chart.on('updateAxisPointer', this.setPieSeries)
          this.setInitialEdgeThresh()
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
      }
      if (controlPaneHighlight) this.$refs['control-pane'].highlight(controlPaneHighlight)
    },

    setInitialEdgeThresh () {
      this.config.minEdgeThresh = Math.round(this.maxCooccurrenceCount / 5)
    }
  }
}

</script>

<style lang=scss>

</style>

<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
<i18n src='@/i18n/components/visualize/ChartGraph.json'></i18n>
