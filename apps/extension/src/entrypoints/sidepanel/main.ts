import { createPinia } from "pinia";
import { createApp } from "vue";
import uiPlugin from "@nuxt/ui/vue-plugin";
import App from "../../components/App.vue";
import "../../assets/main.css";

try {
  // The extension is intentionally dark-only. Set this before Vue mounts so
  // Nuxt UI never paints a light first frame (or reads the host page's mode).
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";

  const app = createApp(App).use(createPinia());
  app.use(uiPlugin);
  app.config.errorHandler = (err) => {
    document.body.innerHTML = `<pre style="color:red;padding:12px;font-size:11px;white-space:pre-wrap">[Vue error]\n${err}</pre>`;
    console.error("[poe-sl] Vue error:", err);
  };
  app.mount("#app");
} catch (err) {
  document.body.innerHTML = `<pre style="color:red;padding:12px;font-size:11px;white-space:pre-wrap">[mount error]\n${err}</pre>`;
  console.error("[poe-sl] mount error:", err);
}
