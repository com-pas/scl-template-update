/* eslint-disable import/no-extraneous-dependencies */
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';

export default {
  input: './scl-template-update.ts',
  output: {
    sourcemap: true,
    format: 'es',
    dir: 'dist',
  },
  preserveEntrySignatures: 'strict',
  plugins: [
    nodeResolve(),
    typescript(),
    importMetaAssets()
  ],
};
