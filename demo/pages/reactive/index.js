import { Page, reactive, toRefs } from '@52css/weapp-vue3'

Page(() => {
  const state = reactive({loading: false})
  const handleClick = () => {
      state.loading = !state.loading
  }

  // 所有定义必须返回
  return { ...toRefs(state), handleClick }
})