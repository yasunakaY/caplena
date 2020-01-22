import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/pages/Home'
import Account from '@/pages/Account'
import Subscription from '@/pages/Subscription'
import CodingFullyOpen from '@/pages/CodingFullyOpen'
import Upload from '@/pages/Upload'
import Append from '@/pages/Append'
import ProjectsManage from '@/pages/ProjectsManage'
import ChartsManage from '@/pages/ChartsManage'
import DashboardsManage from '@/pages/DashboardsManage'
import ChartEditor from '@/pages/ChartEditor'
import Dashboard from '@/pages/Dashboard'
import PageNotFound from '@/pages/PageNotFound'
import AccessDenied from '@/pages/AccessDenied.vue'

import { store } from '@/store'

Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: '/app',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.home') }
      }
    },
    {
      path: '/account',
      name: 'account',
      component: Account,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.account') }
      }
    },
    {
      path: '/account/subscription',
      name: 'subscription',
      component: Subscription,
      meta: {
        breadcrumbs: ['account'],
        breadcrumbName: function (props) { return this.$t('breadcrumbs.subscription') }
      }
    },
    {
      path: '/projects/:id/coding',
      name: 'project-coding',
      component: CodingFullyOpen,
      meta: {
        breadcrumbs: ['projects-manage', 'projects-manage-id'],
        breadcrumbName: function (props) { return this.$t('breadcrumbs.coding', { question: props.questionName }) },
        breadcrumbParams: function (props) { return !props.questionID ? false : { id: props.questionID } }
      }
    },
    {
      path: '/upload',
      name: 'upload',
      component: Upload,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.upload') }
      }
    },
    {
      path: '/projects/:id/append',
      name: 'project-append',
      component: Append,
      meta: {
        breadcrumbs: ['projects-manage', 'projects-manage-id'],
        breadcrumbName: function (props) { return this.$t('breadcrumbs.append', { project: props.projectName }) },
        breadcrumbParams: function (props) { return !props.chartID ? false : { id: props.projectID } }
      }
    },
    {
      path: '/projects',
      name: 'projects-manage',
      component: ProjectsManage,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.projects-manage') }
      }
    },
    {
      path: '/projects/:id',
      name: 'projects-manage-id',
      component: ProjectsManage,
      meta: {
        breadcrumbs: ['projects-manage'],
        breadcrumbName: function (props) { return props.projectName },
        breadcrumbParams: function (props) { return !props.projectID ? false : { id: props.projectID } }
      }
    },

    // Visualizations
    {
      path: '/charts',
      name: 'charts-manage',
      component: ChartsManage,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.charts-manage') }
      }
    },
    {
      path: '/charts/:id',
      name: 'chart-details',
      component: ChartEditor,
      meta: {
        breadcrumbs: ['charts-manage'],
        breadcrumbName: function (props) { return props.chartName || '' },
        breadcrumbParams: function (props) { return !props.chartID ? false : { id: props.chartID } },
        breadcrumbQuery: function (props) { return props.questionID ? { question: props.questionID } : {} }
      }
    },

    {
      path: '/dashboards',
      name: 'dashboards-manage',
      component: DashboardsManage,
      meta: {
        breadcrumbName: function (props) { return this.$t('breadcrumbs.dashboards-manage') }
      }
    },
    {
      path: '/dashboards/:id',
      name: 'dashboard-details',
      component: Dashboard,
      meta: {
        allowAnonymous: true,
        breadcrumbs: ['dashboards-manage'],
        breadcrumbName: function (props) { return props.dashboardName || '' },
        breadcrumbParams: function (props) { return !props.dashboardID ? false : { id: props.dashboardID } }
      }
    },

    // the default route, when none of the above matches:
    {
      path: '*',
      name: 'not-found',
      component: PageNotFound,
      meta: {
        breadcrumbName: function (props) { return '404' }
      }
    },

    // The access denied route, which doesn't have a path either
    {
      path: '*',
      name: 'access-denied',
      component: AccessDenied,
      meta: {
        allowAnonymous: true,
        breadcrumbName: function (props) { return '403' }
      }
    }
  ]
})

/* router.beforeEach((to, from, next) => {
  // Check if a dynamic module should be loaded
  if (to.name in DynamicModules) store.registerModule(to.name, DynamicModules[to.name])
  next()
})
*/

router.beforeEach((to, from, next) => {
  store.commit('setErrorStatus', 0)
  // we must wait for the initial loading of the user
  // except if the route explicitly allows anonymous access
  if (store.state.user.id === -1 && !to.meta.allowAnonymous) {
    store.watch(
      (state) => state.user.id,
      (value) => { if (value !== -1) next() }
    )
  } else next()
})

/*
router.afterEach((to, from) => {
  // Check if a dynamic module should be unloaded
  console.log('after')
  if (from.name in DynamicModules) store.unregisterModule(from.name, DynamicModules[from.name])
}) */

export default router
