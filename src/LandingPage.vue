<template>
  <div id="mountpoint">
    <div ref="container" :class="{ 'hide-everything': showPrivacyPolicy || showTaC || showLanguages }">
      <div style="background: #0e5d88; color: #FFF; height: 30px; text-align: center; line-height: 30px; z-index: 1050; position: absolute; width: 100%">
        codit.co is now <b>caplena.com</b> | <a href="https://news.caplena.com" style="color: #FFF; text-decoration: underline">Read more</a>
      </div>
      <header class="row" id="header">
        <nav class="navbar navbar-default navbar-fixed-top" :class="{ 'is-scrolling': isScrolling }">
          <div class="container" style="position: relative">
            <!--========== Brand and toggle get grouped for better mobile display ==========-->
            <div class="navbar-header">
              <a class="navbar-brand" href="#header" :class="{ 'is-scrolling': isScrolling }">
                <img src="./assets/logo.svg" alt="Logo Caplena">
              </a>
              <button type="button" class="navbar-toggle collapsed" @click="showMenu=!showMenu">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"/>
                <span class="icon-bar"/>
                <span class="icon-bar"/>
              </button>
            </div>
            <!--========== Collect the nav links, forms, and other content for toggling ==========-->
            <transition name="slide-out-right">
              <div v-if="!isScrolling" :class="{'pull-right' : !showMenu}" id="lang-menu">
                <a href="/en/" style="margin-left: 20px">EN</a>
                <span style="margin: 0 10px"> | </span>
                <a href="/de/">DE</a>
              </div>
            </transition>
            <div class="navbar-collapse" id="main-navbar" :class="{'collapse': !showMenu}">

              <a class="btn btn-warning pull-right hidden-xs" href="#register">
                <span>{{ $t('register.description_short') }}</span>
              </a>

              <ul class="nav navbar-nav navbar-right" id="login-menu">
                <li>
                  <a class="hidden-xs" @click.prevent="clickLogin" href="#">
                    <span v-if="!login.user || maintenance.active">Login</span>
                    <span v-else>Hi {{ login.user.first_name }}, {{ $t('login.goto') }}</span>
                  </a>
                </li>
              </ul>

              <ul class="nav navbar-nav navbar-left">
                <!--  <li><a href="#product">{{ $t('product.title') }}</a></li> -->
                <li><a href="#features">{{ $t('benefits.title') }}</a></li>
                <li><a href="#usecases">{{ $t('usecases.title') }}</a></li>
                <li><a href="#reviews">{{ $t('testimonials.title') }}</a></li>
                <li><a href="#faq">{{ $t('faq.title') }}</a></li>
                <li><a href="https://news.caplena.com">News</a></li>
              </ul>
            </div>
            <!--========== /.navbar-collapse ==========-->
          </div>
          <!--========== /.container-fluid ==========-->
        </nav>

        <div class="top-banner row m0 text-center">
          <div class="container">
            <div class="row">
              <div class="col-md-7 split-header text-left">

                <h1>{{ $t('title') }}</h1>

                <p class="textshadow" style="min-height: 90px">
                  <span v-html="$t('title-typed-beginning')"/>
                  <span class="title-typed-ending-placeholder"/>
                </p>
                <ul class="title-typed-ending-phrases">
                  <li v-for="(phrase, idx) in $ta('title-typed-endings')" :key="idx">
                    <span class="title-typed-ending">^1000{{ phrase }}</span>
                  </li>
                </ul>

                <div class="actions">
                  <div class="text-shadow" style="margin-bottom: 10px; font-size: 20px; font-weight: normal">
                    <a target="_blank" href="https://app.hubspot.com/meetings/maurice3">{{ $t('title-demo') }}</a>
                    {{ $t('title-demo-or') }}
                  </div>
                  <a href="#register" class="btn btn-primary btn-lg video register-btn">
                    <i class="mdi mdi-account-circle md-36" style="vertical-align: middle; margin: 0 10px 5px -5px"/>
                    {{ $t('register.description_short') }}
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <!--==========The Product==========-->
      <section class="row the-product" id="product" ref="product">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('product.title') }}</h2>

            <p>
              <!-- <span class="helptip">
                <span class="anchor">{{ $t('to_code') }} <i class="mdi" style="vertical-align: top; font-size:smaller; opacity: 0.6; margin-left: -0.4em"/></span>
                <span class="content">
                  <span v-html="$t('code_helptip')"/><br >
                  <img src="./assets/landing/images/coding_helptip.png" width="300" >
                </span>
              </span> -->
              <span v-html="$t('product.description')" />
            </p>
          </div>
          <div class="row codit-product-note-feature text-center">
            <!-- <video autoplay loop muted playsinline>
              <source src="/static/codit_product.mp4" type="video/mp4">
              Your browser does not support the video tag.
            </video> -->
            <!--==========Feature Noted top right==========-->
            <!-- <div class="feature-note right top wow fadeInRight" :class="{ 'show-cont': showFeatures.one }">
              <div class="indicator">
                <div class="plus-icon" @click="showFeatures.one=!showFeatures.one">
                  <span class="plus">+</span>
                </div>
              </div>
              <div class="feature-name" v-html="$t('product.features[0]')" />
            </div> -->
            <!--==========Feature Noted top left==========-->
            <!--
                <div class="feature-note left top wow fadeInLeft">
                    <div class="indicator">
                        <div class="plus-icon">
                            <span class="plus">+</span>
                        </div>
                    </div>
                    <div class="feature-name">
                        Gps tracker
                    </div>
                </div>
                -->
            <div class="feature-as-response">
              <div>
                <div v-html="$t('product.row1.answer')" class="answer" />
                <div class="arr">&gt;</div>
                <div>
                  <code-chip :category="$t('product.row1.category')"
                             active
                             :class="{ selected: codeChipSelected === 1 }"
                             @mouseover.native="codeChipSelected = 1"
                             :color="$color.medium.red">{{ $t('product.row1.code1') }}</code-chip>
                  <code-chip :category="$t('product.row1.category')"
                             active
                             :color="$color.medium.red"
                             :class="{ selected: codeChipSelected === 2 }"
                             @mouseover.native="codeChipSelected = 2">{{ $t('product.row1.code2') }}</code-chip>
                </div>
              </div>
              <div>
                <div v-html="$t('product.row2.answer')" class="answer" />
                <div class="arr">&gt;</div>
                <div>
                  <code-chip :category="$t('product.row2.category')"
                             active
                             :class="{ selected: codeChipSelected === 3 }"
                             @mouseover.native="codeChipSelected = 3"
                             :color="$color.medium.purple">{{ $t('product.row2.code1') }}</code-chip>
                  <code-chip :category="$t('product.row2.category')"
                             active
                             :class="{ selected: codeChipSelected === 4 }"
                             @mouseover.native="codeChipSelected = 4"
                             :color="$color.medium.purple">{{ $t('product.row2.code2') }}</code-chip>
                </div>
              </div>
              <div>
                <div v-html="$t('product.row3.answer')" class="answer" />
                <div class="arr">&gt;</div>
                <div>
                  <code-chip :category="$t('product.row3.category')"
                             active
                             :class="{ selected: codeChipSelected === 5 }"
                             @mouseover.native="codeChipSelected = 5"
                             :color="$color.medium.green">{{ $t('product.row3.code1') }}</code-chip>
                  <code-chip :category="$t('product.row3.category')"
                             active
                             :class="{ selected: codeChipSelected === 6 }"
                             @mouseover.native="codeChipSelected = 6"
                             :color="$color.medium.green">{{ $t('product.row3.code2') }}</code-chip>
                </div>
              </div>
              <div>
                <div v-html="$t('product.row4.answer')" class="answer" />
                <div class="arr">&gt;</div>
                <div>
                  <code-chip :category="$t('product.row4.category')"
                             active
                             :class="{ selected: codeChipSelected === 7 }"
                             @mouseover.native="codeChipSelected = 7"
                             :color="$color.medium.blue">{{ $t('product.row4.code1') }}</code-chip>
                </div>
              </div>
            </div>

            <!--==========Feature Noted bottom right==========-->
            <!-- <div class="feature-note right bottom wow fadeInUp" :class="{ 'show-cont': showFeatures.two }">
              <div class="indicator">
                <div class="plus-icon" @click="showFeatures.two=!showFeatures.two">
                  <span class="plus">+</span>
                </div>
              </div>
              <div class="feature-name" v-html="$t('product.features[1]')" />
            </div> -->
            <!--==========Feature Noted bottom left==========-->

            <!-- <div class="feature-note left bottom wow fadeInLeft" :class="{ 'show-cont': showFeatures.three }">
              <div class="indicator">
                <div class="plus-icon" @click="showFeatures.three=!showFeatures.three">
                  <span class="plus">+</span>
                </div>
              </div>
              <div class="feature-name" v-html="$t('product.features[2]')" />
            </div> -->
          </div>
        </div>
      </section>

      <!--========== Applications ==========-->
      <section class="row applications" id="applications">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('applications.title') }}</h2>
            <p>{{ $t('applications.description') }}</p>
          </div>
          <!-- <div class="row benefit-notes"> -->
          <div class="nav-center m-b-40 wow fadeInUp">
            <!-- Nav tabs -->
            <ul class="nav nav-pills" role="tablist" id="schedule-tabs">
              <li role="presentation" :class="{'active' : videoTab === 0}">
                <a href="" @click.prevent.stop="videoTab=0">{{ $t('applications.openends.tab') }}<!-- {{ $t('videos.market_research.link_title') }} --></a>
              </li>
              <li role="presentation" :class="{'active' : videoTab === 1}">
                <a href="" @click.prevent.stop="videoTab=1">{{ $t('applications.lists.tab') }}</a>
              </li>
              <li role="presentation" :class="{'active' : videoTab === 2}">
                <a href="" @click.prevent.stop="videoTab=2">{{ $t('applications.managed.tab') }}</a>
              </li>
            </ul>
          </div>

          <div class="tab-content wow fadeInUp" data-wow-delay="0.3s">
            <div role="tabpanel" class="tab-pane" id="tab-1" :class="{'active' : videoTab === 0}">
              <div class="codit-product-note-feature text-center overwidth-allowed">
                <div class="video-container" :class="{ 'show-video': showVideo }"
                     @click="showVideo = true">
                  <video v-if="showVideo" muted playsinline autoplay controls>
                    <source src="/static/codit_demo_nps.mp4" type="video/mp4">
                    {{ $t('video.tag_not_supported') }}
                  </video>
                  <template v-else>
                    <img class="video-placeholder" src="./assets/landing/images/placeholder_video_nps.png" >
                    <img class="play-btn" src="./assets/landing/images/play-btn-big.png">
                  </template>
                </div>

                <!-- <div class="feature-note right top wow fadeInRight" :class="{ 'show-cont': showFeatures.one }">
                  <div class="indicator">
                    <div class="plus-icon" @click="showFeatures.one=!showFeatures.one">
                      <span class="plus">+</span>
                    </div>
                  </div>
                  <div class="feature-name" v-html="$t('product.features[0]')" />
                </div> -->
                <!--==========Feature Noted top left==========-->
                <!-- <div class="feature-note right bottom wow fadeInUp" :class="{ 'show-cont': showFeatures.two }">
                  <div class="indicator">
                    <div class="plus-icon" @click="showFeatures.two=!showFeatures.two">
                      <span class="plus">+</span>
                    </div>
                  </div>
                  <div class="feature-name" v-html="$t('product.features[1]')" />
                </div> -->

                <!--==========Feature Noted bottom left==========-->
                <!-- <div class="feature-note left bottom wow fadeInLeft" :class="{ 'show-cont': showFeatures.three }">
                  <div class="indicator">
                    <div class="plus-icon" @click="showFeatures.three=!showFeatures.three">
                      <span class="plus">+</span>
                    </div>
                  </div>
                  <div class="feature-name" v-html="$t('product.features[2]')" />
                </div> -->
              </div>
            </div>
            <!-- end .tabpanel -->
            <div role="tabpanel" class="tab-pane" id="tab-2" :class="{'active' : videoTab === 1}">
              <div class="codit-product-note-feature text-center overwidth-allowed">
                <div class="video-container" :class="{ 'show-video': showVideo }"
                     @click="showVideo = true">
                  <video v-if="showVideo" muted playsinline autoplay controls>
                    <source src="/static/codit_demo_list.mp4" type="video/mp4">
                    {{ $t('video.tag_not_supported') }}
                  </video>
                  <template v-else>
                    <img class="video-placeholder" src="./assets/landing/images/placeholder_video_list.png" >
                    <img class="play-btn" src="./assets/landing/images/play-btn-big.png">
                  </template>
                </div>
              </div>
            </div>
            <!-- end .tabpanel -->
            <div role="tabpanel" class="tab-pane" id="tab-3" :class="{'active' : videoTab === 2}">
              <p class="lead overwidth-allowed text-center">{{ $t('applications.managed.title') }}</p>
              <p style="">{{ $t('applications.managed.description') }}</p>

              <p style="margin: 20px auto; color: #0e5d88">{{ $t('applications.managed.form') }}</p>

              <form @submit.prevent="doRequestQuote">
                <div style="display: flex">
                  <div :class="{ 'has-error': managed.missing && !register.first_name }" style="flex: 1">
                    <input type="text"
                           :disabled="managed.success"
                           v-model="register.first_name"
                           name="Name"
                           class="form-control"
                           :placeholder="$t('register.name')"
                           required>
                  </div>

                  <div :class="{ 'has-error': managed.missing && !register.email }" style="flex: 1; margin-left: 16px">
                    <input type="email"
                           :disabled="managed.success || managed.loading"
                           v-model="register.email"
                           name="Email"
                           class="form-control"
                           :placeholder="$t('register.email')"
                           required>
                  </div>
                </div>

                <div style="display: flex; margin-top: 12px">
                  <div :class="{ 'has-error': managed.missing && !managed.nresponses }" style="flex: 1">
                    <input type="number"
                           :disabled="managed.success || managed.loading"
                           min="100"
                           v-model="managed.nresponses"
                           name="nrespondents"
                           class="form-control"
                           :placeholder="$t('applications.managed.nrespondents')"
                           required>
                  </div>

                  <div :class="{ 'has-error': managed.missing && !managed.nquestions }" style="flex: 1; margin-left: 16px">
                    <input type="number"
                           :disabled="managed.success || managed.loading"
                           v-model="managed.nquestions"
                           min="1"
                           name="nquestions"
                           class="form-control"
                           :placeholder="$t('applications.managed.nquestions')"
                           required>
                  </div>
                </div>

                <div style="display: flex; margin-top: 12px">
                  <div :class="{ 'has-error': managed.missing && !managed.language }" style="flex: 1">
                    <select v-model="managed.language"
                            class="form-control"
                            :class="{ placeholder: managed.language === '' }"
                            required>
                      <option value="" disabled hidden selected>{{ $t('applications.managed.language') }}</option>
                      <option value="en">{{ $t('language.en') }}</option>
                      <option value="de">{{ $t('language.de') }}</option>
                      <option value="fr">{{ $t('language.fr') }}</option>
                      <option value="es">{{ $t('language.es') }}</option>
                      <option value="it">{{ $t('language.it') }}</option>
                    </select>
                  </div>

                  <div :class="{ 'has-error': managed.missing && !managed.survey_category }" style="flex: 1; margin-left: 16px">
                    <select v-model="managed.survey_category"
                            class="form-control" :class="{ placeholder: managed.survey_category === '' }"
                            required>
                      <option value="" disabled hidden selected>{{ $t('applications.managed.survey_category') }}</option>
                      <option :value="cat.value" v-for="cat in questionCategoriesItems" :key="cat.value">{{ cat.text }}</option>
                    </select>
                  </div>
                </div>

                <div :class="{ 'has-error': managed.missing && !managed.message }">
                  <textarea class="form-control"
                            rows="4"
                            :disabled="managed.success || managed.loading"
                            v-model="managed.message"
                            name="message"
                            style="margin-top: 12px"
                            :placeholder="$t('applications.managed.message')"/>
                </div>

                <p class="text-center help-block text-danger"
                   style="margin-top: 12px"
                   v-if="managed.missing">{{ $t('applications.managed.missing') }}</p>

                <p class="text-center help-block text-danger"
                   style="margin-top: 12px"
                   v-if="managed.failed">{{ $t('applications.managed.failed') }}</p>

                <button type="submit"
                        :disabled="managed.success || managed.loading"
                        class="btn btn-block"
                        style="margin-top: 12px"
                        :class="{ 'animated' : managed.failed && !managed.loading, 'shake': managed.failed && !managed.loading }">
                  <span v-if="managed.success">{{ $t('applications.managed.success') }}</span>
                  <span v-else>{{ $t('applications.managed.submit') }}</span>
                </button>
              </form>

            </div>
            <!-- end .tabpanel -->
          </div>
          <!-- end .tab-content -->
        </div>
      </section>

      <!--==========The Benefits==========-->
      <section class="row the-benefits" id="features">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('benefits.title') }}</h2>
            <p>{{ $t('benefits.description') }}</p>
          </div>
          <div class="row benefit-notes">
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-motorbike" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.ai.title') }}</h4>
                  <p>{{ $t('benefits.ai.description') }}</p>
                </div>
              </div>
            </div>
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp" data-wow-delay="0.3s">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-book-open-variant" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.codebook.title') }}</h4>
                  <p>{{ $t('benefits.codebook.description') }}</p>
                </div>
              </div>
            </div>
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp" data-wow-delay="0.6s">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-emoticon-outline" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.sentiment.title') }}</h4>
                  <p>{{ $t('benefits.sentiment.description') }}</p>
                </div>
              </div>
            </div>
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp" data-wow-delay="0.9s">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-security" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.security.title') }}</h4>
                  <p>{{ $t('benefits.security.description') }}</p>
                </div>
              </div>
            </div>
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp" data-wow-delay="1.2s">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-cloud-print" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.data.title') }}</h4>
                  <p>{{ $t('benefits.data.description') }}</p>
                </div>
              </div>
            </div>
            <!--==========Single Benefit==========-->
            <div class="col-sm-6 col-md-4 benefit wow fadeInUp" data-wow-delay="1.5s">
              <div class="media">
                <div class="media-left">
                  <span><i class="mdi md-36 mdi-face-agent" /></span>
                </div>
                <div class="media-body">
                  <h4>{{ $t('benefits.support.title') }}</h4>
                  <p>{{ $t('benefits.support.description') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!--==========Use Cases==========-->
      <section class="row usecases" id="usecases">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('usecases.title') }}</h2>
            <p>{{ $t('usecases.description') }}</p>
          </div>
          <!-- <div class="row benefit-notes"> -->
          <div class="nav-center m-b-40 wow fadeInUp">
            <!-- Nav tabs -->
            <ul class="nav nav-pills usecases-links" role="tablist" id="schedule-tabs">
              <li role="presentation" :class="{'active' : usecaseTab === 0}">
                <a href="" @click.prevent.stop="usecaseTab=0">{{ $t('usecases.market_research.link_title') }}</a>
              </li>
              <li role="presentation" :class="{'active' : usecaseTab === 1}">
                <a href="" @click.prevent.stop="usecaseTab=1">{{ $t('usecases.hr_customer.link_title') }}</a>
              </li>
              <li role="presentation" :class="{'active' : usecaseTab === 2}">
                <a href="" @click.prevent.stop="usecaseTab=2">{{ $t('usecases.students_academia.link_title') }}</a>
              </li>
            </ul>
          </div>

          <div class="tab-content wow fadeInUp" data-wow-delay="0.3s">
            <div role="tabpanel" class="tab-pane" id="tab-1" :class="{'active' : usecaseTab === 0}">
              <p class="lead overwidth-allowed text-center">{{ $t('usecases.market_research.tab_title') }}</p><!-- https://www.bcg.com/en-ch/publications/2013/cost-efficiency-asset-optimization-six-steps-achieving-competitive-advantage-cost-excellence.aspx -->
              <p>{{ $t('usecases.market_research.intro') }}</p>
              <ul>
                <li v-for="(benefit, idx) in $ta('usecases.market_research.benefits')"
                    :key="idx">{{ benefit }}</li>
              </ul>
              <p v-html="$t('usecases.market_research.outro')" />
            </div>
            <!-- end .tabpanel -->
            <div role="tabpanel" class="tab-pane" id="tab-2" :class="{'active' : usecaseTab === 1}">
              <p class="lead overwidth-allowed text-center">{{ $t('usecases.hr_customer.tab_title') }}</p>
              <p>{{ $t('usecases.hr_customer.intro') }}</p>
              <ul>
                <li v-for="(benefit, idx) in $ta('usecases.hr_customer.benefits')"
                    :key="idx">{{ benefit }}</li>
              </ul>
              <p v-html="$t('usecases.hr_customer.outro')" />

            </div>
            <!-- end .tabpanel -->
            <div role="tabpanel" class="tab-pane" id="tab-3" :class="{'active' : usecaseTab === 2}">
              <p class="lead overwidth-allowed text-center">{{ $t('usecases.students_academia.tab_title') }}</p>
              <p>{{ $t('usecases.students_academia.intro') }}</p>
              <ul>
                <li v-for="(benefit, idx) in $ta('usecases.students_academia.benefits')"
                    :key="idx">{{ benefit }}</li>
              </ul>
              <p v-html="$t('usecases.students_academia.outro')" />
            </div>
            <!-- end .tabpanel -->
          </div>
          <!-- end .tab-content -->
        </div>
      </section>

      <!--========== Testimonials ==========-->
      <section class="row reviews" id="reviews">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('testimonials.title') }}</h2>
            <p>{{ $t('testimonials.description') }}</p>
          </div>
          <div class="row">
            <!--==========Review==========-->
            <div class="review col-sm-4 wow fadeIn" data-wow-delay="">
              <img src="./assets/landing/images/quote.png" alt="" class="review-sign">
              <p>At Factworks we were looking for an efficient and reliable solution for analyzing open-ended survey responses to complement our text analytics offering. We needed a flexible solution which we found in Caplena, whose intelligent algorithm has increased our efficiency with both tracking and ad hoc studies. The team is very responsive and capable of providing even highly customized solutions.</p>
            </div>
            <!--==========Review==========-->
            <div class="review col-sm-4 wow fadeIn">
              <img src="./assets/landing/images/quote.png" alt="0.3s" class="review-sign">
              <p>At Link we have chosen Caplena as our everyday tool for coding responses. It helped us to become significantly more efficient at evaluating open-ended questions, radically improved our data management and enabled us to execute on projects with tens of thousands of responses.</p>
            </div>
            <!--==========Review==========-->
            <div class="review col-sm-4 wow fadeIn" data-wow-delay="0.6s">
              <img src="./assets/landing/images/quote.png" alt="" class="review-sign">
              <p>At success drivers we were in need of a powerful survey-coding platform for our new NPS.ai product. After evaluating a number of commercial and open-source solutions we found Caplena, which outperformed all alternatives by a mile. We now use Caplena to perform insightful and automated key driver analysis on NPS surveys for our clients and can wholly recommend it.</p>
            </div>
          </div>
          <div class="row">
            <!--==========Review==========-->
            <div class="review col-sm-4 wow fadeInUp" data-wow-delay="">
              <div>
                Selina Pietsch, Analyst at <a target="_blank" href="https://www.factworks.com/">Factworks</a>
              </div>
              <img src="./assets/landing/images/testimonial_selina.jpg" alt="" class="reviewer">
            </div>
            <div class="review col-sm-4 wow fadeInUp" data-wow-delay="0.3s">
              <div>
                Thomas Bauer, Head IT Operations at
                <a target="_blank" href="https://link.ch">Link</a>
              </div>
              <img src="./assets/landing/images/testimonial_thomas.jpg" alt="" class="reviewer">
            </div>
            <div class="review col-sm-4 wow fadeInUp" data-wow-delay="0.6s">
              <div>
                Dr. Frank Buckler, CEO & founder at
                <a target="_blank" href="https://www.success-drivers.de">Success Drivers</a>
              </div>
              <img src="./assets/landing/images/testimonial_frank.jpg" alt="" class="reviewer">
            </div>
          </div>
        </div>
      </section>

      <!--========== Pricing ==========-->
      <!--
      <section class="row plan-pricing" id="pricing">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('pricing.title') }}</h2>
            <p>{{ $t('pricing.description') }}</p>
          </div>
          <div class="col-sm-8 col-sm-offset-2 col-md-3 col-md-offset-0 wow fadeInUp">
            <div class="pricing">
              <div class="pricing__header">
                <h4 class="pricing__title">{{ $t('plans.10.name') }}</h4>
                <h4 class="pricing__price">€{{ planFeatures[10].price }}</h4>
              </div>
              // end .pricing__header
              <div class="pricing__content">
                <ul>
                  <li>
                    {{ planFeatures[10].credits }} {{ $t('credits_monthly') }}
                    <span class="helptip">
                      <span class="anchor"><i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/></span>
                      <span class="content" style="left: -40px; top: 30px">
                        {{ $t('helptip_credit') }}
                        <i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/>
                      </span>
                    </span>
                  </li>
                  <li v-for="(text, idx) in $ta('plans.10.features')" :key="idx" v-html="text" />
                </ul>
                // end  list unstyled
              </div>
              // end .pricing__content
            </div>
            // end .pricing
          </div>
          // end .col-sm-8 col-sm-offset-2 col-md-3
          <div class="col-sm-8 col-sm-offset-2 col-md-3 col-md-offset-0 wow fadeInUp" data-wow-delay="0.3s">
            <div class="pricing">
              <div class="pricing__header">
                <h4 class="pricing__title">{{ $t('plans.100.name') }}</h4>
                <h4 class="pricing__price">€{{ planFeatures[100].price }}</h4>
              </div>
              // end .pricing__header
              <div class="pricing__content">
                <ul>
                  <li>
                    {{ planFeatures[100].credits }} {{ $t('credits_oneoff') }}
                    <span class="helptip">
                      <span class="anchor"><i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/></span>
                      <span class="content" style="left: -40px; top: 30px">
                        {{ $t('helptip_credit') }}
                        <i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/>
                      </span>
                    </span>
                  </li>
                  <li v-for="(text, idx) in $ta('plans.100.features')" :key="idx" v-html="text" />
                </ul>
                // end  list unstyled
              </div>
              // end .pricing__content
            </div>
            // end .pricing
          </div>

      // end .col-sm-8 col-sm-offset-2 col-md-3
      <div class="col-sm-8 col-sm-offset-2 col-md-3 col-md-offset-0 wow fadeInUp" data-wow-delay="0.6s">
        <div class="pricing">add pricing--featured class to highlight
          <div class="pricing__header">
            <h4 class="pricing__title">{{ $t('plans.20.name') }}</h4>
            <h4 class="pricing__price">€{{ planFeatures[20].price }} {{ $t('price_monthly') }}</h4>
          </div>
          // end .pricing__header
          <div class="pricing__content">
            <ul>
              <li>
                {{ planFeatures[20].credits }} {{ $t('credits_monthly') }}
                <span class="helptip">
                  <span class="anchor"><i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/></span>
                  <span class="content" style="left: -40px; top: 30px">
                    {{ $t('helptip_credit') }}
                    <i class="mdi" style="vertical-align: baseline; font-size:inherit; opacity: 0.6;"/>
                  </span>
                </span>
              </li>
              <li v-for="(text, idx) in $ta('plans.20.features')" :key="idx" v-html="text" />
            </ul>
            // end  list unstyled
          </div>
          // end .pricing__content
          // end .pricing__cta
        </div>
        // end .pricing
      </div>
      // end .col-sm-8 col-sm-offset-2 col-md-3
      <div class="col-sm-8 col-sm-offset-2 col-md-3 col-md-offset-0 wow fadeInUp" data-wow-delay="0.9s">
        <div class="pricing">
          <div class="pricing__header">
            <h4 class="pricing__title">{{ $t('plans.99.name') }}</h4>
            <h4 class="pricing__price"><a :href="emailAddrLink">{{ $t('contact_us') }}</a></h4>
          </div>
          // end .pricing__header
          <div class="pricing__content">
            <ul>
              <li>{{ $t('credits_unlimited') }}</li>
              <li v-for="(text, idx) in $ta('plans.99.features')" :key="idx" v-html="text" />
            </ul>
            // end  list unstyled
          </div>
          // end .pricing__content
          // end .pricing__cta
        </div>
        // end .pricing
      </div>
      // end .col-sm-8 col-sm-offset-2 col-md-3
    </div>
    <p style="text-align: center; line-height: 20px" class="wow fadeInUp" data-wow-delay="0.9s">
      <i class="mdi" style="font-size: 19px; height: 20px; line-height: 20px">stars</i>
      <span style="vertical-align: top">{{ $t('pricing.special_offer') }}</span> <a style="vertical-align: top" :href="emailAddrLink">{{ $t('contact_us') }}.</a>
    </p>
        // end .row
      </section>
    -->

      <!--========== Register ==========-->
      <section class="row newsletter" id="register">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('register.title') }}</h2>
            <p>{{ $t('register.description') }} <a href="https://app.hubspot.com/meetings/maurice3">{{ $t('register.request_demo') }}</a>.</p>
          </div>
          <div class="row newsletter-form" v-if="maintenance.active" style="text-align: center">
            <div v-html="maintenance.msg" />
          </div>
          <form id="subscribeform" class="row newsletter-form" @submit.prevent="doRegister" v-else>
            <div class="form-group" :class="{ 'has-error': register.failedResponse.first_name }">
              <input type="text" :disabled="register.success" v-model="register.first_name" name="Name" class="form-control" :placeholder="$t('register.name')" required>

              <p class="text-center help-block text-danger" v-if="register.failedResponse.first_name">{{ register.failedResponse.first_name[0] }}</p>
            </div>
            <div class="form-group" :class="{ 'has-error': register.failedResponse.email }">
              <input type="email" :disabled="register.success" v-model="register.email" name="email" class="form-control" :placeholder="$t('register.email')" required>
              <p class="text-center help-block text-danger" v-if="register.failedResponse.email">{{ register.failedResponse.email[0] }}</p>

            </div>
            <div class="row">
              <div class="form-group col-sm-6" :class="{ 'has-error': register.failedResponse.password1 || register.failedResponse.password2 }">
                <input type="password" :disabled="register.success" v-model="register.password1" name="password" class="form-control" :placeholder="$t('register.password')" required>
                <p class="text-center help-block text-danger" v-if="register.failedResponse.password1">{{ register.failedResponse.password1[0] }}</p>
              </div>

              <div class="form-group col-sm-6" :class="{ 'has-error': register.failedResponse.password1 || register.failedResponse.password2 }">
                <input type="password" :disabled="register.success" v-model="register.password2" name="password-repeat" class="form-control" :placeholder="$t('register.password-repeat')" required>

                <p class="text-center help-block text-danger" v-if="register.failedResponse.password2">{{ register.failedResponse.password2[0] }}</p>
              </div>
            </div>

            <!-- <div class="form-group" :class="{ 'has-error': register.failedResponse.signup_reason }">
              <textarea class="form-control" :disabled="register.success" v-model="register.signup_reason" name="message" :placeholder="$t('register.referral')"/>
              <p class="text-center help-block text-danger" v-if="register.failedResponse.signup_reason">{{ register.failedResponse.signup_reason[0] }}</p>
            </div> -->

            <div class="form-group">
              <label class="accept">
                <input type="checkbox"
                       :disabled="register.success"
                       v-model="register.agreeTac">

                <span class="checkmark" />

                {{ $t('register.accept.i_accept') }}
                <a href="#" @click.prevent="showTaC=true">{{ $t('register.accept.terms-and-conditions') }}</a>
                {{ $t('register.accept.and') }}
                <a href="#" @click.prevent="showPrivacyPolicy=true">{{ $t('privacy-policy') }}</a>
              </label>
              <p class="text-center help-block text-danger"
                 v-if="register.agreeTacFailed">{{ $t('register.accept.failed') }}</p>
            </div>

            <p class="help-block text-danger" style="margin-bottom:20px" v-if="register.failedResponse.non_field_errors"> {{ register.failedResponse.non_field_errors[0] }}</p>
            <p v-else-if="register.success" style="margin-bottom: 20px"
               v-html="$t('register.activation_sent', { email: register.email })" />

            <button type="submit" :disabled="register.loading||register.success" id="js-contact-btn" class="btn btn-block" :class="{ 'animated' : register.failed && !register.loading, 'shake': register.failed && !register.loading }"><span v-if="register.loading">{{ $t('register.loading') }}</span><span v-else-if="register.success">{{ $t('register.success') }}</span><span v-else>{{ $t('register.button') }}</span></button>

            <!-- <p>
              <i class="mdi" style="font-size: 14px">lock</i>
              {{ $t('register.infos') }}
              <a href="#" @click.prevent="showPrivacyPolicy=true">{{ $t('privacy-policy') }}</a>
            </p> -->

            <transition name="custom-classes-transition" enter-active-class="animated fadeOverlayIn fast" leave-active-class="animated fadeOverlayOut fast">
              <div class="overlay" v-if="register.successModal" @click="register.successModal=false"/>
            </transition>
            <transition name="custom-classes-transition" enter-active-class="animated fast fadeInDown" leave-active-class="animated fadeOutUp fast">
              <div id="successModal" v-if="register.successModal" class="modal-input">
                <button class="mfp-close custom_close" title="Close (Esc)" type="button"
                        @click="register.successModal=false">&#215;</button>

                <p class="success" v-html="$t('register.activation_sent', { email: register.email })" style="text-align: center" />
                <i class="mdi md-48 mdi-email"
                   style="color: #4CAF50; margin-top: 20px" />
              </div>
            </transition>
          </form>
        </div>
      </section>

      <!--==========FAQS==========-->
      <section class="row faqs" id="faq">
        <div class="container">
          <div class="row section-header wow fadeInUp">
            <h2>{{ $t('faq.title') }}</h2>
            <p v-html="$t('faq.intro', { email: emailAddr })"/>
          </div>
          <div class="row">
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp">
              <h4 v-html="$t('faq.content[0].question')"/>
              <p v-html="$t('faq.content[0].answer')"/>
            </div>
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp">
              <h4 v-html="$t('faq.content[1].question')"/>
              <p v-html="$t('faq.content[1].answer')"/>
            </div>
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp" data-wow-delay="0.3s">
              <h4 v-html="$t('faq.content[2].question')"/>
              <p v-html="$t('faq.content[2].answer')"/>
            </div>
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp" data-wow-delay="0.3s">
              <h4 v-html="$t('faq.content[3].question')"/>
              <p v-html="$t('faq.content[3].answer')"/>
            </div>
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp" data-wow-delay="0.6s">
              <h4 v-html="$t('faq.content[4].question')"/>
              <p v-html="$t('faq.content[4].answer')"/>
              <a href="#" @click.prevent="showLanguages=true">{{ $t('supported-languages') }}</a>
            </div>
            <!--==========Faq==========-->
            <div class="col-sm-6 faq wow fadeInUp" data-wow-delay="0.6s">
              <h4 v-html="$t('faq.content[5].question')"/>
              <p v-html="$t('faq.content[5].answer', { email: emailAddr })"/>
            </div>
          </div>
        </div>
      </section>

      <!--==========Contact==========-->
      <section class="row contact" id="contact">
        <div id="mapBox" ref="mapBox" class="row m0"/>
        <!-- Flippable Contact Box -->
        <div class="flip-box-container row m0">
          <div class="flip-box row m0 wow fadeIn">
            <!-- Contact Address (front Side) -->
            <div class="row contact-box flip-box-part">
              <h2>{{ $t('contact.title') }}</h2>
              <ul class="nav">
                <li>
                  <i class="mdi mdi-phone" style="margin-right: 10px" /> +41 79 455 52 17
                </li>
                <li>
                  <i class="mdi mdi-domain" style="margin-right: 10px" />Zweierstrasse 165, 8003 Zurich
                </li>
                <li><i class="mdi mdi-email" style="margin-right: 10px; margin-top: 9px" />
                  <a :href="emailAddrLink">{{ emailAddr }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      <!-- // End Contact Box -->
      </section>

      <!--==========Footer==========-->
      <footer class="row">
        <div class="container">
          <div class="row m0 social-links">
            <ul class="nav">
              <!--                     <li class="wow fadeInUp"><a href="#"><i class="fa fa-facebook"></i></a></li> -->
              <li class="wow fadeInUp" data-wow-delay="0.1s">
                <a href="https://twitter.com/CaplenaCH" style="padding: 5px 4px 5px 6px; line-height: 40px">
                <img src="./assets/landing/images/logo_twitter.svg" ></a>
              </li>
              <li class="wow fadeInUp" data-wow-delay="0.2s">
                <a href="https://www.linkedin.com/company/27224654/" style="padding: 6px 7px 8px; line-height: 36px">
                  <img src="./assets/landing/images/logo_linkedin.svg" >
                </a>
              </li>
<!--                <li class="wow fadeInUp" data-wow-delay="0.3s"><a href="#"><i class="fa fa-youtube"></i></a></li>
                    <li class="wow fadeInUp" data-wow-delay="0.4s"><a href="#"><i class="fa fa-google-plus"></i></a></li>
                    <li class="wow fadeInUp" data-wow-delay="0.5s"><a href="#"><i class="fa fa-pinterest"></i></a></li>
 -->        </ul>
            <div style="margin: 18px 0 -18px 0">
              <a title="Realtime application protection" href="https://www.sqreen.com/?utm_source=badge" target="_blank">
                <img style="width:109px;height:36px" src="https://s3-eu-west-1.amazonaws.com/sqreen-assets/badges/20171107/sqreen-mono-badge.svg" alt="Sqreen | Runtime Application Protection">
              </a>
            </div>
          </div>
          <div class="row m0 menu-rights">
            <ul class="nav footer-menu">
              <li><a href="/en/">English</a></li>
              <li><a href="/de/">Deutsch</a></li>
              <li><a href="#" @click.prevent="showTaC=true">{{ $t('terms-and-conditions') }}</a></li>
              <li><a href="#" @click.prevent="showPrivacyPolicy=true">{{ $t('privacy-policy') }}</a></li>
              <li><a href="https://news.caplena.com">News</a></li>
              <li><a href="https://blog.caplena.com">Blog</a></li>
              <li><a href="https://consulting.caplena.com">Consulting</a></li>
            </ul>
            <p>Copyright © 2018. Caplena GmbH, Zurich.
            <br class="small-divide"> All rights reserved</p>
          </div>
        </div>
      </footer>

      <!--========== Login Popup ==========-->
      <transition name="custom-classes-transition" enter-active-class="animated fadeOverlayIn fast" leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="login.show" @click="closeLogin()"/>
      </transition>
      <transition name="custom-classes-transition" enter-active-class="animated fast fadeInDown" leave-active-class="animated fadeOutUp fast">
        <div id="login" v-if="login.show"
             class="flip-container modal-input"
             :class="{ 'rotated' : pwreset.show, unsupported: unsupportedBrowser }">
          <button class="mfp-close custom_close" title="Close (Esc)" type="button" @click="closeLogin()">&#215;</button>
          <div v-if="unsupportedBrowser">
            <i class="mdi md-48 mdi-alert-circle" style="color: #FF5252; display: block; text-align: center; margin-bottom: 20px; margin-top: -30px" />
            <p v-html="$t('login.browser_unsupported')" />
            <ul>
              <li><a href="https://www.google.com/chrome/">Google Chrome</a> version ≥ {{ supportedBrowsers.chrome }}</li>
              <li><a href="https://www.mozilla.org/en-US/firefox/new/">Mozilla Firefox</a> version ≥ {{ supportedBrowsers.firefox }}</li>
              <li><a href="http://www.opera.com/">Opera</a> version ≥ {{ supportedBrowsers.opera }}</li>
              <li><a href="https://www.apple.com/lae/safari/">Apple Safari</a> version ≥ {{ supportedBrowsers.safari }}</li>
              <li><a href="https://www.microsoft.com/en-us/windows/microsoft-edge">Microsoft Edge</a> version ≥ {{ supportedBrowsers.msedge }}</li>
            </ul>

          </div>
          <div v-else-if="maintenance.active">
            <div v-html="maintenance.msg" />
          </div>
          <div v-else class="flip">
            <div class="flip-front">
              <div >
                <form action="/login" @submit.prevent="doLogin">
                  <div class="form-group" :class="{ 'has-error': login.failed }">
                    <input ref="loginEmail" v-model="login.email" type="email" name="Email" class="form-control" :placeholder="$t('register.email')" required>
                  </div>
                  <div class="form-group" :class="{ 'has-error': login.failed }">
                    <input v-model="login.password" type="password" name="password" class="form-control" :placeholder="$t('register.password')" required>
                  </div>
                  <div class="submit-area-2 row m0">
                    <button type="submit" class="btn btn-rounded js-preorder-btn btn-block" :disabled="login.loading" :class="{ 'animated' : login.failed && !login.loading, 'shake': login.failed && !login.loading }"><span v-if="!login.loading">{{ $t('login.button') }}</span><span v-else>{{ $t('login.loading') }}</span></button>
                  </div>
                  <p class="text-center help-block text-danger" style="margin: 10px 0 0" v-if="login.failed">{{ login.failedMessage }}</p>
                </form>
              </div>
              <a class="rotatebtn" href="#" @click.prevent="pwreset.show=true">{{ $t('pwreset.question') }}</a>
            </div>
            <div class="flip-rear">
              <div class="form-group" :class="{ 'has-error': pwreset.failed }" v-if="!pwreset.success">
                <input ref="pwresetEmail" v-model="login.email" type="email" name="Email" class="form-control" :placeholder="$t('pwreset.email')" required>
              </div>
              <div class="submit-area-2 row m0" v-if="!pwreset.success">
                <button type="submit" class="btn btn-rounded js-preorder-btn btn-block"
                        :disabled="pwreset.loading"
                        :class="{ 'animated' : pwreset.failed && !pwreset.loading, 'shake': pwreset.failed && !pwreset.loading }"
                        @click="doResetpw">
                  <span v-if="!pwreset.loading">{{ $t('pwreset.action') }}</span>
                  <span v-else>{{ $t('pwreset.loading') }}</span>
                </button>
              </div>
              <p class="text-center help-block text-danger" style="margin: 10px 0 0" v-if="pwreset.failed">
                {{ pwreset.failedMessage }}</p>
              <p class="success" style="margin: 10px 0 0" v-if="pwreset.success">
                {{ $t('pwreset.success') }}</p>
              <a class="rotatebtn" href="#" @click.prevent="pwreset.show=false">{{ $t('pwreset.back_to_login') }}</a>
            </div>
          </div>
        </div>
      </transition>

      <!--========== New Password dialog ==========-->
      <transition name="custom-classes-transition" enter-active-class="animated fadeOverlayIn fast" leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="newpw.show" @click="newpw.show=false"/>
      </transition>
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInDown"
                  leave-active-class="animated fadeOutUp fast">
        <div id="newpwModal" v-if="newpw.show" class="modal-input">
          <button class="mfp-close custom_close" title="Close (Esc)" type="button" @click="newpw.show=false">&#215;</button>
          <div v-if="!newpw.success">
            <div class="form-group" :disabled="newpw.loading" :class="{ 'has-error': newpw.failedResponse.new_password1 || newpw.failedResponse.new_password2 }">
              <input v-model="newpw.password1" type="password" name="password1" class="form-control" :placeholder="$t('newpw.password1')" required>
              <p class="text-center help-block text-danger" v-if="newpw.failedResponse.new_password1">
                {{ newpw.failedResponse.new_password1[0] }}
              </p>
            </div>
            <div class="form-group" :class="{ 'has-error': newpw.failedResponse.new_password1 || newpw.failedResponse.new_password2 }">
              <input v-model="newpw.password2" :disabled="newpw.loading" type="password" name="password" class="form-control" :placeholder="$t('newpw.password2')" required>
              <p class="text-center help-block text-danger" v-if="newpw.failedResponse.new_password2">
                {{ newpw.failedResponse.new_password2[0] }}
              </p>
            </div>
            <div class="submit-area-2 row m0">
              <button type="submit" class="btn btn-rounded js-preorder-btn btn-block"
                      :disabled="newpw.loading"
                      :class="{ 'animated' : newpw.failed && !newpw.loading, 'shake': newpw.failed && !newpw.loading }"
                      @click="saveNewpw">
                <span v-if="!newpw.loading">{{ $t('newpw.button') }}</span>
              <span v-else>{{ $t('newpw.loading') }}</span></button>
            </div>
            <p class="text-center help-block text-danger" style="margin: 10px 0 0" v-if="newpw.failedResponse.token || newpw.failedResponse.uid">
              {{ $t('newpw.token_invalid') }}
            </p>
          </div>
          <p v-else class="success" style="margin: 10px 0 0">{{ $t('newpw.success') }}</p>
        </div>
      </transition>

      <!--========== Account activation dialog ==========-->
      <transition name="custom-classes-transition"
                  enter-active-class="animated fadeOverlayIn fast"
                  leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="activateAccount.show" @click="activateAccount.show=false"/>
      </transition>
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInDown"
                  leave-active-class="animated fadeOutUp fast">
        <div v-if="activateAccount.show" class="modal-input">
          <button class="mfp-close custom_close" title="Close (Esc)" type="button"
                  @click="activateAccount.show=false">&#215;</button>
          <p v-if="activateAccount.loading" class="success" style="text-align: center"
             v-html="$t('register.activation_loading')" />
          <template v-else-if="activateAccount.success">
            <p class="success" v-html="$t('register.activation_success')" style="text-align: center" />
            <i class="mdi md-48 mdi-check-circle" style="color: #4CAF50; display: block; text-align: center; margin-top: 20px" />
          </template>
          <template v-else-if="activateAccount.failed">
            <p class="success" style="text-align: center" >
              <span v-html="$t('register.activation_failed')" />
              <a :href="emailAddrLink">{{ emailAddr }}</a>
            </p>
            <i class="mdi md-48 mdi-alert-circle" style="color: #FF5252; display: block; text-align: center; margin-top: 20px" />
          </template>
        </div>
      </transition>

      <!--========== PRIVACY POLICY==========-->
      <transition name="custom-classes-transition"
                  enter-active-class="animated fadeOverlayIn fast"
                  leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="showPrivacyPolicy" @click="showPrivacyPolicy=false"/>
      </transition>
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInDown"
                  leave-active-class="animated fadeOutUp fast">
        <div v-if="showPrivacyPolicy" class="modal-text">
          <button class="mfp-close custom_close"
                  title="Close" type="button" @click="showPrivacyPolicy=false">&#215;</button>
          <privacy-policy class="success" :email="emailAddr"/>
        </div>
      </transition>

      <!--========== TERMS AND CONDITIONS ==========-->
      <transition name="custom-classes-transition"
                  enter-active-class="animated fadeOverlayIn fast"
                  leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="showTaC" @click="showTaC=false"/>
      </transition>
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInDown"
                  leave-active-class="animated fadeOutUp fast">
        <div v-if="showTaC" class="modal-text">
          <button class="mfp-close custom_close"
                  title="Close" type="button" @click="showTaC=false">&#215;</button>
          <terms-and-conditions class="success" :email="emailAddr"/>
        </div>
      </transition>

      <!--========== SUPPORTED LANGUAGES ==========-->
      <transition name="custom-classes-transition"
                  enter-active-class="animated fadeOverlayIn fast"
                  leave-active-class="animated fadeOverlayOut fast">
        <div class="overlay" v-if="showLanguages" @click="showLanguages=false"/>
      </transition>
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInDown"
                  leave-active-class="animated fadeOutUp fast">
        <div v-if="showLanguages" class="modal-text" style="width: 250px; margin-left: -125px">
          <button class="mfp-close custom_close"
                  title="Close" type="button" @click="showLanguages=false">&#215;</button>
          <supported-languages class="success"/>
        </div>
      </transition>

      <!--========== COOKIES ACCEPT BAR ==========-->
      <transition name="custom-classes-transition"
                  enter-active-class="animated fast fadeInUp"
                  leave-active-class="animated fadeOutDown fast">
        <div id="cookie-accept" v-if="showCookiesAccept">
          <p class="success">{{ $t('cookies.msg') }} <a href="#" @click.prevent="showPrivacyPolicy=true">{{ $t('cookies.more') }}</a></p>
          <a class="btn btn-warning" @click.prevent="acceptCookies">{{ $t('cookies.accept') }}</a>
        </div>
      </transition>

    </div>
  </div>
</template>

<script>
'use strict'

import 'animate.css'
import '@mdi/font/css/materialdesignicons.css'
import './assets/landing/bootstrap.css'
import { WOW } from 'wowjs'
import './assets/landing/style.css'
import './assets/landing/print.scss'
import './assets/landing/theme-blue-orange.css'
import PrivacyPolicy from './components/PrivacyPolicy.vue'
import SupportedLanguages from './components/SupportedLanguages.vue'
import TermsAndConditions from './components/TermsAndConditions.vue'

import CodeChip from './components/CodeChip'

import DriftMixin from '@/mixins/drift.js'
import Cookies from 'js-cookie'
import Typed from 'typed.js'

require('smoothscroll')

import { QUESTION_CATEGORIES, QUESTION_CATEGORY_NONE } from '@/settings/constants'

let SUPPORTED_BROWSERS = {
  chrome: '60',
  chromium: '60',
  firefox: '50',
  safari: '11',
  opera: '46',
  msedge: '16',
  vivaldi: '1.14'
}

export default {
  components: {
    'privacy-policy': PrivacyPolicy,
    'supported-languages': SupportedLanguages,
    'terms-and-conditions': TermsAndConditions,
    'code-chip': CodeChip
  },
  mixins: [DriftMixin],
  data () {
    return {
      showMenu: false,
      content: { 'description': '' },
      showFeatures: { one: false, two: false, three: false },
      login: { show: false, email: '', password: '', loading: false, failed: false, user: null, failedMessage: '' },
      pwreset: { show: false, loading: false, failed: false, failedMessage: '', success: false },
      newpw: { token: '', uid: '', show: false, password1: '', password2: '', loading: false, failed: false, failedResponse: '' },
      register: {
        loading: false,
        first_name: '',
        email: '',
        password1: '',
        password2: '',
        agreeTac: false,
        agreeTacFailed: false,
        signup_reason: '',
        failed: false,
        failedResponse: {},
        success: false,
        successModal: false
      },
      managed: {
        nresponses: null,
        nquestions: null,
        language: '',
        survey_category: '',
        message: '',
        loading: false,
        missing: false,
        success: false,
        failed: false
      },
      activateAccount: { key: '', show: false, success: false, loading: false, failed: false },
      isScrolling: false,
      showPrivacyPolicy: false,
      showLanguages: false,
      showTaC: false,
      showCookiesAccept: false,
      emailKey: '',
      usecaseTab: 0,
      codeChipSelected: 0,
      videoTab: 0,
      showVideo: false,
      unsupportedBrowser: false,
      maintenance: { active: false, msg: '' },
      supportedBrowsers: SUPPORTED_BROWSERS,
      planFeatures: []
    }
  },
  computed: {
    emailAddr () {
      // Code from http://www.jottings.com/obfuscator/
      let coded = 'CBuq@w5DaFB5.wqG'
      let shift = coded.length
      let link = ''
      let ltr = ''
      for (var i = 0; i < coded.length; i++) {
        if (this.emailKey.indexOf(coded.charAt(i)) === -1) {
          ltr = coded.charAt(i)
          link += (ltr)
        } else {
          ltr = (this.emailKey.indexOf(coded.charAt(i)) - shift + this.emailKey.length) % this.emailKey.length
          link += (this.emailKey.charAt(ltr))
        }
      }
      return link
    },
    emailAddrLink () {
      return 'mailto:' + this.emailAddr
    },

    questionCategoriesItems () {
      let it = _.filter(QUESTION_CATEGORIES, c => (c !== QUESTION_CATEGORY_NONE))
      return _.map(it, c => ({ value: c, text: this.$t(`question.category.${c}`) }))
    }
  },
  watch: {
    videoTab () { this.showVideo = false }
  },
  created () {
    let bowser = require('bowser')
    // Make strict check about supported browser
    this.unsupportedBrowser = !bowser.check(SUPPORTED_BROWSERS, true)
    if (this.unsupportedBrowser) console.log(bowser)
    document.title = this.$t('pagetitle')
    let description = document.createElement('meta')
    description.name = 'description'
    description.content = this.$t('title') + '. ' + this.$t('to_code') + ' ' + this.$t('description')
    document.head.appendChild(description)

    this.$api.get('/api/auth/user/', { dontReport: [401, 403], validateStatus: s => s >= 200 && s <= 403 }).then(res => {
      if (res.status === 200) this.$set(this.login, 'user', res.data)
      if (window.location.search.substr(1).startsWith('session_invalid')) {
        this.login.failedMessage = this.$t('login.session_expired')
        this.login.failed = true
        this.clickLogin()
      }
      this.initDrift()
    }).catch(err => {
      console.log(err)
    })

    this.$api.get('https://s3.eu-central-1.amazonaws.com/codit-public/status.json', { withCredentials: false }).then(res => {
      if ('maintenance' in res.data && res.data.maintenance.active) {
        // We assume that maintenance is ongoing, set the according messages
        this.maintenance.active = true
        this.maintenance.msg = res.data.maintenance[`msg_${this.$i18n.locale}`]
      }
    }).catch(err => console.log(err))
  },
  mounted () {
    // The scroll height checker to show / hide the menu
    document.addEventListener('scroll', this.handleScroll)

    let botToIgnore = navigator.userAgent.indexOf('Speed Insights') !== -1 || window.phantom || window._phantom
    if (!botToIgnore) {
      this.emailKey = '3nyQHV8CFZzg51ADmBKf4j0NvPMW2XcYGoEuTU7sk6lSLOwItqJRdie9xrahbp'

      if (process.env.CODIT_ENV === 'prod') {
        this.$ga.page({
          page: '/',
          title: 'Landing',
          location: window.location.href
        })
      }

      // WOW.js effect to show elements only when scrolled upon
      new WOW({
        mobile: false
      }).init()

      // Check if reset password token is present
      if (window.location.search.substr(1).startsWith('resettoken=')) {
        [this.newpw.uid, this.newpw.token] = decodeURIComponent(window.location.search.substr(1).slice(11)).split(':')
        this.newpw.show = true
      }

      // Check if account activation key is present
      if (window.location.search.substr(1).startsWith('activationkey=')) {
        let key = decodeURIComponent(window.location.search.slice(15))
        this.activateAccount.show = true
        this.activateAccount.loading = true
        this.$api.post('/api/auth/registration/verify-email/', { key: key }, { dontReport: [404] }).then(res => {
          this.activateAccount.loading = false
          if (res.status === 200) this.activateAccount.success = true
          else this.activateAccount.failed = true
          console.log(res)
        }).catch(err => {
          console.log(err)
          this.activateAccount.loading = false
          this.activateAccount.failed = true
        })
      }

      // Check if we should open privacy policy
      if (window.location.search.substr(1).startsWith('privacy-policy')) this.showPrivacyPolicy = true
      if (window.location.search.substr(1).startsWith('terms-and-conditions')) this.showTaC = true
      if (window.location.search.substr(1).startsWith('supported-languages')) this.showLanguages = true

      setTimeout(() => {
        if (Cookies.get('cookies-accepted-inception-cookie') !== '1') this.showCookiesAccept = true
      }, 1000)

      /* eslint-disable no-new */
      new Typed('.title-typed-ending-placeholder', {
        stringsElement: '.title-typed-ending-phrases',
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1800,
        startDelay: 1500,
        loop: true
      })
    }
  },
  methods: {
    initDrift () {
      this.loadDriftScript()
      let welcomeMessage = ''
      let awayMessage = ''
      if (this.login.user !== null) {
        welcomeMessage = this.$t('chat.personalized.welcome_online', { name: this.login.user.first_name })
        awayMessage = this.$t('chat.personalized.welcome_offline', { name: this.login.user.first_name })
        this.drift.identify(this.login.user.id, {
          email: this.login.user.email,
          name: this.login.user.first_name
        })
      } else {
        welcomeMessage = this.$t('chat.anonymous.welcome_online')
        awayMessage = this.$t('chat.anonymous.welcome_offline')
      }

      this.drift.config({
        locale: this.$i18n.locale,
        enableWelcomeMessage: true,
        messages: {
          welcomeMessage,
          awayMessage,
          thankYouMessage: this.$t('chat.follow_up'),
          emailCaptureMessage: this.$t('chat.email')
        }
      })

      this.loadDriftAPI()
    },
    acceptCookies () {
      this.showCookiesAccept = false
      Cookies.set('cookies-accepted-inception-cookie', '1', { expires: 180 })
    },
    closeLogin () {
      this.login.show = false
      this.login.failed = false
      this.login.failedMessage = ''
      this.login.password = ''
      this.pwreset.show = false
      this.pwreset.email = ''
      this.pwreset.failed = false
      this.pwreset.failedMessage = false
      this.pwreset.success = false
    },
    redirectToApp () {
      window.location = '/app/'
    },
    handleScroll (e) {
      this.isScrolling = document.body.scrollTop || document.documentElement.scrollTop > 99
    },
    clickLogin () {
      if (this.login.user !== null) this.redirectToApp()
      else {
        this.login.show = true
        if (!this.unsupportedBrowser && !this.maintenance.active) this.$nextTick(v => this.$refs.loginEmail.focus())
      }
    },
    doLogin () {
      if (this.login.loading) return
      this.login.loading = true
      this.login.failed = false
      this.$api.post('/api/auth/login/', { email: this.login.email, password: this.login.password }, {
        dontReport: [400, 401, 403], validateStatus: s => s >= 200 && s <= 403
      }).then(res => {
        this.login.loading = false
        if (!('success' in res.data) || !res.data.success) {
          if ('non_field_errors' in res.data) this.login.failedMessage = res.data.non_field_errors[0]
          else this.login.failedMessage = this.$t('login.invalid')
          this.login.failed = true
        } else {
          this.redirectToApp()
        }
      }).catch(err => {
        this.login.loading = false
        this.login.failedMessage = this.$t('login.error')
        this.login.failed = true
        console.log(err)
      })
    },
    doResetpw () {
      if (this.pwreset.loading) return
      this.pwreset.loading = true
      this.pwreset.failed = false
      this.$api.post('/api/auth/password/reset/', { email: this.login.email }, { dontReport: [400] }).then(res => {
        this.pwreset.loading = false
        if ('detail' in res.data) this.pwreset.success = true
        else if ('email' in res.data) {
          if ('email' in res.data.email) this.pwreset.failedMessage = res.data.email.email[0]
          else this.pwreset.failedMessage = res.data.email[0]
          this.pwreset.failed = true
        } else {
          this.pwreset.failedMessage = this.$t('pwreset.invalid')
          this.pwreset.failed = true
        }
      }).catch(err => {
        this.pwreset.loading = false
        this.pwreset.failedMessage = this.$t('pwreset.error')
        this.pwreset.failed = true
        console.log(err)
      })
    },
    saveNewpw () {
      if (this.newpw.loading) return
      this.newpw.loading = true
      this.newpw.failed = false
      this.$api.post('/api/auth/password/reset/confirm/', {
        uid: this.newpw.uid,
        token: this.newpw.token,
        new_password1: this.newpw.password1,
        new_password2: this.newpw.password2
      }, { dontReport: [400] }).then(res => {
        this.newpw.loading = false
        if ('detail' in res.data) this.newpw.success = true
        else {
          this.$set(this.newpw, 'failedResponse', res.data)
          this.newpw.failed = true
        }
      }).catch(err => {
        this.newpw.loading = false
        this.newpw.failedMessage = this.$t('newpw.error')
        this.newpw.failed = true
        console.log(err)
      })
    },
    doRegister () {
      if (this.register.loading) return
      if (!this.register.agreeTac) {
        this.register.agreeTacFailed = true
        return
      }
      this.register.agreeTacFailed = false
      this.register.loading = true
      this.register.failed = false
      this.$set(this.register, 'failedResponse', {})
      this.$api.post('/api/auth/registration/', this.register, { dontReport: [400] }).then(res => {
        this.register.loading = false
        if (res.status === 201) {
          this.register.success = true
          this.register.successModal = true
          this.register.failed = false
        } else {
          this.register.failedResponse = res.data
          this.register.failed = true
        }
      }).catch(err => {
        this.register.loading = false
        this.register.failed = true
        this.register.failedResponse = { non_field_errors: [this.$t('register.error')] }
        console.log(err)
      })
    },

    doRequestQuote () {
      if (this.managed.loading) return

      if (!this.register.first_name || !this.register.email || !this.managed.nresponses || !this.managed.nquestions ||
          !this.managed.language || !this.managed.survey_category || !this.managed.message) {
        this.managed.missing = true
        return
      }

      this.managed.missing = false
      this.managed.loading = true
      this.managed.failed = false

      const description = JSON.stringify({
        name: this.register.first_name,
        email: this.register.email,
        nquestions: this.managed.nquestions,
        nresponses: this.managed.nresponses,
        language: this.managed.language,
        survey_category: this.managed.survey_category,
        message: this.managed.message
      })

      this.$api.post('/api/bugreport/', { bugtype: 'F', description }).then(res => {
        this.managed.loading = false
        if (res.status === 201) {
          this.managed.success = true
        } else {
          this.managed.failed = true
        }
      }).catch(err => {
        this.managed.loading = false
        this.managed.failed = true
        console.error(err)
      })
    }
  }
}
</script>

<style lang=scss>

.feature-as-response {
  line-height: 40px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-flow: row wrap;

  > div {
    display: flex;
    margin-top: 20px;
  }

 > div:first-child {
    margin-top: 0;
 }

  .answer {
    background: #fbddad;
    font-weight: 300;
    line-height: 40px;
    border-radius: 40px;
    text-align: left;
    padding: 0 15px;
  }

  .arr {
    flex: 0;
    font-size: 40px;
    margin: 0 20px;
    color: #CCC;
  }

  .code-chip {
    background: #EEE;
  }
}

.usecases-links {
  display: block!important;
  ul { text-align: center!important; }
  li {
    padding-top: 10px!important;
    display: inline-block!important;
    float: none!important;
  }
  a {
    display: inline-block!important;
    float: none!important;
  }
}

.tab-pane >*:not(.overwidth-allowed) {
  max-width: 620px;
  margin: 0 auto;
  text-align: justify;
}

.tab-pane ul {
  margin-top: 10px!important;
  margin-bottom: 20px!important;
  li {
    color: #0e5d88;
    list-style-type: square;
  }
}

#lang-menu {
  float: right;
  margin-top: 8px;
  overflow: hidden;
  max-width: 95px;
  /*max-height: 50px;*/
  white-space: nowrap;
  span, a {
    line-height: 40px;
    color: #333;
    font-weight: 500;
    font-size: 16px;
  }
}

