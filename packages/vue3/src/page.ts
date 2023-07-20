import { useHook } from "@weapp-vue3/shared";
import type { Hook } from "@weapp-vue3/shared";

export function page (hook: Hook) {
  // @ts-ignore
  Page({
    onLoad() {
      useHook(this, hook);
    },
  });
}
