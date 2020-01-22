<template>
  <div class="chart-ds-container">
    <v-card class="chart-config-el chart-ds" :class="{ duplicated: status.duplicated }">
      <v-card-title>
        <div v-if="draggable" class="drag-handle" :class="{ draggable: !status.loading && draggable }">
          <v-icon>mdi-drag</v-icon>
        </div>
        <div style="flex: 10; max-width: 72%;">
          <template v-if="isMaster">
            <div class="title">{{ $t('ds.title_master') }}</div>
            {{ $t('ds.subtitle_master') }}
          </template>
          <v-progress-circular indeterminate size="25" width="4" v-else-if="status.loading" style="margin: 7px 0 12px" />
          <v-icon color="error" v-else-if="status.failed">mdi-alert-circle</v-icon>
          <template v-else>
            <template v-if="noEditTitle || !editingTitle">
              <div class="title" @click="editTitle" v-if="!editingTitle">
                <div>{{ settingsInternal.name }}</div>
                <v-icon v-if="!noEditTitle" @click="editTitle" class="edit">mdi-pencil</v-icon>
              </div>
            </template>

            <v-text-field v-else
                          :value="settingsInternal.name"
                          ref="dsName"
                          single-line
                          outlined
                          dense
                          hide-details
                          class="name-input"
                          :rules="[(val) => val.length >= 1 || '']"
                          @input="updateTitleDebounced"
                          @keydown.enter="editingTitle = !$refs.dsName.valid"
                          @blur="editingTitle = !$refs.dsName.valid" />

            <div>
              {{ question.name }},
              {{ question.project_name }} |
              {{ $t('ds.subtitle_info', { nanswers: answers.length, ncodes: question.codebook.length}) }}
            </div>
          </template>
        </div>

        <div style="flex: 1 1 0" />
        <div class="matches-container-header" v-if="!status.failed && !isMaster">
          <code v-text="$t('ds.filters.n_matches', { n: result.length })" />
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn icon @click="openVerbatimBrowser(filtersInternal, 'codes')" v-on="on">
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
            </template>
            <span>{{ $t('ds.verbatim_browser_helptip') }}</span>
          </v-tooltip>
        </div>

        <div class="ds-actions">
          <v-tooltip bottom v-if="duplicatable">
            <span>{{ $t('ds.actions.duplicate') }}</span>
            <template v-slot:activator="{ on }">

              <v-btn v-on="on"
                     small
                     fab
                     @click="$emit('duplicate')"
                     class="duplicate-ds">
                <v-icon size="18">mdi-file-multiple</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip bottom v-if="deletable" :disabled="deleteClicked">
            <span>{{ $t('ds.actions.remove') }}</span>
            <template v-slot:activator="{ on }">

              <v-btn v-on="on"
                     dark
                     :small="!deleteClicked"
                     :fab="!deleteClicked"
                     color="error"
                     v-c-click-outside="deleteDeclicked"
                     @click.native="deleteDs"
                     class="delete-ds"
                     :class="{ 'delete-clicked': deleteClicked }">
                <v-icon size="18" v-show="!deleteClicked">mdi-close</v-icon>
                <span v-if="deleteClicked">{{ $t('ds.confirm_delete') }}</span>
              </v-btn>
            </template>
          </v-tooltip>
        </div>

      </v-card-title>

      <v-card-text v-if="!status.failed">
        <v-list>

          <!-- ============= FILTERS ============= -->
          <control-drawer icon="mdi-magnify"
                          :title="$t('ds.filters.title')"
                          :subtitle="$t('ds.filters.subtitle')"
                          :no-items-placeholder="$t('ds.filters.no_items')">

            <template v-if="!status.loading">

              <control-tile v-for="(item, idx) in filtersInternal"
                            :key="idx"
                            class="filter-item"
                            :class="{ 'overheight': item.type === 'codes' }">

                <v-select v-if="item.type === null"
                          dense
                          :items="filterOptionsSelect"
                          :label="$t('ds.filters.type_label')"
                          item-value="type"
                          hide-details
                          class="type-select"
                          @change="setFilterItemType(item, $event)" />

                <template v-else>
                  <v-checkbox v-model="item.value"
                              :label="$t(`ds.filters.labels.${item.type}`)"
                              v-if="item.type === 'empty'"
                              @change="changeFilterItem(idx)"
                              hide-details
                              dense
                              small />

                  <v-radio-group v-model="item.value"
                                 v-if="['reviewed', 'changed'].indexOf(item.type) !== -1"
                                 :label="$t(`ds.filters.labels.${item.type}`)"
                                 @change="changeFilterItem(idx)"
                                 row
                                 hide-details>

                    <v-radio label="Yes" :value="true" />
                    <v-radio label="No" :value="false" />
                  </v-radio-group>

                  <v-text-field v-model="item.value"
                                :label="$t(`ds.filters.labels.${item.type}`)"
                                v-if="item.type === 'text'"
                                @input="changeFilterItem(idx)"
                                hide-details
                                dense />

                  <v-range-slider v-model="item.value"
                                  v-if="item.type === 'sentiment'"
                                  :max="1"
                                  :min="-1"
                                  :step="0.1"
                                  thumb-label="always"
                                  thumb-size="20"
                                  :label="$t('ds.filters.labels.sentiment')"
                                  @input="changeFilterItem(idx)"
                                  dense
                                  hide-details />

                  <code-select v-if="item.type === 'codes'"
                               v-model="item.value"
                               :codes-options="question.codebook"
                               :sync="true"
                               :close-on-select="false"
                               category-selectable
                               @keydown.native.enter.prevent.stop
                               @change="changeFilterItem(idx)"
                               max-height="300px"
                               style="flex: 1"
                               :placeholder="$t('ds.filters.labels.codes')" />

                  <template v-if="item.type === 'auxiliary'">
                    <v-text-field v-model="item.value.value"
                                  v-if="item.value.kind === 'text'"
                                  :label="$t('ds.filters.labels.auxiliary_column_text', { column: question.auxiliary_column_names[item.value.col] })"
                                  @input="changeFilterItem(idx)"
                                  hide-details
                                  dense />

                    <template v-if="item.value.kind === 'range'">
                      <v-text-field v-model="item.value.value[0]"
                                    hide-details
                                    :label="$t('ds.filters.labels.auxiliary_column_range_min', { column: question.auxiliary_column_names[item.value.col] })"
                                    type="number"
                                    @input="changeFilterItem(idx)"
                                    class="min-max" />

                      <v-text-field v-model="item.value.value[1]"
                                    v-if="item.value.kind === 'range'"
                                    hide-details
                                    dense
                                    @input="changeFilterItem(idx)"
                                    :label="$t('ds.filters.labels.auxiliary_column_range_max', { column: question.auxiliary_column_names[item.value.col] })"
                                    type="number"
                                    class="min-max" />
                    </template>

                    <v-select v-model="item.value.value"
                              v-if="item.value.kind === 'select'"
                              dense
                              :items="question.auxiliaryTypes[item.value.col].vals"
                              :label="$t('ds.filters.labels.auxiliary_column_select', { column: question.auxiliary_column_names[item.value.col] })"
                              @change="changeFilterItem(idx)"
                              hide-details
                              multiple>

                      <template v-slot:selection="selectItem">
                        <div class="v-select__selection" v-if="selectItem.index === 0">
                          {{ selectItem.item }}
                        </div>
                        <span v-if="selectItem.index === 1" class="grey--text">
                          &nbsp; [+{{ item.value.value.length - 1 }} {{ $t('ds.filters.select_others') }}]
                        </span>
                      </template>
                    </v-select>

                  </template>

                  <v-switch v-model="item.invert"
                            color="green"
                            hide-details
                            dense
                            v-if="['text', 'codes'].indexOf(item.type) !== -1 || (item.type === 'auxiliary' && item.value.kind === 'text')"
                            @change="changeFilterItem(idx)"
                            :label="$t('ds.filters.invert')" />

                  <div class="matches-container" v-if="!isMaster">
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <code v-on="on" v-show="filterCounts[idx] !== null" v-text="filterCounts[idx]" />
                      </template>
                      <span>{{ $t('ds.filters.n_matches_helptip') }}</span>
                    </v-tooltip>
                  </div>

                </template>

                <template v-slot:actions>
                  <v-tooltip bottom v-if="!isMaster">
                    <template v-slot:activator="{ on }">
                      <v-btn icon @click="openVerbatimBrowser([item])" v-on="on"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
                    </template>

                    <span>{{ $t('ds.filters.verbatim_browser_helptip') }}</span>
                  </v-tooltip>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <v-btn icon @click="removeFilterItem(idx)" v-on="on"><v-icon class="delete">mdi-close</v-icon></v-btn>
                    </template>
                    <span>{{ $t('ds.filters.delete_helptip') }}</span>
                  </v-tooltip>
                </template>
              </control-tile>
            </template>

            <template v-slot:footer>
              <v-list-item >
                <v-btn depressed small @click="addFilterItem()" style="flex: 1; margin: 0">
                  <v-icon color="grey">mdi-plus</v-icon>
                </v-btn>
              </v-list-item>
            </template>
          </control-drawer>

          <!-- ============= Data Modifiers ============= -->
          <control-drawer v-if="!noShowModifiers"
                          icon="mdi-wrench"
                          :title="$t('ds.modifiers.title')"
                          :subtitle="$t('ds.modifiers.subtitle')">

            <control-tile class="modifier-item">
              <v-select v-model="settingsInternal.weighting_column"
                        :items="weightingColumnOptions"
                        :label="$t('ds.modifiers.weighting_column')"
                        item-value="value"
                        hide-details
                        dense />

              <v-checkbox v-model="settingsInternal.weighting_normalize"
                          :label="$t('ds.modifiers.weighting_normalize')"
                          :disabled="settingsInternal.weighting_column === null"
                          hide-details
                          dense
                          small />

              <template v-slot:actions>
                <helptip position="top" :width="600">
                  <span v-html="$t('ds.modifiers.weighting_column_helptip')" />
                </helptip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">

                    <v-btn icon
                           small
                           @click="settingsInternal.weighting_column = null; settingsInternal.weighting_normalize = false"
                           v-on="on">
                      <v-icon class="delete">mdi-close</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('ds.modifiers.delete_helptip') }}</span>
                </v-tooltip>
              </template>
            </control-tile>
          </control-drawer>

        </v-list>

      </v-card-text>

      <v-divider/>
    </v-card>

    <v-dialog v-model="verbatimBrowser.show"
              max-width="100%"
              @keydown.esc="verbatimBrowser.show = false">
      <v-card>
        <verbatim-browser v-if="verbatimBrowser.show"
                          :height="verbatimBrowser.height"
                          :render-delay="500"
                          :answers="answers"
                          :codes="question.codebook"
                          :filters="verbatimBrowser.filters"
                          :show-column-options="showColumnOptions"
                          :show-column="verbatimBrowser.showColumn" />
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary"
                 outlined
                 @click="verbatimBrowser.show = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

