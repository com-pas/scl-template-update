import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import { terser } from 'rollup-plugin-terser';

export default {
  input: './scl-template-update.ts',
  output: {
    sourcemap: true,
    format: 'es',
    dir: 'dist',
  },
  plugins: [
    typescript(),
    nodeResolve(),
    terser(),
    importMetaAssets(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: [
              'last 3 Chrome major versions',
              'last 3 Firefox major versions',
              'last 3 Edge major versions',
              'last 3 Safari major versions',
            ],
          },
        ],
      ],
    }),
  ],
};
