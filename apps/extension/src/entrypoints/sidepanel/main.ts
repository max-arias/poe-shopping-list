import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from '../../components/App.vue';
import '../../assets/main.css';

try {
  const app = createApp(App).use(createPinia());
  app.config.errorHandler = (err) => {
    document.body.innerHTML = `<pre style="color:red;padding:12px;font-size:11px;white-space:pre-wrap">[Vue error]\n${err}</pre>`;
    console.error('[poe-sl] Vue error:', err);
  };
  app.mount('#app');
} catch (err) {
  document.body.innerHTML = `<pre style="color:red;padding:12px;font-size:11px;white-space:pre-wrap">[mount error]\n${err}</pre>`;
  console.error('[poe-sl] mount error:', err);
}
