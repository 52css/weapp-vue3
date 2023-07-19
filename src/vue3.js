// 存储副作用函数的桶
const bucket = new WeakMap()

// 用一个全局变量存储被注册的副作用函数
let activeEffect
// effect 栈
const effectStack = []
const ITERATE_KEY = Symbol()
const MAP_KEY_ITERATE_KEY = Symbol()

// 一个标记变量，代表是否进行追踪。默认值为 true, 即允许追踪
let shouldTrack = true

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数事，将副作用函数赋值给 activeEffect
    activeEffect = effectFn
    // 在调用副作用函数之前将当前副作用函数推入 effectStack 栈中
    effectStack.push(effectFn)
    // 将 fn 的执行结果存储到 res 中
    const res = fn()
    // 在当前副作用函数执行完毕后，将当前副作用函数从 effectStack 栈中推出，并把 activeEffect 还原为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    // 将 res 作为 effectFn 的返回值返回
    return res
  }
  // 将 options 挂载到 effectFn 上
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 只有非 lazy 的时候，才执行
  if (!options.lazy) {
    effectFn()
  }
  // 将副作用函数返回
  return effectFn
}

function track(target, key) {
  if (!activeEffect || !shouldTrack) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key, type, newVal) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  // 取得与 key 相关联的副作用函数
  const effects = depsMap.get(key)
  // 取得与 ITERATE_KEY 相关联的副作用函数
  const iterateEffects = depsMap.get(ITERATE_KEY)

  const effectsToRun = new Set()
  // 将与 key 相关联的副作用函数添加到 effectsToRun 中
  effects && effects.forEach(effectFn => {
    // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })

  // 只有当操作类型为 'ADD' 或 DELETE 时，才触发与 ITERATE_KEY 相关联的副作用函数重新执行
  if (
    type === 'ADD' ||
    type === 'DELETE' ||
    (
      Object.prototype.toString.call(target) === '[object Map]'
    )
  ) {
    const iterateEffects = depsMap.get(MAP_KEY_ITERATE_KEY)
    // 将与 ITERATE_KEY 相关联的副作用函数添加到 effectsToRun 中
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    });
  }

  // 当操作类型为 ADD 并且目标对象是数组是，应该取出并执行那些与 length 属性相关联的副作用函数
  if (type === 'ADD' && Array.isArray(target)) {
    // 取出与 length 属性相关联的副作用函数
    const lengthEffects = depsMap.get('length')
    // 将这些副作用函数添加到 effectsToRun 中, 待执行
    lengthEffects && lengthEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    });
  }

  // 如果操作目标是数组，并且修改了数组的 length 属性
  if (Array.isArray(target) && key === 'length') {
    // 对于索引大于或等于新的 length 值的元素
    // 需要把所有相关联的副作用函数取出并添加到 effectsToRun 中待执行
    depsMap.forEach((effects, key) => {
      if (key >= newVal) {
        effects.forEach(effectFn => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
          }
        });
      }
    });
  }

  effectsToRun.forEach(effectFn => {
    // 如果一个副作用函数存在调度器, 则调用该调度器，并将副作用函数作为参数传入
    if (effectFn.options && effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      // 否则直接执行副作用函数
      effectFn()
    }
  })
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function computed(getter) {
  // value 用来存储上一次计算的值
  let value
  // dirty 标志，用来标识是否需要重新计算值，为 true 则意味着“脏”，需要重新计算
  let dirty = true

  // 将 getter 作为副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    // 添加调度器，在调度器中将 dirty 设置为 true
    scheduler: () => {
      dirty = true
      // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
      trigger(obj, 'value')
    }
  })

  const obj = {
    __v_isRef: true,
    // 当读取 value 的时候，执行 effectFn
    get value() {
      // 只有“脏”时才计算值，并将得到的值缓存到 value 中
      if (dirty) {
        value = effectFn()
        // 将 dirty 设置为 false，下一次访问直接使用缓存到的 value 中的值
        dirty = false
      }

      if (activeEffect) {
        // 当读取 value 时，手动调用 track 函数进行追踪
        track(obj, 'value')
      }

      return value
    }
  }

  return obj
}

