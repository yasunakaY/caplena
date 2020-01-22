export default {
  computed: {
    codesByCat () { return _.groupBy(this.codes, 'category') },

    codeCats () { return _.keys(this.codesByCat) },

    codeCats2CatIdx () {
      let mapping = {}
      this.codeCats.forEach((cat, idx) => { mapping[cat] = idx })
      return mapping
    },

    codeID2Code () {
      let mapping = {}
      this.codes.forEach((c, idx) => { mapping[c.id] = c })
      return mapping
    },

    codeID2Idx () {
      let mapping = {}
      this.codes.forEach((c, idx) => { mapping[c.id] = idx })
      return mapping
    },

    codeID2CatIdx () {
      let mapping = {}
      this.codes.forEach(c => { mapping[c.id] = this.codeCats2CatIdx[c.category] })
      return mapping
    },

    codeID2Cat () {
      let mapping = {}
      this.codes.forEach(c => { mapping[c.id] = c.category })
      return mapping
    },

    codeCat2CatIdx () {
      let mapping = {}
      this.codeCats.forEach((c, idx) => { mapping[c] = idx })
      return mapping
    }
  }
}
