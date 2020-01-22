<template>
  <div style="height: 100%" id="chart-list">
    <v-card>
      <v-card-text style="height: 72px; display: flex">
        <transition name="toolbar-squeeze" mode="out-in">
          <div style="flex: 1 1 auto; display: flex" v-if="chartsSelected.length < 1 && !loading" key="filter">
            <span class="title main-title" key="title">
              <slot name="title" />
            </span>
            <v-spacer />
            <v-text-field v-if="searchFilterEnable"
                          single-line
                          class="search"
                          append-icon="mdi-magnify"
                          :label="$t('filters.term')"
                          v-model="filters.name"
                          hide-details />

            <code-select v-if="questionsFilterEnable"
                         v-model="filters.questions"
                         :codes-options="questions"
                         :sync="true"
                         class="questions-filter"
                         close-on-select
                         category-selectable
                         :placeholder="$t('filters.questions')"/>

          </div>
          <div v-else-if="!loading" class="chart-actions" key="edit">
            <span class="title" key="selected">
              {{ $t('n_items_selected', { item: $tc('chart.items', chartsSelected.length),
                                          cnt: chartsSelected.length }) }}
            </span>
            <v-spacer />
            <slot name="header-actions" :charts-selected="chartsSelected" />
          </div>
        </transition>

      </v-card-text>

      <!-- ====== Chart List BOX ====== -->
      <v-data-table
        v-model="chartsSelected"
        must-sort
        :items="chartsFiltered"
        :headers="headersFiltered"
        item-key="id"
        :sort-by.sync="pagination.sortBy"
        :sort-desc.sync="pagination.descending"
        :items-per-page.sync="pagination.rowsPerPage"
        :page.sync="pagination.page"
        :footer-props="{
          itemsPerPageOptions: rowsPerPageOptionsValid,
          itemsPerPageText: $t('pagination.description', {'item': $tc('chart.items', 2)})
        }"
        :loading="loading"
        id="chartList"
        ref="chartList"
        :show-select="selectable"
        class="chart-list-tbl">

        <template slot="loading"><div style="text-align: center">{{ $t('loading.title') }}...</div></template>

        <template v-slot:footer.page-text="props">
          {{ props.pageStart }} - {{ props.pageStop }}
          {{ $t('pagination.of') }} {{ props.itemsLength }}
        </template>

        <template v-slot:header.name="{ header }">
          <span ref="header-name">{{ header.text }}</span>
        </template>

        <template slot="item"
                  slot-scope="props">
          <tr>
            <td v-if="selectable">
              <v-checkbox
                v-model="props.isSelected"
                @change="props.select"
                primary
                hide-details />
            </td>
            <td class="type-col" v-if="!('type' in hideColumns)">
              <div class="type-icons">
                <template>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <i class="v-icon notranslate mdi theme--light" :class="apiEnumToIcon(props.item.type)" v-on="on" />
                    </template>
                    <span>
                      {{ $t(`chart.types.${apiEnumToChartType[props.item.type]}.title`) }}
                    </span>
                  </v-tooltip>
                </template>
              </div>
            </td>
            <td class="name-col">
              <router-link :to="{ name: 'chart-details', params: { id: props.item.id } }"
                           event="''"
                           @click.native.prevent.stop="$emit('open-chart', props.item.id)">{{ props.item.name }}</router-link>
            </td>
            <td v-if="!('owner' in hideColumns || !user.profile.organization)">{{ props.item.owner }}</td>
            <td v-if="!('created' in hideColumns)">{{ props.item.created | dateshort }}</td>
            <td v-if="!('last_modified' in hideColumns)" class="last-modified" >{{ props.item.last_modified | fromnow }}</td>
            <td v-if="!('questions' in hideColumns)">
              <code-chip v-for="(question, idx) in uniqueQuestionsByChart[props.item.id]"
                         :key="idx"
                         :color="$color.getMedium(idx)"
                         :category="question.project_name">{{ question.name }}</code-chip>
            </td>
            <td v-if="!('ndatasets' in hideColumns)">
              {{ props.item.ndatasets }}
            </td>
          </tr>
        </template>

        <empty-state v-if="!loading"
                     slot="no-data"
                     icon="mdi-playlist-remove"
                     :label="$t('no_charts.title')"
                     :description="$t('no_charts.details')">
          <slot name="empty-state" />
        </empty-state>

      </v-data-table>
    </v-card>
  </div>
