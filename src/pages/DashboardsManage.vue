<template>
  <div class="main-content slpg" style="margin-bottom: 80px">
    <alert type="error" class="retry" v-if="failed">
      <div class="text">{{ $t('error', {'step': $t('loading.while')}) }}</div>
      <v-btn @click="loadDashboards"><v-icon left dark>mdi-reload</v-icon> {{ $t('actions.retry') }}</v-btn>
    </alert>

    <dashboard-list v-else
                    :dashboards="dashboards"
                    :loading="loading"
                    tags-box
                    search-filter-enable
                    labels-filter-enable
                    is-public-filter-enable
                    selectable
                    @open-dashboard="openDashboard"
                    ref="dashboardList">

      <template slot="title">{{ $t('title') }}</template>

      <template slot="empty-state">
        <v-btn color="primary" exact :to="{ name: 'dashboard-details', params: { id: 'new' } }">
          {{ $t('menu.new') }}
        </v-btn>
      </template>

      <template slot="header-actions" slot-scope="{ dashboardsSelected }">
        <v-btn v-if="user.profile.organization && user.profile.organization.rbac"
               icon
               small
               :disabled="dashboardsSelected.length !== 1 || !$hasPermission('dashboards_edit', dashboardsSelected[0])"
               @click="openPermissions(dashboardsSelected[0])">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-account-supervisor</v-icon></template>
            <span>{{ $t('actions.permissions ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn icon
               small
               :disabled="!dashboardsSelected.every(d => $hasPermission('dashboards_edit', d))"
               @click="openEditDashboards(dashboardsSelected)">
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-pencil</v-icon></template>
            <span>{{ $t('actions.edit ') }}</span>
          </v-tooltip>
        </v-btn>

        <v-btn @click="openDeleteDashboards(dashboardsSelected)"
               :disabled="!dashboardsSelected.every(d => $hasPermission('dashboards_edit', d))"
               icon
               small>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-delete</v-icon></template>
            <span>{{ $t('actions.delete ') }}</span>
          </v-tooltip>
        </v-btn>
      </template>

    </dashboard-list>

    <!-- ====== Edit dashboards DIALOG ====== -->
    <v-dialog v-model="editDashboard.active" max-width="600" @keydown.esc="closeEditDashboard(false)" content-class="slpg">
      <v-card>
        <v-card-title class="headline"
                      v-html="$t('edit.dialog_title', { name: editDashboard.originalName,
                                                        item: $tc('dashboard.items', dashboardsSelected.length) })" />

        <v-card-text>
          <v-text-field v-model="editDashboard.name"
                        :disabled="dashboardsSelected.length>1"
                        :error-messages="editDashboard.nameInvalid"
                        :label="$t('eprops.name')"
                        :counter="dashboardsSelected.length===1"
                        maxlength="50" />

          <label-select v-model="editDashboard.labels" class="edit-tags-select"
                        :options="labels"
                        :sync="true"
                        allow-new
                        :placeholder="editDashboard.labelsChanged ? $t('labels.attach_placeholder') : $t('labels.attach_placeholder_multiple')"
                        max-height="120px"
                        @click.native="clickEditDashboardLabels"
                        :style="{ opacity: editDashboard.labelsChanged ? 1.0 : 0.5 }"
                        @new-label="editAttachLabel"/>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeEditDashboard(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click.native="closeEditDashboard(true)">{{ $t('ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Delete dashboards DIALOG ====== -->
    <v-dialog v-model="deleteDashboard.active" max-width="600" @keydown.esc="closeDeleteDashboards(false)">
      <v-card>
        <v-card-title class="headline" primary-title>
          <div v-html="$t('delete.are_you_sure', { type: $tc('dashboard.items', dashboardsSelected.length),
                                                   name: deleteDashboard.label })" />
        </v-card-title>

        <alert v-if="$_.filter(dashboardsSelected, p => p.inherits_to || p.inherits_to_and_from).length" type="warning">
          <span v-html="$t('delete_inherit_warn_dashboard')" />
        </alert>

        <v-card-text v-html="$t('delete.description')" />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeDeleteDashboards(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click.native="closeDeleteDashboards(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Permissions DIALOG ====== -->
    <permission-editor v-model="permissionEditor.active"
                       :entity-id="permissionEditor.dashboardID"
                       :entity-name="permissionEditor.dashboardName"
                       :permission-options="permissionEditor.permissionOptions"
                       entity-type="dashboard" />

  </div>
</template>

<script>
import axios from 'axios'

import LabelSelect from '@/components/LabelSelect'
import DashboardListComponent from '@/components/DashboardList'
import DownloadDialog from '@/components/DownloadDialog'
import PermissionEditor from '@/components/PermissionEditor'

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'ManageDashboards',
  components: {
    'label-select': LabelSelect,
    'dashboard-list': DashboardListComponent,
    'download-dialog': DownloadDialog,
    'permission-editor': PermissionEditor
  },
  data () {
    return {
      dashboardsSelected: [],

      editDashboard: {
        active: false,
        originalName: '',
        name: '',
        nameInvalid: '',
        labels: [],
        labelsUnion: [],
        labelsChanged: false
      },

      deleteDashboard: {
        active: false,
        label: ''
      },

      dashboards: [],
      loading: true,
      failed: false,

      permissionEditor: {
        active: false,
        dashboardID: -1,
        dashboardName: '',
        permissionOptions: [
          'dashboards_view',
          'dashboards_edit'
        ]
      }
    }
  },

  computed: {
    labels: {
      cache: false,
      get () { return this.$refs.dashboardList ? this.$refs.dashboardList.labels : [] }
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    'editDashboard.active': 'dialogActivityChanged',
    'deleteDashboard.active': 'dialogActivityChanged'
  },

  mounted () {
    this.loadDashboards()
  },

  methods: {
    openDashboard (id) {
      this.$router.push({
        name: 'dashboard-details',
        params: { id }
      })
    },

    // Safety measure: Make sure the selected dashboards are cleared, so no relics can show up during next edit step
    dialogActivityChanged (n, o) { if (!n && o) this.dashboardsSelected.splice(0) },

    openPermissions (dashboard) {
      this.permissionEditor.dashboardID = dashboard.id
      this.permissionEditor.dashboardName = dashboard.name
      this.permissionEditor.active = true
    },

    openEditDashboards (dashboardsSelected) {
      this.editDashboard.name = this.editDashboard.originalName = _.map(dashboardsSelected, 'name').join(', ')
      this.editDashboard.labelsChanged = dashboardsSelected.length === 1
      this.editDashboard.labelsUnion = _.union(..._.map(dashboardsSelected, 'labels'))
      this.editDashboard.labels = dashboardsSelected.length > 1 ? [] : this.editDashboard.labelsUnion
      this.editDashboard.nameInvalid = ''
      this.editDashboard.active = true

      this.dashboardsSelected = dashboardsSelected.slice()
    },

    closeEditDashboard (save) {
      if (save) {
        let propsToUpdate = {}
        let n = this.dashboardsSelected.length

        if (n === 1) {
          if (this.editDashboard.name.length < 3) {
            this.editDashboard.nameInvalid = this.$t('edit.name_invalid')
            return
          } else propsToUpdate.name = this.editDashboard.name
        }

        if (this.editDashboard.labelsChanged) propsToUpdate.labels = this.editDashboard.labels

        let requests = []
        this.dashboardsSelected.forEach(s => {
          // Update the keys in all dashbaords
          _.keys(propsToUpdate).forEach(k => { s[k] = propsToUpdate[k] })

          // Create a request for every dashboard
          requests.push(api.patch('/api/dashboards/' + s.id, propsToUpdate))
        })

        axios.all(requests).then(() => {
          this.$root.snackMsg(this.$t('edit.done', {
            name: this.editDashboard.originalName, item: this.$tc('dashboard.items', n)
          }))
        }, err => {
          this.$maybeRaiseAPIPromiseErr(err)
          this.$root.snackMsg(this.$t('error', { step: this.$t('save.title') }))
        })
      }
      this.editDashboard.active = false
    },

    clickEditDashboardLabels () {
      if (!this.editDashboard.labelsChanged) {
        this.editDashboard.labelsChanged = true
        this.editDashboard.labels = this.editDashboard.labelsUnion
      }
    },

    loadDashboards () {
      api.get('/api/dashboards/').then((res) => {
        let dashboards = res.data

        this.$set(this, 'dashboards', dashboards)
        this.loading = false
      }).catch((err) => {
        this.loading = false
        this.failed = true
        this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    openDeleteDashboards (dashboardsSelected) {
      this.deleteDashboard.label = _.map(dashboardsSelected, 'name').join(', ')
      this.deleteDashboard.active = true
      this.dashboardsSelected = dashboardsSelected.slice()
    },

    closeDeleteDashboards (doIt) {
      if (doIt) {
        let n = this.dashboardsSelected.length
        this.dashboardsSelected.forEach(s => {
          api.delete('/api/dashboards/' + s.id).then(response => {
            this.$root.snackMsg(this.$t('delete.done', {name: this.deleteDashboard.label,
              item: this.$tc('dashboard.items', n)}
            ))
          }).catch(err => {
            this.$root.snackMsg(this.$t('error', {'step': this.$t('delete.title')}))
            this.$maybeRaiseAPIPromiseErr(err)
          })
        })

        let IDsToDelete = new Set(_.map(this.dashboardsSelected, 'id'))
        _.remove(this.dashboards, s => IDsToDelete.has(s.id))
        // Hack to make reactive again
        this.dashboards = [...this.dashboards]
      }
      this.deleteDashboard.active = false
    },

    editAttachLabel (label) {
      if (this.editDashboard.labels.indexOf(label) === -1) this.editDashboard.labels.push(label)
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
<i18n src='../i18n/pages/DashboardList.json'></i18n>
