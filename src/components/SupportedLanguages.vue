<template>
  <div>
    <div v-for="lang in uploadLanguages" :key="lang">
      {{ lang }}
    </div>
  </div>
</template>
<script>
import {UPLOAD_LANGUAGES} from '@/settings/constants'
export default {
  computed: {
    uploadLanguages () {
      return _.map(UPLOAD_LANGUAGES, v => this.$t(`language.${v}`)).sort()
    }
  }
}
</script>
<i18n src='../i18n/AppPage.json'></i18n>
