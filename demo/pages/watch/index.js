import { Page, ref, watch } from '@52css/weapp-vue3'

Page(() => {
  const count = ref(0)
  const handleClick = () => {
    count.value ++
  }

  watch(count, (newVal, oldVal) => {
    console.log('newVal', newVal, oldVal)
  })

  // 所有定义必须返回
  return { count, handleClick }
})