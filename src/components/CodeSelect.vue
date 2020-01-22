<template>
  <div class="dropdown code-select"
       v-c-click-outside="onClickOutside"
       :class="dropdownClasses"
       @click="toggleDropdown"
       @mousemove="onMouseMove">
    <div ref="toggle"
         :class="['dropdown-toggle']">

      <draggable v-model="draggableValue"
                 draggable="div.code-chip"
                 :animation="150"
                 :fallback-tolerance="20"
                 :disabled="sortByOptions"
                 @start="draggingStarted"
                 @end="draggingCompleted"
                 style="align-self: center; flex: 1"
                 ref="draggable"
                 :class="{ 'is-dragging': isDragging, 'is-dragging-lazy': isDraggingLazy }">
        <code-chip v-for="(option, idx) in sortedValue"
                   :key="option.index"
                   :color="$color.getMedium(codeID2CatIdx[option])"
                   :category="codeID2Cat[option]"
                   :class="{ 'selected': idx === chipSelected }"
                   :deletable="true"
                   :active="true"
                   @click.native.prevent.stop="onCodeChipClick(idx, $event)"
                   @delete="deselect(option); jamesIncLocal('code_delete_balance')">{{ codeID2Code[option].label }}</code-chip>

        <input ref="search"
               v-model="search"
               @keydown="onKeyDown"
               @keydown.left.stop="onLeftDown"
               @keyup.left.stop="onLeftUp"
               @keydown.right.stop="onRight"
               @keydown.delete="onDeleteDown"
               @keyup.delete="onDeleteUp"
               @keydown.esc.prevent.stop="onEscape"
               @keydown.up.prevent.stop="typeAheadUp"
               @keydown.down.prevent.stop="typeAheadDown"
               @keydown.enter.prevent="typeAheadSelect"
               type="search"
               class="form-control"
               :disabled="disabled"
               :placeholder="searchPlaceholder"
               :readonly="!searchable"
               :style="{ width: isValueEmpty ? '100%' : 'auto' }"
               aria-label="Search for option">
      </draggable>

      <i v-if="!noDrop" ref="openIndicator" role="presentation" class="open-indicator"/>
    </div>

    <transition :name="transition">
      <div ref="dropdownMenu" v-if="dropdownOpen" class="dropdown-menu" :style="{ 'max-height': maxHeight }">
        <div class="dropdown-container" :class="{ 'no-rounded-border-bottom': allowNew }">
          <div class="categories-list" :class="{ 'selectable': categorySelectable }">
            <div v-for="(catOptions, category) in $_.groupBy(filteredOptions, 'category')"
                 :key="category"
                 :style="{ background: $color.getMedium(codeID2CatIdx[catOptions[0]['id']]),
                           height: String(catOptions.length * 27) + 'px' }"
                 :class="{ highlight: category === categoryPointer }"
                 :title="category"
                 @mouseover="onMouseOverCategory(category, $event)"
                 @click.stop.prevent="selectCategory(category)"
            ><span v-html="catOptions[0].categoryMatched"/>
            </div>
          </div>

          <ul class="codes-list" ref="codesList">
            <li v-for="(option, index) in filteredOptions"
                :key="option['id']"
                :class="{ active: isOptionSelected(option),
                          highlight: index === typeAheadPointer,
                          firstofcat: index===0 || filteredOptions[index-1]['category'] !== option['category'] }"
                @mouseover="onMouseOverOption(index, $event)"
                :style="{ background: $color.getSoft(codeID2CatIdx[option['id']]) }">
              <a @click.stop="select(option); jamesIncLocal('code_add_balance')" v-html="option['label']"/>
            </li>
          </ul>
        </div>

        <div v-if="!filteredOptions.length" class="no-options">{{ $t('no_matches') }}</div>
        <div class="new-code"
             v-if="allowNew"
             :class="{ highlight: newCodeSelected }"
             v-html="$t('create_new', { label: search})"
             @mouseover="onMouseOverNewCode"
             @mousedown.prevent.stop
             @click.stop.prevent="triggerNewCode(); jamesIncLocal('code_add_balance')"/>

      </div>
    </transition>
  </div>
