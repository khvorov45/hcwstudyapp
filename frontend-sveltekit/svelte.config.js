import sveltePreprocess from "svelte-preprocess"
import staticAdapter from "@sveltejs/adapter-static"

const apiRoot =
  process.env.NODE_ENV === "development"
    ? JSON.stringify("http://localhost:7300")
    : JSON.stringify("https://reports.hcwflustudy.com/api")

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    replace: [
      ["process.env.NODE_ENV", JSON.stringify(process.env.NODE_ENV)],
      ["process.env.API_ROOT", apiRoot],
    ],
  }),
  kit: {
    // By default, `npm run build` will create a standard Node app.
    // You can create optimized builds for different platforms by
    // specifying a different adapter
    adapter: staticAdapter(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",

    vite: {
      define: {
        "process.env.API_ROOT": apiRoot,
      },
      ssr: true,
    },
  },
}

export default config
