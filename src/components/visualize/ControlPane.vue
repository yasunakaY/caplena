<template>
  <v-card class="chart-config-el">
    <v-card-title>
      <div>
        <div class="title">{{ $t('title') }}</div>
        <div class="subtitle">{{ $t('subtitle') }}</div>
      </div>
    </v-card-title>

    <v-card-text>

      <v-list>
        <control-drawer icon="mdi-chart-bar"
                        :title="$t('general.title')"
                        ref="drawer-general"
                        v-if="drawersVisible.general">

          <control-tile v-if="tilesVisible.title" ref="tile-title">
            <v-text-field :value="config.title"
                          :label="$t('general.chart_title')"
                          @input="setTitleDebounced"
                          hide-details
                          dense/>
          </control-tile>

          <control-tile v-if="tilesVisible.dimensions" ref="tile-dimensions">
            <v-radio-group v-model="config.dimensions.auto" :label="$t('general.dimensions.title')" row hide-details>
              <v-radio :label="$t('general.dimensions.auto')" :value="true" />
              <v-radio :label="$t('general.dimensions.manual')" :value="false" />
            </v-radio-group>

            <template v-if="!config.dimensions.auto">

              <v-text-field :value="config.dimensions.width"
                            :label="$t('general.dimensions.width')"
                            type="number"
                            hide-details
                            dense
                            @input="setWidthDebounced"
                            class="dimensions" />

              <v-text-field :value="config.dimensions.height"
                            :label="$t('general.dimensions.height')"
                            type="number"
                            hide-details
                            dense
                            @input="setHeightDebounced"
                            class="dimensions" />
            </template>
          </control-tile>

          <slot name="general" />
        </control-drawer>

        <control-drawer icon="mdi-palette"
                        :title="$t('colors.title')"
                        ref="drawer-colors"
                        v-if="drawersVisible.colors">

          <control-tile v-if="tilesVisible.colorPalette" ref="tile-colorPalette">
            <v-radio-group v-model="config.colorPalette" :label="$t('colors.palette.title')" row hide-details>
              <v-radio v-for="(palette, name) in colorPalettes"
                       :key="name"
                       :label="$te(`colors.palette.${name}`) ? $t(`colors.palette.${name}`) : name"
                       :value="name" />
            </v-radio-group>
            <helptip position="bottom" :width="480" style="flex: 0 0 auto">
              <span v-html="$t('colors.helptip')" />
            </helptip>
          </control-tile>

          <control-tile v-if="tilesVisible.colorBy" ref="tile-colorBy">
            <v-radio-group v-model="config.colorBy.field" :label="$t('colors.color_by.title')" row hide-details>
              <v-radio :label="$t('colors.color_by.category')" value="codeCategory" />
              <v-radio :label="$t('colors.color_by.code')" value="codeLabel" />
              <v-radio :label="$t('colors.color_by.dataset')" value="dsName" />
              <v-radio :label="$t('colors.color_by.groups')" value="colorByGroup" />
            </v-radio-group>
          </control-tile>
          <control-tile v-if="tilesVisible.colorBy" v-show="config.colorBy.field === 'colorByGroup'" class="overheight no-bg">
            <code-groups v-model="config.colorBy.group"
                         :codes="codes"
                         :default-group-name="$t('default_group_name')" />
          </control-tile>

          <slot name="colors" />

        </control-drawer>

        <control-drawer icon="mdi-format-text-rotation-none"
                        :title="$t('labels.title')"
                        ref="drawer-labels"
                        v-if="drawersVisible.labels">

          <control-tile v-if="tilesVisible.maxLabelLength" ref="tile-maxLabelLength">
            <v-slider :value="config.maxLabelLength"
                      :max="75"
                      :min="0"
                      :step="1"
                      @input="setMaxLabelLengthDebounced"
                      thumb-label="always"
                      thumb-size="20"
                      :label="$t('labels.max_length')"
                      dense
                      hide-details />
          </control-tile>

          <slot name="labels" />
        </control-drawer>

        <control-drawer icon="mdi-shape"
                        :title="$t('ordinal_axis.title')"
                        ref="drawer-ordinalAxis"
                        v-if="drawersVisible.ordinalAxis">

          <control-tile v-if="tilesVisible.ordinalAxisName" ref="tile-ordinalAxisName">
            <v-text-field :value="config.ordinalAxisName"
                          :label="$t('ordinal_axis.label')"
                          @input="setOrdinalAxisNameDebounced"
                          hide-details
                          dense/>

          </control-tile>

          <control-tile v-if="tilesVisible.reverseOrdinal">
            <v-switch v-model="config.reverseOrdinal"
                      color="green"
                      hide-details
                      :label="$t('ordinal_axis.reverse')" />
          </control-tile>

          <slot name="ordinal-axis" />

        </control-drawer>

        <control-drawer icon="mdi-chart-line-variant"
                        :title="$t('value_axis.title')"
                        ref="drawer-valueAxis"
                        v-if="drawersVisible.valueAxis">

          <control-tile v-if="tilesVisible.valueAxisName" ref="tile-valueAxisName">
            <v-text-field :value="config.valueAxisName"
                          :label="$t('value_axis.label')"
                          @input="setValueAxisNameDebounced"
                          hide-details
                          dense/>
          </control-tile>

          <slot name="value-axis" />
        </control-drawer>

        <control-drawer icon="mdi-tag-heart"
                        :title="$t('outputs.title')"
                        ref="drawer-outputs"
                        v-if="drawersVisible.outputs">

          <control-tile v-if="tilesVisible.plotCodes" ref="tile-plotCodes">
            <v-radio-group v-model="config.plotCodes.mode" :label="$t('outputs.codes.title')" row hide-details>
              <v-radio :label="$t('outputs.codes.all')" value="all" />
              <v-radio :label="$t('outputs.codes.exclude')" value="exclude" />
              <v-radio :label="$t('outputs.codes.include')" value="include" />
            </v-radio-group>

          </control-tile>

          <control-tile v-if="tilesVisible.plotCodes && config.plotCodes.mode !== 'all'" class="overheight no-bg">
            <code-select v-model="config.plotCodes.select"
                         :codes-options="codesAvailable"
                         :sync="true"
                         :close-on-select="false"
                         category-selectable
                         @keydown.native.enter.prevent.stop
                         style="flex: 1"
                         placeholder="Select codes" />
          </control-tile>

          <slot name="outputs" />
        </control-drawer>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>

