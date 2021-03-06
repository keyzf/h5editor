import Vue from 'vue'
import Vuex from 'vuex'
import {
  INIT_USER_DATA,
  TOGGLE_PAGE,
  SET_H5_CONFIG,
  OPEN_PROPS_PANEL,
  CLOSE_PROPS_PANEL,
  SET_PICK_IMG,
  SET_PICK_BGM,
  SET_MOBILE
} from './types'

import pages from './modules/pages'
import components from './modules/components'

import { local } from '@/utils'

Vue.use(Vuex)

const SAVE_KEY_NAME = 'UserData'
const pxRegExp = /\b(\d+(\.\d+)?)px\b/
const initH5Editor = 'initH5Editor'

export default new Vuex.Store({
  state: {
    versior: 0.25,
    propsPanel: {
      status: false,
      name: '',
      id: ''
    },
    pickImg: {
      status: false,
      callback: null
    },
    pickBgm: {
      status: false,
      callback: null
    },
    h5Config: {
      bgm: ''
    },
    mobile: {
      isMobile: false,
      rem: null
    }
  },
  getters: {
    propsPanel: (state) => state.propsPanel,
    pickImg: (state) => state.pickImg,
    pickBgm: (state) => state.pickBgm,
    h5Config: (state) => state.h5Config
  },
  actions: {
    getUserData ({ state, commit, dispatch }) {
      const userData = localStorage.getItem(SAVE_KEY_NAME)
      if (!userData) {
        dispatch(initH5Editor)
        return
      }
      try {
        const mobile = state.mobile
        const curUserData = JSON.parse(userData, (key, value) => {
          if (mobile.isMobile && typeof value === 'string' && pxRegExp.test(value)) {
            return value.replace(pxRegExp, ($0, $1) => {
              const val = parseFloat($1) / mobile.rem
              return val + 'rem'
            })
          }
          return value
        })

        // 避免数据调整造成的错误，旧版本直接舍弃
        if (!curUserData.versior || (curUserData.versior < state.versior)) {
          throw new Error()
        }

        const pages = curUserData.pages
        commit(INIT_USER_DATA, curUserData)
        if (pages && pages.lists && pages.lists.length) {
          commit(TOGGLE_PAGE, pages.lists[0]['id'])
        }
      } catch (e) {
        dispatch(initH5Editor)
      }
    },
    [initH5Editor] ({ dispatch, commit }) {
      dispatch('addNewPage')
        .then((id) => {
          commit(TOGGLE_PAGE, id)
        })
    },
    setH5 ({ commit }, config) {
      commit(SET_H5_CONFIG, config)
    },
    saveUserData ({ state }) {
      local.set(SAVE_KEY_NAME, JSON.stringify({
        versior: state.versior,
        h5Config: state.h5Config,
        pages: {
          lists: state.pages.lists
        }
      }))
    }
  },
  mutations: {
    [INIT_USER_DATA] (state, userData) {
      state.versior = userData.versior
      Object.assign(state.h5Config, userData.h5Config)
      state.pages.lists = state.pages.lists.concat(userData.pages.lists)
      state.components.lists = userData.pages.lists.reduce((lists, page) => {
        if (page) {
          return lists.concat(page.comps)
        }
      }, [])
    },
    [OPEN_PROPS_PANEL] (state, { id, name }) {
      state.propsPanel = {
        status: true,
        name: name,
        id: id
      }
    },
    [CLOSE_PROPS_PANEL] (state) {
      state.propsPanel.status = false
    },
    [SET_PICK_IMG] (state, payload) {
      if (typeof payload === 'boolean') {
        state.pickImg.status = payload
      } else {
        Object.assign(state.pickImg, payload)
      }
    },
    [SET_PICK_BGM] (state, payload) {
      if (typeof payload === 'boolean') {
        state.pickBgm.status = payload
      } else {
        Object.assign(state.pickBgm, payload)
      }
    },
    [SET_H5_CONFIG] (state, config) {
      Object.assign(state.h5Config, config)
    },
    [SET_MOBILE] (state, mobileConfig) {
      Object.assign(state.mobile, mobileConfig)
    }
  },
  modules: {
    pages,
    components
  },
  strict: process.env.NODE_ENV !== 'production'
})
