import {createApp} from "vue"
import FloatingWindow from "@/components/FloatingWindow.vue";
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import {createPinia} from "pinia";
import {MySite, WebSite} from "@/types";

export default defineContentScript({
    matches: ["<all_urls>"],
    // 2. Set cssInjectionMode
    cssInjectionMode: 'ui',
    async main(ctx) {
        // 1. 从缓存中获取网站列表
        const [webSiteListCache, mySiteListCache] = await Promise.all([
            storage.getItem('local:supportedSites'),
            storage.getItem('local:mySites'),
        ])
        // @ts-ignore
        if (!webSiteListCache || !(webSiteListCache.data)) {
            console.warn('站点数据未找到');
            return;
        }

        // 2. 转换为 WebSite 数组
        // @ts-ignore
        let webSiteList: WebSite[] = Object.values(webSiteListCache.data);
        if (!webSiteList) {
            console.warn('站点列表为空，程序终止');
            return;
        }
        let support = webSiteList.find(site =>
            site.url.some(url => {
                try {
                    return new URL(url).host === location.host;
                } catch {
                    return false; // 忽略无效URL
                }
            })
        );

        if (!support) {
            console.warn('收割机不支持当前站点，程序终止！')
            return
        }
        // @ts-ignore
        const mySiteList: MySite[] = Object.values(mySiteListCache?.data || {});
        const mySiteId = mySiteList.find(site => site.site === support.name)?.id || 0;
        console.log('开始向站点插入悬浮窗UI');

        // 3. Define your UI
        const ui = await createShadowRootUi(ctx, {
            name: 'harvest-ui',
            position: "inline",
            anchor: document.body,
            onMount(container) {
                const app = createApp(FloatingWindow, {
                    initialWebsite: support,
                    initialMySiteId: mySiteId,
                });
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

