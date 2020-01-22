<!-- ====== Bulk edit dialog ===== -->
<template>
  <v-dialog v-model="show" width="600px" @keydown.esc="maybeCloseByEscape">
    <v-card>
      <v-card-title primary-title class="headline">{{ $t('bulk_edit.title') }}</v-card-title>

      <alert type="info" style="margin-bottom: 0">{{ $t('bulk_edit.subtitle-1', { nanswers: answersFiltered.length }) }}</alert>

      <v-card-text style="padding-top: 0">

        <v-radio-group v-model="mode">
          <v-radio :label="$t('bulk_edit.mode.append')" value="append" />
          <v-radio :label="$t('bulk_edit.mode.replace')" value="replace" />
        </v-radio-group>

        <code-select v-model="codes"
                     ref="codeSelect"
                     id="bulk-edit-codeselect"
                     :sync="true"
                     :codes-options="codesSorted"
                     label="label"
                     identifier="id"
                     category="category"
                     :placeholder="$t('bulk_edit.select_placeholder')"
                     max-height="180px"
                     style="margin-bottom: 180px"
                     allow-new />

      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn outlined @click="cancel">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="save">{{ $t('save.title') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

import Vuex from 'vuex'
import CodeSelect from '@/components/CodeSelect'

export default {
  codit: true,
  name: 'BulkEdit',
  components: {
    'code-select': CodeSelect
  },
  props: {
    value: { type: Boolean, default: false },
    answersFiltered: { type: Array, default: () => [] }
  },

  data () {
    return {
      mode: 'append',
      codes: []
    }
  },

  computed: {
    show: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    },

    ...Vuex.mapGetters([
      'codesSorted'
    ])
  },

  watch: {
    show (val) {
      if (!val) {
        this.codes.splice(0)
        this.$refs.codeSelect.closeDropdown()
      }
    }
  },

  methods: {
    save () {
      let unreviewed = 0
      let answerList = []
      this.answersFiltered.forEach(answer => {
        unreviewed += answer.reviewed === false
        if (this.mode === 'append') {
          let ac = new Set(answer.codes)
          // Only add codes that are not already present in answer
          answerList.push({
            id: answer.id,
            codes: answer.codes.concat(this.codes.filter(c => !ac.has(c))),
            reviewed: true
          })
        } else if (this.mode === 'replace') {
          // Be sure to copy the codes and not set the same array to all answers
          answerList.push({ id: answer.id, codes: [...this.codes], reviewed: true })
        } else throw Error(`Got invalid bulk edit mode: ${this.mode}`)
        this.$store.dispatch('setAnswerProps', answerList)
      })
      this.show = false
      this.$emit('reviewed', unreviewed)
    },

    maybeCloseByEscape () {
      if (!this.$refs.codeSelect.newCodeTriggeredFromHere) this.show = false
    },

    cancel () { this.show = false }
  }
}

</script>

<style lang=scss>
  #bulk-edit-codeselect {
    .code-chip:not(:hover):not(.selected) { background: #EEE }
  }
</style>

<i18n src='@/i18n/components/coding/BulkEdit.json'></i18n>
