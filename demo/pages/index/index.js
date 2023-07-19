import { Page, ref } from '@52css/weapp-vue3'

function useClick() {
    const count = ref(0);
    const handleClick = () => {
      count.value++;
    };
  
    return { count, handleClick };
  }

Page(() => {
    const { count, handleClick } = useClick();

    return { count, handleClick }
})