<template>
  <div id="filters">

    <v-btn icon class="refresh" @click="filterSpecial">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-icon v-on="on"
                  :color="(filterInternal.special.value !== 'all' || filterInternal.codes.length ? 'accent' : '')">mdi-refresh</v-icon>
        </template>
        <span>{{ $t('coding.filter.refresh') }}</span>
      </v-tooltip>
    </v-btn>

    <v-menu class="special">
      <template v-slot:activator="{ on }">
        <v-btn :color="(filterInternal.special.value !== 'all' ? 'accent' : '')" v-on="on" text class="special-btn">
          <v-icon left>
            {{ filterInternal.special.options[filterInternal.special.value].icon }}
          </v-icon>

          {{ $t(`coding.filter.${filterInternal.special.value}`) }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(item, key) in filterInternal.special.options"
          :key="key"
          @click="filterInternal.special.value=key"
          :color="(filterInternal.special.value == key ? 'accent' : '')">
          <v-list-item-action>
            <v-icon style="color: inherit">{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t(`coding.filter.${key}`) }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-text-field :label="$t('search.title')"
                  single-line
                  @input="updateTextFilterDebounced"
                  :append-icon="( isClean || nAnsFiltered === 0 ? 'mdi-magnify' : '')"
                  @blur="searchFocused(false)"
                  @focus="searchFocused(true)"
                  class="text"
                  :class="{
                    'search-is-focused': searchIsFocused || !!filterInternal.text,
                    'fake-append-icon': !isClean && nAnsFiltered !== 0 }
                  " />

    <div class="bulk-edit">
      <v-btn icon @click="$emit('show-bulk-edit')" v-if="!(isClean || nAnsFiltered === 0)">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon v-on="on" color="accent">mdi-format-paint</v-icon>
          </template>
          <span>{{ $t('coding.filter.bulk_edit') }}</span>
        </v-tooltip>
      </v-btn>
    </div>

    <code-select class="codes" v-model="filterInternal.codes"
                 :codes-options="codesSorted"
                 :sync="true"
                 label="label"
                 close-on-select
                 category-selectable
                 @keydown.native.enter.prevent.stop
                 :placeholder="$t('coding.filter.codes')"/>

    <v-select :label="$t('coding.filter.options.label')"
              multiple
              :items="[
                { text: $t('coding.filter.options.and_codes.text'), value: 'andCodes', helptip: $t('coding.filter.options.and_codes.helptip') },
                { text: $t('coding.filter.options.invert.text'), value: 'invert', helptip: $t('coding.filter.options.invert.helptip')
              }]"
              light
              hide-details
              small-chips
              dense
              v-model="filterInternal.options"
              class="options"
              :menu-props="{ contentClass: 'allow-overflow filter-options-menu' }">

      <template v-slot:item="{ item, attrs, on }">
        <div class="v-list-item__action">
          <v-checkbox v-model="attrs.inputValue" light />
        </div>
        <div class="v-list-item__content">
          <div class="v-list__item__title" v-html="item.text" />
        </div>
        <helptip position="bottom" :width="300" x-offset="-120px" style="margin-left: 5px">
          <span v-html="item.helptip" />
        </helptip>
      </template>

      <template slot="selection" slot-scope="{ item, index }">
        <v-chip small><span v-html="item.text" /></v-chip>
      </template>
    </v-select>
  </div>
</template>

<script>

import CodeSelect from '@/components/CodeSelect'
import Vuex from 'vuex'

export default {
  codit: true,
  name: 'CodingFilters',
  components: {
    'code-select': CodeSelect
  },
  props: {
    value: { type: Object, default: () => ({}) },
    nAnsFiltered: { type: Number, default: 0 }
  },

  data () {
    return {
      searchIsFocused: false,

      updateTextFilterDebounced: _.debounce((val) => {
        this.filterInternal.text = val
      }, 250)
    }
  },

  computed: {
    filterInternal: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    },
    ...Vuex.mapGetters([
      'codesSorted'
    ]),

    isClean () {
      let f = this.filterInternal
      return f.text === '' && !f.codes.length && f.special.value === 'all'
    }
  },

  methods: {
    filterSpecial () { this.$emit('filter-special') },

    searchFocused (val) {
      this.searchIsFocused = val
      this.$emit('search-is-focused', val)
    }
  }
}

</script>

<style lang=scss>

$col-ans-bg: #EEEEEE;

@keyframes shake-short {
  10% {
    transform: translate3d(4px, 0, 0)
  }

  40% {
    transform: translate3d(-4px, 0, 0)
  }

  60% {
    transform: translate3d(2px, 0, 0)
  }

  80% {
    transform: translate3d(-2px, 0, 0)
  }
}

#filters {
  align-items: center;
  display: flex;
  flex: 1;

  .special {
    margin: 0 18px 0 0;
  }
  .special-btn {
    width: 230px;
    justify-content: flex-start;
    color: rgba(0,0,0,.54);
    .v-icon { margin-right: 32px; margin-top: 0 }
  }
  .text {
    flex: 0 0 auto;
    margin: 0 20px 0 0;
    padding-top: 20px;
    transition: flex ease-out 0.15s;
    &.search-is-focused {
      flex: 1 0 auto;
    }
    &.fake-append-icon .v-text-field__slot {
      padding-right: 28px;
    }
  }
  .codes {
    flex: 2 0 300px;
    max-width: 800px;
    margin-top: -4px;
    min-height: 30px;
    font-size: 14px;
    .code-chip:not(:hover):not(.selected) {
      background: $col-ans-bg;
    }
  }

  .options {
    flex: 0 0 220px;
    max-width: 220px;
    margin: -14px 0 0 20px;
  }

  .bulk-edit {
    position: relative;
    top: -9px;
    left: 17px;
    width: 0;
    height: 36px;

    .v-btn {
      position: absolute;
      left: -51px;
      animation: shake-short 0.5s linear 1;
    }
  }
}

.filter-options-menu .v-list__tile__action { min-width: 35px }

</style>

<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
