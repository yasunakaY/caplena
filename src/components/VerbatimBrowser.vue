<template>
  <div class="verbatim-browser">
    <v-card-title v-if="displayCount || displayColumnSelect">
      <div class="title" v-if="displayCount">
        {{ $t('ds.verbatim_browser.title') }}: &nbsp;<code>{{ answersFiltered.length }}</code>
      </div>

      <v-spacer />

      <v-select v-if="displayColumnSelect"
                v-model="showColumnInternal"
                dense
                :items="showColumnOptions"
                :label="$t('ds.verbatim_browser.column_select')"
                hide-details
                clearable
                @click.clear="$emit('set-show-column', null)"
                style="flex: 0 0 300px" />

    </v-card-title>

    <v-card-text>
      <div class="verbatim-browser-container" :style="{ 'height': `${height - 40 - 60 * (displayCount || displayColumnSelect)}px` }">

        <empty-state v-if="ready && !answersFiltered.length"
                     icon="mdi-crosshairs-gps"
                     :label="$t('ds.verbatim_browser.no_matches_title')"
                     :description="$t('ds.verbatim_browser.no_matches_description')" />

        <DynamicScroller v-else-if="ready"
                         :items="answersFiltered"
                         :min-item-size="60"
                         :buffer="200"
                         class="scroller"
                         ref="scroller">

          <template v-slot="{ item, index, active }">
            <DynamicScrollerItem :item="item"
                                 :active="active"
                                 :data-index="index"
                                 :data-active="active"
                                 class="row">

              <div class="frame">
                <div class="text">
                  <!-- we have to make things ugly: No spaces as otherwise things would look wrong -->
                  {{ item.text.substr(0, maxVerbatimChars) }}<template v-if="item.text.length > maxVerbatimChars"><label class="read-more-wrap"><input type="checkbox" class="state"><span class="dotdot" @click.prevent>...</span><span class="target" @click.prevent>{{ item.text.substr(50) }}</span >
                    <span class="trigger trigger-more">more</span>
                    <span class="trigger trigger-less">less</span>
                  </label>
                  </template>
                </div>
                <div class="codes" v-if="showColumnInternal === 'codes'">
                  <code-chip v-for="code in item.codes"
                             :key="code"
                             :category="codes[codeID2Idx[code]].category"
                             :color="$color.getMedium(codeCats.indexOf(codes[codeID2Idx[code]].category))"
                             :active="false">
                    {{ codes[codeID2Idx[code]].label }}
                  </code-chip>
                </div>
                <div class="sentiment" v-if="showColumnInternal === 'sentiment'" style="text-align: right">
                  {{ item.sentiment | round(1) }}
                </div>
                <div class="reviewed" v-if="showColumnInternal === 'reviewed'">
                  <v-checkbox v-model="item.reviewed"
                              hide-details
                              disabled />
                </div>
                <div class="changed" v-if="showColumnInternal === 'changed'">
                  <v-checkbox v-model="item.changed"
                              hide-details
                              disabled />
                </div>

                <div v-for="(c, idx) in item.auxiliary_columns" :key="idx" v-if="showColumnInternal === idx">
                  {{ c }}
                </div>
              </div>
              <div class="divider" :class="{ last: answersFiltered.length === (index + 1) }" />
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </div>
    </v-card-text>
  </div>

</template>

<script>

import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import answerFilters from '@/mixins/answerFilters'

export default {
  codit: true,
  name: 'VerbatimBrowser',

  components: {
    'DynamicScroller': DynamicScroller,
    'DynamicScrollerItem': DynamicScrollerItem
  },

  mixins: [answerFilters],

  props: {
    height: { type: [Number], default: 200 },
    renderDelay: { type: [Number], default: 30 },
    answers: { type: Array, default: () => [] },
    filters: { type: Array, default: () => [] },
    codes: { type: Array, default: () => [] },
    maxVerbatimChars: { type: Number, default: 80 },
    showColumn: { type: [String, Number], default: '' },
    showColumnOptions: { type: Array, default: () => [] },
    displayCount: { type: Boolean, default: true },
    displayColumnSelect: { type: Boolean, default: true }
  },

  data () {
    return {
      ready: false,
      showColumnInternal: ''
    }
  },

  computed: {
    answersFiltered () {
      return this.filterAnswers(this.filters, this.answers)
    },

    codesByCat () { return _.groupBy(this.codes, 'category') },

    codeCats () { return _.keys(this.codesByCat) },

    codeID2Idx () {
      let mapping = {}
      this.codes.forEach((c, idx) => { mapping[c.id] = idx })
      return mapping
    }
  },

  watch: {
    showColumn: {
      immediate: true,
      handler () { this.showColumnInternal = this.showColumn }
    },

    showColumnInternal (newVal, oldVal) {
      if (newVal === oldVal) return
      this.updateScrollerNextTick()
      this.$emit('set-show-column', newVal)
    }
  },

  mounted () {
    // After mounting, wait half a sec before displaying the browser
    // This should be enough to also handle the case that we are in a dialog
    setTimeout(this.init, this.renderDelay)
  },

  methods: {
    init () {
      this.updateScrollerNextTick()
      this.ready = true
    },

    updateScrollerNextTick () {
      this.$nextTick(() => { if (this.$refs.scroller) this.$refs.scroller.forceUpdate() })
    }
  }
}

</script>

<style lang=scss>

.verbatim-browser {
  .v-card__title {
    .v-input {
      margin-top: -6px;
    }
  }
  .verbatim-browser-container {
    overflow: hidden;
    position: relative;
    background: $col-ans-bg;
    border-radius: 4px;
  }
  .scroller {
    height: 100%;

    .row {
      margin: 0;
      color: #777;

      .frame {
        &:hover {
          background: $col-ans-focus-bg;
          color: $col-ans-focus-txt;
        }

        min-height: 48px;
        border-radius: 4px;
        width: 100%;
        padding: 8px 16px;
        display: flex;
        box-sizing: border-box;
        align-items: center;

        .text {
          flex: 1 0 40%;

          .read-more-wrap {
            .state, .target { display: none }
            .state:checked ~ .target { display: inline; }
            .state:checked ~ .dotdot { display: none; }
            .state ~ .trigger-less { display: none }
            .state:checked ~ .trigger-more { display: none }
            .state:checked ~ .trigger-less { display: inline-block }
            .trigger {
            cursor: pointer;
            display: inline-block;
            padding: 0 .5em;
            color: var(--v-primary-base);
            font-size: .9em;
            line-height: 2;
            border: 1px solid #ddd;
            border-radius: .25em;
            }
          }
        }

        .codes {
          margin-left: 12px;
          flex: 1;
        }

        .v-input { margin: 0 }
      }

      .divider {
        position: relative;
        z-index: 10000000;
        width: 40px;
        margin: 3px auto;
        border-width: 6px 0 0 0;
        border-style: dotted;
        border-color: #777;
        &.last {
          border-style: solid;
        }
      }
    }
  }
}

</style>

<i18n src='@/i18n/pages/ChartEditor.json'></i18n>
