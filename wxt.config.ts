import {defineConfig} from 'wxt';
import * as fs from "node:fs";
// See https://wxt.dev/api/config.html

const enableKey = process.env.CHROME_STORE === 'true';
console.log('商店版本：', enableKey);
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
        ...(enableKey
            ? {}
            : {key: fs.readFileSync('key.pem', 'utf-8')}),
        version: '0.2.4',
        permissions: ["storage", "cookies", "activeTab", "scripting", 'contextMenus'],
        host_permissions: [
            "*://*/*",
        ], // 或精准配置
        action: {
            default_title: '收割机助手',
        },
    },
    // 打包配置
    zip: {
        // 自定义 ZIP 文件名模板
        // artifactTemplate: '收割机助手-v{{version}}-{{browser}}.zip',
        artifactTemplate: 'harvest-addon-{{browser}}.zip',
        sourcesTemplate: 'harvest-addon-sources.zip',
        // 其他可选配置
        // name: '自定义名称', // 覆盖默认的项目名称
        // compressionLevel: 9, // 压缩级别 (0-9)
    },
});
