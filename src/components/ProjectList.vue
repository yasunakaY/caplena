<template>
  <div @keydown.esc="hideQuestions" style="height: 100%" id="project-list">
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
          <div style="flex: 1 1 auto; display: flex" v-if="projectsSelected.length < 1" key="filter">
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

            <v-switch v-model="filters.hideCompleted"
                      v-if="hideCompletedFilterEnable"
                      color="success"
                      class="hide-completed"
                      :label="$t('hide_completed')" />

            <v-switch v-if="hideIncompleteFilterEnable"
                      v-model="filters.hideIncomplete"
                      color="success"
                      class="hide-incomplete"
                      :label="$t('hide_incomplete')" />
          </div>
          <div v-else class="project-actions" key="edit">
            <span class="title" key="selected">
              {{ $t('n_items_selected', { item: $tc('project.items', projectsSelected.length),
                                          cnt: projectsSelected.length }) }}
            </span>
            <v-spacer />
            <slot name="header-actions" :projects-selected="projectsSelected" />
          </div>
        </transition>

      </v-card-text>
      <!-- ====== Project List BOX ====== -->
      <v-data-table
        v-model="projectsSelected"
        must-sort
        :items="projectsFiltered"
        :headers="headersFiltered"
        item-key="id"
        :sort-by.sync="pagination.sortBy"
        :sort-desc.sync="pagination.descending"
        :items-per-page.sync="pagination.rowsPerPage"
        :page.sync="pagination.page"
        :footer-props="{
          itemsPerPageOptions: rowsPerPageOptionsValid,
          itemsPerPageText: $t('pagination.description', {'item': $tc('project.items', 2)})
        }"
        :loading="loading"
        id="projectList"
        ref="projectList"
        :show-select="selectable"
        class="project-list-tbl">

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
          <tr :class="{
            'is-completed': props.item.status === 2,
            'is-focused': questions.active && questions.project === props.item.id
          }">
            <td v-if="selectable">
              <v-checkbox
                v-model="props.isSelected"
                @change="props.select"
                primary
                hide-details />
            </td>
            <td class="status-col" v-if="!('status' in hideColumns)">
              <div class="status-icns">
                <template v-if="props.item.status === 2">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-check</v-icon></template>
                    <span>{{ $t('eprops.status.completed ') }}</span>
                  </v-tooltip>
                </template>
                <template v-else-if="props.item.status === 1">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-timelapse</v-icon></template>
                    <span>{{ $t('eprops.status.inprogress ') }}</span>
                  </v-tooltip>
                </template>
                <template v-else>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-new-box</v-icon></template>
                    <span>{{ $t('eprops.status.new ') }}</span>
                  </v-tooltip>
                </template>
                <template v-if="props.item.inherits_to_and_from">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-swap-vertical</v-icon></template>
                    <span>{{ $t('eprops.inherits_project.to_and_from ') }}</span>
                  </v-tooltip>
                </template>
                <template v-if="props.item.inherits_to">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-call-split</v-icon></template>
                    <span>{{ $t('eprops.inherits_project.to ') }}</span>
                  </v-tooltip>
                </template>
                <template v-if="props.item.inherits_final_leaf">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-format-vertical-align-top</v-icon></template>
                    <span>{{ $t('eprops.inherits_project.final_leaf ') }}</span>
                  </v-tooltip>
                </template>

                <v-tooltip bottom v-if="usersOnlineByProject[props.item.id].nQuestions">
                  <template v-slot:activator="{ on }"><span class="users-active" v-on="on" /></template>
                  <span>{{ $tc('eprops.users_online.status_project', usersOnlineByProject[props.item.id].users.length, {
                    users: usersOnlineByProject[props.item.id].usersFormatted,
                    n_questions: usersOnlineByProject[props.item.id].nQuestions })
                  }}</span>
                </v-tooltip>
              </div>
            </td>
            <td :ref="`anchorQuestion${props.item.id}`" class="name-col">
              <router-link :to="{ name: 'projects-manage-id', params: { id: props.item.id } }"
                           event="''"
                           @click.native.prevent.stop="showQuestions(props.item.id)">{{ props.item.name }}</router-link>
            </td>
            <td v-if="!('owner' in hideColumns || !user.profile.organization)">{{ props.item.owner }}</td>
            <!-- <td v-if="!('nquestions' in hideColumns)">{{ props.item.nquestions }}</td> -->
            <td v-if="!('language' in hideColumns)">{{ $t('language.' + props.item.language) }}</td>
            <td v-if="!('created' in hideColumns)">{{ props.item.created | dateshort }}</td>
            <td v-if="!('last_modified' in hideColumns)" class="last-modified" >{{ props.item.last_modified | fromnow }}</td>
            <td v-if="!('labels' in hideColumns)" style="white-space: nowrap">
              <code-chip v-for="(label, idx) in props.item.labels"
                         :key="idx"
                         :color="$color.getMedium(label2idx[label])"
                         :avatar-char="label[0]"
                         only-avatar>{{ label }}</code-chip>
            </td>
            <td v-if="!('nanswers' in hideColumns)">
              {{ props.item.nquestions }} &times; {{ props.item.nanswers }}
            </td>
            <!-- <td v-if="!('nreviewed' in hideColumns)">
              {{ props.item.nreviewed }}  ({{ props.item.nreviewed | percent(props.item.nanswers * props.item.nquestions) | round }}%)
            </td> -->
          </tr>
        </template>

        <empty-state v-if="!loading"
                     slot="no-data"
                     icon="mdi-playlist-remove"
                     :label="$t('no_projects.title')"
                     :description="$t('no_projects.details')">
          <slot name="empty-state" />
        </empty-state>

      </v-data-table>
    </v-card>

    <v-overlay :value="questions.active" v-if="questions.active" @click.native="hideQuestions" />
    <v-navigation-drawer v-model="questions.active"
                         right
                         :absolute="inDialog"
                         :fixed="!inDialog"
                         temporary
                         stateless
                         hide-overlay
                         class="questions-container"
                         width="440"
                         ref="questionsContainer">

      <template v-if="activeProject.questions.length">
        <v-alert
          border="left"
          close-text="Close Alert"
          dark
          dense
          color="primary">

          <span v-html="$tc('drawer_title', activeProject.questions.length, {
            n: activeProject.questions.length, project: activeProject.name.replace('|', '//-//')
          }).replace('//-//', '|')" />
        </v-alert>
        <v-card class="question"
                hover
                v-for="question in activeProject.questions"
                :key="question.id">
          <v-card-title style="background: #EEE; display: block">
            <div>
              <div class="title" style="">{{ question.name }}</div>
              <!-- <div class="subtitle-1" style="margin: -2px 0"><em></em></div> -->
            </div>
          </v-card-title>

          <v-card-text class="actions">
            <slot name="action" :question="question" />
          </v-card-text>
          <v-divider light />

          <v-card-text>
            <div v-if="question.question_category !== QUESTION_CATEGORY_NONE">
              {{ $t('question.category.title') }}:
              {{ $t(`question.category.${question.question_category}`) }}
            </div>
            <div v-html="$t('question.info_str', { nanswers: question.nanswers,
                                                   nreviewed: question.nreviewed,
                                                   reviewed_percentage: $options.filters.round($options.filters.percent(question.nreviewed, question.nanswers)),
                                                   last_modified: $options.filters.fromnow(question.last_modified),
                                                   ncodes: question.ncodes
            })" />
          </v-card-text>
          <v-divider light />
          <v-card-text>

            <span>{{ $t('question.inherits.from') }}
              <a v-if="question.inherits_from"
                 @click.stop="showQuestions(question.inherits_from_obj.project_obj.id)">
                {{ $t('question.of_project', {
                  question: question.inherits_from_obj.name,
                  project: question.inherits_from_obj.project_obj.name
                }) }}
              </a>
              <span v-else>{{ $t('question.inherits.none') }}</span><br>
              {{ $t('question.inherits.to', { n: question.inherits_to_objs.length }) }}
            </span>
          </v-card-text>
          <v-divider light />
          <v-card-actions @click.stop>
            <template v-if="question.status === 2">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-check</v-icon></template>
                <span>{{ $t('eprops.status.completed ') }}</span>
              </v-tooltip>
            </template>
            <template v-else-if="question.status === 1">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-timelapse</v-icon></template>
                <span>{{ $t('eprops.status.inprogress ') }}</span>
              </v-tooltip>
            </template>
            <template v-else>
              <v-tooltip bottom >
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-new-box</v-icon></template>
                <span>{{ $t('eprops.status.new ') }}</span>
              </v-tooltip>
            </template>
            <template v-if="question.inherits_final_leaf">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-format-vertical-align-top</v-icon></template>
                <span>{{ $t('eprops.inherits_question.final_leaf ') }}</span>
              </v-tooltip>
            </template>
            <template v-else-if="question.inherits_from">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-swap-vertical</v-icon></template>
                <span>{{ $t('eprops.inherits_question.to_and_from ') }}</span>
              </v-tooltip>
            </template>
            <template v-else-if="question.inherits_to_objs.length">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-call-split</v-icon></template>
                <span>{{ $t('eprops.inherits_question.to ') }}</span>
              </v-tooltip>
            </template>
            <v-tooltip bottom v-if="usersOnline.data[question.project][question.id] && usersOnline.data[question.project][question.id].length">
              <template v-slot:activator="{ on }"><span class="users-active" v-on="on" /></template>
              <span>{{ $tc('eprops.users_online.status_question', usersOnline.data[question.project][question.id].length, {
                users: $options.filters.enumerate($_.map(usersOnline.data[question.project][question.id], 'name'), $t('and'))
              })
              }}</span>
            </v-tooltip>
            <v-spacer />
            <v-btn @click="showFlowtree(question)" icon>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-swap-vertical-variant</v-icon></template>
                <span>{{ $t('question.inherits.show_relationships') }}</span>
              </v-tooltip>
            </v-btn>
            <slot name="question-actions" :question="question" />
          </v-card-actions>
        </v-card>
      </template>

      <div v-else style="text-align: center">
        <div style="margin: 20px 0"><v-icon size="60">mdi-forum</v-icon></div>
        <div class="headline" style="margin: 0 0 20px 0">{{ $t('question.empty_headline') }}</div>
      </div>
    </v-navigation-drawer>
    <!-- <div class="arrow" ref="questionsArrow" /> -->
    <!-- </div> -->

    <!-- ====== Flowtree DIALOG ====== -->
    <v-dialog v-model="flowtree.active" @keydown.esc="flowtree.active = false" style="background: #FFF">
      <v-card v-if="flowtree.cog">
        <v-card-title class="headline" v-html="$t('flowtree.title', { question: flowtree.cog.name })" />

        <alert v-if="!flowtree.cog.inherits_from&&!flowtree.cog.inherits_to_objs.length"
               type="info">{{ $t('flowtree.not_related') }}</alert>

        <v-card-text id="flowtree">

          <div :style="{ width: `${flowtree.maxX - flowtree.minX}px`, height: `${flowtree.maxY}px` }"
               class="flowtree-container">
            <svg xmlns="http://www.w3.org/2000/svg"
                 :viewBox="`${flowtree.minX} ${-flowtree.maxY} ${flowtree.maxX - flowtree.minX} ${flowtree.maxY}`"
                 style="width: 100%; height: 100%">
              <defs>
                <marker id="end" orient="auto" markerWidth="3" markerHeight="3"
                        refX="2" refY="1.5">
                  <path d="M0,0 V3 L3,1.5 Z" :fill="$vuetify.theme.primary" />
                </marker>
                <marker id="start" orient="auto" markerWidth="4" markerHeight="4" refX="1" refY="1">
                  <circle cx="1" cy="1" r="1" fill="#999"/>
                </marker>
              </defs>
              <g transform="scale(1,-1)">
                <path v-for="(arr, arrIdx) in flowtree.arrows"
                      marker-end="url(#end)"
                      marker-start="url(#start)"
                      stroke-width="5" fill="none"
                      stroke="#DDD"
                      :key="arrIdx"
                      :d="`M${arr.xStart},${arr.yStart} L${arr.xEnd},${arr.yEnd}`"/>
              </g>
            </svg>

            <div v-for="(node, idx) in flowtree.nodes"
                 :key="idx"
                 :style="{ height: `${flowtree.ySpacer}px`,
                           bottom: `${node.y}px`,
                           left: `${node.x - flowtree.minX}px` }"
                 class="node">
              <div :style="{ 'background-color': (node.cog ? $color.soft.red : 'transparent') }">
                {{ node.question.name }}
                <a @click="showQuestions(node.question.project); flowtree.active=false" style="display: block">
                  {{ $t('project.item') }} {{ node.question.project_obj.name }}
                </a>
                {{ $t('flowtree.created') }} {{ node.question.created | dateshort }}
              </div>
            </div>
          </div>

        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="flowtree.active=false">{{ $t('close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
'use strict'
import Vuex from 'vuex'

import LabelSelect from '@/components/LabelSelect'

import { QUESTION_CATEGORY_NONE } from '@/settings/constants'

const MAX_SOCKET_FAILED_CNT = 15

export default {
  codit: true,
  name: 'ProjectList',

  components: {
    'label-select': LabelSelect
  },

  props: {
    projects: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    dontHideProjectDetailsOnClick: { type: Boolean, default: false },
    tagsBox: { type: Boolean, default: false },
    searchFilterEnable: { type: Boolean, default: true },
    labelsFilterEnable: { type: Boolean, default: true },
    hideCompletedFilterEnable: { type: Boolean, default: false },
    hideIncompleteFilterEnable: { type: Boolean, default: false },
    selectable: { type: Boolean, default: false },
    hideColumns: { type: Object, default: () => Object() },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 'all'] },
    rowsPerPageDefault: { type: Number, default: 10 },
    projectToFocus: { type: [Number, null], default: null },
    observeUsersOnline: { type: Boolean, default: false },
    inDialog: { type: Boolean, default: false }
  },

  data () {
    return {
      filters: {
        name: '',
        labels: [],
        hideCompleted: false,
        hideIncomplete: false
      },

      projectsFiltered: [],
      projectsSelected: [],

      headers: [
        { text: '', sortable: false, value: 'status' },
        { text: this.$t('eprops.name'), value: 'name', width: '250px' },
        { text: this.$t('eprops.owner'), value: 'owner' },
        /* { text: this.$t('eprops.number_questions'), value: 'nquestions' }, */
        { text: this.$t('language.title'), value: 'language' },
        { text: this.$t('eprops.created'), value: 'created' },
        { text: this.$t('eprops.last_modified'), value: 'last_modified' },
        { text: this.$t('eprops.labels'), sortable: false, value: 'labels', width: '160px' },
        { text: this.$t('eprops.number_answers'), value: 'nanswers' }
        /* { text: this.$t('eprops.number_reviewed'), value: 'nreviewed' } */
      ],

      pagination: { sortBy: 'id', descending: true, rowsPerPage: 10, page: 1 },

      questions: {
        active: false,
        project: -1
      },

      showQuestionMutex: false,
      isDestroying: false,

      filterFns: {
        // search the project and questions names for the given search string
        search: p => this.filters.name.length === 0 ||
                    (p.name.match(this._searchRegex) || p.questions.some(q => q.name.match(this._searchRegex))),
        labels: p => !this.filters.labels.length || this.filters.labels.some(l => p.labels.indexOf(l) !== -1),
        hideCompleted: p => !this.filters.hideCompleted || p.status !== 2,
        hideIncomplete: p => !this.filters.hideIncomplete || p.status === 2
      },

      usersOnline: {
        socket: null,
        data: {},
        failedCnt: 0
      },

      flowtree: {
        active: false,
        // Center of gravity, the question that is referred
        cog: null,
        minX: 0,
        maxX: 0,
        maxY: 0,
        arrows: [
          { xStart: 10, xEnd: 20, yStart: 10, yEnd: 50 }
        ],

        // constants
        scaler: 200,
        ySpacer: 60,
        nodeWidth: 300
      },

      /**
       * Debounced version of filterProjects method
       */
      filterProjectsDebounced: _.debounce(() => this.filterProjects(), 250),

      QUESTION_CATEGORY_NONE
    }
  },

  computed: {
    activeProject () {
      if (!this.questions.active) return { questions: [] }
      else return _.find(this.projects, { id: this.questions.project })
    },

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
     * Returns the projects that are visible on the current page
     * @return {Array} List of filtered items
     */
    projectsOnPage: {
      get () {
        return this.$refs.projectList ? this.$refs.projectList._data.internalCurrentItems : []
      },
      cache: false
    },

    usersOnlineByProject () {
      let uobp = {}
      _.each(this.usersOnline.data, (questions, pID) => {
        let nQuestions = _.sum(_.toArray(_.mapValues(questions, (qUsers, qID) => Number(!!qUsers.length))))
        let users = _.flatten(_.toArray(_.mapValues(questions, (qUsers, qID) => _.map(qUsers, 'name'))))
        let usersFormatted = this.$options.filters.enumerate(users, this.$t('and'))
        uobp[pID] = { nQuestions, users, usersFormatted }
      })
      return uobp
    },

    /**
     * Returns mapping of question ID to its parent project
     * @return {Object} Mapping of Number -> Number
     */
    questionID2ProjectID () {
      let mapping = {}
      this.projects.forEach(p => {
        p.questions.forEach(q => { mapping[q.id] = p.id })
      })
      return mapping
    },

    labels () {
      return _.uniq(_.flatten(_.map(this.projects, 'labels'))).sort()
    },

    label2idx () {
      let lbl2idx = {}
      this.labels.forEach((lbl, idx) => { lbl2idx[lbl] = idx })
      return lbl2idx
    },

    labelCounts () {
      let cnts = new Array(this.labels.length).fill(0)
      this.projects.forEach(s => {
        s.labels.forEach(lbl => { cnts[this.label2idx[lbl]] += 1 })
      })
      return cnts
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    filters: {
      deep: true,
      handler () { if (!this.showQuestionMutex) this.filterProjectsDebounced() }
    },

    pagination: {
      deep: true,
      handler () {
        this.$nextTick(this.updateObserver)
      }
    },

    loading: 'maybeFocusProject',
    projectToFocus: 'maybeFocusProject',

    rowsPerPageDefault: {
      immediate: true,
      handler (val) { this.pagination.rowsPerPage = val }
    },

    projects: {
      immediate: true,
      handler () {
        // Create mapping of project ids to empty object, for observing state of users online
        if (!this.projects.length) return
        this.$set(this.usersOnline, 'data', _.mapValues(_.mapKeys(this.projects, (val, key) => val.id), () => ({})))
        this.filterProjects()
      }
    },

    projectsFiltered () {
      this.clearSelected()
      if (!this.showQuestionMutex) {
        this.pagination.page = 1
        this.hideQuestions()
      }
      this.$nextTick(this.updateObserver)
    },

    projectsOnPage () { this.updateObserver() }
  },

  created () {
    if (this.observeUsersOnline) this.openObserver()
  },

  beforeDestroy () {
    if (this.usersOnline.socket) this.usersOnline.socket.close()
    this.isDestroying = true
  },

  methods: {
    /**
     * Check if the focusProject prop matches the internal state
     * if not, either open the project or close the project overlay
     */
    maybeFocusProject () {
      if (this.loading) return
      // If not focused on this project, open it
      if (this.projectToFocus !== null && (!this.questions.active || this.projectToFocus !== this.questions.project)) {
        if (_.find(this.projects, { id: this.projectToFocus }) === undefined) {
          throw new Error(`ProjectList: Can't focus on non-existant project ${this.projectToFocus}`)
        }
        this.$nextTick(() => this.showQuestions(this.projectToFocus))
      } else if (this.projectToFocus === null && this.questions.active) this.hideQuestions()
    },

    /**
     * Opens websocket connection, observing the currently visible questions
     * for other users that might be editing them
     * @return {[type]} [description]
     */
    openObserver () {
      ws.open(`ws/questions-observer/`).then(socket => {
        console.log('Observer connection established.')
        this.usersOnline.failedCnt = 0
        this.usersOnline.socket = socket
        socket.onmessage = (event) => {
          let data = JSON.parse(event.data)
          if ('error' in data) throw new Error(`Socket returned error: ${event.data.error}`)
          // Bring the Object of question IDs into hierarchical format, grouped by project
          if ('users_online' in data) {
            _.each(data.users_online, (val, key) => {
              this.$set(this.usersOnline.data[this.questionID2ProjectID[key]], key, val)
            })
          }
        }

        socket.onclose = (event) => {
          this.usersOnline.socket = null
          if (event.wasClean) return
          console.error(`Question observer closed unexpectedly. Code=${event.code} reason=${event.reason}`)
          setTimeout(this.openObserver, 5000)
        }

        if (this.projectsFiltered.length) this.updateObserver()
      }).catch(({ event, err }) => {
        this.usersOnline.failedCnt += 1
        if (this.usersOnline.failedCnt >= MAX_SOCKET_FAILED_CNT) {
          this.$onError(new Error(`Failed to connect to socket ${MAX_SOCKET_FAILED_CNT} times, stopping.`))
        } else setTimeout(this.openObserver, 10000)
        console.error(err)
        console.error('Question observer failed to connect.')
      })
    },

    /**
     * Filters the projects by all filterFns, if enabled
     */
    filterProjects () {
      const filters = _.keys(this.filterFns)
      // Run through all projects
      this.$set(this, 'projectsFiltered', this.projects.filter(p => {
        // Run through all filters and check if they are activated _or_ return true, otherweise reject project
        for (let i = 0; i < filters.length; i++) {
          if (this[`${filters[i]}FilterEnable`] && !this.filterFns[filters[i]](p)) return false
        }
        return true
      }))
    },

    /**
     * Send the current list of questions displayed to the observer websocket,
     * to get updates on which ones are currently being edited
     */
    updateObserver () {
      if (!this.observeUsersOnline) return
      if (!this.usersOnline.socket) return

      let questions = []
      // Create list of question ids on current page
      this.projectsOnPage.forEach(p => questions.push(..._.map(p.questions, 'id')))
      this.usersOnline.socket.send(JSON.stringify({ questions }))
    },

    clearSelected () { this.projectsSelected.splice(0) },

    clearFilters () {
      this.filters.name = ''
      this.filters.labels.splice(0)
      this.filters.hideCompleted = false
      this.filters.hideIncomplete = false
    },

    showQuestions (projectId) {
      // If the referenced project is not on the current page / in the current filter set
      // clear the filters & sorting and move to the appropriate page
      if (_.find(this.projectsOnPage, { id: projectId }) === undefined) {
        let idxOfProject = _.findIndex(this.projects, { id: projectId })
        if (idxOfProject === -1) return
        // Flag to prevent some watchers from firing and interfering with our settings
        this.showQuestionMutex = true
        this.clearFilters()
        this.pagination.sortBy = 'id'
        this.pagination.descending = true
        this.pagination.page = Math.floor(idxOfProject / this.pagination.rowsPerPage) + 1
        // Make sure the debounced call is done *now*, not later
        this.filterProjects()
      }
      this.$nextTick(() => {
        this.questions.active = true
        this.questions.project = projectId
        this.showQuestionMutex = false
      })
      this.$emit('open-project', { id: projectId, name: this.activeProject.name })
    },

    hideQuestions () {
      if (this.questions.active && !this.dontHideProjectDetailsOnClick && !this.flowtree.active) {
        this.questions.active = false
        this.$emit('open-project')
      }
    },

    toggleAll () {
      if (this.projectsSelected.length) this.projectsSelected = []
      else this.projectsSelected = this.projectsFiltered.slice()
    },

    changeSort (column) {
      if (this.pagination.sortBy === column) {
        this.pagination.descending = !this.pagination.descending
      } else {
        this.pagination.sortBy = column
        this.pagination.descending = false
      }
    },

    showFlowtree (cog) {
      const scaler = this.flowtree.scaler
      const ySpacer = this.flowtree.ySpacer / scaler

      // Find origin
      let origin = cog
      // Check for circular dependencies
      let questionIDsTraversed = new Set()
      while (origin.inherits_from !== null && !questionIDsTraversed.has(origin.id)) {
        questionIDsTraversed.add(origin.id)
        origin = origin.inherits_from_obj
      }

      // Recursively go through inheritances until there are no further elements in tree
      let nodes = []
      let arrows = []

      let minX = 0
      let maxX = 0
      let maxY = 0

      let breadthPerQuestion = {}

      let questionIDsTraversedBreadth = new Set()
      const determineTreeBreadth = (question) => {
        // Check for circular dependencies
        if (questionIDsTraversedBreadth.has(question.id)) return
        questionIDsTraversedBreadth.add(question.id)
        breadthPerQuestion[question.id] = 0
        if (question.inherits_to_objs.length >= 2) {
          // If there is a split here, go down the rabbit hole again and increase the breadth for all previous questions by one
          let q = question
          while (q.inherits_from) {
            q = q.inherits_from_obj
            if (questionIDsTraversedBreadth.has(q.id)) return
            questionIDsTraversedBreadth.add(q.id)
            if (q.inherits_to_objs.length > 1) breadthPerQuestion[q.id] += 1
          }
        }
        question.inherits_to_objs.forEach(determineTreeBreadth)
      }

      // Check for circular dependencies
      let questionIDsTraversedNodes = new Set()
      /**
       * Recursive function going through all linked questions and creating the array of nodes and arrows
       */
      const createNodeAndArrows = (question, nSplits, prevX, prevY, diffX, diffY = 0.5) => {
        if (questionIDsTraversedNodes.has(question.id)) return
        questionIDsTraversedNodes.add(question.id)

        const n = question.inherits_to_objs.length
        const breadth = breadthPerQuestion[question.id] //  * (breadth / n)
        // The coordinates of the current element
        const currX = prevX + diffX
        const currY = prevY + diffY

        minX = Math.min(minX, currX * scaler)
        maxX = Math.max(maxX, currX * scaler)
        maxY = Math.max(maxY, currY * scaler)

        // Compute the offset for children in x direction, depending on how many child elements the current node has
        const offsetX = -(n + breadth - 1) / 2
        const idxMultiplier = 1 + (n > 1 ? breadth / (n - 1) : 0)
        nodes.push({ question, x: currX * scaler, y: currY * scaler, cog: question === cog })
        // Only create new arrow if node is not at same position (i.e. first node)
        if (diffX !== 0 || diffY !== 0) {
          arrows.push({
            xStart: prevX * scaler,
            yStart: prevY * scaler,
            xEnd: currX * scaler,
            yEnd: currY * scaler
          })
        }
        question.inherits_to_objs.forEach((q, qIdx) => createNodeAndArrows(q, nSplits, currX, currY + ySpacer, offsetX + qIdx * idxMultiplier))
      }

      determineTreeBreadth(origin)
      createNodeAndArrows(origin, 0, 0, 0.25, 0, 0)

      this.$set(this.flowtree, 'arrows', arrows)
      this.$set(this.flowtree, 'nodes', nodes)

      // add padding to the min / max values and apply minimum value
      this.flowtree.cog = cog
      this.flowtree.minX = minX - this.flowtree.nodeWidth / 2
      this.flowtree.maxX = maxX + this.flowtree.nodeWidth / 2
      this.flowtree.maxY = maxY + 0.2 * scaler + this.flowtree.ySpacer

      this.flowtree.active = true
    }
  }
}

</script>

<style lang=scss>

#project-list {

  tr.is-completed td { opacity: 0.6; }

  td {
    transition: all 0.1s ease-in-out;
  }

  tr.is-focused td {
    z-index: 6;
    pointer-events: none; /* Make the element click-through, such that drawer will close when clicking on the row */
    background-repeat: repeat;
    background-color: rgba(255, 255, 255, 0.5);
    position: relative;
    &:first-child {
      border-radius: 8px 0 0 8px;
    }

    &:last-child {
      border-radius: 0 8px 8px 0;
    }
    a {
      color: var(--v-secondary-base);
      font-weight:bold;
      text-decoration: none;

      &:hover {
        cursor: default;
        text-decoration: none;
      }
    }
  }

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

  .tags-filter {
    flex: 1;
    max-width: 400px;
    margin-left: 30px;
    margin-top: 1px;
  }

  .project-actions {
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

  .questions-container {
    background-color: #EEE;
    background-image: url(../assets/pattern_typography.svg);
    background-repeat: repeat;

    .v-alert {
      margin: 8px 12px;
    }
  }

  .question {
    background: #FFF;
    border-radius: 3px;
    margin: 8px 12px;
    cursor: default;

    .actions {
      padding-top: 8px;
      padding-bottom: 8px;
      transition: background 0.15s ease-in-out;
      .v-btn {
        background: #FFF;
        &:not(:last-child) { margin-right: 10px; }
      }
    }

    &:hover .actions { background: $col-ans-focus-bg;}

    .headline { margin-bottom: 10px }
  }

  .project-list-tbl {
    .status-col:not(:first-child) { padding: 0!important; }
    .status-col {
      .status-icns {
        .v-tooltip { margin: auto 0 }
        display: flex;
        .v-icon {
          margin-right: 5px;
        }
      }
    }
  }

  .project-list-tbl .name-col a {
    display: block;
  }

  .users-active {
    display: block;
    justify-self: center;
    margin: auto 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(76, 175, 80, 0.8);
    cursor: help;
    box-shadow: 0 0 0 rgba(76, 175, 80, 0.6);
    animation: pulse 2s infinite;
  }
  .users-active:hover {
    animation: none;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.4);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6) }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0) }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0) }
}

#flowtree {
  overflow: visible;

  .flowtree-container {
    margin: 0 auto;
    position: relative;
    overflow: visible;
  }

  .node {
    position: absolute;
    width: 400px;
    max-width: 400px;
    overflow: hidden;
    margin-left: -200px;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    > div {
      text-align: center;
      padding: 3px 15px;
      border-radius: 4px;
      box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>

<i18n src='../i18n/pages/ProjectList.json'></i18n>
