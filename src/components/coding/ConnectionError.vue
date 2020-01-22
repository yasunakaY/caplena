<template>
  <transition name="fade">
    <div ref="overlay-err" id="overlay-err" v-if="show">
      <div>
        <div class="headline">
          {{ $t('savingError.title') }}
          <template v-if="savingError.authenticationError">
            {{ $t('savingError.authentication') }}
          </template>
          <template v-if="savingError.networkError">
            {{ $t('savingError.network') }}
          </template>
        </div>
        <div style="display: flex">
          <div style="justify-content: center; align-items: center; display: flex">
            <img src="../../assets/network_warning.svg" style="height: 120px; width: 120px; margin-right: 20px" >
          </div>
          <div>
            <br ><br >{{ $t('savingError.todo.title') }}
            <ol>
              <li>{{ $t('savingError.todo.retry') }}</li>
              <li v-if="savingError.networkError">{{ $t('savingError.todo.network') }}</li>
              <li v-if="savingError.authenticationError" v-html="$t('savingError.todo.authentication')"/>
              <li v-html="$t('savingError.todo.refresh')"/>
              <li v-html="$t('savingError.todo.persists')"/>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'ConnectionError',
  props: {
    show: { type: Boolean, default: false }
  },
  computed: {
    ...Vuex.mapState({
      savingError: state => state.coding.savingError
    })
  }
}

</script>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
