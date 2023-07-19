import { Page, ref } from '@52css/weapp-vue3'

Page(() => {
  const count = ref(0)
  const handleClick = () => {
    count.value ++
  }

  // 所有定义必须返回
  return { count, handleClick }
})