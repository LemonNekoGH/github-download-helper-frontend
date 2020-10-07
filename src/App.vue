<template>
  <v-app>
    <v-app-bar app elevate-on-scroll>
      <v-btn @click="returnToMain" icon v-if="$store.state.showAppBarIcon">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title v-text="toolbarTitle + ' - 当前有' + $store.state.onlineNumber + '人正在使用'"></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/about">
        <v-icon>mdi-information-outline</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content app>
      <v-divider></v-divider>
      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
      <v-snackbar color="orange" v-model="snackbar">已切换到后台继续进行</v-snackbar>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import {State} from "@/store";

export default Vue.extend({
  name: 'App',
  data: () => ({
    toolbarTitle: "Github资源下载助手",
    snackbar: false
  }),
  mounted() {
    this.$router.beforeEach((to, from, next) => {
      this.$store.state.showAppBarIcon = to.path == "/about"
      if (to.path == "/about") {
        this.$data.toolbarTitle = "Github资源下载助手 - 关于"
        if (this.$store.state.theState != State.READY &&
            this.$store.state.theState != State.COMPLETED) {
          this.$data.snackbar = true
          setTimeout(() => this.$data.snackbar = false, 3000)
        }
      } else {
        this.$data.toolbarTitle = "Github资源下载助手"
      }
      next()
    })
    window.onbeforeunload = () => {
      this.$store.state.ws.close(1000)
      if (this.$store.state.theState !== 0 &&
          this.$store.state.theState !== 5 &&
          this.$store.state.theState !== 6) {
        return window.confirm()
      }
    }
  },
  methods: {
    returnToMain() {
      this.$router.replace("/")
    }
  }
});
</script>