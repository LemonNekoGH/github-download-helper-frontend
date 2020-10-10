<template>
  <v-container style="height: 100%">
    <v-row align="center" justify="center" style="height: 100%">
      <v-col cols="10" lg="6" md="7" sm="7" xl="6">
        <v-text-field
            :disabled="$store.state.textFieldDisabled"
            :loading="$store.state.theState !== 0
                        && $store.state.theState !== 5 && $store.state.theState !== 7 && $store.state.theState !== 8"
            @click:append="help = true"
            append-icon="mdi-help-circle-outline" filled label="在此输入URL"
            prepend-inner-icon="mdi-github"
            shaped
            v-model="$store.state.urlToDownload">
          <template v-slot:progress>
            <v-progress-linear
                :value="$store.state.progress"
                absolute
                v-if="$store.state.theState === 3 || $store.state.theState === 2"
            ></v-progress-linear>
          </template>
        </v-text-field>
        <v-row align="center" dense id="captcha-container" justify="center">
          <vue-recaptcha
              @verify="getDownloadLink"
              ref="recaptcha" sitekey="6LdjY9AZAAAAANHxSZJz4dTVs_sdVMu0wYMrirpR"
              v-if="!$store.state.readyToDownload">
            <v-btn
                :disabled="$store.state.btnDisabled" outlined
                text v-text="btnText"></v-btn>
          </vue-recaptcha>
          <v-btn :href="$store.state.downloadUrl" outlined target="_blank" text
                 v-if="$store.state.readyToDownload">已完成，点此下载
          </v-btn>
          <br><br>
          <v-btn @click="reset" outlined style="margin-left: 8px" text v-if="$store.state.readyToDownload"
                 v-text="resetBtn"></v-btn>
        </v-row>
      </v-col>
    </v-row>
    <v-snackbar color="red" light v-model="snackbar">URL不能为空</v-snackbar>
    <v-dialog max-width="290" persistent v-model="$store.state.disconnected">
      <v-card>
        <v-card-title>与服务器断开连接</v-card-title>
        <v-card-text>请与柠喵联系，点击确认来刷新页面</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="$router.go(0)" text>好</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog max-width="290" persistent v-model="$store.state.failed">
      <v-card>
        <v-card-title>错误发生</v-card-title>
        <v-card-text v-text="errorMessage"></v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="reset" text>好</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog max-width="550" v-model="help">
      <v-card>
        <v-card-title>帮助</v-card-title>
        <v-card-text>
          Q：仅限Github资源吗？<br>
          A：是的，因为做这个站的初衷就是为了能更快地下载Github源码<br>
          Q：能下载Release和Archive包吗？<br>
          A：可以，毕竟Release和Archive包的下载速度也很慢<br>
          Q：为什么要进行Google reCaptcha验证？<br>
          A：为了防止网站被DDos<br>
          <br>
          注意，请不要下载过大的资源，目前这个站的月可用流量很低qwq
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="help = false" text>好</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue"
import {State} from "@/store";
import VueRecaptcha from "vue-recaptcha";

