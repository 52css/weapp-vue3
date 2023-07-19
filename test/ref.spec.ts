import {
  effect,
  reactive,
  isRef,
  ref,
  unRef,
  proxyRefs,
  toRefs,
} from "../src/vue3";
import { describe, it, expect, vi } from "vitest";

describe("ref", () => {
  it("支持响应式", async () => {
    const refVal = ref(1);
    const fnSpy = vi.fn(() => {
      console.log(refVal.value);
    });
    effect(fnSpy);
    refVal.value = 2;
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  // it("自动脱 ref", () => {
  //   const count = ref(0);
  //   const obj = reactive({ count });

  //   expect(obj.count).toBe(0);
  // });
  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong",
    };
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaohong");

    (proxyUser as any).age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});
