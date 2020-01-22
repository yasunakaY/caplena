// let colors = require('../../node_modules/vue-material/src/core/components/mdTheme/palette.js').default
import variables from '@/css/export-colors.scss'

const paletteColors = ['blue', 'red', 'green', 'purple', 'orange', 'brown']

const soft = {}
const medium = {}
const strong = {}

const capitalize = s => s.charAt(0).toUpperCase() + s.substr(1)

paletteColors.forEach(c => {
  soft[c] = variables[`colSoft${capitalize(c)}`]
  medium[c] = variables[`colMedium${capitalize(c)}`]
  strong[c] = variables[`colStrong${capitalize(c)}`]
})

let getSoft = idx => soft[paletteColors[idx % paletteColors.length]]
let getMedium = idx => medium[paletteColors[idx % paletteColors.length]]
let getStrong = idx => strong[paletteColors[idx % paletteColors.length]]

let paletteSoft = []
let paletteMedium = []
let paletteStrong = []
for (let k = 0; k < paletteColors.length; k++) {
  paletteSoft.push(getSoft(k))
  paletteMedium.push(getMedium(k))
  paletteStrong.push(getStrong(k))
}

export default {
  soft,
  medium,
  strong,
  paletteColors,
  paletteSoft,
  paletteMedium,
  paletteStrong,
  getSoft,
  getMedium,
  getStrong
}
