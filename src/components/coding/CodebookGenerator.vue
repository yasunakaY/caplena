<template>
  <div id="codebook-generator" @keydown.esc.stop tabindex="0">
    <!-- ===== Popup for creating code from keyword ===== -->
    <transition name="k2c-anim">
      <div class="keyword-2-code"
           v-show="keywords.k2c.show"
           ref="keyword-2-code"
           @keydown.esc="closeK2C"
           tabindex="1"
           :style=" { left: `${keywords.k2c.pos.left - 330}px`, top: `${keywords.k2c.pos.top - 97}px` }">

        <div class="arrow" ref="k2c-arrow" />
        <div class="content" v-c-click-outside="closeK2C" @click.stop>
          <alert type="warning" v-if="maxCodesReached" style="margin: 0">
            <span v-html="$t('keywords.max_codes_reached', { allowed: MAX_CODES_PER_SURVEY })"/>
          </alert>
          <template v-else>
            <v-text-field v-model="keywords.k2c.label"
                          dark
                          lazy
                          color="white"
                          counter
                          maxlength="50"
                          :error-messages="keywords.k2c.labelInvalid"
                          :label="$t('keywords.k2c.label')" />

            <v-combobox v-model="keywords.k2c.category"
                        class="category-autocomplete"
                        allow-overflow
                        dark
                        menu-props="auto"
                        maxlength="50"
                        color="white"
                        :items="codeCats"
                        :label="$t('keywords.k2c.category')"
                        :error-messages="keywords.k2c.categoryInvalid"
                        ref="newOrModifyCodeCategory"
                        @change="keywordCatChange"
                        @input.native="keywordCatInput"
                        @keydown.native.enter.stop />

            <div style="display: flex">
              <v-spacer />
              <v-btn @click="saveK2C" style="margin: 0">{{ $t('keywords.k2c.create') }}</v-btn>
            </div>
          </template>
        </div>

      </div>
    </transition>

    <v-stepper v-model="step" class="elevation-0" style="border-radius: 0">
      <v-toolbar dark color="primary" tile>
        <v-btn icon dark @click.native="$emit('close', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ $t('title') }}</v-toolbar-title>
        <v-stepper-step style="margin-left: 100px" :complete="step > 1" :step="1">{{ $t('intro.step') }}</v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 2" :step="2">{{ $t('templates.step') }}</v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 3" :step="3">{{ $t('keywords.step') }}</v-stepper-step>
        <v-divider />
        <v-stepper-step :step="4" style="margin-right: 250px">{{ $t('completed.step') }}</v-stepper-step>
      </v-toolbar>

      <v-stepper-items theme="light">

        <!-- ===== Step: INTRO ===== -->
        <v-stepper-content :step="1" :dark="false">
          <div class="intro-badge">
            <v-hover close-delay="0">
              <div :style="{ background: $color.soft.green }"
                   :class="{ [`elevation-${hover ? 5 : 2}`]: true }"
                   @click="step = 2"
                   slot-scope="{ hover }">
                <v-icon size="160"
                        :style="{ color: `${(hover ? $color.strong.green : $color.medium.green)}!important` }">mdi-gesture-tap</v-icon>
                <div class="badge-text">
                  <div class="display-1" :style="{ color: $color.strong.green }">{{ $t('intro.hero') }}</div>
                  <p class="title grey--text" style="text-transform: uppercase;">{{ $t('intro.subtitle') }}</p>
                </div>
                <v-icon size="100"
                        color="grey"
                        style="margin-top: 30px"
                        :style="{ color: `${(hover ? $color.strong.green : $color.medium.green)}!important` }">
                  mdi-chevron-right
                </v-icon>
              </div>
            </v-hover>
          </div>
        </v-stepper-content>

        <!-- ===== STEP: TEMPLATES ===== -->
        <v-stepper-content :step="2">
          <alert type="error" v-if="templates.loadingFailed">{{ $t('templates.loading_failed') }}</alert>
          <div v-else style="display: flex; flex-flow: row">

            <div class="codebook-container" :class="{ selected: templates.codebookIdxSelected !== null }"
                 :style="{ 'height': (templates.codebookIdxSelected !== null ? `${contentMaxHeight}px` : 'auto') }">

              <div class="codebook-library"
                   :style="{ 'height': (templates.codebookIdxSelected === null ? `${contentMaxHeight + 16}px` : 'auto') }">

                <v-select :items="templateLanguageOptions"
                          :label="$t('templates.language_select')"
                          v-if="templates.codebookIdxSelected === null && step === 2"
                          v-model="templates.language"
                          hide-details
                          class="template-languages"
                          outlined />
                <!--
                          double v-if condition is strange hack to make label render correctly.
                            See also https://github.com/vuetifyjs/vuetify/issues/7470
                          -->

                <v-card v-for="(cb, idx) in templatesFiltered"
                        v-if="templates.codebookIdxSelected === null || templates.codebookIdxSelected === idx"
                        :key="idx"
                        class="codebook-option"
                        :class="{ primary: templates.codebookIdxSelected === idx, 'selected': templates.codebookIdxSelected === idx }"
                        @click="templates.codebookIdxSelected = idx"
                        @mouseover="step2Ready ? templates.codebookIdxHover = idx : null"
                        @mouseleave="templates.codebookIdxHover = null"
                        :dark="templates.codebookIdxSelected === idx">
                  <v-card-text>
                    <div>
                      <div class="headline"><v-icon>{{ cb.icon }}</v-icon> {{ cb.name }}</div>
                      <span>{{ cb.description }}.</span>
                      <v-btn v-if="templates.codebookIdxSelected !== null"
                             absolute
                             dark
                             small
                             fab
                             bottom
                             right
                             color="error"
                             @click.stop="templates.codebookIdxSelected = null">
                      <v-icon>mdi-close</v-icon></v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
              <div class="codes-list"
                   ref="templates-codes-list"
                   :style="{ 'height': (templates.codebookIdxSelected === null ? `${contentMaxHeight}px` : 'auto') }">
                <v-data-table :items="codes"
                              :headers="codesListHeaders.slice(0, 2)"
                              item-key="id"
                              :items-per-page="1000"
                              hide-default-footer
                              class="code-tbl">
                  <template slot="item" slot-scope="props">
                    <tr>
                      <td>
                        {{ props.item.label }}
                      </td>
                      <td :style="{ background: $color.getSoft(codeCat2CatIdx[props.item.category]) }">
                        {{ props.item.category }}
                      </td>
                    </tr>
                  </template>

                  <empty-state slot="no-data"
                               icon="mdi-library-books"
                               :label="$t('templates.select_codebook.title')"
                               :description="$t('templates.select_codebook.subtitle')" />
                </v-data-table>

              </div>
            </div>

            <div style="width: auto; flex: 1; overflow: hidden">
              <coded-sample v-if="templates.codebookIdxSelected !== null"
                            :loading="inference.loading"
                            :failed="inference.failed"
                            :warning="codedSampleWarning"
                            :answers="inference.answers"
                            :max-height="contentMaxHeight"
                            :codes="codes"
                            @get-sample="getCodedSample" />

            </div>
          </div>
        </v-stepper-content>

        <!-- ===== STEP: KEYWORDS ===== -->
        <v-stepper-content :step="3">

          <template v-if="keywords.failed">
            <alert type="error">{{ $t('keywords.loading_failed') }}</alert>
            <v-btn color="accent" @click="getKeywords">{{ $t('actions.retry') }}</v-btn>
          </template>
          <loading v-else-if="keywords.loading"
                   :is-loading="true"
                   :title="$t('keywords.loading')"
                   style="" />
          <div v-else style="display: flex; flex-flow: row">

            <div class="codebook-container selected" :style="{ 'height': `${contentMaxHeight}px` }">

              <!-- ===== Editable codes list ===== -->
              <div class="codebook-library">
                <v-data-table :items="codes"
                              :headers="codesListHeaders"
                              item-key="id"
                              :items-per-page="1000"
                              hide-default-footer
                              loading
                              class="code-tbl">
                  <div slot="progress"
                       class="new-code"
                       :class="{ show: !inference.loading }">

                    <alert type="warning" v-if="maxCodesReached">
                      <span v-html="$t('keywords.max_codes_reached', { allowed: MAX_CODES_PER_SURVEY })"/>
                    </alert>
                    <v-btn depressed small @click="newCode" v-else>
                      <v-icon color="grey">mdi-plus</v-icon>
                    </v-btn>
                  </div>
                  <template slot="item" slot-scope="props">
                    <tr>
                      <td>
                        <v-edit-dialog v-if="!inference.loading"
                                       :save-text="$t('save.title')"
                                       :cancel-text="$t('cancel')"
                                       large
                                       @save="saveInlineCodeEdit(props.item, 'label')"
                                       @open="keywords.inlineInput = props.item.label">
                          {{ props.item.label }}
                          <template v-slot:input>
                            <v-text-field v-model="keywords.inlineInput"
                                          maxlength="50"
                                          class="cb-inline-edit"
                                          single-line
                                          counter
                                          large
                                          autofocus />
                          </template>
                        </v-edit-dialog>
                        <template v-else>{{ props.item.label }}</template>
                      </td>
                      <td :style="{ background: $color.getSoft(codeCat2CatIdx[props.item.category]) }">
                        <v-edit-dialog v-if="!inference.loading"
                                       :save-text="$t('save.title')"
                                       :cancel-text="$t('cancel')"
                                       large
                                       @save="saveInlineCodeEdit(props.item, 'category')"
                                       @open="keywords.inlineInput = props.item.category">
                          {{ props.item.category }}
                          <template v-slot:input>
                            <v-text-field v-model="keywords.inlineInput"
                                          maxlength="50"
                                          class="cb-inline-edit category"
                                          @change="keywords.inlineInput = keywords.inlineInput.toUpperCase()"
                                          single-line
                                          autofocus
                                          counter />
                          </template>
                        </v-edit-dialog>
                        <template v-else>
                          {{ props.item.category }}
                        </template>
                      </td>
                      <td class="justify-center layout px-0" v-if="!inference.loading">
                        <v-icon small @click="removeCode(props.item.id)" class="delete">
                          mdi-delete
                        </v-icon>
                      </td>
                    </tr>
                  </template>

                  <empty-state slot="loading"
                               icon="mdi-library-books"
                               :label="$t('keywords.empty_codebook.title')"
                               :description="$t('keywords.empty_codebook.subtitle')" />
                </v-data-table>
              </div>

            </div>

            <!-- ===== Keywords result tabs ===== -->
            <v-tabs class="keywords-tabs" v-model="keywords.tab" ref="keywordsTab" style="flex: 1">
              <v-tab>{{ $t('keywords.tab_list') }}</v-tab>
              <v-tab>{{ $t('keywords.tab_wordcloud') }}</v-tab>
              <v-tab>{{ $t('keywords.tab_sample') }}</v-tab>

              <!-- ===== List ===== -->
              <v-tab-item>
                <div :style="{ 'max-height': `${contentMaxHeight - 20}px` }" style="overflow-y: scroll">

                  <div v-for="(cluster, clusterIdx) in keywords.clusters" :key="clusterIdx" class="list-cluster">
                    <v-divider v-if="clusterIdx !== 0" />
                    <ul>
                      <li v-for="(keyword, keywordIdx) in cluster.keywords"
                          :key="`${clusterIdx}_${keywordIdx}`"
                          @click.stop="openAndPositionK2C(clusterIdx, keyword.keyword, $event)">
                        <span class="text">{{ keyword.keyword }}</span>
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on }">
                            <v-progress-linear :value="100 * keyword.cnt / maxClusterMaxCnt"
                                               :color="$color.getMedium(clusterIdx)"
                                               v-on="on" />
                          </template>
                          {{ $tc('keywords.keyword_cnt', keyword.cnt, { cnt: keyword.cnt } ) }}
                        </v-tooltip>
                      </li>
                    </ul>
                  </div>
                </div>
              </v-tab-item>

              <!-- ===== Wordclouds ===== -->
              <v-tab-item>
                <div class="wordclouds"
                     :style="{ 'max-height': `${contentMaxHeight - 20}px` }">

                  <div v-for="(options, idx) in wordCloudOptions"
                       class="cluster"
                       :style="{ width: `${options.width}%`, 'padding-top': `${options.width}%` }"
                       :key="idx">
                    <v-chart ref="chart"
                             :options="options"
                             @click="chartClick(idx, $event)"
                             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
                             autoresize />
                  </div>
                </div>
              </v-tab-item>

              <!-- ===== Coded sample ===== -->
              <v-tab-item>
                <div :style="{ 'max-height': `${contentMaxHeight - 20}px` }">
                  <coded-sample :loading="inference.loading"
                                :failed="inference.failed"
                                :warning="codedSampleWarning"
                                :answers="inference.answers"
                                :max-height="contentMaxHeight"
                                :codes="codes"
                                style="margin-top: 8px;"
                                @get-sample="getCodedSample" />
                </div>
              </v-tab-item>
            </v-tabs>
          </div>

        </v-stepper-content>

        <!-- ===== Step: DONE ===== -->
        <v-stepper-content :step="4">

          <div class="completed">
            <alert type="success">{{ $t('completed.title') }}</alert>

            <div class="headline next-steps">{{ $t('completed.next_steps') }}</div>
            <v-timeline>
              <v-timeline-item :color="$color.medium.red" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">1</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_refine.title')" />
                    <span v-html="$t('completed.step_refine.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>

              <v-timeline-item :color="$color.medium.green" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">2</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_review.title')" />
                    <span v-html="$t('completed.step_review.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>

              <v-timeline-item :color="$color.medium.purple" fab>
                <span slot="opposite" class="title font-weight-bold grey--text">3</span>
                <v-card class="elevation-2">
                  <v-card-text>
                    <div class="title" v-html="$t('completed.step_done.title')" />
                    <span v-html="$t('completed.step_done.description')" />
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </div>

        </v-stepper-content>

      </v-stepper-items>

      <div style="position: fixed; bottom: 8px; left: 16px; right: 16px">
        <alert type="info" closeable style="margin: 0px 80px 10px 0" v-if="step === 2 || step === 3">
          <span v-html="$t(`${step === 2 ? 'templates' : 'keywords'}.info`)" />
        </alert>

        <v-btn color="primary" @click="step += 1" v-if="step < 3">
          {{ $t('next') }}
        </v-btn>

        <v-btn color="primary"
               :disabled="codes.length === 0 || inference.loading"
               @click="saveResults" v-if="step == 3">
          {{ $t('save.title') }}
        </v-btn>

        <v-btn outlined @click="$emit('close', false)">
          {{ (step &lt; 4 ? $t('cancel' ) : $t('close' )) }}
        </v-btn>

        |

        <v-btn color="accent" v-if="step === 3" :disabled="!cbIsDirty || !codes.length" @click="getCodedSample(); keywords.tab = 2">
          {{ $t('coded_sample.update_sample') }}
        </v-btn>
      </div>

    </v-stepper>
  </div>
