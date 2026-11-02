import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chunking is left to Rollup on purpose.
//
// Hand-grouping the dependencies into vendor-react / vendor-charts / vendor-icons
// looks tidier and caches better in theory, and it was measurably worse: forcing
// recharts and react into separate chunks made them import each other (they share
// react-is), and a cycle reachable from the entry turns every chunk in it into a
// static dependency. All of it then got preloaded on the login page.
//
//   automatic     470 kB  (128 kB gzip)   ← recharts stays out until a chart is shown
//   manualChunks  871 kB  (240 kB gzip)
//
// If this is revisited, measure what dist/index.html actually requests. The entry
// chunk shrinks under manualChunks, which makes the change look like a win right
// up until the preload list is read.

export default defineConfig({
  plugins: [react()],
})
