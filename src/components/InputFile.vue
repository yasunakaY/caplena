<template>
  <div style="flex: 1">
    <v-text-field append-icon="mdi-attachment"
                  v-model="filename"
                  :label="label"
                  :required="required"
                  @click.native="onFocus"
                  readonly
                  :disabled="disabled"
                  ref="fileTextField"/>
    <input type="file"
           :accept="accept"
           :disabled="disabled"
           @change="onFileChange"
           ref="fileInput">
  </div>
</template>
<script>
export default{
  codit: true,
  name: 'FileField',
  props: {
    value: {
      type: [File],
      default: null
    },
    accept: {
      type: String,
      default: '*'
    },
    label: {
      type: String,
      default: 'Please choose...'
    },
    required: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      file: null,
      randIdent: 0
    }
  },

  computed: {
    filename () { return (this.file && this.file.name) || '' }
  },

  watch: {
    value (v) {
      this.file = v
    }
  },

  methods: {
    onFocus () {
      if (!this.disabled) {
        this.$refs.fileInput.click()
      }
    },

    onFileChange ($event) {
      const files = $event.target.files || $event.dataTransfer.files
      if (files && files.length > 0) this.file = files[0]
      else this.file = null

      // Clear the value, such that when selecting the same file again the onFileChange event will still fire
      this.$refs.fileInput.value = ''

      this.$emit('input', this.file)
    }
  }
}
</script>
<style scoped>
input[type=file] {
    position: absolute;
    left: -99999px;
}
</style>
