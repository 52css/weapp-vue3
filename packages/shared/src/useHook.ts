import { splitFieldsAndMethods } from "@weapp-vue3/shared";
import { proxyRefs, watch } from "@weapp-vue3/reactivity";

type HookFn = () => any;

interface Props {
  [key: string]: any;
}

interface HookOptions {
  props: Props;
  setup: (props, context) => any;
}

export type Hook = HookFn | HookOptions;

export const useHook = (content, hook) => {
  const setData = (result) => {
    const { fields, methods } = splitFieldsAndMethods(result);

    // 绑定数据
    Object.keys(methods).forEach((key) => {
      content[key] = methods[key];
    });

    content.setData(fields);
  };
  const result = proxyRefs(hook());
  watch(
    result,
    (newVal, oldValue) => {
      setData(newVal);
    },
    {
      immediate: true,
    }
  );
};
