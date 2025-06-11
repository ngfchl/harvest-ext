import {createApp} from "vue"
import FloatingWindow from "@/components/FloatingWindow.vue";
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

export default defineContentScript({
    matches: ['*://*/*'],
    // 2. Set cssInjectionMode
    cssInjectionMode: 'ui',

    async main(ctx) {
        // 3. Define your UI
        const ui = await createShadowRootUi(ctx, {
            name: 'harvest-ui',
            position: 'inline',
            anchor: 'body',
            onMount(container) {
                // Step 1: 动态注入 CSS 到 Shadow DOM
                // const link = document.createElement('link');
                // link.rel = 'stylesheet';
                // link.href = 'https://cdn.jsdelivr.net/npm/ant-design-vue@3.2.17/dist/antd.min.css';
                // container.shadowRoot!.appendChild(link);
                // Define how your UI will be mounted inside the container
                const app = createApp(FloatingWindow);
                app.use(Antd)
                app.mount(container);
                return app;
            },
            onRemove: (app) => {
                if (app) {
                    app.unmount();
                }
            },
        });

        // 4. Mount the UI
        ui.mount();
    },
});


