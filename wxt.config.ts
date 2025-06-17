import {defineConfig} from 'wxt';
// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    vite: (env) => {
        return {
            plugins: [],

        }
    },

    manifest: {
        name: '收割机助手',
        description: '在收割机支持的网站上显示操作窗口',
        version: '1.0.0',
        permissions: ["storage", "fetch", "cookies", "activeTab"],
        host_permissions: [
            "*://*/*",
        ], // 或精准配置
        content_security_policy: {
            // extension_pages: "script-src 'self'; object-src 'self';",
            // sandbox: "allow-same-origin allow-scripts"
        },
    },

});