@media (max-width: 1199px) {
  #lang-menu {
    position: absolute;
    right: 30px;
    top: 60px;
  }
}

@media (max-width: 991px) {
  #lang-menu {
    position: absolute;
    right: 20px;
    top: -25px;
  }

  #login-menu {
    position: absolute;
    right: 0;
    top: 70px;
  }
}

@media (max-width: 767px) {
  #lang-menu {
    position: absolute;
    right: 80px;
    top: -7px;
  }
}

.slide-out-right-enter-active {
  transition: max-width 0.2s ease-out;
}
.slide-out-right-leave-active {
  transition: max-width 0.2s ease-in;
}
.slide-out-right-enter {
  max-width: 0px!important;
}
.slide-out-right-leave-to {
  max-width: 0px!important;
}

.title-typed-ending { border-bottom: 2px solid #ff5252; }

.typed-cursor {
  opacity: 1;
  animation: blink .7s infinite;
  @keyframes blink {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
  }
}

.pricing {
  padding: 20px 13px;
  .pricing__price {
    font-size: 23px;
  }
}

.success {
  color: #82898f;
  font: 300 20px/32px 'Poppins', sans-serif!important;
  margin: 10px 0 0;
}

.textshadow {
  /* text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black */
  text-shadow: 1px 1px 0px #FFF;
}

.help-block.text-danger * {
  color: #FF5B58;
}

#register .text-danger { text-align: left; padding-left: 5px;}

/* .register-btn .mdi::before { content: 'account_circle'; } */
.helptip .anchor .mdi::before { content: 'help'; }

.hide { display: none; }

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #FFF;
  opacity: 0.7;
  z-index: 2000;
}

