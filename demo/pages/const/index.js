import { Page } from '@52css/weapp-vue3'

Page(() => {
  const text = 'hello weapp vue3'
  const handleClick = () => {
    console.log('text', text)
  }

  // 所有定义必须返回
  return { text, handleClick }
})