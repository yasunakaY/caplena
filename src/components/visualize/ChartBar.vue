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
            <v-radio-group v-model="config.barOrientation" :label="$t('controls.general.bar_orientation.title')" row hide-details>
              <v-radio :label="$t('controls.general.bar_orientation.horizontal')" value="horizontal" />
              <v-radio :label="$t('controls.general.bar_orientation.vertical')" value="vertical" />
            </v-radio-group>
          </control-tile>

          <control-tile>
            <v-radio-group v-model="config.xField" :label="$t('controls.general.stack.title')" row hide-details>
              <v-radio :label="$t('controls.general.stack.codes')" value="codeLabel" />
              <v-radio :label="$t('controls.general.stack.category')" value="codeCategory" />
              <v-radio :label="$t('controls.general.stack.groups')" value="xFieldGroup" />
            </v-radio-group>
          </control-tile>

          <control-tile class="overheight no-bg" v-show="config.xField === 'xFieldGroup'">
            <code-groups v-model="config.xFieldGroup"
                         :codes="codes" />
          </control-tile>

          <control-tile v-if="datasets.length > 1">
            <v-switch v-model="config.stackDatasets"
                      color="green"
                      hide-details
                      :label="$t('controls.general.stack_datasets')" />
          </control-tile>
        </template>

        <template v-slot:labels>
          <control-tile>
            <v-radio-group v-model="config.labelPosition" :label="$t('controls.labels.label_position.title')" row hide-details>
              <v-radio :label="$t('controls.labels.label_position.dont_show')"
                       value="" />

              <v-tooltip bottom :disabled="!(maxStackDepth > 1 && !config.labelsTotal)">
                <template v-slot:activator="{ on }">
                  <div v-on="on">

                    <v-radio :label="$t('controls.labels.label_position.outside')"
                             value="outside"
                             :disabled="maxStackDepth > 1 && !config.labelsTotal" />
                  </div>
                </template>

                <span v-html="$t('controls.labels.tooltips.label_position_outside_disabled')" />
              </v-tooltip>

              <v-tooltip bottom :disabled="!config.labelsTotal">
                <template v-slot:activator="{ on }">
                  <div v-on="on">

                    <v-radio :label="$t('controls.labels.label_position.inside')"
                             value="inside"
                             :disabled="config.labelsTotal" />
                  </div>
                </template>
                <span v-html="$t('controls.labels.tooltips.label_position_inside_disabled')" />
              </v-tooltip>

            </v-radio-group>
          </control-tile>

          <control-tile>
            <v-tooltip bottom :disabled="!(maxStackDepth <= 1)">
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-switch v-model="config.labelsTotal"
                            color="green"
                            hide-details
                            :disabled="maxStackDepth <= 1"
                            :label="$t('controls.labels.labels_total')" />
                </div>
              </template>
              <span v-html="$t('controls.labels.tooltips.total_disabled')" />
            </v-tooltip>
          </control-tile>
        </template>

        <template v-slot:ordinal-axis>
          <control-tile>
            <v-tooltip bottom :disabled="!plotCategoriesDisabled">
              <template v-slot:activator="{ on }">
                <div v-on="on">

                  <v-switch v-model="config.plotCategories"
                            color="green"
                            :label="$t('controls.ordinal_axis.plot_categories')"
                            hide-details
                            :disabled="plotCategoriesDisabled" />
                </div>
              </template>

              <span v-html="$t('controls.ordinal_axis.tooltip_plot_categories_disabled')" />
            </v-tooltip>
          </control-tile>

          <control-tile>
            <v-radio-group v-model="config.sortOrdinalBy" :label="$t('controls.ordinal_axis.sort_by.title')" row hide-details>
              <v-radio :label="$t('controls.ordinal_axis.sort_by.none')" :value="null" />
              <v-radio :label="$t('controls.ordinal_axis.sort_by.frequency')" value="frequency" />
              <v-radio :label="$t('controls.ordinal_axis.sort_by.alphabet')" value="alphabet" />
            </v-radio-group>
          </control-tile>
        </template>

        <template v-slot:value-axis>

          <control-tile>
            <v-tooltip bottom :disabled="!(maxStackDepth > 1)">
              <template v-slot:activator="{ on }">
                <div v-on="on">

                  <v-switch v-model="config.percentages"
                            color="green"
                            :label="$t('controls.value_axis.percentages')"
                            hide-details
                            :disabled="maxStackDepth > 1" />
                </div>
              </template>

              <span v-html="$t('controls.value_axis.tooltip_percentages_disabled')" />
            </v-tooltip>

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

    <v-dialog v-model="showStackChangeWarning"
              v-if="!hideControls"
              content-class="chart-overlay-warning"
              @keydown.esc="showStackChangeWarning = false">

      <alert type="warning">{{ $t('stack_warning.alert') }}</alert>

      <div class="warning-content">
        <div>
          <div class="title" v-html="$t('stack_warning.standalone.title')" />
          <div v-html="$t('stack_warning.standalone.description')" />
        </div>

        <v-icon class="mdi" :class="{ [showStackChangeWarning === 'stack' ? 'mdi-arrow-right' : 'mdi-arrow-left']: true }" />

        <div>
          <div class="title" v-html="$t('stack_warning.stacked.title')" />
          <div v-html="$t('stack_warning.stacked.description')" />
        </div>

        <div class="example">
          <em>{{ $t('stack_warning.example.intro') }}</em>
          <code-chip :color="$color.getMedium(0)"
                     :category="$t('stack_warning.example.category')"
                     active>{{ $t('stack_warning.example.code1') }}</code-chip>
          <code-chip :color="$color.getMedium(0)"
                     :category="$t('stack_warning.example.category')"
                     active>{{ $t('stack_warning.example.code2') }}</code-chip>
          <em>{{ $t('stack_warning.example.outro') }}</em> <span class="label">{{ $t('stack_warning.example.category') }}</span>
        </div>

        <div class="how-often">
          <code>{{ $t('stack_warning.standalone.how_often') }}</code>
        </div>

        <v-icon class="mdi" :class="{ [showStackChangeWarning === 'stack' ? 'mdi-arrow-right' : 'mdi-arrow-left']: true }" />

        <div class="how-often">
          <code>{{ $t('stack_warning.stacked.how_often') }}</code>
        </div>

        <span style="flex: 0 0 100%; display: flex"><v-spacer />
          <v-btn @click="showStackChangeWarning = false" style="margin: 0 0 10px">{{ $t('stack_warning.btn_got_it') }}</v-btn>
        </span>
      </div>
    </v-dialog>
  </div>
