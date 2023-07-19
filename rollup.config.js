import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import { uglify } from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: 'src/vue3.js',
  output: {
    file: 'dist/weapp-vue3.js',
    name: 'weapp-vue3.js',
    format: 'umd',
  },
  plugins: [
    json(),
    commonjs(),
    process.env.BUILD === 'production' ? uglify({}, minify) : false,
  ],
}
