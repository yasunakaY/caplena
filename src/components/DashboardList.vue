<template>
  <div style="height: 100%" id="dashboard-list">
    <div style="margin-bottom: 24px" v-if="tagsBox">
      <v-card>

        <v-card-text>
          <div style="display: flex; margin-bottom: 10px">
            <div class="subheader" style="flex: 1">Tags</div>
          </div>

          <code-chip v-for="(label, idx) in labels"
                     :key="idx"
                     :color="$color.getMedium(label2idx[label])"
                     :avatar-char="label[0]"
                     active
                     @click.native="filters.labels.splice(0, filters.labels.length, label)"
                     style="cursor: pointer">
            {{ label }} <em>({{ labelCounts[label2idx[label]] }})</em>
          </code-chip>

          <em v-if="!loading&&!labels.length">{{ $t('labels.no_labels') }}</em>

        </v-card-text>
      </v-card>
    </div>

    <v-card>
      <v-card-text style="height: 72px; display: flex">
        <transition name="toolbar-squeeze" mode="out-in">
          <div style="flex: 1 1 auto; display: flex" v-if="dashboardsSelected.length < 1" key="filter">
            <span class="title main-title" key="title">
              <slot name="title" />
            </span>
            <v-spacer />
            <v-text-field v-if="searchFilterEnable"
                          single-line
                          class="search"
                          append-icon="mdi-magnify"
                          :label="$t('search_term')"
                          v-model="filters.name" hide-details />

            <label-select v-if="labelsFilterEnable"
                          v-model="filters.labels" class="tags-filter"
                          style="width: 150px"
                          :options="labels"
                          :sync="true"
                          :placeholder="$t('labels.filter_placeholder')"/>

            <v-select v-if="isPublicFilterEnable"
                      v-model="filters.isPublic"
                      multiple
                      :items="[{ value: true, text: $t('is_public_true') }, { value: false, text: $t('is_public_false') }]"
                      hide-details
                      class="is-public"
                      :label="$t('is_public_label')" />

          </div>
          <div v-else class="dashboard-actions" key="edit">
            <span class="title" key="selected">
              {{ $t('n_items_selected', { item: $tc('dashboard.items', dashboardsSelected.length),
                                          cnt: dashboardsSelected.length }) }}
            </span>
            <v-spacer />
            <slot name="header-actions" :dashboards-selected="dashboardsSelected" />
          </div>
        </transition>

      </v-card-text>
      <!-- ====== Dashboard List BOX ====== -->
      <v-data-table
        v-model="dashboardsSelected"
        must-sort
        :items="dashboardsFiltered"
        :headers="headersFiltered"
        item-key="id"
        :sort-by.sync="pagination.sortBy"
        :sort-desc.sync="pagination.descending"
        :items-per-page.sync="pagination.rowsPerPage"
        :page.sync="pagination.page"
        :footer-props="{
          itemsPerPageOptions: rowsPerPageOptionsValid,
          itemsPerPageText: $t('pagination.description', {'item': $tc('dashboard.items', 2)})
        }"
        :loading="loading"
        id="dashboardList"
        ref="dashboardList"
        :show-select="selectable"
        class="dashboard-list-tbl">

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
            <td class="is-public-col" v-if="!('is_public' in hideColumns)">
              <div class="is-public-icns">
                <template v-if="props.item.is_public">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-lock-open-outline</v-icon></template>
                    <span>{{ $t('is_public_true ') }}</span>
                  </v-tooltip>
                </template>
                <template v-else>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-lock</v-icon></template>
                    <span>{{ $t('is_public_false ') }}</span>
                  </v-tooltip>
                </template>
              </div>
            </td>
            <td class="name-col">
              <router-link :to="{ name: 'dashboard-details', params: { id: props.item.id } }"
                           event="''"
                           @click.native.prevent.stop="$emit('open-dashboard', props.item.id)">{{ props.item.name }}</router-link>
            </td>
            <td v-if="!('owner' in hideColumns || !user.profile.organization)">{{ props.item.owner }}</td>
            <td v-if="!('created' in hideColumns)">{{ props.item.created | dateshort }}</td>
            <td v-if="!('last_modified' in hideColumns)" class="last-modified" >{{ props.item.last_modified | fromnow }}</td>
            <td v-if="!('labels' in hideColumns)" style="white-space: nowrap">
              <code-chip v-for="(label, idx) in props.item.labels"
                         :key="idx"
                         :color="$color.getMedium(label2idx[label])"
                         :avatar-char="label[0]"
                         only-avatar>{{ label }}</code-chip>
            </td>
            <td v-if="!('n_elements' in hideColumns)">
              {{ props.item.n_elements }}
            </td>
          </tr>
        </template>

        <empty-state v-if="!loading"
                     slot="no-data"
                     icon="mdi-monitor-dashboard"
                     :label="$t('no_dashboards.title')"
                     :description="$t('no_dashboards.details')">
          <slot name="empty-state" />
        </empty-state>

      </v-data-table>
    </v-card>
  </div>