</template>

<script>

import ChartScaffold from '@/components/visualize/ChartScaffold'
import CodeGroups from '@/components/visualize/CodeGroups'
import ControlPane from '@/components/visualize/ControlPane'
import ControlDrawer from '@/components/visualize/ControlDrawer'
import ControlTile from '@/components/visualize/ControlTile'

import { N_ROWS_KEY, chartMixin } from '@/mixins/chart'

import 'echarts/lib/chart/bar'

const CODE_SPLIT_TOK = '-&/_&/_-'

const ICON_PLUS_SVG = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' style=\'width:24px;height:24px\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5C3,3.89 3.9,3 5,3H19M11,7H13V11H17V13H13V17H11V13H7V11H11V7Z\' /%3E%3C/svg%3E'
const ICON_MINUS_SVG = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' style=\'width:24px;height:24px\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5C3,3.89 3.9,3 5,3H19M17,11V13H7V11H17Z\' /%3E%3C/svg%3E'

export default {
  codit: true,
  name: 'ChartBar',

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
        barOrientation: 'horizontal',
        xField: 'codeLabel',
        xFieldGroup: {},
        stackDatasets: false,
        dimensions: undefined,

        // Color
        colorBy: undefined,
        colorPalette: undefined,

        // Ordinal axis
        ordinalAxisName: 'Codes',

        plotCategories: true,
        reverseOrdinal: undefined,
        sortOrdinalBy: 'frequency',

        // Value axis
        valueAxisName: undefined,

        percentages: false,

        // Labels
        maxLabelLength: undefined,

        labelPosition: 'outside',
        labelsTotal: false,

        // Outputs
        plotCodes: undefined,

        // Expansion of categories
        categoriesExpanded: {}
      },

      showStackChangeWarning: false
    }
  },

  computed: {
    chartContainerStyle () {
      return {
        'min-height': this.isHorizontal && this.config.dimensions.auto ? `${this.minCategoryDimSize}px` : '',
        'min-width': this.isVertical && this.config.dimensions.auto ? `${this.minCategoryDimSize}px` : ''
      }
    },

    /**
     * Makes sure codes of same category come after each other
     * performs all sorting if `plotCategories` is activated
     * @return {list} List of codes
     */
    codesSorted () {
      let codes = _.clone(this.codes)

      // Only responsible for sorting if plotCategories is enabled
      // otherwise sorting happens in `ordinalClassesSorted` getter
      if (this.config.sortOrdinalBy === 'frequency') codes = _.orderBy(codes, c => this.counts.codes[0][c.id], 'desc')
      if (this.config.sortOrdinalBy === 'alphabet') codes = _.orderBy(codes, c => c.label.toLowerCase(), 'asc')

      if (this.config.colorBy.field === 'codeCategory' || this.config.plotCategories) {
        let grouped = _.groupBy(codes, 'category')
        if (this.config.plotCategories) {
          if (this.config.sortOrdinalBy === 'frequency') grouped = _.orderBy(grouped, g => this.counts.categories[0][g[0].category], 'desc')
          if (this.config.sortOrdinalBy === 'alphabet') grouped = _.orderBy(grouped, g => g[0].category.toLowerCase(), 'asc')
        }
        codes = _.flatMap(grouped)
      }

      return codes
    },

    isHorizontal () { return this.config.barOrientation === 'horizontal' },
    isVertical () { return this.config.barOrientation === 'vertical' },

    chartDataset () {
      let res = []
      let prevCat = null

      let dsNamesUsed = {}

      this.datasets.forEach((ds, dsIdx) => {
        let dsName
        if (ds.settings.name in dsNamesUsed) dsName = `${ds.settings.name} [${dsNamesUsed[ds.settings.name]++}]`
        else (dsNamesUsed[ds.settings.name] = 1) && (dsName = ds.settings.name)

        let nRows = this.counts.codes[dsIdx][N_ROWS_KEY]
        this.codesSorted.forEach(code => {
          if (this.config.plotCategories && code.category !== prevCat) {
            // Only add the code categories if configs say we should, and if this is an unseen category
            let catIcon = _.get(this.config.categoriesExpanded, code.category) ? 'min' : 'pls'
            let entry = {
              codeID: -100,
              codeLabel: `CAT${CODE_SPLIT_TOK}{${catIcon}|} ${code.category}`,
              codeCategory: code.category,
              count: this.counts.categories[dsIdx][code.category],
              perc: Math.round(100 * this.counts.categories[dsIdx][code.category] / nRows),
              isCategory: true,
              dsName: dsName,
              dsIdx
            }

            entry.x = entry[this.config.xField]

            res.push(entry)
            prevCat = code.category
          }

          // Push the codes if the category is expanded
          if (_.get(this.config.categoriesExpanded, code.category) || !this.config.plotCategories) {
            let entry = {
              codeID: code.id,
              codeLabel: `${code.id}${CODE_SPLIT_TOK}{cod|${code.label}}`,
              codeLabelOrig: code.label,
              codeCategory: code.category,
              xFieldGroup: this.config.xFieldGroup[code.id],
              colorByGroup: this.config.colorBy.group[code.id],
              count: this.counts.codes[dsIdx][code.id],
              perc: Math.round(100 * this.counts.codes[dsIdx][code.id] / nRows),
              isCategory: false,
              dsName: dsName,
              itemStyle: { opacity: this.config.plotCategories && this.config.colorBy.field === 'codeCategory' ? 0.7 : 1.0 },
              dsIdx
            }

            entry.x = entry[this.config.xField]
            res.push(entry)
          }
        })
      })

      if (this.doInternalReverse) res.reverse()

      return res
    },

    chartDatasetsGrouped () {
      return _(this.chartDataset)
        .groupBy(row => row.dsName + (this.config.stackBy !== null ? String(row[this.config.stackBy]) : ''))
        .map((val, key) => ({ source: val }))
        .value()
    },

    ordinalClasses () {
      return _.uniq(_.map(this.chartDataset, 'x'))
    },

    doInternalReverse () {
      return (!this.config.reverseOrdinal && this.isHorizontal) || (this.config.reverseOrdinal && this.isVertical)
    },

    ordinalClassesSorted () {
      // When plotting the categories, sorting here doesn't work
      // there won't be any stacks in this case anyways
      // Sorting will be applied in the `chartDataset` getter
      if (this.maxStackDepth <= 1) return this.classes

      let classes = _.clone(this.ordinalClasses)
      if (this.config.sortOrdinalBy === 'alphabet') classes = _.sortBy(this.ordinalClasses, c => c.toLowerCase())
      if (this.config.sortOrdinalBy === 'frequency') classes = _.orderBy(this.ordinalClasses, c => this.stacksInfo[c][0].sum, 'desc')

      return this.doInternalReverse ? classes.reverse() : classes
    },

    colorClasses () {
      let classes = _.uniq(_.map(this.chartDataset, this.config.colorBy.field))
      if (this.doInternalReverse) classes.reverse()
      if (this.maxStackDepth > 1) classes = _.orderBy(classes)
      return classes
    },

    ordinalAxis () {
      return {
        type: 'category',
        name: this.config.ordinalAxisName,
        axisTick: {
          show: false
        },

        triggerEvent: true,

        data: this.ordinalClassesSorted,
        nameTextStyle: { fontStyle: 'italic', color: 'grey' },

        axisLabel: {
          show: true,
          rotate: (this.isVertical ? 90 : 0),
          align: 'right',
          interval: 0,
          rich: {
            // It's important that all rich elements have the same tag name length
            // as this is take into consideration when computing the correct padding
            cod: {
              color: '#666'
            },
            pls: {
              height: 14,
              width: 14,
              align: 'right',
              verticalAlign: 'top',
              backgroundColor: {
                image: ICON_PLUS_SVG
              }
            },
            min: {
              height: 14,
              width: 14,
              align: 'right',
              verticalAlign: 'top',
              backgroundColor: {
                image: ICON_MINUS_SVG
              }
            }
          },

          formatter: (lbl) => this.maybeTruncateLabel(
            // For stacking reasons, we have concatenated the ID with the code label
            // (as code labels might be identical for different codes)
            // Now separate them again to only get the code labels
            this.config.xField === 'codeLabel' ? lbl.split(CODE_SPLIT_TOK)[1] : lbl,
            // Also, there is extra formatting in the codeLabels for the codes
            // Add that to the maximum label length that is allowed
            (this.config.xField === 'codeLabel') && { maxLabelLength: this.config.maxLabelLength + 5 + lbl.startsWith('CAT') * 2 }
          )
        }
      }
    },

    valueField () { return this.config.percentages ? 'perc' : 'count' },
    valueUnit () { return this.config.percentages ? '%' : '' },

    chartDatasetsStacked () {
      return _.groupBy(this.chartDataset, row => row.x + String(row.isCategory) + row[this.config.stackDatasets ? '.' : 'dsIdx'])
    },

    maxStackDepth () {
      if (!this.initialReady) return 1
      return _(this.chartDatasetsStacked).map((val, key) => val.length).max()
    },

    stacksInfo () {
      let res = {}
      _.each(this.chartDatasetsStacked, (val, key) => {
        let dsIdx = this.config.stackDatasets ? 0 : val[0].dsIdx
        res[val[0].x] || (res[val[0].x] = {})
        res[val[0].x][dsIdx] = {
          sum: _.sumBy(val, this.valueField),
          cnt: val.length,
          lastCodeID: val.slice(-1)[0].codeID }
      })
      return res
    },

    maxVal () {
      return _.max(_.flatMap(this.stacksInfo, o => _.flatMap(o, v => v.sum)))
    },

    valueAxis () {
      return {
        name: this.config.valueAxisName,
        nameTextStyle: { fontStyle: 'italic', color: 'grey' },
        type: 'value',
        max: this.maxVal,
        triggerEvent: true,
        axisLabel: { formatter: (value) => `${Math.round(value)}${this.config.percentages ? ' %' : ''}` }
      }
    },

    xAxis () {
      let axis = (this.isVertical ? this.ordinalAxis : this.valueAxis)
      return {
        ...axis,
        nameLocation: 'end',
        nameTextStyle: { ...axis.nameTextStyle, padding: [60, 0, 0, -15 - axis.name.length * 6] }
      }
    },

    yAxis () {
      return this.isHorizontal ? this.ordinalAxis : this.valueAxis
    },

    minCategoryDimSize () {
      let nCategories = _.uniq(_.map(this.chartDataset, 'x')).length
      let barsPerGroup = this.chartDatasetsGrouped.length
      return nCategories * (10 + barsPerGroup * 8) + this.nLegendRows * 24 + 100
    },

    nLegendRows () {
      return (8 * _.sumBy(this.colorClasses, c => this.legendLabelFormatter(c).length) + this.colorClasses.length * 20) / this.chartContainerWidth
    },

    visualMap () {
      return {
        orient: 'horizontal',
        calculable: true,
        show: true,
        horizontal: true,
        left: 'center',
        top: 0,
        padding: [(this.hideControls ? 5 : 30), 0],
        categories: this.colorClasses,
        dimension: this.config.colorBy.field,
        inRange: {
          color: this.colors
        },

        formatter: this.legendLabelFormatter
      }
    },

    grid () {
      return {
        top: Math.ceil(this.nLegendRows * 24) + (this.hideControls ? 45 : 70),
        left: 15,
        bottom: 18,
        right: 10,
        containLabel: true
      }
    },

    barWidthEstimation () {
      return this.chartContainerWidth - this.grid.left - 0.1 * this.chartContainerWidth
    },

    series () {
      return _.map(this.chartDatasetsGrouped, (ds, dsIdx) => ({
        type: 'bar',
        top: 30,
        barGap: '10%',
        name: dsIdx,
        encode: {
          y: (this.isVertical ? this.valueField : 'x'),
          x: (this.isVertical ? 'x' : this.valueField)
        },

        __onlyNecessaryForReactivity: [this.config.labelsTotal],

        label: {
          normal: {
            show: !!this.config.labelPosition,
            position: this.config.labelPosition === 'inside' && this.isVertical ? 'insideTop'
              : this.config.labelPosition === 'inside' && this.isHorizontal ? 'insideRight'
                : this.config.labelPosition === 'outside' && this.isVertical ? 'top'
                  : this.config.labelPosition === 'outside' && this.isHorizontal ? 'right' : '',
            rotate: this.isVertical ? 90 : 0,
            offset: this.isVertical ? this.config.labelPosition === 'outside' ? [5, 0] : [-7, 0] : undefined,
            fontSize: 9,
            distance: this.isVertical ? 12 : 0,
            padding: [2, 3],
            color: this.config.labelsTotal ? '#000' : undefined,
            formatter: (params) => {
              let val = Math.round(params.data[this.valueField])
              let stackInfo = this.stacksInfo[params.data.x][this.config.stackDatasets ? 0 : params.data.dsIdx]
              if (this.config.labelsTotal) return params.data.codeID === stackInfo.lastCodeID ? Math.round(stackInfo.sum) + this.valueUnit : ''
              else return (params.data[this.valueField] / this.maxVal * this.barWidthEstimation > 20 || this.config.labelPosition === 'outside' ? val + this.valueUnit : '')
            }
          }
        },

        datasetIndex: dsIdx,
        stack: (this.config.xField !== 'codeLabel' || this.config.stackDatasets
          ? this.config.stackDatasets ? 'stack' : String(ds.source[0].dsIdx) : null),

        tooltip: {
          confine: true,
          formatter (el) {
            let res = `${el.value.dsName}<br />${el.value.codeCategory}`
            if (!el.value.isCategory) res += ` | ${el.value.codeLabelOrig}`
            res += `: ${Math.round(el.value.count)} (${el.value.perc}%)`
            return res
          }
        }
      }))
    },

    plotCategoriesDisabled () {
      return ['codeCategory', 'xFieldGroup'].indexOf(this.config.xField) !== -1 || this.config.colorBy.field === 'colorByGroup'
    },

    title () {
      return {
        text: this.config.title,
        triggerEvent: true
      }
    },

    chartOptions () {
      return {
        ...this.defaultOptions,
        dataset: this.chartDatasetsGrouped,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        series: this.series,
        grid: this.grid,
        visualMap: this.visualMap
      }
    }
  },

  watch: {
    'config.xField' (val) {
      if (this.plotCategoriesDisabled) this.config.plotCategories = false
      if (val === 'codeCategory') this.config.colorBy.field = 'codeLabel'
    },

    'config.labelsTotal' (val) {
      if (val) this.config.labelPosition = 'outside'
      if (!val && this.maxStackDepth > 1 && this.config.labelPosition === 'outside') this.config.labelPosition = 'inside'
    },

    'config.colorBy.field' (val) { if (val === 'colorByGroup') this.config.plotCategories = false },

    'maxStackDepth' (val, oldVal) {
      if (val > 1 && !this.config.labelsTotal) {
        this.config.labelPosition = 'inside'
        this.config.percentages = false
      }

      if (val <= 1) this.config.labelsTotal = false

      if (oldVal === 1 && val > 1) this.showStackChangeWarning = 'stack'
      if (oldVal > 1 && val === 1) this.showStackChangeWarning = 'unstack'
    }
  },

  methods: {
    legendLabelFormatter (lbl) {
      // For the code labels, we have to do some ugly hacking to get the nicely formatted code name back:
      // Remove all rich text formatting and separate by the code splitter
      let lblCleaned = lbl.match(`^[0-9]+${CODE_SPLIT_TOK}{cod\\|(.*)}$`, 'g')
      return this.maybeTruncateLabel(
        this.config.colorBy.field === 'codeLabel' ? lblCleaned ? lblCleaned[1] : lbl : lbl
      )
    },

    /**
     * Check if the user clicked on a category. If yes, toggle its visibility
     * @param  {String} target The label of the ordinal axis value item that was clicked
     */
    maybeToggleEntry (target) {
      // Split the label into the type (CAT or code ID) and the rest
      let [type, value] = target.split(CODE_SPLIT_TOK)
      if (type === 'CAT') {
        // If it's the category, remove the icon to get the categories real name
        value = value.split('|} ')[1]
        // Toggle the value of the value in the categoriesExpanded array
        if (_.get(this.config.categoriesExpanded, value)) this.config.categoriesExpanded[value] = false
        else this.$set(this.config.categoriesExpanded, value, true)
      }
    },

    chartClick ($evt) {
      let controlPaneHighlight = null
      switch ($evt.componentType) {
        case 'title':
          controlPaneHighlight = 'title'
          break
        case 'xAxis':
          if ($evt.targetType === 'axisName') controlPaneHighlight = this.isVertical ? 'ordinalAxisName' : 'valueAxisName'
          if ($evt.targetType === 'axisLabel' && this.isVertical) this.maybeToggleEntry($evt.value)
          break
        case 'yAxis':
          if ($evt.targetType === 'axisName') controlPaneHighlight = this.isHorizontal ? 'ordinalAxisName' : 'valueAxisName'
          if ($evt.targetType === 'axisLabel' && this.isHorizontal) this.maybeToggleEntry($evt.value)
          break
      }
      if (controlPaneHighlight) this.$refs['control-pane'].highlight(controlPaneHighlight)
    }
  }
}