</template>

<script>
// import Vuex from 'vuex'
import JamesMixin from '../mixins/james'
import codeUtils from '@/mixins/codeUtils'

import draggable from 'vuedraggable'

export default {
  codit: true,
  name: 'CodeSelect',
  components: {
    draggable
  },
  mixins: [JamesMixin, codeUtils],
  props: {
    /* eslint-disable vue/require-default-prop */
    /* eslint-disable vue/require-prop-types */
    /**
     * Contains the currently selected value. Very similar to a
     * `value` attribute on an <input>. You can listen for changes
     * using 'change' event using v-on
     * @type {Object||String||null}
     */
    value: {
      default: null
    },

    sync: {
      default: false
    },

    /**
     * If a new code creation may be triggered from this select
     * If true that option appears when no matches are found
     */

    allowNew: {
      type: Boolean,
      default: false
    },

    codesOptions: {
      type: Array,
      default () {
        return []
      }
    },

    /**
     * Disable the entire component.
     * @type {Boolean}
     */
    disabled: {
      type: Boolean,
      default: false
    },

    /**
     * Sets the max-height property on the dropdown list.
     * @deprecated
     * @type {String}
     */
    maxHeight: {
      type: String,
      default: '400px'
    },

    /**
     * Enable/disable filtering the options.
     * @type {Boolean}
     */
    searchable: {
      type: Boolean,
      default: true
    },

    /**
     * Equivalent to the `placeholder` attribute on an `<input>`.
     * @type {String}
     */
    placeholder: {
      type: String,
      default: ''
    },

    /**
     * Sets a Vue transition property on the `.dropdown-menu`. vue-select
     * does not include CSS for transitions, you'll need to add them yourself.
     * @type {String}
     */
    transition: {
      type: String,
      default: 'fade'
    },

    /**
     * Close a dropdown when an option is chosen. Set to false to keep the dropdown
     * open (useful when combined with multi-select, for example)
     * @type {Boolean}
     */
    closeOnSelect: {
      type: Boolean,
      default: false
    },

    /**
     * An optional callback function that is called each time the selected
     * value(s) change. When integrating with Vuex, use this callback to trigger
     * an action, rather than using :value.sync to retreive the selected value.
     * @type {Function}
     * @param {Object || String} val
     */
    onChange: {
      type: Function,
      default: function () {
        this.$emit('change')
      }
    },

    /**
     * Disable the dropdown entirely.
     * @type {Boolean}
     */
    noDrop: {
      type: Boolean,
      default: false
    },

    sortByOptions: {
      type: Boolean,
      default: false
    },

    categorySelectable: {
      type: Boolean,
      default: false
    },

    jamesIntegration: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      search: '',
      open: false,
      typeAheadPointer: -1,
      categoryPointer: null,
      chipSelected: -1,
      deleting: false,
      lefting: false,
      preventMouseOver: true,
      newCodeSelected: false,
      newCodeTriggeredFromHere: false,
      isDragging: false,
      // Variable that keeps activated after drag until the next mousemove
      // To fix https://bugs.chromium.org/p/chromium/issues/detail?id=410328
      isDraggingLazy: false
    }
  },

  computed: {
    sortedValue: {
      get () {
        if (this.sortByOptions) return _.sortBy(this.value, v => this.codeID2Idx[v])
        else return this.value
      }
    },

    draggableValue: {
      get () {
        return this.sortedValue
      },
      set (value) {
        this.$emit('resort', value)
      }
    },

    /**
     * Classes to be output on .dropdown
     * @return {Object}
     */
    dropdownClasses () {
      return {
        open: this.dropdownOpen,
        searching: this.searching,
        searchable: this.searchable,
        unsearchable: !this.searchable,
        disabled: this.disabled
      }
    },

    /**
     * Return the current state of the
     * search input
     * @return {Boolean} True if non empty value
     */
    searching () {
      return !!this.search
    },

    /**
     * Return the current state of the
     * dropdown menu.
     * @return {Boolean} True if open
     */
    dropdownOpen () {
      return this.noDrop ? false : this.open
    },

    /**
     * Return the placeholder string if it's set
     * & there is no value selected.
     * @return {String} Placeholder text
     */
    searchPlaceholder () {
      if (this.isValueEmpty && this.placeholder) {
        return this.placeholder
      }
    },

    codes () {
      return _(this.codesOptions).groupBy('category').flatMap().value()
    },

    /**
     * The currently displayed options, filtered
     * by the search elements value. If tagging
     * true, the search text will be prepended
     * if it doesn't already exist.
     *
     * @return {array}
     */
    filteredOptions () {
      let options = []
      let optionsByCategory = {}
      this.codeCats.forEach(c => { optionsByCategory[c] = { score: 0, codes: [] } })
      this.codes.forEach(option => {
        if (this.value.indexOf(option['id']) !== -1) return
        else {
          let terms = _.trim(this.search.toLowerCase()).split(' ')
          let lbl = option['label']
          let cat = option['category']
          let ident = String(option['id'])
          let catMatch = ''
          let identMatch = ''
          let lblMatch = ''

          let score = 0
          let found = true

          terms.forEach(t => {
            if (!found || t.length === 0) return

            let foundTerm = false

            // Search for matching category
            let idxCat = cat.toLowerCase().indexOf(t)
            if (idxCat !== -1) {
              // Remove the text portion and wrap + add it to resulting category string
              score -= Number(idxCat === 0) * 1000 - cat.length
              catMatch += cat.slice(0, idxCat) + '<b>' + cat.slice(idxCat, idxCat + t.length) + '</b>'
              cat = cat.slice(idxCat + t.length)
              foundTerm = true
            }

            // Search for matching identifier
            let idxIdent = ident.indexOf(t)
            if ((foundTerm && idxIdent === 0) || (!foundTerm && idxIdent !== -1)) {
              score -= Number(idxIdent === 0) * 1000 - ident.length
              identMatch += ident.slice(0, idxIdent) + '<b>' + ident.slice(idxIdent, idxIdent + t.length) + '</b>'
              ident = ident.slice(idxIdent + t.length)
              foundTerm = true
            }

            // Search for matching label
            let idxLbl = lbl.toLowerCase().indexOf(t)
            if ((foundTerm && idxLbl === 0) || (!foundTerm && idxLbl !== -1)) {
              score -= Number(idxLbl === 0) * 1000 - lbl.length
              lblMatch += lbl.slice(0, idxLbl) + '<b>' + lbl.slice(idxLbl, idxLbl + t.length) + '</b>'
              lbl = lbl.slice(idxLbl + t.length)
              foundTerm = true
            }

            found = found && foundTerm
          })
          if (found) {
            let opt = {
              id: option['id'],
              label: `<span>${identMatch}${ident}</span> ${lblMatch}${lbl}`,
              categoryMatched: catMatch + cat,
              category: option['category'],
              score
            }
            let optCat = optionsByCategory[option['category']]
            optCat.score = Math.min(score, optCat.score)
            optCat.codes.push(opt)
          }
        }
      })

      _.sortBy(optionsByCategory, 'score').forEach(cat => {
        _.sortBy(cat.codes, 'score').forEach(code => options.push(code))
      })

      return options
    },

    /**
     * Check if there aren't any options selected.
     * @return {Boolean}
     */
    isValueEmpty () {
      if (this.value) {
        if (typeof this.value === 'object') {
          return !Object.keys(this.value).length
        }
        return !this.value.length
      }

      return true
    }
  },

  watch: {
    /**
     * When the value prop changes, update
     * the internal value.
     * @param  {mixed} val
     * @return {void}
     */

    filteredOptions (opts) {
      this.typeAheadPointer = (this.search.length ? 0 : -1)
      this.categoryPointer = null
      this.newCodeSelected = opts.length === 0
    },

    typeAheadPointer (val) {
      this.maybeAdjustScroll()
      if (val !== -1) this.categoryPointer = null
      if (val !== this.filteredOptions.length) this.newCodeSelected = false
    },

    categoryPointer (val) {
      if (val !== null) this.typeAheadPointer = -1
    },

    search () {
      // If something is typed defocus the chip selection
      this.chipSelected = -1
      // Special case when there are no other codes: The `filteredOptions` property didn't change
      // therefore focus on the new code if anything is typed
      if (!this.filteredOptions.length && this.search) this.newCodeSelected = true
      else if (this.newCodeSelected) this.newCodeSelected = false
    },

    idx () {
      this.typeAheadPointer = -1
      this.chipSelected = -1
      this.categoryPointer = null
      this.deleting = false
      this.lefting = false
    }
  },

  /**
   * Clone props into mutable values,
   * attach any event listeners.
   */
  created () {
    if (!(this.codesOptions instanceof Array)) console.error('[vue-select] Expecting options to be of type Array')
    if (!(this.value instanceof Array)) console.error('[vue-select] Expecting value to be of type Array')
  },

  destroyed () {
  },

  methods: {
    draggingStarted () {
      this.isDraggingLazy = this.isDragging = true
      this.chipSelected = -1
    },

    onCodeChipClick (idx, e) {
      console.log('click')
      e.stopPropagation()
      // We need to manually call onDrop of sortable, otherwise a click would lead to the
      // dragging being disabled for some elements afterwards
      this.$refs.draggable._sortable._onDrop()
      this.search = ''
      this.chipSelected = idx
      this.focus()
      this.jamesIncLocal('code_select_balance')
    },

    draggingCompleted () {
      this.isDragging = false
      if (this.open) {
        this.focus()
      }
    },

    onValueChanged () {
      this.onChange ? this.onChange() : null
    },

    onMouseMove () {
      if (this.preventMouseOver) this.preventMouseOver = false
      if (!this.isDragging && this.isDraggingLazy) this.$nextTick(() => { this.isDraggingLazy = false })
    },

    onKeyDown () {
      this.preventMouseOver = true
    },

    focus () {
      this.$refs.search.focus()
    },

    blur () {
      this.$refs.search.blur()
    },

    /**
     * Select a given option.
     * @param  {Object|String} option
     * @return {void}
     */
    select (option) {
      if (this.sync) this.value.push(option['id'])
      this.$emit('addCode', option['id'])
      this.onAfterSelect()
    },

    selectCategory (category) {
      if (!this.categorySelectable) return
      this.codesByCat[category].forEach(c => {
        if (this.sync) this.value.push(c['id'])
        this.$emit('addCode', c['id'])
      })
      this.onAfterSelect()
    },

    /**
     * De-select a given option.
     * @param  {Object|String} option
     * @return {void}
     */
    deselect (optionIdentifier) {
      this.onValueChanged()
      if (this.sync) {
        var index = this.value.indexOf(optionIdentifier)
        this.value.splice(index, 1)
      }
      this.$emit('removeCode', optionIdentifier)
    },

    /**
     * Called from this.select after each selection.
     * @param  {Object|String} option
     * @return {void}
     */
    onAfterSelect () {
      // unselect chips
      this.chipSelected = -1
      if (this.closeOnSelect) {
        this.open = !this.open
        this.closeDropdown()
      } else {
        this.focus()
      }
      this.onValueChanged()
      this.search = ''
    },

    /**
     * Toggle the visibility of the dropdown menu.
     * @param  {Event} e
     * @return {void}
     */
    toggleDropdown (e) {
      if (this.open) {
        this.closeDropdown()
      } else {
        if (!this.disabled) {
          this.openDropdown()
        }
      }
    },

    /**
     * Check if the given option is currently selected.
     * @param  {Object|String}  option
     * @return {Boolean}        True when selected | False otherwise
     */
    isOptionSelected (option) {
      if (this.value) {
        let selected = false
        this.value.forEach(opt => {
          if (typeof opt === 'object' && opt['label'] === option['label']) {
            selected = true
          } else if (typeof opt === 'object' && opt['label'] === option) {
            selected = true
          } else if (opt === option) {
            selected = true
          }
        })
        return selected
      }

      return this.value === option
    },

    /**
     * If there is any text in the search input, remove it.
     * Otherwise, blur the search input to close the dropdown.
     * @return {void}
     */
    onEscape (e) {
      // If it's coming from the closing of the new codes dialog, ignore
      if (this.newCodeTriggeredFromHere) return
      if (!this.search.length) {
        this.closeDropdown()
      } else {
        this.search = ''
      }
    },

    /**
     * If there is normal text, do nothing
     * Otherwise, toggle selected tag, making it deletable
     * @return {void}
     */
    onLeftDown (e) {
      if (!this.$refs.search.selectionStart && this.value.length > 0 && !this.lefting) {
        if (this.search.length) this.search = ''
        else {
          if (e.shiftKey && this.chipSelected > 0) {
            // Move the code to the left, if it's not already the leftmost
            let resorted = _.clone(this.value)
            resorted.splice(this.chipSelected - 1, 0, resorted.splice(this.chipSelected, 1)[0])
            this.draggableValue = resorted
            this.chipSelected -= 1
          } else {
            this.chipSelected = (this.chipSelected === -1 ? this.value.length - 1 : Math.max(0, this.chipSelected - 1))
          }
          this.jamesDecLocal('code_select_balance')
        }
      }
      this.lefting = true
    },

    onLeftUp (e) {
      this.lefting = false
    },

    onRight (e) {
      if (!this.$refs.search.selectionStart && this.value.length > 0 && this.chipSelected !== -1) {
        if (e.shiftKey && this.chipSelected < (this.value.length - 1)) {
          // Move the code to the left, if it's not already the leftmost
          let resorted = _.clone(this.value)
          resorted.splice(this.chipSelected + 1, 0, resorted.splice(this.chipSelected, 1)[0])
          this.draggableValue = resorted
          this.chipSelected += 1
        } else this.chipSelected = (this.chipSelected === this.value.length - 1 ? -1 : this.chipSelected + 1)
        this.jamesDecLocal('code_select_balance')
      }
    },

    /**
     * Close the dropdown on click outside.
     * @emits  {search:click-outside}
     * @return {void}
     */
    onClickOutside () {
      if (!this.open) return
      this.closeDropdown()
    },

    closeDropdown () {
      // Don't blur if we opened the code menu
      if (this.newCodeTriggeredFromHere) return
      this.blur()
      this.search = ''
      this.open = false
      this.chipSelected = -1
      this.$emit('search:blur')
    },

    openDropdown () {
      this.open = true
      this.focus()
      this.typeAheadPointer = -1
      this.chipSelected = -1
    },

    /**
     * Open the dropdown on focus.
     * @emits  {search:focus}
     * @return {void}
     */
    /* onSearchFocus () {
      this.open = true
      this.typeAheadPointer = -1
      this.$emit('search:focus')
    }, */

    /**
     * Delete the value on Delete keypress when there is no
     * text in the search input, & there's tags to delete
     * @return {this.value}
     */
    onDeleteDown () {
      if (!this.$refs.search.value.length && this.value && !this.deleting) {
        if (this.value.length > 0) {
          if (this.chipSelected !== -1) {
            this.jamesDecLocal('code_delete_balance')
            this.deselect(this.value[this.chipSelected])
            this.chipSelected = (this.value.length === 0 ? this.chipSelected = -1 : Math.max(0, this.chipSelected - 1))
          } else this.chipSelected = this.value.length - 1
        }
      }
      this.deleting = true
    },

    onDeleteUp () {
      this.deleting = false
    },

    /**
     * Move the typeAheadPointer visually up the list by
     * subtracting the current index by one.
     * @return {void}
     */
    typeAheadUp () {
      if (this.typeAheadPointer >= 0) {
        this.typeAheadPointer--
        if (this.maybeAdjustScroll) {
          this.maybeAdjustScroll(true)
        }
      }

      if (this.allowNew && this.typeAheadPointer !== this.filteredOptions.length) this.newCodeSelected = false
    },

    /**
     * Move the typeAheadPointer visually down the list by
     * adding the current index by one.
     * @return {void}
     */
    typeAheadDown () {
      if (this.typeAheadPointer < (this.filteredOptions.length - !this.allowNew)) {
        this.typeAheadPointer++
        if (this.maybeAdjustScroll) {
          this.maybeAdjustScroll(true)
        }
      }

      if (this.allowNew && this.typeAheadPointer === this.filteredOptions.length) this.newCodeSelected = true
    },

    /**
     * Select the option at the current typeAheadPointer position.
     * Optionally clear the search input on selection.
     * @return {void}
     */
    typeAheadSelect (e) {
      // If there is something written, stop propagation
      if (this.typeAheadPointer !== -1 || this.categoryPointer !== null) e.stopPropagation()
      if (this.newCodeSelected) {
        this.triggerNewCode()
        e.stopPropagation()
        return
      }
      if (this.categoryPointer !== null) {
        this.jamesDecLocal('code_add_balance')
        this.selectCategory(this.categoryPointer)
      } else if (this.filteredOptions[ this.typeAheadPointer ]) {
        this.jamesDecLocal('code_add_balance')
        this.select(this.filteredOptions[ this.typeAheadPointer ])
      }
      this.search = ''
    },

    triggerNewCode () {
      if (!this.allowNew) return
      this.newCodeTriggeredFromHere = true
      this.$store.commit('triggerNewCode', { name: this.search, cb: this.newCodeCB })
    },

    /**
     * Adjust the scroll position of the dropdown list
     * if the current pointer is outside of the
     * overflow bounds.
     * @returns {*}
     */

    maybeAdjustScroll (isKeyEvent = false) {
      let pixelsToPointerTop = this.pixelsToPointerTop()
      let pixelsToPointerBottom = this.pixelsToPointerBottom()

      if (pixelsToPointerTop <= this.viewport().top) {
        return this.scrollTo(pixelsToPointerTop, isKeyEvent)
      } else if (pixelsToPointerBottom >= this.viewport().bottom) {
        return this.scrollTo(this.viewport().top + this.pointerHeight(), isKeyEvent)
      }
    },

    /**
     * The distance in pixels from the top of the dropdown
     * list to the top of the current pointer element.
     * @returns {number}
     */
    pixelsToPointerTop () {
      let pixelsToPointerTop = 0
      if (this.$refs.codesList) {
        for (let i = 0; i < this.typeAheadPointer; i++) {
          pixelsToPointerTop += this.$refs.codesList.children[i].offsetHeight
        }
      }
      return pixelsToPointerTop
    },

    /**
     * The distance in pixels from the top of the dropdown
     * list to the bottom of the current pointer element.
     * @returns {*}
     */
    pixelsToPointerBottom () {
      return this.pixelsToPointerTop() + this.pointerHeight()
    },

    /**
     * The offsetHeight of the current pointer element.
     * @returns {number}
     */
    pointerHeight () {
      let element = this.$refs.codesList ? this.$refs.codesList.children[this.typeAheadPointer] : false
      return element ? element.offsetHeight : 0
    },

    /**
     * The currently viewable portion of the codesList.
     * @returns {{top: (string|*|number), bottom: *}}
     */
    viewport () {
      return {
        top: this.$refs.dropdownMenu ? this.$refs.dropdownMenu.scrollTop : 0,
        bottom: this.$refs.dropdownMenu ? this.$refs.dropdownMenu.offsetHeight + this.$refs.dropdownMenu.scrollTop : 0
      }
    },

    /**
     * Scroll the codesList to a given position.
     * @param position
     * @returns {*}
     */
    scrollTo (position, isKeyEvent) {
      // Prevent mouseover event from firing just after this
      if (this.$refs.dropdownMenu) {
        this.$refs.dropdownMenu.scrollTop = position
        return position
      } else return null
    },

    onMouseOverOption (index, e) {
      // Only fire if the mouse really moved
      if (this.preventMouseOver) return
      this.typeAheadPointer = index
    },

    onMouseOverCategory (category, e) {
      if (!this.categorySelectable) return
      // Only fire if the mouse really moved
      if (this.preventMouseOver) return
      this.categoryPointer = category
    },

    onMouseOverNewCode () {
      if (this.preventMouseOver) return
      this.newCodeSelected = true
      this.typeAheadPointer = this.filteredOptions.length
    },

    newCodeCB (codeID) {
      // If new code has been triggered from here, refocus on the select
      this.focus()
      // If a new code has been created...
      if (codeID !== null) {
        // Add the new option directly to the codes
        this.$nextTick(() => this.select(this.codeID2Code[codeID]))
      }
      // We need to give some timeout, otherwise the escape will still be triggered in some cases
      setTimeout(() => { this.newCodeTriggeredFromHere = false }, 200)
    },

    /**
     * Proxy function, forwarding to the James mixin if integration is activated
     */
    jamesIncLocal (val) {
      if (this.jamesIntegration) this.jamesInc(val)
    },

    /**
     * Proxy function, forwarding to the James mixin if integration is activated
     */
    jamesDecLocal (val) {
      if (this.jamesIntegration) this.jamesDec(val)
    }
  }
}

