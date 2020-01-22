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
      return require(`../assets/not_found.svg`)
    }
  }
}

</script>

<i18n>
{
  "en": {
    "title": "404 - Page not found 🤷‍♂️",
    "content": "If you think this page <b>should</b> exist, contact {email}.",
    "go_home": "Go home"
  },
  "de": {
    "title": "404 - Seite nicht gefunden 🤷‍♂️",
    "content": "Wenn du der Meinung bist, dass diese Seite existieren <b>sollte</b>, kontaktiere uns unter {email}.",
    "go_home": "Startseite laden"
  }
}
</i18n>