</script>

<style lang=scss>

@keyframes slide-in-left-opacity {
    0% {
      transform: translateX(-200px);
      opacity: 0;
    }

    15% {
      opacity: 0.1;
    }

    30% {
      transform: translateX(0);
      opacity: 0.9;
    }

    100% {
    }
}

@keyframes slide-in-right-opacity {
    0% {
      transform: translateX(200px);
      opacity: 0;
    }

    15% {
      opacity: 0.1;
    }

    30% {
      transform: translateX(0);
      opacity: 0.9;
    }

    100% {
    }
}

.chart-overlay-warning {
  width: 850px;
  overflow: hidden;
  background: #FFF;

  .warning-content {
    display: flex;
    flex-wrap: wrap;
    font-size: 14px;
    padding: 0 15px;
    > div {
      flex: 1;
      background: #EEE;
      border-radius: 3px;
      padding: 12px 16px;
      margin-bottom: 12px;
      .title { margin-bottom: 5px }
    }

    .v-icon {
      flex: 0 0 auto;
      margin: 0 10px;
      font-size: 36px;
      color: var(--v-accent-darken1);
      animation: 2s cubic-bezier(0, 0, 0.1, 1.4) infinite;

      &.mdi-arrow-right {
        animation-name: slide-in-left-opacity;
      }

      &.mdi-arrow-left {
        animation-name: slide-in-right-opacity;
      }

    }

    .example {
      flex: 100%;
      text-align: center;
    }

    .codes-example {
      text-align: center;
    }

    .how-often {
      background: none;
      text-align: center;
      font-size: 24px;
    }
  }
}

</style>

<i18n src='@/i18n/components/visualize/ChartBar.json'></i18n>
<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
