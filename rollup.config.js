import typescript from "@rollup/plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";
import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import { uglify } from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input:"./packages/vue3/src/index.ts",
  plugins: [
    json(),
    commonjs(),
    typescript(),
    sourceMaps(),
    process.env.BUILD === 'production' ? uglify({}, minify) : false,
  ],
  output: [
    {
      file: 'dist/weapp-vue3.js',
      name: 'weapp-vue3.js',
      format: 'umd',
      sourcemap: true,
    },
  ],
  onwarn: (msg, warn) => {
    // 忽略 Circular 的错误
    if (!/Circular/.test(msg)) {
      warn(msg);
    }
  },
};
