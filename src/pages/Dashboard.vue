<template>
  <div class="main-content dashboard-page" ref="pageContainer">
    <alert type="error" v-if="status.loadingFailed">
      {{ $t('error', {'step': $t('loading.while')}) }}
    </alert>

    <loading v-else-if="status.loading"
             :is-loading="true"
             :dont-animate-entry="true"
             :title="$t('loading.title')"
             min-height="300px"
             tagline="" />

    <template v-else>

      <alert v-if="status.savingFailed" type="error">
        {{ $t('error', {'step': $t('save.saving')}) }}
      </alert>

      <div class="display-1" v-if="user.isAnonymous">
        {{ dashboard.name }}
      </div>

      <div class="editing-toolbar" v-else>
        <v-text-field v-model="dashboard.name"
                      :label="$t('editing_toolbar.name')"
                      :error="!dashboard.name.length"
                      class="name"
                      @input="status.dirty = true"
                      counter
                      maxlength="50"
                      hide-details
                      outlined />

        <v-switch v-model="dashboard.is_public"
                  :label="$t('editing_toolbar.is_public_label')"
                  @change="status.dirty = true"
                  class="is-public-switch"
                  hide-details />

        <helptip position="bottom" :width="650" class="is-public-helptip">
          <span v-html="$t('editing_toolbar.is_public_helptip')" />
        </helptip>

        <v-tooltip bottom v-if="dashboard.is_public">
          <template v-slot:activator="{ on }">
            <a :href="publicLink"
               v-on="on"
               class="public-link"
               target="_blank">{{ publicLink || $t('editing_toolbar.public_link_save_first') }}</a>
          </template>

          <span v-html="$t('editing_toolbar.public_link_tooltip')" v-if="publicLink" />
        </v-tooltip>

        <v-tooltip bottom :disabled="hasVisualizationsAccess">
          <template v-slot:activator="{ on }">
            <div v-on="on" class="save">
              <v-btn color="primary"
                     @click="save"
                     :error="status.savingFailed"
                     :loading="status.saving"
                     :disabled="!hasVisualizationsAccess || status.loading || status.saving || !isDirty || !dashboard.name.length"
                     style="height: auto">{{ $t('save.title') }}</v-btn>
            </div>
          </template>
          <span v-html="$t('warning_no_access')" />
        </v-tooltip>

      </div>

      <alert v-if="!hasVisualizationsAccess && !user.isAnonymous" type="warning">
        <span v-html="$t('warning_no_access')" />
      </alert>

      <v-divider style="margin: 12px 0" />

      <div class="dashboard"
           ref="dashboard"
           :style="{ height: `${(nRows + 2) * p2p - spacing}px` }"
           :class="{
             dragging: dragOrResize.active && dragOrResize.mode === 'drag',
             resizing: dragOrResize.active && dragOrResize.mode === 'resize'
           }"
           @drop.prevent="onDragDrop"
           @dragover.prevent.stop="onDragOrResizeOver($event)"
           @mousemove="onDragOrResizeOver($event)"
           @mouseup="onResizeEnd($event)">

        <template v-if="width !== -1">
          <div v-for="(el, elIdx) in dashboardElements"
               :class="dashboardElementClasses[elIdx]"
               :key="`element-${el.id}`"
               :style="dashboardElementStyles[elIdx]"
               class="dashboard-el"
               @dragstart="onDragOrResizeStart($event, el, 'drag')"
               @dragend="onDragEnd($event, el)"
               @dragover.prevent.stop="onDragOrResizeOver($event, el)"
               :ref="`dashboard-el-${el.id}`"
               draggable>
            <div class="header">
              <v-icon v-if="!user.isAnonymous"
                      @mousedown="dragOrResize.onMoveHandler = true; dragOrResize.element = el"
                      class="move-handler">mdi-drag</v-icon>
              <span class="title" v-if="!el.status.loading">{{ el.chart.name }}</span>
              <v-spacer />
              <template v-if="!user.isAnonymous">
                <v-btn v-if="el.chart.type.startsWith('p-')" icon @click="openAddOrEdit({ existing: el })">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn v-else :to="{ name: 'chart-details', params: { id: el.chart.id } }" icon>
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn @click="removeDashboardElement(elIdx)" icon>
                  <v-icon>mdi-close-circle</v-icon>
                </v-btn>
              </template>
            </div>
            <div class="content">
              <alert v-if="el.status.failed" type="error">
                {{ $t('error', {'step': $t('loading.while')}) }}
              </alert>

              <v-progress-linear indeterminate v-else-if="el.status.loading" style="margin: 0 12px" />

              <template v-else-if="el.chart.type.startsWith('p-')">
                <div v-if="el.chart.type === 'p-text'" class="p-container">
                  <div class="title"
                       :style="{
                         color: el.chart.config.colorTitle,
                         'text-align': el.chart.config.alignTitle
                  }">
                    {{ el.chart.config.title }}
                  </div>
                  <div class="pre"
                       :style="{
                         color: el.chart.config.colorText,
                         'text-align': el.chart.config.alignText
                  }">{{ el.chart.config.text }}</div><!-- Note: Important not to have spaces / newlines in elements formatted as pre -->
                </div>
                <div v-if="el.chart.type === 'p-verb'" class="p-container" :class="{ 'min-width': !!el.chart.config.showColumn }">
                  <verbatim-browser :height="el.height * p2p - 45"
                                    :render-delay="30"
                                    :answers="el.chart.datasets[0].result"
                                    :codes="el.chart.datasets[0].question.codebook"
                                    :filters="el.chart.datasets[0].filters"
                                    :display-count="el.chart.config.displayCount"
                                    :display-column-select="el.chart.config.displayColumnSelect"
                                    :show-column-options="el.chart.showColumnOptions"
                                    :show-column="el.chart.config.showColumn"
                                    @set-show-column="el.chart.config.showColumn = $event; el.status.dirty = true" />
                  <div class="title"
                       :style="{
                         color: el.chart.config.colorTitle,
                         'text-align': el.chart.config.alignTitle
                  }">
                    {{ el.chart.config.title }}
                  </div>
                  <div class="pre"
                       :style="{
                         color: el.chart.config.colorText,
                         'text-align': el.chart.config.alignText
                  }">{{ el.chart.config.text }}</div><!-- Note: Important not to have spaces / newlines in elements formatted as pre -->
                </div>
              </template>

              <component v-else
                         :is="`chart-${el.chart.type}`"
                         v-model="el.chart.config"
                         :datasets="el.chart.datasets"
                         hide-controls />

            </div>
            <v-icon :size="0.6 * p2p" class="dragging-placeholder">mdi-cursor-move</v-icon>
            <div v-if="!user.isAnonymous" class="resize-handler"
                 @mousedown="onDragOrResizeStart($event, el, 'resize')">
              <v-icon>mdi-resize-bottom-right</v-icon>
            </div>
          </div>
          <template v-if="!user.isAnonymous">
            <div v-for="(el, idx) in placeholderDashboardElements"
                 :key="`placeholder-el-${idx}`"
                 :style="{
                   width: `${p2p * el.width - spacing}px`,
                   height: `${p2p * el.height - spacing}px`,
                   left: `${p2p * el.x}px`,
                   top: `${p2p * el.y}px`
                 }"
                 class="dashboard-placeholder-el"
                 @click="openAddOrEdit({ x: el.x, y: el.y, width: el.width, height: el.height })">
              <v-icon :size="0.6 * p2p">mdi-plus</v-icon>
            </div>

            <div class="add-hint headline grey--text" :style="{ bottom: `${1.5 * p2p}px` }">{{ $t('add_hint') }}</div>
          </template>
        </template>
      </div>
    </template>

    <v-dialog v-model="addOrEdit.active"
              max-width="90%"
              @keydown.esc="closeAddOrEdit()"
              :persistent="addOrEdit.colorPicker.active"
              content-class="dashboard-add-or-edit">
      <v-card v-if="addOrEdit.active">
        <v-card-title class="headline" v-html="$t('add_or_edit.title')" />

        <alert v-if="addOrEdit.failed" v-html="$t('error', {'step': $t('loading.while')})" type="error" />
        <v-card-text v-else-if="addOrEdit.step === 'type-select'" class="type-select">
          <v-card class="element-option" @click="gotoAddElementStep('chart')">
            <v-card-title>
              <div class="title">{{ $t(`add_or_edit.type_select.chart.title`) }}</div>
              <div class="subtitle">{{ $t(`add_or_edit.type_select.chart.subtitle`) }}</div>
            </v-card-title>
            <v-responsive class="tile-img-container">
              <img src="../assets/visualize/tile-graph.jpg">
            </v-responsive>
          </v-card>

          <v-card class="element-option" @click="gotoAddElementStep('text')">
            <v-card-title>
              <div class="title">{{ $t(`add_or_edit.type_select.text.title`) }}</div>
              <div class="subtitle">{{ $t(`add_or_edit.type_select.text.subtitle`) }}</div>
            </v-card-title>
            <v-responsive class="tile-img-container">
              <v-icon>mdi-text-shadow</v-icon>
            </v-responsive>
          </v-card>

          <v-card class="element-option" @click="gotoAddElementStep('verbatims')">
            <v-card-title>
              <div class="title">{{ $t(`add_or_edit.type_select.verbatim.title`) }}</div>
              <div class="subtitle">{{ $t(`add_or_edit.type_select.verbatim.subtitle`) }}</div>
            </v-card-title>
            <v-responsive class="tile-img-container">
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-responsive>
          </v-card>

          <v-card class="element-option" exact :to="{ name: 'chart-details', params: { id: 'new' } }">
            <v-card-title>
              <div class="title">{{ $t(`menu.new`) }}</div>
            </v-card-title>
            <v-responsive class="tile-img-container">
              <v-icon>mdi-pen-plus</v-icon>
            </v-responsive>
          </v-card>
        </v-card-text>

        <v-card-text v-else-if="addOrEdit.step === 'chart'">
          <chart-list :charts="addOrEdit.charts"
                      :loading="addOrEdit.loading"
                      search-filter-enable
                      questions-filter-enable
                      :rows-per-page-options="[5]"
                      :rows-per-page-default="5"
                      ref="chartList"
                      @open-chart="addOrEdit.chart.id = $event; closeAddOrEdit(true)">
            <template slot="title"><div style="margin-left: -16px">{{ $t('add_or_edit.chart.title') }}</div></template>
          </chart-list>
        </v-card-text>

        <v-card-text v-else-if="addOrEdit.step === 'text'" class="step-text">
          <v-label>{{ $t('add_or_edit.text.instructions') }}</v-label>

          {{ addOrEdit.text.alignText }}

          <div class="inputrow">
            <v-text-field v-model="addOrEdit.text.title"
                          :label="$t('add_or_edit.title_label')"
                          tabindex="1"
                          outlined
                          hide-details />

            <v-btn-toggle v-model="addOrEdit.text.alignTitle" class="align-select">
              <v-btn text value="left">
                <v-icon>mdi-format-align-left</v-icon>
              </v-btn>
              <v-btn text value="center">
                <v-icon>mdi-format-align-center</v-icon>
              </v-btn>
              <v-btn text value="right">
                <v-icon>mdi-format-align-right</v-icon>
              </v-btn>
            </v-btn-toggle>

            <div class="color-indicator"
                 :style="{ 'background-color': addOrEdit.text.colorTitle }"
                 @click.stop="showColorPicker('text.colorTitle', $event)">
              <span>{{ $t('add_or_edit.color.label') }}</span>
            </div>
          </div>

          <div class="inputrow">
            <v-textarea v-model="addOrEdit.text.text"
                        outlined
                        tabindex="2"
                        :label="$t('add_or_edit.text.text')"
                        value=""
                        hide-details />

            <v-btn-toggle v-model="addOrEdit.text.alignText" class="align-select">
              <v-btn text value="left">
                <v-icon>mdi-format-align-left</v-icon>
              </v-btn>
              <v-btn text value="center">
                <v-icon>mdi-format-align-center</v-icon>
              </v-btn>
              <v-btn text value="right">
                <v-icon>mdi-format-align-right</v-icon>
              </v-btn>
            </v-btn-toggle>

            <div class="color-indicator"
                 :style="{ 'background-color': addOrEdit.text.colorText }"
                 @click.stop="showColorPicker('text.colorText', $event)">
              <span>{{ $t('add_or_edit.color.label') }}</span>
            </div>
          </div>

          <div class="inputrow">
            <v-spacer />
            <v-label style="margin: 0 12px">Background</v-label>
            <div class="color-indicator"
                 :style="{ 'background-color': addOrEdit.text.colorBG }"
                 @click.stop="showColorPicker('text.colorBG', $event)">
              <span>{{ $t('add_or_edit.color.label') }}</span>
            </div>
          </div>

          <v-divider style="margin-top: 36px" />
          <v-subheader>{{ $t('add_or_edit.text.preview') }}</v-subheader>

          <div class="bg-sample" :style="{ 'background-color': addOrEdit.text.colorBG }">
            <div class="title"
                 :style="{
                   color: addOrEdit.text.colorTitle,
                   'text-align': addOrEdit.text.alignTitle }
                 ">
              {{ addOrEdit.text.title }}
            </div>
            <div :style="{
                   color: addOrEdit.text.colorText,
                   'text-align': addOrEdit.text.alignText
                 }"
                 class="pre">{{ addOrEdit.text.text }}</div>
          </div>

          <div class="color-picker elevation-12"
               :class="{ show: addOrEdit.colorPicker.active }"
               :style="{
                 left: `${addOrEdit.colorPicker.offsetLeft - 314}px`,
                 top: '10px'
               }"
               v-c-click-outside="hideColorPicker"
               @click.stop>
            <div class="arrow" ref="arrow" :style="{ top: `${addOrEdit.colorPicker.offsetTop}px` }"/>
            <v-color-picker v-model="addOrEdit.colorPicker.val"
                            mode="rgba"
                            :swatches="[colorPalettesAsHexA[addOrEdit.colorPicker.palette]]"
                            show-swatches
                            flat />
            <v-radio-group v-model="addOrEdit.colorPicker.palette"
                           :label="$t('add_or_edit.color.palette.title')"
                           hide-details
                           class="palette-chooser">
              <v-radio v-for="(palette, name) in colorPalettes"
                       :key="name"
                       :label="$te(`add_or_edit.color.palette.${name}`) ? $t(`add_or_edit.color.palette.${name}`) : name"
                       :value="name" />
            </v-radio-group>
          </div>

        </v-card-text>

        <v-card-text v-else-if="addOrEdit.step === 'verbatims'" class="step-verbatims">
          <alert v-if="addOrEdit.verbatims.failed || (addOrEdit.verbatims.chart.datasets && addOrEdit.verbatims.chart.datasets[0].status.failed)" type="error">
            {{ $t('error', {'step': $t('loading.while')}) }}
          </alert>
          <project-list v-if="addOrEdit.verbatims.question === null"
                        :projects="addOrEdit.verbatims.projects"
                        :loading="addOrEdit.verbatims.loading"
                        :hide-columns="{ last_modified: true }"
                        search-filter-enable
                        labels-filter-enable
                        hide-incomplete-filter-enable
                        :rows-per-page-options="[5]"
                        :rows-per-page-default="5"
                        in-dialog
                        ref="projectList">
            <template slot="title"><div style="margin-left: -16px">{{ $t('add_or_edit.verbatims.title_question') }}</div></template>
            <template slot="action" slot-scope="{ question }">
              <v-btn outlined color="primary"
                     @click="selectQuestionForVerbatims(question)">
                {{ $t('add_or_edit.verbatims.select_question') }}
              </v-btn>
            </template>
          </project-list>

          <template v-else>
            <v-text-field v-model="addOrEdit.verbatims.chart.name"
                          :label="$t('add_or_edit.title_label')"
                          class="title"
                          outlined
                          hide-details />

            <dataset :settings.sync="addOrEdit.verbatims.chart.datasets[0].settings"
                     :fitlers.sync="addOrEdit.verbatims.chart.datasets[0].fitlers"
                     :question="addOrEdit.verbatims.chart.datasets[0].status.loading ? {} : addOrEdit.verbatims.chart.datasets[0].question"
                     :answers="addOrEdit.verbatims.chart.datasets[0].answers"
                     :status="addOrEdit.verbatims.chart.datasets[0].status"
                     no-edit-title
                     no-show-modifiers
                     @result="$set(addOrEdit.verbatims.chart.datasets[0], 'result', $event)" />

            <v-select v-model="addOrEdit.verbatims.chart.config.showColumn"
                      dense
                      :items="addOrEdit.verbatims.chart.showColumnOptions"
                      :label="$t('add_or_edit.verbatims.additional_column_select')"
                      hide-details
                      clearable
                      @click.clear="addOrEdit.verbatims.chart.config.showColumn = null"
                      style="width: 500px" />

            <v-switch v-model="addOrEdit.verbatims.chart.config.displayColumnSelect"
                      :label="$t('add_or_edit.verbatims.display_column_select')"
                      hide-details />

            <v-switch v-model="addOrEdit.verbatims.chart.config.displayCount"
                      :label="$t('add_or_edit.verbatims.display_count')"
                      hide-details />

          </template>
        </v-card-text>

        <v-spacer />
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary"
                 outlined
                 @click="closeAddOrEdit()">{{ $t('cancel') }}</v-btn>
          <v-btn v-if="['text', 'verbatims'].indexOf(addOrEdit.step) !== -1"
                 color="primary"
                 @click="closeAddOrEdit(true)">{{ addOrEdit.existingEl ? $t('save.title') : $t('add_or_edit.add') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>

import axios from 'axios'
import Vuex from 'vuex'

import ProjectList from '@/components/ProjectList'
import ChartList from '@/components/ChartList'
import Dataset from '@/components/visualize/Dataset'
import VerbatimBrowser from '@/components/VerbatimBrowser'
import ChartBar from '@/components/visualize/ChartBar'
import ChartLinePie from '@/components/visualize/ChartLinePie'
import ChartTreemap from '@/components/visualize/ChartTreemap'
import ChartGraph from '@/components/visualize/ChartGraph'
import answerFilters from '@/mixins/answerFilters'
import colorPalettes from '@/mixins/colorPalettes'
import ProjectListMixin from '@/mixins/ProjectList'

import {
  ADDITIONAL_COLUMNS, CHART_TYPES_TO_API_ENUM, /* CHART_TYPES, */
  CHART_TYPE_BAR, CHART_TYPE_LINE_PIE, CHART_TYPE_TREEMAP, CHART_TYPE_GRAPH, CHART_TYPE_PSEUDO_TEXT, CHART_TYPE_PSEUDO_VERBATIMS,
  DS_FILTERS_TEMPLATE, DS_SETTINGS_TEMPLATE
} from '@/settings/constants'

const MAX_PLACEHOLDER_X = 5
const MAX_PLACEHOLDER_Y = 4

const EL_STATUS_TEMPLATE = { dirty: false, loading: false, failed: false }
const DS_STATUS_TEMPLATE = { loading: false, failed: false }

export default {
  codit: true,
  name: 'Dashboard',
  components: {
    'project-list': ProjectList,
    'chart-list': ChartList,
    'verbatim-browser': VerbatimBrowser,
    'dataset': Dataset,
    [`chart-${CHART_TYPE_BAR}`]: ChartBar,
    [`chart-${CHART_TYPE_LINE_PIE}`]: ChartLinePie,
    [`chart-${CHART_TYPE_TREEMAP}`]: ChartTreemap,
    [`chart-${CHART_TYPE_GRAPH}`]: ChartGraph
  },

  mixins: [answerFilters, colorPalettes, ProjectListMixin],

  data () {
    return {
      SPACING_PERCENTAGE: 0.01,
      nCols: 10,

      mounted: false,
      width: -1,

      dragOrResize: {
        mode: null,
        onMoveHandler: false,
        active: false,
        element: {},
        mouseOffset: { x: 0, y: 0 },
        positionMatAtStart: [],
        isProcessing: false
      },

      status: {
        loading: false,
        loadingFailed: false,
        dirty: false,
        saving: false,
        savingFailed: false,
        programmaticRouteChange: true
      },

      addOrEdit: {
        existingEl: null,
        active: false,
        charts: [],
        loading: false,
        step: 'type-select',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        colorPicker: {
          active: false,
          palette: 'default',
          offsetLeft: 0,
          offsetTop: 0,
          val: { r: 0, g: 0, b: 0, a: 1.0 },
          prop: ''
        },
        verbatims: {
          projects: [],
          loading: false,
          failed: false,
          question: null,
          chart: { }
        },
        text: {
          title: '',
          text: '',
          alignTitle: 'center',
          alignText: 'center',
          colorTitle: 'rgba(66, 66, 66, 1.0)',
          colorText: 'rgba(66, 66, 66, 1.0)',
          colorBG: 'rgba(255, 255, 255, 1.0)'
        },
        chart: {
          id: null
        }
      },

      questionCache: {},

      dashboard: {
        id: 'new',
        name: this.$t('editing_toolbar.name_new'),
        is_public: false,
        public_uuid: ''
      },

      dashboardElements: [],

      getAndSetContainerWidthDebounced: _.debounce(() => {
        this.width = this.$refs.dashboard.clientWidth
      }, 40)
    }
  },

  computed: {
    /**
     * The dashboard elements which have been modified since the last save
     * Only pseudo-charts can be modified in the dashboard view itself, but to be 100% sure we don't
     * save any other kinds of charts (which would not work nicely with our lazy implementation of saving)
     * Also filter for pseudo elements
     * @return {Array} List of dashboard elements that are dirty
     */
    dashboardElementsDirty () {
      return this.dashboardElements.filter(el => el.status.dirty && el.chart.type.startsWith('p-'))
    },

    hasVisualizationsAccess () {
      return this.user.subscription.plan.visualizations_access
    },

    publicLink () {
      if (this.dashboard.id === 'new') return undefined
      else return `${window.location.origin}/app${this.$route.matched[0].path.replace(':id', 'p-' + this.dashboard.public_uuid)}`
    },

    isDirty () { return this.status.dirty || this.dashboardElementsDirty.length },
    /**
     * Percentage to pixel factor
     * @return {Number}
     */
    p2p () {
      return this.blockWidth + this.spacing
    },

    blockWidth () {
      return this.width * (1 - (this.nCols - 1) * this.SPACING_PERCENTAGE) / this.nCols
    },

    spacing () {
      return this.width * this.SPACING_PERCENTAGE
    },

    nRows () {
      return _(this.dashboardElements).map(e => e.y + e.height).max() || 1 // prevent NaN when not having elements
    },

    dashboardPositionMatrix () {
      let mat = []
      for (let k = 0; k < this.nCols; k++) mat.push(new Array(this.nRows).fill(0))
      this.dashboardElements.forEach(del => this.addElementToPositionMat(del, mat))
      return mat
    },

    dashboardElementClasses () {
      return _.map(this.dashboardElements, el => {
        let isDraggingOrResizingEl = this.dragOrResize.element.id === el.id
        return {
          dragging: ((this.dragOrResize.active && this.dragOrResize.mode === 'drag') || this.dragOrResize.onMoveHandler) && isDraggingOrResizingEl,
          resizing: this.dragOrResize.active && this.dragOrResize.mode === 'resize' && isDraggingOrResizingEl,
          [el.chart.type]: true
        }
      })
    },

    dashboardElementStyles () {
      return _.map(this.dashboardElements, el => {
        return {
          width: `${this.p2p * el.width - this.spacing}px`,
          height: `${this.p2p * el.height - this.spacing}px`,
          left: `${this.p2p * el.x}px`,
          top: `${this.p2p * el.y}px`,
          // Add some special styles if we have a placeholder-chart element on our hands
          ...el.chart.type === 'p-text' && { 'background-color': el.chart.config.colorBG }
        }
      })
    },

    /**
     * List of placeholder elements, that one can click on to add a new dashboard element
     * @return {Array}  A list of elements that fill up the empty space intelligently (more or less..)
     */
    placeholderDashboardElements () {
      if (this.dragOrResize.active) return []
      let elements = []
      let placeholderMat = []
      for (let k = 0; k < this.nCols; k++) placeholderMat.push(new Array(this.nRows + 1).fill(false))
      for (let x = 0; x < this.nCols; x++) {
        for (let y = 0; y < (this.nRows + 2); y++) {
          if (!this.dashboardPositionMatrix[x][y] && !placeholderMat[x][y]) {
            // Try to grow the placeholder element as far as possible
            let width = 1
            let height = 1
            let goRight = true
            while (width <= MAX_PLACEHOLDER_X && height <= MAX_PLACEHOLDER_Y) {
              let tmpX = x + width + goRight - 1
              let tmpY = y + height + !goRight - 1
              let occupied = false
              if (tmpX >= this.nCols || tmpY > (this.nRows + 1)) break

              if (goRight) {
                for (let checkY = y; checkY <= tmpY; checkY++) {
                  if (this.dashboardPositionMatrix[tmpX][checkY] || placeholderMat[tmpX][checkY]) {
                    occupied = true
                    break
                  }
                }
              } else {
                for (let checkX = x; checkX <= tmpX; checkX++) {
                  if (this.dashboardPositionMatrix[checkX][tmpY] || placeholderMat[checkX][tmpY]) {
                    occupied = true
                    break
                  }
                }
              }

              if (occupied) break
              else {
                width += goRight
                height += !goRight
                goRight = !goRight
              }
            }
            for (let tmpX = x; tmpX < (x + width); tmpX++) {
              for (let tmpY = y; tmpY < (y + height); tmpY++) {
                placeholderMat[tmpX][tmpY] = true
              }
            }
            elements.push({ x, y, width, height })
          }
        }
      }
      return elements
    },

    elementID2element () {
      let mapping = {}
      this.dashboardElements.forEach(del => { mapping[del.id] = del })
      return mapping
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

    dashboardAPIObject () {
      let { name, is_public } = this.dashboard // eslint-disable-line camelcase
      return {
        name,
        is_public,
        elements: this.dashboardElements.map(({ x, y, width, height, chart }) => ({
          x, y, width, height, chart: chart.id
        }))
      }
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    'addOrEdit.colorPicker.val' ({ r, g, b, a }) {
      if (this.addOrEdit.colorPicker.prop) _.set(this.addOrEdit, this.addOrEdit.colorPicker.prop, `rgba(${r},${g},${b},${a})`)
    }
  },

  created () {
    if (this.$route.params.id !== 'new') {
      if (this.$route.params.id && String(this.$route.params.id).startsWith('p-')) this.$store.commit('userIsAnonymous')
      this.status.loading = true
      api.get(`/api/dashboards/${this.$route.params.id}`).then((res) => {
        let dashboard = res.data
        dashboard.elements.forEach(el => {
          // Add and convert some chart attributes
          el.chart = this.preprocessLoadedChart(el.chart)
          this.addDashboardElement(el)
        })

        // We don't need the elements property again the dashboard object
        dashboard.elements = undefined
        this.$set(this, 'dashboard', dashboard)
        this.loadDashboardElements(this.dashboardElements)
        this.setBreadcrumbProps()
        this.status.loading = false
        // Clear the dirty flag again, which might have been triggered by the watcher
        this.status.dirty = false
        if (this.mounted) this.getAndSetContainerWidthDebounced()
      }).catch((err) => {
        this.status.loading = false
        this.status.loadingFailed = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    } else this.setBreadcrumbProps()
  },

  mounted () {
    window.addEventListener('dragover', this.onDragOrResizeOverInvalid)
    window.addEventListener('resize', this.getAndSetContainerWidthDebounced)
    window.addEventListener('mouseup', this.onResizeEnd)
    window.addEventListener('beforeunload', this.beforeUnload)
    if (!this.status.loading) this.getAndSetContainerWidthDebounced()
    this.mounted = true
  },

  beforeDestroy () {
    window.removeEventListener('dragover', this.onDragOrResizeOverInvalid)
    window.removeEventListener('resize', this.getAndSetContainerWidthDebounced)
    window.removeEventListener('beforeunload', this.beforeUnload)
    window.removeEventListener('mouseup', this.onResizeEnd)
  },

  beforeRouteLeave (to, from, next) {
    let doIt = true
    // If there is an active chart, confirm navigating away
    if (this.isDirty) doIt = confirm(this.$t('confirm_navigate_away'))
    next(doIt)
  },

  methods: {
    chartToAPIObject (chart) {
      let { name, type, config } = chart
      return {
        name,
        type: CHART_TYPES_TO_API_ENUM[type],
        config,
        datasets: _.map(chart.datasets, ({ filters, settings, question }) => ({
          question: question.id,
          filters,
          settings
        }))
      }
    },

    beforeUnload ($event) {
      if (this.isDirty) $event.returnValue = true
    },

    save () {
      this.status.saving = true
      this.status.savingFailed = false

      let saveDashboardFn = () => {
        this.status.dirty = false
        let request
        // Check if this dashboard already exists and we just need to update it
        // or if it should become a new one
        if (this.dashboard.id === 'new') request = api.post(`/api/dashboards/`, this.dashboardAPIObject)
        else request = api.patch(`/api/dashboards/${this.dashboard.id}`, this.dashboardAPIObject)

        request.then((res) => {
          if (res.status >= 400) throw Error('Dashboard creation failed.')
          if (res.status === 201) {
            this.$set(this, 'dashboard', res.data)
            // Mark this as programmatic change, i.e. we don't need to update the state through the route guard
            this.status.programmaticRouteChange = true
            this.$router.replace({ // Set the id in the URI
              name: 'dashboard-details',
              params: { id: res.data.id },
              query: {}
            })
          }
          this.setBreadcrumbProps()
          this.status.saving = false
        }).catch((err) => {
          this.status.saving = false
          this.status.savingFailed = true
          this.dirty = true
          this.$maybeRaiseAPIPromiseErr(err)
        })
      }

      // The first step is to actually update all the chart objects that have changed
      // Only pseudo-chart elements can have changed
      // As we are a lazy bunch, we just re-create the pseudo-charts every time they are modified
      // and let the deleted ones be cleaned up by our server-side clean script
      // Pseudo-charts are not visible anywhere to the user once unreferenced from dashboard
      let chartCreateRequests = this.dashboardElementsDirty.map(el => {
        return api.post(`/api/charts/`, this.chartToAPIObject(el.chart)).then(res => {
          if (res.status >= 400) throw Error('Chart creation failed.')
          el.chart.id = res.data.id
          el.status.dirty = false
        })
      })

      // Once all the single chart create requests have completed, save the actual dashboard
      axios.all(chartCreateRequests).then(saveDashboardFn).catch((err) => {
        this.status.saving = false
        this.status.savingFailed = true
        this.status.dirty = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    setBreadcrumbProps () {
      this.$store.commit('setBreadcrumbProps', {
        dashboardID: this.dashboard.id,
        dashboardName: this.dashboard.name
      })
    },

    showColorPicker (prop, $event) {
      this.addOrEdit.colorPicker.offsetLeft = $event.srcElement.offsetLeft
      this.addOrEdit.colorPicker.offsetTop = $event.srcElement.offsetTop
      this.addOrEdit.colorPicker.prop = prop
      this.addOrEdit.colorPicker.val = this.parseColor(_.get(this.addOrEdit, prop))
      this.addOrEdit.colorPicker.active = true
    },

    hideColorPicker () {
      this.addOrEdit.colorPicker.active = false
    },

    openAddOrEdit ({ x, y, existing, width = 1, height = 1 }) {
      if (!existing) {
        if (x === undefined || y === undefined) {
          x = 0
          y = this.nRows + 1
        }

        this.addOrEdit.x = x
        this.addOrEdit.y = y
        this.addOrEdit.width = width
        this.addOrEdit.height = height
        this.addOrEdit.step = 'type-select'
        this.addOrEdit.existingEl = null
        this.addOrEdit.loading = true
        this.addOrEdit.failed = false
        this.addOrEdit.text.title = ''
        this.addOrEdit.text.text = ''
        this.addOrEdit.verbatims.question = null
        this.addOrEdit.verbatims.loading = false
        this.addOrEdit.verbatims.failed = false
        this.addOrEdit.verbatims.chart = {}

        api.get('/api/charts/').then((res) => {
          let charts = res.data
          charts.forEach(c => { c.ndatasets = c.datasets.length })
          this.$set(this.addOrEdit, 'charts', charts)
          this.addOrEdit.loading = false
        }).catch((err) => {
          this.addOrEdit.failed = true
          this.addOrEdit.loading = false
          this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
          this.$maybeRaiseAPIPromiseErr(err)
        })
      } else {
        this.addOrEdit.existingEl = existing
        if (existing.chart.type === CHART_TYPE_PSEUDO_TEXT) {
          this.addOrEdit.step = 'text'
          this.addOrEdit.loading = true
          this.addOrEdit.failed = false
          this.$set(this.addOrEdit, 'text', _.cloneDeep(existing.chart.config))
        } else if (existing.chart.type === CHART_TYPE_PSEUDO_VERBATIMS) {
          // Set the verbatims editor to the correct state
          this.addOrEdit.step = 'verbatims'
          this.addOrEdit.verbatims.question = existing.chart.datasets[0].question.id
          // Make sure to deep copy objects of the chart config and the dataset
          // Otherwise any changes would be applied directly, also if the user
          // chose to not save them
          this.addOrEdit.verbatims.chart = {
            ...existing.chart,
            config: _.cloneDeep(existing.chart.config),
            datasets: [{
              ...existing.chart.datasets[0],
              settings: _.cloneDeep(existing.chart.datasets[0].settings),
              filters: _.cloneDeep(existing.chart.datasets[0].filters)
            }]
          }
        }
      }
      this.addOrEdit.active = true
    },

    closeAddOrEdit (doAdd) {
      if (doAdd) {
        let newEl = { x: this.addOrEdit.x, y: this.addOrEdit.y, width: this.addOrEdit.width, height: this.addOrEdit.height }
        switch (this.addOrEdit.step) {
          case 'chart':
            let dashboardEl = this.addDashboardElement({
              ...newEl,
              status: { loading: true },
              chart: { id: this.addOrEdit.chart.id, type: '' }
            })
            this.loadChart(dashboardEl)
            break
          case 'text':
            if (this.addOrEdit.existingEl) {
              this.addOrEdit.existingEl.status.dirty = true
              this.$set(this.addOrEdit.existingEl.chart, 'config', _.cloneDeep(this.addOrEdit.text))
            } else {
              let chart = {
                name: '',
                type: CHART_TYPE_PSEUDO_TEXT,
                config: _.cloneDeep(this.addOrEdit.text)
              }
              this.addDashboardElement({ ...newEl, chart, status: { dirty: true } })
            }
            break
          case 'verbatims':
            if (this.addOrEdit.existingEl) {
              this.addOrEdit.existingEl.chart = this.addOrEdit.verbatims.chart
              this.addOrEdit.existingEl.status.dirty = true
            } else this.addDashboardElement({ ...newEl, chart: this.addOrEdit.verbatims.chart, status: { dirty: true } })
            break
          default:
            throw Error(`Unknown step to add dashboard element ${this.addOrEdit.step}`)
        }
      }
      this.addOrEdit.active = false
    },

    gotoAddElementStep (step) {
      this.addOrEdit.step = step

      if (step === 'verbatims') {
        this.addOrEdit.verbatims.question = null
        this.addOrEdit.verbatims.loading = true
        this.addOrEdit.verbatims.failed = false
        api.get('/api/projects/').then((res) => {
          let projects = res.data
          this.$set(this.addOrEdit.verbatims, 'projects', projects)
          this.computeProjectProperties('addOrEdit.verbatims.projects')
          this.addOrEdit.verbatims.loading = false
        }).catch((err) => {
          this.addOrEdit.verbatims.failed = true
          this.addOrEdit.verbatims.loading = false
          this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
          this.$maybeRaiseAPIPromiseErr(err)
        })
      }
    },

    addDashboardElement ({ x, y, width, height, chart, status }) {
      let dashboardEl = {
        id: this.$uuidv4(), // this is only a local id, used by vue and js, not persistent
        x,
        y,
        width: width || 1,
        height: height || 1,
        status: { ..._.cloneDeep(EL_STATUS_TEMPLATE), ...status },
        chart: chart || null
      }

      this.status.dirty = true

      this.dashboardElements.push(dashboardEl)
      return dashboardEl
    },

    /**
     * Removes the dashboard element defined by its index
     * @param  {Integer} elIdx The index of the dashboard element to be removed
     */
    removeDashboardElement (elIdx) {
      this.dashboardElements.splice(elIdx, 1)
      this.status.dirty = true
    },

    loadChart (dashboardEl) {
      api.get(`/api/charts/${dashboardEl.chart.id}`).then(res => {
        if (res.status !== 200) {
          dashboardEl.status.failed = true
          dashboardEl.status.loading = false
          throw Error('Failed to load chart')
        }

        this.$set(dashboardEl, 'chart', this.preprocessLoadedChart(res.data))
        this.loadDashboardElements([dashboardEl])
      }).catch(err => {
        dashboardEl.status.failed = true
        dashboardEl.status.loading = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    preprocessLoadedChart (chart) {
      // Convert the API enum to the frontend type
      chart.type = this.apiEnumToChartType[chart.type]
      // Add the status property to all elements in dataset array
      // Check that all datasets have the status property
      chart.datasets.forEach(ds => {
        if (!_.has(ds, 'status')) this.$set(ds, 'status', _.cloneDeep(DS_STATUS_TEMPLATE))
      })
      return chart
    },

    loadDashboardElements (dashboardElements) {
      let dashboardElementsByQuestionID = {}
      dashboardElements.forEach(el => {
        if (el.chart.datasets.length) el.status.loading = true
        el.chart.datasets.forEach(ds => {
          ds.status.loading = true
          if (!(ds.question in dashboardElementsByQuestionID)) dashboardElementsByQuestionID[ds.question] = []
          if (!dashboardElementsByQuestionID[ds.question].includes(el)) dashboardElementsByQuestionID[ds.question].push(el)
        })
      })

      let assignLoadedQuestionToDatasets = (questionID) => {
        dashboardElementsByQuestionID[questionID].forEach(el => {
          el.chart.datasets.forEach(ds => {
            if (ds.question === questionID) {
              this.$set(ds, 'answers', this.questionCache[ds.question].answers)
              this.$set(ds, 'result', this.filterAnswers(ds.filters, this.questionCache[ds.question].answers))
              this.$set(ds, 'question', this.questionCache[ds.question].question)
              ds.status.loading = false
            }
          })

          if (el.chart.datasets.every(ds => !ds.loading)) {
            el.status.loading = false
            this.chartSpecificPostLoadActions(el.chart)
          }
        })
      }

      let getOpts = {
        dontReport: [401, 403],
        params: { ...(this.user.isAnonymous) && { 'public_uuid': this.dashboard.public_uuid } }
      }
      let questionsLoading = new Set()

      dashboardElements.forEach(el => {
        el.chart.datasets.forEach(ds => {
          let questionID = ds.question
          // Check that this dataset has not been loaded already, then the question
          // would be an object not an id
          if (!ds.status.loading) return
          // Check if we're already loading that question
          if (questionsLoading.has(questionID)) return
          // Check if there is already a cached version of this question
          if (questionID in this.questionCache) {
            assignLoadedQuestionToDatasets(questionID)
          // If all checks fail, load the question
          } else {
            questionsLoading.add(questionID)
            let question, answers
            let questionURI = `/api/charts/${el.chart.id}/questions/${questionID}`
            let qr = api.get(questionURI, getOpts).then(res => { question = res.data })
            let ar = api.get(questionURI + '/answers', getOpts).then(res => { answers = res.data.map(Object.freeze) })

            axios.all([qr, ar]).then(() => {
              this.questionCache[questionID] = { question, answers }
              assignLoadedQuestionToDatasets(questionID)
            }).catch((err) => {
              dashboardElementsByQuestionID[questionID].forEach(el => {
                el.chart.datasets.forEach(ds => {
                  if (ds.question === questionID) {
                    ds.status.failed = true
                    ds.status.loading = false
                  }
                })
                el.status.failed = true
                this.$maybeRaiseAPIPromiseErr(err)
              })
            })
          }
        })
      })
    },

    chartSpecificPostLoadActions (chart) {
      if (chart.type === CHART_TYPE_PSEUDO_VERBATIMS) {
        let auxiliaryOptions = chart.datasets[0].question.auxiliary_column_names.map((v, idx) => ({ value: idx, text: v }))

        let opts = []
        opts.push({ header: this.$t('answer_fields.standards') })
        opts.push(...ADDITIONAL_COLUMNS.map((c, idx) => ({ text: this.$t(`answer_fields.${c}`), value: c })))
        if (auxiliaryOptions.length) {
          opts.push({ divider: true })
          opts.push({ header: this.$t('answer_fields.auxiliary') })
          opts.push(...auxiliaryOptions)
        }
        this.$set(chart, 'showColumnOptions', opts)
      }
    },

    selectQuestionForVerbatims (question) {
      this.addOrEdit.verbatims.question = question
      this.$set(this.addOrEdit.verbatims, 'chart', {
        name: '',
        type: CHART_TYPE_PSEUDO_VERBATIMS,
        config: {
          displayCount: true,
          displayColumnSelect: true,
          showColumn: 'codes'
        },
        datasets: [{
          filters: _.cloneDeep(DS_FILTERS_TEMPLATE),
          settings: { ..._.cloneDeep(DS_SETTINGS_TEMPLATE), name: this.$t('add_or_edit.verbatims.title_dataset') },
          status: { ..._.cloneDeep(DS_STATUS_TEMPLATE), loading: true },
          question: question.id,
          answers: [],
          result: []
        }]
      })

      // Although we don't have a dashboard element yet, fake one in order to make use
      // of the chart loading function
      this.loadDashboardElements([{ status: {}, chart: this.addOrEdit.verbatims.chart }])
    },

    onDragOrResizeStart ($event, element, mode) {
      if (mode !== 'drag' && mode !== 'resize') throw Error(`Got invalid mode ${mode}`)
      if (mode === 'drag' && !this.dragOrResize.onMoveHandler) return $event.preventDefault()

      if (mode === 'drag') {
        $event.dataTransfer.effectAllowed = 'move'
        $event.dataTransfer.dropEffect = 'move'
      }

      this.dragOrResize.mode = mode
      this.dragOrResize.active = true
      this.dragOrResize.element = element
      this.dragOrResize.mouseOffset.x = $event.offsetX
      this.dragOrResize.mouseOffset.y = $event.offsetY

      this.dragOrResize.positionMatAtStart = _.cloneDeep(this.dashboardPositionMatrix)
      this.dragOrResize.elementArrAtStart = this.dashboardElements.map(el => _.pick(el, ['x', 'y', 'width', 'height']))
    },

    onDragEnd ($event, element) {
      this.dragOrResize.active = false
      this.dragOrResize.onMoveHandler = false
    },

    /**
     * Handler for draggig over valid drop zone
     * @param  {Event} $event     Original drag event
     * @param  {Object} element   The element being dragged (if hovering over itself), otherwise undefined
     */
    onDragOrResizeOver ($event, element) {
      // Check that we are only processing this function once in parallel
      // Drop other events
      if (!this.dragOrResize.active || this.dragOrResize.isProcessing) return
      this.dragOrResize.isProcessing = true

      if (this.dragOrResize.mode === 'drag') $event.dataTransfer.dropEffect = 'move'

      this.status.dirty = true

      // Get the position we are currently at
      // Add the position within the dragged element that was clicked,
      // to match not the mouse but the real dimension of the element
      let x = $event.offsetX - this.dragOrResize.mouseOffset.x
      let y = $event.offsetY - this.dragOrResize.mouseOffset.y

      // If we are actually hovering the dragged element itself
      // Add that element's position
      if (element !== undefined) {
        let draggingDOMEl = this.$refs[`dashboard-el-${this.dragOrResize.element.id}`][0]
        x += draggingDOMEl.offsetLeft
        y += draggingDOMEl.offsetTop
      }

      // Round to the current block
      x = Math.round(x / this.p2p)
      y = Math.round(y / this.p2p)

      // Make sure the block isn't out of bounds
      x = Math.max(Math.min(x, this.nCols), 0)
      y = Math.max(Math.min(y, this.nRows + 1), 0)

      let elementNew
      if (this.dragOrResize.mode === 'drag') {
        x = Math.min(x, this.nCols - this.dragOrResize.element.width)
        if (this.dragOrResize.element.x !== x || this.dragOrResize.element.y !== y) {
          elementNew = { ...this.dragOrResize.element, x, y }
        }
      } else if (this.dragOrResize.mode === 'resize') {
        // Don't let an element shrink below the size of 1x1
        let width = Math.max(x - this.dragOrResize.element.x, 1)
        let height = Math.max(y - this.dragOrResize.element.y, 1)
        if (this.dragOrResize.element.width !== width || this.dragOrResize.element.height !== height) {
          elementNew = { ...this.dragOrResize.element, width, height }
        }
      }

      // Only if the position has changed compared to the last time, do the more expensive calculations
      if (elementNew) {
        // First, reset all element's positions to the state where the drag started
        this.dashboardElements.forEach((del, dIdx) => {
          let atStart = this.dragOrResize.elementArrAtStart[dIdx]
          del.x = atStart.x
          del.y = atStart.y
          del.width = atStart.width
          del.height = atStart.height
        })

        // Again, initial state, plus remove the currently dragging el from the position matrix
        let positionMat = _.cloneDeep(this.dragOrResize.positionMatAtStart)
        this.clearElementFromPositionMat(this.dragOrResize.element, positionMat)

        // Compute the new position of overlapping blocks recursively
        let movingResult = this.makeSpaceForElement(elementNew, positionMat, {}, true, true, true, true)

        // This is actually never allowed to happen.. would mean a bug :/
        if (!movingResult.possible) throw Error('Making space didn\'t work!', movingResult)

        // Do all the updates of the elements, whose position has been temporarily set
        _.each(movingResult.elementsMoved, (movedEl) => {
          let realElement = this.elementID2element[movedEl.id]
          realElement.x = movedEl.x
          realElement.y = movedEl.y
          realElement.width = movedEl.width
          realElement.height = movedEl.height
        })
      }
      this.dragOrResize.isProcessing = false
    },

    onResizeEnd ($event, element) {
      if (this.dragOrResize.active && this.dragOrResize.mode === 'resize') this.dragOrResize.active = false
      if (this.dragOrResize.onMoveHandler) this.dragOrResize.onMoveHandler = false
    },

    /**
     * Recursive function taking an element and making sure all other elements are positioned in a way that this element fits
     * @param  {Object} element         The element to position
     * @param  {2D-Mat} positionMat     Position matrix of [x][y] -> elementID
     * @param  {Object} elementsMoved   Changed elements at current envocation. Format: Mapping of elementID -> { x, y }
     * @param  {Boolean} downAllowed    If child elements that overlap are allowed to be shifted down
     * @param  {Boolean} upAllowed      If child elements that overlap are allowed to be shifted up
     * @param  {Boolean} rightAllowed   If child elements that overlap are allowed to be shifted right
     * @param  {Boolean} leftAllowed    If child elements that overlap are allowed to be shifted left
     * @return {Object}                 The result of the move operation
     */
    makeSpaceForElement (element, positionMat, elementsMoved, downAllowed, upAllowed, rightAllowed, leftAllowed) {
      // Make sure we are not out-of-bounds, otherwise notify that this is invalid move
      if (element.x < 0 || element.y < 0 || (element.x + element.width) > this.nCols) return { possible: false }

      // Count the number of elements that have been moved
      let nElementsMovedInTree = 0
      // The integral of block movement (distance * nblocks)
      let integratedBlockMovement = 0

      elementsMoved[element.id] = element

      // Check all blocks of the element for overlaps
      for (let x = element.x; x < (element.x + element.width); x++) {
        for (let y = element.y; y < (element.y + element.height); y++) {
          if (y >= this.nRows) continue
          if (positionMat[x][y] !== 0 && positionMat[x][y] !== element.id) {
            // Something's here already
            // Try to move the block in any of the four directions
            // Take the result which works and impacts the least other element blocks / makes the least screen movement

            // Get the element which is overlapping
            let realChildElement = this.elementID2element[positionMat[x][y]]

            // If the child element has already been set by
            if (realChildElement.id in elementsMoved) return { possible: false }

            let options = []

            if (upAllowed) {
              // Go up enough blocks to not have any overlap of element and the child element anymore
              let goUp = realChildElement.y + realChildElement.height - element.y
              let movedChildElement = { ...realChildElement, y: realChildElement.y - goUp }
              let elementsMovedChild = _.cloneDeep(elementsMoved)
              options.push(this.makeSpaceForElement(
                movedChildElement, positionMat, elementsMovedChild, false, upAllowed, leftAllowed, rightAllowed
              ))
              options.slice(-1)[0].integratedBlockMovement += goUp * realChildElement.width
            }

            if (leftAllowed) {
              // Go left enough blocks to not have any overlap of element and the child element anymore
              let goLeft = realChildElement.x + realChildElement.width - element.x
              let movedChildElement = { ...realChildElement, x: realChildElement.x - goLeft }
              let elementsMovedChild = _.cloneDeep(elementsMoved)
              options.push(this.makeSpaceForElement(
                movedChildElement, positionMat, elementsMovedChild, downAllowed, upAllowed, false, rightAllowed
              ))
              options.slice(-1)[0].integratedBlockMovement += goLeft * realChildElement.height
            }

            if (rightAllowed) {
              // Go right enough blocks to not have any overlap of element and the child element anymore
              let goRight = element.x + element.width - realChildElement.x
              let movedChildElement = { ...realChildElement, x: realChildElement.x + goRight }
              let elementsMovedChild = _.cloneDeep(elementsMoved)
              options.push(this.makeSpaceForElement(
                movedChildElement, positionMat, elementsMovedChild, downAllowed, upAllowed, rightAllowed, false
              ))
              options.slice(-1)[0].integratedBlockMovement += goRight * realChildElement.height
            }

            if (downAllowed) {
              // Go down enough blocks to not have any overlap of element and the child element anymore
              let goDown = element.y + element.height - realChildElement.y
              let movedChildElement = { ...realChildElement, y: realChildElement.y + goDown }
              let elementsMovedChild = _.cloneDeep(elementsMoved)
              options.push(this.makeSpaceForElement(
                movedChildElement, positionMat, elementsMovedChild, downAllowed, false, leftAllowed, rightAllowed
              ))
              options.slice(-1)[0].integratedBlockMovement += goDown * realChildElement.width
            }

            let bestOption = _(options).filter({ possible: true }).sortBy(['integratedBlockMovement']).value()[0]
            if (!bestOption) return { possible: false }

            positionMat = _.cloneDeep(bestOption.positionMat)
            this.clearElementFromPositionMat(realChildElement, positionMat)
            this.addElementToPositionMat(bestOption.element, positionMat)

            elementsMoved = bestOption.elementsMoved
            nElementsMovedInTree += bestOption.nElementsMovedInTree + 1
            integratedBlockMovement += bestOption.integratedBlockMovement
          }
        }
      }

      return {
        possible: true,
        element,
        elementsMoved,
        positionMat,
        nElementsMovedInTree,
        integratedBlockMovement
      }
    },

    addElementToPositionMat (element, positionMat) {
      for (let x = element.x; x < element.x + element.width; x++) {
        for (let y = element.y; y < element.y + element.height; y++) {
          positionMat[x][y] = element.id
        }
      }
    },

    clearElementFromPositionMat (element, positionMat) {
      for (let x = element.x; x < element.x + element.width; x++) {
        for (let y = element.y; y < element.y + element.height; y++) {
          positionMat[x][y] = 0
        }
      }
    },

    onDragOrResizeOverInvalid ($event) {
      $event.dataTransfer.dropEffect = 'none'
    },

    onDragDrop ($event) { }
  }
}

</script>

<style lang=scss>

@import '~css/chart';

.dashboard-page {
  .name {
    flex: 0 0 420px;
  }
  .editing-toolbar {
    flex: 1;
    width: 100%;
    display: flex;

    .is-public-switch {
      margin-left: 16px;
      flex: 0 0 auto;
      margin-top: 12px;
    }

    .is-public-helptip {
      margin: auto 2px;
    }

    .public-link {
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: auto 16px;
      flex: 1;
      font-size: smaller;
      border: 1px dotted rgba(0,0,0,0.24);
      border-radius: 4px;
      padding: 4px 6px;
      background: #EEE;
    }

    .save {
      margin: 0 0 0 auto;
      height: auto;
      display: flex;
    }
  }
}

.dashboard {
  position: relative;

  &.dragging .dashboard-el:not(.dragging) {
    pointer-events: none;
  }

  &.resizing {
    cursor: se-resize;
  }

  &.resizing .dashboard-el {
    pointer-events: none;
  }

  &.dragging, &.resizing {
    .dashboard-placeholder-el { pointer-events: none }
  }

  .dashboard-el {
    background: #FFF;
    position: absolute;
    display: flex;
    flex-direction: column;
    transition: all 0.12s ease-out;
    transition-property: left, top, width, height;
    border-radius: 4px;
    /* border: 2px solid transparent; */
    border: 1px solid #dadee4;
    /* box-shadow: 0 2px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12); */
    box-shadow: 0 0.25rem 0.4rem rgba(48,55,66,.15);
    overflow: hidden;
    padding: 1px;

    .header {
      margin: -1px -1px 0 -1px;
      background: #EEE;
      padding:6px 8px 2px;
      display: flex;
      .move-handler {
        cursor: move;
        vertical-align: top;
        line-height: 2.2rem;
        margin-right: 2px;
        margin-top: -3px;
      }
      .title {
        display: inline-block;
        margin-top: -3px;
      }
      .v-btn {
        margin-top: -5px;
      }
    }

    .content {
      display: flex;
      align-items: center; /*
      justify-content: center;
      text-align: center; */
      max-width: 100%;
      max-height: 100%;
      overflow-x: hidden;
      overflow-y: scroll;
      user-select: text;
      flex: 1;

      .c-alert {
        flex: 1;
      }
    }

    .dragging-placeholder {
      transition: all 0.1s ease-out;
      opacity: 0;
      position: absolute;
      width: 100%;
      text-align: center;
      margin-top: 50px;
      height: calc(100% - 50px);
      pointer-events: none;
      transform: scale(0.6);
    }

    .chart-layout {
      height: 100%;
      width: 100%;

      .chart-col {
        height: calc(100% - 16px);
        width: calc(100% - 32px);
        padding: 0;
        margin: 8px 16px;

        .chart-container {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          border: none;
        }
      }
    }

    .p-container { flex: 1 }

    &.p-text {
      .header {
        background: rgba(255, 255, 255, 0.15);
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        border: 1px solid #FFF;
        border-bottom: none;
      }
      .content {
        padding: 8px 12px;
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
        border: 1px solid #FFF;
        border-top: none;
        margin: 0 -1px -1px -1px;
        max-width: calc(100% + 2px);
      }
      .pre {
        unicode-bidi: embed;
        line-height: 1.2rem;
        white-space: pre-wrap;
      }
    }

    &.p-verb {
      .p-container .v-card__title .title {
        font-size: 0.875rem!important;
        font-weight: normal;
        color: rgba(0,0,0,.54);
        margin-top: 6px;
      }

      .p-container.min-width {
        overflow-x: scroll;
        .verbatim-browser { min-width: 700px; }
      }
    }

    .resize-handler {
      position: absolute;
      user-select: none;
      position: absolute;
      bottom: 1px;
      right: 1px;
      cursor: se-resize;
    }

    &.dragging, &.resizing {
      padding: 0px;
      border: 2px dashed #999;

      .resize-handler {
        bottom: 0px;
        right: 0px;
      }
    }

    &.dragging {
      .content { display: none }
      .dragging-placeholder {
        opacity: 1;
        transform: scale(1.0);
      }
    }
  }

  .dashboard-placeholder-el {
    position: absolute;
    display: flex;
    justify-content: center;
    border: 2px dashed transparent;
    transition: border 0.15s ease;
    cursor: pointer;

    .v-icon {
      transform: scale(0.5);
      transition: all 0.15s ease;
      opacity: 0;
    }
    &:hover {
      .v-icon {
        opacity: 1;
        transform: scale(1.0);
      }
      border: 2px dashed #999;
    }
  }

  .add-hint {
    pointer-events: none;
    position: absolute;
    width: 100%;
    text-align: center;
    transition: all 0.15s ease;
  }

  &:hover .add-hint { opacity: 0 }

  .marker {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #FF0000;
  }
}

.dashboard-add-or-edit {
  .type-select {
    padding: 20px 24px 30px!important;
    display: flex;
    flex-direction: row;
    transition: all 0.075s ease-out;

    .element-option {
      display: flex;
      flex-direction: column;
      box-shadow: 0 0px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);

      .v-card__title {
        display: block;
        background: #EEE;
        height: 100px;
      }

      .subtitle {
        font-size: 14px;
        line-height: 1.2;
        margin-top: 4px;
      }

      flex: 1;
      margin-right: 24px;
      cursor: pointer;
      transition: all 0.05s ease-in;

      .tile-img-container {
        position: relative;
        padding: 12px 16px;
        background: #FFF;
        flex: 1;
        align-items: center;
        justify-content: center;
        text-align: center;

        .v-icon {
          font-size: 12vw;
          transition: color 0.1s ease-in;
        }

        img {
          flex: 1;
          max-width: 100%;
          transition: all 0.15s ease-in;
          filter: grayscale(100%);
        }
      }

      &:hover {
        transform: scale(1.05, 1.05);
        z-index: 1;

        box-shadow: 0px 13px 6px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);

        .v-icon {
          color: var(--v-accent-base);
        }
        img {
          transition: all 0.1s ease-in;
          filter: grayscale(0);
        }
      }
    }

    .element-option:last-child {
      margin-right: 0;
    }
  }

  #chart-list, #project-list {
    > .v-card {
      box-shadow: none;
    }
  }

  .step-text {
    min-height: 450px;

    .inputrow {
      display: flex;
      align-items: center;
      margin: 8px 0 12px;
    }

    .align-select {
      margin-left: 12px;
    }

    .bg-sample {
      flex: 1;
      border-radius: 4px;
      padding: 8px 16px;
    }

    .pre {
      unicode-bidi: embed;
      line-height: 1.2rem;
      white-space: pre-wrap;
    }

    .color-indicator {
      width: 30px;
      height: 30px;
      border-radius: 100%;
      border: 1px solid #FFF;
      position: relative;
      box-sizing: border-box;
      margin: 3px 3px 3px 12px;
      cursor: pointer;

      &::before {
        content: ' ';
        position: absolute;
        top: -3px;
        bottom: -3px;
        left: -3px;
        right: -3px;
        border: 1px solid #000;
        border-radius: 100%;
      }
      > span {
        position: absolute;
        text-align: center;
        content: 'Color';
        font-size: 10px;
        top: 28px;
        color: rgba(0,0,0,.42);
        width: 100%;
        white-space: nowrap;
      }
    }

    .color-picker {
      border-radius: 4px;
      margin: 0 auto;
      position: absolute;
      visibility: hidden;
      transition: all 0.2s ease-out;
      opacity: 0;
      transform: scale(0.75, 0.75) translateY(-300px);
      background: #FFF;
      z-index: 1;
      padding: 2px;

      &.show {
        visibility: visible;
        opacity: 1;
        transform: scale(1, 1);
      }

      .arrow {
        position: absolute;
        content: '';
        width:0;
        height: 0;
        border:6px solid transparent;
        top: 61px;
        right:-12px;
        border-left-color:#333;
        transition: all 0.2s ease-out;
      }

      .v-color-picker__swatch {
        flex-direction: row;
        flex-wrap: wrap;
        max-width: 100%;
      }
      .v-label {
        font-size: smaller;
      }

      .palette-chooser {
        margin: 0 0 8px 16px;
      }
    }
  }

  .step-verbatims {
    min-height: 600px;

    & { margin-top: 12px }
    .v-select { margin-bottom: 6px }
  }
}

</style>

<i18n src='@/i18n/pages/Dashboard.json'></i18n>