</template>

<script>
'use strict'
import Vuex from 'vuex'
import CodeSelect from '@/components/CodeSelect'

import { CHART_TYPES_TO_API_ENUM, CHART_TYPE_BAR, CHART_TYPE_LINE_PIE, CHART_TYPE_TREEMAP, CHART_TYPE_GRAPH } from '@/settings/constants'

export default {
  codit: true,
  name: 'ChartList',

  components: {
    'code-select': CodeSelect
  },

  props: {
    charts: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    searchFilterEnable: { type: Boolean, default: true },
    questionsFilterEnable: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    hideColumns: { type: Object, default: () => Object() },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 'all'] },
    rowsPerPageDefault: { type: Number, default: 10 },
    questionToFilter: { type: [Object, null], default: null }
  },

  data () {
    return {
      filters: {
        name: '',
        questions: []
      },

      chartsFiltered: [],
      chartsSelected: [],

      headers: [
        { text: '', sortable: false, value: 'type' },
        { text: this.$t('eprops.name'), value: 'name', width: '250px' },
        { text: this.$t('eprops.owner'), value: 'owner' },
        { text: this.$t('eprops.created'), value: 'created' },
        { text: this.$t('eprops.last_modified'), value: 'last_modified' },
        { text: this.$t('eprops.questions'), sortable: false, value: 'questions', width: '30%' },
        { text: this.$t('eprops.number_datasets'), value: 'ndatasets' }
      ],

      pagination: { sortBy: 'id', descending: true, rowsPerPage: 10, page: 1 },

      filterFns: {
        // search the chart name for the given search string
        search: c => this.filters.name.length === 0 || (c.name.match(this._searchRegex)),
        // filter the charts by the dataset questions
        questions: c => this.filters.questions.length === 0 ||
          _.find(c.datasets, ds => this.filters.questions.indexOf(ds.question.id) !== -1) !== undefined
      },

      /**
       * Debounced version of filterCharts method
       */
      filterChartsDebounced: _.debounce(() => this.filterCharts(), 250)
    }
  },

  computed: {
    headersFiltered () {
      return this.headers.filter(h => !(h.value in this.hideColumns) && !(h.value === 'owner' && !this.user.profile.organization))
    },

    /**
     * Takes the rowsPerPageOptions prop and replaces the literal 'all' with a valid value
     * if 'all' is not present in the options, the options are not modified
     * @return {list} list of rows per page options
     */
    rowsPerPageOptionsValid () {
      let opts = this.rowsPerPageOptions
      if (opts.indexOf('all') !== -1) opts[opts.indexOf('all')] = { 'text': this.$t('all'), 'value': -1 }
      return opts
    },

    /**
     * Returns a RegExp expression for filtering given the current search value
     * @return {RegExp} the RegExp object
     */
    _searchRegex () {
      return new RegExp(this.filters.name, 'i')
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
     * List of unique questions, that are present in the datasets of each chart
     * @return {Array} List of questions, with name and id
     */
    uniqueQuestionsByChart () {
      let mapping = {}
      this.charts.forEach(c => {
        mapping[c.id] = _(c.datasets).map('question').uniqBy('id').value()
      })
      return mapping
    },

    /**
     * Get all unique questions from the charts datasets and format them to fit the CodeSelect component
     * Specifically:
     * Get the array of all datasets of all charts
     *  | map every dataset to only its question
     *  | only keep unique questions
     *  | group together by project (such that questions of one project come after each other later on)
     *  | flatten again, such that we have 1d list of questions
     *  | map question { id, name, project_name } => { id, label: name, category: project_name }, to match
     *    structure of CodeSelect
     * Finally, add the question we want to filter by, if it isn't in the list already
     * @return {Array} List of questions in format ready for CodeSelect
     */
    questions () {
      let questions = _(this.charts).flatMap(c => c.datasets.map(
        ({ question }) => ({ id: question.id, label: question.name, category: question.project_name }))
      ).uniqBy('id').groupBy('category').flatMap().value()
      if (this.questionToFilter && !_.find(questions, q => q.id === this.questionToFilter.questionID)) {
        questions.push({
          id: this.questionToFilter.questionID, label: this.questionToFilter.questionName, category: this.questionToFilter.projectName
        })
      }
      return questions
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    filters: {
      deep: true,
      handler () { if (!this.showQuestionMutex) this.filterChartsDebounced() }
    },

    pagination: {
      deep: true,
      handler () {
        this.$nextTick(this.updateObserver)
      }
    },

    rowsPerPageDefault: {
      immediate: true,
      handler (val) { this.pagination.rowsPerPage = val }
    },

    charts: {
      immediate: true,
      handler: 'filterCharts'
    },

    chartsFiltered: 'clearSelected'
  },

  created () {
    if (this.questionToFilter) this.filters.questions.push(this.questionToFilter.questionID)
  },

  methods: {
    /**
     * Filters the charts by all filterFns, if enabled
     */
    filterCharts () {
      const filters = _.keys(this.filterFns)
      // Run through all charts
      this.$set(this, 'chartsFiltered', this.charts.filter(p => {
        // Run through all filters and check if they are activated _or_ return true, otherweise reject chart
        for (let i = 0; i < filters.length; i++) {
          if (this[`${filters[i]}FilterEnable`] && !this.filterFns[filters[i]](p)) return false
        }
        return true
      }))
    },

    /**
     * Get the icon class for a given chart type (API enum)
     * @return {String} icon class
     */
    apiEnumToIcon (apiEnum) {
      const cType = this.apiEnumToChartType[apiEnum]
      switch (cType) {
        case CHART_TYPE_BAR:
          return 'mdi-chart-bar'
        case CHART_TYPE_LINE_PIE:
          return 'mdi-chart-bell-curve'
        case CHART_TYPE_TREEMAP:
          return 'mdi-chart-tree'
        case CHART_TYPE_GRAPH:
          return 'mdi-graphql'
        default:
          throw Error(`Unknown chart type ${cType}`)
      }
    },

    clearSelected () { this.chartsSelected.splice(0) }
  }
}

</script>

<style lang=scss>

#chart-list {
  .v-input--checkbox {
    margin: 0;
    padding: 0;
  }

  .search {
    margin-top: -6px;
    max-width: 300px
  }

  .hide-completed, .hide-incomplete {
    flex: 0 0 auto;
    font-size: 16px;
    margin: 6px 0 -19px 30px;
  }

  .questions-filter {
    flex: 1;
    max-width: 400px;
    margin-left: 30px;
    margin-top: 1px;
  }

  .chart-actions {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .v-btn {
      margin: 0 6px;
    }
  }

  .main-title {
    margin-top: 4px;
  }

  .toolbar-squeeze-enter {
    opacity: 0;
    transform: translate(0, -40px)
  }

  .toolbar-squeeze-leave-to {
    opacity: 0;
    transform: translate(0, 40px)
  }

  .toolbar-squeeze-enter-active, .toolbar-squeeze-leave-active {
    transition: all 0.15s ease-in-out;
    will-change: opacity, transform;
  }

  .chart-list-tbl {
    .type-col:not(:first-child) { padding: 0!important; }
    .type-col {
      .type-icons {
        .v-tooltip { margin: auto 0 }
        display: flex;
        .v-icon {
          margin-right: 5px;
        }
      }
    }
  }

  .chart-list-tbl .name-col a {
    display: block;
  }
}

</style>

<i18n src='../i18n/pages/ChartList.json'></i18n>
