// This standalone app uses plain CSS (no Tailwind). The repo root has its own
// postcss.config.mjs that loads @tailwindcss/postcss; without a local config,
// postcss-load-config walks up and picks up that one. On Vercel only this
// sub-app's dependencies are installed (no @tailwindcss/postcss), so the build
// fails with "Cannot find module '@tailwindcss/postcss'". A local empty config
// stops the upward search.
const config = {
  plugins: {},
}

export default config
