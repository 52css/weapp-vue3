import { computed, effect, reactive, watch } from "../src/vue3";
import { describe, it, expect, vi } from "vitest";

describe("watch", () => {
  it("支持newVal和oldVal", () => {
    const obj = reactive({ foo: 1 });
    let dummy;
    watch(
      () => obj.foo,
      (newVal, oldVal) => {
        dummy = [newVal, oldVal];
      }
    );
    obj.foo++;
    expect(dummy).toStrictEqual([2, 1]);
  });

  it("立即执行", () => {
    const obj = reactive({ foo: 1 });
    const fnSpy = vi.fn(() => {
      console.log("变化了");
    });
    watch(obj, fnSpy, { immediate: true });
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });
});
