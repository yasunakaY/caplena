<template>
  <div class="dropdown label-select" :class="dropdownClasses" @mousemove="onMouseMove">
    <div ref="toggle" @mousedown.prevent="toggleDropdown" :class="['dropdown-toggle']">
      <div class="stuff" @mousedown.prevent.stop="toggleDropdown">
        <code-chip v-for="(option, idx) in value"
                   :key="idx"
                   :color="$color.getMedium(options.indexOf(option))"
                   :avatar-char="option[0]"
                   :class="{ 'selected': idx === chipSelected }"
                   :deletable="true"
                   :active="true"
                   @click.native.stop="search='';chipSelected=idx;focus()"
                   @delete="deselect(option)">{{ option }}</code-chip>

        <input ref="search"
               :style="{ width: search.length || searchPlaceholder ? '10em' : '0.1em' }"
               v-model="search"
               @keydown="onKeyDown"
               @keydown.left.stop="onLeftDown"
               @keyup.left.stop="onLeftUp"
               @keydown.right.stop="onRight"
               @keydown.delete="onDeleteDown"
               @keyup.delete="onDeleteUp"
               @keyup.esc.stop="onEscape"
               @keydown.up.prevent.stop="typeAheadUp"
               @keydown.down.prevent.stop="typeAheadDown"
               @keydown.enter.prevent="typeAheadSelect"
               @blur="onSearchBlur"
               @focus="onSearchFocus"
               type="search"
               class="form-control"
               :disabled="disabled"
               :placeholder="searchPlaceholder"
               :readonly="!searchable"
               :id="inputId"
               aria-label="Search for option">
      </div>

      <i v-if="!noDrop" ref="openIndicator" role="presentation" class="open-indicator"/>
    </div>

    <transition :name="transition">
      <div ref="dropdownMenu" v-if="dropdownOpen" class="dropdown-menu" :style="{ 'max-height': maxHeight }">
        <div class="dropdown-container">
          <ul class="labels-list" ref="labelsList">
            <li v-for="(option, idx) in filteredOptions"
                :key="option.idx"
                :class="{ active: isOptionSelected(options[option.idx]),
                          highlight: idx === typeAheadPointer,
                          firstofcat: idx===0 }"
                @mouseover="onMouseOverOption(idx, $event)"
                :style="{ background: $color.getSoft(option.idx) }">
              <a @mousedown.prevent="select(options[option.idx])" v-html="option.label"/>
            </li>
          </ul>
        </div>
        <template v-if="!filteredOptions.length">
          <div class="no-options">{{ (allowNew && !search.length ? $t('no_matches_allownew') : $t('no_matches') ) }}</div>
          <div class="new-label"
               v-if="allowNew&&search.length"
               :class="{ highlight: newLabelSelected }"
               v-html="$t('create_new', { label: search})"
               @mouseover="newLabelSelected=true"
               @mouseout="newLabelSelected=false"
               @mousedown.prevent="triggerNewLabel()"/>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  codit: true,
  name: 'LabelSelect',
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
     * If a new label creation may be triggered from this select
     * If true that option appears when no matches are found
     */

    allowNew: {
      type: Boolean,
      default: false
    },

    /**
     * An array of strings or objects to be used as dropdown choices.
     * @type {Array}
     */
    options: {
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

    /**
     * Sets the id of the input element.
     * @type {String}
     * @default {null}
     */
    inputId: {
      type: String
    }
  },

  data () {
    return {
      search: '',
      open: false,
      typeAheadPointer: -1,
      chipSelected: -1,
      deleting: false,
      lefting: false,
      preventMouseOver: true,
      newLabelSelected: false
    }
  },

  computed: {

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
      this.options.forEach((option, idx) => {
        if (this.value.indexOf(option) !== -1) return
        else {
          let terms = _.trim(this.search.toLowerCase()).split(' ')
          let lbl = option
          let label = ''
          let found = true
          terms.forEach(t => {
            if (t.length === 0) return
            let idxLbl = lbl.toLowerCase().indexOf(t)
            if (idxLbl === -1) {
              found = false
            } else {
              label += lbl.slice(0, idxLbl) + '<b>' + lbl.slice(idxLbl, idxLbl + t.length) + '</b>'
              lbl = lbl.slice(idxLbl + t.length)
            }
          })
          let opt = { label: label + lbl, idx }
          if (found) options.push(opt)
        }
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
      this.newLabelSelected = opts.length === 0
    },

    typeAheadPointer () {
      this.maybeAdjustScroll()
    },

    search () {
      // If something is typed defocus the chip selection
      this.chipSelected = -1
      // Special case when there are no other labels: The `filteredOptions` property didn't change
      // therefore focus on the new code if anything is typed
      if (!this.filteredOptions.length && this.search) this.newLabelSelected = true
      else if (this.newLabelSelected) this.newLabelSelected = false
    }
  },

  /**
   * Clone props into mutable values,
   * attach any event listeners.
   */
  created () {
    if (!(this.options instanceof Array)) console.error('[vue-select] Expecting options to be of type Array')
    if (!(this.value instanceof Array)) console.error('[vue-select] Expecting value to be of type Array')
  },

  destroyed () {
  },

  methods: {
    onValueChanged () {
      this.onChange ? this.onChange() : null
    },

    onMouseMove () {
      this.preventMouseOver = false
    },

    onKeyDown () {
      this.preventMouseOver = true
    },

    focus () {
      this.$refs.search.focus()
    },

    /**
     * Select a given option.
     * @param  {Object|String} option
     * @return {void}
     */
    select (option) {
      this.onValueChanged()
      if (this.sync) this.value.push(option)
      this.$emit('addLabel', option)
      this.onAfterSelect(option)
    },

    /**
     * De-select a given option.
     * @param  {Object|String} option
     * @return {void}
     */
    deselect (option) {
      this.onValueChanged()
      if (this.sync) {
        var index = this.value.indexOf(option)
        this.value.splice(index, 1)
      }
      this.$emit('removeLabel', option)
    },

    /**
     * Called from this.select after each selection.
     * @param  {Object|String} option
     * @return {void}
     */
    onAfterSelect (option) {
      // unselect chips
      this.chipSelected = -1
      if (this.closeOnSelect) {
        this.open = !this.open
        this.$refs.search.blur()
      }

      this.search = ''
    },

    /**
     * Toggle the visibility of the dropdown menu.
     * @param  {Event} e
     * @return {void}
     */
    toggleDropdown (e) {
      if (this.open) {
        this.$refs.search.blur() // dropdown will close on blur
      } else {
        if (!this.disabled) {
          this.open = true
          this.$refs.search.focus()
        }
      }
    },

    /**
     * Check if the given option is currently selected.
     * @param  {Object|String}  option
     * @return {Boolean}        True when selected | False otherwise
     */
    isOptionSelected (option) {
      if (this.value.indexOf(option) !== -1) return true
    },

    /**
     * If there is any text in the search input, remove it.
     * Otherwise, blur the search input to close the dropdown.
     * @return {void}
     */
    onEscape (e) {
      if (!this.search.length) {
        this.$refs.search.blur()
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
          this.chipSelected = (this.chipSelected === -1 ? this.value.length - 1 : Math.max(0, this.chipSelected - 1))
        }
      }
      this.lefting = true
    },

    onLeftUp (e) {
      this.lefting = false
    },

    onRight () {
      if (!this.$refs.search.selectionStart && this.value.length > 0 && this.chipSelected !== -1) {
        this.chipSelected = (this.chipSelected === this.value.length - 1 ? -1 : this.chipSelected + 1)
      }
    },

    /**
     * Close the dropdown on blur.
     * @emits  {search:blur}
     * @return {void}
     */
    onSearchBlur () {
      this.search = ''
      this.open = false
      this.chipSelected = -1
      this.$emit('search:blur')
    },

    /**
     * Open the dropdown on focus.
     * @emits  {search:focus}
     * @return {void}
     */
    onSearchFocus () {
      this.open = true
      this.typeAheadPointer = -1
      this.$emit('search:focus')
    },

    /**
     * Delete the value on Delete keypress when there is no
     * text in the search input, & there's tags to delete
     * @return {this.value}
     */
    onDeleteDown () {
      if (!this.$refs.search.value.length && this.value && !this.deleting) {
        if (this.value.length > 0) {
          if (this.chipSelected !== -1) {
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

      if (this.allowNew && this.filteredOptions.length === 0) this.newLabelSelected = false
    },

    /**
     * Move the typeAheadPointer visually down the list by
     * adding the current index by one.
     * @return {void}
     */
    typeAheadDown () {
      if (this.typeAheadPointer < this.filteredOptions.length - 1) {
        this.typeAheadPointer++
        if (this.maybeAdjustScroll) {
          this.maybeAdjustScroll(true)
        }
      }

      if (this.allowNew && this.filteredOptions.length === 0) this.newLabelSelected = true
    },

    /**
     * Select the option at the current typeAheadPointer position.
     * Optionally clear the search input on selection.
     * @return {void}
     */
    typeAheadSelect (e) {
      // If there is something written, stop propagation
      if (this.typeAheadPointer !== -1) e.stopPropagation()
      if (this.newLabelSelected && this.filteredOptions.length === 0) {
        this.triggerNewLabel()
        e.stopPropagation()
        return
      }
      if (this.filteredOptions[ this.typeAheadPointer ]) {
        this.select(this.options[this.filteredOptions[ this.typeAheadPointer ]['idx']])
      }
      this.search = ''
    },

    triggerNewLabel () {
      if (!this.allowNew) return
      this.$emit('new-label', this.search)
      this.search = ''
      this.chipSelected = -1
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
      if (this.$refs.labelsList) {
        for (let i = 0; i < this.typeAheadPointer; i++) {
          pixelsToPointerTop += this.$refs.labelsList.children[i].offsetHeight
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
      let element = this.$refs.labelsList ? this.$refs.labelsList.children[this.typeAheadPointer] : false
      return element ? element.offsetHeight : 0
    },

    /**
     * The currently viewable portion of the labelsList.
     * @returns {{top: (string|*|number), bottom: *}}
     */
    viewport () {
      return {
        top: this.$refs.dropdownMenu ? this.$refs.dropdownMenu.scrollTop : 0,
        bottom: this.$refs.dropdownMenu ? this.$refs.dropdownMenu.offsetHeight + this.$refs.dropdownMenu.scrollTop : 0
      }
    },

    /**
     * Scroll the labelsList to a given position.
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
    }
  }
}

</script>

<style lang=scss scoped>
.label-select {
  position: relative;
}

.label-select,
.label-select * {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.label-select .stuff {
  align-self: center;
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  padding-right: 40px;
}

/* Search Input */
.label-select input[type="search"]::-webkit-search-decoration,
.label-select input[type="search"]::-webkit-search-cancel-button,
.label-select input[type="search"]::-webkit-search-results-button,
.label-select input[type="search"]::-webkit-search-results-decoration {
  display: none;
}
.label-select input[type="search"]::-ms-clear {
  display: none;
}
.label-select input[type="search"],
.label-select input[type="search"]:focus {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  line-height: 36px;
  font-size:16px;
  height: 38px;
  display: inline-block;
  border: none;
  outline: none;
  margin: 0;
  padding: 0 0;
  max-width: 100%;
  background: none;
  position: relative;
  box-shadow: none;
  flex: 1 1 auto;
}

.label-select.single.searching:not(.open) input[type="search"] {
  opacity: .2;
}

.label-select input[type="search"]::placeholder {
  font-size: 16px;
  color: rgba(0,0,0,.54);
}

/* Open Indicator */
.label-select .open-indicator {
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
.label-select .open-indicator:before {
  border-color: rgba(0,0,0,.54);
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
.label-select.open .open-indicator:before {
  transform: rotate(315deg);
}
.label-select.open .open-indicator {
  bottom: 1px;
}
/* Dropdown Toggle */
.label-select .dropdown-toggle {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin-top: 1px;
  display: flex;
  flex: 1;
  white-space: normal;
  vertical-align: middle;
  border: none;

}
/* Dropdown Toggle States */
.label-select.searchable .dropdown-toggle {
  cursor: text;
}
.label-select.unsearchable .dropdown-toggle {
  cursor: pointer;
}
.label-select.open .dropdown-toggle {
  border-bottom-color: transparent;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
/* Dropdown Menu */
.label-select .dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
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
  }

  li a:hover {
    color: #212121;
  }

  li.highlight > a {
    /*
     * required to override bootstrap 3's
     * .dropdown-menu > li > a:hover {} styles
     */
    background: #607d8b;
    color: #FFF!important;
  }

  li.firstofcat {
    border-top: 1px solid #FFF;
  }

  .no-options, .new-label {
    line-height: 27px;
    height: 27px;
    color: #212121;
    text-align: center;
  }

  .new-label {
    background: repeating-linear-gradient(45deg, transparent, transparent 3px, #DEDEDE 3px, #DEDEDE 16px);
    cursor: pointer;
  }

  .new-label.highlight {
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
  }

  .categories-list {
    flex: 1 0 150px;
    max-width: 50%;

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

  .labels-list {
    flex: 1;
    margin: 0;
    display: block;
    padding: 0;
  }
}

.label-select .dropdown-menu >
.label-select .highlight:not(:last-child) {
  margin-bottom: 0; /* Fixes Bulma Margin */
}

/* Disabled state */
.label-select.disabled .dropdown-toggle,
.label-select.disabled .dropdown-toggle input,
.label-select.disabled .open-indicator {
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

</style>

<i18n>
{
  "de": {
    "no_matches": "Keine Tags gefunden",
    "no_matches_allownew": "Keine Tags gefunden (Tippe um neuen zu erstellen)",
    "create_new": "Neuen Tag <em>{label}</em> erstellen"
  },
  "en": {
    "no_matches": "No tags found",
    "no_matches_allownew": "No tags found (Type to create new one)",
    "create_new": "Create new tag <em>{label}</em>"
  }
}
</i18n>
