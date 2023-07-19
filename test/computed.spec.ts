import { computed, effect, reactive } from "../src/vue3";
import { describe, it, expect, vi } from "vitest";

describe("computed", () => {
  it("普通值", () => {
    const obj = reactive({ foo: 1, bar: 2 });
    const sumRes = computed(() => obj.foo + obj.bar);
    expect(sumRes.value).toBe(3);
    expect(sumRes.value).toBe(3);
    obj.foo++;
    expect(sumRes.value).toBe(4);
  });

  it("有effect", () => {
    const obj = reactive({ foo: 1, bar: 2 });
    const sumRes = computed(() => obj.foo + obj.bar);
    let dummy;
    const fnSpy = vi.fn(() => {
      dummy = sumRes.value
    });
    effect(fnSpy);
    expect(dummy).toBe(3);
    obj.foo++;
    expect(dummy).toBe(4);
  });

  it("happy path", () => {
    const value = reactive({
      foo: 1,
    });

    const getter = computed(() => {
      return value.foo;
    });

    value.foo = 2;
    expect(getter.value).toBe(2);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = vi.fn(() => {
      return value.foo;
    });
    const cValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    // should not compute until needed
    value.foo = 2;
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
