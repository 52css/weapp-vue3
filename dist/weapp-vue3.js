!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t(((e="undefined"!=typeof globalThis?globalThis:e||self)["weapp-vue3"]=e["weapp-vue3"]||{},e["weapp-vue3"].js={}))}(this,function(e){"use strict";const r=new WeakMap;let f;const u=[];function i(n,e={}){const o=()=>{var t=o;for(let e=0;e<t.deps.length;e++)t.deps[e].delete(t);t.deps.length=0,f=o,u.push(o);var e=n();return u.pop(),f=u[u.length-1],e};return o.options=e,o.deps=[],e.lazy||o(),o}function s(e,t){if(!f)return e[t];let n=r.get(e),o=(n||r.set(e,n=new Map),n.get(t));o||n.set(t,o=new Set),o.add(f),f.deps.push(o)}function a(e,t){e=r.get(e);if(e){e=e.get(t);const n=new Set;e&&e.forEach(e=>{e!==f&&n.add(e)}),n.forEach(e=>{e.options&&e.options.scheduler?e.options.scheduler(e):e()})}}function t(e,t,n={}){let o;o="function"==typeof e?e:()=>function e(t,n=new Set){if("object"==typeof t&&null!==t&&!n.has(t)){n.add(t);for(const o in t)e(t[o],n);return t}}(e);let r,f,u;function s(e){u=e}const a=()=>{f=c(),u&&u(),t(f,r,s),r=f},c=i(()=>o(),{lazy:!0,scheduler:()=>{"post"===n.flush?(new Promise.resolve).then(a):a()}});n.immediate?a():r=c()}function o(e){return new Proxy(e,{get(e,t,n){if("raw"===t)return e;s(e,t);e=Reflect.get(e,t,n);return"object"==typeof e&&null!==e?o(e):e},set(e,t,n,o){e[t];n=Reflect.set(e,t,n,o);return a(e,t),n}})}function c(r,e){e=e(),t(new Proxy(e,{get(e,t,n){e=Reflect.get(e,t,n);return e.__v_isRef?e.value:e},set(e,t,n,o){var r=e[t];return r.__v_isRef?(r.value=n,!0):Reflect.set(e,t,n,o)}}),(e,t)=>{{const{fields:n,methods:o}=(e=>{var t={},n={};for(const o in e)"function"==typeof e[o]?n[o]=e[o]:t[o]=e[o];return{fields:t,methods:n}})(e);Object.keys(o).forEach(e=>{r[e]=o[e]}),r.setData(n)}},{immediate:!0})}var n={effect:i,ref:function(e){return e={value:e},Object.defineProperty(e,"__v_isRef",{value:!0}),o(e)},reactive:o,watch:t,computed:function(e){let t,n=!0;const o=i(e,{lazy:!0,scheduler:()=>{n=!0,a(r,"value")}}),r={__v_isRef:!0,get value(){return n&&(t=o(),n=!1),f&&s(r,"value"),t}};return r},Page:function(e){Page({onLoad(){c(this,e)}})},Component:function(t){let n={};var o;"function"!=typeof t&&(n=t.props,t=t.setup),Component({behaviors:[],properties:(o=n,Object.keys(o).reduce((e,t)=>(e[t]=o[t].default?{type:o[t].type,value:o[t].default}:o[t],e),{})),data:{},lifetimes:{created(){},attached(){r=this,e=n;var r,e=new Proxy(e,{get(e,t,n){let o=r.data[t];return o=void 0===o?e[t].default:o},set:function(e,t,n,o){return r.setData({[t]:n}),Reflect.set(e,t,n,o)}});c(this,t.bind(null,e))},moved(){},detached(){}},methods:{}})}},l=n.effect,d=n.ref,p=n.reactive,h=n.watch,v=n.computed,y=n.Page;e.Component=n.Component,e.Page=y,e.computed=v,e.default=n,e.effect=l,e.reactive=p,e.ref=d,e.watch=h,Object.defineProperty(e,"__esModule",{value:!0})});