import {CommonResponse, Settings, SiteInfo, Torrent} from "@/types";

export default defineBackground(() => {
    console.log('Hello background!', {id: browser.runtime.id});
    // 监听消息
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('后台接收到的参数：', request.type, request.payload);
        (async () => {
            try {
                let response;
                switch (request.type) {
                    case "getSiteInfo":
                        response = await getSite(request.payload)
                        console.log('getSiteInfo执行结果', response)
                        break;
                    case "sendSiteInfo":
                        response = await sendSiteInfoApi(request.payload)
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
                        let data = cookies.map(cookie => `${cookie.name}=${cookie.value}`)
                            .join('; ');
                        response = CommonResponse.success(data)
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
 * 获取站点相关规则
 * @returns {Promise<Object|null>} 站点信息对象或null
 * @param params
 */
const getSite = async (params: {
    setting: Settings,
    host: string
}): Promise<CommonResponse<SiteInfo | null> | null> => {
    const setting: Settings = params.setting;
    let host: string = params.host;
    console.log(setting);
    const path = "api/auth/monkey/get_site/"

    try {
        // 处理m-team域名特殊规则
        if (host.includes("m-team")) {
            host = host.replace("xp.", "api.")
            host = host.replace("kp.", "api.")
        }
        let url = `${setting.baseUrl}${path}${host}`

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer Monkey.${setting.token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            let msg = `服务器连接失败! status: ${response.status}`
            return CommonResponse.error(-1, msg)
        }

        const res = await response.json();
        console.log(res);
        return res;
    } catch (error) {
        let msg = `服务器连接失败！${error}`
        console.log(msg);
        return CommonResponse.error(-1, msg)
    }

}

/**
 * 同步站点数据到服务器
 * @param params
 */
async function sendSiteInfoApi(params: {
    setting: Settings,
    data: string
}) {
    const setting: Settings = params.setting;
    const data: string = params.data;
    const url = `${setting.baseUrl}api/auth/monkey/save_site`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: data,
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res

    } catch (error) {
        console.error('站点信息获取失败', error);
        throw new Error("站点信息获取失败");
    }
}

/**
 * 获取下载器列表
 */
async function getDownloadersApi(params: {
    setting: Settings,
}) {
    const setting: Settings = params.setting;
    try {
        const response = await fetch(`${setting.baseUrl}api/option/downloaders`, {
            method: "GET",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
            },
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error('获取下载器列表失败:', error);
        // 可以添加额外的错误处理逻辑，如显示错误提示
        return CommonResponse.error(-1, `获取下载器列表失败: ${error}`)
    }
}

/**
 * 测试下载器连接
 */
const testDownloaderApi = async (params: {
    setting: Settings,
    downloaderId: number
}) => {
    const setting: Settings = params.setting;
    const downloaderId = params.downloaderId;
    try {
        const response = await fetch(`${setting.baseUrl}api/option/downloaders/test/${downloaderId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
            },
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error('测试下载器连接失败:', error);
        return CommonResponse.error(-1, `测试下载器连接失败: ${error}`)
    }
};

/**
 * 获取下载器分类列表
 */
const getDownloaderCategoriseApi = async (params: {
    setting: Settings,
    downloaderId: number
}) => {
    const setting: Settings = params.setting;
    const downloaderId = params.downloaderId;

    try {

        // 获取分类列表
        const response = await fetch(`${setting.baseUrl}api/option/downloaders/category/${downloaderId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
            },
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error('获取下载器分类列表失败:', error);
        return CommonResponse.error(-1, `获取分类列表失败: ${error}`)
    }
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
    const setting: Settings = params.setting;
    const downloaderId = params.downloaderId;
    const mySiteId = params.mySiteId;
    const category: string = params.category
    const cookie: string = params.cookie
    const siteName: string = params.siteName
    const savePath: string | null = params.savePath
    const urlList: string[] = params.urlList

    try {
        const data = JSON.stringify({
            cookie: cookie,
            category: category,
            save_path: savePath,
            urls: urlList,
            tags: [siteName, "harvest-monkey"],
        });
        console.log(data);

        const response = await fetch(`${setting.baseUrl}api/option/push_monkey/${downloaderId}/${mySiteId}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
                "Content-Type": "application/json", // 添加内容类型头
            },
            body: data,
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error('推送种子失败:', error);
        return CommonResponse.error(-1, `推送种子失败: ${error}`)
    }
};

/**
 * 辅种助手
 * 获取辅种嘻嘻
 */
async function repeatInfoApi(params: {
    setting: Settings,
    tid: number
    mySiteId: number,
}) {
    const setting: Settings = params.setting;
    const tid = params.tid;
    const mySiteId = params.mySiteId;

    try {
        const response = await fetch(`${setting.baseUrl}api/auth/monkey/iyuu`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer Monkey.${setting.token}`,
            },
            body: `torrent_id=${tid}&site_id=${mySiteId}`,
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error('获取种子列表失败:', error);
        return CommonResponse.error(-1, `获取可辅种信息失败: ${error}`)
    }
}

/**
 * 同步种子信息到 收割机
 */
const syncTorrentsApi = async (params: {
    setting: Settings,
    torrents: Torrent[],
    mySiteId: number,
}) => {
    try {

        const setting: Settings = params.setting;
        const mySiteId = params.mySiteId;
        const torrents = params.torrents

        const response = await fetch(`${setting.baseUrl}api/monkey/parse_torrents`, {
            method: "POST",
            headers: {
                Authorization: `Bearer Monkey.${setting.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(torrents),
        });

        if (!response.ok) {
            return CommonResponse.error(-1, `HTTP error! status: ${response.status}`)
        }

        const res = await response.json();
        console.log(res);
        return res
    } catch (error) {
        console.error("种子信息同步失败", error);
        return CommonResponse.error(-1, `种子信息同步失败: ${error}`)
    }
};