</template>

<script>
'use strict'
import Vuex from 'vuex'

import LabelSelect from '@/components/LabelSelect'

export default {
  codit: true,
  name: 'DashboardList',

  components: {
    'label-select': LabelSelect
  },

  props: {
    dashboards: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    tagsBox: { type: Boolean, default: false },
    searchFilterEnable: { type: Boolean, default: true },
    labelsFilterEnable: { type: Boolean, default: true },
    isPublicFilterEnable: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    hideColumns: { type: Object, default: () => Object() },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 'all'] },
    rowsPerPageDefault: { type: Number, default: 10 }
  },

  data () {
    return {
      filters: {
        name: '',
        labels: [],
        isPublic: [true, false]
      },

      dashboardsFiltered: [],
      dashboardsSelected: [],

      headers: [
        { text: '', sortable: false, value: 'is_public' },
        { text: this.$t('eprops.name'), value: 'name', width: '250px' },
        { text: this.$t('eprops.owner'), value: 'owner' },
        { text: this.$t('eprops.created'), value: 'created' },
        { text: this.$t('eprops.last_modified'), value: 'last_modified' },
        { text: this.$t('eprops.labels'), sortable: false, value: 'labels', width: '160px' },
        { text: this.$t('eprops.number_elements'), value: 'n_elements' }
      ],

      pagination: { sortBy: 'id', descending: true, rowsPerPage: 10, page: 1 },

      isDestroying: false,

      filterFns: {
        // search the dashboard and questions names for the given search string
        search: d => this.filters.name.length === 0 || (d.name.match(this._searchRegex)),
        labels: d => !this.filters.labels.length || this.filters.labels.some(l => d.labels.indexOf(l) !== -1),
        isPublic: d => this.filters.isPublic.length === 2 || d.is_public === this.filters.isPublic[0]
      },

      /**
       * Debounced version of filterDashboards method
       */
      filterDashboardsDebounced: _.debounce(() => this.filterDashboards(), 250)
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

    labels () {
      return _.uniq(_.flatten(_.map(this.dashboards, 'labels'))).sort()
    },

    label2idx () {
      let lbl2idx = {}
      this.labels.forEach((lbl, idx) => { lbl2idx[lbl] = idx })
      return lbl2idx
    },

    labelCounts () {
      let cnts = new Array(this.labels.length).fill(0)
      this.dashboards.forEach(s => {
        s.labels.forEach(lbl => { cnts[this.label2idx[lbl]] += 1 })
      })
      return cnts
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    filters: {
      deep: true,
      handler: 'filterDashboardsDebounced'
    },

    rowsPerPageDefault: {
      immediate: true,
      handler (val) { this.pagination.rowsPerPage = val }
    },

    dashboards: {
      immediate: true,
      handler () {
        if (!this.dashboards.length) return
        this.filterDashboards()
      }
    },

    dashboardsFiltered () {
      this.clearSelected()
      this.pagination.page = 1
    }
  },

  methods: {
    /**
     * Filters the dashboards by all filterFns, if enabled
     */
    filterDashboards () {
      const filters = _.keys(this.filterFns)
      // Run through all dashboards
      this.$set(this, 'dashboardsFiltered', this.dashboards.filter(p => {
        // Run through all filters and check if they are activated _or_ return true, otherweise reject dashboard
        for (let i = 0; i < filters.length; i++) {
          if (this[`${filters[i]}FilterEnable`] && !this.filterFns[filters[i]](p)) return false
        }
        return true
      }))
    },

    clearSelected () { this.dashboardsSelected.splice(0) },

    clearFilters () {
      this.filters.name = ''
      this.filters.labels.splice(0)
      // Make the isPublic options be [true, false] again
      this.filters.isPublic.splice(0, this.filters.isPublic.length, true, false)
    }
  }
}

</script>

<style lang=scss>

#dashboard-list {
  .v-input--checkbox {
    margin: 0;
    padding: 0;
  }

  .search {
    margin-top: -6px;
    max-width: 300px
  }

  /* .hide-completed, .hide-incomplete {
    flex: 0 0 auto;
    font-size: 16px;
    margin: 6px 0 -19px 30px;
  } */

  .tags-filter {
    flex: 1;
    max-width: 400px;
    margin-left: 30px;
    margin-top: 1px;
  }

  .is-public {
    margin-top: -6px;
    margin-left: 30px;
    max-width: 180px;
    .v-select__selection { color: rgba(0,0,0,.54) }
  }

  .dashboard-actions {
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

  .dashboard-list-tbl {
    .is-public-col:not(:first-child) { padding: 0!important; }
    .is-public-col {
      .is-public-icns {
        .v-tooltip { margin: auto 0 }
        display: flex;
        .v-icon {
          margin-right: 5px;
        }
      }
    }
  }

  .dashboard-list-tbl .name-col a {
    display: block;
  }
}

</style>

<i18n src='../i18n/pages/DashboardList.json'></i18n>
