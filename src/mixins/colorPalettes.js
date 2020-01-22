import Vuex from 'vuex'

export default {
  data () {
    return {
      colorPaletteBold: [
        '#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83',
        '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3'
      ]
    }
  },

  computed: {
    userColorPalettes () {
      return this.user.isAnonymous ? {} : this.user.profile.app_settings.COLOR_PALETTES || {}
    },

    colorPalettes () {
      return { default: this.$color.paletteMedium, bold: this.colorPaletteBold, ...this.userColorPalettes }
    },

    colorPalettesParsed () {
      return _.mapValues(this.colorPalettes, palette => palette.map(this.parseColor))
    },

    colorPalettesAsHexA () {
      return _.mapValues(this.colorPalettesParsed, palette => palette.map(this.parsedColorToHexA))
    },

    ...Vuex.mapState(['user'])
  },

  methods: {
    parseColor (color) {
      let mRgba = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))\s*\)$/)
      if (mRgba) return { r: parseInt(mRgba[1]), g: parseInt(mRgba[2]), b: parseInt(mRgba[3]), a: parseFloat(mRgba[4]) }

      let mRgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
      if (mRgb) return { r: parseInt(mRgb[1]), g: parseInt(mRgb[2]), b: parseInt(mRgb[3]) }

      let mHex = color.match(/^#([0-9a-f]{6})$/i)
      if (mHex) return color

      this.$onError(new Error(`Unknown color format: ${color}`))
      return color
    },

    /**
     * Takes a parsed color (output from `parseColor` function) and returns a hexadecimal string
     * representing the same color
     * @param  {Object|String} color    The parsed color object
     * @return {String}                 Hexadecimal representation of color
     */
    parsedColorToHexA (color) {
      // If the color is already a string, we assume its hexadecimal and return directly
      if (typeof color === 'string') return color
      // If it's an object with r, g, b props, parse it
      else if (typeof color === 'object' && _.has(color, 'r') && _.has(color, 'g') && _.has(color, 'b')) {
        // Convert ints to base16 strings
        let r = (+color.r).toString(16)
        let g = (+color.g).toString(16)
        let b = (+color.b).toString(16)

        if (r.length === 1) r = '0' + r
        if (g.length === 1) g = '0' + g
        if (b.length === 1) b = '0' + b

        let result = `#${r}${g}${b}`

        // If there is an alpha channel, add it
        if (_.has(color, 'a')) {
          let a = Math.round(+color.a * 255).toString(16)
          if (a.length === 1) a = '0' + a
          result += a
        }

        return result
      } else this.$onError(`Unknown parsed color format: ${color}`)
    }
  }
}
