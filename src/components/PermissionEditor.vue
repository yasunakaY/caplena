<template>
  <!-- ====== Permission Editor ===== -->
  <v-dialog v-model="show" width="900px" @keydown.esc="close">
    <v-card class="permission-editor">
      <v-card-title primary-title class="headline">{{ $t('title', {
        entity_type: $t(`${entityType}.item`),
        entity_name: entityName
      }) }}</v-card-title>

      <alert v-if="loadingFailed" type="error">
        {{ this.$t('error', {'step': this.$t('loading.while')}) }}
      </alert>

      <v-progress-linear :indeterminate="true" v-if="!loaded" />
      <v-card-text v-else class="container">
        <div style="min-width: 280px">
          <v-text-field :label="$t('search')"
                        outlined
                        color="primary"
                        :append-icon="!search ? 'mdi-account-search' : ''"
                        @input="updateSearchDebounced"
                        :clearable="!!search"
                        class="search"
                        hide-details />
          <div class="users" v-if="usersFiltered.length">
            <v-list two-line subheader>
              <v-list-item v-for="user in usersFiltered"
                           :key="user.id"
                           :class="{ selected: userSelected === String(user.id) }"
                           class="user-tile"
                           @click="userSelected = String(user.id)">
                <v-list-item-content data-private>
                  <v-list-item-title>{{ user.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
          <empty-state v-else
                       icon="mdi-account-remove-outline"
                       :size="80"
                       :label="$t('search_not_found')" />
        </div>

        <div class="permissions">

          <table>

            <tr>
              <th>
                <a href="#" @click.prevent="selectAll">{{ $t('select_all') }}</a> |
              <a href="#" @click.prevent="deselectAll">{{ $t('deselect_all') }}</a></th>
              <th><span>{{ $t('object_level') }}</span></th>
              <th>
                <helptip position="bottom" :width="650">
                  <span v-html="$t('organization_wide_helptip')" />
                </helptip>
                <span>{{ $t('organization_wide') }}</span>
              </th>
            </tr>

            <tbody>

              <tr v-for="(perm, permIdx) in permissionOptions"
                  :key="permIdx"
                  :class="{ disabled: permissionsSelected[perm].immutable }"
                  @click="clickPermission(perm)">
                <td><label v-html="$t(`permissions.${perm}`)" /></td>

                <td @click.stop.prevent>
                  <v-checkbox v-model="permissions[userSelected].permissions[perm].value"
                              dense
                              :disabled="permissionsSelected[perm].immutable"
                              hide-details />
                </td>

                <td @click.stop.prevent>
                  <v-checkbox v-model="permissionsSelected[perm].org_wide"
                              disabled
                              dense
                              hide-details />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn outlined @click="close">{{ $t('close') }}</v-btn>
        <v-btn color="primary" @click="save">{{ $t('save.title') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
'use strict'

import Vuex from 'vuex'

export default {
  codit: true,
  name: 'PermissionEditor',
  props: {
    value: { type: Boolean, default: false },
    entityType: { type: String, default: '' },
    entityId: { type: Number, default: -1 },
    entityName: { type: String, default: '' },
    permissionOptions: { type: Array, default: () => [] }
  },

  data () {
    return {
      search: '',

      loadingFailed: false,
      loaded: false,

      permissions: {},

      userSelected: -1,

      updateSearchDebounced: _.debounce((val) => {
        this.search = val
      }, 250)
    }
  },

  computed: {
    ...Vuex.mapState([
      'user'
    ]),
    show: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    },

    usersSorted () {
      return _(this.permissions).map((userPermissions, key) => userPermissions).sortBy(u => u.name.toLowerCase()).value()
    },

    usersFiltered () {
      if (!this.search) return this.usersSorted
      let s = this.search.toLowerCase()
      return this.usersSorted.filter(u =>
        u.name.toLowerCase().indexOf(s) !== -1 || u.email.toLowerCase().indexOf(s) !== -1
      )
    },

    permissionsSelected () {
      return this.permissions[this.userSelected].permissions
    },

    entityURI () {
      return `/api/${this.entityType}s/${this.entityId}/permissions`
    }
  },

  watch: {
    show: {
      immediate: true,
      handler (val) {
        if (val) this.init()
      }
    }
  },

  methods: {
    init () {
      this.$set(this, 'permissions', {})
      this.userSelected = ''
      this.search = ''
      this.loaded = false

      api.get(this.entityURI).then((res) => {
        let permissions = res.data

        let defaultPerms = Object.assign({}, ...this.permissionOptions.map(perm => ({[perm]: { value: false }})))
        // The API only returns permissions which are set
        // For the UI to work responsively, we have to assign permissionOptions, also if they are false
        _.each(permissions, (userPermissions, key) => {
          userPermissions.permissions = { ..._.cloneDeep(defaultPerms), ...userPermissions.permissions }
        })

        this.$set(this, 'permissions', permissions)
        this.userSelected = String(this.usersSorted[0].id)
        this.loaded = true
      }).catch((err) => {
        this.loadingFailed = true
        this.$maybeRaiseAPIPromiseErr(err)
      })
    },

    clickPermission (permission) {
      let permSelected = this.permissions[this.userSelected].permissions[permission]
      if (!permSelected.immutable) permSelected.value = !permSelected.value
    },

    selectAll () {
      _.each(this.permissions[this.userSelected].permissions, p => { p.value = true })
    },

    deselectAll () {
      _.each(this.permissions[this.userSelected].permissions, p => { if (!p.immutable) p.value = false })
    },

    close () { this.$emit('input', false) },

    save () {
      let name = _.clone(this.entityName)
      api.patch(this.entityURI, this.permissions).then(res => {
        this.$root.snackMsg(this.$t('saving_done', { entity_name: name, entity_type: this.$t(`${this.entityType}.item`) }))
      }).catch(err => {
        this.$root.snackMsg(this.$t('error', {'step': this.$t('save.saving')}))
        this.$maybeRaiseAPIPromiseErr(err)
      })

      this.show = false
    }
  }

}

</script>

<style lang=scss>

.permission-editor {
  .container {
    display: flex;
    flex-direction: row;
  }

  .search {
    margin: 0 8px 8px 0;
  }

  .users {
    flex: 1;
    z-index: 1;
    max-height: 380px;
    overflow-y: scroll;

    .v-list {
      background: none;
    }

    .user-tile {
      cursor: pointer;
      border-radius: 4px 0 0 4px!important;
      border: 1px solid transparent;
      border-right: 0;
      margin-bottom: 2px;
      &.selected {
        background: #EEE;
        border: 1px solid #DDD;
        border-right: 0;
        .v-list__tile__title { font-weight: bold; }
      }
      &:hover {
        background: $col-ans-focus-bg;
        border: 1px solid #DDD;
        border-right: 0;
      }
    }
  }

  .permissions {
    background: #EEE;
    padding: 8px 12px;
    flex: 3;
    border-radius: 4px;
    border: 1px solid #DDD;
    margin-left: -1px;

    table {
      width: 100%;
      border-spacing: 0;
    }

    th {
      height: 140px;
      position: relative;
      vertical-align: top;
      text-align: left;

      &:last-child {
        text-align: center;
      }

      > span {
        position: absolute;
        display: inline-block;
        transform: rotate(-90deg);
        transform-origin: 0;
        bottom: -5px;
        left: calc(50%);
        font-weight: normal;
        font-style: italic;
        white-space: nowrap;
      }

      > .helptip {
        font-weight: normal;
      }
    }

    tbody tr {
      cursor: pointer;

      label {
        pointer-events: none;
      }

      &.disabled {
        cursor: not-allowed;
      }

      &:hover {
        background: $col-ans-focus-bg;
      }
    }

    td:nth-child(2), th:nth-child(2) {
      background-color: $col-soft-green;
    }

    td:nth-child(3), th:nth-child(3) {
      background-color: #E3E3E3;
      cursor: default;
    }

    td {
      padding: 4px 0;
      &:nth-child(1) {
        padding-left: 6px;
      }
      &:nth-child(2), &:nth-child(3) {
        width: 40px;
        text-align: right
      }
      .v-input {
        margin: 0;
        padding: 0;
        justify-content: flex-end;
        text-align: right;
      }
    }
  }

}

</style>

<i18n src='@/i18n/components/PermissionEditor.json'></i18n>