</script>

<style lang=scss>

.code-select {

  position: relative;

  &, * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  /* Search Input */
  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration {
    display: none;
  }
  input[type="search"]::-ms-clear {
    display: none;
  }
  input[type="search"],
  input[type="search"]:focus {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    line-height: 36px;
    font-size: 16px;
    height: 38px;
    display: inline-block;
    border: none;
    outline: none;
    margin: 0;
    padding: 0 .5em;
    width: 10em;
    max-width: 100%;
    background: none;
    position: relative;
    box-shadow: none;
  }

  &.single.searching:not(.open) input[type="search"] {
    opacity: .2;
  }

  input[type="search"]::placeholder {
    font-size: 16px;
    color: rgba(0,0,0,.54);
  }

  /* Open Indicator */
  .open-indicator {
    position: absolute;
    bottom: 6px;
    right: 10px;
    display: inline-block;
    cursor: pointer;
    pointer-events: all;
    transition: all 150ms cubic-bezier(1.000, -0.115, 0.975, 0.855);
    transition-timing-function: cubic-bezier(1.000, -0.115, 0.975, 0.855);
    opacity: 1;
    height: 20px; width: 10px;
  }
  .open-indicator:before {
    border-color: rgba(60, 60, 60, .5);
    border-style: solid;
    border-width: 3px 3px 0 0;
    content: '';
    display: inline-block;
    height: 10px;
    width: 10px;
    vertical-align: top;
    transform: rotate(133deg);
    transition: all 150ms cubic-bezier(1.000, -0.115, 0.975, 0.855);
    transition-timing-function: cubic-bezier(1.000, -0.115, 0.975, 0.855);
    box-sizing: inherit;
  }
  /* Open Indicator States */
  &.open .open-indicator:before {
    transform: rotate(315deg);
    border-color: var(--v-primary-base);
  }
  &.open .open-indicator {
    bottom: 1px;
  }
  /* Dropdown Toggle */
  .dropdown-toggle {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin-top: 1px;
    display: flex;
    white-space: normal;
    vertical-align: middle;
    border: none;
  }

  .sortable-drag, .is-dragging .code-chip { .delete-btn { display: none } }

  /*
  Chromium bugfix (see data.isDraggingLazy): When you move the ghost elements over other elements
  They will change their status to hover, but only *after* the ghost element is dropped. Use this lazy
  state to keep the override on background until the mouse is moved again and thus the false hover
  status is removed from the code-chip
  */
  .is-dragging-lazy {
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

  /* Dropdown Toggle States */
  &.searchable .dropdown-toggle {
    cursor: text;
  }
  &.unsearchable .dropdown-toggle {
    cursor: pointer;
  }
  &.open .dropdown-toggle {
    border-bottom-color: transparent;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  /* Dropdown Menu */
  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 49;
    min-width: 160px;
    padding: 0;
    margin: 2px 0 0;
    width: 100%;
    overflow-y: scroll;
    border: 1px solid rgba(0, 0, 0, .26);
    box-shadow: 0px 3px 6px 0px rgba(0,0,0,.15);
    border-radius: 6px;
    text-align: left;
    list-style: none;
    background: #FFF;

    li {
      line-height: 27px; /* Normalize line height */
      height: 27px;
      overflow: hidden;
      margin: 0!important;
      padding: 0;
      border: none;
    }

    li a {
      color: #212121;
      cursor: pointer;
      display: inline-block;
      width: 100%;
      height: 100%;
      padding: 0px 20px;
      white-space: nowrap;
    }

    li a:hover {
      color: #212121;
    }

    li.highlight > a, div.highlight {
      /*
       * required to override bootstrap 3's
       * .dropdown-menu > li > a:hover {} styles
       */
      background: #607d8b!important;
      color: #FFF!important;
    }

    li.firstofcat {
      border-top: 1px solid #FFF;
    }

    .no-options, .new-code {
      line-height: 27px;
      height: 27px;
      color: #212121;
      text-align: center;
    }

    .new-code {
      margin: 0 0px 1px 1px;
      border-bottom-right-radius: 6px;
      border-bottom-left-radius: 6px;
      background: repeating-linear-gradient(45deg, transparent, transparent 3px, #DEDEDE 3px, #DEDEDE 16px);
      cursor: pointer;
    }

    .new-code.highlight {
      background: #607d8b;
      color: #FFF;
    }

    b {
      font-weight: 900;
      color: #000;
    }

    .dropdown-container {
      border-left: 1px solid #FFF;
      border-bottom: 1px solid #FFF;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      &.no-rounded-border-bottom {
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
      }
    }

    .categories-list {
      flex: 1 1 auto;
      max-width: 50%;

      &.selectable > div {
          cursor: pointer;
          span { cursor: pointer; }
      }

       > div {
        border-top: 1px solid #FFF;
        color: #FFF;
        font-weight: bold;
        display: flex;
        padding-left: 15px;
        overflow: hidden;

          span {
            margin: auto 0;
            cursor: default;

          }
        b {
          color: #212121;
        }
      }
    }

    .codes-list {
      flex: 1 1 auto;
      margin: 0;
      display: block;
      padding: 0;
      span {
        display: inline-block;
        opacity: 0.7;
        font-style: italic;
        text-align: right;
        width: 35px;
        margin-right: 10px;
        margin-left: -8px;
      }
    }
  }

  .dropdown-menu >
  .highlight:not(:last-child) {
    margin-bottom: 0; /* Fixes Bulma Margin */
  }

  /* Disabled state */
  &.disabled .dropdown-toggle,
  &.disabled .dropdown-toggle input,
  &.disabled .open-indicator {
    cursor: not-allowed;
    background-color: rgb(248, 248, 248);
  }

  /* Dropdown Default Transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity .15s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
}

</style>

<i18n>
{
  "de": {
    "no_matches": "Keine passenden Codes",
    "create_new": "Neuen Code <em>{label}</em> erstellen"
  },
  "en": {
    "no_matches": "No matching codes",
    "create_new": "Create new code <em>{label}</em>"
  }
}
</i18n>