</template>

<script>

import CodeSelect from '@/components/CodeSelect'
import VerbatimBrowser from '@/components/VerbatimBrowser'
import answerFilters from '@/mixins/answerFilters'

import ControlDrawer from '@/components/visualize/ControlDrawer'
import ControlTile from '@/components/visualize/ControlTile'

import { ADDITIONAL_COLUMNS } from '@/settings/constants'

_ = require('lodash')

export default {
  codit: true,
  name: 'Dataset',

  components: {
    'code-select': CodeSelect,
    'verbatim-browser': VerbatimBrowser,
    'control-drawer': ControlDrawer,
    'control-tile': ControlTile
  },

  mixins: [answerFilters],

  props: {
    settings: { type: Object, default: () => ({}) },
    filters: { type: Array, default: () => [] },
    question: { type: Object, default: () => ({}) },
    answers: { type: Array, default: () => [] },
    status: { type: Object, default: () => ({}) },
    draggable: { type: Boolean, default: false },
    deletable: { type: Boolean, default: false },
    duplicatable: { type: Boolean, default: false },
    isMaster: { type: Boolean, default: false },
    noEditTitle: { type: Boolean, default: false },
    noShowModifiers: { type: Boolean, default: false }
  },

  data () {
    return {
      editingTitle: false,

      filtersInternal: [],
      settingsInternal: {},

      filterCounts: [],

      additionalColumns: ADDITIONAL_COLUMNS,

      verbatimBrowser: {
        show: false,
        showColumn: '',
        height: 100,
        filters: []
      },

      deleteClicked: false,

      result: [],

      updateTotalCountDebounced: _.debounce(() => {
        this.result = this.filterAnswers(this.filtersInternal, this.answers)
        this.$emit('result', this.result)
        this.$emit('dirty', false)
      }, 0),

      updateTitleDebounced: _.debounce((val) => {
        this.settingsInternal.name = val
      }, 250),

      updateFilterCountsDebounced: _.debounce((idx) => {
        this.updateFilterCounts(idx)
      }, 250),

      emitSettingsDebounced: _.debounce((val) => {
        this.$emit('update:settings', _.cloneDeep(this.settingsInternal))
      }, 250)
    }
  },

  computed: {
    filterOptionsStandardFiltered () {
      let ffn = o => o.type !== 'auxiliary' && (o.multiple || !_.find(this.filtersInternal, { type: o.type }))
      return _.filter(this.filterOptionsStandard, ffn)
    },

    filterOptionsSelect () {
      let opts = []
      opts.push({ header: this.$t('answer_fields.standards') })
      opts.push(...this.filterOptionsStandardFiltered)
      // Filter out auxiliary columns that have already been used in filter items
      let auxColsFiltered = this.auxiliaryOptions.filter(o => !_.some(this.filtersInternal, it => it.type === 'auxiliary' && it.value.col === o.value && it.value.kind !== 'text'))
      if (this.auxiliaryOptions.length) {
        opts.push({ divider: true })
        opts.push({ header: this.$t('answer_fields.auxiliary') })
        opts.push(...auxColsFiltered.map(({ text, value }) => ({ text, type: `auxiliary:${value}` })))
      }
      return opts
    },

    auxiliaryOptions () {
      return this.question.auxiliary_column_names ? this.question.auxiliary_column_names.map((v, idx) => ({ value: idx, text: v })) : []
    },

    showColumnOptions () {
      let opts = []
      opts.push({ header: this.$t('answer_fields.standards') })
      opts.push(...this.additionalColumns.map((c, idx) => ({ text: this.$t(`answer_fields.${c}`), value: c })))
      if (this.auxiliaryOptions.length) {
        opts.push({ divider: true })
        opts.push({ header: this.$t('answer_fields.auxiliary') })
        opts.push(...this.auxiliaryOptions)
      }
      return opts
    },

    valueInternal () {
      return {
        settings: this.settings, filters: this.filtersInternal
      }
    },

    weightingColumnOptions () {
      if (!this.question.auxiliaryTypes) return []
      else return this.auxiliaryOptions.filter(({ value, text }) => this.question.auxiliaryTypes[value].type === 'number')
    }
  },

  watch: {
    answers: {
      immediate: true,
      handler () {
        this.filtersInternal.forEach((item, idx) => this.updateFilterCounts(idx))
      }
    },

    /**
     * Watch the internal state of settings for changes, emit update when change has occurred
     */
    settingsInternal: {
      deep: true,
      handler: 'emitSettingsDebounced'
    },

    /**
     * Watch the state of the settings prop
     * If it has changed, check if the value is the same as the internal object
     * Note: The objects should *never* be the same as the internal one, as we cloneDeep when emitting
     */
    settings: {
      immediate: true,
      deep: true,

      handler (settings) {
        if (!_.isEqual(settings, this.settingsInternal)) this.$set(this, 'settingsInternal', settings)
      }
    },

    /**
     * Watch the internal state of filters for changes, emit update when change has occurred
     */
    filtersInternal: {
      deep: true,
      handler () { this.$emit('update:filters', _.cloneDeep(this.filtersInternal)) }
    },

    /**
     * Watch the state of the filters prop
     * If it has changed, check if the value is the same as the internal object
     * Note: The objects should *never* be the same as the internal one, as we cloneDeep when emitting
     */
    filters: {
      immediate: true,
      deep: true,
      handler (filters) {
        if (!_.isEqual(filters, this.filtersInternal)) {
          this.$set(this, 'filtersInternal', filters)
          this.filtersInternal.forEach((_, fIdx) => this.updateFilterCounts(fIdx))
        }
      }
    },

    /**
     * Set the height of the verbatim browser according to the available space in the window
     */
    'verbatimBrowser.show' () {
      this.verbatimBrowser.height = window.innerHeight * 0.8
    }
  },

  methods: {
    addFilterItem (type = null, value = null) {
      this.filtersInternal.push({ type, value, invert: false })
      this.filterCounts.push(null)
      if (type !== null && value !== null) this.updateFilterCounts(this.filtersInternal.length - 1)
    },

    changeFilterItem (idx) {
      // Remove this marker, so the filter won't be deleted when re-applying master
      this.filtersInternal[idx].from_master = false
      this.updateFilterCountsDebounced(idx)
    },

    removeFilterItem (idx) {
      this.filtersInternal.splice(idx, 1)
      this.filterCounts.splice(idx, 1)
      this.updateTotalCountWrapper()
    },

    updateTotalCountWrapper () {
      this.$emit('dirty', true)
      this.updateTotalCountDebounced()
    },

    updateFilterCounts (idx) {
      this.$set(this.filterCounts, idx, this.filterAnswers([this.filtersInternal[idx]], this.answers).length)
      this.updateTotalCountWrapper()
    },

    setFilterItemType (item, type) {
      let value
      if (type.startsWith('auxiliary')) {
        value = { col: parseInt(type.split(':')[1]) }
        type = 'auxiliary'
      } else {
        value = _.clone(_.find(this.filterOptions, { type }).default)
      }

      this.$set(item, 'type', type)
      this.$set(item, 'value', value)

      if (type === 'auxiliary') this.setItemTypeAuxiliary(item)

      this.updateFilterCounts(this.filtersInternal.indexOf(item))
    },

    setItemTypeAuxiliary (item) {
      let value
      let tt = this.question.auxiliaryTypes[item.value.col]
      if (tt.type === 'number') value = { kind: 'range', value: [tt.min, tt.max] }
      else if (tt.type === 'string' && tt.few) value = { kind: 'select', value: [] }
      else value = { kind: 'text', value: '' }

      this.$set(item, 'value', { ...value, col: item.value.col })
      this.updateFilterCounts(this.filtersInternal.indexOf(item))
    },

    openVerbatimBrowser (items, showColumn = null) {
      if (!showColumn && items.length === 1 && items[0].type === 'auxiliary') showColumn = items[0].value.col
      else if (!showColumn && items.length === 1) showColumn = items[0].type
      else if (!showColumn) showColumn = 'codes'
      this.verbatimBrowser.filters = items
      this.verbatimBrowser.showColumn = showColumn
      this.verbatimBrowser.show = true
    },

    editTitle () {
      if (this.noEditTitle) return
      this.editingTitle = true
      this.$nextTick(() => this.$refs.dsName.focus())
    },

    deleteDeclicked () { this.deleteClicked = false },

    deleteDs () {
      if (this.deleteClicked) this.$emit('delete')
      else this.deleteClicked = true
    }
  }
}