.modal-input, .modal-text {
  box-shadow: 0 0 62px rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 50%;
  left: 50%;
  background: #FFF;
  z-index: 2005;

  .mfp-close {
  position: absolute;
  right: 16px;
  top: 5px;
  background: none;
  border: none;
  font: 300 30px/1 "Poppins", sans-serif;
  text-transform: uppercase;
  opacity: 0.4;
  transition: all 300ms linear 0s;
  }

  .mfp-close:hover {
  opacity: 1;
  }
}

.modal-input {
  margin-left: -216px;
  margin-top: -200px;
  width: 400px;
  padding: 48px 16px 32px;
}

.modal-text {
  top: 10%;
  width: 70%;
  margin-left: -35%;
  padding: 10px 16px 32px;
  height: 80%;
  overflow-y: scroll;
}

#login {
  height: 360px;
  .rotatebtn {
    display: block;
    position: absolute;
    width: 100%;
    bottom: -20px;
    right: 7px;
    text-align: right;
  }
}

#login.unsupported {
  height: 370px;
}

/* entire container, keeps perspective */
.flip-container {
  perspective: 1000px;

  /* flip speed goes here */
  .flip {
    transition: 0.6s;
    transform-style: preserve-3d;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .flip-front, .flip-rear {
    height: 100%;
    width: 100%;
    /* hide back of pane during swap */
    backface-visibility: hidden;

    position: absolute;
    top: 0;
    left: 0;
  }

  /* front pane, placed above back */
  .flip-front {
    /* for firefox 31 */
    transform: rotateY(0deg);
  }

  /* back, initially hidden pane */
  .flip-rear {
    transform: rotateY(180deg);
  }

}
/* flip the pane when hovered */
.flip-container.rotated .flip {
  transform: rotateY(180deg);
}

@keyframes fadeOverlayIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.7;
  }
}

