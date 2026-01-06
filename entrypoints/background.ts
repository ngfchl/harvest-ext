import {CommonResponse, MySite, Settings, SiteInfo, Torrent} from "@/types";
import {fetchApi} from "@/hooks/requests";
import {MENU_IDS} from "@/components/menu";


export default defineBackground(() => {

    // 注册右键菜单
    browser.runtime.onInstalled.addListener(createContextMenu);

    function createContextMenu() {
        // 先移除旧菜单（开发时有用）
        browser.contextMenus.removeAll();

        // 创建“邮件助手”标题（不可点击）
        browser.contextMenus.create({
            id: MENU_IDS.ROOT,
            title: '收割机助手',
            contexts: ['page'], // 在页面任意位置右键显示
            // enabled: false,     // 不可点击
        });

        // 创建功能项
        const actions = [
            {id: MENU_IDS.SYNC, title: '🔄 同步站点'},
            {id: MENU_IDS.CLEAR_CACHE, title: '🧹 清理缓存'},
            {id: MENU_IDS.GET_COOKIE, title: '🍪 获取 Cookie'},
            {id: MENU_IDS.OPEN_HARVESTER, title: '🚜 打开收割机'},
        ];

        for (const action of actions) {
            browser.contextMenus.create({
                id: action.id,
                title: action.title,
                contexts: ['page'],
                parentId: MENU_IDS.ROOT, // ← 在支持 parentId 的浏览器（如 Firefox）中会嵌套
            });
        }
    }

    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        console.log(`正在操作的页面信息：${tab?.id}，当前操作：${info}`);
        if (!tab?.id) return

        browser.tabs.sendMessage(tab.id, {
            type: 'HARVEST_MENU_ACTION',
            action: info.menuItemId,
        }).catch(() => {
            console.warn('Harvest floating not ready');
        });
    })

    console.log('Hello background!', {id: browser.runtime.id});
    // 监听消息
    browser.runtime.onMessage.addListener((request, sender: Browser.runtime.MessageSender, sendResponse) => {
        console.log('后台接收到的参数：', request.type, request.payload, 'sender:', sender);
        (async () => {
            try {
                let response;
                switch (request.type) {
                    case "writeSingleSiteCookies":
                        response = await writeSingleSiteCookiesApi(request.payload)
                        console.log('写入单站Cookie执行结果', response)
                        break;
                    case "openPanelUrl":
                        response = await openPanelUrl(request.payload)
                        console.log('打开指定页面执行结果', response)
                        break;
                    case "clearSiteHarvestInfo":
                        response = await clearSiteHarvestInfo(request.payload)
                        console.log('清理收割机任务执行结果', response)
                        break;
                    case "refreshSingleSite":
                        response = await refreshSingleSiteApi(request.payload)
                        console.log('刷新单站数据执行结果', response)
                        break;
                    case "searchSingleSite":
                        response = await searchSingleSiteApi(request.payload)
                        console.log('单站搜索执行结果', response)
                        break;
                    case "searchMultiSite":
                        response = await searchMultiSiteApi(request.payload)
                        console.log('聚合搜索执行结果', response)
                        break;
                    case "signSingleSite":
                        response = await signSingleSiteApi(request.payload)
                        console.log('签到单站执行结果', response)
                        break;
                    case "getSiteInfo":
                        response = await getSite(request.payload)
                        console.log('获取单站站点配置执行结果', response)
                        break;
                    case "getWebSiteList":
                        response = await getWebSiteListApi(request.payload)
                        console.log('获取站点配置列表执行结果', response)
                        break;
                    case "getMySiteList":
                        response = await getMySiteListApi(request.payload)
                        console.log('获取已有站点列表执行结果', response)
                        break;
                    case "sendSiteInfo":
                        response = await sendSiteInfoApi(request.payload, sender)
                        console.log('sendSiteInfoApi执行结果', response)
                        break;
                    case "getDownloaders":
                        response = await getDownloadersApi(request.payload)
                        console.log('getDownloadersApi执行结果', response)
                        break;
                    case "testDownloader":
                        response = await testDownloaderApi(request.payload)
                        console.log('testDownloaderApi执行结果', response)
                        break;
                    case "getDownloaderCategorise":
                        response = await getDownloaderCategoriseApi(request.payload)
                        console.log('getDownloaderCategoriseApi执行结果', response)
                        break;
                    case "pushTorrent":
                        response = await pushTorrentApi(request.payload)
                        console.log('pushTorrentApi执行结果', response)
                        break;
                    case "repeatInfo":
                        response = await repeatInfoApi(request.payload)
                        console.log('repeatInfoApi执行结果', response)
                        break;
                    case "syncTorrents":
                        response = await syncTorrentsApi(request.payload)
                        console.log('syncTorrentsApi执行结果', response)
                        break;
                    case "getSiteCookies":
                        const cookies = await browser.cookies.getAll({domain: request.payload.host})
                        console.log("后台获取到的 Cookie 内容：", cookies)
                        let cookieMap = new Map();
                        cookies.forEach(cookie => {
                            if (!cookieMap.has(cookie.name)) {
                                cookieMap.set(cookie.name, encodeURIComponent(cookie.value));
                            }
                        });

                        let data = Array.from(cookieMap.entries())
                            .map(([name, value]) => `${name}=${value}`)
                            .join('; ');

                        response = data.length > 0 ? CommonResponse.success(data) : CommonResponse.error(-1, 'Cookie获取失败！')
                        break
                    default: {
                        response = CommonResponse.error(-1, `未知操作！${request.type}`);
                    }
                }
                console.log(request.type, response);
                sendResponse(response);
            } catch (error: any) {
                console.error("Request failed:", error);
                sendResponse({success: false, error: error.message || "请求失败"});
            }
        })();
        return true;
    });
});