import CodeSelect from '@/components/CodeSelect'
import CodeGroups from '@/components/visualize/CodeGroups'
import ControlDrawer from '@/components/visualize/ControlDrawer'
import ControlTile from '@/components/visualize/ControlTile'

export default {
  codit: true,
  name: 'ControlPane',

  components: {
    'control-drawer': ControlDrawer,
    'control-tile': ControlTile,
    'code-groups': CodeGroups,
    'code-select': CodeSelect
  },

  props: {
    value: { type: Object, default: () => ({}) },
    codes: { type: Array, default: () => ({}) },
    codesAvailable: { type: Array, default: () => ({}) },
    colorPalettes: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      config: {},
      availableTilesByDrawer: {
        general: ['title', 'dimensions'],
        colors: ['colorPalette', 'colorBy'],
        labels: ['maxLabelLength'],
        ordinalAxis: ['ordinalAxisName', 'reverseOrdinal'],
        valueAxis: ['valueAxisName'],
        outputs: ['plotCodes']
      },

      setMaxLabelLengthDebounced: _.debounce(val => {
        this.config.maxLabelLength = val
      }, 250),

      setTitleDebounced: _.debounce(val => {
        this.config.title = val
      }, 250),

      setOrdinalAxisNameDebounced: _.debounce(val => {
        this.config.ordinalAxisName = val
      }, 250),

      setValueAxisNameDebounced: _.debounce(val => {
        this.config.valueAxisName = val
      }, 250),

      setWidthDebounced: _.debounce(val => {
        this.config.dimensions.width = val
      }, 250),

      setHeightDebounced: _.debounce(val => {
        this.config.dimensions.height = val
      }, 250)
    }
  },

  computed: {
    drawersVisible () {
      return _.mapValues(this.availableTilesByDrawer, (tiles, drawer) => {
        return _.some(tiles, t => t in this.value) || !!this.$slots[drawer]
      })
    },

    tilesVisible () {
      return _.mapValues(this.value, () => true)
    },

    tiles2drawer () {
      let mapping = {}
      _.each(this.availableTilesByDrawer, (tiles, drawer) => tiles.forEach(t => { mapping[t] = drawer }))
      return mapping
    }
  },

  watch: {
    config: {
      deep: false,
      handler (val) {
        this.$emit('value', this.config)
      }
    }
  },

  created () {
    this.$set(this, 'config', this.value)
  },

  methods: {
    highlight (tile) {
      if (!(tile in this.tiles2drawer)) throw Error(`Tile '${tile}' is not a control pane element`)
      this.$refs[`drawer-${this.tiles2drawer[tile]}`].expand()
      setTimeout(() => this.$refs[`tile-${tile}`].highlight(), 200)
    }
  }
}

</script>

<i18n src='@/i18n/components/visualize/ControlPane.json'></i18n>
