<template>
  <div class="main-content home">
    <div>

      <!-- ====== Overview stats ====== -->
      <div style="display: flex">
        <v-card class="info-box" style="flex: 1; margin-right: 20px">
          <v-card-title>
            <div>
              <div class="title">{{ $t('overview.title') }}</div>
              <div class="grey--text subtitle-1">{{ $t('overview.description') }}</div>
            </div>
          </v-card-title>

          <v-icon size="60" color="accent">mdi-chart-bubble</v-icon>
          <v-card-text>
            <ul>
              <li>{{ $t('overview.number_of_projects') }}<span class="highlight-text">
                {{ projects.length }}
              </span></li>
              <li>{{ $t('overview.number_of_questions') }}<span class="highlight-text">{{ questions.length }} </span></li>
              <li>{{ $t('overview.number_incomplete_questions') }}<span class="highlight-text">
                {{ questionsNotCompleted.length }}
              </span></li>
              <li>{{ $t('overview.number_total') }}<span class="highlight-text">{{ totalAnswers }}</span></li>
            </ul>
          </v-card-text>
        </v-card>

        <!-- ====== Actions box ====== -->
        <v-card class="info-box" style="flex: 1">
          <v-card-title>
            <div>
              <div class="title">{{ $t('app_actions.title') }}</div>
              <div class="grey--text subtitle-1">{{ $t('app_actions.next_steps') }}</div>
            </div>
          </v-card-title>
          <v-icon size="60" color="accent">mdi-hand-pointing-right</v-icon>
          <v-card-text>
            <div>
              <v-btn style="margin-right: 8px"
                     color="primary"
                     exact :to="{ name: 'upload' }">{{ $t('app_actions.new') }}</v-btn>
              <v-btn style="margin-right: 8px"
                     color="primary"
                     outlined
                     exact
                     :to="{ name: 'projects-manage' }">{{ $t('app_actions.projects_manage') }}</v-btn>
              <v-btn color="primary" outlined exact :to="{ name: 'account' }">{{ $t('app_actions.profile') }}</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- ====== Newest Projects ====== -->
      <v-card class="info-box">
        <v-card-title>
          <div>
            <div class="title">{{ $t('current.title') }}</div>
            <div class="grey--text subtitle-1">{{ $t('current.description') }}</div>
          </div>

        </v-card-title>
        <v-icon size="60" color="accent">mdi-fire</v-icon>
        <v-card-text>
          <ul ref="currentList" id="currentList">
            <li v-for="(row, rowIdx) in questionsNewestNotCompleted" :key="rowIdx">
              <router-link exact :to="{ name: 'project-coding', params: { id: row.id } }">
                {{ $t('question.of_project', { question: row.name, project: row.project_obj.name }) }}</router-link>
              <span v-html="$t('current.item', {answers: row.nanswers, reviewed: row.nreviewed, lastmodified: $options.filters.fromnow(row.last_modified), created: $options.filters.datelong(row.created)})"/>
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </div>

    <v-progress-linear v-if="!loaded" :indeterminate="true" />

  </div>
</template>

<script>
import tour from '../mixins/tour.js'

export default {
  codit: true,
  name: 'Home',
  mixins: [tour],
  data () {
    return {
      projects: [],
      tour: null,
      loaded: false
    }
  },
  computed: {
    questions () { return _.flatten(_.map(this.projects, 'questions')) },
    questionsNotCompleted () { return this.questions.filter(s => !s.completed) },
    questionsNewestNotCompleted () { return _.sortBy(this.questionsNotCompleted, 'created').reverse().slice(0, 3) },
    totalReviewed () { return _.sumBy(this.questions, 'reviewed') },
    totalAnswers () { return _.sumBy(this.questions, 'nanswers') }
  },
  created () {
    api.get('/api/projects/').then(res => {
      // Link questions back to their parent project object
      res.data.forEach(p => p.questions.forEach(q => { q.project_obj = p }))
      this.$set(this, 'projects', res.data)
      this.loaded = true
    }).catch(err => {
      this.$root.snackMsg(this.$t('error_item', {'step': this.$t('loading.while'), 'item': this.$t('project.item')}))
      console.log(err)
    })
  },
  mounted () {
    this.tour = [
      {
        title: 'tour.welcome.title',
        content: 'tour.welcome.description',
        target: '#buttonHelp',
        placement: 'left',
        yOffset: -10
      },
      {
        title: 'tour.mainmenu.title',
        content: 'tour.mainmenu.description',
        target: '#mainMenuTrigger',
        placement: 'right',
        yOffset: -10
      },
      {
        title: 'tour.example.title',
        content: 'tour.example.description',
        target: '#currentList',
        placement: 'top',
        xOffset: 30
      }
    ]
  }
}
</script>

<style lang=scss>

.home {

  .info-box {
    margin: 12px 0 12px 0;
  }

  .v-card .v-icon { position: absolute; right: 16px; top: 16px }
  .v-card .title { margin-bottom: -5px }

  ul li {
    line-height: 1.5em;
  }
}

</style>

<i18n src='../i18n/pages/Home.json'></i18n>