/**
 * 获取已有站点列表
 * @param params
 */
const getMySiteListApi = async (params: {
    setting: Settings,
}) => {
    const path = "api/mysite/mysite"
    return await fetchApi({
        ...params,
        path: path,
        method: 'GET',
    })
}
/**
 * 获取支持的站点列表
 * @param params
 */
const getWebSiteListApi = async (params: {
    setting: Settings,
}) => {
    const path = "api/mysite/website"
    return await fetchApi({
        ...params,
        path: path,
        method: 'GET',
    })
}

/**
 * 获取站点相关规则
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const getSite = async (params: {
    setting: Settings,
    host: string
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    // 处理m-team域名特殊规则
    // let host = params.host;
    // if (host.includes("m-team")) {
    //     host = host.replace("xp.", "api.").replace("kp.", "api.");
    // }
    return fetchApi({
        ...params,
        path: `api/auth/monkey/get_site/${params.host}`,
        method: "GET",
    });
}
/**
 * 刷新
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const refreshSingleSiteApi = async (params: {
    setting: Settings,
    mySiteId: number
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    // 处理m-team域名特殊规则
    // let host = params.host;
    // if (host.includes("m-team")) {
    //     host = host.replace("xp.", "api.").replace("kp.", "api.");
    // }
    return fetchApi({
        ...params,
        path: `api/mysite/info/${params.mySiteId}`,
        method: "GET",
    });
}
/**
 * 签到
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const signSingleSiteApi = async (params: {
    setting: Settings,
    mySiteId: number
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    // 处理m-team域名特殊规则
    // let host = params.host;
    // if (host.includes("m-team")) {
    //     host = host.replace("xp.", "api.").replace("kp.", "api.");
    // }
    return fetchApi({
        ...params,
        path: `api/mysite/sign/${params.mySiteId}`,
        method: "GET",
    });
}
/**
 * 搜索
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const searchSingleSiteApi = async (params: {
    setting: Settings,
    mySiteId: number,
    key: string,
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    // 处理m-team域名特殊规则
    // let host = params.host;
    // if (host.includes("m-team")) {
    //     host = host.replace("xp.", "api.").replace("kp.", "api.");
    // }
    return fetchApi({
        ...params,
        path: `api/mysite/search/${params.mySiteId}?key=${params.key}`,
        method: "GET",
    });
}

/**
 * 搜索
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const searchMultiSiteApi = async (params: {
    setting: Settings,
    payload: {
        key: string,
        max_count: number,
        sites: number[]
    }
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    // 处理m-team域名特殊规则
    // let host = params.host;
    // if (host.includes("m-team")) {
    //     host = host.replace("xp.", "api.").replace("kp.", "api.");
    // }
    return fetchApi({
        ...params,
        path: `api/mysite/search`,
        data: params,
        method: "POST",
    });
}

/**
 * 同步站点数据到服务器
 * @param params
 * @param sender
 */
async function sendSiteInfoApi(params: {
    setting: Settings,
    data: Record<string, any>,
    importMode: boolean,
}, sender: Browser.runtime.MessageSender) {
    const response = await fetchApi({
        setting: params.setting,
        path: "api/auth/monkey/save_site",
        method: "POST",
        body: JSON.stringify(params.data),
        contentType: "application/json",
    });
    console.log(`站点添加结果：${params.importMode} == ${response.succeed}`);
    if (response.succeed && params.importMode && sender.tab?.id) {
        browser.tabs.remove(sender.tab.id)
    }

    return response
}

/**
 * 获取下载器列表
 */
async function getDownloadersApi(params: {
    setting: Settings,
}) {
    return fetchApi({
        ...params,
        path: "api/option/downloaders",
        method: "GET",
    });
}

/**
 * 测试下载器连接
 */
const testDownloaderApi = async (params: {
    setting: Settings,
    downloaderId: number
}) => {
    return fetchApi({
        ...params,
        path: `api/option/downloaders/test/${params.downloaderId}`,
        method: "GET",
    });
}

