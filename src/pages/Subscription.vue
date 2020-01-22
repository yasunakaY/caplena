<template>
  <div class="main-content" ref="main-content" id="subscription">
    <loading :is-loading="loading"
             :title="$t('checkout.loading_title')"
             :tagline="$t('checkout.loading_tagline')">
      <div style="display: flex; margin-bottom: 32px" v-if="!success && initialLoad">

        <div style="flex: 4; margin-right: 16px">
          <v-card>
            <v-card-title>
              <div>
                <div class="title">{{ $t('change_subscription') }}</div>
                <div class="grey--text">
                  <span v-if="user.subscription.plan.id>0"
                        v-html="$t('current_plan', { plan: user.subscription.plan.name })" />
                  <span v-else>&nbsp;</span>
                </div>
              </div>
            </v-card-title>

            <v-card-text class="plan-container">
              <div class="plan" :class="{ 'current': user.subscription.plan.id === 10, 'selected': plan === 10 }"
                   @click="selectPlan(10)">
                <div class="overlay-subscribe">{{ $t('subscribe') }}</div>
                <div class="title name">{{ planFeatures[10].name }}</div>
                <v-divider />
                <div class="title price">€{{ planFeatures[10].price_monthly }}</div>
                <div class="credits">
                  {{ planFeatures[10].credits_monthly }} {{ $t('credits_monthly') }}
                  <helptip>{{ $t('helptip_credit_detail') }}</helptip>
                </div>
                <div v-for="(feature, idx) in $ta('plans.10.features')" :key="idx" v-html="feature" />
              </div>

              <div class="plan" :class="{ 'current': user.subscription.plan.id === 15, 'selected': plan === 15 }"
                   @click="selectPlan(15)">
                <div class="overlay-subscribe">{{ $t('subscribe') }}</div>
                <div class="title name">{{ planFeatures[15].name }}</div>
                <v-divider />
                <div class="title price">€{{ planFeatures[15].price_monthly }} {{ $t('price_monthly') }}</div>
                <div class="credits">
                  {{ planFeatures[15].credits_monthly }}
                  {{ $t('credits_monthly') }}
                  <helptip>{{ $t('helptip_credit_detail') }}</helptip>
                </div>
                <div v-for="(feature, idx) in $ta('plans.15.features')" :key="idx" v-html="feature" />
              </div>

              <div class="plan" :class="{ 'current': user.subscription.plan.id === 20, 'selected': plan === 20 }"
                   @click="selectPlan(20)">
                <div class="overlay-subscribe">{{ $t('subscribe') }}</div>
                <div class="title name">{{ planFeatures[20].name }}</div>
                <v-divider />
                <div class="title price">€{{ planFeatures[20].price_monthly }} {{ $t('price_monthly') }}</div>
                <div class="credits">
                  {{ planFeatures[20].credits_monthly }}
                  {{ $t('credits_monthly') }}
                  <helptip>{{ $t('helptip_credit_detail') }}</helptip>
                </div>
                <div v-for="(feature, idx) in $ta('plans.20.features')" :key="idx" v-html="feature" />
              </div>

              <div class="plan" :class="{ 'current': user.subscription.plan.id === 99, 'selected': plan === 99 }"
                   @click="selectPlan(99)">
                <div class="overlay-subscribe">{{ $t('subscribe') }}</div>
                <div class="title name">{{ $t('plans.99.name') }}</div>
                <v-divider />
                <div class="title price">{{ $t('on_request') }}</div>
                <div class="credits">
                  {{ $t('credits_unlimited') }}
                  <helptip x-offset="-50px">{{ $t('helptip_credit_detail') }}</helptip>
                </div>
                <div v-for="(feature, idx) in $ta('plans.99.features')" :key="idx" v-html="feature" />
              </div>

              <alert type="info">
                {{ $t('subscription_info') }}
              </alert>

            </v-card-text>

          </v-card>
        </div>

        <!-- ====== One off BOX ====== -->
        <div style="flex: 1.1; display: flex">
          <v-card style="flex: 1">
            <v-card-title>
              <div>
                <div class="title">{{ $t('packages') }}</div>
                <div class="grey--text">{{ $t('packages_subtitle') }}</div>
              </div>
            </v-card-title>

            <v-card-text class="plan-container">
              <div class="plan" :class="{ 'selected': plan === 100 }"
                   @click="plan=100">
                <div class="overlay-subscribe">{{ $t('buy') }}</div>
                <div class="title name">{{ $t('plans.100.name') }}</div>
                <v-divider />
                <div class="price title">€{{ planFeatures[100].price_oneoff }}</div>
                <div class="credits">
                  {{ planFeatures[100].credits_oneoff }} {{ $t('credits_oneoff') }}
                  <helptip>{{ $t('helptip_credit_detail') }}</helptip>
                </div>
                <div v-for="(feature, idx) in $ta('plans.100.features')" :key="idx" v-html="feature" />
              </div>
            </v-card-text>

          </v-card>
        </div>
      </div>

      <!-- ====== SUCCESS ====== -->
      <v-card v-if="success">
        <v-card-title>
          <div>
            <div class="title">
              {{ (planForCheckout ? $t('success.title_purchase') : $t('success.title_downgrade')) }}
            </div>
            <div class="grey--text">
              {{ (planForCheckout ? $t('success.subtitle_purchase') : $t('success.subtitle_downgrade')) }}
            </div>
          </div>
        </v-card-title>

        <v-card-text>
          <alert type="success">
            <span v-if="planForCheckout&&planFeatures[plan].recurring"
                  v-html="$t('success.text_subscription_paid', { plan: planFeatures[plan].name })" />
            <span v-if="planForCheckout"
                  v-html="$t('success.text_credits_filled', {
                  credits: (planFeatures[plan].credits_monthly ? planFeatures[plan].credits_monthly : planFeatures[plan].credits_oneoff) })" />
            <span v-if="!planForCheckout"
                  v-html="$t('success.text_downgrade')" />
          </alert>
          <v-btn :to="{ name: 'upload' }" color="primary">{{ $t('app_actions.new') }}</v-btn>
          <v-btn :to="{ name: 'projects-manage' }">{{ $t('app_actions.manage') }}</v-btn>
          <v-btn :to="{ name: 'account' }">{{ $t('app_actions.profile') }}</v-btn>
        </v-card-text>

      </v-card>

      <!-- ====== ENTERPRISE ====== -->
      <v-card v-if="plan===99">
        <v-card-title>
          <div>
            <div class="title">
              {{ $t('enterprise.title') }}
            </div>
            <div class="grey--text">
              {{ $t('enterprise.subtitle') }}
            </div>
          </div>
        </v-card-title>

        <v-card-text>
          {{ $t('enterprise.content') }} <a href="mailto:sales@caplena.com">sales@caplena.com</a>.
        </v-card-text>

      </v-card>

      <!-- ====== DOWNGRADE ====== -->
      <v-card v-if="plan===10&&!success">
        <v-card-title>
          <div>
            <div class="title">
              {{ $t('downgrade.title') }}
            </div>
            <div class="grey--text">
              {{ $t('downgrade.subtitle') }}
            </div>
          </div>
        </v-card-title>

        <alert type="error" v-if="checkoutError">
          {{ $t('checkout.error') }}
        </alert>

        <v-card-text>
          <alert type="warning">
            <span v-html="$t('downgrade.text', { plan: user.subscription.plan.name,
                                                 credits: planFeatures[10].credits_monthly })" />
          </alert>
          <v-btn color="accent" @click="submitCheckout">{{ $t('downgrade.confirm') }}</v-btn>
        </v-card-text>

      </v-card>

      <!-- ====== CHECKOUT ====== -->
      <v-card class="checkout" v-if="planForCheckout&&!success">
        <v-card-title>
          <div>
            <div class="title">{{ $t('checkout.title') }}</div>
            <div class="grey--text">{{ $t('checkout.subtitle') }}</div>
          </div>
        </v-card-title>

        <alert type="error" v-if="stripeScriptIsLoading || stripePaymentMethods.failed">
          {{ $t('checkout.pre_payment_issue') }}
        </alert>

        <alert type="error" v-if="checkoutError">
          {{ $t('checkout.error') }}
        </alert>

        <v-divider />
        <v-card-text v-if="!stripeScriptIsLoading && !stripePaymentMethods.failed">
          <div class="section">
            <div class="title grey--text">{{ $t('checkout.billing') }}</div>
            <div class="section-content">
              <!-- First Name -->
              <v-text-field v-model="address.name"
                            maxlength="50"
                            data-private
                            counter
                            :label="$t('profile.settings.name')" />

              <!-- Street -->
              <v-textarea v-model="address.street"
                          maxlength="255"
                          rows="2"
                          data-private
                          counter
                          :label="$t('profile.settings.address')" />

              <!-- ZIP -->
              <v-text-field v-model="address.zip"
                            required
                            :label="$t('profile.settings.zip')"
                            type="number"
                            max="99999"
                            data-private
                            :error-messages="address.zipInvalid" />

              <!-- City -->
              <v-text-field v-model="address.city"
                            maxlength="50"
                            counter
                            data-private
                            :label="$t('profile.settings.city')" />

              <!-- Country -->
              <v-autocomplete v-model="address.country"
                              required
                              :label="$t('profile.settings.country')"
                              :items="countries"
                              item-text="name"
                              item-value="iso"
                              data-private
                              :error-messages="address.countryInvalid" />

              <v-checkbox
                :label="$t('checkout.save_address_as_default')"
                v-model="address.save"
              />

            </div>
          </div>
          <v-divider />
          <div class="section">
            <div class="title grey--text">{{ $t('checkout.order') }}</div>
            <div class="section-content">
              <span class="item-descr">{{ $t(`plans.${plan}.name_checkout`) }}</span>
              <strong>€{{ amountOrder }}</strong>
              <div><span class="item-descr">{{ $t('checkout.vat') }}</span> <strong>€{{ amountVAT }}</strong></div>
              <v-divider />
              <div>
                <span class="item-descr body-2" style="font-size: large">Total</span>
                <span class="body-2" style="font-size: large">€{{ amountTotal }}</span>
                <span style="font-size: small" v-if="planFeatures[plan].recurring">({{ $t('monthly_advance') }})</span>
              </div>
            </div>
          </div>
          <v-divider />
          <div class="section">
            <div class="title grey--text">{{ $t('checkout.payment') }}</div>
            <div class="section-content">
              <div v-if="stripePaymentMethods.sources.length">
                <v-radio-group v-model="payment.existing_source">
                  <div v-for="source in stripePaymentMethods.sources" :key="source.id" style="display: flex">
                    <v-radio :value="source.id"
                             label=""
                             hide-details
                             class="shrink" />
                    <span class="cc-container">
                      <label class="v-label" @click="payment.existing_source=source.id">
                        {{ $t('checkout.use_card') }}
                        <span class="credit-card">
                          {{ source.brand }}
                          **** {{ source.last4 }},
                          {{ $t('valid_until') }}
                          {{ source.exp_month }} / {{ source.exp_year }}
                        </span>
                      </label>
                      <a href="" @click.prevent.stop="openRemoveSource(source.id)" v-if="stripeCardsRemovable">
                        <small>({{ $t('remove_card.action') }})</small>
                      </a>
                      <small v-else>({{ $t('remove_card.not_possible') }})</small>
                    </span>
                  </div>
                  <v-radio :value="false" :label="$t('checkout.use_other_card')" />
                </v-radio-group>
              </div>
              <div v-else>
                <v-radio-group v-model="payment.existing_source">
                  <v-radio :value="false" :label="$t('checkout.credit_card')" />
                </v-radio-group>
              </div>
              <div style="">
                {{ $t('checkout.use_invoice') }} <a href="mailto: sales@caplena.com">sales@caplena.com</a>
              </div>
            </div>
          </div>

          <v-divider />
          <alert type="warning" v-if="address.zipInvalid || address.countryInvalid">
            {{ $t('checkout.validate.invalid') }}
          </alert>
          <div class="section" >
            <div class="title grey--text" />
            <div class="section-content submit">
              <v-btn color="primary" @click="pay">{{ $t('checkout.confirm') }}</v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </loading>

    <v-dialog v-model="removeSource.active" max-width="600" @keydown.esc="closeRemoveSource(false)">
      <v-card>
        <v-card-title primary-title>
          <div>
            <div class="title">{{ $t('remove_card.dialog_title') }}</div>
          </div>
        </v-card-title>

        <v-card-text v-html="$t('remove_card.dialog_content', { card: removeSource.label })" />

        <v-card-actions>
          <v-spacer />
          <v-btn outlined color="primary" @click="closeRemoveSource(false)">{{ $t('no') }}</v-btn>
          <v-btn color="primary" @click="closeRemoveSource(true)">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
