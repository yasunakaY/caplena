<template>
  <loading :is-loading="loading"
           :title="$t('coded_sample.loading')"
           style="">

    <template v-if="failed">
      <alert type="error" style="margin-top: 0">{{ $t('coded_sample.failed') }}</alert>
      <v-btn color="accent" @click="$emit('get-sample')">{{ $t('actions.retry') }}</v-btn>
    </template>
    <alert type="warning" style="margin-top: 0" v-else-if="warning">
      <span v-html="warning" />
    </alert>
    <ul v-else class="coded-samples" :style="{ 'max-height': `${maxHeight}px` }">
      <li v-for="ans in answers"
          :key="ans.id"
          v-if="ans.codes.length"
          @mouseover="hoverID = ans.id"
          @mouseleave="hoverID = null">
        <div class="frame">
          <span class="text" data-private>{{ ans.text }}</span>
          <span class="codes auto-assigned">
            <code-chip v-for="codeID in ans.codes"
                       :key="codeID"
                       :category="codeID2Code[codeID].category"
                       :color="$color.getMedium(codeID2CatIdx[codeID])"
                       :active="hoverID == ans.id">
              {{ codeID2Code[codeID].label }}
            </code-chip>
          </span>
        </div>
      </li>
    </ul>
  </loading>
</template>

<script>

import codeUtils from '@/mixins/codeUtils'

export default {
  codit: true,
  name: 'CodedSample',

  mixins: [codeUtils],

  props: {
    loading: { type: Boolean, default: false },
    failed: { type: Boolean, default: false },
    warning: { type: String, default: '' },
    maxHeight: { type: Number, default: 0 },
    answers: { type: Array, default: () => [] },
    codes: { type: Array, default: () => [] }
  },
  data () {
    return {
      hoverID: null
    }
  }
}

</script>

<i18n src='@/i18n/components/CodebookGenerator.json'></i18n>
