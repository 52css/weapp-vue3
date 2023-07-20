import { effect } from "./effect";

function traverse(value, seen = new Set()) {
  // 如果要读取的数据时原始值，或已经被读取过，那什么都不做
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return;
  }
  // 将数据添加到 seen 中，代表遍历地读取过了，避免循环引用导致的死循环
  seen.add(value);
  // 暂时不考虑数据等其他结构
  // 假设 value 就是一个对象，使用 for ... in 读取对象的每一个值，并递归调用 traverse 进行处理
  for (const key in value) {
    traverse(value[key], seen);
  }

  return value;
}

interface Options {
  immediate?: boolean;
  flush?: "pre" | "post" | "sync";
}

export function watch(source, cb, options: Options = {}) {
  // 定义 getter
  let getter;
  // 如果 source 是函数，说明用户传递的是 getter, 所以直接把 source 赋值给 getter
  if (typeof source === "function") {
    getter = source;
  } else {
    // 否则按照原来的实现调用 traverse 函数
    getter = () => traverse(source);
  }
  // 定义旧值与新值
  let oldValue, newValue;

  // cleanup 用来存储用户注册的过期回调
  let cleanup;
  // 定义 onInvalidate 函数，用来注册过期回调
  function onInvalidate(fn) {
    // 将过期回调添加到 cleanup 中
    cleanup = fn;
  }

  // 提取 scheduler 调度函数为一个独立的 job 函数
  const job = () => {
    // 在 scheduler 中重新执行副作用函数，得到的新值
    newValue = effectFn();
    if (cleanup) {
      cleanup();
    }
    // 在调用回调函数 cb 之前，先调用过期回调
    // 将旧值和新值作为回掉函数的参数
    // 将 onInvalidate 作为回调函数的第三个参数传递给回调函数
    cb(newValue, oldValue, onInvalidate);
    // 更新旧值，不然下一次会得到错误的旧值
    oldValue = newValue;
  };

  // 使用 effect 注册副作用函数时，开启 lazy 选项, 并把返回值存储到 effectFn 中以便后续手动调用
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      // 在调度函数中判断 flush 是否为 'post', 如果是，将其放到微任务队列中执行
      if (options.flush === "post") {
        const p = Promise.resolve();
        p.then(job);
      } else {
        job();
      }
    },
  });

  if (options.immediate) {
    // 当 immediate 为 true 时立即执行 job, 从而触发回调执行
    job();
  } else {
    // 手动调用副作用函数，拿到的值就是旧值
    oldValue = effectFn();
  }
}
