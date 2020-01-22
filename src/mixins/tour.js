import 'hopscotch/dist/css/hopscotch.css'
import Hopscotch from 'hopscotch'

// define a mixin object
export default {
  name: 'tourMixin',
  data () {
    return {
      tourCheckCompleted: false,
      tourStartTimeout: null,
      tourStarted: false
    }
  },
  watch: {
    '$root.userReady' (val) { if (val === true && !this.tourCheckCompleted) this.checkTour() }
  },

  mounted () {
    // If the user is loaded, then do the tourcheck now, otherwise let the watch on userReady do its job
    if (this.$root.userReady) this.checkTour()
    this.$store.commit('setTourFn', this.startTour)
  },
  destroyed () {
    if (this.tourStarted) Hopscotch.endTour(true)
    clearTimeout(this.tourStartTimeout)
  },
  methods: {
    getTour () {
      let tour = {
        id: this.$route.name,
        scrollDuration: 200,
        i18n: {
          nextBtn: this.$t('next'),
          prevBtn: this.$t('back'),
          doneBtn: this.$t('done'),
          skipBtn: this.$t('skip'),
          closeTooltip: this.$t('finish')
        },
        // need to deep copy steps, otherwise language switching won't work
        steps: _.cloneDeep(this.tour)
      }

      // Do the i18n lookup for all step elements
      tour.steps.forEach(s => {
        s.title = s.title instanceof Array ? this.$t(s.title[0], s.title[1]) : this.$t(s.title)
        s.content = s.content instanceof Array ? this.$t(s.content[0], s.content[1]) : this.$t(s.content)
      })
      return tour
    },

    startTour () {
      Hopscotch.startTour(this.getTour())
      this.tourStarted = true
    },

    checkTour () {
      this.tourCheckCompleted = true
      this.tourStartTimeout = setTimeout(v => {
        if (this.$root.user.profile.pages_visited.indexOf(this.$route.name) === -1 && this.getTour !== null) {
          this.startTour()
          this.$root.markPageAsVisited(this.$route.name)
        }
      }, 1500)
    }
  }
}
