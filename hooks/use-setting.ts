import {CommonResponse, Settings, SiteInfo, Torrent} from "@/types";
import {defineStore} from "pinia";
import {ref} from "vue";
import {message} from "ant-design-vue";

export const useSettingStore = defineStore("setting", () => {
    const setting = ref<Settings>({
        baseUrl: '', token: ''
    })
    const canSave = ref(false);

    // 从存储加载设置
    const getSetting = async () => {
        try {
            const data = await storage.getItem("local:setting");
            console.log(data);
            if (data) {
                setting.value = data as Settings;
                console.log(setting.value.token);
                return CommonResponse.success(data);
            }
            return CommonResponse.error(-1, '获取收割机服务器设置失败！');
        } catch (error) {
            console.error("获取设置失败:", error);
            return CommonResponse.error(-1, `获取收割机服务器设置失败！${error}`);
        }
    };

    // 保存设置到存储
    const saveSetting = async (newSetting: Settings) => {
        try {
            // 更新状态
            setting.value = newSetting;
            // 保存到存储
            await storage.setItem("local:setting", newSetting);
            message.success("服务器信息保存成功！");
            return true;
        } catch (error) {
            console.error("保存设置失败:", error);
            message.error(`服务器信息保存失败！${error}`);
            return false;
        }
    };


    // 自动初始化 - 正确处理Promise
    const initialize = async () => {
        await getSetting();
    };

    // // 立即执行初始化，但不阻塞其他代码
    // initialize().catch(error => {
    //     console.error("初始化设置失败:", error);
    // });
    /**
     * 获取站点相关规则
     * @param {string} host - 站点域名
     * @returns {Promise<Object|null>} 站点信息对象或null
     */
    const getSite = async (host: string): Promise<CommonResponse<SiteInfo | null> | null> => {
        await getSetting();
        const res = await browser.runtime.sendMessage({
            type: 'getSiteInfo',
            payload: {
                setting: setting.value,
                host: host,
            }
        });

        console.log(res);
        if (res.succeed) {
            return CommonResponse.success(res.data as SiteInfo);
        }
        const msg = `获取站点信息出错：${res ? res.msg : ''}`;
        message.warning(msg);
        return CommonResponse.error(-1, msg)
        // 返回完整的站点信息

    }

    /**
     * 保存站点信息到服务器
     * @param host
     */
    const getCookieString = async (host: string) => {
        const cookies: CommonResponse<any> = await browser.runtime.sendMessage({
            type: 'getSiteCookies',
            payload: {
                setting: setting.value,
                host: host,
            }
        });
        console.log("Cookies:", cookies)
        return cookies
    }

    /**
     * 保存站点信息到服务器
     * @param data
     */
    const sendSiteInfo = async (data: string) => {
        return await browser.runtime.sendMessage({
            type: 'sendSiteInfo',
            payload: {
                setting: setting.value,
                data: data,
            }
        })
    }
    /**
     * 保存站点信息到服务器
     */
    const getDownloaders = async () => {
        return await browser.runtime.sendMessage({
            type: 'getDownloaders',
            payload: {
                setting: setting.value,
            }
        })
    }
    const testDownloader = async (downloaderId: number) => {
        return await browser.runtime.sendMessage({
            type: 'testDownloader',
            payload: {
                setting: setting.value,
                downloaderId: downloaderId
            }
        })
    }
    const getDownloaderCategorise = async (downloaderId: number) => {
        return await browser.runtime.sendMessage({
            type: 'getDownloaderCategorise',
            payload: {
                setting: setting.value,
                downloaderId: downloaderId
            }
        })
    }
    const pushTorrent = async (
        downloaderId: number,
        mySiteId: number,
        category: string,
        siteName: string,
        cookie: string,
        savePath: string | null,
        urlList: string[],
    ) => {
        return await browser.runtime.sendMessage({
            type: 'pushTorrent',
            payload: {
                setting: setting.value,
                downloaderId: downloaderId,
                mySiteId: mySiteId,
                category: category,
                siteName: siteName,
                cookie: cookie,
                savePath: savePath,
                urlList: urlList,
            }
        })
    }
    const repeatInfo = async (
        tid: number,
        mySiteId: number
    ) => {
        return await browser.runtime.sendMessage({
            type: 'repeatInfo',
            payload: {
                setting: setting.value,
                tid: tid,
                mySiteId: mySiteId
            }
        })
    }
    const syncTorrents = async (
        torrents: Torrent[],
        mySiteId: number,
    ) => {
        return await browser.runtime.sendMessage({
            type: 'syncTorrents',
            payload: {
                setting: setting.value,
                torrents: torrents,
                mySiteId: mySiteId,
            }
        })
    }
    const testServer = async () => {
        const res = await getSite('1ptba.com')
        if (!res?.succeed) {
            // message.error('服务器连接失败！');
            canSave.value = false;
            return;
        }
        message.success("服务器连接成功！");
        console.log('服务器连接成功！');
        canSave.value = true;
    }
    return {
        setting,
        canSave,
        getSetting,
        saveSetting,
        getSite,
        testServer,
        sendSiteInfo,
        getDownloaders,
        getCookieString,
        testDownloader,
        getDownloaderCategorise,
        pushTorrent,
        repeatInfo,
        syncTorrents,
        // 可选：添加计算属性方便访问单个字段
        get baseUrl() {
            return setting.value.baseUrl;
        },
        get token() {
            return setting.value.token;
        },
    };
})