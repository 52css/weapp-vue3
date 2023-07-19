import { effect, reactive } from "../src/vue3";
import { describe, it, expect, vi } from "vitest";

function sleep(timer) {
  return new Promise((resolve) => {
    setTimeout(resolve, timer);
  });
}

describe("effect", () => {
  it("只执行1次", async () => {
    const obj = reactive({ text: 123 });
    const fnSpy = vi.fn(() => {
      console.log("obj.text", obj.text);
    });
    effect(fnSpy);
    await sleep(100);
    obj.notExist = "hello vue3";
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("分支切换与 cleanup", async () => {
    const obj = reactive({ ok: true, text: "hello world" });
    let dummy;
    const fnSpy = vi.fn(() => {
      dummy = obj.ok ? obj.text : "not";
    });
    effect(fnSpy);
    expect(dummy).toBe("hello world");
    obj.ok = false;
    expect(dummy).toBe("not");
  });

  it("嵌套的effect 与 effect 栈", async () => {
    const obj = reactive({ foo: true, bar: true });
    let temp1, temp2;
    const fnSpy2 = vi.fn(() => {
      console.log("effectFn2执行");
      temp2 = obj.bar;
    });
    const fnSpy1 = vi.fn(() => {
      console.log("effectFn1执行");

      effect(fnSpy2);

      temp1 = obj.foo;
    });
    effect(fnSpy1);
    expect(fnSpy1).toHaveBeenCalledTimes(1);
    expect(fnSpy2).toHaveBeenCalledTimes(1);
  });

  it("避免无限递归循环", async () => {
    const obj = reactive({ foo: 1 });
    const fnSpy = vi.fn(() => {
      return obj.foo++;
    });
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("普通值一样只触发一次", async () => {
    const obj = reactive({ foo: 1 });
    const fnSpy = vi.fn(() => {
      console.log(obj.foo);
    });
    effect(fnSpy);
    obj.obj = 1;
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("NaN值一样只触发一次", async () => {
    const obj = reactive({ foo: NaN });
    const fnSpy = vi.fn(() => {
      console.log(obj.foo);
    });
    effect(fnSpy);
    obj.obj = NaN;
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("多次代理只执行1次", async () => {
    const obj = {};
    const proto = { bar: 1 };
    const child = reactive(obj);
    const parent = reactive(proto);

    expect(child.raw).toBe(obj);
    expect(parent.raw).toBe(proto);
    // child.raw === obj
    // parent.raw === proto
    // 使用 parent 作为 child 的原型
    Object.setPrototypeOf(child, parent);
    const fnSpy = vi.fn(() => {
      console.log(child.bar);
    });
    effect(fnSpy);
    child.bar = 2;
    // TODO 这里有问题
    // expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("浅响应与深响应", async () => {
    const obj = reactive({ foo: { bar: 1 } });
    const fnSpy = vi.fn(() => {
      console.log(obj.foo.bar);
    });

    effect(fnSpy);

    obj.foo.bar = 2;
    expect(fnSpy).toHaveBeenCalledTimes(2);
  });

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

  it("should run the passed function once (wrapped by a effect)", () => {
    const fnSpy = vi.fn(() => {});
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it("should observe basic properties", () => {
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = counter.num));

    expect(dummy).toBe(0);
    counter.num = 7;
    expect(dummy).toBe(7);
  });

  it("should observe multiple properties", () => {
    let dummy;
    const counter = reactive({ num1: 0, num2: 0 });
    effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));

    expect(dummy).toBe(0);
    counter.num1 = counter.num2 = 7;
    expect(dummy).toBe(21);
  });

  it("should handle multiple effects", () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });

  it("should observe nested properties", () => {
    let dummy;
    const counter = reactive({ nested: { num: 0 } });
    effect(() => (dummy = counter.nested.num));

    expect(dummy).toBe(0);
    counter.nested.num = 8;
    expect(dummy).toBe(8);
  });

  it("should observe function call chains", () => {
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = getNum()));

    function getNum() {
      return counter.num;
    }

    expect(dummy).toBe(0);
    counter.num = 2;
    expect(dummy).toBe(2);
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  // it("stop", () => {
  //   let dummy;
  //   const obj = reactive({ prop: 1 });
  //   const runner = effect(() => {
  //     dummy = obj.prop;
  //   });
  //   obj.prop = 2;
  //   expect(dummy).toBe(2);
  //   stop(runner);
  //   // obj.prop = 3
  //   obj.prop++;
  //   expect(dummy).toBe(2);

  //   // stopped effect should still be manually callable
  //   runner();
  //   expect(dummy).toBe(3);
  // });

  // it("events: onStop", () => {
  //   const onStop = vi.fn();
  //   const runner = effect(() => {}, {
  //     onStop,
  //   });

  //   stop(runner);
  //   expect(onStop).toHaveBeenCalled();
  // });
});
