<template>
  <div class="main-content">
    <v-dialog :value="true" max-width="600" persistent>
      <v-card>
        <v-card-title class="title" primary-title>{{ $t('title') }}</v-card-title>
        <v-img class="white--text" height="400px" contain :src="getImg()" />
        <v-card-text v-html="$t('content', { email })" />
        <v-card-actions>
          <v-spacer />
          <v-btn href="/app/">{{ $t('go_home') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

export default {
  codit: true,
  name: 'PageNotFound',
  data () {
    return {
      email: '<a href="mailto: support@caplena.com">support@caplena.com</a>'
    }
  },

  methods: {
    getImg () {
      return require('../assets/access_denied.svg')
    }
  }
}

</script>

<i18n>
{
  "en": {
    "title": "🙅‍♀️ Access Denied",
    "content": "<p><b>You shall not pass.</b></p>If you think you should be able to access this resource, contact {email}.",
    "go_home": "Go home"
  },
  "de": {
    "title": "🙅‍♀️ Zugriff verweigert",
    "content": "Wenn du der Meinung bist, dass Zugang zu dieser Resource haben solltest, kontaktiere uns unter {email}.",
    "go_home": "Startseite laden"
  }
}
</i18n>