function traverse(value, seen = new Set()) {
  // 如果要读取的数据时原始值，或已经被读取过，那什么都不做
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return
  }
  // 将数据添加到 seen 中，代表遍历地读取过了，避免循环引用导致的死循环
  seen.add(value)
  // 暂时不考虑数据等其他结构
  // 假设 value 就是一个对象，使用 for ... in 读取对象的每一个值，并递归调用 traverse 进行处理
  for (const key in value) {
    traverse(value[key], seen)
  }

  return value
}

function watch(source, cb, options = {}) {
  // 定义 getter
  let getter
  // 如果 source 是函数，说明用户传递的是 getter, 所以直接把 source 赋值给 getter
  if (typeof source === 'function') {
    getter = source
  } else {
    // 否则按照原来的实现调用 traverse 函数
    getter = () => traverse(source)
  }
  // 定义旧值与新值
  let oldValue, newValue

  // cleanup 用来存储用户注册的过期回调
  let cleanup
  // 定义 onInvalidate 函数，用来注册过期回调
  function onInvalidate(fn) {
    // 将过期回调添加到 cleanup 中
    cleanup = fn
  }

  // 提取 scheduler 调度函数为一个独立的 job 函数
  const job = () => {
    // 在 scheduler 中重新执行副作用函数，得到的新值
    newValue = effectFn()
    if (cleanup) {
      cleanup()
    }
    // 在调用回调函数 cb 之前，先调用过期回调
    // 将旧值和新值作为回掉函数的参数
    // 将 onInvalidate 作为回调函数的第三个参数传递给回调函数
    cb(newValue, oldValue, onInvalidate)
    // 更新旧值，不然下一次会得到错误的旧值
    oldValue = newValue
  }

  // 使用 effect 注册副作用函数时，开启 lazy 选项, 并把返回值存储到 effectFn 中以便后续手动调用
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      // 在调度函数中判断 flush 是否为 'post', 如果是，将其放到微任务队列中执行
      if (options.flush === 'post') {
        const p = new Promise.resolve()
        p.then(job)
      } else {
        job()
      }
    }
  })

  if (options.immediate) {
    // 当 immediate 为 true 时立即执行 job, 从而触发回调执行
    job()
  } else {
    // 手动调用副作用函数，拿到的值就是旧值
    oldValue = effectFn()
  }
}

const arrayInstrumentations = {}

;['includes', 'indexof', 'lastIndexOf'].forEach(method => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function(...args) {
    // this 是代理对象，先在代理对象中查找，将结果存储到 res 中
    let res = originMethod.apply(this, args)

    if (res === false || res === -1) {
      // res 为 false 说明没找到，通过 this.raw 拿到原始数据，再去其中查找并更新 res 值
      res = originMethod.apply(this.raw, args)
    }

    // 返回最终结果
    return res
  }
});


;['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
  // 取得原始 push 方法
  const originMethod = Array.prototype[method]

  arrayInstrumentations[method] = function(...args) {
    // 在执行原始 push 方法之前，先停止追踪
    shouldTrack = false
    // 执行原始 push 方法
    const res = originMethod.apply(this, args)
    // 执行完毕后恢复追踪
    shouldTrack = true
    // 返回结果
    return res
  }
})

function iterationMethod() {
  // 获取原始数据
  const target = this.raw
  // 获取原始迭代器方法
  const itr = target[Symbol.iterator]()

  const wrap = (val) => typeof val === 'object' && val !== null ? reactive(val) : val

  track(target, ITERATE_KEY)

  // 返回自定义的迭代器
  return {
    next() {
      // 调用原始迭代器的 next 方法获取 value 和 done
      const { value, done } = itr.next()

      return {
        // 如果 value 不是 undefined，则对 value 和 done 进行包裹后返回
        value: value ? [wrap(value[0]), wrap(value[1])] : value,
        done
      }
    },
    // 实现可迭代协议
    [Symbol.iterator]() {
      return this
    }
  }
}

