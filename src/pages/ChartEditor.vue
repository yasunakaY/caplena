<template>
  <div class="main-content chart-editor">
    <alert v-if="status.loadingFailed || (datasets.length && datasets[0].status.failed)" type="error">
      <span v-html="this.$t('error', {'step': this.$t('loading.while')})" />
    </alert>

    <loading v-else-if="status.loading"
             :is-loading="true"
             :dont-animate-entry="true"
             :title="$t('loading.title')"
             min-height="300px"
             tagline="" />

    <template v-else-if="chart.type === null">
      <!-- CHART SELECTOR -->
      <div v-if="chart.type === null" class="chart-selector" :class="{ fresh: status.fresh }">
        <v-card v-for="(props, type) in availableCharts"
                :key="type"
                @click="selectChartType(type)"
                class="chart-config-el"
                :class="{ selected: chart.typeSelection === type }">
          <v-card-title>
            <div class="title">{{ $t(`chart.types.${type}.title`) }}: {{ $t(`chart.types.${type}.slogan`) }}</div>
            <div class="subtitle">{{ $t(`chart.types.${type}.subtitle`) }}</div>
          </v-card-title>
          <v-responsive class="tile-img-container">
            <img :src="getChartTileImage(type)">
          </v-responsive>
        </v-card>
      </div>

      <!-- TEMPLATE SELECTOR -->
      <loading v-if="chart.typeSelection"
               :is-loading="chart.typeSelection && !firstDatasetLoaded"
               :dont-animate-entry="true"
               :title="$t('loading.title')"
               min-height="300px"
               tagline="">
        <div class="template-selector" v-if="templates.length">
          <v-card class="chart-config-el" >
            <v-card-title>
              <div class="title">{{ $t('templates.title') }}</div>
              <div class="subtitle">{{ $t('templates.subtitle') }}</div>
            </v-card-title>
            <v-card-text>
              <v-list two-line>
                <v-list-item v-for="(template, templateIdx) in templates" :key="templateIdx" @click="selectTemplate(template)">
                  <v-list-item-avatar>
                    {{ templateIdx + 1 }}
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title v-html="template.title" />
                    <v-list-item-subtitle v-html="template.subtitle" />
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-icon>mdi-chevron-right</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </v-list>

            </v-card-text>
          </v-card>
        </div>
      </loading>
    </template>

    <component v-else
               :is="`chart-${chart.type}`"
               v-model="chart.config"
               :read-only="status.readOnly"
               :datasets="datasets">
      <template v-slot:actions>
        <alert type="error" v-if="status.savingFailed">
          {{ $t('error', {'step': $t('save.saving')}) }}
        </alert>
        <div style="display: flex">
          <v-text-field v-model="chart.name"
                        :label="$t('chart_name.label')"
                        :error="!chart.name.length"
                        counter
                        maxlength="50"
                        hide-details
                        outlined />

          <div style="display: flex; margin-left: 12px">
            <v-tooltip bottom :disabled="!status.readOnly">
              <template v-slot:activator="{ on }">
                <div v-on="on" style="flex: 1; display: flex">
                  <v-btn color="primary"
                         @click="save"
                         :error="status.savingFailed"
                         :loading="status.saving"
                         :disabled="status.readOnly || status.saving || !status.isDirty || !chart.name.length"
                         style="margin-right: 6px; height: auto">{{ $t('save.title') }}</v-btn>
                </div>
              </template>
              <span v-html="$t('controls.warning_read_only')" />
            </v-tooltip>

            <v-menu v-if="$route.params.id && $route.params.id !== 'new'"
                    v-model="versions.active"
                    min-width="350"
                    dense
                    bottom
                    offset-y
                    content-class="allow-overflow"
                    left>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" tile icon style="border-radius: 4px; height: auto"><v-icon>mdi-history</v-icon></v-btn>
              </template>
              <v-subheader>
                {{ $t('history.title') }}&nbsp;
                <helptip position="bottom" :width="650" style="font-weight: normal">
                  <span v-html="$t('history.helptip')" />
                </helptip>
              </v-subheader>
              <v-divider />

              <alert v-if="versions.failed" type="error">
                <span v-html="this.$t('error', {'step': this.$t('loading.while')})" />
              </alert>

              <div v-if="versions.loading" style="display: flex; justify-content: center; margin: 16px 0">
                <v-progress-circular size="34"
                                     width="5"
                                     indeterminate
                                     color="primary" />
              </div>

              <v-list v-else>
                <v-list-item v-for="(v, idx) in versions.items" :key="idx" @click="selectVersion(v)">
                  <v-list-item-title>
                    {{ v.created | datetimeverbose }}
                    <small v-if="idx === 0">({{ $t('history.current') }})</small>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

          </div>
        </div>
        <v-divider style="margin: 12px 0" />
      </template>

      <template v-slot:datasets>
        <v-divider style="margin: 24px 0 0" />
        <v-subheader style="">
          {{ $t('ds.title') }}&nbsp;
          <helptip position="bottom" :width="650" style="font-weight: normal">
            <span v-html="$t('ds.helptip')" />
          </helptip>
          <v-spacer />
          <v-btn small outlined style="margin:0" @click="masterDataset.active = true">{{ $t('ds.show_master') }}</v-btn>
        </v-subheader>

        <draggable v-model="datasets" group="datasets" handle=".draggable" :animation="150">
          <dataset v-for="(ds, idx) in datasets"
                   :settings.sync="ds.settings"
                   :filters.sync="ds.filters"
                   :key="ds.id"
                   :question="ds.question"
                   :answers="ds.answers"
                   :status="ds.status"
                   :draggable="datasets.length > 1"
                   :deletable="availableCharts[chart.type].allowMultiDataset && datasets.length > 1"
                   duplicatable
                   @result="$set(ds, 'result', $event)"
                   @delete="deleteDataset(idx)"
                   @duplicate="duplicateDataset(idx)"
                   @dirty="ds.status.dirty = $event" />
        </draggable>

        <v-btn v-if="availableCharts[chart.type].allowMultiDataset"
               @click="openQuestionSelect"
               depressed
               small
               style="margin: 0; width: 100%">
          <v-icon>mdi-plus</v-icon>
          {{ $t('ds.add') }}
        </v-btn>

      </template>
    </component>

    <v-dialog v-model="masterDataset.active"
              max-width="700"
              allow-overflow
              content-class="master-dataset-dialog"
              @keydown.esc="masterDataset.active = false">
      <div class="chart-editor" style="background: #FFF; padding: 8px; min-height: 500px; display: flex; flex-direction: column" v-if="masterDataset.active">
        <dataset :settings.sync="masterDataset.settings"
                 :filters.sync="masterDataset.filters"
                 :question="masterDatasetQuestion"
                 is-master />

        <v-spacer />
        <div style="display: flex;">
          <v-spacer />
          <v-btn color="accent" @click="applyMaster">{{ $t('ds.apply_master') }}</v-btn>
          <v-btn @click="masterDataset.active = false">{{ $t('close') }}</v-btn>
        </div>
      </div>
    </v-dialog>

    <v-dialog v-model="questionSelect.active"
              max-width="100%"
              @keydown.esc="closeQuestionSelect(false)"
              :persistent="!datasets.length"
              content-class="project-selector">
      <v-card v-if="questionSelect.active">
        <v-card-title class="headline" v-html="$t('question_select.title')" />

        <v-card-text>

          <project-list :projects="projects"
                        :loading="questionSelect.loading"
                        :project-to-focus="questionSelect.initialProjectFocus"
                        :hide-columns="{nanswers: true, last_modified: true}"
                        search-filter-enable
                        labels-filter-enable
                        hide-incomplete-filter-enable
                        :rows-per-page-options="[5]"
                        :rows-per-page-default="5"
                        in-dialog
                        ref="projectList">

            <template slot="action" slot-scope="{ question }">
              <v-btn outlined color="primary" @click="closeQuestionSelect(question)">{{ $t('question_select.select') }}</v-btn>
            </template>
          </project-list>
        </v-card-text>

        <v-spacer />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary"
                 outlined
                 :disabled="!datasets.length"
                 @click.native="closeQuestionSelect(false)">{{ $t('cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
// import tour from '../mixins/tour.js'

import axios from 'axios'

import Dataset from '@/components/visualize/Dataset'
import ChartBar from '@/components/visualize/ChartBar'
import ChartLinePie from '@/components/visualize/ChartLinePie'
import ChartTreemap from '@/components/visualize/ChartTreemap'
import ChartGraph from '@/components/visualize/ChartGraph'
import ProjectList from '@/components/ProjectList'
import ProjectListMixin from '@/mixins/ProjectList'
import Draggable from 'vuedraggable'

import {
  QUESTION_CATEGORY_LIST, CHART_TYPES_TO_API_ENUM, /* CHART_TYPES, */
  CHART_TYPE_BAR, CHART_TYPE_LINE_PIE, CHART_TYPE_TREEMAP, CHART_TYPE_GRAPH,
  DS_FILTERS_TEMPLATE, DS_SETTINGS_TEMPLATE
} from '@/settings/constants'

export default {
  codit: true,
  name: 'ChartEditor',
  components: {
    'project-list': ProjectList,
    'dataset': Dataset,
    'draggable': Draggable,
    [`chart-${CHART_TYPE_BAR}`]: ChartBar,
    [`chart-${CHART_TYPE_LINE_PIE}`]: ChartLinePie,
    [`chart-${CHART_TYPE_TREEMAP}`]: ChartTreemap,
    [`chart-${CHART_TYPE_GRAPH}`]: ChartGraph
  },
  mixins: [ProjectListMixin],

  beforeRouteLeave (to, from, next) {
    let doIt = true
    // If there is an active chart, confirm navigating away
    if (this.chart.type && this.status.isDirty) doIt = confirm(this.$t('confirm_navigate_away'))
    next(doIt)
  },

  beforeRouteUpdate (to, from, next) {
    let doIt = true
    // If there is an active chart, confirm navigating away
    if (!this.status.programmaticRouteChange && this.chart.type && this.status.isDirty) doIt = confirm(this.$t('confirm_navigate_away'))
    next(doIt)
    if (doIt) this.setupInternalStateAfterNavigation(to.params, to.query)
  },

  data () {
    return {
      questionSelect: {
        active: false,
        loading: true,
        initialProjectFocus: undefined
      },

      projects: [],

      cache: {},

      datasets: [],
      masterDataset: {
        active: false,
        settings: _.cloneDeep(DS_SETTINGS_TEMPLATE),
        filters: []
      },

      chartTemplate: {
        id: 0,
        name: this.$t('chart_name.default'),
        type: null,
        typeSelection: null,
        config: {}
      },

      chart: {},

      versions: {
        active: false,
        items: [],
        loading: false,
        failed: false
      },

      status: {
        isDirty: false,
        saving: false,
        savingFailed: false,
        programmaticRouteChange: false,
        loadingFailed: false,
        loading: false,
        initialLoadingCompleted: false,
        readOnly: false,
        fresh: true
      },

      dsIDHead: 0,

      templates: [],

      availableCharts: {
        [CHART_TYPE_BAR]: { allowMultiDataset: true, templates: { inherit: true, auxiliary: true, sentiment: true } },
        [CHART_TYPE_LINE_PIE]: { allowMultiDataset: true, templates: { inherit: true, auxiliary: true, sentiment: true } },
        [CHART_TYPE_TREEMAP]: { allowMultiDataset: false, templates: { } },
        [CHART_TYPE_GRAPH]: { allowMultiDataset: false, templates: { } }
      }
    }
  },

  computed: {
    firstDatasetLoaded () {
      return !this.datasets.length ? false : !this.datasets[0].status.loading
    },

    allDatasetsReady () {
      return _.every(this.datasets, ds => !ds.status.loading && !ds.status.dirty)
    },

    /**
     * Reverse mapping of CHART_TYPES_TO_API_ENUM
     * @return {Object} Object with chart enums (API) as keys and chart types (FE) as values
     */
    apiEnumToChartType () {
      let mapping = {}
      _.each(CHART_TYPES_TO_API_ENUM, (val, key) => { mapping[val] = key })
      return mapping
    },

    /**
     * Creates mapping of auxiliary columns across datasets
     * Only matches auxiliary columns which have the same name and type
     * @return {Object} Mapping of type map[colIndexInDS1][dsIndexN] = colIndexInDSN
     */
    auxiliaryMappingAcrossDatasets () {
      if (!this.datasets.length) return
      // Go through all auxiliary columns of the first dataset
      let mapping = {}

      if (this.allDatasetsReady) {
        this.datasets[0].question.auxiliaryTypes.forEach((auxType, colIdx) => {
          // Go through every auxiliary column of the first dataset
          let foundEverywhere = true
          let _map = {}
          // Check if this auxiliary column also occurrs in every other dataset, and that it's of the same kind
          // For lazyness reasons we also include the first dataset, mapping its columns to itself
          this.datasets.forEach((ds, dsIdx) => {
            let idxHere = ds.question.auxiliary_column_names.indexOf(this.datasets[0].question.auxiliary_column_names[colIdx])
            // If the column name exists we check that the types are the same as well, if yes we populate the mapping
            // otherwise set found to false
            if (idxHere !== -1 && auxType.type === ds.question.auxiliaryTypes[idxHere].type) _map[dsIdx] = idxHere
            else foundEverywhere = false
          })

          if (foundEverywhere) mapping[colIdx] = _map
        })
      }

      return mapping
    },

    /**
     * Pseudo question, which is passed to master dataset
     * Contains auxiliary columns which are valid across all datasets
     * @return {object} Object describing the pseudo question
     */
    masterDatasetQuestion () {
      if (!this.allDatasetsReady) return {}
      else {
        return {
          auxiliary_column_names: this.datasets[0].question.auxiliary_column_names.filter((_, idx) => idx in this.auxiliaryMappingAcrossDatasets),
          auxiliaryTypes: this.datasets[0].question.auxiliaryTypes.filter((_, idx) => idx in this.auxiliaryMappingAcrossDatasets),
          codebook: _.intersectionBy(...this.datasets.map(ds => ds.question.codebook), 'id')
        }
      }
    },

    /**
     * Object representing the chart in the way it is saved
     */
    chartAPIObject () {
      let { name, type, config } = this.chart
      return {
        name,
        type: CHART_TYPES_TO_API_ENUM[type],
        config,
        datasets: _.map(this.datasets, ({ filters, settings, question }) => ({
          question: question.id,
          filters,
          settings
        }))
      }
    }
  },

  watch: {
    chartAPIObject: {
      deep: true,
      handler (newVal, oldVal) {
        if (!this.status.initialLoadingCompleted) return
        this.status.isDirty = true
      }
    },

    'versions.active' (val) {
      if (val) {
        this.versions.loading = true
        this.versions.failed = false
        api.get(`/api/charts/${this.$route.params.id}/versions`).then(res => {
          if (res.status !== 200) throw Error('Failed to load chart versions')
          this.versions.loading = false
          this.$set(this.versions, 'items', res.data)
        }).catch(err => {
          this.versions.failed = true
          this.versions.loading = false
          this.$maybeRaiseAPIPromiseErr(err)
        })
      }
    },

    allDatasetsReady (val) {
      if (this.datasets.length && val) this.status.initialLoadingCompleted = true
    },

    firstDatasetLoaded (val) {
      // If a chart type had already been selected when the first dataset wasn't loaded yet
      // create the templates for the dataset now
      if (val && this.chart.typeSelection) this.generateTemplates()
    }
  },

  mounted () {
    window.addEventListener('beforeunload', this.beforeUnload)
  },

  beforeDestroy () {
    window.removeEventListener('beforeunload', this.beforeUnload)
  },

  created () {
    this.setupInternalStateAfterNavigation(this.$route.params, this.$route.query)
  },

  methods: {
    beforeUnload ($event) {
      if (this.chart.type && this.status.isDirty) $event.returnValue = true
    },

    setupInternalStateAfterNavigation (params, query) {
      // If the change in navigation has been triggered by a programmatic change (not through the $router component)
      // do nothing
      if (this.status.programmaticRouteChange) this.status.programmaticRouteChange = false
      else {
        this.resetChart()
        // If a specific chart is given, all is settled, load it
        if (params.id !== 'new') this.loadChart(params.id)
        // Otherwise, we need to check for question and chart type, and potentially set them
        else {
          // We have a new chart
          this.status.isDirty = true
          if ('question' in query) {
            this.addDataset(query.question)
            this.closeQuestionSelect(false)
            // The chart type is of course only valid if we have a valid question as well
            if ('chart' in this.$route.query) this.chart.type = query.chart
          } else this.openQuestionSelect()
        }
      }
    },

    /**
     * Reset the internal state to the initial, clean version
     */
    resetChart () {
      this.$set(this, 'chart', _.cloneDeep(this.chartTemplate))
      this.datasets.splice(0)
      this.templates.splice(0)
      this.status.fresh = true
    },

    selectVersion (chartVersion) {
      if (this.status.isDirty && !confirm(this.$t('history.confirm_overwrite_current_dirty'))) return
      this.$set(this.chart, 'config', chartVersion.config)
      this.datasets.splice(0)
      chartVersion.datasets.forEach(ds => this.addDataset(ds.question, { settings: ds.settings, filters: ds.filters }))
    },

    setBreadcrumbProps () {
      this.$store.commit('setBreadcrumbProps', {
        chartID: this.$route.params.id,
        chartName: this.chart.name
      })
    },

    loadChart (id) {
      this.status.isDirty = false
      this.status.loading = true
      this.status.initialLoadingCompleted = false
      api.get(`/api/charts/${id}`).then(res => {
        if (res.status !== 200) throw Error('Failed to load chart')
        this.status.loading = false
        this.$set(this, 'chart', {
          ...this.chart,
          id: res.data.id,
          type: this.apiEnumToChartType[res.data.type],
          name: res.data.name,
          config: res.data.config
        })
        if (!this.$hasPermission('dashboards_edit', res.data)) this.status.readOnly = true
        res.data.datasets.forEach(ds => this.addDataset(ds.question, { settings: ds.settings, filters: ds.filters }))
      }).catch(err => {
        this.status.loading = false
        this.status.loadingFailed = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    save () {
      this.status.isDirty = false
      this.status.saving = true
      this.status.savingFailed = false
      let request
      if (this.$route.params.id === 'new') request = api.post(`/api/charts/`, this.chartAPIObject)
      else request = api.patch(`/api/charts/${this.$route.params.id}`, this.chartAPIObject)

      request.then((res) => {
        if (res.status >= 400) throw Error('Chart creation failed.')
        if (res.status === 201) {
          // Mark this as programmatic change, i.e. we don't need to update the state through the route guard
          this.status.programmaticRouteChange = true
          this.chart.id = res.data.id
          this.$router.replace({ // Set the id in the URI
            name: 'chart-details',
            params: { id: res.data.id },
            query: {}
          })
          this.setBreadcrumbProps()
        }
        this.status.saving = false
      }).catch((err) => {
        this.status.saving = false
        this.status.savingFailed = true
        this.status.isDirty = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    applyMaster () {
      this.datasets.forEach((ds, dsIdx) => {
        // Remove all the filters that have been created by the master and not changed since
        let dsFiltersNew = ds.filters.filter(filter => !filter.from_master)

        // Remove existing filters from the dataset that are of same kind
        this.masterDataset.filters.forEach(masterFilter => {
          dsFiltersNew = dsFiltersNew.filter(dsFilter => {
            // if they are of the same type as the new filter and not auxiliary -> drop
            if (dsFilter.type === masterFilter.type && masterFilter.type !== 'auxiliary') return false
            // If they are auxiliaries, and refer to the same column (whereby we have to look up mapping across datasets) -> drop
            else if (dsFilter.type === masterFilter.type && dsFilter.value.col === this.auxiliaryMappingAcrossDatasets[masterFilter.value.col][dsIdx]) return false
            else return true
          })
        })

        // Now add the new filters
        // It is imperative that we first remove all "duplicate" filters, then add the new ones
        // Otherwise we could be removing some newly added filters again instantly
        this.masterDataset.filters.forEach(masterFilter => {
          let f = _.cloneDeep(masterFilter)
          f.from_master = true
          if (f.type === 'auxiliary') f.value.col = this.auxiliaryMappingAcrossDatasets[f.value.col][dsIdx]
          dsFiltersNew.push(f)
        })

        this.$set(ds, 'filters', dsFiltersNew)

        // Now add / remove other settings
        _.each(this.masterDataset.settings, (val, key) => this.$set(ds.settings, key, _.cloneDeep(val)))
      })

      this.masterDataset.active = false
    },

    getChartTileImage (chartType) {
      return require(`../assets/visualize/tile-${chartType}.jpg`)
    },

    deleteDataset (idx) {
      this.datasets.splice(idx, 1)
      if (!this.datasets.length) this.openQuestionSelect()
    },

    duplicateDataset (idx) {
      let origDs = this.datasets[idx]
      let newDs = {
        id: this.dsIDHead++,
        filters: _.cloneDeep(origDs.filters),
        settings: _.cloneDeep(origDs.settings),
        status: { loading: false, failed: false, dirty: true, duplicated: true },
        question: origDs.question,
        answers: origDs.answers,
        result: _.clone(origDs.result)
      }
      newDs.settings.name = this.$t('ds.copied_prefix') + newDs.settings.name
      this.datasets.splice(idx + 1, 0, newDs)
    },

    selectChartType (chartType) {
      this.status.fresh = false
      setTimeout(() => {
        // Give animation some time to finish
        this.chart.typeSelection = chartType
        if (this.firstDatasetLoaded) this.generateTemplates()
      }, 100)
    },

    determineAuxiliaryTypes (question, answers) {
      // Go through all auxiliary columns, and determine the types and values
      const DISCRETE_VALS_IF_LESS_THAN_UNIQUE = 20

      if (!('auxiliary_column_names' in question)) return []
      if (!answers.length) return []
      if (!('auxiliary_columns' in answers[0])) return []

      let types = []
      answers[0].auxiliary_columns.forEach((c, idx) => {
        if (typeof c === 'number') types.push({ type: 'number', min: Infinity, max: -Infinity })
        else types.push({ type: 'string', vals: new Set(), few: true })
      })

      answers.forEach(a => {
        a.auxiliary_columns.forEach((c, idx) => {
          let tt = types[idx]
          if (tt.type === 'number') { // if any row does not contain a number, we fall back to string for entire column
            if (typeof c !== 'number') tt = { type: 'string', few: false }
            else {
              tt.min = Math.min(tt.min, c)
              tt.max = Math.max(tt.max, c)
            }
          } else {
            if (tt.few && tt.vals.size <= DISCRETE_VALS_IF_LESS_THAN_UNIQUE) tt.vals.add(c)
            else tt.few = false
          }
        })
      })

      types.forEach(t => {
        if (t.type === 'string' && t.few) t.vals = Array.from(t.vals).sort()
      })

      return types
    },

    generateTemplates () {
      let templates = []

      const MAX_VALS_TO_SUGGEST_SPLIT = 10
      let templatesToConsider = this.availableCharts[this.chart.typeSelection].templates

      if (templatesToConsider.inherit) {
        if (this.datasets[0].question.inherits_from !== null) {
          templates.push({
            title: this.$t('templates.inherit.title', { inherits_from_name: this.datasets[0].question.inherits_from_name }),
            subtitle: this.$t('templates.inherit.subtitle', { inherits_from_name: this.datasets[0].question.inherits_from_name }),
            definition: { type: 'inherit' }
          })
        }
      }

      if (templatesToConsider.auxiliary && this.datasets[0].question.auxiliaryTypes.length) {
        this.datasets[0].question.auxiliaryTypes.forEach((ct, colIdx) => {
          let colName = this.datasets[0].question.auxiliary_column_names[colIdx]
          if (ct.type === 'string' && ct.few && ct.vals.length <= MAX_VALS_TO_SUGGEST_SPLIT) {
            templates.push({
              title: this.$t('templates.auxiliary_choice.title', { column: this.$maybeTruncate(colName, 80) }),
              subtitle: this.$t('templates.auxiliary_choice.subtitle', { n_values: ct.vals.length, column: this.$maybeTruncate(colName, 25) }),
              definition: { type: 'auxiliary_choice', col: colIdx }
            })
          } else if (ct.type === 'number') {
            templates.push({
              title: this.$t('templates.auxiliary_number.title', { column: this.$maybeTruncate(colName, 80) }),
              subtitle: this.$t('templates.auxiliary_number.subtitle', { n_splits: 3, column: this.$maybeTruncate(colName, 25) }),
              definition: { type: 'auxiliary_number', col: colIdx }
            })
          }
        })
      }

      if (templatesToConsider.sentiment) {
        if (this.datasets[0].question.question_category !== QUESTION_CATEGORY_LIST) {
          if (this.datasets[0].answers[0].sentiment !== null) {
            templates.push({
              title: this.$t('templates.sentiment.title'),
              subtitle: this.$t('templates.sentiment.subtitle'),
              definition: { type: 'sentiment' }
            })
          }
        }
      }

      if (templates.length) {
        templates.splice(0, 0, {
          title: `<strong>${this.$t('templates.clean.title')}</strong>`,
          description: '',
          definition: { type: 'clean' }
        })
      }

      this.$set(this, 'templates', templates)

      if (!templates.length) this.goToEditor()
      else this.$nextTick(() => this.$vuetify.goTo(600, { duration: 300 }))
    },

    selectTemplate (template) {
      let getAuxDsName = (colName, val) => (this.chart.typeSelection !== 'line-pie' ? `${this.$maybeTruncate(colName, 10)}: ` : '') + val
      switch (template.definition.type) {
        case 'inherit':
          const MAX_INHERIT_DATASETS = 5
          let cnt = 0

          let addInheritsFromToDatasets = (question) => {
            if (question.inherits_from !== null && cnt < MAX_INHERIT_DATASETS) {
              cnt += 1
              this.addDataset(question.inherits_from, undefined, addInheritsFromToDatasets)
            }
          }

          addInheritsFromToDatasets(this.datasets[0].question)

          break
        case 'auxiliary_choice': {
          let col = template.definition.col
          let colName = this.datasets[0].question.auxiliary_column_names[col]
          let auxVals = this.datasets[0].question.auxiliaryTypes[col].vals

          this.datasets[0].filters.push({ type: 'auxiliary', value: { kind: 'select', value: [auxVals[0]], col } })
          this.datasets[0].settings.name = getAuxDsName(colName, auxVals[0])
          auxVals.slice(1).forEach(val => {
            this.addDataset(this.datasets[0].question.id, {
              settings: { ..._.cloneDeep(DS_SETTINGS_TEMPLATE), name: getAuxDsName(colName, val) },
              filters: [{ type: 'auxiliary', value: { kind: 'select', value: [val], col } }]
            })
          })

          this.chart.config.percentages = true
          this.chart.config.colorBy = { field: 'dsName', group: {} }
          this.chart.config.ordinalAxisName = this.chart.typeSelection === 'line-pie' ? this.$maybeTruncate(colName, 14) : undefined

          break
        }
        case 'auxiliary_number': {
          const nSteps = 3
          let col = template.definition.col
          let colName = this.datasets[0].question.auxiliary_column_names[col]
          let min = this.datasets[0].question.auxiliaryTypes[col].min
          let max = this.datasets[0].question.auxiliaryTypes[col].max
          let step = (max - min) / nSteps
          let isInteger = (max - min) >= nSteps
          if (isInteger) step = Math.floor(step)

          this.datasets[0].filters.push({ type: 'auxiliary', value: { kind: 'range', value: [min, min + step], col } })
          this.datasets[0].settings.name = getAuxDsName(colName, `${min} - ${min + step}`)

          let currMin = min + step + isInteger
          for (let stepIdx = 1; stepIdx < nSteps; stepIdx++) {
            let currMax = ((stepIdx + 1) === nSteps) ? max : currMin + step
            this.addDataset(this.datasets[0].question.id, {
              settings: { ..._.cloneDeep(DS_SETTINGS_TEMPLATE), name: getAuxDsName(colName, `${Math.round(currMin, 3)} - ${Math.round(currMax, 3)}`) },
              filters: [{ type: 'auxiliary', value: { kind: 'range', value: [currMin, currMax], col } }]
            })
            currMin += step + isInteger
          }

          this.chart.config.percentages = true
          this.chart.config.colorBy = { field: 'dsName', group: {} }
          this.chart.config.ordinalAxisName = this.chart.typeSelection === 'line-pie' ? this.$maybeTruncate(colName, 14) : undefined

          break
        }
        case 'sentiment':
          this.datasets[0].filters.push({ type: 'sentiment', value: [-1, -0.25] })
          this.datasets[0].settings.name = this.$t('templates.sentiment.ds_negative')
          this.addDataset(this.datasets[0].question.id, {
            settings: { ..._.cloneDeep(DS_SETTINGS_TEMPLATE), name: this.$t('templates.sentiment.ds_neutral') },
            filters: [{ type: 'sentiment', value: [-0.25, 0.25] }]
          })
          this.addDataset(this.datasets[0].question.id, {
            settings: { ..._.cloneDeep(DS_SETTINGS_TEMPLATE), name: this.$t('templates.sentiment.ds_positive') },
            filters: [{ type: 'sentiment', value: [0.25, 1] }]
          })

          this.chart.config.percentages = true
          this.chart.config.ordinalAxisName = this.chart.typeSelection === 'line-pie' ? this.$t('templates.sentiment.axis_name') : undefined
          break
        case 'clean':
          break
        default:
          throw Error(`Unknown template definition '${template.definition.type}'`)
      }

      this.goToEditor()
    },

    goToEditor () {
      // Mark this as programmatic change, i.e. we don't need to update the state through the route guard
      this.status.programmaticRouteChange = true
      this.chart.type = this.chart.typeSelection
      this.$router.push({
        name: 'chart-details',
        params: { id: this.$route.params.id },
        query: { ...this.$route.query, chart: this.chart.type }
      })
      this.setBreadcrumbProps()
    },

    addDataset (questionID, { settings, filters } = {}, questionLoadedCB) {
      let ds = {
        id: this.dsIDHead++,
        settings: settings || _.cloneDeep(DS_SETTINGS_TEMPLATE),
        filters: filters || _.cloneDeep(DS_FILTERS_TEMPLATE),
        status: { loading: true, failed: false, dirty: true },
        question: { },
        answers: [],
        result: []
      }

      if (questionID in this.cache) {
        ds.question = this.cache[questionID].question
        ds.answers = this.cache[questionID].answers
        ds.status.loading = false
        if (!settings) ds.settings.name = `${ds.question.project_name}, ${ds.question.name}`
      } else {
        let questionURI
        if (this.chart.id) questionURI = `/api/charts/${this.chart.id}/questions/${questionID}`
        else questionURI = `/api/questions/${questionID}`
        let qr = api.get(questionURI).then(res => {
          ds.question = res.data
          if (!settings) ds.settings.name = `${ds.question.project_name}, ${ds.question.name}`
          if (questionLoadedCB) questionLoadedCB(ds.question)
        })
        let ar = api.get(questionURI + '/answers').then(res => {
          res.data.map(Object.freeze)
          ds.answers = res.data
        })

        axios.all([qr, ar]).then(() => {
          this.$set(ds.question, 'auxiliaryTypes', this.determineAuxiliaryTypes(ds.question, ds.answers))
          ds.status.loading = false
          this.cache[questionID] = { question: ds.question, answers: ds.answers }

          // If this is the first dataset, set the breadcrumb entries
          if (this.datasets.length === 1) {
            this.setBreadcrumbProps()
          }
        }).catch((err) => {
          ds.status.loading = false
          ds.status.failed = true
          this.$maybeRaiseAPIPromiseErr(err)
          this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.title')}))
        })
      }

      this.datasets.push(ds)
      // If this is the first dataset, set the query param and breadcrumb entries
      if (this.datasets.length === 1) {
        this.setBreadcrumbProps()
      }
    },

    openQuestionSelect () {
      this.questionSelect.loading = true
      this.questionSelect.initialProjectFocus = this.datasets.length ? this.datasets.slice(-1)[0].question.project : undefined
      api.get('/api/projects/').then((res) => {
        let projects = res.data

        this.$set(this, 'projects', projects)
        this.computeProjectProperties('projects')
        this.questionSelect.loading = false
      }).catch((err) => {
        this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })

      this.questionSelect.active = true
    },

    closeQuestionSelect (question) {
      this.questionSelect.active = false
      if (question !== false) {
        this.addDataset(question.id)
        if (this.$route.params.id === 'new' && !this.$route.query.question) {
          // Mark this as programmatic change, i.e. we don't need to update the state through the route guard
          this.status.programmaticRouteChange = true
          this.$router.push({
            name: 'chart-details',
            params: { id: this.$route.params.id },
            query: { ...this.$route.query, question: question.id }
          })
        }
      }
    }
  }
}

</script>

<style lang=scss>

@import '~css/chart';

.chart-editor {
  .chart-selector, .template-selector {
    margin: 0 20px;
    .v-card__title {
      display: block;
    }

    .subtitle {
      font-size: 14px;
      line-height: 1.2;
      margin-top: 4px;
    }
  }
  .chart-selector {
    margin-top: 10px;
    display: flex;
    flex-direction: row;
    transition: all 0.1s ease-out;

    &.fresh {
      margin-top: 100px;
    }

    .chart-config-el {
      flex: 1;
      margin-right: 24px;
      cursor: pointer;
      transition: all 0.05s ease-in;

      &:hover, &.selected {
        transform: scale(1.1, 1.1);
        z-index: 1;
        img {
          opacity: 1.0;
        }
      }
    }

    &:hover .chart-config-el.selected:not(:hover) {
      transform: scale(1.05);
    }

    .tile-img-container {
      position: relative;
      padding: 12px 16px;
      background: #FFF;

      img {
        flex: 1;
        max-width: 100%;
        opacity: 0.5;
        transition: all 0.2s ease-in;
      }
    }

    .chart-config-el:last-child {
      margin-right: 0;
    }
  }

  .template-selector {
    margin-top: 20px;
    .v-list-item {
      .v-avatar {
        background: #EEE;
        border: 3px dotted #CCC;
        color: #666;
        font-weight: bold;
      }
      &:hover {
        background: $col-ans-focus-bg;
        .v-list-item__action {
          transition: all 0.25s ease-out;
          transform: translateX(10px);
        }
        .v-avatar {
          border: 3px solid #CCC;
        }
      }
    }
  }
}

.chart-layout {
  display: flex;
  flex-direction: row;
  position: relative;
  height: 100%;
  max-height: 100%;

  .layout-col {
    max-width: 100%;
    flex: 1;
    padding: 16px;
    margin-top: -16px;
    height: calc(100vh - 100px);
    overflow-y: scroll;

    &:first-child {
      margin-right: 0px;
      margin-left: -16px;
    }

    &:last-child {
      margin-right: -16px;
      margin-left: 0px;
    }

    .controls-container {
      .c-alert {
        margin-top: 0;
      }
    }

    &.chart-col {
      .toolbox {
        position: absolute;
        top: 0px;
        right: 4px;
        z-index: 1;

        .v-btn {
          margin: 3px 0px 0 0;
        }

        .placeholder {
          margin: 0 10px 0 9px;
        }

        .helptip {
          margin-right: 10px;
          .anchor .mdi {
            font-size: 24px;
            color: var(--v-primary-base);
          }
        }
      }

      .echarts {
        margin-top: 0;
      }

      .chart-container {
        margin: 0 -16px;
        height: 100%;
        position: relative;
        padding: 8px 16px;

        z-index: 1;
        background: #FFF;
        border-radius: 4px;
        border: 1px solid #dadee4;

        &.dims-auto {
          min-height: 100%;
          right: 0;
        }

        &.dims-manual {
          display: inline-block;
          height: auto;
        }

        &.fullscreen {
          position: absolute;
          top: -16px;
          left: 0;
          min-height: calc(100% + 24px);
          margin-bottom: 8px;

          &.dims-auto { height: calc(100% + 32px) }
          &.dims-manual { min-width: calc(100% + 32px) }
        }
      }
    }
  }
}

.master-dataset-dialog {
  overflow: visible;
}

.project-selector {
  > .v-card {
    min-height: 500px;
    flex-direction: column;
    display: flex;
  }

  #project-list {
    > .v-card {
      box-shadow: none;
    }
  }
}

</style>

<i18n src='@/i18n/pages/ChartEditor.json'></i18n>
<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