'use strict'

import Vuex from 'vuex'
import stripePayment from '../mixins/stripePayment.js'
import axios from 'axios'

export default {
  codit: true,
  name: 'ChangeSubscription',
  mixins: [ stripePayment ],
  data () {
    return {
      // Initial interval to check if user has loaded
      checkGetUserInterval: null,

      // Array of valid countries
      countries: [],

      // Checkout process user data
      plan: -1,
      loading: false,
      initialLoad: false,
      payment: { existing_source: false, new_source: '' },
      address: { name: '', zip: 0, country: '', street: '', city: '', zipInvalid: '', countryInvalid: '', save: true },
      success: false,
      checkoutError: false,

      // Information about the different plans
      planFeatures: []
    }
  },
  computed: {
    // Which plans actually lead to a checkout
    planForCheckout () {
      if ([15, 20, 100].indexOf(this.plan) !== -1) return true
      else return false
    },
    amountOrder () {
      if (this.planFeatures[this.plan].yearly) return this.planFeatures[this.plan].price_monthly * 12
      else if (this.planFeatures[this.plan].price_monthly) return this.planFeatures[this.plan].price_monthly
      else return this.planFeatures[this.plan].price_oneoff
    },
    amountVAT () { return (this.address.country === 'CH' ? Math.round(this.amountOrder * 7.7) / 100 : 0) },
    amountTotal () { return this.amountOrder + this.amountVAT },
    ...Vuex.mapState(['user'])
  },

  watch: {
    plan () { this.$nextTick(() => this.$vuetify.goTo(1000, { duration: 300 })) },
    'stripePaymentMethods.sources' (val) {
      // If there already is payment info saved, use that by default
      if (val.length) this.payment.existing_source = val[0].id
    }
  },
  created () {
    this.address.name = this.user.first_name
    this.address.zip = this.user.profile.address_zip
    this.address.country = this.user.profile.address_country
    this.address.street = this.user.profile.address_street
    this.address.city = this.user.profile.address_city

    // Get the list of valid countries
    let r1 = api.get('/api/countries').then(res => this.$set(this, 'countries', res.data))
    let r2 = api.get('/api/plans').then(res => {
      this.$set(this, 'planFeatures', _.keyBy(res.data, 'id'))
    })

    axios.all([r1, r2]).then(() => { this.initialLoad = true })
  },

  methods: {
    selectPlan (plan) { if (this.user.subscription.plan.id !== plan) this.plan = plan },

    pay () {
      // Validate input
      if (this.address.zip < 100) {
        this.address.zipInvalid = this.$t('checkout.validate.zip_invalid')
        return
      }
      if (this.address.country === '') {
        this.address.countryInvalid = this.$t('checkout.validate.country_invalid')
        return
      }

      this.address.zipInvalid = ''
      this.address.countryInvalid = ''

      // If it's not a new card, directly go to checkout
      if (this.payment.existing_source !== false) {
        this.checkout()
        return
      }
      if (this.stripeHandler === null) {
        this.$root.snackMsg(this.$t('stripe_failed'))
        return
      }
      this.stripeHandler.open({
        description: this.$t(`plans.${this.plan}.name_checkout`),
        email: this.$root.user.email,
        // zip: this.$root.user.zip,
        currency: 'eur',
        amount: this.amountTotal * 100,
        token: (token) => {
          this.payment.new_source = token.id
          this.checkout()
        }
      })
    },

    checkout () {
      this.loading = true
      // First update the user if the address has changed
      if (this.address.save) {
        this.$store.dispatch('updateUser', {
          profile: {
            address_zip: this.address.zip,
            address_country: this.address.country,
            address_street: this.address.street,
            address_city: this.address.city
          },
          first_name: this.address.name
        }).then(this.submitCheckout).catch(err => this.$maybeRaiseAPIPromiseErr(err))
      // Otherwise call checkout directly
      } else this.submitCheckout()
    },

    submitCheckout () {
      this.loading = true
      api.post('/api/subscription/checkout', { plan: this.plan, payment: this.payment, address: this.address }).then((res) => {
        this.loading = false
        if (res.data.success === true) {
          this.success = true
          let properties = { profile: {}, dontPatch: true }
          if (this.planFeatures[this.plan].recurring) {
            properties.profile.credits_remaining_monthly = this.planFeatures[this.plan].credits_monthly
            properties.subscription = res.data.subscription
          } else properties.profile.credits_remaining_oneoff = this.planFeatures[this.plan].credits_oneoff + this.user.profile.credits_remaining_oneoff
          this.$store.dispatch('updateUser', properties)
        } else this.checkoutError = true
      }).catch(err => {
        this.loading = false
        this.checkoutError = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    }
  }
}

</script>

<style lang=scss>

#subscription {
  .v-card .title { margin-bottom: 0 }
  .v-card .grey--text {
    font-size: 14px;
    line-height: 1.2rem;
  }

  .credit-card {
    padding: 6px 5px 4px;
    margin: 0 8px;
    background: #FFF;
    border-radius: 3px;
    font-family: "Consolas", "Courier New", "Courier";
  }

  .plan-container {
    display: flex;
    margin: 0 -8px;
    height: 350px;
    position: relative;

    .alert-info {
      position: absolute;
      bottom: 0px;
      left: 24px;
      right: 24px;
    }
  }

  .plan {
    flex: 1;
    margin: 0 8px;
    position: relative;
    transition: all 0.2s ease-out;
    padding: 8px 12px 40px;
    display: inline-block;
    border-radius: 5px;
    text-align: center;
    border: 2px solid #CCC;
    cursor: pointer;
    height: 250px;

    &.highlight {
      background: #fbddad;
    }

    .title {
      color: #0e5d88;;
      text-align: center;
      margin-top: 8px;
    }

    .name { text-transform: uppercase; }

    .overlay-subscribe {
      transition: opacity 0.2s ease-out;
      position: absolute;
      left: 0;
      bottom: 5px;
      right: 0;
      font-size: larger;
      text-align: center;
      vertical-align: middle;
      color: #FFF;
      opacity: 0;
      font-weight: bold;
      text-transform: uppercase;
    }
    &:hover:not(.current), &.selected {
      background: rgba(14, 93, 136, 0.2);
      border: 2px solid #0e5d88;
    }

    &.selected {
      background: rgba(14, 93, 136, 0.3)!important;
    }

    &.current {
      cursor: default;
      background: #EEE;
    }

    &:hover:not(.current) .overlay-subscribe {
      opacity: 1;
    }

    .price {
      margin-bottom: 10px;
    }

    .v-divider {
      margin: 12px 0 16px;
    }

    .credits { font-weight: bold; }
  }

  .checkout {
    .section {
      display: flex;
      .title { flex: 0 0 250px; }
      .section-content {
        flex: 1 0 auto;
        max-width: 700px;
        background: #EEE;
        padding: 8px 16px;
        .cc-container {
          margin: -3px 0 0 -16px;
          label { cursor: pointer }
        }
        &.submit {
          background: none;
          display: flex;
          .v-button { flex: 1; }
        }
      }
    }

    .item-descr {
      display: inline-block;
      width: 300px;
    }

    .v-divider {
      margin: 10px 0 14px;
    }
  }
}

</style>
<i18n src='../i18n/Subscription.json'></i18n>
<i18n src='../i18n/pages/Account.json'></i18n>
