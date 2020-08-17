import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let prefix = "";
if (location.protocol == "http:") {
  prefix = "ws"
} else if (location.protocol == "https:") {
  prefix = "wss"
}
if (process.env.NODE_ENV == "development") {
  prefix += "://localhost:4000/checkout"
} else if (process.env.NODE_ENV == "production") {
  prefix += "://gdhb.lemonneko.moe:4000/checkout"
}

export enum State{
  READY,
  PARSING,
  CHECKING_OUT,
  DOWNLOADING,
  COMPRESSING,
  COMPLETED,
  ERROR
}

let _ws = new WebSocket(prefix)
const messageListeners: Set<Function> = new Set<Function>()
const errorListeners: Set<Function> = new Set<Function>()
const closeListeners: Set<Function> = new Set<Function>()

_ws.onmessage = function(this: WebSocket,e: MessageEvent){
  messageListeners.forEach(fun => {
    fun(this,e)
  })
}
_ws.onerror = function(this: WebSocket,ev: Event){
  errorListeners.forEach(fun => {
    fun(this,ev)
  })
}

_ws.onclose = function(this: WebSocket,ev: CloseEvent){
  closeListeners.forEach(fun => {
    fun(this,ev)
  })
}

let theState = State.READY

export default new Vuex.Store({
  state: {
    ws: _ws,
    theState: theState,
    checkingOutUrl: "",
    messageListeners: messageListeners,
    errorListeners: messageListeners,
    closeListeners: closeListeners,
    urlToDownload: "",
    downloadUrl: "",
    textFieldDisabled: false,
    btnDisabled: false,
    readyToDownload: false,
    showAppBarIcon: false,
    progress: 0,
    disconnected: false,
    failed: false,
    unsupported: false
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