</script>

<style lang=scss>

.sortable-ghost {
  opacity: 0.5;
  .v-list {
    background: none;
  }
  .v-card__title, .v-card__text {
    animation: highlight-ani 1s;
  }
}

.chart-ds-container {
  margin-top: 35px;
}

.chart-ds {
  .v-card__title {
    position: relative;
    .drag-handle {
      cursor: move;
      width: 24px;
      margin: 0 10px auto 0;
      font-size: 25px;
    }
    .title {
      cursor: pointer;
      display: block;
      margin-bottom: -2px;
      position: relative;
      flex-wrap: nowrap;

      > div {
        display: inline-block;
        white-space: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 90%;
      }

      .edit {
        margin-left: 5px;
        font-size: smaller;
        line-height: 14px;
        margin-top: -8px;
      }
    }
    .name-input {
      margin-left: -12px;
      margin-top: -11px;
      margin-bottom: -4px;
      width: 90%;
      max-width: 90%;
      font-size: 20px;
      .v-input__slot {
        min-height: 40px;
        input {
          font-weight: bold;
          padding: 0 0 4px;
          margin-top: 6px;
        }
      }
    }
    .matches-container-header {
      margin-bottom: -7px;
      margin-top: auto;
      margin-right: -11px;
      display: block;
      white-space: nowrap;
      .v-btn {
        margin: 0;
      }
    }
  }

  &.duplicated {
    .v-card__title, .v-card__text {
      animation: highlight-ani 1s;
    }
  }

  .filter-item, .modifier-item {
    .v-list-item__content {
      justify-content: space-between;
      .auxiliary-select {
        flex: 0 0 120px;
        margin-right: 2em;
      }

      label.from, label.to {
        margin-left: 5px;
        margin-right: 5px;
        margin-bottom: -15px;
        font-size: 10.5px;
      }

      .min-max {
        flex: 1 1 80px;
      }
    }

    .matches-container {
      flex: 0 0 50px;
      margin-right: 10px;
      margin-bottom: 4px;
      margin-left: 5px;
      text-align: right;
    }

    .v-list-item__action {
      .helptip {
        margin-right: 4px;
        .anchor { color: rgba(0, 0, 0, 0.54) }
      }
    }
  }

  .ds-actions {
    position: absolute;
    top: -20px;
    right: 5px;

    .v-btn {
      margin-left: 5px;
      transition: all 0.3s cubic-bezier(.25,.8,.5,1);
    }

    .delete-ds {
      position: relative;
      z-index: 1;
    }
  }
}

</style>

<i18n src='@/i18n/pages/ChartEditor.json'></i18n>
