<template>
  <!-- ====== Download dialog ===== -->
  <v-dialog v-model="valueComputed" width="800px" @keydown.esc="close">
    <v-card class="download-dialog">
      <v-card-title primary-title class="headline">{{ $t('download.title') }}</v-card-title>

      <alert v-if="error" type="error">
        {{ error }}
      </alert>

      <template v-else-if="creditsOpen>userCreditsRemaining">
        <!-- warning if not enough credits available -->
        <alert type="warning">
          <!-- at the end of the month it will be sufficient -->
          <span v-if="creditsOpen<=user.subscription.plan.credits_monthly">
            {{ $t('billing.not_enough_credits_month', {
              rows: creditsOpen,
              of_this_entity: $t(`${entityType}.of_this`),
              credits_remaining: userCreditsRemaining
            }) }}
          </span>
          <!-- it will never be sufficient without purchasing further credits -->
          <span v-else>
            {{ $t('billing.not_enough_credits_ever', {
              rows: creditsOpen,
              credits: user.subscription.plan.credits_monthly,
              of_this_entity: $t(`${entityType}.of_this`)
            }) }}
          </span>
          <div style="text-align: center">
            <v-btn :to="{ name: 'upload' }">
              {{ $t('billing.buy_additional') }}
            </v-btn>
          </div>
        </alert>
      </template>

      <alert v-else-if="creditsOpen>0" type="info">
        {{ $t('billing.bill_credits_info', {
          credits_deduct: creditsOpen,
          credits_available: userCreditsRemaining
        }) }}
      </alert>

      <v-card-text v-if="creditsOpen<=userCreditsRemaining">
        <div style="display: flex" v-if="!hideFormatOptions">
          <v-select style="margin-right: 40px; flex: 1"
                    v-model="filetype"
                    dense
                    :label="$t('download.filetype')"
                    :items="$_.map(filetypeOptions, (v, k) => { return { value: k, text: v.label } })" />
          <v-select style="flex: 1"
                    v-if="filetype!==0"
                    v-model="format"
                    dense
                    :label="$t('download.format.title')"
                    :items="[{ value: 'inorder', text: $t('download.format.inorder') },
                             { value: 'binary', text: $t('download.format.binary') }]" />
        </div>
        <div class="button-list">
          <!-- <v-btn color="primary" @click="download('answers')">{{ $t('download.answers') }}</v-btn>
          <v-btn color="primary" @click="download('codebook')">{{ $t('download.codebook') }}</v-btn> -->
          <v-btn v-for="(r, key) in resources" :key="key" :loading="isDownloading" color="primary" @click="download(key)">
            {{ r.label || $t(`download.${key}`) }}
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn outlined @click="close" :disabled="isDownloading">{{ $t('close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
'use strict'

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'DownloadDialog',
  props: {
    error: { type: String, default: '' },
    isDownloading: { type: Boolean, default: false },
    creditsOpen: { type: Number, default: 0 },
    value: { type: Boolean, default: false },
    entityType: { type: String, default: '' },
    entityId: { type: Number, default: 0 },
    resources: { type: Object, default: () => ({ answers: true, codebook: true }) },
    hideFormatOptions: { type: Boolean, default: false }
  },

  data () {
    return {
      filetype: 1,
      filetypeOptions: [
        {label: 'JSON', params: 'format=json&orient=records'},
        {label: 'Excel', params: 'format=xlsx'},
        {label: 'SPSS', params: 'format=sav'},
        {label: 'CSV', params: 'format=csv'}],
      format: 'inorder'
    }
  },

  computed: {
    ...Vuex.mapState([
      'user'
    ]),
    ...Vuex.mapGetters([
      'userCreditsRemaining'
    ]),
    valueComputed: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    }
  },

  methods: {
    download (resource) {
      console.log(resource)
      if (this.resources[resource].fn) {
        // If this is not a standard resource, call the custom function given by the resources object
        this.resources[resource].fn()
      } else {
        this.$emit('download')
        let uri = `${process.env.API_HTTP_BASE_URI}/api/${this.entityType}s/${this.entityId}/download-${resource}?${this.filetypeOptions[this.filetype].params}&code_format=${this.format}`
        window.location = uri
      }
    },
    close () { this.$emit('input', false) }
  }

}

</script>

<style lang=scss>

.download-dialog {
  .button-list {
    display: flex;
    .v-btn {
      flex: 1;
      margin-right: 15px;
      &:last-child {
        margin-right: 0;
      }
    }
  }
}

</style>

<i18n src='@/i18n/components/DownloadDialog.json'></i18n>
<i18n src='@/i18n/pages/Billing.json'></i18n>
