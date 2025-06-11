import {defineConfig} from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifest: {
        name: '收割机助手',
        description: '在收割机支持的网站上显示操作窗口',
        version: '1.0.0',
        content_scripts: [
            {
                matches: ['https://example.com/*'], // 替换为你的目标网站
                js: ['src/content.ts'],
                css: ['src/floatingWindow.css']
            }
        ],
        web_accessible_resources: [
            {
                resources: ['src/floatingWindow.html', 'src/floatingWindow.js'],
                matches: ['*://*/*'], // 替换为你的目标网站
            }
        ],
        permissions: ["storage", "fetch", "cookies",],
        host_permissions: ["http://*/*", "https://*/*"], // 或精准配置
        action: {
            default_popup: "src/popup.html",

        },
    },
});
