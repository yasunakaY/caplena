import Vuex from 'vuex'

let STRIPE_PK = {
  'dev': 'pk_test_KYfZnst7aLZKF6hzmutq3gYz',
  'prod': 'pk_live_jl40H1nukjawAC2i2Xwd60rh'
}[(process.env.CODIT_ENV === 'prod' ? 'prod' : 'dev')]

export default {
  data () {
    return {
      // Stripe resources (mostly for loading)
      stripeScriptIsLoading: true,
      stripeHandler: null,
      stripeScript: null,

      // Stripe information of user
      stripePaymentMethods: { loaded: false, sources: [], failed: false },

      // Helper data for removing a credit card
      removeSource: { active: false, label: '', id: '', idx: -1 },

      // Helper data for adding a credit card
      newPaymentMethod: { source: '', loading: false, success: false, failed: false },

      // payment history
      stripePaymentHistory: { loaded: false, charges: [], failed: false }
    }
  },

  computed: {
    stripeCardsRemovable () {
      // Cards are deletable only if the user is on the free plan or if there are more than one cards left
      return ([10, 9].indexOf(this.user.subscription.plan.id) !== -1 || this.stripePaymentMethods.sources.length > 1)
    },
    ...Vuex.mapState(['user'])
  },
  created () {
    // get already existing payment information from user
    if (!this.$hasPermission('subscription_mgmt')) return

    api.post('/api/subscription/get-payment-methods').then((res) => {
      this.stripePaymentMethods.loaded = true
      this.$set(this.stripePaymentMethods, 'sources', res.data.sources)
    }).catch(err => {
      this.stripePaymentMethods.failed = true
      this.$maybeRaiseAPIPromiseErr(err)
    })

    // load stripe checkout script
    let stripe = document.createElement('script')
    stripe.async = true
    stripe.onload = this.stripeLoaded
    stripe.src = 'https://checkout.stripe.com/checkout.js'
    this.stripeScript = stripe
    document.head.appendChild(this.stripeScript)
  },

  destroyed () {
    if (this.stripeHandler) this.stripeHandler.close()
    if (this.stripeScript) document.head.removeChild(this.stripeScript)
  },

  methods: {
    getStripePaymentHistory () {
      api.post('/api/subscription/invoices').then(res => {
        this.$set(this.stripePaymentHistory, 'charges', res.data.charges)
        this.stripePaymentHistory.loaded = true
      }).catch(err => {
        this.stripePaymentHistory.failed = true
        this.$root.snackMsg('An error occurred while loading your payment history, we\'ll look into it')
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    stripeLoaded () {
      this.stripeScriptIsLoading = false
      this.stripeHandler = window.StripeCheckout.configure({
        key: STRIPE_PK,
        image: '/static/logo_caplena_square.png',
        name: 'Caplena (Caplena GmbH)',
        locale: 'auto',
        billingAddress: false,
        zipCode: false
      })
    },

    openRemoveSource (id) {
      this.removeSource.idx = _.findIndex(this.stripePaymentMethods.sources, { id })
      let toRemove = this.stripePaymentMethods.sources[this.removeSource.idx]
      this.removeSource.id = id
      this.removeSource.label = `${toRemove.brand} **** ${toRemove.last4}`
      this.removeSource.active = true
    },

    closeRemoveSource (confirm) {
      if (confirm) {
        this.stripePaymentMethods.sources.splice(this.removeSource.idx, 1)
        api.post('/api/subscription/remove-payment-method', { source_id: this.removeSource.id }).then(res => {
          this.$root.snackMsg(this.$t('remove_card.success'))
        }).catch(() => {
          this.$root.snackMsg(this.$t('remove_card.error'))
        })
      }

      this.removeSource.idx = -1
      this.removeSource.id = ''
      this.removeSource.active = false
      this.removeSource.label = ''
    },

    openAddPaymentMethod () {
      if (this.stripeHandler === null) {
        this.$root.snackMsg(this.$t('stripe_failed'))
        return
      }
      this.stripeHandler.open({
        name: 'Caplena (Caplena GmbH)',
        description: this.$t('payment_methods.action_add'),
        email: this.$root.user.email,
        panelLabel: this.$t('payment_methods.action_store'),
        token: this.submitAddPaymentMethod,
        billing_name: 'Maurice',
        billing_address_line1: 'Gartenhof'
      })
    },

    submitAddPaymentMethod (token) {
      this.newPaymentMethod.loading = true
      api.post('/api/subscription/store-payment-method', { new_source: token.id }).then(res => {
        this.newPaymentMethod.success = true
        this.newPaymentMethod.failed = false
        this.newPaymentMethod.loading = false
        this.$set(this.stripePaymentMethods, 'sources', res.data.sources)
      }).catch(err => {
        this.newPaymentMethod.failed = true
        this.newPaymentMethod.success = false
        this.newPaymentMethod.loading = false
        this.$maybeRaiseAPIPromiseErr(err)
      })
    }
  }
}
