import {defineConfig} from 'wxt';
import * as fs from "node:fs";
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
        key: fs.readFileSync('key.pem', 'utf-8'),
        version: '0.1.15',
        permissions: ["storage", "cookies", "activeTab", "scripting"],
        host_permissions: [
            "*://*/*",
        ], // 或精准配置
        action: {
            default_title: '收割机助手',
        },
        browser_specific_settings: {
            gecko: {
                // id: "ngfchl@mail.com",
                strict_min_version: "109.0"
            }
        }
    },
    // 打包配置
    zip: {
        // 自定义 ZIP 文件名模板
        artifactTemplate: '收割机助手-v{{version}}-{{browser}}.zip',
        // 其他可选配置
        // name: '自定义名称', // 覆盖默认的项目名称
        // compressionLevel: 9, // 压缩级别 (0-9)
    },
});