function valuesIterationMethod() {
  // 获取原始数据
  const target = this.raw
  // 通过 target.values() 获取原始迭代器
  const itr = target.values()

  const wrap = (val) => typeof val === 'object' ? reactive(val) : val

  track(target, ITERATE_KEY)

  // 将其返回
  return {
    next() {
      const { value, done } = itr.next()

      return {
        // value 是值，而非键值对，所以只需要包裹 value 即可
        value: wrap(value),
        done
      }
    },
    [Symbol.iterator]() {
      return this
    }
  }
}

function keysIterationMethod() {
  // 获取原始数据
  const target = this.raw
  // 通过 target.keys() 获取原始迭代器
  const itr = target.keys()

  const wrap = (val) => typeof val === 'object' ? reactive(val) : val

  track(target, MAP_KEY_ITERATE_KEY)

  // 将其返回
  return {
    next() {
      const { value, done } = itr.next()

      return {
        // value 是值，而非键值对，所以只需要包裹 value 即可
        value: wrap(value),
        done
      }
    },
    [Symbol.iterator]() {
      return this
    }
  }
}

const mutableInstrumentations = {
  add(key) {
    // this 仍然指向的是代理对象， 通过 raw 属性获取原始数据对象
    const target = this.raw
    // 先判断值是否已经存在
    const hadKey = target.has(key)
    // 通过原始数据对象执行 add 方法添加具体的值
    // 注意，这里不再需要 .bind 了，因为是直接通过 target 调用并执行的
    const res = target.add(key)
    if (!hadKey) {
      // 调用 trigger 函数触发响应，并指定操作类型为 ADD
      trigger(target, key, 'ADD')
    }
    // 返回操作结果
    return res
  },
  delete(key) {
    const target = this.raw;
    const hadKey = target.has(key);
    const res = target.delete(key);

    if (hadKey) {
      trigger(target, key, 'DELETE');
    }

    return res
  },
  get(key) {
    // 获取原始数据
    const target = this.raw
    // 判断读取的key是否存在
    const hadKey = target.has(key)
    // 追踪依赖，建立响应联系
    track(target, key)
    // 如果存在，则返回结果。这里要注意的是，如果得到的结果 res 仍然是可代理的数据
    // 则要返回使用 reactive 包装后的响应式数据
    if (hadKey) {
      const res = target.get(key)
      return typeof res === 'object' ? reactive(res) : res
    }
  },
  set(key, value) {
    const target = this.raw
    const had = target.has(key)

    // 获取旧值
    const oldValue = target.get(key)
    // 获取原始数据，由于 value 本身可能已经是原始数据，所以此时 value.raw 不存在，则直接使用value
    const rawValue = value.raw ? value.raw : value
    // 设置新值
    target.set(key, rawValue)
    // 如果不存在，则说明是 ADD 类型的操作，意味着新增
    if (!had) {
      trigger(target, key, 'ADD')
    } else if (oldValue !== value || (oldValue === oldValue && value === value)) {
      // 如果不存在，并且值变了，则是 SET 类型的操作，意味着修改
      trigger(target, key, 'SET')
    }
  },
  forEach(callback) {
    // wrap 函数用来把可代理的值转换为响应式数据
    const wrap = value => (typeof value === 'object' ? reactive(value) : value)
    // 取得原始数据
    const target = this.raw
    // 与 ITERATE_KEY 建立响应联系
    track(target, ITERATE_KEY)
    // 通过原始数据对象调用 forEach 方法, 并把 callback 传递过去
    target.forEach((v, k) => {
      // 手动调用callback, 用 wrap 函数包裹 value 和 key 后再传给 callback， 这样就实现了深响应
      callback.call(thisArg, wrap(v), wrap(k), this)
    })
  },
  [Symbol.iterator]: iterationMethod,
  entries: iterationMethod,
  values: valuesIterationMethod,
  keys: keysIterationMethod
}

