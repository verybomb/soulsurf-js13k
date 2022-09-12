import path from 'path'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import glsl from 'vite-plugin-glsl'
import { viteSingleFile } from 'vite-plugin-singlefile'
// import compress from 'vite-plugin-compress'

export default defineConfig({
  server: { port: 3200 },
  resolve: { alias: { '@src': path.resolve(__dirname, './src') } },
  build: {
    outDir: path.join(__dirname, 'dist'),
    polyfillModulePreload: false,
    assetsInlineLimit: 100000000,
    minify: 'terser',
    terserOptions: {
      mangle: {
        keep_fnames: false,
        properties: true,
      },
    },
  },
  plugins: [
    // compress.default(),
    createHtmlPlugin({}),
    glsl({
      exclude: undefined,                         // File paths/extensions to ignore
      include: /\.(glsl|wgsl|vert|frag|vs|fs)$/i, // File paths/extensions to import
      defaultExtension: 'glsl',                   // Shader suffix when no extension is specified
      warnDuplicatedImports: true,                // Warn if the same chunk was imported multiple times
      compress: true,                             // Compress the resulting shader code
    }),
    viteSingleFile(),
  ],
})