</template>

<script>
import Vuex from 'vuex'

import ECharts from 'vue-echarts'
import 'echarts-wordcloud'

import CodedSample from '@/components/coding/CodedSample'
import JamesMixin from '@/mixins/james'

import { MAX_CODES_PER_SURVEY } from '@/settings/coding.js'
import { MIN_CODE_LABEL_LEN, MIN_CODE_CATEGORY_LEN } from '@/settings/constants.js'
import { easeInAtStartThenLinear } from '@/VuetifyExtensions'
import codeUtils from '@/mixins/codeUtils'

const ANSWER_SAMPLE_SIZE = 100

export default {
  codit: true,
  name: 'CodebookGenerator',

  components: {
    'v-chart': ECharts,
    'CodedSample': CodedSample
  },
  mixins: [JamesMixin, codeUtils],
  data () {
    return {
      step: 1,
      step2Ready: false,
      contentMaxHeight: 100,

      customCodebook: [],
      cbIsDirty: false,
      cbHasBeenCustomized: false,

      templates: {
        language: '',

        codebookIdxSelected: null,
        codebookIdxHover: null,
        codebookLibrary: [],

        hoverScrollTimeout: null,

        loadingFailed: false
      },

      keywords: {
        tab: -1,
        inlineInput: '',
        clusters: [],
        failed: false,
        loading: true,

        wordCloudFontSizes: {
          min: 12,
          max: 34
        },

        k2c: {
          show: false,
          clusterIdx: -1,
          label: '',
          category: '',
          categoryShadow: '',
          labelInvalid: '',
          categoryInvalid: '',
          categoryCacheByCluster: {},
          pos: { top: 0, left: 0 }
        }
      },

      inference: {
        loading: false,
        failed: false,
        answers: [],
        result: [],
        nCodes: 0
      },

      codesListHeaders: [
        { text: this.$t('codes.label'), value: 'label', sortable: false },
        { text: this.$t('codes.category'), value: 'category', sortable: false },
        { text: '', value: null, sortable: false }
      ]
    }
  },

  computed: {
    /**
     * Returns the currently active codebook: On template hover the template, otherwise the copied version of selected template
     * @return {Array} list of codes
     */
    codes () {
      if (this.templates.codebookIdxHover !== null && this.templates.codebookIdxSelected === null) {
        return this.templatesFiltered[this.templates.codebookIdxHover].codebook
      }
      return this.customCodebook
    },

    /**
     * The templates which match the current filters
     * @return {Array} List of codebook templates
     */
    templatesFiltered () {
      return _.filter(this.templates.codebookLibrary, { language: this.templates.language })
    },

    /**
     * The maximum of all code IDs in copied codebook
     * @return {Number}
     */
    maxCodeID () {
      return this.customCodebook.length ? _.maxBy(this.customCodebook, 'id').id : 10
    },

    /**
     * The global minimum of keyword counts over all clusters
     * @return {Number}
     */
    minClusterMinCnt () {
      return _.minBy(this.keywords.clusters, 'minCnt').minCnt
    },

    /**
     * The global maximum of keyword counts over all clusters
     * @return {Number}
     */
    maxClusterMaxCnt () {
      return _.maxBy(this.keywords.clusters, 'maxCnt').maxCnt
    },

    wordCloudFontStep () {
      let diff = Math.max(this.maxClusterMaxCnt - this.minClusterMinCnt, 1)
      return (this.keywords.wordCloudFontSizes.max - this.keywords.wordCloudFontSizes.min) / diff
    },

    /**
     * The languages available in the list of templates
     * @return {Array} List of iso language codes
     */
    templateLanguageOptions () {
      return _.map(_.uniq(_.map(this.templates.codebookLibrary, 'language')), v => ({ value: v, text: this.$t(`language.${v}`) }))
    },

    /**
     * Array of chart options for the cluster word-clouds
     * @return {Array}
     */
    wordCloudOptions () {
      return this.keywords.clusters.map((cluster, clusterIdx) => ({
        // The width prop is needed to set the width of the divs
        width: cluster.width * 100,
        series: [{
          type: 'wordCloud',

          // The shape of the "cloud" to draw. Can be any polar equation represented as a
          // callback function, or a keyword present. Available presents are circle (default),
          // cardioid (apple or heart shape curve, the most known polar equation), diamond (
          // alias of square), triangle-forward, triangle, (alias of triangle-upright, pentagon, and star.
          shape: 'circle',

          // A silhouette image which the white area will be excluded from drawing texts.
          // The shape option will continue to apply as the shape of the cloud to grow.

          // maskImage: maskImage,

          // Folllowing left/top/width/height/right/bottom are used for positioning the word cloud
          // Default to be put in the center and has 75% x 80% size.
          left: 'center',
          top: 'center',
          width: '90%',
          height: '80%',
          right: null,
          bottom: null,

          // Text size range which the value in data will be mapped to.
          // We need to set min/max for every cluster to make sure the sizes are consistent over the clusters
          sizeRange: [
            this.keywords.wordCloudFontSizes.min + (cluster.minCnt - this.minClusterMinCnt) * this.wordCloudFontStep,
            this.keywords.wordCloudFontSizes.min + (cluster.maxCnt - this.minClusterMinCnt) * this.wordCloudFontStep
          ],

          // Text rotation range and step in degree. Text will be rotated randomly in range [-45, 45] by rotationStep 45
          rotationRange: [-45, 45],
          rotationStep: 45,

          // size of the grid in pixels for marking the availability of the canvas
          // the larger the grid size, the bigger the gap between words.
          gridSize: 8,

          // set to true to allow word being draw partly outside of the canvas.
          // Allow word bigger than the size of the canvas to be drawn
          drawOutOfBound: true,

          // Global text style
          textStyle: {
            normal: {
              color: this.$color.getStrong(clusterIdx)
            },
            emphasis: {
              color: '#666'
            }
          },

          // Data is an array. Each array item must have name and value property.
          data: cluster.keywords.map(({ keyword, cnt }) => ({
            name: keyword,
            value: cnt
          }))
        }]
      }))
    },

    codedSampleWarning () {
      if (this.step === 3) {
        if (!this.cbHasBeenCustomized) return this.$t('coded_sample.not_customized')
        if (!this.codes.length) return this.$t('coded_sample.empty_codebook')
        if (this.cbIsDirty) return this.$t('coded_sample.is_dirty')
      }
      if (!this.inference.nCodes) return this.$t('coded_sample.no_matches')
    },

    maxCodesReached () {
      return this.codes.length >= MAX_CODES_PER_SURVEY
    },

    MAX_CODES_PER_SURVEY: {
      cache: false,
      get: () => MAX_CODES_PER_SURVEY
    },

    ...Vuex.mapState({
      user: state => state.user,
      question: state => state.coding.question,
      answers: state => state.coding.answers
    })
  },

  watch: {
    'templates.codebookIdxSelected' (val) {
      // When a codebook is selected, copy it to our codes list
      if (val !== null) {
        this.$set(this, 'customCodebook', _.clone(this.templatesFiltered[val].codebook))
        this.inference.loading = true
        this.$nextTick(this.getCodedSample)
      // If it is deselected remove the inference results and the codebook
      } else {
        this.inference.answers.splice(0)
        this.customCodebook.splice(0)
      }
    },

    'keywords.k2c.categoryShadow' (val) {
      // Reset the potential error messages
      this.keywords.k2c.categoryInvalid = ''
    },

    'keywords.k2c.label' (val) {
      // Reset the potential error messages
      this.keywords.k2c.labelInvalid = ''
    },

    'templates.codebookIdxHover' (newVal, oldVal) {
      if (newVal === oldVal) return
      clearTimeout(this.templates.hoverScrollTimeout)
      // Try resetting the current div, doesn't help much though if the animation is still running
      this.$nextTick(() => { this.$refs['templates-codes-list'].scrollTop = 0 })

      // Start scrolling through codebook
      this.templates.hoverScrollTimeout = setTimeout(() => {
        let el = this.$refs['templates-codes-list']
        let elHeight = el.scrollHeight
        this.$vuetify.goTo(elHeight, {
          duration: elHeight * 10,
          easing: easeInAtStartThenLinear,
          container: el
        })
      }, 500)
    },

    step (val) {
      if (val === 2) setTimeout(() => { this.step2Ready = true }, 750)
      else this.step2Ready = false
      if (val === 3) {
        // Hack to make tabs highlight correct tab
        setTimeout(() => { this.keywords.tab = 0 }, 750)
      }
    },

    cbIsDirty (val) {
      if (val) this.cbHasBeenCustomized = true
    }
  },

  created () {
    // Load the codebook templates
    api.get('/api/codebook-templates').then((res) => {
      if (!Array.isArray(res.data)) throw Error('Invalid return data')
      this.$set(this.templates, 'codebookLibrary', res.data)
      // Set the default codebook language: The question language
      // if available in the templates, English otherwise
      let hasQuestionLanguageCodebooks = !!_.find(this.templateLanguageOptions, { value: this.question.language })
      this.templates.language = hasQuestionLanguageCodebooks ? this.question.language : 'en'
    }).catch(err => {
      this.templates.loadingFailed = true
      this.$maybeRaiseAPIPromiseErr(err)
    })
    this.getKeywords()
  },

  mounted () {
    this.contentMaxHeight = Math.max(window.innerHeight - 150, 400)
  },

  methods: {
    /**
     * Run a sample of the answers through generic inference, to see how it would be coded
     */
    getCodedSample () {
      this.cbIsDirty = false
      this.inference.loading = true
      this.inference.failed = false

      let answers
      if (this.question.smart_sort) answers = _.sortBy(this.answers, 'idx_sorted')
      else answers = this.answers

      let answerSample = answers.slice(0, ANSWER_SAMPLE_SIZE)

      return api.post('/api/generic-inference', { answers: answerSample, codebook: this.codes }).then((res) => {
        if (!Array.isArray(res.data)) throw Error('Invalid return data')
        // Sum up the number of codes, to check if there is any assigned code at all
        this.inference.nCodes = _.sumBy(res.data, a => a.codes.length)
        this.$set(this.inference, 'answers', _.map(answerSample, (s, idx) => ({ ...s, codes: res.data[idx].codes })))
        this.inference.result = res.data

        this.inference.loading = false
      }).catch(err => {
        this.inference.failed = true
        this.inference.loading = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    /**
     * Get the keywords for the current question
     */
    getKeywords () {
      this.keywords.loading = true
      this.keywords.failed = false

      // Load the keywords
      return api.get(`/api/questions/${this.question.id}/keywords`).then((res) => {
        if (!Array.isArray(res.data.clusters)) throw Error('Invalid return data')
        this.preprocessKeywords(res.data.clusters)
        this.keywords.loading = false
      }).catch(err => {
        this.keywords.failed = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    /**
     * Does preprocessing (sorting, adding count properties) of computed keyword clusters. Sets result.
     * @param  {Array} clusters List of clusters
     */
    preprocessKeywords (clusters) {
      const LARGEST_CLUSTER_WIDTH = 0.4
      const MIN_CLUSTER_WIDTH = 0.15 // the minimum width a cluster word-cloud occupies
      // Add count properties to every cluster
      clusters.forEach((cluster, clusterIdx) => {
        // Sort the keywords within the cluster by their count
        cluster.keywords = _.orderBy(cluster.keywords, 'cnt', 'desc')
        cluster.sumCnt = _.sumBy(cluster.keywords, 'cnt')
        cluster.maxCnt = _.maxBy(cluster.keywords, 'cnt').cnt
        cluster.minCnt = _.minBy(cluster.keywords, 'cnt').cnt
      })

      // Sort the clusters by their sum
      clusters = _.orderBy(clusters, 'sumCnt', 'desc')

      // The largest cluster gets a fixed width, the rest gets scaled accordingly
      let maxCnt = clusters[0].sumCnt
      const getWidth = cluster => {
        // The *area* should be correlate with the weight, we make the approximation that
        // the word clouds are squares
        let width = Math.sqrt(Math.pow(LARGEST_CLUSTER_WIDTH, 2) * cluster.sumCnt / maxCnt)
        // Round to 5% intervals and make sure no cloud is below a certain threshold
        return Math.max(Math.round(width * 20) / 20, MIN_CLUSTER_WIDTH)
      }

      clusters.forEach(cluster => {
        // The width can only be set after we have ordered the clusters by size (we need the maximum)
        cluster.width = getWidth(cluster)
      })

      let currIdx = 1
      let currWidth = MIN_CLUSTER_WIDTH
      // Go through the list of clusters
      while (currIdx < clusters.length) {
        // If the current cluster would go over 100% width
        // Try finding another cluster that still fits on the current row
        if ((currWidth + clusters[currIdx].width) > 1) {
          let tryToFitIdx = currIdx + 1
          while (tryToFitIdx < clusters.length) {
            // if we have found such a cluster, switch places with the one that would go over 100%
            if ((currWidth + clusters[tryToFitIdx].width) <= 1) {
              let oldEarly = clusters[currIdx]
              clusters[currIdx] = clusters[tryToFitIdx]
              clusters[tryToFitIdx] = oldEarly
              break
            }
            tryToFitIdx += 1
          }
        }
        // Once we have determined which cluster should be at current position
        // compute the new width
        // Case 1) We didn't finy any cluster which still fits, so the current cluster starts a new row
        if ((currWidth + clusters[currIdx].width) > 1) currWidth = clusters[currIdx].width
        // Case 2) It is not over 100%, we add it to the current width
        else currWidth += clusters[currIdx].width
        currIdx += 1
      }

      this.$set(this.keywords, 'clusters', clusters)
    },

    /**
     * Remove the given code by ID
     * @param  {Number} codeID
     */
    removeCode (codeID) {
      // Remove code from all coded samples
      this.inference.answers.forEach(s => _.remove(s.codes, c => c === codeID))
      this.customCodebook.splice(_.findIndex(this.customCodebook, { id: codeID }), 1)
    },

    /**
     * Create new code (with default label and category)
     */
    newCode () {
      this.customCodebook.splice(0, 0, {
        id: this.maxCodeID + 1,
        label: `[${this.$t('keywords.new_code.label')}]`,
        category: `[${this.$t('keywords.new_code.category')}]`
      })
      this.cbIsDirty = true
    },

    /**
     * Handles save event from inline codebook editing
     * @param  {object} code object from codebook array (will be modified)
     * @param  {string} prop which property is modified
     */
    saveInlineCodeEdit (code, prop) {
      // Only save the code if it has at least 2 characters
      let propMinLen = { label: MIN_CODE_LABEL_LEN, category: MIN_CODE_CATEGORY_LEN }[prop]
      if (this.keywords.inlineInput.length >= propMinLen) {
        code[prop] = this.keywords.inlineInput
        this.cbIsDirty = true
      }
    },

    saveResults () {
      this.step = 4
      let saveFn = () => {
        // Deal with already reviewed
        // Deal with small sizes
        // Request predictions
        this.$store.commit('setCodes', this.codes)
        if (!this.inference.failed) this.$store.dispatch('setAnswersCodesIfNotReviewed', this.inference.result)
        // We need to make sure the predictions are only requested *after* the codes have been saved
        // But as getting callback would be cumbersome with emits etc., we just wait 10s
        // which should be enough also for the slowest connection
        if (this.inference.failed || this.answers.length > ANSWER_SAMPLE_SIZE) this.$emit('request-predictions-delayed')
        this.jamesSay('generator.applied', 'info', true)
      }

      if (this.cbIsDirty) this.getCodedSample().then(saveFn)
      else setTimeout(saveFn, 500)
    },

    closeK2C () {
      this.keywords.k2c.show = false
    },

    /**
     * Saves the code from the keyword-to-code popup
     */
    saveK2C () {
      // Combobox updates the model lazy, copy value from shadow variable to be sure its up to date
      this.keywords.k2c.category = this.keywords.k2c.categoryShadow.toUpperCase()
      // Check if inputs are valid
      if (this.keywords.k2c.label.length < MIN_CODE_LABEL_LEN) {
        this.keywords.k2c.labelInvalid = this.$t('keywords.k2c.label_invalid', { n_chars: MIN_CODE_LABEL_LEN })
        return
      }
      if (this.keywords.k2c.category.length < MIN_CODE_CATEGORY_LEN) {
        this.keywords.k2c.categoryInvalid = this.$t('keywords.k2c.category_invalid', { n_chars: MIN_CODE_LABEL_LEN })
        return
      }
      this.keywords.k2c.show = false
      // Insert new code at top of code list
      this.customCodebook.splice(0, 0, {
        id: this.maxCodeID + 1,
        label: this.keywords.k2c.label,
        category: this.keywords.k2c.category
      })

      this.cbIsDirty = true
      // Set the cache, so that the next time the k2c popup opens, we have a better guess of the category
      this.keywords.k2c.categoryCacheByCluster[this.keywords.k2c.clusterIdx] = this.keywords.k2c.category
    },

    /**
     * Open and position the keyword-to-code popup. Set reasonable intial values.
     * @param  {Number} clusterIdx  The keyword cluster the popup was called from
     * @param  {String} keyword     The keyword that is being converted to a code
     * @param  {Event} $mouseEvent  The mouse event that triggered this action (required for positioning popup)
     */
    openAndPositionK2C (clusterIdx, keyword, $mouseEvent) {
      this.keywords.k2c.label = keyword.substr(0, 50)
      this.keywords.k2c.pos.top = $mouseEvent.clientY
      this.keywords.k2c.pos.left = $mouseEvent.clientX
      this.keywords.k2c.clusterIdx = clusterIdx
      this.keywords.k2c.labelInvalid = ''
      this.keywords.k2c.categoryInvalid = ''

      // If a code was created from this cluster before, put in that category
      let cache = this.keywords.k2c.categoryCacheByCluster
      if (clusterIdx in cache) this.keywords.k2c.category = cache[clusterIdx]
      this.keywords.k2c.categoryShadow = this.keywords.k2c.category

      this.keywords.k2c.show = true
    },

    chartClick (clusterIdx, $evt) {
      if ($evt.componentType && $evt.componentType === 'series') {
        $evt.event.stop()
        this.openAndPositionK2C(clusterIdx, $evt.data.name, $evt.event.event)
      }
    },

    keywordCatChange ($event) { if ($event !== null) this.keywords.k2c.categoryShadow = $event },
    keywordCatInput ($event) { if ($event.srcElement.value !== null) this.keywords.k2c.categoryShadow = $event.srcElement.value }
  }
}

</script>

<style lang=scss>

@import '~css/coding-assistant';

$left-col-width: 500px;

.cb-inline-edit {
  font-size: smaller;
  padding: 8px 0;
  &.category input { text-transform: uppercase; }
}

.k2c-anim-enter-active {
  transition: all .3s ease-out;
}
.k2c-anim-leave-active {
  transition: all .3s ease-in;
}
.k2c-anim-enter {
  opacity: 0;
}
.k2c-anim-leave-to {
  opacity: 0;
}

#codebook-generator {
  position: relative;

  .template-languages {
    margin: 4px 0 12px;
    .v-select__slot {
      height: 53px;
    }
  }

  .codebook-container {
    display: flex;
    position: relative;
    flex-direction: row;
    transition: width 300ms ease-in-out;
    width: 100%;

    &.selected {
      width: $left-col-width;
      overflow-y: scroll;
    }

    .codebook-library {
      width: $left-col-width + 16px;
      padding: 16px;
      margin: -16px 0 0 -16px;
      overflow-y: scroll;
    }

    .codes-list {
      position: absolute;
      transition: all 300ms ease-in-out;
      left: $left-col-width + 16px;
      right: 16px;
      top: 0;
      overflow-y: scroll;
    }

    &.selected {
      .codes-list {
        left: 0;
        top: 110px;
      }
    }

    .code-tbl {
      .new-code {
        .v-btn {
          flex: 1;
          width: 100%;
          margin: 5px 0;
        }
        height: 0px;
        overflow-y: hidden;
        transition: height 0.25s;
        &.show {
          height: auto;
          min-height: 40px;
        }
      }

      td { height: 40px; }

      tr {
        .delete { display: none }
        &:hover .delete { display: inline-flex; }
      }
    }
  }

  .codebook-option {
    margin-bottom: 12px;
    box-shadow: 0 0.25rem 1rem rgba(48,55,66,.15);
    cursor: pointer;
    transition: all 0.25s;
    background: #EEE;
    border: 1px solid #dadee4;

    &:hover, &.selected {
      box-shadow: 0 0.25rem 1rem rgba(48,55,66,.3);
      background: #F5F5F5;
    }

    .headline {
      display: flex;
      align-items: center;

      .v-icon {
        margin-right: 12px;
      }
    }

    &.selected {
      color: #FFF;
      .v-icon { color: #FFF }
    }
  }

  .coded-samples {
    font-size: 14px;
    position: relative;
    overflow-y: scroll;
    list-style: none;
    border-radius: 2px;
    background: $col-ans-bg;
    padding: 0;

    li {
      padding: 0 16px;
      margin: 0;
      border-radius: 8px;

      &:hover {
        background: $col-ans-focus-bg;
      }

      .frame {
        border: 2px solid #DDD;
        border-width: 2px 0;
        width: 100%;
        padding: 8px 0;
        display: flex;
      }

      &:first-child .frame {
        border-top: none;
      }

      &:last-child .frame {
        border-bottom: none;
      }

      .text {
        display: inline-block;
        flex: 0 0 420px;
        margin: auto 0;
      }

      .codes {
        margin-left: 12px;
        flex: 1;
      }
    }
  }
  .wordclouds {
    width: auto;
    flex: 1;
    margin-top: 15px;
    overflow-x: hidden;
    overflow-y: scroll;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: space-evenly;

    .cluster {
      position: relative;
      height: 0;
      overflow: hidden;
      margin: auto 0;
      border-radius: 100%;
      background: #EEE;
    }

    &::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 7px;
    }
    &::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background-color: rgba(0,0,0,.5);
    }
  }

  .keyword-2-code {
    position: absolute;
    box-shadow: 0 0.25rem 1rem rgba(48,55,66,.3);
    border: 1px solid #FFF;
    color: #FFF;
    width: 300px;
    border-radius: 4px;
    z-index: 205;
    transition: all .3s ease-in-out;
    background: rgba(0, 0, 0, 0.7);

    .content {
      padding: 8px 16px;
      position: relative;
    }

    .arrow {
      position: absolute;
      top: 92px;
      z-index: 3;
      content: '';
      width:0;
      height: 0;
      border:6px solid transparent;
      margin-right: -13px;
      right: 0;
      border-left-color: rgba(0, 0, 0, 0.7);
    }
  }

  .list-cluster {
    padding: 0;
    margin: 41px 0 10px;
    font-size: 14px;

    ul {
      padding: 0;
      list-style: none;
      border-radius: 8px;
      background: $col-ans-bg;
      overflow: hidden;
    }

    .v-divider {
      width: 70px;
      margin: 18px auto;
      border-width: 6px 0 0 0;
      border-style: dotted;
      border-color: #777;
    }

    .v-subheader {
      height: auto;
      margin-top: 3px;
      margin-bottom: 16px;
    }

    li {
      padding: 3px 16px 2px;
      height: 41px;
      border-width: 0 0 1px 0;
      border-color: rgba(0,0,0,.12);
      border-style: solid;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;

      &:hover {
        .text {
          margin-left: 10px;
        }
        border-left: 3px solid rgba(0,0,0,.12);
        background: $col-ans-focus-bg;
      }

      .text {
        transition: margin .07s ease-out;
        flex: 0 0 auto;
        opacity: 0.75;
        font-weight: bold;
        word-break: break-word;
      }

      .v-progress-linear {
        flex: 0 0 50%;
        height: 7px!important;
      }

      &:last-child {
        border-bottom: none;
      }
    }
  }
}

</style>

<i18n src='@/i18n/components/CodebookGenerator.json'></i18n>
