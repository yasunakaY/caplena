<template>
  <div class="chart-layout">
    <div class="layout-col controls-col" v-if="!hideControls">
      <div class="controls-container">
        <alert v-if="failed" type="error">
          <span v-html="$t('error', {'step': $t('loading.while')})" />
        </alert>

        <template v-else>
          <alert v-if="!hasVisualizationsAccess" type="warning">
            <span v-html="$t('controls.warning_no_access')" />
          </alert>

          <alert v-if="readOnly" type="warning">
            <span v-html="$t('controls.warning_read_only')" />
          </alert>

          <alert v-if="codesNotSameInAllDatasets && ready" :type="codesAvailable.length ? 'warning' : 'error'">
            <span v-html="$t('controls.warning_codes_not_matching', { n_codes_available: codesAvailable.length })" />
          </alert>
        </template>

        <slot name="actions" />

        <slot name="control-pane" v-if="!hideControls" />

        <slot name="datasets" v-if="!hideControls" />
      </div>
    </div>
    <div class="layout-col chart-col">
      <div class="chart-container"
           ref="chart-container"
           :class="{ fullscreen, 'dims-auto': config.dimensions.auto, 'dims-manual': !config.dimensions.auto }"
           :style="containerStyle"
           @contextmenu.prevent>

        <div class="toolbox" :class="{ fullscreen }" v-if="!hideControls">
          <helptip position="bottom" :width="480" v-if="helptip">
            <span v-html="helptip" />
          </helptip>
          <v-tooltip bottom>
            <span>{{ $t('download_chart') }}</span>
            <template v-slot:activator="{ on }">

              <v-btn small v-on="on" icon color="primary" @click="showDownload = true; fullscreen=true" class="btn-download">
                <v-icon>mdi-file-download</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn icon small color="primary" @click="fullscreen = !fullscreen; $emit('fullscreen', fullscreen)" class="btn-fullscreen">
            <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
            <v-icon v-else>mdi-fullscreen</v-icon>
          </v-btn>
        </div>

        <slot :chart-style="chartStyle" />
        <slot name="after-chart" />
      </div>
    </div>
    <download-dialog v-if="!hideControls"
                     v-model="showDownload"
                     :credits-open="creditsOpen"
                     :error="downloadErrorMsg"
                     entity-type="question"
                     @download="download"
                     :is-downloading="isDownloading"
                     :resources="downloadDialogResources"
                     hide-format-options />
  </div>
</template>

<script>

import axios from 'axios'

import Vuex from 'vuex'
import DownloadDialog from '@/components/DownloadDialog'

export default {
  codit: true,
  name: 'ChartScaffold',

  components: {
    'download-dialog': DownloadDialog
  },

  props: {
    datasets: { type: Array, default: () => [] },
    config: { type: Object, default: () => ({}) },
    codesAvailable: { type: Array, default: () => [] },
    chartOptions: { type: Object, default: () => ({}) },
    containerStyle: { type: Object, default: () => ({}) },
    ready: { type: Boolean, default: false },
    failed: { type: Boolean, default: false },
    helptip: { type: String, default: '' },
    hideControls: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false }
  },

  data () {
    return {
      fullscreen: false,
      showDownload: false,
      isDownloading: false,
      billingFailed: false,

      containerWidth: 0
    }
  },

  computed: {
    chartStyle () {
      return {
        'width': this.config.dimensions.auto ? '100%' : `${this.config.dimensions.width}px`,
        'height': this.config.dimensions.auto ? '100%' : `${this.config.dimensions.height}px`
      }
    },

    codesNotSameInAllDatasets () {
      if (!this.datasets.length) return true
      return this.datasets.some(ds => ds.question.codebook && ds.question.codebook.length !== this.codesAvailable.length)
    },

    hasVisualizationsAccess () {
      return this.user.subscription.plan.visualizations_access
    },

    creditsOpen () {
      return _.sumBy(_.uniqBy(this.datasets, ds => ds.question.id), ds => ds.question.credits_open)
    },

    downloadDialogResources () {
      if (!this.hasVisualizationsAccess) return {}
      else return { chart: { label: this.$t('download_chart'), fn: this.download } }
    },

    downloadErrorMsg () {
      if (this.billingFailed) return this.$t('controls.error_billing_failed')
      else if (!this.hasVisualizationsAccess) return this.$t('controls.warning_no_access')
      else return ''
    },

    ...Vuex.mapState(['user'])
  },

  watch: {
    'config.dimensions.auto': 'setContainerWidth',
    'config.dimensions.width': 'setContainerWidth',

    fullscreen () {
      setTimeout(this.setContainerWidth, 300)
      this.$emit('fullscreen', true)
    },

    containerWidth (val) { this.$emit('container-width', val) }
  },

  mounted () {
    this.setContainerWidth()
  },

  methods: {
    setContainerWidth () {
      this.$nextTick(() => {
        this.containerWidth = this.config.dimensions.auto ? this.$refs['chart-container'].scrollWidth : this.config.dimensions.width
      })
    },

    download () {
      // If there are unbilled answers, bill them, otherwise do nothing
      let questionsToBill = _.uniqBy(_.filter(_.map(this.datasets, ds => ds.question), q => q.credits_open), q => q.id)

      let minCreditsMonthly = this.user.profile.credits_remaining_monthly
      let minCreditsOneoff = this.user.profile.credits_remaining_oneoff

      if (!questionsToBill.length) this.$emit('download')
      else {
        let requests = []
        this.isDownloading = true
        questionsToBill.forEach(question => {
          requests.push(api.post(`/api/questions/${question.id}/bill`).then(res => {
            if (!res.data.success) throw Error(`Billing failed, got ${JSON.stringify(res.data)}, expected success`)
            // We need to do this ugly hack to determine which was the last request
            // as we all fire them off simultaneously
            minCreditsMonthly = Math.min(minCreditsMonthly, res.data.profile.credits_remaining_monthly)
            minCreditsOneoff = Math.min(minCreditsOneoff, res.data.profile.credits_remaining_oneoff)
          }).catch(err => {
            this.billingFailed = true
            this.$maybeRaiseAPIPromiseErr(err)
            // Re-raise the error, such that axios.all doesn't think it's a success
            throw err
          }))
        })

        axios.all(requests).then(v => {
          // Set the balance on all questions to zero
          _.each(this.datasets, ds => { ds.question.credits_open = 0 })
          // Update the account balance
          let profile = {
            credits_remaining_monthly: minCreditsMonthly,
            credits_remaining_oneoff: minCreditsOneoff
          }
          this.$store.dispatch('updateUser', { profile, dontPatch: true })
          this.isDownloading = false
          this.billingFailed = false
          this.$emit('download')
        }).catch(() => {
          // No need to do anything else, error has alredy been dealt with in single requests
          this.isDownloading = false
        })
      }
    }
  }
}

</script>

<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
