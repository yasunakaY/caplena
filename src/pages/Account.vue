<template>
  <div class="main-content" ref="main-content" id="account">
    <div style="display: flex">

      <div style="flex: 1">

        <!-- ====== Organization ====== -->
        <v-card v-if="initialLoad && user.profile.organization">
          <v-card-title>
            <div>
              <div class="title">{{ $t('organization.title') }}: <em>{{ user.profile.organization.name }}</em></div>
              <div class="grey--text">{{ $t('organization.subtitle') }}</div>
            </div>
          </v-card-title>

          <v-card-text>
            <div>
              <p v-if="!user.profile.organization.rbac"
                 v-html="$t('organization.rbac.disabled')" />

              <template v-else>
                <p v-html="$t('organization.rbac.enabled', {
                  roles: (isRootAccount ? $t('organization.rbac.role_root') : $_.map(user.roles, 'name').join(', ') )
                })" />
                <ul>
                  <li v-for="(perm_val, perm_key) in user.view_permissions"
                      :key="perm_key"
                      v-if="perm_val || isRootAccount"
                      v-html="$t(`organization.rbac.permissions.${perm_key}`)" />
                  <li v-html="$t('organization.rbac.permissions.owner')" />
                </ul>
              </template>
            </div>
          </v-card-text>

        </v-card>

        <!-- ====== Subscription ====== -->
        <v-card v-if="initialLoad">
          <v-card-title>
            <div>
              <div class="title">{{ $t('subscription.title') }}</div>
              <div class="grey--text">{{ $t('subscription.subtitle') }}</div>
            </div>
          </v-card-title>

          <v-card-text v-if="initialLoad">
            <div>
              <p>
                <span v-html="$t('subscription.infotext_plan', { plan: user.subscription.plan.name })" />
                <span v-html="(user.subscription.plan.price_monthly > 0 ? $t('subscription.infotext_paid') : '')" />
                <span v-if="user.subscription.plan.credits_monthly > 0"
                      v-html="$t('subscription.infotext_refill', {
                        credits: user.subscription.plan.credits_monthly * (user.subscription.plan.yearly ? 12 : 1),
                        date: nextRenewalDate
                })" />
              </p>
            </div>
            <div>
              <span class="grey--text" style="display: inline-block; width: 250px">
                {{ $t('subscription.credits_remaining_monthly') }}</span>
              <code>{{ user.profile.credits_remaining_monthly }}</code>
            </div>
            <div>
              <span class="grey--text" style="display: inline-block; width: 250px">
                {{ $t('subscription.credits_remaining_oneoff') }}</span>
              <code>{{ user.profile.credits_remaining_oneoff }}</code>
            </div>
          </v-card-text>

          <v-card-actions v-if="!subscriptionMgmtDisabled">
            <v-spacer />
            <v-btn class="primary"
                   :class="{ 'accent': user.subscription.plan.id === 10 }"
                   :to="{ name: 'subscription' }">
              {{ $t('subscription.action_change') }}
            </v-btn>
          </v-card-actions>

        </v-card>

        <!-- ====== Payment methods ====== -->
        <v-card v-if="initialLoad && !subscriptionMgmtDisabled">
          <v-card-title>
            <div>
              <div class="title">{{ $t('payment_methods.title') }}</div>
              <div class="grey--text">
                {{ $t('payment_methods.subtitle') }}
              </div>
            </div>
          </v-card-title>

          <loading :is-loading="newPaymentMethod.loading"
                   :title="$t('payment_methods.loading_title')"
                   :tagline="$t('payment_methods.loading_tagline')">

            <v-card-text v-if="stripePaymentMethods.loaded">
              <ul id="payment-methods" v-if="stripePaymentMethods.sources.length">
                <li v-for="(source, idx) in stripePaymentMethods.sources" :key="idx">
                  <div class="card-container">
                    <span class="credit-card">
                      {{ source.brand }}
                      **** {{ source.last4 }}
                      {{ $t('valid_until') }}
                      {{ source.exp_month }} / {{ source.exp_year }}
                    </span>
                  </div>
                  <a class="remove" href="" @click.prevent.stop="openRemoveSource(source.id)" v-if="stripeCardsRemovable">
                    <small>({{ $t('remove_card.action') }})</small>
                  </a>
                  <small class="not-removable" v-else>({{ $t('remove_card.not_possible') }})</small>
                </li>
              </ul>
              <empty-state
                v-else
                icon="mdi-credit-card"
                :label="$t('payment_methods.no_cards')" />
            </v-card-text>

            <alert type="success" v-if="newPaymentMethod.success">{{ $t('payment_methods.add_success') }}</alert>
            <alert type="error" v-if="newPaymentMethod.failed">{{ $t('payment_methods.add_failed') }}</alert>

            <v-card-actions>
              <v-spacer />
              <v-btn class="primary" @click="openAddPaymentMethod">
                {{ $t('payment_methods.action_add') }}
              </v-btn>
            </v-card-actions>
          </loading>

        </v-card>

        <!-- ====== Payment history ====== -->
        <v-card v-if="initialLoad && !subscriptionMgmtDisabled">
          <v-card-title>
            <div>
              <div class="title">{{ $t('payment_history.title') }}</div>
              <div class="grey--text">
                {{ $t('payment_history.subtitle') }}
              </div>
            </div>
          </v-card-title>

          <v-card-text v-if="stripePaymentHistory.loaded">
            <ul id="payment-history" v-if="stripePaymentHistory.charges.length">
              <li v-for="(charge, idx) in stripePaymentHistory.charges" :key="idx">
                <div class="date">{{ charge.date | datelong }}</div>
                {{ charge.description }} |
                <strong>{{ charge.currency | uppercase }} {{ charge.amount / 100 }}</strong>
                <span class="credit-card">
                  {{ charge.source.brand }}
                  **** {{ charge.source.last4 }}
                </span>
              </li>
            </ul>
            <empty-state
              v-else
              icon="mdi-receipt"
              :label="$t('payment_history.no_payments')" />
          </v-card-text>
        </v-card>

      </div>

      <!-- ====== Profile Settings ====== -->
      <div style="flex: 1">
        <v-card>
          <v-card-title>
            <div>
              <div class="title">{{ $t('profile.settings.title') }}</div>
              <div class="grey--text">{{ $t('profile.settings.description') }}</div>
            </div>
          </v-card-title>

          <v-card-text v-if="initialLoad">
            <form @submit.prevent="saveUser" autocomplete="off">
              <!-- First Name -->
              <v-text-field v-model="userChanged.first_name"
                            maxlength="50"
                            data-private
                            counter
                            :label="$t('profile.settings.name')"
                            :error-messages="res.userError.first_name" />

              <!-- Email -->
              <v-text-field v-model="userChanged.email"
                            data-private
                            :label="$t('profile.settings.email')"
                            :error-messages="res.userError.email" />

              <!-- Street -->
              <v-textarea v-model="userChanged.profile.address_street"
                          maxlength="255"
                          rows="2"
                          counter
                          data-private
                          :disabled="!isRootAccount"
                          :label="$t('profile.settings.address')"
                          :error-messages="res.userError.address_street" />

              <!-- ZIP -->
              <v-text-field v-model="userChanged.profile.address_zip"
                            :label="$t('profile.settings.zip')"
                            type="number"
                            max="99999"
                            data-private
                            :disabled="!isRootAccount"
                            :error-messages="('profile' in res.userError && 'address_zip' in res.userError.profile) ? res.userError.profile.address_zip : ''" />

              <!-- City -->
              <v-text-field v-model="userChanged.profile.address_city"
                            maxlength="50"
                            counter
                            data-private
                            :disabled="!isRootAccount"
                            :label="$t('profile.settings.city')"
                            :error-messages="res.userError.address_city" />

              <!-- Country -->
              <v-autocomplete v-model="userChanged.profile.address_country"
                              :label="$t('profile.settings.country')"
                              :items="countries"
                              item-text="name"
                              item-value="iso"
                              data-private
                              :disabled="!isRootAccount"
                              :error-messages="('profile' in res.userError && 'address_country' in res.userError.profile) ? res.userError.profile.address_country : ''" />

              <div>
                <v-checkbox v-model="userChanged.profile.user_settings.opt_out_tracking"
                            :disabled="!isRootAccount"
                            :label="$t('profile.settings.opt_out_tracking')" />
              </div>

              <div style="display: flex; margin: 20px -5px">
                <v-spacer />
                <v-btn class="primary"
                       type="submit"
                       :disabled="res.userLoading||changedUserdata===null">{{ $t('save.title') }}</v-btn>
              </div>
            </form>
            <v-divider style="margin-bottom: 20px" />

            <form @submit.prevent="changePassword">

              <v-text-field v-model="pwd.new_password1"
                            type="password"
                            :error-messages="('new_password1' in res.pwdError) ? res.pwdError.new_password1 : ''"
                            :label="$t('profile.settings.new_password')" />

              <v-text-field v-model="pwd.new_password2"
                            type="password"
                            :error-messages="('new_password2' in res.pwdError) ? res.pwdError.new_password2 : ''"
                            :label="$t('profile.settings.new_password_repeat')" />

              <div style="display: flex; margin: 20px -5px -10px">
                <v-spacer />
                <v-btn color="primary"
                       type="submit"
                       :disabled="res.pwdLoading||pwd.new_password1===''||pwd.new_password2===''">
                  {{ $t('profile.settings.new_password') }}
                </v-btn>
              </div>
            </form>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>
            <div>
              <div class="title">{{ $t('profile.infos.title') }}</div>
              <div class="grey--text">{{ $t('profile.infos.subtitle') }}</div>
            </div>
          </v-card-title>

          <v-card-text>
            <div>
              <span class="grey--text" style="width: 150px; display: inline-block;">
                {{ $t('profile.infos.created') }}
              </span>
              <code>{{ user.created | dateshort }}</code>
            </div>
            <div>
              <span class="grey--text" style="width: 150px; display: inline-block;">
                {{ $t('profile.infos.last_login') }}
              </span>
              <code>{{ user.last_login | fromnow }}</code>
            </div>
            <div>
              <span class="grey--text" style="width: 150px; display: inline-block;">
                {{ $t('profile.infos.number_of_projects') }}
              </span>
              <code>{{ user.n_projects }}</code>
            </div>
          </v-card-text>

        </v-card>
      </div>
    </div>

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

