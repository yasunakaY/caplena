<template>
  <div class="main-content slpg" style="margin-bottom: 80px">
    <alert type="error" class="retry" v-if="failed">
      <div class="text">{{ $t('error', {'step': $t('loading.while')}) }}</div>
      <v-btn @click="loadCharts"><v-icon left dark>mdi-reload</v-icon> {{ $t('actions.retry') }}</v-btn>
    </alert>

    <chart-list v-else
                :charts="charts"
                :loading="loading"
                :question-to-filter="questionToFilter"
                search-filter-enable
                questions-filter-enable
                selectable
                @open-chart="openChart"
                ref="chartList">

      <template slot="title">{{ $t('title') }}</template>

      <template slot="empty-state">
        <v-btn color="primary" exact :to="{ name: 'chart-details', params: { id: 'new' } }">
          {{ $t('menu.new') }}
        </v-btn>
      </template>

      <template slot="header-actions" slot-scope="{ chartsSelected }">
        <v-btn @click="openDeleteCharts(chartsSelected)"
               icon
               small>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }"><v-icon v-on="on">mdi-delete</v-icon></template>
            <span>{{ $t('actions.delete ') }}</span>
          </v-tooltip>
        </v-btn>
      </template>
    </chart-list>

    <!-- ====== Delete charts DIALOG ====== -->
    <v-dialog v-model="deleteChart.active" max-width="600" @keydown.esc="closeDeleteCharts(false)">
      <v-card>
        <v-card-title class="headline" primary-title>
          <div v-html="$t('delete.are_you_sure', { type: $tc('chart.items', chartsSelected.length),
                                                   name: deleteChart.label })" />
        </v-card-title>

        <v-card-text v-html="$t('delete.description')" />

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeDeleteCharts(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click.native="closeDeleteCharts(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import ChartListComponent from '@/components/ChartList'

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'ManageCharts',
  components: {
    'chart-list': ChartListComponent
  },

  data () {
    return {
      chartsSelected: [],

      deleteChart: {
        active: false,
        label: ''
      },

      charts: [],

      loading: true,
      failed: false,

      download: {
        active: false,
        project: 0,
        creditsOpen: 0
      }
    }
  },

  computed: {
    questionToFilter () {
      if ('questionID' in this.$route.query) return this.$route.query
      else return null
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    'deleteChart.active': 'dialogActivityChanged'
  },

  mounted () {
    this.loadCharts()
  },

  methods: {
    openChart (id) {
      this.$router.push({
        name: 'chart-details',
        params: { id }
      })
    },

    // Safety measure: Make sure the selected projects are cleared, so no relics can show up during next edit step
    dialogActivityChanged (n, o) { if (!n && o) this.chartsSelected.splice(0) },

    loadCharts () {
      api.get('/api/charts/').then((res) => {
        let charts = res.data
        charts.forEach(c => { c.ndatasets = c.datasets.length })
        this.$set(this, 'charts', charts)
        this.loading = false
      }).catch((err) => {
        this.loading = false
        this.failed = true
        this.$root.snackMsg(this.$t('error', {'step': this.$t('loading.while')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    openDeleteCharts (chartsSelected) {
      this.deleteChart.label = _.map(chartsSelected, 'name').join(', ')
      this.deleteChart.active = true
      this.chartsSelected = chartsSelected.slice()
    },

    closeDeleteCharts (doIt) {
      if (doIt) {
        let n = this.chartsSelected.length
        this.chartsSelected.forEach(s => {
          api.delete('/api/charts/' + s.id).then(response => {
            this.$root.snackMsg(this.$t('delete.done', {name: this.deleteChart.label,
              item: this.$tc('chart.items', n)}
            ))
          }).catch(err => {
            this.$root.snackMsg(this.$t('error', {'step': this.$t('delete.title')}))
            this.$maybeRaiseAPIPromiseErr(err)
          })
        })

        let IDsToDelete = new Set(_.map(this.chartsSelected, 'id'))
        _.remove(this.charts, s => IDsToDelete.has(s.id))
        // Hack to make reactive again
        this.charts = [...this.charts]
      }
      this.deleteChart.active = false
    }
  }
}

</script>

<style lang=scss>

.slpg .code-chip {
  background: #EEE!important;
}
.slpg .code-chip.selected, .code-chip:hover {
  background: #BDBDBD!important;
}

</style>
<i18n src='../i18n/pages/ChartList.json'></i18n>
