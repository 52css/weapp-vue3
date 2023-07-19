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
      console.log('effectFn2执行')
      temp2 = obj.bar
    })
    const fnSpy1 = vi.fn(() => {
      console.log('effectFn1执行')

      effect(fnSpy2)

      temp1 = obj.foo
    });
    effect(fnSpy1);
    expect(fnSpy1).toHaveBeenCalledTimes(1);
    expect(fnSpy2).toHaveBeenCalledTimes(1);
  });

  it("避免无限递归循环", async () => {
    const obj = reactive({ foo: 1 });
    const fnSpy = vi.fn(() => {
      return obj.foo ++;
    });
    effect(fnSpy);
    expect(fnSpy).toHaveBeenCalledTimes(1);
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
