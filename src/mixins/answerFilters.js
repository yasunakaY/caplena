export default {
  data () {
    return {
      filterOptions: [
        {
          type: 'empty',
          multiple: false,
          default: true,
          fn: (a, v) => !v || a.text.trim() !== '' },
        {
          type: 'codes',
          multiple: true,
          default: [],
          fn: (a, v) => a.codes.some(c => v.has(c))
        },
        {
          type: 'text',
          multiple: true,
          default: '',
          fn: (a, v) => v === '' || a.text.toLowerCase().indexOf(v) !== -1 },
        {
          type: 'sentiment',
          multiple: false,
          default: [-1, 1],
          fn: (a, v) => a.sentiment !== null && a.sentiment >= v[0] && a.sentiment <= v[1] },
        /* {
          type: 'reviewed',
          multiple: false,
          default: true,
          fn: (a, v) => a.reviewed === v
        },
        {
          type: 'changed',
          multiple: false,
          default: true,
          fn: (a, v) => a.changed === v
        }, */
        {
          type: 'auxiliary',
          multiple: true,
          default: { },
          fn: (a, v) => {
            let c = a.auxiliary_columns[v.col]
            if (v.kind === 'text') return v.value === '' || String(c).toLowerCase().indexOf(v.value) !== -1
            else if (v.kind === 'select') return v.value.has(c)
            else if (v.kind === 'range') return c >= v.value[0] && c <= v.value[1]
          }
        }
      ]
    }
  },

  computed: {
    filterOptionsStandard () {
      return this.filterOptions.map(o => ({ ...o, text: this.$t(`answer_fields.${o.type}`) }))
    }
  },

  methods: {
    prepareFilterItemValue (item) {
      if (item.type === 'text') return item.value.toLowerCase()
      if (item.type === 'codes') return new Set(item.value)
      else if (item.type === 'auxiliary' && item.value.kind === 'select') return { ...item.value, value: new Set(item.value.value) }
      else if (item.type === 'auxiliary' && item.value.kind === 'text') return { ...item.value, value: item.value.value.toLowerCase() }
      else return item.value
    },

    filterAnswers (filterItems, answers) {
      let filters = filterItems.map(item => {
        if (item.type === null) return answer => true
        let opt = _.find(this.filterOptions, { type: item.type })
        let v = this.prepareFilterItemValue(item)
        if (item.invert) return answer => !opt.fn(answer, v)
        else return answer => opt.fn(answer, v)
      })

      return answers.filter(a => filters.every(f => f(a)))
    }
  }
}
