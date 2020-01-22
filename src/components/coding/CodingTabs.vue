<template>
  <div v-if="loaded">
    <!-- <alert v-if="trainingCompletedETAOverdue" type="warning">{{ $t('coding.statistics.model.eta_overdue') }} </alert> -->

    <div style="display: flex">

      <v-card id="keyboardshortcuts" style="flex: 2 0 200px">
        <v-card-title>
          <div class="subtitle-1" style="margin-bottom: 14px">
            {{ $t('shortcuts.title') }}
          </div>
          <v-btn small fab @click="showKeyboardShortcuts=!showKeyboardShortcuts" absolute>
            <v-icon>{{ (showKeyboardShortcuts ? 'mdi-chevron-up' : 'mdi-chevron-down') }}</v-icon>
          </v-btn>

        </v-card-title>

        <v-card-text v-if="showKeyboardShortcuts">

          <v-divider />

          <div class="shortcut-container">
            <div class="shortcut-type" style="flex: 3">
              <div class="subtitle-2">{{ $t('shortcuts.overview_mode') }}</div>

              <div class="shortcut-content">
                <div class="key-name caption grey--text text--darken-2">
                  <span><span class="key">{{ $t('shortcuts.enter') }}</span></span>
                  <span><span class="key">{{ $t('shortcuts.arrow_up') }}</span></span>
                  <span><span class="key">{{ $t('shortcuts.arrow_down') }}</span></span>
                  <span><span class="key">{{ $t('shortcuts.tab') }}</span></span>
                  <span><span class="key">Shift</span> <span class="key">1</span></span>
                  <span><span class="key">Shift</span> <span class="key">2</span></span>
                </div>

                <div class="key-icon">
                  <v-icon color="primary">mdi-keyboard-return</v-icon>
                  <v-icon color="primary">mdi-chevron-up</v-icon>
                  <v-icon color="primary">mdi-chevron-down</v-icon>
                  <v-icon color="primary">mdi-keyboard-tab</v-icon>
                  <span>
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-numeric-1-box</v-icon>
                  </span>
                  <span>
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-numeric-2-box</v-icon>
                  </span>
                </div>

                <div class="key-description">
                  <div>
                    <div>{{ $t('shortcuts.open_codingview') }}</div>
                    <div>{{ $t('shortcuts.last_answer') }}</div>
                    <div>{{ $t('shortcuts.next_answer') }}</div>
                    <div>{{ $t('shortcuts.mark_answer') }}</div>
                    <div>{{ $t('shortcuts.sentiment_negative') }}</div>
                    <div>{{ $t('shortcuts.sentiment_positive') }}</div>
                  </div>
                </div>
              </div>

            </div>

            <div class="shortcut-type" style="flex: 4">
              <div class="subtitle-2">{{ $t('shortcuts.coding_mode') }}</div>

              <div class="shortcut-content">
                <div class="key-name caption grey--text text--darken-2">
                  <span><span class="key">Enter</span></span>
                  <span><span class="key">Shift</span> <span class="key">Enter</span></span>
                  <span><span class="key">{{ $t('shortcuts.arrow_left_right') }}</span></span>
                  <span>
                    <span class="key">Shift</span>
                    <span class="key">{{ $t('shortcuts.arrow_left_right') }}</span>
                  </span>
                  <span><span class="key">{{ $t('shortcuts.tab') }}</span></span>
                  <span><span class="key">Shift</span> <span class="key">1</span></span>
                  <span><span class="key">Shift</span> <span class="key">2</span></span>
                  <span><span class="key">{{ $t('shortcuts.escape') }}</span></span>
                </div>

                <div class="key-icon">
                  <v-icon color="primary">mdi-keyboard-return</v-icon>
                  <span>
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-keyboard-return</v-icon>
                  </span>

                  <span>
                    <v-icon color="primary">mdi-chevron-left</v-icon>
                    <v-icon color="primary">mdi-chevron-right</v-icon>
                  </span>
                  <span style="margin-top: 1px">
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-chevron-left</v-icon>
                    <v-icon color="primary">mdi-chevron-right</v-icon>
                  </span>
                  <v-icon color="primary">mdi-keyboard-tab</v-icon>
                  <span>
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-numeric-1-box</v-icon>
                  </span>
                  <span>
                    <v-icon color="primary">mdi-apple-keyboard-shift</v-icon>
                    <v-icon color="primary">mdi-numeric-2-box</v-icon>
                  </span>
                  <v-icon color="primary">mdi-close</v-icon>
                </div>

                <div class="key-description">
                  <div>
                    <div>{{ $t('shortcuts.coding_enter') }}</div>
                    <div>{{ $t('shortcuts.coding_shift_enter') }}</div>
                    <div>{{ $t('shortcuts.previous_next_code') }}</div>
                    <div>{{ $t('shortcuts.move_code') }}</div>
                    <div>{{ $t('shortcuts.mark_answer') }}</div>
                    <div>{{ $t('shortcuts.sentiment_negative') }}</div>
                    <div>{{ $t('shortcuts.sentiment_positive') }}</div>
                    <div>{{ $t('shortcuts.close_codingview') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

      </v-card>

      <!-- ====== Model summary ====== -->
      <v-card style="margin-left: 16px; cursor: pointer; display: flex; justify-content: center; flex: 0 0 410px"
              v-ripple @click.native="currentTab=3">
        <v-card-text style="margin: auto 0">
          <div class="grey--text" style="margin-top: -8px; margin-bottom: -7px; flex: 1">
            <span v-if="trainingCompletedETAText">
              <span v-html="trainingCompletedETAText" />
            </span>
            <span v-else-if="questionTrainingCompleted">
              <span v-html="$t('coding.statistics.summary', { when: lastTrainedText, score })" />
              <helptip position="top" :width="1050" x-offset="-500" style="vertical-align: bottom; margin-bottom: -2px">
                <div v-html="$t('coding.statistics.model.score_helptip', { href: 'https://en.wikipedia.org/wiki/F1_score' })"/>
              </helptip>
            </span>
            <span v-else-if="question.no_training">
              {{ $t('coding.statistics.number_reviewed') }}
              {{ stats.nreviewed }} / {{ question.nanswers }} ({{ reviewedPercentage }}%)
            </span>
            <!-- Model has never been trained and there aren't enough answers to make any predictions -->
            <span v-else-if="prevRetrainThresh === 0 && answers.length < nextRetrainThresh && question.inherits_from == null">
              {{ $t('coding.statistics.model.not_enough_answers ') }}
            </span>

            <template v-if="!trainingCompletedETAText && !question.no_training && nextRetrainThresh <= answers.length">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-progress-linear v-on="on" v-model="nextRetrainPercentage" color="success" style="margin-top: 8px; width: 100%" />
                </template>

                {{ $t('coding.statistics.tooltip_progress_towards_update') }}:
                {{ (stats.nreviewed_unique - prevRetrainThresh) }} / {{ nextRetrainThresh - prevRetrainThresh }}
                ({{ nextRetrainPercentage }}%)
              </v-tooltip>
              <div class="grey--text" style="margin-top: 5px">
                {{ $t('coding.statistics.text_progress_towards_update', { nreview: nextRetrainThresh - stats.nreviewed_unique }) }}
              </div>
            </template>
            <v-tooltip bottom v-else-if="!trainingCompletedETAText">
              <template v-slot:activator="{ on }">
                <v-progress-linear height="7" v-on="on" v-model="reviewedPercentage" color="info" style="margin-top: 8px; width: 100%" />
              </template>
              {{ $t('coding.statistics.number_reviewed') }}
              {{ stats.nreviewed }} / {{ question.nanswers }} ({{ reviewedPercentage }}%)
            </v-tooltip>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <div style="margin-top: 20px; min-height: 800px">
      <v-card>
        <v-card-text>
          <v-tabs v-model="currentTab">

            <v-tab key="codesList" id="codesList">{{ $t('coding.codes.edit') }}</v-tab>
            <v-tab key="frequencyGraph" id="frequencyGraph" :disabled="codes.length===0">{{ $t('coding.codes.graph') }}</v-tab>
            <v-tab key="scoreGraph" id="scoreGraph" :disabled="!questionTrainingCompleted">{{ $t('coding.codes.score') }}</v-tab>
            <v-tab key="stats" id="stats">{{ $t('coding.statistics.title') }}</v-tab>

            <v-tab-item>

              <template v-if="currentTab==0">
                <alert type="warning" v-if="codebookDirtySinceTrainingRequested && !question.no_training && nextRetrainThresh <= answers.length && questionTrainingCompleted">
                  <div>{{ $t('coding.codes.dirty_codebook_get_predictions.alert') }}</div>
                  <v-btn @click="$emit('request-predictions')">
                    {{ $t('coding.codes.dirty_codebook_get_predictions.btn') }}
                  </v-btn>
                </alert>

                <v-toolbar :color="codebookActionHighlighted !== null ? 'accent' : 'white'" flat>
                  <template v-if="editable && answers.length">
                    <v-tooltip v-if="isListQuestion"
                               bottom
                               :disabled="stateIsClean">
                      <template v-slot:activator="{ on }">
                        <div v-on="on">
                          <v-btn :disabled="!stateIsClean"
                                 id="list-autocoder-btn"
                                 outlined
                                 @click="showListAutocoder=true">
                            {{ $t('coding.codes.autocoder') }}
                          </v-btn>
                        </div>
                      </template>
                      <span v-html="$t('coding.codes.autocoder_disabled_helptip')" />
                    </v-tooltip>

                    <v-tooltip v-else bottom :disabled="stateIsClean">
                      <template v-slot:activator="{ on }">
                        <div v-on="on">
                          <v-btn :disabled="!stateIsClean"
                                 outlined
                                 @click="showCodebookGenerator=true">
                            {{ $t('coding.codes.generator') }}
                          </v-btn>
                        </div>
                      </template>
                      <span v-html="$t('coding.codes.generator_disabled_helptip')" />
                    </v-tooltip>

                    <v-btn v-if="!stateIsClean"
                           outlined
                           color="accent"
                           @click="resetQuestion.active = true"
                           style="margin-left: 12px">
                      {{ $t('coding.codes.reset_question.btn') }}
                    </v-btn>
                  </template>
                  <v-spacer />

                  <v-btn icon :disabled="codebookActionHighlighted !== 0 && (codesSelected.length>0 || !editable)"
                         @click="openRenameCategory">
                    <v-tooltip bottom :value="codebookActionHighlighted === 0">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"
                                :color="codebookActionHighlighted === 0 ? 'white' : 'default'">mdi-textbox</v-icon>
                      </template>
                      <span>{{ $t('coding.codes.tooltip_rename_category') }}</span>
                    </v-tooltip>
                  </v-btn>

                  <v-btn icon :disabled="codebookActionHighlighted !== 1 && (codesSelected.length<1 || !editable)"
                         @click="openMergeCodes">
                    <v-tooltip bottom :value="codebookActionHighlighted === 1">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"
                                :color="codebookActionHighlighted === 1 ? 'white' : 'default'">mdi-layers</v-icon>
                      </template>
                      <span>{{ $t('coding.codes.tooltip_merge') }}</span>
                    </v-tooltip>
                  </v-btn>

                  <v-btn icon :disabled="codebookActionHighlighted !== 2 && (codesSelected.length<1 || !editable)"
                         @click="openNewModifyCode(false)" >
                    <v-tooltip bottom :value="codebookActionHighlighted === 2">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"
                                :color="codebookActionHighlighted === 2 ? 'white' : 'default'">mdi-pencil</v-icon>
                      </template>
                      <span>{{ $t('coding.codes.tooltip_edit') }}</span>
                    </v-tooltip>
                  </v-btn>

                  <v-btn icon :disabled="codebookActionHighlighted !== 3 && (codesSelected.length < 1 || !editable)"
                         @click="openDeleteCode">
                    <v-tooltip bottom :value="codebookActionHighlighted === 3">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"
                                :color="codebookActionHighlighted === 3 ? 'white' : 'default'">mdi-delete</v-icon>
                      </template>
                      <span>{{ $t('coding.codes.tooltip_delete') }}</span>
                    </v-tooltip>
                  </v-btn>

                  <v-btn icon :disabled="codebookActionHighlighted !== 4 && !editable"
                         @click="openNewModifyCode(true)">
                    <v-tooltip bottom :value="codebookActionHighlighted === 4">
                      <template v-slot:activator="{ on }">
                        <v-icon v-on="on"
                                :color="codebookActionHighlighted === 4 ? 'white' : 'default'">mdi-plus-box</v-icon>
                      </template>
                      <span>{{ $t('coding.codes.tooltip_new') }}</span>
                    </v-tooltip>
                  </v-btn>
                </v-toolbar>

                <v-data-table v-model="codesSelected"
                              :items="codes"
                              :headers="codesListHeaders"
                              item-key="id"
                              hide-default-footer
                              id="codes-list"
                              :custom-sort="(codes) => codes"
                              :sort-by.sync="codesSorting.sortBy"
                              :items-per-page.sync="codesSorting.itemsPerPage"
                              :sort-desc.sync="codesSorting.descending"
                              :show-select="editable"
                              must-sort>

                  <template slot="item" slot-scope="props">
                    <tr :active="props.selected" @click="props.select(!props.isSelected)">
                      <td v-if="editable">
                        <v-checkbox v-model="props.isSelected" @click.prevent @change="props.select" hide-details />
                      </td>
                      <td>{{ props.item.label }}</td>
                      <td :style="{ background: $color.getSoft(codeCats.indexOf( props.item.category )) }">
                        {{ props.item.category }}
                      </td>
                      <td>{{ props.item.id }}</td>
                      <td>{{ stats.codeCounts[props.item.id] }}</td>
                    </tr>
                  </template>

                  <empty-state slot="no-data"
                               icon="mdi-label-off-outline"
                               :label="$t('coding.codes.missing.title')"
                               :description="$t(`coding.codes.missing.details${!isListQuestion && !stats.nreviewed ? '_generator': '' }`)">
                    <v-btn v-if="!isListQuestion && !stats.nreviewed"
                           @click="showCodebookGenerator=true"
                           :color="( codes.length === 0 ? 'primary' : 'white' )">
                      {{ $t('coding.codes.generator') }}
                    </v-btn>
                  </empty-state>

                </v-data-table>
              </template>
            </v-tab-item>

            <v-tab-item>
              <template v-if="currentTab===1">
                <div class="visualizations-teaser"
                     @click="$router.push({ name: 'charts-manage', query: {
                       questionID: question.id, questionName: question.name, projectName: question.project_name
                } })">
                  <div class="hover">{{ $t('coding.codes.advanced_visualizations') }}</div>
                  <div><img src="../../assets/visualize/tile-bar.jpg"></div>
                  <div><img src="../../assets/visualize/tile-treemap.jpg"></div>
                  <div><img src="../../assets/visualize/tile-graph.jpg"></div>
                  <div><img src="../../assets/visualize/tile-line-pie.jpg"></div>
                </div>

                <div :style="{ height: Math.max(600, 15 * codeCountLabels.length) + 'px' }">
                  <chart-bar-horizontal :width="100" @contextmenu.native.prevent
                                        :height="100"
                                        :chart-data="{ datasets: codeCountDs, labels: codeCountLabels }"
                                        :percentage="question.nanswers"
                                        @click="clickCodesChart"
                                        :tooltip-footer="$t('coding.codes.click_filter_code')"
                                        hover-pointer
                                        style="width: 100%; height: 100%;"
                                        ref="chart-counts"
                                        id="chart-counts"/>
                </div>

                <template v-if="question.credits_open>userCreditsRemaining">
                  <!-- warning if not enough credits available -->
                  <alert type="warning">
                    <!-- at the end of the month it will be sufficient -->
                    <span v-if="question.credits_open<=user.subscription.plan.credits_monthly">
                      {{ $t('billing.not_enough_credits_month', {
                        rows: question.credits_open,
                        of_this_entity: $t('question.of_this'),
                        credits_remaining: userCreditsRemaining }) }}
                    </span>
                    <!-- it will never be sufficient without purchasing further credits -->
                    <span v-else>
                      {{ $t('billing.not_enough_credits_ever', { rows: question.credits_open, credits: user.subscription.plan.credits_monthly }) }}
                    </span>
                    <div style="text-align: center">
                      <v-btn color="accent" :to="{ name: 'subscription' }">
                        {{ $t('billing.buy_additional') }}
                      </v-btn>
                    </div>
                  </alert>
                </template>

                <alert v-else-if="question.credits_open>0" type="info">
                  {{ $t('billing.bill_credits_info', {
                    credits_deduct: question.credits_open,
                    credits_available: userCreditsRemaining
                  }) }}
                </alert>
                <v-btn v-if="question.credits_open<=userCreditsRemaining && $hasPermission('projects_download', question)"
                       color="primary" @click="downloadChart()">{{ $t('download.graph') }}</v-btn>
              </template>

            </v-tab-item>

            <v-tab-item>

              <div :style="{ height: Math.max(600, 15 * codeScores.labels.length) + 'px' }"
                   v-if="currentTab===2 && questionTrainingCompleted">

                <chart-bar-horizontal :width="100"
                                      :height="100"
                                      :chart-data="codeScores"
                                      data-append-str="%"
                                      style="width: 100%; height: 100%;"
                                      :stacked-belonging-together="2"
                                      ref="chart-probs"/>
              </div>
            </v-tab-item>

            <v-tab-item>
              <!-- ====== Model stats ====== -->

              <div id="statsBox">
                <v-divider />
                <div><span class="subtitle-1">{{ $t('coding.statistics.general') }}</span></div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.lastsaved') }}</span>
                  <code>{{ lastSaved.fromNow() }}</code>
                </div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.number_of_answers') }}</span>
                  <code>{{ question.nanswers }}</code>
                  {{ $t('coding.statistics.thereof_unique', { cnt: stats.nanswers_unique }) }}
                </div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.number_nocodes') }}</span>
                  <code>{{ stats.nnocodes }} ({{ 100 * stats.nnocodes / question.nanswers | round }}%)</code>
                  {{ $t('coding.statistics.thereof_unique', { cnt: stats.nnocodes_unique }) }}
                </div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.number_reviewed') }}</span>
                  <code>{{ stats.nreviewed }} ({{ reviewedPercentage }}%)</code>
                  {{ $t('coding.statistics.thereof_unique', { cnt: stats.nreviewed_unique }) }}
                </div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.number_manual') }}</span>
                  <code>{{ stats.nchanged }} ({{ 100 * stats.nchanged / question.nanswers | round }}%)</code>
                </div>
                <div>
                  <span class="grey--text">{{ $t('coding.statistics.codes_total') }}</span>
                  <code>{{ nCodesTotal }}</code>
                </div>
                <v-divider />
                <div v-if="!question.no_training">
                  <div id="modelInfo" @click.shift="$emit('request-predictions')">
                    <!-- Hidden Click functionality to request training, for debugging purposes -->
                    <span class="subtitle-1">{{ $t('coding.statistics.model.title') }}</span>
                  </div>
                  <div><span class="grey--text">{{ $t('coding.statistics.model.last_update') }}</span>
                    <template v-if="!questionTrainingCompleted">
                      {{ $t('coding.statistics.model.not_trained') }}
                    </template>
                    <template v-else><code>{{ lastTrainedText }}</code></template>
                  </div>
                  <template v-if="question.model.score>0">
                    <div><span class="grey--text">{{ $t('coding.statistics.model.score') }}</span>
                      <code>{{ score }}%</code>
                      <helptip position="top" :width="1050" x-offset="-500" style="vertical-align: bottom; margin-bottom: -2px">
                        <div v-html="$t('coding.statistics.model.score_helptip', { href: 'https://en.wikipedia.org/wiki/F1_score' })"/>
                      </helptip>
                    </div>
                    <div v-if="stats.nPredicted">
                      <span class="grey--text">{{ $t('coding.statistics.model.updated') }}</span>
                      <code>{{ stats.nPredicted }}</code>
                    </div>
                    <div>
                      <span class="grey--text">{{ $t('coding.statistics.model.number_training') }}</span>
                      <code>{{ (question.ntrainings_svm + question.ntrainings_bert) }}</code>
                    </div>
                    <div>
                      <span class="grey--text">{{ $t('coding.statistics.model.model_type') }}</span>
                      <code>{{ bestModel }}</code>
                    </div>

                    <advanced-options divider-top style="margin-top: 20px" v-if="THRESHOLD_SLIDER && editable">
                      <div style="position: relative">
                        <span class="grey--text">{{ $t('coding.statistics.model.tolerance.title') }}: </span>
                        <code>{{ modelGenerosity }}</code>
                        [ <a href="#" @click.prevent="modelGenerosity=50">{{ $t('coding.statistics.model.tolerance.reset') }}</a> ]

                        <helptip position="top" :width="530" style="margin-top: 25px">
                          <div v-html="$t('coding.statistics.model.tolerance.helptip')"/>
                        </helptip>

                        <div class="beta-burst" style="position: absolute; right: 20px; bottom: 10px"><span>Beta</span></div>
                      </div>
                      <v-slider min="10"
                                max="95"
                                step="5"
                                @change="setModelGenerosity"
                                v-model="generosity"
                                ref="modelGenerositySlider"
                                thumb-label
                                v-if="predictionsCachedReady"
                                style="width: 100%" />
                      <div v-else>{{ $t('coding.statistics.model.tolerance.not_ready') }}</div>
                    </advanced-options>

                  </template>
                </div>
              </div>
            </v-tab-item>

          </v-tabs>

        </v-card-text>
      </v-card>
    </div>

    <!-- ====== Modify code dialog ====== -->

    <v-dialog v-model="newOrModifyCode.active"
              max-width="600"
              @keydown.esc="closeNewModifyCode(false)"
              @keydown.enter="closeNewModifyCode(true)">
      <v-card>
        <v-card-title class="headline">
          <template v-if="newOrModifyCode.isNew">{{ $t('coding.codes.new.title') }}</template>
          <template v-else>
            {{ $t('coding.codes.new.edit', { plural: newOrModifyCode.multiple ? 's' : '',
                                             code: newOrModifyCode.label_old }) }}
          </template>
        </v-card-title>

        <alert type="error" v-if="maxCodesReached">
          <span v-html="$t('coding.codes.new.too_many', { allowed: MAX_CODES_PER_SURVEY })"/>
        </alert>

        <template v-else>
          <!-- <alert type="warning" v-if="question.inherits_from!==null&&!newOrModifyCode.isNew">
            <span v-html="$t('coding.codes.alert_inherit', { inherit_name: question.inherits_from_name })"/>
            <helptip position="bottom" :width="550" @click.native.stop.prevent>
              <div v-html="$t('coding.codes.modify_inherit_helptip')"/>
            </helptip>
          </alert> -->

          <v-card-text>
            <v-text-field v-model="newOrModifyCode.label"
                          :disabled="newOrModifyCode.multiple"
                          :label="$t('coding.codes.new.name')"
                          :error-messages="newOrModifyCode.labelInvalid"
                          ref="newOrModifyCodeLabel" />

            <v-combobox v-model="newOrModifyCode.category"
                        class="category-autocomplete"
                        allow-overflow
                        menu-props="auto"
                        :items="codeCats"
                        :label="$t('coding.codes.new.category')"
                        :error-messages="newOrModifyCode.categoryInvalid"
                        ref="newOrModifyCodeCategory"
                        @change="if ($event !== null) newOrModifyCode.categoryShadowCopy=$event"
                        @input.native="if($event !== null) newOrModifyCode.categoryShadowCopy=$event.srcElement.value"
                        @keydown.native.enter.stop />

            <advanced-options divider-top
                              :force-show="newOrModifyCode.idInvalid !== ''"
                              v-if="!newOrModifyCode.multiple"
                              @keydown.native.enter.stop.prevent>
              <v-text-field v-model="newOrModifyCode.id"
                            :label="$t('coding.codes.new.new_id')"
                            :error-messages="newOrModifyCode.idInvalid" />
            </advanced-options>

          </v-card-text>
        </template>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeNewModifyCode(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary"
                 @click.native="closeNewModifyCode(true)"
                 :disabled="maxCodesReached">
            {{ $t('save.title') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Delete code dialog ====== -->

    <v-dialog v-model="deleteCode.active" max-width="600" @keydown.esc="closeDeleteCode(false)">
      <v-card>
        <v-card-title class="headline">{{ $t('coding.codes.delete.title') }}</v-card-title>
        <v-card-text v-html="$t(`coding.codes.delete.are_you_sure${deleteCode.deleteIDs.length > 1 ? '_multi' : ''}`, {'code': deleteCode.labels })" />
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeDeleteCode(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click.native="closeDeleteCode(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Merge codes dialog ====== -->

    <v-dialog v-model="mergeCodes.active"
              max-width="600"
              content-class="allow-overflow"
              @keydown.esc="closeMergeCodes(false)">
      <v-card>
        <v-card-title class="headline">{{ $t('coding.codes.merge.title') }}</v-card-title>

        <alert type="info">
          <span v-html="$t('coding.codes.merge.info', {
            nCodes: codesSelected.length,
            codes: `'${$_.map(codesSelected, 'label').join('\', \'')}'`
          } )"/>
        </alert>

        <alert type="warning" v-if="question.inherits_from!==null">
          <span v-html="$t('coding.codes.alert_inherit', { inherit_name: question.inherits_from_name })"/>
          <!-- <helptip position="bottom" :width="550" @click.native.stop.prevent>
            <div v-html="$t('coding.codes.modify_inherit_helptip')"/>
          </helptip> -->
        </alert>

        <v-card-text>
          <v-select v-model="mergeCodes.mergeTo"
                    :items="codesSelected"
                    :label="$t('coding.codes.merge.merge_into')"
                    :error-messages="mergeCodes.invalid"
                    item-text="label"
                    item-value="id" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeMergeCodes(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click.native="closeMergeCodes(true)">{{ $t('coding.codes.merge.do_merge') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ====== Rename category dialog ====== -->

    <v-dialog v-model="renameCategory.active"
              max-width="600"
              @keydown.esc="closeRenameCategory(false)"
              @keydown.enter="closeRenameCategory(true)">
      <v-card>
        <v-card-title class="headline">{{ $t('coding.codes.rename.title') }}</v-card-title>
        <v-card-text>
          <v-select v-model="renameCategory.categoryOld"
                    :items="codeCats"
                    :label="$t('coding.codes.rename.category_old')"
                    :error-messages="renameCategory.categoryOldInvalid" />

          <v-text-field v-model="renameCategory.categoryNew"
                        class="rename-category"
                        :label="$t('coding.codes.rename.category_new')"
                        :error-messages="renameCategory.categoryNewInvalid" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" outlined @click.native="closeRenameCategory(false)">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click.native="closeRenameCategory(true)">
            {{ $t('coding.codes.rename.do_rename') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="isListQuestion"
              v-model="showListAutocoder"
              fullscreen hide-overlay
              persistent
              transition="dialog-bottom-transition">
      <list-autocoder @close="closeListAutocoder" v-if="showListAutocoder" />
    </v-dialog>

    <v-dialog v-else
              v-model="showCodebookGenerator"
              fullscreen
              hide-overlay
              persistent
              transition="dialog-bottom-transition">
      <codebook-generator @close="closeCodebookGenerator"
                          v-if="showCodebookGenerator"
                          @request-predictions-delayed="requestPredictionsDelayed" />
    </v-dialog>

    <!-- ====== Reset question dialog ====== -->
    <v-dialog v-model="resetQuestion.active" max-width="600" @keydown.esc="closeResetQuestion(false)" v-if="resetQuestion.active">
      <v-card style="min-height: 280px; flex-direction: column; display: flex">
        <v-card-title class="headline">{{ $t('coding.codes.reset_question.title') }}</v-card-title>
        <alert v-if="resetQuestion.failed" type="error">
          {{ $t('error', {'step': $t('coding.codes.reset_question.error_step') }) }}
        </alert>

        <loading :is-loading="resetQuestion.loading"
                 :title="$t('processing')"
                 tagline=""
                 flex>
          <div style="display: flex; flex-direction: column; width: 100%">
            <v-card-text v-html="$t('coding.codes.reset_question.description')" style="padding: 0 24px 20px" />
            <v-spacer />
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" outlined @click.native="closeResetQuestion(false)">{{ $t('no') }}</v-btn>
              <v-btn color="accent" @click.native="closeResetQuestion(true)">{{ $t('coding.codes.reset_question.btn') }}</v-btn>
            </v-card-actions>
          </div>
        </loading>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import ChartBarHorizontal from '@/components/ChartBarHorizontal.js'
import ListAutocoder from '@/components/coding/ListAutocoder'
import CodebookGenerator from '@/components/coding/CodebookGenerator'
import Vuex from 'vuex'

import LocalstorageMixin from '@/mixins/localstorage'
import { MAX_CODES_PER_SURVEY, MIN_TRAIN_ANSWERS, THRESHOLD_SLIDER } from '@/settings/coding'

export default {
  codit: true,
  name: 'CodingTabs',
  components: {
    'chart-bar-horizontal': ChartBarHorizontal,
    'list-autocoder': ListAutocoder,
    'codebook-generator': CodebookGenerator
  },
  mixins: [LocalstorageMixin],
  data () {
    return {
      showKeyboardShortcuts: true,
      showListAutocoder: false,
      showCodebookGenerator: false,

      currentTab: 0,
      firstLoad: true,
      // Code Modification
      newOrModifyCode: {
        active: false,
        multiple: false,
        isNew: true,
        existingIdx: -1,
        label: '',
        label_old: '',
        category: '',
        categoryShadowCopy: '',
        id: -1,
        labelInvalid: '',
        categoryInvalid: '',
        idInvalid: ''
      },

      deleteCode: {
        active: false,
        deleteIDs: [-1],
        labels: ''
      },

      mergeCodes: {
        active: false,
        mergeToCode: -1,
        invalid: ''
      },

      renameCategory: {
        active: false,
        categoryOld: '',
        categoryNew: '',
        categoryOldInvalid: '',
        categoryNewInvalid: ''
      },

      resetQuestion: {
        active: false,
        loading: false,
        failed: false
      },

      codesSelected: [],

      codesSorting: { sortBy: '__initial__', itemsPerPage: 1000, descending: true },

      codesSet: new Set(),

      codebookDirtySinceTrainingRequested: false,

      generosity: 50,

      codebookActionHighlighted: null,

      codesListHeaders: [
        { text: this.$t('coding.codes.name'), value: 'label' },
        { text: this.$t('coding.codes.category'), value: 'category' },
        { text: this.$t('coding.codes.numeric'), value: 'id' },
        { text: this.$t('coding.codes.count'), value: 'count' }
      ],

      // Stats
      lastTrainedText: '',
      trainingCompletedETAText: '',
      trainingCompletedETAOverdue: false,
      updateLastTrainedInterval: null
    }
  },

  computed: {
    score () {
      return (this.question.model ? Math.max(this.question.model.score_remaining, this.question.model.score) * 100 : 0).toFixed()
    },

    reviewedPercentage () {
      return (100 * this.stats.nreviewed / this.question.nanswers).toFixed()
    },

    nextRetrainPercentage () {
      return (100 * (this.stats.nreviewed_unique - this.prevRetrainThresh) / (this.nextRetrainThresh - this.prevRetrainThresh)).toFixed()
    },

    codeCountLabels () {
      // all code labels and categories in flat list for plotting
      let prevCat = null
      let labels = []
      this.codesSorted.forEach(v => {
        if (prevCat !== v.category) {
          labels.push(v.category)
          prevCat = v.category
        }
        labels.push(v.label)
      })
      return labels
    },

    stateIsClean () { return this.stats.nreviewed === 0 && this.codes.length === 0 },

    codeCountDs () {
      // create datasets for plotting code counts
      let ds = []
      let NprependZeros = 0
      this.codeCats.forEach((cat, idx) => {
        let prependedZeros = Array.apply(null, Array(NprependZeros)).map(Number.prototype.valueOf, 0)
        // Dataset for the category
        ds.push({
          label: '',
          data: prependedZeros.concat([this.stats.codeCatCounts[cat]]),
          backgroundColor: this.$color.getMedium(idx),
          hoverBackgroundColor: this.$color.getStrong(idx),
          refs: prependedZeros.concat({ type: 'cat', identifier: cat }) // for back-referencing events to codes
        })
        prependedZeros.push(0)
        let codeCounts = _.map(this.codesByCat[cat], code => this.stats.codeCounts[code.id])
        // Dataset for the codes belonging to the category
        ds.push({
          label: cat,
          data: prependedZeros.concat(codeCounts),
          backgroundColor: this.$color.getSoft(idx),
          hoverBackgroundColor: this.$color.getStrong(idx),
          refs: prependedZeros.concat(_.map(this.codesByCat[cat], code => ({ type: 'code', identifier: code.id })))
        })
        NprependZeros += codeCounts.length + 1
      })
      return ds
    },
    codeScores () {
      let pattern = require('patternomaly')
      // create datasets for plotting per code scores
      let ds = []
      let labels = []
      let NprependZeros = 0
      // Set the scores per model, be sure here that the codes are sorted in same was as in .codes
      // They should always be sorted in ascending order by id
      let scorePerCode = _.sortBy(this.question.model.score_per_code, 'id')
      this.codeCats.forEach((v, idx) => {
        // Get all code scores that belong to this category
        let codesInCat = _.filter(scorePerCode, o => ((o.id in this.codeIdToCat) && this.codeIdToCat[o.id] === v))
        codesInCat.forEach(o => labels.push(this.codes[this.codeIdToIdx[o.id]].label))

        let scores = _.map(codesInCat, v => this.$options.filters.round(v['score'] * 100))
        let scoresRemaining = _.map(codesInCat, (v, idxOfScore) => {
          let val = this.$options.filters.round(v['score_remaining'] * 100)
          return Math.max(val - scores[idxOfScore], 0)
        })
        let prependedZeros = Array.apply(null, Array(NprependZeros)).map(Number.prototype.valueOf, 0)

        // Create two datasets for each category:
        // 1) The eval / test score
        // 2) The difference of the estimated remaining score and the eval test score

        ds.push({
          label: v,
          data: prependedZeros.concat(scores),
          backgroundColor: this.$color.getSoft(idx),
          hoverBackgroundColor: this.$color.getStrong(idx)
        })
        ds.push({
          label: v,
          noLegend: true,
          data: prependedZeros.concat(scoresRemaining),
          backgroundColor: pattern.draw('zigzag-vertical', this.$color.getSoft(idx)),
          hoverBackgroundColor: pattern.draw('zigzag-vertical', this.$color.getStrong(idx)),
          tooltipColor: this.$color.getStrong(idx)
        })
        NprependZeros += scores.length
      })
      return { datasets: ds, labels: labels }
    },
    codes: {
      get () { return this.$store.state.coding.codes },
      set (val) { this.$store.commit('setCodes', val) }
    },

    maxCodesReached () {
      return this.codes.length >= MAX_CODES_PER_SURVEY
    },

    bestModel () {
      let scoreSVM = this.question.model.score_svm || null
      let scoreBERT = this.question.model.score_bert || null
      let score = this.question.model.score || null
      if (score === -1) return 'None'
      else if (scoreSVM === null && scoreBERT === null) return 'Legacy SVM'
      if (scoreSVM > scoreBERT) return 'SVM'
      else return 'Attb'
    },

    modelGenerosity: {
      set (modelGenerosity) {
        this.$store.dispatch('saveQuestionModelCertaintyThresh', { modelCertaintyThresh: (100 - modelGenerosity) })
      },
      get () { return (100 - this.question.model_certainty_thresh) }
    },

    THRESHOLD_SLIDER: {
      cache: false,
      get: () => THRESHOLD_SLIDER
    },

    MIN_TRAIN_ANSWERS: {
      cache: false,
      get: () => MIN_TRAIN_ANSWERS
    },

    MAX_CODES_PER_SURVEY: {
      cache: false,
      get: () => MAX_CODES_PER_SURVEY
    },

    ...Vuex.mapGetters(['questionTrainingCompleted', 'nextRetrainThresh', 'prevRetrainThresh', 'isListQuestion']),
    ...Vuex.mapState({
      user: state => state.user,
      question: state => state.coding.question,
      answers: state => state.coding.answers,
      stats: state => state.coding.stats,
      loaded: state => state.coding.loaded,
      lastSaved: state => state.coding.lastSaved,
      newCodeCB: state => state.coding.newCode.cb,
      newCodeName: state => state.coding.newCode.name,
      predictionsCachedReady: state => state.coding.predictionsCachedReady,
      editable: state => state.coding.editable
    }),
    ...Vuex.mapGetters([
      'userCreditsRemaining',
      'codeCats',
      'codesByCat',
      'codesSorted',
      'codeIdToCat',
      'codeIdToIdx',
      'nCodesTotal',
      'nAnswersInList'
    ])
  },

  watch: {
    showKeyboardShortcuts (val) { this.setLsGlobalSettings({ showKeyboardShortcuts: val }) },

    codes: {
      deep: true,
      handler (codes) {
        let cSet = new Set(codes)
        if (this.firstLoad) {
          this.firstLoad = false
        } else {
          // Only recompute counts if the codes themselves have changed, not their sorting
          if (!_.isEqual(cSet, this.codesSet)) this.$store.dispatch('countCodes')
          this.saveCodes()
        }
        this.codesSet = _.cloneDeep(cSet)
      }
    },

    'newOrModifyCode.categoryShadowCopy' (val) {
      // Reset the potential error messages
      this.newOrModifyCode.categoryInvalid = ''
    },

    'renameCategory.categoryOld' (val) {
      // Reset the potential error messages
      this.renameCategory.categoryOldInvalid = ''
      this.renameCategory.categoryNew = val
    },

    'renameCategory.categoryNew' (val) {
      // Reset the potential error messages
      this.renameCategory.categoryNewInvalid = ''
    },

    loaded () {
      // If this is a list question and we don't have any codes yet, start the list autocoder
      let autocoderRanBefore = 'codebook_generator_list' in this.question.model
      if (this.isListQuestion && !autocoderRanBefore && this.answers.length) {
        setTimeout(() => { this.showListAutocoder = true }, 1000)
      }
      if (!this.isListQuestion && this.stats.nreviewed === 0 && !this.codes.length && this.answers.length) {
        setTimeout(() => { this.showCodebookGenerator = true }, 1000)
      }
    },

    'newOrModifyCode.active' (val) {
      this.mutateDialogOpen(val)
      // If the new code has been triggered from a select and the dialog has been closed without creating a new code
      this.$nextTick(() => {
        if (!val && this.newCodeCB !== null) {
          this.newCodeCB(null)
          this.$store.commit('resetNewCodeTrigger')
        }
      })
    },

    showListAutocoder: 'mutateDialogOpen',
    showCodebookGenerator: 'mutateDialogOpen',
    'deleteCode.active': 'mutateDialogOpen',
    'mergeCodes.active': 'mutateDialogOpen',
    'renameCategory.active': 'mutateDialogOpen',
    'resetQuestion.active': 'mutateDialogOpen',

    newCodeCB (newval) {
      if (newval !== null) {
        this.openNewModifyCode(true, this.newCodeName)
      }
    },

    codesSorting: {
      deep: true,
      handler: 'sortCodes'
    },

    'stats.trainingRequestedTime' () { this.codebookDirtySinceTrainingRequested = false }
  },

  created () {
    // Get global settings from user local storage
    let s = this.getLsGlobalSettings()
    if (s.showKeyboardShortcuts !== undefined) this.showKeyboardShortcuts = s.showKeyboardShortcuts

    // Interval to set update the text of when the model was last trained
    this.updateLastTrainedInterval = setInterval(() => {
      let svm = this.question.training_completed_svm || ''
      let bert = this.question.training_completed_bert || ''

      let completed = [svm, bert].sort()[1]
      // Set the human readable time when the last model training was completed
      if (completed) this.lastTrainedText = this.$options.filters.fromnow(completed)

      this.trainingCompletedETAText = ''
      // Set the human readable time when we expect the next model training to be completed
      if (this.stats.trainingCompletedETA !== null) {
        let dt = this.stats.trainingCompletedETA.diff(this.$moment(), 'seconds')
        if (dt < 50) this.trainingCompletedETAText = this.$t('coding.statistics.model.eta_any_moment')
        else {
          this.trainingCompletedETAText = this.$t('coding.statistics.model.eta_fromnow', {
            fromnow: this.stats.trainingCompletedETA.fromNow()
          })
        }
        this.trainingCompletedETAOverdue = dt < -60
      } else {
        this.trainingCompletedETAText = ''
        this.trainingCompletedETAOverdue = false
      }
    }, 1000)
  },

  destroyed () {
    clearInterval(this.updateLastTrainedInterval)
  },

  methods: {
    requestPredictionsDelayed () { setTimeout(() => this.$emit('request-predictions'), 10000) },
    closeListAutocoder (res) {
      this.showListAutocoder = false
    },

    closeCodebookGenerator (res) {
      this.showCodebookGenerator = false
    },

    clickCodesChart ($e, chartEls) {
      // We only consider the first chart el, as that is probably the visible one
      if (!chartEls[0]) return
      let ref = chartEls[0].ref
      let emitval = []
      if (ref.type === 'code') emitval.push(ref.identifier) // filter by this specific code
      else emitval = _.map(this.codesByCat[ref.identifier], 'id') // filter by an entire category
      this.$emit('set-codes-filter', emitval)
      this.$vuetify.goTo(0, { duration: 400 })
    },

    setModelGenerosity () {
      // Make sure the keyboard events are not captured by the slider anymore
      this.$refs.modelGenerositySlider.$refs.input.blur()
      // we need to defer this to the next tick, as the vuetify slider might need a moment to update the value
      this.$nextTick(() => { this.modelGenerosity = this.generosity })
    },
    saveCodes () {
      this.$store.dispatch('saveCodes').then(res => {
        console.log('codes saved')
      }).catch(() => {
        this.$root.snackMsg(this.$t('coding.save_error_codes'))
      })
    },

    openNewModifyCode (isNew, newLabel = '') {
      if (isNew) {
        this.newOrModifyCode.multiple = false
        this.newOrModifyCode.isNew = true
        this.newOrModifyCode.label = newLabel
        this.newOrModifyCode.category = (this.codeCats.length === 1 ? this.codeCats[0] || '' : '')
        this.newOrModifyCode.categoryShadowCopy = this.newOrModifyCode.category
        // Set valid code ID: If this is the first code, we give it id 10
        let codeId = -1
        if (this.codes.length === 0) codeId = 10
        // otherwise get first higher integer as id which isn't used
        else {
          let currMax = -Infinity
          this.codes.forEach(c => { if (c.id > currMax) currMax = c.id })
          codeId = currMax + 1
        }
        this.newOrModifyCode.id = codeId
      } else {
        let multiple = this.codesSelected.length > 1
        let allElementsEqual = property => _.map(this.codesSelected, property).every((val, i, arr) => val === arr[0])
        this.newOrModifyCode.multiple = multiple
        this.newOrModifyCode.isNew = false
        this.newOrModifyCode.label = this.newOrModifyCode.label_old = _.map(this.codesSelected, 'label').join(', ')
        this.newOrModifyCode.category = (allElementsEqual('category') ? this.codesSelected[0].category || '' : '')
        this.newOrModifyCode.categoryShadowCopy = this.newOrModifyCode.category
        this.newOrModifyCode.id = (multiple ? '' : this.codesSelected[0].id)
      }
      this.newOrModifyCode.labelInvalid = ''
      this.newOrModifyCode.categoryInvalid = ''
      this.newOrModifyCode.idInvalid = ''
      this.newOrModifyCode.active = true
      setTimeout(() => { if (this.$refs.newOrModifyCode) this.$refs.newOrModifyCodeLabel.focus() }, 350)
    },

    closeNewModifyCode (save) {
      // People double-click on save sometimes, which generates an error
      // This prevents it
      if (!this.newOrModifyCode.active) return
      if (save) {
        let codeToStore = {}
        // reset error messages
        this.newOrModifyCode.categoryInvalid = ''
        this.newOrModifyCode.labelInvalid = ''
        // validation of fields
        if (this.newOrModifyCode.label.length < 3) {
          this.newOrModifyCode.labelInvalid = this.$t('coding.codes.new.invalid_name')
          this.$refs.newOrModifyCodeLabel.focus()
          return
        }

        // Combobox updates the model lazy, copy value from shadow variable to be sure its up to date
        this.newOrModifyCode.category = this.newOrModifyCode.categoryShadowCopy

        if (this.newOrModifyCode.category.length < 3) {
          // New category, but category name too short
          this.newOrModifyCode.categoryInvalid = this.$t('coding.codes.new.invalid_category')
          this.$refs.newOrModifyCodeCategory.focus()
          return
        }

        codeToStore.category = this.newOrModifyCode.category.toUpperCase()

        // Only check the code id if a single code was modified
        if (!this.newOrModifyCode.multiple) {
          codeToStore.label = this.newOrModifyCode.label
          let codeId = parseInt(this.newOrModifyCode.id)
          // Only do checks if either new or id has changed
          if (this.newOrModifyCode.isNew || this.codesSelected[0].id !== codeId) {
            if (isNaN(codeId)) {
              this.newOrModifyCode.idInvalid = this.$t('coding.codes.new.id_not_numeric')
              return
            } else if (_.filter(this.codes, { id: codeId }).length !== 0) {
              this.newOrModifyCode.idInvalid = this.$t('coding.codes.new.id_not_unique')
              return
            } else if (codeId < 0 || codeId > 32000) {
              this.newOrModifyCode.idInvalid = this.$t('coding.codes.new.id_not_in_range', { maxval: 32000, minval: 0 })
              return
            }
            codeToStore.id = codeId
          }
        }

        // update model
        if (this.newOrModifyCode.isNew) {
          this.$store.commit('addCode', codeToStore)
          // If the new code has been triggered from a select and a new code has been created
          this.$nextTick(() => {
            if (this.newCodeCB !== null) {
              this.newCodeCB(codeToStore.id)
              this.$store.commit('resetNewCodeTrigger')
            }
          })
        } else {
          this.codesSelected.forEach(c => {
            this.$store.dispatch('modifyCode', {
              codeID: c.id,
              newAttributes: codeToStore
            })
          })

          // Deselect the code to be modified
          this.codesSelected.splice(0)
        }

        if (!this.isListQuestion && this.newCodeCB === null) this.codebookDirtySinceTrainingRequested = true
      }
      this.newOrModifyCode.active = false
    },

    openDeleteCode () {
      this.deleteCode.deleteIDs = _.map(this.codesSelected, 'id')
      this.deleteCode.labels = _.map(this.codesSelected, 'label').join(', ')
      this.deleteCode.active = true
    },

    closeDeleteCode (doIt) {
      if (doIt) {
        this.deleteCode.delete
        this.deleteCode.deleteIDs.forEach(v => this.$store.dispatch('deleteCode', { codeID: v }))
        // Clear selection
        this.codesSelected.splice(0)
      }

      this.deleteCode.active = false
      this.deleteCode.deleteIDs = -1
    },

    openMergeCodes () {
      this.mergeCodes.mergeTo = -1
      this.mergeCodes.invalid = ''
      this.mergeCodes.active = true
    },

    closeMergeCodes (doMerge) {
      if (doMerge) {
        if (this.mergeCodes.mergeTo === -1) {
          this.mergeCodes.invalid = this.$t('coding.codes.merge.invalid')
          return
        }
        this.$store.dispatch('mergeCodes', {
          parentID: this.mergeCodes.mergeTo,
          childIDs: _.filter(_.map(this.codesSelected, 'id'), v => v !== this.mergeCodes.mergeTo)
        })
        this.codesSelected.splice(0)
      }
      this.mergeCodes.active = false
    },

    openRenameCategory () {
      this.renameCategory.active = true
    },

    closeRenameCategory (doIt) {
      if (doIt) {
        if (this.renameCategory.categoryOld === '') {
          // Need to select existing category
          this.renameCategory.categoryOldInvalid = this.$t('coding.codes.new.select_category')
          return
        } else if (this.renameCategory.categoryNew.length < 1) {
          // Existing category but none selected
          this.renameCategory.categoryNewInvalid = this.$t('coding.codes.new.invalid_category')
          return
        }
        let newAttributes = { category: this.renameCategory.categoryNew.toUpperCase() }
        this.codes.forEach(c => {
          if (c.category !== this.renameCategory.categoryOld) return
          this.$store.dispatch('modifyCode', {
            codeID: c.id,
            newAttributes
          })
        })
      }
      this.renameCategory.active = false
    },

    closeResetQuestion (doIt) {
      if (this.resetQuestion.loading) return
      if (!doIt) this.resetQuestion.active = false
      else {
        this.resetQuestion.failed = false
        this.resetQuestion.loading = true

        api.post(`/api/questions/${this.question.id}/reset`).then((res) => {
          // Reload the entire view, just to make things easier
          if (res.data.success) this.$router.go()
          else this.resetQuestion.failed = true
          this.resetQuestion.loading = false
        }).catch(err => {
          this.resetQuestion.failed = true
          this.resetQuestion.loading = false
          this.$maybeRaiseAPIPromiseErr(err)
        })
      }
    },

    sortCodes ({ sortBy, descending }) {
      if (sortBy === '__initial__') return
      let prefac = descending ? -1 : 1
      let sortCompare = (codeA, codeB) => {
        if (sortBy === 'id') return codeA.id - codeB.id
        else if (sortBy === 'count') return this.stats.codeCounts[codeA.id] - this.stats.codeCounts[codeB.id]
        // else return code[sortBy].toLowerCase()
        else return codeA[sortBy].localeCompare(codeB[sortBy])
      }
      let codesSorted = _.clone(this.codes)
      codesSorted.sort((a, b) => prefac * sortCompare(a, b))
      this.codes = codesSorted
    },

    downloadChart () {
      // Dispatch billing request (checks is necessary will be made in there)
      this.$store.dispatch('billQuestion')
      if (this.currentTab !== 1) this.currentTab = 1
      // Wait 250ms to be sure that the graph has rendered
      setTimeout(() => {
        let link = document.createElement('a')
        link.download = 'Chart ' + this.question.name + '.png'
        link.href = this.$refs['chart-counts']._chart.ctx.canvas.toDataURL('image/png')
        link.setAttribute('type', 'hidden')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, 1500)
    },

    highlightCodebookActions () {
      const SHOW_FOR_MS = 1500
      const nextStep = () => {
        if (this.codebookActionHighlighted === 4) {
          this.codebookActionHighlighted = null
          return
        }
        this.codebookActionHighlighted += 1
        setTimeout(nextStep, SHOW_FOR_MS)
      }

      this.codebookActionHighlighted = 0
      setTimeout(nextStep, SHOW_FOR_MS + 1750)
    },

    ...Vuex.mapActions(['mutateDialogOpen'])
  }
}
</script>

<style lang=scss>

.hopscotch-bubble { z-index: 199!important }

#codes-list {
  max-height: 500px;
  overflow-y: scroll;
  padding-bottom: 5px;

  td {
    height: 37px;
  }
  tr { cursor: pointer }

 .v-input--checkbox {
    margin: 0;
    padding: 0;
  }
}

.v-input.category-autocomplete, .v-input.rename-category{
  input, { text-transform: uppercase }
}

#statsBox {
  margin: 15px 0 10px 20px;
  width: 640px;
  > * { margin-bottom: 2px }
  .grey--text { width: 190px; display: inline-block }
  .v-divider { margin: 8px 0 10px }
}

.visualizations-teaser {
  display: flex;
  position: relative;
  flex-direction: row;
  box-shadow: 0rem 0.25rem 1rem rgba(48,55,66,.15);
  border: 1px solid #dadee4!important;
  margin: 24px;
  border-radius: 4px;
  padding-bottom: 10px;
  justify-content:center;

  .hover {
    position: absolute;
    border-radius: 4px;
    left: 0px;
    right: 0;
    top: 0px;
    bottom: 0;
    text-align: center;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    color: #333;
    text-shadow: 1px 1px 0px rgba(255, 255, 255, .6);
    cursor: pointer;
    opacity: 0;
    transition: all 0.07s ease-in;
    border: 1px solid #FFF;
    background: rgba(100, 100, 100, 0.15);
    box-shadow: 0.25rem 0.5rem 0.5rem rgba(48,55,66,.25);
  }

  &:hover {
    .hover {
      opacity: 1;
    }
  }

  div:not(.hover) {
    margin: 24px 36px;
    flex: 0 0 auto;
  }

  img {
    flex: 0 0 auto;
    height: 140px;
  }
}

#keyboardshortcuts {
  .v-card__title button {
    position: absolute;
    right: 8px;
    top: 4px;
    z-index: 0;
  }

  .v-card__text {
    .subtitle-1 {
      margin-bottom: 10px;
      font-style: italic;
    }
    .v-divider {
      margin: -15px 0 8px 0;
    }

    .shortcut-container {
      display: flex;

      & > :first-child {
        border-right: 1px solid #DDD;
        padding-right: 10px;
      }

      .shortcut-type {
        flex: 1;
        margin-right: 10px;

        .shortcut-content {
          display: flex;
          .key {
            background: #EEE;
            border-radius: 3px;
            padding: 2px 3px;
          }
        }

        .shortcut-content > * {
          display: flex;
          flex-direction: column;
          > * { line-height: 25px }
        }

        .key-name { flex: 1 1 auto; }

        .key-icon { flex: 0 0 auto; }

        .key-icon > * { display: inline-flex; justify-content: center; }

        .key-description {
          > * { align-self: flex-end; }
          flex: 1 1 auto;
        }

      }
    }

    @media only screen and (max-width: 1200px) {
      .shortcut-container {
        display: block;

        & > :first-child {
          border-right: none;
          padding-right: 0;
          border-bottom: 1px solid #DDD;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .shortcut-type {
          margin-left: 20px;
        }
      }
    }

  }
}

#frequencyGraph {
  .v-badge__badge {
    width: 18px;
    height: 18px;
    top: -9px;
  }
}

</style>
<i18n src='@/i18n/pages/Billing.json'></i18n>
<i18n src='@/i18n/pages/CodingFullyOpen.json'></i18n>
