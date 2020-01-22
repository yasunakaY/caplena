<template>
  <div class="code-groups-draggable"
       @mousemove="onMouseMove"
       :class="{ 'is-dragging': isDragging, 'is-dragging-lazy': isDraggingLazy }">

    <div style="text-align: center"><em>{{ $t('groups.instructions') }}</em></div>

    <div v-for="(group, groupIdx) in groups" :key="groupIdx" class="group">
      <v-text-field outlined dense v-model="group.name" hide-details class="title-input" />

      <v-icon v-if="groups.length > 2" class="btn-remove" @click="removeGroup(groupIdx)" color="grey">mdi-close</v-icon>

      <draggable class="group-list"
                 :list="group.list"
                 group="codes"
                 :animation="150"
                 @change="change"
                 @start="draggingStarted"
                 @end="draggingCompleted">
        <code-chip v-for="code in group.list"
                   :key="code.id"
                   :color="$color.getMedium(codeCat2CatIdx[code.category])"
                   :category="code.category"
                   :class="{ highlight: code.dropped, removed: code.removed }"
                   active>{{ code.label }}</code-chip>

      </draggable>
    </div>
    <v-btn depressed small @click="newGroup()" class="btn-new">
      <v-icon color="grey">mdi-plus</v-icon> {{ $t('groups.new_group') }}
    </v-btn>
  </div>
</template>

<script>

import draggable from 'vuedraggable'

import codeUtils from '@/mixins/codeUtils'

export default {
  codit: true,
  name: 'CodeGroups',
  components: {
    draggable
  },

  mixins: [codeUtils],

  props: {
    value: { type: Object, default: () => ({}) },
    codes: { type: Array, default: () => [] },
    defaultGroupName: { type: String, default: function () { return this.$t('groups.default_group_name') } }
  },

  data () {
    return {
      groups: [],
      isDraggingLazy: false,
      isDragging: false,
      initialized: false
    }
  },

  computed: {
    codeID2group () {
      let mapping = {}
      this.groups.forEach(g => {
        g.list.forEach(c => { mapping[c.id] = g.name })
      })
      return mapping
    }
  },

  watch: {
    value: {
      immediate: true,
      handler (value) {
        if (this.codeID2group === value) return
        this.groups.splice(0)
        let groups = _(value).values().uniq().value()
        let groupToIdx = {}
        groups.forEach((gName, gIdx) => {
          groupToIdx[gName] = gIdx
          this.newGroup(gName)
        })

        _.forEach(value, (gName, codeID) => { this.groups[groupToIdx[gName]].list.push(this.codes[this.codeID2Idx[codeID]]) })

        while (this.groups.length < 2) this.newGroup()
        this.checkForUnassignedCodes()

        this.initialized = true
      }
    },

    codes (codes) {
      if (this.initialized) this.checkForUnassignedCodes()
    },

    codeID2group: {
      immediate: true,
      handler: 'emitValue'
    }
  },

  methods: {
    emitValue () {
      if (!_.isEqual(this.value, this.codeID2group)) this.$emit('input', this.codeID2group)
    },

    checkForUnassignedCodes () {
      // Check for codes which are not in internal mapping -> add them
      this.codes.forEach(c => {
        if (!(c.id in this.codeID2group)) this.groups[0].list.push(c)
      })
      // Check if there are codes in internal mapping which are not in codes -> remove them
      if (this.codes.length !== _.sumBy(this.groups, g => g.list.length)) {
        this.groups.forEach(g => this.$set(g, 'list', _.filter(g.list, c => !!_.find(this.codes, { id: c.id }))))
      }
    },

    newGroup (name) {
      this.groups.push({
        name: name || `${this.defaultGroupName} ${this.groups.length + 1}`,
        list: []
      })
    },

    removeGroup (groupIdx) {
      let removedList = this.groups[groupIdx].list
      this.groups.splice(groupIdx, 1)
      removedList.forEach(c => {
        c.removed = true
        this.groups[0].list.push(c)
      })
    },

    change (evt) {
      if (evt.added) evt.added.element.dropped = true
    },

    draggingStarted () {
      this.isDraggingLazy = this.isDragging = true
    },

    draggingCompleted () {
      this.isDragging = false
    },

    onMouseMove () {
      if (!this.isDragging && this.isDraggingLazy) this.$nextTick(() => { this.isDraggingLazy = false })
    }
  }
}

</script>

<style lang=scss>

.code-groups-draggable {
  position: relative;
  flex: 1;

  .group {
    margin: 14px 0 20px;
    min-height: 40px;
    position: relative;
    flex: 1;
    background: #DEDEDE;
    padding: 16px 6px 6px;
    border-radius: 6px;

    .title-input {
      font-size: 14px;
      width: 90px;
      position: absolute;
      top: -8px;
      right: 25px;
      .v-input__slot {
        min-height: 0;
        padding: 0 8px;
        background: #FFF!important;
        input {
          margin: 0;
          padding: 1px 0;
        }
      }
      &:not(.v-input--is-focused) .v-input__slot fieldset {
        /* border: 2px solid $col-ans-bg; */
        border: 2px solid #DEDEDE;
      }
      &:hover .v-input__slot fieldset {
        border: 2px solid rgba(0,0,0,.86);
      }
    }

    .btn-remove {
      cursor: pointer;
      position: absolute;
      font-size: 18px;
      right: 4px;
      top: -8px;
    }
  }

  .btn-new {
    display: block;
    width: 70%;
    margin: -5px auto 10px auto;
    color: #9e9e9e;
  }

  .group-list {
    height: 100%;
  }

  /*
  Chromium bugfix (see data.isDraggingLazy): When you move the ghost elements over other elements
  They will change their status to hover, but only *after* the ghost element is dropped. Use this lazy
  state to keep the override on background until the mouse is moved again and thus the false hover
  status is removed from the code-chip
  */

  &.is-dragging-lazy {
    .code-chip, .code-chip:hover {
      background: #FFF!important;
      .v-icon {
        color: #AAA!important;
      }
    }
  }

  .code-chip {
    &.sortable-ghost {
      opacity: 0.5;
      background: #BDBDBD;
    }
  }

  .code-chip.highlight {
    animation: highlight-ani 1s;
  }

  .code-chip.removed {
    animation: highlight-ani 8s;
  }
}

</style>

<i18n src='@/i18n/components/visualize/ChartGlobals.json'></i18n>
