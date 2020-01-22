<template>
  <div class="main-content uspg" ref="main-content">

    <!-- ====== Step: UPLOAD ANSWERS ====== -->
    <div class="headline" v-html="$t('answers.title_append', { project: project.name })" />
    <p/>

    <loading v-model="loading.percentage"
             :is-loading="loading.active"
             :dont-animate-entry="true"
             :title="$t('loading.title')"
             :tagline="loading.eta">

      <alert v-if="loading.failed !== null" type="error">{{ loading.failed }}</alert>

      <alert v-if="projectLoadingFailed!==null" type="error">{{ projectLoadingFailed }}</alert>

      <div v-else>
        <upload-answers v-model="validAnswersUpload"
                        :answers-input.sync="answersInput"
                        :answers-res.sync="answersRes"
                        :show-n-sample-rows="showNSampleRows"
                        :encoding-options="encodingOptions"
                        :auxiliary-column-names="auxiliaryColumnNames"
                        :append="true"
                        :project="project"
                        :header-options="headerOptions"
                        ref="uploadAnswers" />

        <alert type="warning" v-if="identicalRows.size">
          {{ $t('answers.identical_rows.warning', { nrows: identicalRows.size }) }}
          <div class="upload-identical">
            <v-radio-group v-model="uploadIdenticalAnswers">
              <v-radio :value="false" :label="$t('answers.identical_rows.skip')" />
              <v-radio :value="true" :label="$t('answers.identical_rows.noskip')" />
            </v-radio-group>
          </div>
        </alert>

        <alert type="info" v-if="validAnswersUpload">
          <span v-html="$t('save.summary_append', { nrows: nAnswerRows, project: project.name })" />
        </alert>

        <v-btn :disabled="!validAnswersUpload||loading.active" @click="submit" color="primary">
          {{ $t('save.save') }}
        </v-btn>
      </div>
    </loading>
  </div>
</template>

<script>

import Vuex from 'vuex'
import axios from 'axios'
import UploadAnswersComponent from '@/components/upload/UploadAnswers'
import UploadAnswersMixin from '@/mixins/uploadAnswers'
import ApiTaskMixin from '@/mixins/apitask'

export default {
  codit: true,
  name: 'Append',
  components: {
    'upload-answers': UploadAnswersComponent
  },
  mixins: [ApiTaskMixin, UploadAnswersMixin],
  data () {
    return {
      showNSampleRows: 30,
      projectLoadingFailed: null,
      rowsExistingHashes: new Set(),
      project: {
        name: '',
        description: '',
        auxiliary_column_names: []
      },

      loading: {
        active: true,
        percentage: null,
        eta: '',
        failed: null
      }
    }
  },

  computed: {
    ...Vuex.mapState(['user']),
    ...Vuex.mapGetters(['userCreditsRemaining'])
  },

  created () {
    let id = this.$route.params.id
    let axiosProject = api.get('/api/projects/' + id).then((res) => {
      this.$set(this, 'project', res.data)
      this.$store.commit('setBreadcrumbProps', {
        projectID: this.project.id,
        projectName: this.project.name
      })
    }).catch(() => {
      this.projectLoadingFailed = this.$t('error', {'step': this.$t('loading.while')})
    })

    let axiosRows = api.get('/api/projects/' + id + '/rows').then((res) => {
      this.hashProjectRows(res.data)
    }).catch((err) => {
      this.projectLoadingFailed = this.$t('error', {'step': this.$t('loading.while')})
      this.$maybeRaiseAPIPromiseErr(err)
    })

    axios.all([axiosProject, axiosRows]).then(v => {
      this.loading.active = false
    })
  },

  methods: {
    submit () {
      this.loading.active = true
      this.loading.failed = false
      this.loading.percentage = null

      let rows = this.prepareRowsForSubmit(true)

      api.post(`/api/projects/${this.project.id}/rows?async`, rows).then(res => {
        if (res.status !== 201) {
          this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
          this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
          this.loading.active = false
        } else {
          let updateCb = (eta, percentage) => {
            this.loading.eta = eta
            this.loading.percentage = percentage
          }
          this.getApiTaskStatus(res.headers['task-id'], parseFloat(res.headers['task-eta']), updateCb).then(() => {
            this.$root.snackMsg(this.$t('save.success_append'))
            this.$router.push({ name: 'projects-manage-id', params: { id: this.project.id } })
          }).catch(err => {
            this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
            this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
            this.loading.active = false
            this.$onError(err)
          })
        }
      }).catch((err) => {
        this.loading.status = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
        this.loading.failed = this.$t('error', {'step': this.$t('save.saving')})
        this.$maybeRaiseAPIPromiseErr(err)
      })
    }
  }
}

</script>

<style lang=scss>
@import '../css/upload.scss';

.upload-identical {
  .v-input {
    margin-top: 8px;
    .v-radio {
      label {color: #000; margin: 0 }
    }
    .v-messages { display: none; }
  }
}

</style>

<i18n src='../i18n/pages/Upload.json'></i18n>
