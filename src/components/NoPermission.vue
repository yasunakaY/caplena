<template>
  <alert type="error">
    <span v-html="$t('permission.no_permission', { email: adminEmail } )" />
  </alert>
</template>

<script>
import Vuex from 'vuex'

export default {
  codit: true,
  name: 'NoPermission',
  computed: {
    ...Vuex.mapState({
      user: 'user'
    }),
    adminEmail () { return this.user.profile.organization.root_user_email }
  }
}

</script>
