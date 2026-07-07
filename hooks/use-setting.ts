import {
    CacheData,
    CommonResponse,
    Downloader,
    MySite,
    Settings,
    SignInfo,
    SiteInfo,
    StatusInfo,
    Torrent,
    WebSite
} from "@/types";
import {defineStore} from "pinia";
import {ref, toRaw} from "vue";
import {message} from "ant-design-vue";
import {parseLocalStorageString} from "@/utils/localStorageString";

export const useSettingStore = defineStore("setting", () => {
    const setting = ref<Settings>({
        baseUrl: 'http://127.0.0.1:8000', token: '',
        imgSize: 81,
        imgUrl: 'https://api.mtyqx.cn/xjjapi/random.php',
    })
    const canSave = ref(false);
    const downloaders = ref<Downloader[]>()
    const webSiteList = ref<{ [key: string]: WebSite }>()
    const mySiteList = ref<{ [key: string]: MySite }>()
    const importCookieMode = ref<boolean>(false)
    const syncMode = ref<boolean>(false)
    const isOpenInPopupFlag = ref<boolean>(false)
    const count = ref(0)
    const showText = ref('')
    /**
     * 会话级图片 URL 缓存键
     */
    const CACHED_IMG_URL_KEY = 'session:cachedFloatImgUrl';

    /**
     * 通过后台脚本获取随机图片 API 重定向后的真实 URL
     */
    const resolveRealImageUrl = async (apiUrl: string): Promise<string | null> => {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'resolveRealImageUrl',
                payload: {apiUrl},
            });
            return response?.succeed ? response.data || null : null;
        } catch {
            return null;
        }
    };

    /**
     * 获取会话级缓存的图片 URL：首次解析真实地址后缓存，后续直接复用
     */
    const getCachedFloatImgUrl = async (): Promise<string> => {
        const existing = await browser.storage.session.get(CACHED_IMG_URL_KEY) as Record<string, string>;
        if (existing[CACHED_IMG_URL_KEY]) {
            return existing[CACHED_IMG_URL_KEY];
        }
        const rawUrl = setting.value.imgUrl || `${setting.value.baseUrl}favicon.ico`;
        const realUrl = await resolveRealImageUrl(rawUrl);
        if (realUrl) {
            await browser.storage.session.set({[CACHED_IMG_URL_KEY]: realUrl});
            return realUrl;
        }
        return "";
    };

    /**
     * 从存储加载设置
     */
    const getSetting = async () => {
        try {
            const data = await storage.getItem("local:setting");
            console.log(data);
            if (data) {
                setting.value = data as Settings;
                console.log(setting.value.token);
                if (!setting.value.baseUrl || !setting.value.token) {
                    message.error("请先在插件中配置服务器与授权信息！");
                    return CommonResponse.error(-1, "请先在插件中配置服务器与授权信息！");
                }
                return CommonResponse.success(data);
            }
            return CommonResponse.error(-1, '获取收割机服务器设置失败！');
        } catch (error) {
            console.error("获取设置失败:", error);
            return CommonResponse.error(-1, `获取收割机服务器设置失败！${error}`);
        }
    };

    /**
     * 保存设置到存储
     */
    const saveSetting = async () => {
        try {
            // 保存到存储
            await storage.setItem("local:setting", toRaw(setting.value));
            message.success("服务器连接成功！信息已缓存！");
            return true;
        } catch (error) {
            console.error("保存设置失败:", error);
            message.error(`服务器信息保存失败！${error}`);
            return false;
        }
    };

    const initializeCore = async () => {
        const res = await getSetting();
        if (res.succeed) {
            await loadCoreFromCacheIfAvailable();
        }
    };

    const initializeDownloaders = async () => {
        const res = await getSetting();
        if (res.succeed) {
            await loadDownloadersFromCacheIfAvailable();
        }
    };

    // 自动初始化 - 正确处理Promise
    const initialize = async () => {
        await initializeCore();
        initializeDownloaders().catch(error => {
            console.error("初始化下载器失败:", error);
        });
    };

    /**
     * 缓存数据到本地存储
     * @param key 缓存键名
     * @param data 要缓存的数据
     * @param expireTime 过期时间(毫秒)，默认24小时
     */
    const saveToCache = async (key: string, data: any, expireTime: number = 24 * 60 * 60 * 1000) => {
        const cacheData: CacheData = {
            data,
            timestamp: Date.now(),
            expireTime
        };
        await storage.setItem(<StorageItemKey>key, cacheData);
        console.log(`数据已缓存到本地: ${key}`);
    }

    /**
     * 从本地缓存获取数据
     * @param key 缓存键名
     * @returns 缓存数据或null
     */
    const getFromCache = async (key: string,): Promise<any | null> => {
        const cacheData: CacheData | null = await storage.getItem(<StorageItemKey>key);
        // const cacheData = result.data;
        if (!cacheData) {
            console.log(`缓存未找到: ${key}`);
            return null;
        }

        // 检查缓存是否过期
        const isExpired = Date.now() > cacheData.timestamp + cacheData.expireTime;
        if (isExpired) {
            console.log(`缓存已过期: ${key}`);
            await storage.removeItem(<StorageItemKey>key);
            return null;
        }

        console.log(`使用本地缓存: ${key}`);
        return cacheData.data;
    }
    /**
     * 尝试从本地缓存加载服务器数据
     * @returns 如果成功从缓存加载返回true，否则返回false
     */
    const loadFromCacheIfAvailable = async (): Promise<boolean> => {
        console.log('正在读取本地缓存数据')
        // 从本地缓存获取数据
        const [cachedSupportedSites, cachedMySites, cachedDownloaders] = await Promise.all([
            getFromCache('local:supportedSites'),
            getFromCache('local:mySites'),
            getFromCache('local:downloaders')
        ]);

        // 如果缓存存在且未过期，直接使用
        if (cachedSupportedSites && cachedMySites && cachedDownloaders) {
            webSiteList.value = cachedSupportedSites;
            mySiteList.value = cachedMySites;
            downloaders.value = cachedDownloaders;
            console.log('使用本地缓存数据');
            return false;
        }
        message.warning('缓存数据已过期，正在重新加载数据')
        await cacheServerData()
        return true;
    }

    const loadCoreFromCacheIfAvailable = async (): Promise<boolean> => {
        console.log('正在读取本地站点缓存数据')
        const [cachedSupportedSites, cachedMySites] = await Promise.all([
            getFromCache('local:supportedSites'),
            getFromCache('local:mySites')
        ]);

        if (cachedSupportedSites && cachedMySites) {
            webSiteList.value = cachedSupportedSites;
            mySiteList.value = cachedMySites;
            console.log('使用本地站点缓存数据');
            return false;
        }

        message.warning('站点缓存数据已过期，正在重新加载数据')
        await cacheCoreServerData()
        return true;
    }

    const loadDownloadersFromCacheIfAvailable = async (): Promise<boolean> => {
        console.log('正在读取本地下载器缓存数据')
        const cachedDownloaders = await getFromCache('local:downloaders');
        if (cachedDownloaders) {
            downloaders.value = cachedDownloaders;
            console.log('使用本地下载器缓存数据');
            return false;
        }

        const downloaderResult = await getDownloaders()
        if (!downloaderResult.succeed) {
            console.log('获取下载器列表失败:', downloaderResult.msg);
            throw new Error('获取下载器列表失败');
        }
        downloaders.value = downloaderResult.data;
        await saveToCache('local:downloaders', downloaderResult.data);
        return true;
    }

    const cacheCoreServerData = async () => {
        try {
            console.log('开始缓存站点核心数据...');
            const [supportedSites, mySites] = await Promise.all([
                getWebSiteList(),
                getMySiteList()
            ]);

            const validateResult = (result: CommonResponse<any>, action: string) => {
                if (!result.succeed) {
                    console.log(`${action}失败:`, result.msg);
                    throw new Error(`${action}失败`);
                }
                return result.data;
            };

            const supportedSitesData = validateResult(supportedSites, '获取支持的站点列表');
            const mySitesData = validateResult(mySites, '获取已添加站点列表');

            webSiteList.value = supportedSitesData;
            mySiteList.value = mySitesData;

            await Promise.all([
                saveToCache('local:supportedSites', supportedSitesData),
                saveToCache('local:mySites', mySitesData)
            ]);

            console.log('站点核心数据获取并缓存成功！');
        } catch (error) {
            console.error('缓存站点核心数据失败', error);
            message.error(`缓存站点核心数据失败:${error}`);
        }
    }
    /**
     * 从服务器拉取数据并缓存
     */
    const cacheServerData = async () => {
        try {
            console.log('开始缓存服务器数据...');

            // 缓存不存在或已过期，重新获取数据
            const [supportedSites, mySites, downloaders] = await Promise.all([
                getWebSiteList(),
                getMySiteList(),
                getDownloaders()
            ]);

            // 验证并处理结果
            const validateResult = (result: CommonResponse<any>, action: string) => {
                if (!result.succeed) {
                    console.log(`${action}失败:`, result.msg);
                    throw new Error(`${action}失败`);
                }
                return result.data;
            };

            // 更新状态
            const supportedSitesData = validateResult(supportedSites, '获取支持的站点列表');
            const mySitesData = validateResult(mySites, '获取已添加站点列表');
            const downloadersData = validateResult(downloaders, '获取下载器列表');

            webSiteList.value = supportedSitesData;
            mySiteList.value = mySitesData;
            downloaders.value = downloadersData;

            // 将数据保存到本地缓存
            await Promise.all([
                saveToCache('local:supportedSites', supportedSitesData),
                saveToCache('local:mySites', mySitesData),
                saveToCache('local:downloaders', downloadersData)
            ]);

            console.log('所有数据获取并缓存成功！');
            message.success("所有数据获取并缓存成功");
        } catch (error) {
            console.error('缓存服务器数据失败', error);
            message.error(`缓存服务器数据失败:${error}`);
        }
    }

    /**
     * 获取已添加站点列表
     */
    const getWebSiteList = async () => {
        const response = await browser.runtime.sendMessage({
            type: 'getWebSiteList',
            payload: {
                setting: toRaw(setting.value),
            }
        });
        if (!response.succeed) {
            return response;
        }
        const sites = Array.isArray(response.data) ? response.data : [];
        return CommonResponse.success(sites.reduce((acc: { [key: string]: WebSite }, site: WebSite) => {
            acc[site.name] = site;
            return acc;
        }, {}))
    }
    /**
     * 获取已添加站点列表
     */
    const getMySiteList = async () => {
        const response = await browser.runtime.sendMessage({
            type: 'getMySiteList',
            payload: {
                setting: toRaw(setting.value),
            }
        });
        if (!response.succeed) {
            return response;
        }
        const sites = Array.isArray(response.data) ? response.data : [];
        const data = sites.reduce((acc: { [key: number]: MySite }, site: MySite) => {
            const {status, sign_info, ...processedSite} = site;
            // 获取最新状态日期（如果有）

            let mySite: MySite = <MySite>processedSite
            if (status) {
                // @ts-ignore
                const latestDate = Object.keys(status).sort().pop()
                // @ts-ignore
                mySite.status = <StatusInfo | null>status[latestDate]
            }
            if (mySite.sign_in) {
                let today = (new Date()).toISOString().split('T')[0];
                // @ts-ignore
                mySite.sign_info = <SignInfo | null>sign_info[today];
            } else {
                mySite.sign_info = null;
            }
            acc[site.id] = mySite
            return acc;
        }, {})
        return CommonResponse.success(data)
    }
    /**
     * 使用已有的站点 ID 查找站点及配置信息
     * @param siteId
     */
    const filterSiteById = async (siteId: number) => {
        const mySite = mySiteList.value![siteId];
        if (!mySite) {
            console.log(`${siteId} not found`);
            message.warning(`ID 为${siteId}的站点不存在！`);
            return
        }
        return webSiteList.value![mySite.site]
    }
    /**
     * 使用 host 查找站点配置
     * @param host
     */
    const filterSiteByHost = (host: string) => {
        // host = replaceMTeamDomainIfMatched(host).toLowerCase();

        return Object.values(webSiteList.value ?? {}).find(site =>
            site.url.some(url => {
                try {
                    return new URL(url).host === host;
                } catch {
                    return false; // 忽略无效URL
                }
            })
        );
    }
    /**
     * 使用站点名称查找已添加站点信息
     * @param siteName
     */
    const filterMySiteBySiteName = (siteName: String) => {
        const mySite = Object.values(mySiteList.value ?? {}).find(mySite => mySite.site === siteName);
        console.log(mySite);
        if (!mySite) {
            return 0
        }
        return mySite.id;
    }

    /**
     * 筛选可以导入的站点
     */
    const filterToAddSite = async () => {
        console.log('筛选已添加的站点')
        await loadFromCacheIfAvailable()
        const existingSites = new Set(Object.values(mySiteList.value!).map(site => site.site));
        console.log('已添加的站点:', existingSites);
        return Object.fromEntries(
            Object.entries(webSiteList.value!).filter(([key, site]) => !existingSites.has(key) && site.alive)
        );
    }
    /**
     * 自动同步已添加站点的 Cookie
     */
    const autoSyncCookie = async (): Promise<void> => {
        console.log('开始同步站点 Cookie', mySiteList.value)
        showText.value = '开始同步站点 Cookie 到收割机';
        syncMode.value = true
        await loadFromCacheIfAvailable()
        const siteList = Object.values(mySiteList.value!).filter((site) => site.available);
        console.log('需要同步的站点：', siteList);
        for (const site of siteList) {
            count.value += 1
            await syncSingleSiteCookie(site)
        }

        message.success(`站点 Cookie 同步完成，共同步${count.value} / ${siteList.length}`);
        await cacheServerData()
        await sleep(3000)
        message.destroy()
        syncMode.value = false
        count.value = 0
    }
    /**
     * 自动导入站点的 Cookie
     */
    const autoImportCookie = async (): Promise<void> => {
        console.log('开始导入站点 Cookie', mySiteList.value)
        showText.value = '开始导入站点 Cookie 到浏览器';
        importCookieMode.value = true
        await loadFromCacheIfAvailable()
        const siteList = Object.values(mySiteList.value!).filter((site) => site.available);
        console.log('需要导入的站点：', siteList);
        for (const site of siteList) {
            count.value += 1
            await writeSingleSiteCookies(site)
        }

        message.success(`导入 Cookie 到浏览器完成，共导入${count.value} / ${siteList.length}`);
        await sleep(3000)
        importCookieMode.value = false
        count.value = 0
    }

    /**
     * 后台同步单站 Cookie
     * @param site
     */
    async function syncSingleSiteCookie(site: MySite) {
        console.log(`正在同步的站点：${site.nickname} ==> ${site.site}`)
        if (!site.mirror) {
            showText.value = `${site.nickname || site.site} 缺少访问地址，无法同步 Cookie 和 LocalStorage`;
            return;
        }
        const localStorageUrls = Array.from(new Set([
            site.mirror,
            ...(webSiteList.value?.[site.site]?.url || []),
        ].filter((url): url is string => Boolean(url))));
        const [cookieResponse, ...localStorageResponses] = await Promise.all([
            getCookieString(site.mirror),
            ...localStorageUrls.map(url => getSiteLocalStorageString(url)),
        ]);
        const cookieData = cookieResponse.succeed ? cookieResponse.data || '' : '';
        const localStorageData = localStorageResponses.find(response => response.succeed && response.data)?.data || '';

        if (cookieData || localStorageData) {
            // 保存Cookie到插件存储（推荐使用chrome.storage）
            let siteData = {
                user_id: site.user_id,
                site: site.site,
                cookie: cookieData,
                local_storage: localStorageData,
                user_agent: window.navigator.userAgent
            }
            const res = await sendSiteInfo(siteData)
            console.log(res.msg)
            showText.value = res.msg;
            return;
        }

        showText.value = `${site.nickname || site.site} Cookie 和 LocalStorage 获取失败`;
    }

    /**
     * 判断 popup 弹出也是在标签页还是弹出框中
     */
    const isOpenInPopup = async (): Promise<boolean> => {
        let flag = false;
        const tab = await browser.tabs.getCurrent();
        console.log("popup-tab:", tab)
        if (tab) {
            console.log('当前 popup 是在标签页中打开的');
        } else {
            flag = true;
            console.log('当前 popup 是作为弹出窗口打开的');
        }
        return flag;
    }
    /**
     * 打开 popup 页面
     */
    const openPopupInTab = async () => {
        if (isOpenInPopupFlag.value) {
            const url = browser.runtime.getURL('/operate.html');
            browser.tabs.create({url});
        }
    }

    /**
     * 批量签到
     */
    const autoSignAll = async (mySiteList: MySite[]) => {
        for (const site of mySiteList) {
            try {
                await openSignInTab(site);
            } catch (e) {
                console.log(e)
            } finally {
                let seconds = getRandomInt(1, 10)
                await sleep(seconds * 200)
            }
        }
    }
    /**
     * 新建签到页面
     */
    const openSignInTab = async (mySite: MySite) => {
        let webSite = webSiteList.value![mySite.site];
        let url: string = `${mySite.mirror}${normalizePath(webSite.page_sign_in)}`
        browser.tabs.create({url: url, active: false});
    }

    /**
     * 批量打开站点
     */
    const autoOpenAll = async (mySiteList: MySite[]) => {
        for (const site of mySiteList) {
            try {
                if (!site.available) {
                    continue
                }
                browser.tabs.create({url: site.mirror!, active: false});
            } catch (e) {
                console.log(e)
            } finally {
                let seconds = getRandomInt(1, 10)
                await sleep(seconds * 200)
            }
        }
    }

    /**
     * 获取指定范围的随机数
     * @param min
     * @param max
     */
    function getRandomInt(min: number, max: number): number {
        // 向上取整、向下取整，确保包含 min 和 max
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 等待时间
     * @param ms
     */
    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const parseCookieNames = (cookieString: string) => {
        return cookieString
            .split(';')
            .map(item => item.trim())
            .filter(Boolean)
            .map(item => {
                const separatorIndex = item.indexOf('=');
                return separatorIndex >= 0 ? item.slice(0, separatorIndex).trim().toLowerCase() : item.toLowerCase();
            })
            .filter(Boolean);
    }

    const isPotentialSiteAuthCookie = (cookieString: string) => {
        const trimmedCookie = cookieString.trim();
        if (trimmedCookie.length < 24) {
            return false;
        }

        const cookieNames = parseCookieNames(trimmedCookie);
        if (cookieNames.length === 0) {
            return false;
        }

        const authNamePatterns = [
            /uid/,
            /user/,
            /member/,
            /auth/,
            /pass/,
            /token/,
            /login/,
            /rss/,
            /c_secure/,
        ];
        if (cookieNames.some(name => authNamePatterns.some(pattern => pattern.test(name)))) {
            return true;
        }

        const genericCookieNames = new Set([
            '_ga',
            '_gid',
            '_gat',
            '_gcl_au',
            '_fbp',
            'cf_clearance',
            '__cf_bm',
            '__cflb',
            '__cfruid',
            'cf_chl_2',
            'cf_chl_rc_i',
            'cf_chl_rc_ni',
            'cf_chl_rc_m',
            'Hm_lvt',
            'Hm_lpvt',
            'theme',
            'lang',
            'language',
            'locale',
            'timezone',
        ].map(name => name.toLowerCase()));
        const meaningfulCookieNames = cookieNames.filter(name => {
            if (genericCookieNames.has(name)) {
                return false;
            }
            return !name.startsWith('_ga') && !name.startsWith('_pk_') && !name.startsWith('utm');
        });

        return meaningfulCookieNames.length >= 2 && trimmedCookie.length >= 80;
    }

    const isPotentialSiteAuthLocalStorage = (localStorageString: string | null | undefined) => {
        const entries = parseLocalStorageString(localStorageString);
        if (entries.length === 0) {
            return false;
        }

        const authKeyPatterns = [
            /auth/i,
            /token/i,
            /uid/i,
            /user/i,
            /member/i,
            /pass/i,
            /login/i,
            /session/i,
            /jwt/i,
        ];
        if (entries.some(([key, value]) => authKeyPatterns.some(pattern => pattern.test(key)) && value.trim().length >= 8)) {
            return true;
        }

        const meaningfulEntries = entries.filter(([key, value]) => {
            const normalizedKey = key.toLowerCase();
            if (!value || value.trim().length < 8) {
                return false;
            }
            return !['theme', 'lang', 'language', 'locale', 'timezone'].includes(normalizedKey);
        });

        return meaningfulEntries.length >= 2 && (localStorageString || '').trim().length >= 80;
    }

    const buildControlPanelUrl = (baseUrl: string, controlPanelPath: string) => {
        if (!controlPanelPath || controlPanelPath.includes("{}")) {
            return baseUrl;
        }
        return new URL(normalizePath(controlPanelPath), baseUrl).toString();
    }

    /**
     * 自动添加战地啊
     */
    const autoAddSites = async () => {
        const toAddSites = await filterToAddSite()
        console.log('未添加的站点:', toAddSites)
        let openedCount = 0
        let skippedCount = 0
        for (const site of Object.values(toAddSites)) {
            try {
                const opened = await addSingleSite(site);
                if (opened) {
                    openedCount += 1
                } else {
                    skippedCount += 1
                }
            } catch (e) {
                console.log(e)
                skippedCount += 1
            } finally {
                let seconds = getRandomInt(1, 10)
                await sleep(seconds * 200)
            }
        }
        message.success(`一键添加处理完成，已打开 ${openedCount} 个站点，跳过 ${skippedCount} 个无有效 Cookie 的站点`);
    }
    /**
     * 更新单站数据
     */
    const refreshSingleSite = async (site: MySite) => {
        const res = await browser.runtime.sendMessage({
            type: 'refreshSingleSite',
            payload: {
                setting: toRaw(setting.value),
                mySiteId: site.id,
            }
        });
        showText.value = res.msg;
        return res
    }
    /**
     * 写入单站 Cookie 到浏览器
     */
    const writeSingleSiteCookies = async (site: MySite) => {
        const res = await browser.runtime.sendMessage({
            type: 'writeSingleSiteCookies',
            payload: {
                setting: toRaw(setting.value),
                mySite: JSON.parse(JSON.stringify(toRaw(site))),
            }
        });
        showText.value = res.msg;
        return res
    }
    /**
     * 清理单站 Cookie 和 LocalStorage
     */
    const clearSiteAuthData = async (url: string, siteName?: string) => {
        const res = await browser.runtime.sendMessage({
            type: 'clearSiteAuthData',
            payload: {
                url,
                siteName,
            }
        });
        showText.value = res.msg;
        return res
    }
    /**
     * 更新单站数据
     */
    const signSingleSite = async (site: MySite) => {
        const res = await browser.runtime.sendMessage({
            type: 'signSingleSite',
            payload: {
                setting: toRaw(setting.value),
                mySiteId: site.id,
            }
        });
        showText.value = res.msg;
        return res
    }
    /**
     * 更新单站数据
     */
    const searchSingleSite = async (site: MySite, key: string) => {
        const res = await browser.runtime.sendMessage({
            type: 'searchSingleSite',
            payload: {
                setting: toRaw(setting.value),
                mySiteId: site.id,
                key: key,
            }
        });
    }

    /**
     * 去除网址路径前面的/
     * @param path
     */
    function normalizePath(path: string): string {
        // 移除路径开头的斜杠
        return path.startsWith('/') ? path.substring(1) : path;
    }

    /**
     * 添加单站
     * @param site
     */
    const addSingleSite = async (site: WebSite) => {
        console.log(`正在添加站点： ${site.name} `);
        for (const url of site.url) {
            try {
                // 使用完整 URL 获取站点 Cookie，同时读取 localStorage，用于兼容 token 型站点
                const [cookieResponse, localStorageResponse] = await Promise.all([
                    getCookieString(url),
                    getSiteLocalStorageString(url),
                ]);
                const hasAuthCookie = cookieResponse.succeed
                    && cookieResponse.data
                    && isPotentialSiteAuthCookie(cookieResponse.data);
                const hasAuthLocalStorage = localStorageResponse.succeed
                    && isPotentialSiteAuthLocalStorage(localStorageResponse.data);
                // 筛选 Cookie，无效的 Cookie 直接排除
                // 有效站点挨个打开标签页【控制面板页面】，自动同步信息
                if (hasAuthCookie || hasAuthLocalStorage) {
                    // 保存Cookie到插件存储（推荐使用chrome.storage）
                    // await storage.setItem(<StorageItemKey>host!, response.data);
                    const panelUrl = buildControlPanelUrl(url, site.page_control_panel);
                    // 在新标签页打开（浏览器插件API）
                    console.log('正在打开自动同步页面:', panelUrl);

                    await browser.runtime.sendMessage({
                        type: 'openPanelUrl',
                        payload: {
                            setting: toRaw(setting.value),
                            host: panelUrl,
                            active: false,
                        }
                    });
                    return true;
                }
            } catch (error) {
                console.error(`处理URL ${url}时出错:`, error);
            }
        }
        console.warn(`${site.name} 所有URL均未能获取有效登录 Cookie`);
        return false;
    };


    /**
     * 自动清理站点收割机存储信息
     */
    const autoClearSitesHarvestInfo = async () => {
        await cacheServerData()
        message.success('站点配置列表和站点信息列表缓存已刷新');
    }

    /**
     * 清理单站存储的收割机信息
     * @param site
     */
    const clearSingleSiteHarvestInfo = async (site: WebSite) => {
        console.log(`正在清理站点收割机存储信息： ${site.name} `);
        await cacheServerData()
    }
    // // 立即执行初始化，但不阻塞其他代码
    initializeCore().catch(error => {
        console.error("初始化设置失败:", error);
    });
    /**
     * 获取站点相关规则
     * @param {string} host - 站点域名
     * @returns {Promise<Object|null>} 站点信息对象或null
     */
    const getSite = async (host: string): Promise<CommonResponse<SiteInfo | null> | null> => {
        const res = await browser.runtime.sendMessage({
            type: 'getSiteInfo',
            payload: {
                setting: toRaw(setting.value),
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
     * @param siteUrlOrHost
     */
    const getCookieString = async (siteUrlOrHost: string) => {
        var cookies;
        if (siteUrlOrHost.includes('m-team')) {
            let auth = localStorage.getItem('auth');
            if (!auth) {

                return CommonResponse.error(-1, "MTeam Cookie 信息获取失败！")
            }
            return CommonResponse.success(auth);
        } else if (siteUrlOrHost.includes('rousi.pro')) {
            let auth = localStorage.getItem('token');
            if (!auth) {
                return CommonResponse.error(-1, "Rousi Cookie 信息获取失败！")
            }
            return CommonResponse.success(auth);
        } else {
            cookies = await browser.runtime.sendMessage({
                type: 'getSiteCookies',
                payload: {
                    setting: toRaw(setting.value),
                    url: siteUrlOrHost,
                }
            });
        }
        console.log("Cookies:", cookies)
        return cookies
    }

    /**
     * 获取指定站点 localStorage，并序列化为 key=value; key2=value2 格式
     * @param url 站点访问地址
     */
    const getSiteLocalStorageString = async (url: string) => {
        return await browser.runtime.sendMessage({
            type: 'getSiteLocalStorage',
            payload: {
                url,
            }
        });
    }

    /**
     * 保存站点信息到服务器
     * @param data
     */
    const sendSiteInfo = async (data: Record<string, any>, options: { closeTabOnSuccess?: boolean } = {}) => {
        return await browser.runtime.sendMessage({
            type: 'sendSiteInfo',
            payload: {
                setting: toRaw(setting.value),
                data: data,
                closeTabOnSuccess: Boolean(options.closeTabOnSuccess),
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
                setting: toRaw(setting.value),
            }
        })
    }
    /**
     * 测试下载器
     * @param downloaderId
     */
    const testDownloader = async (downloaderId: number) => {
        return await browser.runtime.sendMessage({
            type: 'testDownloader',
            payload: {
                setting: toRaw(setting.value),
                downloaderId: downloaderId
            }
        })
    }
    /**
     * 获取下载器分类
     * @param downloaderId
     */
    const getDownloaderCategorise = async (downloaderId: number) => {
        return await browser.runtime.sendMessage({
            type: 'getDownloaderCategorise',
            payload: {
                setting: toRaw(setting.value),
                downloaderId: downloaderId
            }
        })
    }
    /**
     * 推送种子
     * @param downloaderId
     * @param mySiteId
     * @param category
     * @param siteName
     * @param cookie
     * @param savePath
     * @param urlList
     */
    const pushTorrent = async (
        downloaderId: number,
        mySiteId: number,
        category: string,
        siteName: string,
        cookie: string,
        savePath: string | null,
        urlList: string[],
        options: Record<string, any> = {},
    ) => {
        return await browser.runtime.sendMessage({
            type: 'pushTorrent',
            payload: JSON.parse(JSON.stringify({
                setting: toRaw(setting.value),
                downloaderId: downloaderId,
                mySiteId: mySiteId,
                category: category,
                siteName: siteName,
                cookie: cookie,
                savePath: savePath,
                urlList: urlList,
                options: options,
            }))
        })
    }
    /**
     * 获取种子辅种信息
     * @param tid
     * @param mySiteId
     */
    const repeatInfo = async (
        tid: number,
        mySiteId: number
    ) => {
        return await browser.runtime.sendMessage({
            type: 'repeatInfo',
            payload: {
                setting: toRaw(setting.value),
                tid: tid,
                mySiteId: mySiteId
            }
        })
    }
    /**
     * 同步种子信息到收割机
     * @param torrents
     * @param mySiteId
     */
    const syncTorrents = async (
        torrents: Torrent[],
        mySiteId: number,
    ) => {
        return await browser.runtime.sendMessage({
            type: 'syncTorrents',
            payload: {
                setting: toRaw(setting.value),
                torrents: torrents,
                mySiteId: mySiteId,
            }
        })
    }
    /**
     * 测试服务器授权
     */
    const testServer = async () => {
        if (!setting.value.baseUrl.startsWith('https://') && !setting.value.baseUrl.startsWith('http://')) {
            message.warn("服务器地址填写出错了，请以 http:// 或 https:// 开头");
            return;
        }
        if (!setting.value.baseUrl.endsWith('/')) {
            setting.value.baseUrl = `${setting.value.baseUrl}/`;
        }
        const res = await getSite('1ptba.com')
        if (!res?.succeed) {
            // message.error('服务器连接失败！');
            canSave.value = false;
            return;
        }
        console.log('服务器连接成功！');
        canSave.value = true;
        await saveSetting()
    }

    /**
     * 替换形如 xxxxx.m-team.cc 或 .io 的域名为主域名 api.m-team.cc/io
     * 如果不匹配，则原样返回。
     * @param host 需要处理的域名
     * @returns 处理后的域名
     */
    function replaceMTeamDomainIfMatched(host: string): string {
        host = host.toLowerCase()
        const pattern = /^([^/.\s]+)\.m-team\.(cc|io)$/;
        const match = host.match(pattern);

        if (match) {
            const tld = match[2]; // 获取顶级域名 (cc/io)
            return `api.m-team.${tld}`;
        }

        return host;
    }

    return {
        autoAddSites,
        addSingleSite,
        autoClearSitesHarvestInfo,
        autoImportCookie,
        autoOpenAll,
        autoSignAll,
        autoSyncCookie,
        cacheServerData,
        canSave,
        clearSiteAuthData,
        clearSingleSiteHarvestInfo,
        count,
        downloaders,
        filterMySiteBySiteName,
        filterSiteByHost,
        filterSiteById,
        getCachedFloatImgUrl,
        getCookieString,
        getDownloaderCategorise,
        getDownloaders,
        getSetting,
        getSite,
        getSiteLocalStorageString,
        importCookieMode,
        initialize,
        initializeCore,
        initializeDownloaders,
        isOpenInPopup,
        isOpenInPopupFlag,
        loadCoreFromCacheIfAvailable,
        loadDownloadersFromCacheIfAvailable,
        loadFromCacheIfAvailable,
        mySiteList,
        openPopupInTab,
        pushTorrent,
        refreshSingleSite,
        repeatInfo,
        resolveRealImageUrl,
        saveSetting,
        searchSingleSite,
        sendSiteInfo,
        setting,
        showText,
        signSingleSite,
        sleep,
        syncMode,
        syncSingleSiteCookie,
        syncTorrents,
        testDownloader,
        testServer,
        webSiteList,
        writeSingleSiteCookies,
    };
})
