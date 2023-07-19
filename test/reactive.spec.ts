import { reactive, isReactive, toRaw, effect, reactiveMap } from "../src/vue3";
import { describe, it, expect, test, vi } from "vitest";

describe("reactive", () => {
  it("arr修改内容能响应", async () => {
    const arr = reactive(["foo"]);
    const fnSpy = vi.fn(() => {
      console.log(arr[0]);
    });
    effect(fnSpy);
    arr[0] = "bar";
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  it("arr修改length能响应", async () => {
    const arr = reactive(["foo"]);
    const fnSpy = vi.fn(() => {
      console.log(arr[0]);
    });
    effect(fnSpy);
    arr.length = 0;
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  it("arr-for...in能响应", async () => {
    const arr = reactive(["foo"]);
    const fnSpy = vi.fn(() => {
      // console.log(arr[0]);
      for (const key in arr) {
        console.log(key);
      }
    });
    effect(fnSpy);
    arr[1] = "bar";
    arr.length = 0;
    expect(fnSpy).toHaveBeenCalledTimes(3);
  });

  it("arr-for...of能响应", async () => {
    const arr = reactive([1, 2, 3, 4, 5]);
    const fnSpy = vi.fn(() => {
      // console.log(arr[0]);
      for (const key of arr) {
        console.log(key);
      }
    });
    effect(fnSpy);
    arr[1] = "bar";
    arr.length = 0;
    expect(fnSpy).toHaveBeenCalledTimes(3);
  });

  it("arr.values-for...of能响应", async () => {
    const arr = reactive([1, 2, 3, 4, 5]);
    const fnSpy = vi.fn(() => {
      // console.log(arr[0]);
      for (const key of arr.values()) {
        console.log(key);
      }
    });
    effect(fnSpy);
    arr[1] = "bar";
    arr.length = 0;
    expect(fnSpy).toHaveBeenCalledTimes(3);
  });

  it("arr-includes普通值能响应", async () => {
    const arr = reactive([1, 2]);
    const fnSpy = vi.fn(() => {
      console.log(arr.includes(1));
    });
    effect(fnSpy);
    arr[0] = 3;
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  it("arr-includes对象能响应", async () => {
    const obj = {};
    const arr = reactive([obj]);
    expect(arr.includes(arr[0])).toBe(true);
    expect(arr.includes(obj)).toBe(true);
  });

  it("arr-push相同没有内存移除", async () => {
    const arr = reactive([]);
    effect(() => {
      arr.push(1);
    });
    effect(() => {
      arr.push(1);
    });
    expect(arr).toStrictEqual([1, 1]);
  });

  it("Map-能响应", async () => {
    const proxy = reactive(new Map([["key", 1]]));
    const fnSpy = vi.fn(() => {
      console.log(proxy.get("key"));
    });
    effect(fnSpy);
    proxy.set('key', 2)
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  it("Set-能响应", async () => {
    const p = reactive(new Set([1, 2, 3]));
    const fnSpy = vi.fn(() => {
      console.log(p.size);
    });
    effect(fnSpy);
    p.add(1)
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

  test("Object", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    // get
    expect(observed.foo).toBe(1);
    //     // has
    expect("foo" in observed).toBe(true);
    //     // ownKeys
    expect(Object.keys(observed)).toEqual(["foo"]);
  });

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  test("toRaw", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(toRaw(observed)).toBe(original);
    expect(toRaw(original)).toBe(original);
  });
});
