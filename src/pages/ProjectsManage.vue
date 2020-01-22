<template>
  <div class="main-content slpg" style="margin-bottom: 80px">
    <alert type="error" class="retry" v-if="failed">
      <div class="text">{{ $t('error', {'step': $t('loading.while')}) }}</div>
      <v-btn @click="loadProjects"><v-icon left dark>mdi-reload</v-icon> {{ $t('actions.retry') }}</v-btn>
    </alert>

    <project-list v-else
                  :projects="projects"
                  :dont-hide-project-details-on-click="deleteQuestion.active || editQuestion.active"
                  :loading="loading"
                  :project-to-focus="focusProject"
                  tags-box
                  search-filter-enable
                  labels-filter-enable
                  hide-completed-filter-enable
                  observe-users-online
                  selectable
                  @open-project="openProject"
                  ref="projectList">

      <template slot="title">{{ $t('title') }}</template>

      <template slot="empty-state">
        <v-btn color="primary" exact :to="{ name: 'upload' }">
          {{ $t('menu.upload') }}
        </v-btn>
      </template>

      <template slot="header-actions" slot-scope="{ projectsSelected }">
        <v-btn icon
               :disabled="projectsSelected.length !== 1 || !$hasPermission('projects_download', projectsSelected[0])"
               @click="openDownload(projectsSelected[0])">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-cloud-download</v-icon></template>
            <span>{{ $t('actions.download ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn icon
               :disabled="projectsSelected.length !== 1 || projectsSelected[0].questions.length === 0 || !$hasPermission('projects_append', projectsSelected[0])"
               :to="{ name: 'project-append', params: { id: projectsSelected.length ? projectsSelected[0].id : -1 } }">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-file-plus</v-icon></template>
            <span>{{ $t('actions.append ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn v-if="user.profile.organization && user.profile.organization.rbac"
               icon
               :disabled="projectsSelected.length !== 1 || !$hasPermission('projects_permissions', projectsSelected[0])"
               @click="openPermissions(projectsSelected[0])">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-account-supervisor</v-icon></template>
            <span>{{ $t('actions.permissions ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn icon
               :disabled="!projectsSelected.every(p => $hasPermission('projects_edit', p))"
               @click="openEditProjects(projectsSelected)">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-pencil</v-icon></template>
            <span>{{ $t('actions.edit ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn @click="openDeleteProjects(projectsSelected)"
               :disabled="!projectsSelected.every(p => $hasPermission('projects_delete', p))"
               icon>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-delete</v-icon></template>
            <span>{{ $t('actions.delete ') }}</span>
          </v-tooltip>
        </v-btn>
      </template>

      <template slot="action" slot-scope="{ question }">
        <v-btn outlined
               color="primary"
               :to="{ name: 'project-coding', params: { id: question.id } }"
               exact>
          {{ $t('actions.coding_view') }}
        </v-btn>
        <v-tooltip bottom :disabled="!!question.ncodes">
          <template v-slot:activator="{ on }">
            <div v-on="on" style="display: inline-block">
              <v-btn outlined
                     color="primary"
                     :disabled="!question.ncodes"
                     :to="{ name: 'charts-manage', query: {
                       questionID: question.id, questionName: question.name, projectName: question.project_obj.name
                     } }"
                     exact>
                {{ $t('actions.visualizations_view') }}
              </v-btn>
            </div>
          </template>
          <span v-html="$t('actions.visualizations_view_disabled')" />
        </v-tooltip>
      </template>

      <template slot="question-actions" slot-scope="{ question }">
        <v-btn @click="openEditQuestion(question)"
               :disabled="!$hasPermission('projects_edit', question)"
               icon>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-pencil</v-icon></template>
            <span>{{ $t('actions.edit ') }}</span>
          </v-tooltip>
        </v-btn>
        <v-btn @click="openDeleteQuestion(question)"
               :disabled="!$hasPermission('projects_delete', question)"
               icon>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-delete</v-icon></template>
            <span>{{ $t('actions.delete ') }}</span>
          </v-tooltip>
        </v-btn>
      </template>

    </project-list>

    <!-- ====== Edit projects DIALOG ====== -->
    <v-dialog v-model="editProject.active" max-width="600" @keydown.esc="closeEditProject(false)" content-class="slpg">
      <v-card>
        <v-card-title class="headline"
                      v-html="$t('edit.dialog_title', { name: editProject.originalName,
                                                        item: $tc('project.items', projectsSelected.length) })" />

        <v-card-text>
          <v-text-field v-model="editProject.name"
                        :disabled="projectsSelected.length>1"
                        :error-messages="editProject.nameInvalid"
                        :label="$t('eprops.name')"
                        :counter="projectsSelected.length===1"
                        maxlength="50" />

          <v-select v-model="editProject.language"
                    :items="[{text: $t('language.de'), value: 'de'}, { text: $t('language.en'), value: 'en' }]"
                    :label="$t('language.title')" />

          <v-checkbox v-model="editProject.completed"
                      :label="$t('eprops.status.completed')"
                      :indeterminate="editProject.completedIndeterminate"
                      @change="editProject.completedIndeterminate=false" />

          <label-select v-model="editProject.labels" class="edit-tags-select"
                        :options="labels"
                        :sync="true"
                        allow-new
                        :placeholder="editProject.labelsChanged ? $t('labels.attach_placeholder') : $t('labels.attach_placeholder_multiple')"
                        max-height="120px"
                        @click.native="clickEditProjectLabels"
                        :style="{ opacity: editProject.labelsChanged ? 1.0 : 0.5 }"
                        @new-label="editAttachLabel"/>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeEditProject(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click.native="closeEditProject(true)">{{ $t('ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Delete projects DIALOG ====== -->
    <v-dialog v-model="deleteProject.active" max-width="600" @keydown.esc="closeDeleteProjects(false)">
      <v-card>
        <v-card-title class="headline" primary-title>
          <div v-html="$t('delete.are_you_sure', { type: $tc('project.items', projectsSelected.length),
                                                   name: deleteProject.label })" />
        </v-card-title>

        <alert v-if="$_.filter(projectsSelected, p => p.inherits_to || p.inherits_to_and_from).length" type="warning">
          <span v-html="$t('delete_inherit_warn_project')" />
        </alert>

        <v-card-text v-html="$t('delete.description')" />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeDeleteProjects(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click.native="closeDeleteProjects(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Edit Question DIALOG ====== -->
    <v-dialog v-model="editQuestion.active" max-width="600" @keydown.esc="closeEditQuestion(false)" content-class="slpg">
      <v-card>
        <v-card-title class="headline"
                      v-html="$t('edit.dialog_title', { name: editQuestion.originalName,
                                                        item: $t('question.item') })" />

        <v-card-text>
          <v-text-field v-model="editQuestion.name"
                        :error-messages="editQuestion.nameInvalid"
                        :label="$t('eprops.name')"
                        counter
                        maxlength="50" />

          <v-checkbox v-model="editQuestion.completed"
                      :label="$t('eprops.status.completed')" />

        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeEditQuestion(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click.native="closeEditQuestion(true)">{{ $t('ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Delete question DIALOG ====== -->
    <v-dialog v-model="deleteQuestion.active" max-width="600" @keydown.esc="closeDeleteQuestion(false)">
      <v-card>
        <v-card-title class="headline" primary-title>
          <div v-if="deleteQuestion.active" v-html="$t('delete.are_you_sure', { type: $t('question.item'),
                                                                                name: $t('question.of_project', {
                                                                                  project: deleteQuestion.question.project_obj.name,
                                                                                  question: deleteQuestion.label }) })" />
        </v-card-title>

        <alert v-if="deleteQuestion.active && deleteQuestion.question.inherits_to_objs.length" type="warning">
          <span v-html="$t('delete_inherit_warn_question')" />
        </alert>

        <v-card-text v-html="$t('delete.description')" />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeDeleteQuestion(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click.native="closeDeleteQuestion(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Download DIALOG ====== -->
    <download-dialog v-model="download.active"
                     :credits-open="download.creditsOpen"
                     :entity-id="download.project"
                     entity-type="project" />

    <!-- ====== Permissions DIALOG ====== -->
    <permission-editor v-model="permissionEditor.active"
                       :entity-id="permissionEditor.projectID"
                       :entity-name="permissionEditor.projectName"
                       :permission-options="permissionEditor.permissionOptions"
                       entity-type="project" />

  </div>
</template>

<script>
import axios from 'axios'

import LabelSelect from '@/components/LabelSelect'
import ProjectListComponent from '@/components/ProjectList'
import DownloadDialog from '@/components/DownloadDialog'
import PermissionEditor from '@/components/PermissionEditor'
import ProjectListMixin from '@/mixins/ProjectList'
import tour from '@/mixins/tour.js'

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'ManageProjects',
  components: {
    'label-select': LabelSelect,
    'project-list': ProjectListComponent,
    'download-dialog': DownloadDialog,
    'permission-editor': PermissionEditor
  },
  mixins: [tour, ProjectListMixin],
  data () {
    return {
      projectsSelected: [],

      editProject: {
        active: false,
        originalName: '',
        name: '',
        nameInvalid: '',
        language: '',
        labels: [],
        labelsUnion: [],
        labelsChanged: false,
        completed: false,
        completedIndeterminate: false
      },

      deleteProject: {
        active: false,
        label: ''
      },

      deleteQuestion: {
        question: {},
        active: false,
        label: ''
      },

      editQuestion: {
        active: false,
        originalName: '',
        name: '',
        nameInvalid: '',
        completed: false,
        question: {}
      },

      projects: [],

      tour: null,
      loading: true,
      failed: false,

      download: {
        active: false,
        project: 0,
        creditsOpen: 0
      },

      permissionEditor: {
        active: false,
        projectID: -1,
        projectName: '',
        permissionOptions: [
          'projects_view',
          'projects_download',
          'projects_edit',
          'projects_permissions',
          'projects_inherit',
          'projects_append',
          'projects_delete'
        ]
      }
    }
  },

  computed: {
    focusProject () {
      return Number(this.$route.params.id) || null
    },

    labels: {
      cache: false,
      get () { return this.$refs.projectList ? this.$refs.projectList.labels : [] }
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    'editProject.active': 'dialogActivityChanged',
    'deleteProject.active': 'dialogActivityChanged'
  },

  mounted () {
    this.loadProjects()

    this.tour = [
      {
        title: 'tour.list.title',
        content: 'tour.list.description',
        target: '#projectList tbody',
        placement: 'top',
        xOffset: 170
      },
      {
        title: 'tour.edit.title',
        content: 'tour.edit.description',
        target: '.actions-cell',
        placement: 'left'
      },
      {
        title: 'tour.sort.title',
        content: 'tour.sort.description',
        target: '.last-modified',
        placement: 'bottom',
        yOffset: -65
      },
      {
        title: 'tour.tools.title',
        content: 'tour.tools.description',
        target: '.project-upload',
        placement: 'left'
      }
    ]
  },

  methods: {
    openProject ({ id, name } = {}) {
      let method
      // To not have a huge history of different focused projects
      // we're replacing the project id, if another one was present already
      if (this.$route.params.id) method = 'push'
      else method = 'push'
      this.$store.commit('setBreadcrumbProps', { projectID: id, projectName: name })
      this.$router[method]({
        name: `projects-manage${id ? '-id' : ''}`,
        params: { id }
      })
    },

    // Safety measure: Make sure the selected projects are cleared, so no relics can show up during next edit step
    dialogActivityChanged (n, o) { if (!n && o) this.projectsSelected.splice(0) },

    openDownload (project) {
      this.download.project = project.id
      this.download.creditsOpen = _.sumBy(project.questions, 'credits_open')
      this.download.active = true
    },

    openPermissions (project) {
      this.permissionEditor.projectID = project.id
      this.permissionEditor.projectName = project.name
      this.permissionEditor.active = true
    },

    openEditProjects (projectsSelected) {
      // function which checks if the specified property is equal for all selected projects
      let allElementsEqual = property => _.map(projectsSelected, property).every((val, i, arr) => val === arr[0])

      this.editProject.name = this.editProject.originalName = _.map(projectsSelected, 'name').join(', ')
      this.editProject.language = allElementsEqual('language') ? projectsSelected[0].language : ''
      this.editProject.completedIndeterminate = !allElementsEqual('completed')
      this.editProject.completed = this.editProject.completedIndeterminate ? false : projectsSelected[0].completed
      this.editProject.labelsChanged = projectsSelected.length === 1
      this.editProject.labelsUnion = _.union(..._.map(projectsSelected, 'labels'))
      this.editProject.labels = projectsSelected.length > 1 ? [] : this.editProject.labelsUnion
      this.editProject.nameInvalid = ''
      this.editProject.active = true

      this.projectsSelected = projectsSelected.slice()
    },

    openEditQuestion (question) {
      this.editQuestion.question = question
      this.editQuestion.name = this.editQuestion.originalName = question.name
      this.editQuestion.completed = question.completed
      this.editQuestion.nameInvalid = ''
      this.editQuestion.active = true
    },

    closeEditProject (save) {
      if (save) {
        let propsToUpdate = {}
        let n = this.projectsSelected.length

        if (n === 1) {
          if (this.editProject.name.length < 3) {
            this.editProject.nameInvalid = this.$t('edit.name_invalid')
            return
          } else propsToUpdate.name = this.editProject.name
        }

        if (this.editProject.language !== '') propsToUpdate.language = this.editProject.language
        if (!this.editProject.completedIndeterminate) propsToUpdate.completed = this.editProject.completed
        if (this.editProject.labelsChanged) propsToUpdate.labels = this.editProject.labels

        let requests = []
        this.projectsSelected.forEach(s => {
          _.keys(propsToUpdate).forEach(k => {
            // If the completed key was updated, we also need to update all projects
            if (k === 'completed') s.questions.forEach(q => { q.completed = propsToUpdate[k] })
            s[k] = propsToUpdate[k]
          })

          requests.push(api.patch('/api/projects/' + s.id, propsToUpdate))
        })

        axios.all(requests).then(() => {
          this.$root.snackMsg(this.$t('edit.done', {
            name: this.editProject.originalName, item: this.$tc('project.items', n)
          }))
        }, err => {
          this.$maybeRaiseAPIPromiseErr(err)
          this.$root.snackMsg(this.$t('error', { step: this.$t('save.title') }))
        })

        this.computeProjectProperties('projects')
      }
      this.editProject.active = false
    },

    clickEditProjectLabels () {
      if (!this.editProject.labelsChanged) {
        this.editProject.labelsChanged = true
        this.editProject.labels = this.editProject.labelsUnion
      }
    },

    closeEditQuestion (save) {
      if (save) {
        let propsToUpdate = {}

        if (this.editQuestion.name.length < 3) {
          this.editQuestion.nameInvalid = this.$t('edit.name_invalid')
          return
        }

        propsToUpdate.name = this.editQuestion.name
        propsToUpdate.completed = this.editQuestion.completed

        _.keys(propsToUpdate).forEach(k => { this.editQuestion.question[k] = propsToUpdate[k] })

        api.patch('/api/questions/' + this.editQuestion.question.id, propsToUpdate).then(res => {
          this.$root.snackMsg(this.$t('edit.done', { name: this.editQuestion.originalName, item: this.$t('question.item') }))
        }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
        this.computeProjectProperties('projects')
      }
      this.editQuestion.active = false
    },

    loadProjects () {
      api.get('/api/projects/').then((res) => {
        let projects = res.data

        this.$set(this, 'projects', projects)
        this.computeProjectProperties('projects')
        this.loading = false
      }).catch((err) => {
        this.loading = false
        this.failed = true
        this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    openDeleteProjects (projectsSelected) {
      this.deleteProject.label = _.map(projectsSelected, 'name').join(', ')
      this.deleteProject.active = true
      this.projectsSelected = projectsSelected.slice()
    },

    openDeleteQuestion (question) {
      this.deleteQuestion.question = question
      this.deleteQuestion.label = question.name
      this.deleteQuestion.active = true
    },

    closeDeleteProjects (doIt) {
      if (doIt) {
        let n = this.projectsSelected.length
        this.projectsSelected.forEach(s => {
          api.delete('/api/projects/' + s.id).then(response => {
            this.$root.snackMsg(this.$t('delete.done', {name: this.deleteProject.label,
              item: this.$tc('project.items', n)}
            ))
          }).catch(err => {
            this.$root.snackMsg(this.$t('error', {'step': this.$t('delete.title')}))
            this.$maybeRaiseAPIPromiseErr(err)
          })
        })

        let IDsToDelete = new Set(_.map(this.projectsSelected, 'id'))
        _.remove(this.projects, s => IDsToDelete.has(s.id))
        // Hack to make reactive again
        this.projects = [...this.projects]
      }
      this.deleteProject.active = false
    },

    closeDeleteQuestion (doIt) {
      if (doIt) {
        api.delete('/api/questions/' + this.deleteQuestion.question.id).then(response => {
          this.$root.snackMsg(this.$t('delete.done', { name: this.deleteQuestion.label, item: this.$t('question.item') }))
        }).catch(err => {
          this.$root.snackMsg(this.$t('error', {'step': this.$t('delete.title')}))
          this.$maybeRaiseAPIPromiseErr(err)
        })
        this.$root.snackMsg(this.$t('delete.done', { name: this.deleteQuestion.label, item: this.$tu('question.item') }))
        let p = this.deleteQuestion.question.project_obj
        p.questions.splice(_.findIndex(p.questions, { id: this.deleteQuestion.question.id }), 1)
        this.computeProjectProperties('projects')
      }
      this.deleteQuestion.active = false
    },

    toggleCompleted (project) {
      project.completed = !project.completed
      api.patch('/api/projects/' + project.id, { completed: project.completed })
    },

    editAttachLabel (label) {
      if (this.editProject.labels.indexOf(label) === -1) this.editProject.labels.push(label)
    }
  }
}

</script>

<style lang="scss" scoped>

.edit-tags-select {
  border-bottom: 1px solid #949494;
  margin: 10px 0 100px;
}

</style>

<style lang=scss>

.slpg .code-chip {
  background: #EEE!important;
}
.slpg .code-chip.selected, .code-chip:hover {
  background: #BDBDBD!important;
}

</style>
<i18n src='../i18n/pages/ProjectList.json'></i18n>
