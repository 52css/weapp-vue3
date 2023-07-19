import { Page, ref, computed } from '@52css/weapp-vue3'

Page(() => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  const handleClick = () => {
    count.value ++
  }

  // 所有定义必须返回
  return { count, doubleCount, handleClick }
})