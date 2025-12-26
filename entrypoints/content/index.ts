import {createApp} from "vue"
import FloatingWindow from "@/components/FloatingWindow.vue";
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import {createPinia} from "pinia";

export default defineContentScript({
    matches: ["<all_urls>"],
    // 2. Set cssInjectionMode
    cssInjectionMode: 'ui',
    async main(ctx) {
        // 3. Define your UI
        const ui = await createShadowRootUi(ctx, {
            name: 'harvest-ui',
            position: "inline",
            anchor: document.documentElement,
            onMount(container) {
                const app = createApp(FloatingWindow);
                app.use(Antd)
                app.use(createPinia())
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
        if (!(window as any).__HARVEST_MENU_LISTENER__) {
            (window as any).__HARVEST_MENU_LISTENER__ = true;

            browser.runtime.onMessage.addListener((msg) => {
                if (msg.type !== 'HARVEST_MENU_ACTION') return
                window.dispatchEvent(
                    new CustomEvent('harvest:action', {
                        detail: msg.action,
                    })
                );
            })
        }
    },
});