.fadeOverlayIn {
  animation-name: fadeOverlayIn;
}

@keyframes fadeOverlayOut {
  from {
    opacity: 0.7;
  }

  to {
    opacity: 0;
  }
}

.fadeOverlayOut {
  animation-name: fadeOverlayOut;
}

.animated.fast {
  animation-duration: 0.3s;
}

#cookie-accept {
  position: fixed;
  bottom: 0;
  padding: 10px 0;
  width: 100%;
  background: #000;
  opacity: 0.9;
  display: flex;
  align-items: center;
  z-index: 10000;

  p {
    margin: 0 40px;
    padding: 0;
    flex: 1;
  }

  .btn {
    margin: 0 50px 0 10px;
    border-radius: 0px;
  }
}

.mdi.md-12 { font-size: 12px; }
.mdi.md-18 { font-size: 18px; }
.mdi.md-24 { font-size: 24px; }
.mdi.md-36 { font-size: 36px; }
.mdi.md-48 { font-size: 48px; }

/* html, body { height: 100%; overflow: hidden; }
#container { height: 100%; overflow: scroll } */
</style>

<i18n src='./i18n/Subscription.json'></i18n>
<i18n src='./i18n/LandingPage.json'></i18n>
<i18n src='./i18n/AppPage.json'></i18n>