/**
 * 获取下载器分类列表
 */
const getDownloaderCategoriseApi = async (params: {
    setting: Settings,
    downloaderId: number
}) => {
    return fetchApi({
        ...params,
        path: `api/option/downloaders/category/${params.downloaderId}`,
        method: "GET",
    });
}

/**
 * 推送种子到下载器
 */
const pushTorrentApi = async (params: {
    setting: Settings,
    downloaderId: number,
    mySiteId: number,
    category: string,
    siteName: string,
    cookie: string,
    savePath: string | null,
    urlList: string[],
}) => {
    return fetchApi({
        ...params,
        path: `api/option/push_monkey/${params.downloaderId}/${params.mySiteId}`,
        method: "POST",
        body: JSON.stringify({
            cookie: params.cookie,
            category: params.category,
            save_path: params.savePath,
            urls: params.urlList,
            tags: JSON.stringify([params.siteName, "harvest-monkey"]),
        }),
        contentType: "application/x-www-form-urlencoded",
    });
}

/**
 * 辅种助手
 * 获取辅种嘻嘻
 */
async function repeatInfoApi(params: {
    setting: Settings,
    tid: number
    mySiteId: number,
}) {
    return fetchApi({
        ...params,
        path: "api/auth/monkey/iyuu",
        method: "POST",
        body: `torrent_id=${params.tid}&site_id=${params.mySiteId}`, // 保留原始格式
        contentType: "application/x-www-form-urlencoded",
    });
}

/**
 * 同步种子信息到 收割机
 */
const syncTorrentsApi = async (params: {
    setting: Settings,
    torrents: Torrent[],
    mySiteId: number,
}) => {
    return fetchApi({
        ...params,
        path: "api/monkey/parse_torrents",
        method: "POST",
        body: JSON.stringify(params.torrents), // 直接传递torrents数组
        contentType: "application/x-www-form-urlencoded",
    });
}

/**
 * 在新标签打开指定网页 收割机
 */
async function openPanelUrl(params: {
    setting: Settings,
    host: string,
}) {
    const importMode: boolean = await storage.getItem('local:importMode') || false
    await browser.tabs.create({url: params.host, active: !importMode});
}

/**
 * 在新标签打开指定网页 清理 localStorage 字段并关闭标签页
 */
async function clearSiteHarvestInfo(params: {
    setting: Settings,
    host: string,
}) {
    return new Promise<void>((resolve, reject) => {
        browser.tabs.create({url: params.host, active: false}).then(tab => {
            if (!tab.id) return reject('无法创建标签页');
            const tabId = tab.id;
            // 等待页面加载完成
            console.log(`开始清理：${params.host} 站点收割机相关缓存信息...`)
            const handleUpdate = (updatedTabId: number, changeInfo: Browser.tabs.OnUpdatedInfo,) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    // 注入脚本执行 localStorage 删除
                    browser.scripting.executeScript({
                        target: {tabId},
                        func: (keysToDelete: string[]) => {
                            keysToDelete.forEach(key => {
                                localStorage.removeItem(key);
                                console.log(`[自动清理] 已删除 localStorage: ${key}`);
                            });
                        },
                        args: [[
                            'website',
                            'mySite',
                        ]],
                    }).then(() => {
                        browser.tabs.remove(tabId);
                        browser.tabs.onUpdated.removeListener(handleUpdate);
                        resolve();
                    }).catch(err => {
                        browser.tabs.onUpdated.removeListener(handleUpdate);
                        reject(err);
                    });
                }
            };

            // 监听页面加载完成
            browser.tabs.onUpdated.addListener(handleUpdate);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 将整条 Cookie 字符串写入浏览器
 * @param params
 */
export async function writeSingleSiteCookiesApi(params: {
    setting: Settings,
    mySite: MySite,
}) {
    const mySite = params.mySite;
    try {
        const url = new URL(mySite.mirror!);
        const secure = url.protocol === 'https:';
        const {hostname} = url; // 提取域名

        const pairs = mySite.cookie.split(';');
        console.log('要写入的Cookie信息：', pairs)
        for (const pair of pairs) {
            const [name, ...rest] = pair.trim().split('=');
            const value = rest.join('=');
            if (!name || !value) continue;
            console.log(url.origin)
            browser.cookies.set({
                url: url.origin,
                name,
                value,
                domain: hostname, // 用主机名
                path: '/',
                secure,
                httpOnly: false,
                sameSite: 'lax',
                expirationDate: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
            });

        }
        return CommonResponse.success(null, `✅${mySite.nickname || mySite.site} Cookie 写入完成！`)
    } catch (err) {
        console.error(err);
        return CommonResponse.error(-1, `❌ ${mySite.nickname || mySite.site} Cookie 写入失败！`);
    }
}