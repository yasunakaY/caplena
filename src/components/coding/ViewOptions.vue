<!-- ====== View Options dialog ===== -->
<template>
  <v-dialog v-model="viewOptions.open" width="600px" @keydown.esc="viewOptions.open = false">
    <v-card>
      <v-card-title primary-title class="headline">{{ $t('view-opts.title') }}</v-card-title>

      <v-card-text>
        <v-select v-if="question.auxiliary_column_names.length"
                  v-model="viewOptions.alternativeID"
                  clearable
                  @click:clear="clearAuxiliary('alternativeID')"
                  :label="$t('view-opts.alternativeID')"
                  :items="$_.map(question.auxiliary_column_names, (v, k) => {
                    return { value: k, text: `${$t('view-opts.column')} ${v}`
        }})" />

        <v-select v-if="question.auxiliary_column_names.length"
                  v-model="viewOptions.additionalColumn"
                  clearable
                  @click:clear="clearAuxiliary('additionalColumn')"
                  :label="$t('view-opts.additionalColumn')"
                  :items="$_.map(question.auxiliary_column_names, (v, k) => { return { value: k, text: `${$t('view-opts.column')} ${v}` } })" />

        <div class="switch-with-helptip">
          <v-switch v-model="viewOptions.groupIdentical"
                    :label="$t('group_identical.title')"
                    color="success"
                    :disabled="!editable"/>
          <helptip position="bottom" :width="510" @click.native.stop.prevent>
            <div v-html="$t('group_identical.helptip')"/>
          </helptip>
        </div>

        <div v-if="question.translated>0" class="switch-with-helptip">
          <v-switch v-model="viewOptions.showTranslation"
                    :label="$t('translate.show')"
                    color="success"
                    :disabled="!editable" />
          <helptip position="bottom" :width="510" @click.native.stop.prevent>
            <div v-html="$t('translate.show_helptip')"/>
          </helptip>
        </div>

        <div class="switch-with-helptip">
          <v-switch name="smartSort"
                    v-model="viewOptions.smartSort"
                    :label="$t('smart_sort.title')"
                    color="success"
                    :disabled="!editable" />
          <helptip position="bottom" :width="510" @click.native.stop.prevent>
            <div v-html="$t('smart_sort.helptip')"/>
          </helptip>
        </div>

        <div class="switch-with-helptip">
          <v-switch name="showSentiment"
                    v-model="viewOptions.showSentiment"
                    color="success"
                    :label="$t('view-opts.sentiment')"
                    :disabled="!editable" />
          <helptip position="top" :width="510" @click.native.stop.prevent>
            <div v-html="$t('sentiment.helptip')"/>
          </helptip>
          <div class="beta-burst"><span>Beta</span></div>
        </div>

        <advanced-options divider-top>
          <div class="switch-with-helptip">
            <v-switch name="fixCodesDisplayOrder"
                      v-model="viewOptions.fixCodesDisplayOrder"
                      color="success"
                      :label="$t('view-opts.fix_codes')" />
            <helptip position="top" :width="510" @click.native.stop.prevent>
              <div v-html="$t('view-opts.fix_codes_helptip')"/>
            </helptip>
          </div>
          <div style="display: flex" v-if="viewOptions.groupIdentical" >
            <v-text-field :label="$t('group_identical.exclude_regex')"
                          :disabled="!editable"
                          v-model="viewOptions.groupIdenticalExclude"
                          maxlength="255"
                          counter />
            <helptip position="top" :width="530" style="margin-top: 25px">
              <div v-html="$t('group_identical.exclude_regex_helptip')"/>
            </helptip>
          </div>
        </advanced-options>

      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="$emit('close')">{{ $t('ok') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'ViewOptions',
  props: {
    value: { type: Object, default: () => ({}) }
  },
  computed: {
    viewOptions: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    },
    ...Vuex.mapState({
      question: state => state.coding.question,
      editable: state => state.coding.editable
    })
  },

  methods: {
    clearAuxiliary (field) {
      // We need to set the field to null in the next tick, as vuetify sets it to undefined internally
      // which would overwrite what we set here (vuetify bug?)
      this.$nextTick(() => { this.viewOptions[field] = null })
    }
  }
}

</script>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
