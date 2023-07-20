import { useHook } from "@weapp-vue3/shared";
import type { Hook } from "@weapp-vue3/shared";

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

export function component (hook: Hook) {
  let props = {}
  let setup
  if (typeof hook !== 'function') {
    props = hook.props
    setup = hook.setup
  } else {
    setup = hook
  }

  // @ts-ignore
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
        useHook(this, setup.bind(null, setupProps))
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