export default {
  codit: true,
  name: 'Account',
  mixins: [stripePayment],
  data () {
    return {
      initialLoad: false,
      userChanged: {
        first_name: '',
        email: '',
        profile: {
          address_street: '',
          address_city: '',
          address_zip: 0,
          address_country: '',
          user_settings: { opt_out_tracking: false }
        }
      },
      pwd: { new_password1: '', new_password2: '' },
      res: { pwdLoading: false, userLoading: false, passwordLoading: false, userError: {}, pwdError: {} },
      checkGetUserInterval: null,
      countries: []
    }
  },
  computed: {
    changedUserdata () {
      let data = {}
      _.each(this.userChanged, (val, key) => {
        if (JSON.stringify(val) !== JSON.stringify(this.user[key])) data[key] = _.cloneDeep(val)
      })
      if (Object.keys(data).length === 0 && data.constructor === Object) return null
      return data
    },

    nextRenewalDate () {
      let when = null
      if (this.user.subscription.plan.yearly) when = this.$moment(this.user.subscription.start).add(1, 'Y').startOf('month')
      else when = this.$moment().add(1, 'M').startOf('month')
      return this.$options.filters.datelong(when)
    },

    // The "managed" plans are not able to change their subscription on their own, view previous payments or edit payment details
    subscriptionMgmtDisabled () {
      // All but the "usual" plans are managed
      return !this.$hasPermission('subscription_mgmt') || [20, 15, 10, 9].indexOf(this.user.subscription.plan.id) === -1
    },

    isRootAccount () {
      return !this.user.profile.organization || this.user.profile.organization.root_user_id === this.user.id
    },

    ...Vuex.mapState(['user'])
  },
  created () {
    // Get the list of valid countries
    api.get('/api/countries').then(res => this.$set(this, 'countries', res.data))
    // Wait for the root element to have the user content loaded, important if this page is directly loaded via url
    this.checkGetUserInterval = setInterval(v => {
      if (this.user.id > 0) { // has loaded
        clearInterval(this.checkGetUserInterval)
        this.initialLoad = true
        _.each(this.userChanged, (val, key) => { this.$set(this.userChanged, key, _.cloneDeep(this.user[key])) })
      }
    }, 40)

    // Get the payment history of the customer
    if (this.$hasPermission('subscription_mgmt')) this.getStripePaymentHistory()
  },
  methods: {
    saveUser () {
      // get all the elements which have changed
      this.res.userLoading = true
      this.res.userError = {}
      this.$store.dispatch('updateUser', this.changedUserdata).then(res => {
        this.res.userLoading = false
        if (res.status === 200) this.$root.snackMsg(this.$t('profile.save.profile_success'))
        else this.$set(this.res, 'userError', res.data)
      }).catch(err => {
        this.res.userLoading = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('save.title')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },
    changePassword () {
      // get all the elements which have changed
      this.res.pwdLoading = true
      this.res.pwdError = {}
      api.post('/api/auth/password/change/', this.pwd, { dontReport: [400] }).then(response => {
        this.res.pwdLoading = false
        // reset password
        if (response.status === 200) {
          _.each(this.pwd, (val, key) => { this.pwd[key] = '' })
          this.$root.snackMsg(this.$t('profile.save.password_success'))
        } else this.$set(this.res, 'pwdError', response.data) // set error field
      }).catch(err => {
        this.res.pwdLoading = false
        this.$root.snackMsg(this.$t('error', {'step': this.$t('save.title')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })
    }
  }
}

</script>

<style lang=scss>

#payment-methods {
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    margin: 0;
    padding: 5px 0;
    border-bottom: 1px solid #DDD;
    display: flex;
    .card-container {
      flex: 1 0 auto;
      align-items: center;
      display: flex;
      .credit-card {
      }
    }
    .not-removable {
      flex: 0 1 auto;
    }
    .remove {
      flex: 0 1 auto;
      display: flex;
      align-items: center;
    }
  }
}

#payment-history {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 250px;
  overflow-y: scroll;
  li {
    .date {
      font-style: italic;

    }
    .credit-card {
      float: right;
      margin-top: -15px;
    }
    margin: 0;
    padding: 5px 0;
    border-bottom: 1px solid #DDD;
  }
}

#account {
  transform: translate3d(0,0,0); /* Fix for strange flickering in firefox when hovering inputs */

  .credit-card {
    padding: 6px 5px 4px;
    margin: 0 8px;
    background: #EEE;
    border-radius: 3px;
    font-family: "Consolas", "Courier New", "Courier";
  }

  .v-card .title { margin-bottom: 0 }
  .v-card .grey--text {
    font-size: 14px;
    line-height: 1.2rem;
  }

  .v-card {
    margin: 0 8px 16px 8px;
  }

  .main-content {
    margin: 0 -8px;
  }
}

</style>
<i18n src='../i18n/pages/Account.json'></i18n>
<i18n src='../i18n/Subscription.json'></i18n>