function createReactive(obj, isShallow = false, isReadonly = false) {
  return new Proxy(obj, {
    // 拦截读取操作
    get(target, key, receiver) {
      // 代理对象可以通过 raw 属性访问原始数据
      if (key === 'raw') {
        return target
      }

      // if (key === 'size') {
      //   track(target, ITERATE_KEY)
      //   return Reflect.get(target, key, receiver)
      // }

      // // 返回定义在 mutableInstrumentations 对象下的方法
      // return mutableInstrumentations[key]

      // 如果操作的目标对象是数组，并且 key 存在于 arrayInstrumentations 上，
      // 那么返回定义在 arrayInstrumentations 上的值
      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }

      // 非只读的时候才需要建立响应联系
      if (!isReadonly && typeof key !== 'symbol') {
        // 建立联系
        track(target, key)
      }

      // 得到原始值结果
      const res = Reflect.get(target, key, receiver)

      if (isShallow) {
        return res
      }

      if (typeof res === 'object' && res !== null) {
        // 调用 reactive 将结果包装成响应式数据并返回
        return isReadonly ? readonly(res) : reactive(res)
      }

      // 返回 res
      return res
    },
    set(target, key, newVal, receiver) {
      // 如果是只读的，则打印警告信息并返回
      if (isReadonly) {
        console.warn(`属性 ${key} 只读，不能被修改`)
        return true
      }
      // 先获取旧值
      const oldVal = target[key]

      // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
      const type = Array.isArray(target)
        // 如果代理目标是数组，则检测被设置的索引值是否小于数组长度
        // 如果是，则视作 SET 操作，否则视作 ADD 操作
        ? Number(key) < target.length ? 'SET' : 'ADD'
        : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'

      // 设置属性值
      const res = Reflect.set(target, key, newVal, receiver)

      // target === receiver.raw 说明 receiver 就是 target 的代理对象
      if (target === receiver.raw) {
        // 比较新值与旧值，只有当他们不全等，并且不都是 NaN 时才触发回调
        if (newVal !== oldVal && (newVal === newVal || oldVal === oldVal)) {
          // 将 type 作为第三个参数传递给 trigger 函数
          trigger(target, key, type, newVal)
        }
      }


      return res
    },
    deleteProperty(target, key) {
      // 如果是只读的，则打印警告信息并返回
      if (isReadonly) {
        console.warn(`属性 ${key} 只读，不能被删除`)
        return true
      }
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)
      const res = Reflect.deleteProperty(target, key)

      if (res && hadKey) {
        trigger(target, key, 'DELETE')
      }

      return res
    },
    ownKeys(target) {
      // 如果操作目标 target 是数组，则使用 length 属性作为 key 并建立响应联系
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  })
}

// 定义一个 Map 实例，存储原始对象到代理对象的映射
const reactiveMap = new Map()

function reactive(obj) {
  // 优先通过原始对象 obj 寻找之前创建的代理对象，如果找到了，直接返回已有的代理对象
  const existionProxy = reactiveMap.get(obj)

  if (existionProxy) return existionProxy

  // 否则，创建新的代理对象
  const proxy = createReactive(obj)

  // 存储到 Map 中，从而避免重复创建
  reactiveMap.set(obj, proxy)

  return proxy
}

function readonly(obj) {
  return createReactive(obj, false, true)
}

function shallowReactive(obj) {
  return createReactive(obj, true /* shallow */, true)
}

function ref(val) {
  const wrapper = {
    value: val
  }
  // 使用 Object.defineProperty 在 wrapper 对象上定义一个不可枚举的属性 __v_isRef, 值为 true
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })

  return reactive(wrapper)
}

function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    // 允许设置值
    set value(val) {
      obj[key] = val
    }
  }

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })

  return wrapper
}

function toRefs(obj) {
  const rtv = {}

  // 使用 for... in 循环遍历对象
  for (const key in obj) {
    // 逐个调用 toRef 完成转换
    rtv[key] = toRef(obj, key)
  }

  return rtv
}