export default Vue.extend({
  name: "Main",
  components: {
    "vue-recaptcha": VueRecaptcha
  },
  data: () => ({
    snackbar: false,
    btnText: "进行Google reCaptcha验证",
    resetBtn: "重置状态",
    errorMessage: "",
    help: false,
    recaptchaComplete: false
  }),
  mounted() {
    this.$store.state.messageListeners.add(this.onMessage)
    this.$store.state.closeListeners.add(this.onClose)

    const ws = this.$store.state.ws
    const keepAliveMessage = JSON.stringify({
      request: "keepAlive"
    })

    function keepAlive() {
      ws.send(keepAliveMessage)
    }

    setInterval(keepAlive, 5000)
  },
  methods: {
    getDownloadLink: function (response: string) {
      const url = this.$store.state.urlToDownload
      if (url == "") {
        this.$data.snackbar = true
        setTimeout(() => this.$data.snackbar = false, 1500)
        return
      }
      const ws = this.$store.state.ws
      if (!this.$data.recaptchaComplete) {
        ws.send(JSON.stringify({
          request: "check",
          token: response
        }))
      } else {
        const downloadRegex = /^((https:\/\/github\.com\/([a-zA-Z0-9\-]+\/){2}releases\/download\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+\/?)|(https:\/\/github\.com\/([a-zA-Z0-9\-]+\/){2}archive\/[a-zA-Z0-9\-.]+\/?)|(https:\/\/codeload\.github\.com\/([a-zA-Z0-9\-]+\/){2}zip\/[a-zA-Z0-9\-.]+\/?)|(https:\/\/raw\.githubusercontent\.com\/([a-zA-Z0-9\-]+\/){2}([a-zA-Z0-9\-_.+]+\/)+[a-zA-Z0-9\-._+]+))$/
        const repoRegex = /^(https:\/\/github\.com\/[a-zA-Z0-9\-.]+\/[a-zA-Z0-9\-.]+(\.git)?)$/
        let object = {}
        if (url.match(downloadRegex)) {
          object = {
            request: "download",
            url: url
          }
          console.log(object)
        } else if (url.match(repoRegex)) {
          object = {
            request: "clone",
            url: url
          }
          console.log(object)
        } else {
          console.log("错误的格式")
          this.$data.errorMessage = "格式错误，请点击问号按钮查看帮助"
          return
        }
        ws.send(JSON.stringify(object))
      }
    },
    onMessage(ws: WebSocket, e: MessageEvent) {
      if (process.env.NODE_ENV == "development") {
        console.log(e.data)
      }
      const message = JSON.parse(e.data)
      if (message.status == "parsing") {
        this.$data.btnText = "正在解析"
        this.$store.state.textFieldDisabled = true
        this.$store.state.btnDisabled = true
        this.$store.state.theState = State.PARSING
      } else if (message.status == "downloading") {
        this.$data.btnText = "正在远程下载"
        this.$store.state.theState = State.DOWNLOADING
        this.$store.state.progress = message.text
      } else if (message.status == "checking out") {
        this.$data.btnText = "正在检出代码"
        this.$store.state.textFieldDisabled = false
        this.$store.state.progress = message.text
        this.$store.state.theState = State.CHECKING_OUT
        this.$store.state.btnDisabled = true
      } else if (message.status == "compressing") {
        this.$data.btnText = "正在打包"
        this.$store.state.theState = State.COMPRESSING
      } else if (message.status == "completed") {
        this.$store.state.textFieldDisabled = true
        this.$store.state.readyToDownload = true
        this.$store.state.theState = State.COMPLETED
        let prefix = ""
        if (process.env.NODE_ENV == "development") {
          prefix = "http://localhost:4000/files/"
        } else {
          prefix = "http://gdh.lemonneko.moe:4000/files/"
        }
        this.$store.state.downloadUrl = prefix + message.text
      } else if (message.status == "error") {
        this.$store.state.failed = true
        this.$data.errorMessage = message.text
      } else if (message.status == "checking") {
        if (message.text && message.text == "success") {
          this.$data.recaptchaComplete = true
          this.$data.btnText = "验证通过，再次点击即可继续"
          this.$store.state.btnDisabled = false
          this.$store.state.textFieldDisabled = false
          this.$store.state.theState = State.CHECKED
        } else {
          this.$data.btnText = "正在验证"
          this.$store.state.btnDisabled = true
          this.$store.state.theState = State.CHECKING
        }
      } else if (message.online) {
        this.$store.state.onlineNumber = message.online
      }
    },
    reset() {
      this.$data.btnText = "开始"
      this.$store.state.btnDisabled = false
      this.$store.state.textFieldDisabled = false
      this.$store.state.urlToDownload = ""
      this.$store.state.readyToDownload = false
      this.$store.state.theState = State.READY
      this.$store.state.unsupported = false
      this.$store.state.failed = false
    },
    onClose(ws: WebSocket, e: CloseEvent) {
      this.$store.state.disconnected = true
    }
  }
})
</script>

<style scoped>

</style>