function isReactive(value) {
  return !!(value && value.__v_isRef);
}

function toRaw(value) {
  if (!value.raw) {
    return value;
  }

  return value.raw;
}

function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return value.__v_isRef ? value.value : value
    },
    set(target, key, newValue, receiver) {
      const value = target[key]
      if (value.__v_isRef) {
        value.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    }
  })
}

// 5. 调度执行 - 控制执行顺序
// const obj = reactive({foo: 1})
// effect(() => {
//   console.log(obj.foo)
// }, {
//   scheduler: (effect) => {setTimeout(effect)}
// })
// obj.foo ++
// console.log('结束了')

// 6. 调度执行 - 增加一个
// // 定义一个任务队列
// const jobQueue = new Set()
// // 使用 Promise.resolve() 创建一个 promise 实例，我们用它将一个任务添加到微任务队列
// const p = Promise.resolve()
// // 一个标志代表是否正在刷新队列
// let isFlushing = false
// function flushJob() {
//   // 如果队列正在刷新，则不执行
//   if (isFlushing) return
//   // 设置为 true, 代表正在刷新
//   isFlushing = true
//   // 在微任务队列中刷新 jobQueue 队列
//   p.then(() => {
//     jobQueue.forEach(job => job())
//   }).finally(() => {
//     // 刷新完成后，将标志设置为 false
//     isFlushing = false
//     // 清空队列
//     jobQueue.clear()
//   })
// }
// const obj = reactive({foo: 1})
// effect(() => {
//   console.log(obj.foo)
// }, {
//   scheduler(fn) {
//     jobQueue.add(fn)
//     flushJob()
//   }
// })

// obj.foo ++
// obj.foo ++

// 10. 自动脱 ref
// const count = ref(0)
// const obj = reactive({ count })
// console.log(obj.count)

function useHook(content, hook) {
  const splitFieldsAndMethods = (obj) => {
    const fields = {}
    const methods = {}
    for (const k in obj) {
      if (typeof obj[k] === "function") {
        methods[k] = obj[k]
      } else {
        fields[k] = obj[k]
      }
    }
    return {
      fields,
      methods
    }
  }
  const setData = (result) => {
    const { fields, methods } = splitFieldsAndMethods(result)

    // 绑定数据
    Object.keys(methods).forEach(key => {
      content[key] = methods[key]
    })

    content.setData(fields)
  }
  const result = proxyRefs(hook());
  watch(result, (newVal, oldValue) => {
    setData(newVal)
  }, {
    immediate: true
  })
}

function page(hook) {
  Page({
    onLoad() {
      useHook(this, hook)
    },
  })
}

function getProperties(props) {
  return Object.keys(props).reduce((prev, item) => {
    prev[item] = props[item].default ? {
      type: props[item].type,
      value: props[item].default
    } : props[item]
    return prev
  }, {})
}

function createProps(context, props) {
  return new Proxy(props, {
    get(target, key, receiver) {
      let value = context.data[key]

      if (value === undefined) {
        value = target[key].default
      }

      return value
    },
    set: function (target, key, value, receiver) {
      context.setData({
        [key]: value
      })
      return Reflect.set(target, key, value, receiver)
    }
  })
}

function component(hook) {
  let props = {}
  if (typeof hook !== 'function') {
    props = hook.props
    hook = hook.setup
  }

  Component({
    behaviors: [],
    properties: getProperties(props),
    data: {

    },
    lifetimes: {
      created() {
      },
      attached() {
        const setupProps = createProps(this, props)
        useHook(this, hook.bind(null, setupProps))
      },
      moved() {

      },
      detached() {

      },
    },
    methods: {

    },
  });
}

module.exports = {
  effect,
  ref,
  reactive,
  readonly,
  shallowReactive,
  toRefs,
  isReactive,
  toRaw,
  watch,
  computed,
  Page: page,
  Component: component,
}