<script lang="ts" setup>
import {computed, nextTick, onMounted, ref} from 'vue';
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";
import {MenuProps, message} from "ant-design-vue";
import {
  AreaChartOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FieldTimeOutlined,
  FilterOutlined,
  FormatPainterOutlined,
  LoadingOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
} from '@ant-design/icons-vue';
import prettyBytes from "pretty-bytes";
import {MySite, StatusInfo, WebSite} from "@/types";
import numberFormat from "@/utils/numberFormat";
import copy from "copy-to-clipboard";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  importCookieMode,
  count,
  syncMode,
  mySiteList,
  showText,
  webSiteList,
} = storeToRefs(settingStore)
const {
  getSetting,
  testServer,
  sleep,
  saveSetting,
  addSingleSite,
  autoAddSites,
  autoSyncCookie,
  getCookieString,
  refreshSingleSite,
  autoImportCookie,
  signSingleSite,
  cacheServerData,
  syncSingleSiteCookie,
  autoClearSitesHarvestInfo,
  writeSingleSiteCookies,
  autoSignAll,
  autoOpenAll,
} = settingStore
// const mySiteId = ref<number>(0)
const showSiteList = ref(true);
const collapsed = ref(false);
const privateMode = ref(false);
const reverseMode = ref(false);
const searchKey = ref('');
const sortKey = ref('mail');
const activeKey = ref('1');
const filterKey = ref('null');
const showMySiteList = ref<MySite[]>([]);
const hadList = ref<string[]>([]);
const cookieInfoMap = ref<{ [key: string]: string }>();
const operationLoadingMap = ref<Record<string, boolean>>({});
const operationTextMap = ref<Record<string, string>>({});

const mySites = computed(() => Object.values(mySiteList.value || {}));
const siteStats = computed(() => ({
  disabled: mySites.value.filter(item => !item.available).length,
  alive: mySites.value.filter(item => item.available).length,
  total: mySites.value.length,
  filtered: showMySiteList.value.length,
}));

type UnifiedSiteGroupKey = 'disabled' | 'databaseWithLocalCookie' | 'databaseWithoutLocalCookie' | 'unadded'

type UnifiedSiteCard = {
  key: string;
  group: UnifiedSiteGroupKey;
  siteName: string;
  displayName: string;
  primaryUrl: string;
  urls: string[];
  localCookie: string;
  mySite?: MySite;
  webSite?: WebSite;
}

const unifiedGroupMeta: Record<UnifiedSiteGroupKey, { title: string; description: string; color: string }> = {
  disabled: {
    title: '已禁用',
    description: '站点已添加但当前不可用，暂不按 Cookie 状态分组',
    color: 'red',
  },
  databaseWithLocalCookie: {
    title: '已添加 · 本地有 Cookie',
    description: '可更新后台 Cookie，也可复制当前浏览器 Cookie',
    color: 'green',
  },
  databaseWithoutLocalCookie: {
    title: '已添加 · 本地无 Cookie',
    description: '可将后台保存的 Cookie 写入当前浏览器',
    color: 'blue',
  },
  unadded: {
    title: '未添加',
    description: '支持但数据库中没有站点记录，不再按 Cookie 状态拆分',
    color: 'orange',
  },
}

const unifiedGroupOrder: UnifiedSiteGroupKey[] = [
  'databaseWithLocalCookie',
  'databaseWithoutLocalCookie',
  'unadded',
  'disabled',
]

const getSupportSiteUrlHost = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

const getUrlHostname = (url: string | null | undefined) => {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const hasLocalCookie = (cookie: string | null | undefined) => Boolean(cookie && cookie.trim().length > 0)

type SiteOperation = 'syncSingleSite' | 'refreshSite' | 'signSite' | 'writeSiteCookies'

const isOperationLoading = (key: string) => Boolean(operationLoadingMap.value[key]);
const setOperationLoading = (key: string, loading: boolean) => {
  operationLoadingMap.value = {
    ...operationLoadingMap.value,
    [key]: loading,
  };
}
const clearOperationLoading = (key: string) => {
  const {[key]: _removed, ...rest} = operationLoadingMap.value;
  operationLoadingMap.value = rest;
}
const setOperationText = (key: string, text: string) => {
  operationTextMap.value = {
    ...operationTextMap.value,
    [key]: text,
  };
}
const clearOperationText = (key: string) => {
  const {[key]: _removed, ...rest} = operationTextMap.value;
  operationTextMap.value = rest;
}
const siteOperationKey = (operation: SiteOperation, site: MySite) => `${operation}:${site.id || site.site}`;
const isSiteOperationLoading = (operation: SiteOperation, site: MySite) => isOperationLoading(siteOperationKey(operation, site));

const showOperationMessage = (key: string, text: string, style?: Record<string, string>) => {
  setOperationText(key, text);
  message.loading({
    key,
    content: () => operationTextMap.value[key] || text,
    duration: 0,
    type: 'warning',
    style,
  });
}

const runWithLoading = async (
    key: string,
    task: () => Promise<void>,
    options: {
      text?: string;
      delay?: number;
      style?: Record<string, string>;
      clearShowText?: boolean;
    } = {},
) => {
  if (isOperationLoading(key)) {
    message.warning('当前操作正在进行，请稍后再试！');
    return;
  }
  setOperationLoading(key, true);
  if (options.text) {
    showOperationMessage(key, options.text, options.style);
  }
  try {
    await task();
    if (options.text && showText.value.length > 0) {
      setOperationText(key, showText.value);
    }
    if (options.delay) {
      await sleep(options.delay);
    }
  } catch (error) {
    console.error(error);
    message.error('操作执行失败，请查看控制台错误信息');
  } finally {
    if (options.text) {
      message.destroy(key);
      clearOperationText(key);
    }
    clearOperationLoading(key);
    if (options.clearShowText !== false && !syncMode.value && !importCookieMode.value) {
      showText.value = ''
    }
  }
}

const sortKeyList = {
  mail: '消息通知',
  downloaded: '下载量',
  uploaded: '上传量',
  my_bonus: '魔力值',
  my_score: '做种积分',
  leech: '正在下载',
  seed: '正在做种',
  invitation: '邀请数量',
  seed_volume: '做种体积',
  updated_at: '更新时间',
}

const filterKeyList = {
  null: '全部',
  alive: '站点存活',
  mail: '消息通知',
  signIn: '未签到',
  downloaded: '无下载量',
  uploaded: '无上传量',
  my_bonus: '无魔力值',
  my_score: '无做种积分',
  leech: '正在下载',
  seed: '无做种数',
  invitation: '有邀请',
  seed_volume: '无做种量',
  bonus_hour: '时魔异常',
  ratio: '分享率异常',
}
const doFilter = (value: string | null = null) => {
  switch (value) {
    case null:
      break;
    case 'alive':
      showMySiteList.value = showMySiteList.value.filter(site => site.available)
      break;
    case 'mail':
    case 'notice':
      showMySiteList.value = showMySiteList.value.filter(site => (site.mail + site.notice) > 0)
      break;
    case 'downloaded':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.downloaded || 0) <= 0)
      break;
    case 'uploaded':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.uploaded || 0) <= 0)
      break;
    case 'my_bonus':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.my_bonus || 0) <= 0)
      break;
    case 'my_score':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.my_score || 0) <= 0)
      break;
    case 'seed':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.seed || 0) <= 0)
      break;
    case 'leech':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.leech || 0) > 0)
      break;
    case 'invitation':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.invitation || 0) > 0)
      break;
    case 'signIn':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => site.available && site.sign_in && site.sign_info == null)
      break;
    case 'seed_volume':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.seed_volume || 0) > 0)
      break;
    case 'bonus_hour':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.bonus_hour || 0) <= 0)
      break;
    case 'ratio':
      // @ts-ignore
      showMySiteList.value = showMySiteList.value.filter(site => (site.status?.ratio || 0) < 1)
      break;
  }
}
const onSearch = () => {
  showMySiteList.value = Object.values(mySiteList.value!).filter(
      (site) => site.nickname.toLowerCase().includes(searchKey.value.trim().toLowerCase()) ||
          site.site.toLowerCase().includes(searchKey.value.trim().toLowerCase()) ||
          site.mirror?.toLowerCase().includes(searchKey.value.trim().toLowerCase())
  )
  if (filterKey.value.length > 0) {
    doFilter(filterKey.value)
  }
  doSort(sortKey.value)
}
const handleReverse = () => {
  reverseMode.value = !reverseMode.value;
  onSearch()
}

type StatusSortKey = keyof Pick<StatusInfo,
    'downloaded'
    | 'uploaded'
    | 'my_bonus'
    | 'my_score'
    | 'seed'
    | 'leech'
    | 'invitation'
    | 'seed_volume'
    | 'updated_at'
    | 'bonus_hour'
    | 'ratio'
>

const getStatusSortValue = (site: MySite, key: StatusSortKey) => {
  const status = site.status as Partial<StatusInfo> | null | undefined
  const value = status?.[key]
  if (value === null || value === undefined || value === '') {
    return 0
  }
  if (key === 'updated_at') {
    const timestamp = Date.parse(String(value))
    return Number.isNaN(timestamp) ? 0 : timestamp
  }
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

const getSiteStatus = (site: MySite) => {
  return (site.status || {}) as Partial<StatusInfo>
}

const getSiteStatusNumber = (site: MySite, key: StatusSortKey | 'published') => {
  const value = getSiteStatus(site)[key as keyof StatusInfo]
  const numericValue = Number(value ?? 0)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

const getSiteLevel = (site: MySite) => {
  return String(getSiteStatus(site).my_level || 'User').replace(/\s/g, '')
}

const getSiteUpdatedAt = (site: MySite) => {
  return String(getSiteStatus(site).updated_at || '-').slice(0, 19)
}

const getSignUpdatedAt = (site: MySite) => {
  const signInfo = site.sign_info as { updated_at?: string; time?: string } | null
  return String(signInfo?.updated_at || signInfo?.time || '-').slice(0, 19)
}

const doSort = (value: string = '') => {
  switch (value) {
    case 'mail':
    case 'notice':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.mail + b.notice - (a.mail + a.notice))
      break;
    case 'downloaded':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'downloaded') - getStatusSortValue(a, 'downloaded'))
      break;
    case 'uploaded':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'uploaded') - getStatusSortValue(a, 'uploaded'))
      break;
    case 'my_bonus':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'my_bonus') - getStatusSortValue(a, 'my_bonus'))
      break;
    case 'my_score':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'my_score') - getStatusSortValue(a, 'my_score'))
      break;
    case 'seed':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'seed') - getStatusSortValue(a, 'seed'))
      break;
    case 'leech':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'leech') - getStatusSortValue(a, 'leech'))
      break;
    case 'invitation':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'invitation') - getStatusSortValue(a, 'invitation'))
      break;
    case 'seed_volume':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'seed_volume') - getStatusSortValue(a, 'seed_volume'))
      break;
    case 'updated_at':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'updated_at') - getStatusSortValue(a, 'updated_at'))
      break;
    case 'bonus_hour':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'bonus_hour') - getStatusSortValue(a, 'bonus_hour'))
      break;
    case 'ratio':
      showMySiteList.value = showMySiteList.value.sort((a, b) => getStatusSortValue(b, 'ratio') - getStatusSortValue(a, 'ratio'))
      break;
  }
  if (reverseMode.value) {
    showMySiteList.value = [...(showMySiteList.value || [])].reverse()
  }
}

const getCookieByUrls = (urls: Array<string | null | undefined>) => {
  const cookieMap = cookieInfoMap.value || {};
  const exactUrlCookie = urls
      .filter(Boolean)
      .map(url => cookieMap[url as string] || '')
      .find(hasLocalCookie);
  if (exactUrlCookie) {
    return exactUrlCookie;
  }
  const hosts = urls.map(getUrlHostname).filter(Boolean);
  const matchedEntry = Object.entries(cookieMap).find(([url, cookie]) => hasLocalCookie(cookie) && hosts.includes(getUrlHostname(url)));
  return matchedEntry?.[1] || '';
}

const getCardGroup = (mySite: MySite | undefined, localCookie: string): UnifiedSiteGroupKey => {
  if (mySite && !mySite.available) {
    return 'disabled'
  }
  if (mySite && hasLocalCookie(localCookie)) {
    return 'databaseWithLocalCookie'
  }
  if (mySite) {
    return 'databaseWithoutLocalCookie'
  }
  return 'unadded'
}

const matchesUnifiedFilter = (card: UnifiedSiteCard) => {
  if (!filterKey.value || filterKey.value === 'null' || !card.mySite) {
    return true
  }
  const site = card.mySite
  switch (filterKey.value) {
    case 'alive':
      return site.available
    case 'mail':
    case 'notice':
      return (site.mail + site.notice) > 0
    case 'downloaded':
      return getStatusSortValue(site, 'downloaded') <= 0
    case 'uploaded':
      return getStatusSortValue(site, 'uploaded') <= 0
    case 'my_bonus':
      return getStatusSortValue(site, 'my_bonus') <= 0
    case 'my_score':
      return getStatusSortValue(site, 'my_score') <= 0
    case 'seed':
      return getStatusSortValue(site, 'seed') <= 0
    case 'leech':
      return getStatusSortValue(site, 'leech') > 0
    case 'invitation':
      return getStatusSortValue(site, 'invitation') > 0
    case 'signIn':
      return site.available && site.sign_in && site.sign_info == null
    case 'seed_volume':
      return getStatusSortValue(site, 'seed_volume') > 0
    case 'bonus_hour':
      return getStatusSortValue(site, 'bonus_hour') <= 0
    case 'ratio':
      return getStatusSortValue(site, 'ratio') < 1
    default:
      return true
  }
}

const getUnifiedSortValue = (card: UnifiedSiteCard) => {
  const site = card.mySite
  if (!site) {
    return 0
  }
  switch (sortKey.value) {
    case 'mail':
    case 'notice':
      return site.mail + site.notice
    case 'downloaded':
    case 'uploaded':
    case 'my_bonus':
    case 'my_score':
    case 'seed':
    case 'leech':
    case 'invitation':
    case 'seed_volume':
    case 'updated_at':
    case 'bonus_hour':
    case 'ratio':
      return getStatusSortValue(site, sortKey.value)
    default:
      return 0
  }
}

const unifiedSiteCards = computed<UnifiedSiteCard[]>(() => {
  const siteMap = webSiteList.value || {};
  const databaseSiteMap = new Map(mySites.value.map(site => [site.site, site]));
  const cards: UnifiedSiteCard[] = Object.values(siteMap).map((site) => {
    const mySite = databaseSiteMap.get(site.name);
    const urls = mySite?.mirror ? [mySite.mirror, ...site.url] : site.url;
    const localCookie = getCookieByUrls(urls);
    return {
      key: `support:${site.name}`,
      group: getCardGroup(mySite, localCookie),
      siteName: site.name,
      displayName: mySite?.nickname || site.nickname || site.name,
      primaryUrl: mySite?.mirror || site.url[0],
      urls,
      localCookie,
      mySite,
      webSite: site,
    }
  })

  mySites.value
      .filter(site => !siteMap[site.site])
      .forEach((site) => {
        const urls = site.mirror ? [site.mirror] : [];
        const localCookie = getCookieByUrls(urls);
        cards.push({
          key: `database:${site.id || site.site}`,
          group: getCardGroup(site, localCookie),
          siteName: site.site,
          displayName: site.nickname || site.site,
          primaryUrl: site.mirror || '',
          urls,
          localCookie,
          mySite: site,
        })
      })

  const keyword = searchKey.value.trim().toLowerCase();
  return cards
      .filter((card) => {
        if (!keyword) {
          return true
        }
        return [
          card.siteName,
          card.displayName,
          card.primaryUrl,
          ...card.urls,
        ].some(item => item?.toLowerCase().includes(keyword))
      })
      .filter(matchesUnifiedFilter)
})

const unifiedSiteGroups = computed(() => {
  return unifiedGroupOrder.map((key) => {
    const items = unifiedSiteCards.value
        .filter(card => card.group === key)
        .sort((a, b) => {
          const valueDiff = getUnifiedSortValue(b) - getUnifiedSortValue(a)
          if (valueDiff !== 0) {
            return valueDiff
          }
          return a.displayName.localeCompare(b.displayName)
        })
    return {
      key,
      ...unifiedGroupMeta[key],
      items: reverseMode.value ? [...items].reverse() : items,
    }
  }).filter(group => group.items.length > 0)
})

const unifiedSiteStats = computed(() => ({
  disabled: unifiedSiteCards.value.filter(card => card.group === 'disabled').length,
  localCookie: unifiedSiteCards.value.filter(card => card.group === 'databaseWithLocalCookie').length,
  writeable: unifiedSiteCards.value.filter(card => card.group === 'databaseWithoutLocalCookie').length,
  unadded: unifiedSiteCards.value.filter(card => card.group === 'unadded').length,
}))

const handleSortList: MenuProps['onClick'] = key => {
  console.log(key)
  if (key.key === 'asc' || key.key === 'desc') {
    reverseMode.value = key.key === 'desc';
    return
  }
  // @ts-ignore
  sortKey.value = key.key;
  onSearch()
}
const handleFilterList: MenuProps['onClick'] = key => {
  console.log(key)
  // @ts-ignore
  filterKey.value = key.key;
  onSearch()
}
// 响应式表单最大宽度
const formMaxWidth = computed(() => {
  return window.innerWidth < 350 ? '90%' : '350px';
});
const switchShowSiteList = async () => {
  if (showMySiteList.value.length < 0) {
    message.warning('正在加载数据或无站点数据')
    return
  }
  console.log('switchShowSiteList', showMySiteList.value.length)
  console.log(mySiteList.value)
  showSiteList.value = !showSiteList.value;
  localStorage.setItem('local:showSiteList', JSON.stringify(showSiteList.value));
}
const switchPrivateMode = () => {
  privateMode.value = !privateMode.value;
  localStorage.setItem('local:privateMode', JSON.stringify(privateMode.value));
}
const oneKeySync = async () => {
  await runWithLoading('oneKeySync', autoSyncCookie, {
    text: '开始同步站点 Cookie 到收割机',
    delay: 3000,
  })
}
const oneKeySignIn = async () => {
  await runWithLoading('oneKeySignIn', async () => {
    const toSignList = Object.values(mySiteList.value!).filter(site => site.available && site.sign_in && site.sign_info == null)
    await autoSignAll(toSignList)
  }, {
    text: '正在批量打开未签到站点',
    delay: 3000,
  })
}
const oneKeyOpenInTab = async () => {
  await runWithLoading('oneKeyOpenInTab', async () => {
    await autoOpenAll(showMySiteList.value)
  }, {
    text: '正在批量打开站点',
    delay: 3000,
  })
}
const oneKeyImportCookies = async () => {
  await runWithLoading('oneKeyImportCookies', autoImportCookie, {
    text: '开始导入站点 Cookie 到浏览器',
    delay: 3000,
  })
}
onMounted(async () => {
  console.log("打开弹出页面！:")
  const res = await getSetting()
  console.log(setting.value)
  if (!res.succeed) {
    message.warning('服务器信息加载失败，请先配置服务器信息...');
    return
  }

  await loginServer();
});
const fetchAllSupportCookies = async () => {
  let urlList = [
    ...Object.values(webSiteList.value || {}).map(item => item.url).flat(),
    ...Object.values(mySiteList.value || {}).map(item => item.mirror).filter((url): url is string => Boolean(url)),
  ];
  urlList = Array.from(new Set(urlList));
  const tasks = urlList.map(async (url) => {
    try {
      // 1. 安全解析 URL 获取 hostname
      const host = new URL(url).hostname;

      // 2. 异步获取 cookie
      const cookie = await getCookieString(host);

      // 3. 返回 [key, value] 对，用于 Object.fromEntries
      if (cookie.succeed) {
        return [url, cookie.data || ''] as const;
      }
    } catch (error) {
      console.warn(`Failed to get cookie for URL: ${url}`, error);
    }
    return [url, ''] as const; // 出错时返回空字符串
  });

  // 等待所有请求完成
  const entries = await Promise.all(tasks);

  // 转为对象 { url: cookie }
  cookieInfoMap.value = Object.fromEntries(entries);

  console.log(cookieInfoMap.value)
}
const initData = async () => {
  await cacheServerData()
  hadList.value = Object.values(mySiteList.value!).map(site => site.site)
  console.log('hadList:', hadList.value)
  await fetchAllSupportCookies()
  await nextTick(async () => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    showMySiteList.value = Object.values(mySiteList.value!)
    showSiteList.value = JSON.parse(localStorage.getItem('switchShowSiteList') || 'true');
    privateMode.value = JSON.parse(localStorage.getItem('privateMode') || 'true');
    onSearch()
  })
}
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
})
const onCollapse = (collapse: boolean) => {
  collapsed.value = collapse;
}
const checkScreenSize = () => {
  collapsed.value = window.innerWidth < 768;
}
const syncSingleSite = async (site: MySite) => {
  const key = siteOperationKey('syncSingleSite', site);
  await runWithLoading(key, async () => {
    await syncSingleSiteCookie(site)
  }, {
    text: `正在抓取站点 ${site.nickname || site.site} Cookie信息...`,
    delay: 3000,
  })
}

const refreshSite = async (site: MySite) => {
  const key = siteOperationKey('refreshSite', site);
  await runWithLoading(key, async () => {
    const res = await refreshSingleSite(site)
    if (res.succeed) {
      await cacheServerData()
      onSearch()
    }
  }, {
    text: `正在获取站点 ${site.nickname || site.site}最新数据...`,
    delay: 2000,
    style: {
      maxWidth: '360px',
      margin: 'auto',
      left: '40vw',
      top: '40px',
    },
  })
}
const signSite = async (site: MySite) => {
  const key = siteOperationKey('signSite', site);
  await runWithLoading(key, async () => {
    const res = await signSingleSite(site)
    if (res.succeed) {
      await cacheServerData()
      onSearch()
    }
  }, {
    text: `正在签到站点 ${site.nickname || site.site}...`,
    delay: 3000,
  })
}
const writeSiteCookies = async (site: MySite) => {
  const key = siteOperationKey('writeSiteCookies', site);
  await runWithLoading(key, async () => {
    await writeSingleSiteCookies(site)
  }, {
    text: `正在写入 ${site.nickname || site.site} 站点Cookie...`,
    delay: 1000,
  })
}
const copyLocalCookie = (cookie: string) => {
  if (!hasLocalCookie(cookie)) {
    message.warning('本地暂无 Cookie 可复制')
    return
  }
  copy(cookie)
  message.success('已复制本地 Cookie')
}
const supportSiteOperationKey = (operation: 'addSupportSite', site: WebSite) => `${operation}:${site.name}`;
const addSupportSite = async (site: WebSite) => {
  const key = supportSiteOperationKey('addSupportSite', site);
  await runWithLoading(key, async () => {
    const opened = await addSingleSite(site)
    if (opened) {
      message.success(`已打开 ${site.nickname || site.name} 添加页面`)
    } else {
      message.warning(`${site.nickname || site.name} 没有可用于添加的有效 Cookie`)
    }
  }, {
    text: `正在打开 ${site.nickname || site.name} 添加页面`,
    delay: 500,
  })
}
const calcBadge = (mySite: MySite) => {
  if (!mySite.available) {
    return 'red'
  }
  if (mySite.status != null) {
    // @ts-ignore
    const past = new Date(mySite.status?.updated_at!).getTime();
    const now = Date.now();
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 10) {
      return 'Coral'
    }
  }
  return 'green'
}
const updateSetting = async () => {
  await runWithLoading('updateSetting', async () => {
    await saveSetting()
    window.location.reload()
  })
}
const loginServer = async () => {
  await runWithLoading('loginServer', async () => {
    await testServer()
    await initData()
  })
}
const refreshCache = async () => {
  await runWithLoading('cacheServerData', async () => {
    await cacheServerData()
  })
}
const handleAutoAddSites = async () => {
  await runWithLoading('autoAddSites', autoAddSites)
}
const handleAutoClearSitesHarvestInfo = async () => {
  await runWithLoading('autoClearSitesHarvestInfo', autoClearSitesHarvestInfo)
}
const openHarvester = () => {
  window.open(setting.value.baseUrl, '_blank')
}
</script>

<template>
  <a-layout class="operate-page">
    <a-layout-sider
        :collapsed="collapsed"
        :collapsible="true"
        :width="canSave ? 220 : '100%'"
        :zeroWidthTriggerStyle="{
          bottom: 0,
          backgroundColor: 'transparent !important',
          color: '#fde3cf',
        }"
        collapsedWidth="0"
        class="app-sider" @collapse="onCollapse">
      <template #trigger>
        <menu-unfold-outlined v-if="collapsed"/>
        <menu-fold-outlined v-else/>
      </template>
      <a-layout-header class="custom-header">
        <a-avatar :size="24" alt="H" src="icon/128.png" style="color: #f56a00; background-color: #fde3cf">
        </a-avatar>
        <a-divider dashed type="vertical"></a-divider>
        <a-typography-title :level="4" class="title">
          收割机助手
        </a-typography-title>

      </a-layout-header>
      <a-space direction="vertical">
        <a-space class="alert-content" direction="vertical">
          <a-alert
              v-if="syncMode || importCookieMode"
              :description="showText"
              type="info"
          />
          <a-alert
              v-if="syncMode"
              :description="`正在向收割机同步站点 Cookie ${count}/${Object.values(mySiteList!).filter((site) => site.available && site.nickname.includes(searchKey)).length}`"
              type="success"
          />
          <a-alert
              v-if="importCookieMode"
              :description="`正在向浏览器导入站点 Cookie ${count}/${Object.values(mySiteList!).filter((site) => site.available && site.nickname.includes(searchKey)).length}`"
              type="success"
          />
        </a-space>
        <a-space align="center" direction="vertical" style="margin-top: 16px;">
          <a-space v-if="!canSave" size="small">
            <a-form
                :style="{ maxWidth: formMaxWidth }"
                class="form-container"
                layout="vertical"

            >
              <a-form-item>
                <a-input
                    v-model:value="setting.baseUrl"
                    placeholder="Harvest服务器地址"
                />
              </a-form-item>

              <a-form-item>
                <a-input-password
                    v-model:value.lazy="setting.token"
                    autofocus
                    label="Token"
                    placeholder="安全Token"
                />
              </a-form-item>
              <!--              <a-form-item-->
              <!--                  :wrapper-col="{ span: 24 }"-->
              <!--              >-->
              <!--                <a-input-->
              <!--                    v-model:value.lazy="setting.imgUrl"-->
              <!--                    autofocus-->
              <!--                    label="图片地址"-->
              <!--                    placeholder="图片地址"-->
              <!--                    style="width: 100%"-->
              <!--                />-->
              <!--              </a-form-item>-->
            </a-form>
          </a-space>
          <a-space>
            <a-button v-if="!canSave" :loading="isOperationLoading('loginServer')" block ghost type="primary"
                      @click="loginServer">
              登录鉴权
            </a-button>

          </a-space>
          <a-space v-if="canSave" class="side-actions" direction="vertical">
            <a-button block type="primary" @click="openHarvester">
              <template #icon>
                <ThunderboltOutlined/>
              </template>
              打开收割机
            </a-button>
            <a-popover title="一键打开站点列表">
              <template #content>
                <div style="max-width: 200px;">
                  一键打开当前站点列表的所有站点，确认后除关闭浏览器或或执行完毕，无法中止，当站点数量较多时，浏览器会卡顿
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定打开当前站点列表的所有站点吗？"
                  @confirm="oneKeyOpenInTab"
              >
                <a-button :loading="isOperationLoading('oneKeyOpenInTab')" block type="primary">
                  一键打开
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-button
                block
                type="primary"
                @click="switchShowSiteList"
            >
              <span>切换页面</span>
            </a-button>
            <a-button
                v-if="showSiteList"
                :danger="!privateMode"
                block
                type="primary"
                @click="switchPrivateMode"
            >
              <span v-if="privateMode">隐私模式</span>
              <span v-else>公开模式</span>
            </a-button>
            <a-popover title="缓存服务器数据">
              <template #content>
                <div style="max-width: 200px;">
                  从收割机服务器拉取站点配置列表，已有站点列表，下载器列表，缓存到本地，减少交互，提高效率
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定要强制更新本地缓存？"
                  @confirm="refreshCache"
              >
                <a-button
                    :loading="isOperationLoading('cacheServerData')"
                    block
                    type="primary"
                >
                  更新缓存
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover title="一键导入Cookie">
              <template #content>
                <div style="max-width: 200px;">
                  一键同步已添加站点的 Cookie 信息，此功能仅同步 Cookie 和 UserAgent
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定将同步PT站点Cookie到收割机吗？"
                  @confirm="oneKeySync"
              >
                <a-button :loading="isOperationLoading('oneKeySync')" block type="primary">
                  一键同步
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover title="一键打开未签到站点">
              <template #content>
                <div style="max-width: 200px;">
                  一键打开未签到站点
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定批量打开未签到站点吗？"
                  @confirm="oneKeySignIn"
              >
                <a-button :loading="isOperationLoading('oneKeySignIn')" block type="primary">
                  一键签到
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover title="一键导入Cookie">
              <template #content>
                <div style="max-width: 200px;">
                  <p>
                    将收割机保存的站点 Cookie 写入到浏览器，可以用于新电脑或者新安装浏览器。
                  </p>
                  <p>
                    恭喜你，再也不需要所有的站点都重新登录一遍啦！
                  </p>
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定将写入PT站点Cookie到浏览器吗？"
                  @confirm="oneKeyImportCookies"
              >
                <a-button :loading="isOperationLoading('oneKeyImportCookies')" block type="primary">
                  一键写入
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover title="一键添加站点">
              <template #content>
                <div style="max-width: 200px;">
                  筛选未添加的站点列表，只打开存在有效登录 Cookie 的站点控制面板。添加成功的页面会自动关闭，未抓取到相关信息的页面会保留以便手动处理。
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定执行批量添加站点功能吗？"
                  @confirm="handleAutoAddSites"
              >
                <a-button :loading="isOperationLoading('autoAddSites')" block ghost type="primary">
                  一键添加
                </a-button>
              </a-popconfirm>
            </a-popover>

            <a-popover title="清理单站收割机缓存">
              <template #content>
                <p style="max-width: 200px;">
                  清理单站收割机缓存会挨个打开站点所有 url，并从本地存储删除收割机站点 ID 和站点配置文件缓存
                </p>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  title="确定将清理 PT 站点中收割机相关缓存吗？？"
                  @confirm="handleAutoClearSitesHarvestInfo"
              >
                <a-button :loading="isOperationLoading('autoClearSitesHarvestInfo')"
                          block
                          danger
                          ghost
                          type="primary">
                  <span>清理缓存:慎用</span>
                </a-button>
              </a-popconfirm>
            </a-popover>
            <div class="server-setting-card">
              <div class="server-setting-header">
                <span>服务器信息</span>
                <a-tag color="green">已连接</a-tag>
              </div>
              <a-input
                  v-model:value="setting.baseUrl"
                  placeholder="Harvest服务器地址"
              />

              <a-input-password
                  v-model:value.lazy="setting.token"
                  autofocus
                  label="Token"
                  placeholder="安全Token"
              />

              <div class="float-image-setting">
                <div class="float-image-preview">
                  <a-avatar :fallback="`${setting.baseUrl}favicon.ico`"
                            :size="setting.imgSize"
                            :src="`${setting.imgUrl ? setting.imgUrl : `${setting.baseUrl}favicon.ico`}`"
                  />
                </div>
                <div class="float-image-controls">
                  <div class="float-image-title">悬浮窗图片</div>
                  <a-slider v-model:value="setting.imgSize" :max="100" :min="36" @after-change="saveSetting"/>
                </div>
              </div>

              <a-input
                  v-model:value.lazy="setting.imgUrl"
                  autofocus
                  label="图片地址"
                  placeholder="图片地址或随机图片 API"
                  style="width: 100%"
              />

              <a-popover title="更新服务器信息">
                <template #content>
                  <p style="max-width: 200px;">
                    这里可以更新收割机服务器地址、认证 Token 和站点页面悬浮窗口显示图片。修改图片大小无需点击更新。
                  </p>
                </template>
                <a-popconfirm
                    cancel-text="取消"
                    ok-text="确定"
                    title="确定更新服务器信息吗？？"
                    @confirm="updateSetting"
                >
                  <a-button :loading="isOperationLoading('updateSetting')"
                            block
                            danger
                            ghost
                            type="primary">
                    <span>更新服务器信息</span>
                  </a-button>
                </a-popconfirm>
              </a-popover>
            </div>

          </a-space>
        </a-space>
      </a-space>
    </a-layout-sider>
    <a-layout v-if="canSave" class="main-layout">
      <a-layout-header class="custom-header toolbar-header">
        <a-row class="toolbar-row" justify="end" type="flex">
          <a-col></a-col>
          <a-col class="toolbar-actions">
            <a-dropdown>
              <template #overlay>
                <a-menu @click="handleSortList">
                  <a-menu-item v-for="(key,value) in sortKeyList" :key="value" style="font-size: 12px;">{{ key }}
                  </a-menu-item>
                  <a-menu-divider/>
                  <a-menu-item key="asc" style="font-size: 12px;">
                    <sort-ascending-outlined/>
                    正序
                  </a-menu-item>
                  <a-menu-item key="desc" style="font-size: 12px;">
                    <sort-descending-outlined/>
                    倒序
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="text">
                <sort-descending-outlined v-if="reverseMode" style="color: floralwhite;"/>
                <sort-ascending-outlined v-else style="color: floralwhite;"/>
                <span style="color: floralwhite;font-size: 12px;">{{
                    // @ts-ignore
                    sortKeyList[sortKey]
                  }} · {{ reverseMode ? '倒序' : '正序' }}</span>
              </a-button>
            </a-dropdown>
            <a-dropdown>
              <template #overlay>
                <a-menu @click="handleFilterList">
                  <a-menu-item v-for="(key,value) in filterKeyList" :key="value" style="font-size: 12px;">{{ key }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="text">
                <filter-outlined style="color: floralwhite;"/>
                <span style="color: floralwhite;font-size: 12px;">{{
                    // @ts-ignore
                    filterKeyList[filterKey] || ''
                  }}</span>
              </a-button>
            </a-dropdown>
            <a-input
                v-model:value="searchKey" :bordered="false"
                :loading="searchKey.length > 0"
                allow-clear
                class="custom-input-search"
                placeholder="站点快速搜索"
                @change="onSearch"
            >
              <template #addonAfter></template>
            </a-input>
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content class="content">
        <div v-if="showSiteList" class="site-panel unified-panel">
          <div class="stats-grid">
            <div class="stat-item danger">
              <span class="stat-label">已禁用</span>
              <strong>{{ unifiedSiteStats.disabled }}</strong>
            </div>
            <div class="stat-item success">
              <span class="stat-label">本地 Cookie</span>
              <strong>{{ unifiedSiteStats.localCookie }}</strong>
            </div>
            <div class="stat-item primary">
              <span class="stat-label">可写入</span>
              <strong>{{ unifiedSiteStats.writeable }}</strong>
            </div>
            <div class="stat-item warning">
              <span class="stat-label">未添加</span>
              <strong>{{ unifiedSiteStats.unadded }}</strong>
            </div>
          </div>

          <section v-for="group in unifiedSiteGroups" :key="group.key" class="unified-group">
            <div class="unified-group-header">
              <div>
                <h3>{{ group.title }}</h3>
                <p>{{ group.description }}</p>
              </div>
              <a-tag :color="group.color">{{ group.items.length }}</a-tag>
            </div>

            <a-row :gutter="[12,12]" class="site-grid" type="flex">
              <a-col
                  v-for="card in group.items"
                  :key="card.key"
                  class="site-col"
                  :lg="8" :md="12"
                  :sm="24"
                  :xl="6">
                <a-badge-ribbon
                    :color="card.mySite ? calcBadge(card.mySite) : group.color"
                    :placement="card.mySite?.available === false ? 'end' : 'start'"
                    :text="card.mySite?.available === false ? '站点已禁用' : ''">
                  <a-card class="site-card support-site-card unified-site-card" hoverable size="small">
                    <template #extra>
                      <a-tag v-if="card.group === 'disabled'" color="red">已禁用</a-tag>
                      <a-tag v-else-if="hasLocalCookie(card.localCookie)" color="green">本地 Cookie</a-tag>
                      <a-button
                          v-else-if="card.group === 'databaseWithoutLocalCookie' && card.mySite"
                          :loading="isSiteOperationLoading('writeSiteCookies', card.mySite)"
                          ghost
                          size="small"
                          type="primary"
                          @click="writeSiteCookies(card.mySite)">
                        <template #icon>
                          <DownloadOutlined/>
                        </template>
                        写入
                      </a-button>
                      <a-tag v-else-if="card.group === 'unadded'" color="orange">未添加</a-tag>
                    </template>

                    <template #title>
                      <a-avatar
                          v-if="!privateMode && card.webSite"
                          class="support-site-logo"
                          :size="22"
                          :src="`${card.primaryUrl}/${card.webSite.logo}`"/>
                      <a-button class="site-title-link" :href="card.primaryUrl" target="_blank" type="link">
                        <a-tooltip>
                          <template #title>{{ card.displayName }}</template>
                          <span v-text="`${card.displayName[0]?.toUpperCase() || ''}${privateMode ? '*' : card.displayName.slice(1)}`"></span>
                        </a-tooltip>
                      </a-button>
                      <span v-if="card.mySite" class="site-level">
                        {{ getSiteLevel(card.mySite) }}
                      </span>
                    </template>

                    <template #actions>
                      <div class="site-action-bar">
                        <template v-if="card.group === 'disabled'">
                          <a-tag color="red">已禁用</a-tag>
                        </template>

                        <template v-else>
                          <template v-if="card.mySite">
                            <a-tooltip>
                              <template #title>刷新站点数据</template>
                              <a-button
                                  :loading="isSiteOperationLoading('refreshSite', card.mySite)"
                                  ghost
                                  size="small"
                                  type="primary"
                                  @click="refreshSite(card.mySite)">
                                <template #icon>
                                  <FormatPainterOutlined/>
                                </template>
                                刷新
                              </a-button>
                            </a-tooltip>
                            <a-tooltip v-if="card.mySite.sign_in">
                              <template v-if="card.mySite.sign_info == null" #title>签到</template>
                              <template v-else #title>
                                <div style="font-size: 11px;">
                                  {{ card.mySite.sign_info?.info }}
                                  <br/>
                                  签到时间：{{ getSignUpdatedAt(card.mySite) }}
                                </div>
                              </template>
                              <a-button
                                  v-if="card.mySite.sign_info == null"
                                  :loading="isSiteOperationLoading('signSite', card.mySite)"
                                  ghost
                                  size="small"
                                  type="primary"
                                  @click="signSite(card.mySite)">
                                <template #icon>
                                  <EditOutlined/>
                                </template>
                                签到
                              </a-button>
                              <a-button v-else disabled ghost size="small" type="primary">
                                <template #icon>
                                  <CheckCircleOutlined/>
                                </template>
                                已签
                              </a-button>
                            </a-tooltip>
                            <a-button
                                :loading="isSiteOperationLoading('syncSingleSite', card.mySite)"
                                ghost
                                size="small"
                                type="primary"
                                @click="syncSingleSite(card.mySite)">
                              <template #icon>
                                <SyncOutlined/>
                              </template>
                              同步
                            </a-button>
                          </template>
                          <template v-if="card.group === 'unadded' && card.webSite">
                            <a-button
                                :loading="isOperationLoading(supportSiteOperationKey('addSupportSite', card.webSite))"
                                ghost
                                size="small"
                                type="primary"
                                @click="addSupportSite(card.webSite)">
                              <template #icon>
                                <UserAddOutlined/>
                              </template>
                              添加
                            </a-button>
                          </template>
                          <a-tooltip v-if="hasLocalCookie(card.localCookie)">
                            <template #title>
                              <a-typography-paragraph :content="`本地 Cookie：${card.localCookie}`" ellipsis>
                              </a-typography-paragraph>
                            </template>
                            <a-button ghost size="small" type="primary" @click="copyLocalCookie(card.localCookie)">
                              <template #icon>
                                <CopyOutlined/>
                              </template>
                              复制
                            </a-button>
                          </a-tooltip>
                        </template>
                      </div>
                    </template>

                    <a-card-meta>
                      <template #description>
                        <template v-if="card.mySite">
                          <a-row class="site-data" :gutter="[4,4]">
                            <a-col :span="10">
                              <arrow-up-outlined/>
                              {{ getSiteStatusNumber(card.mySite, 'seed') }}
                            </a-col>
                            <a-col :span="7">
                              <arrow-down-outlined/>
                              {{ getSiteStatusNumber(card.mySite, 'leech') }}
                            </a-col>
                            <a-col :span="7">
                              <share-alt-outlined/>
                              {{ numberFormat(getSiteStatusNumber(card.mySite, 'downloaded') ? Number((getSiteStatusNumber(card.mySite, 'uploaded') / getSiteStatusNumber(card.mySite, 'downloaded')).toFixed()) : 0) }}
                              [{{ getSiteStatusNumber(card.mySite, 'published') }}]
                            </a-col>
                            <a-col :span="10">
                              <cloud-upload-outlined/>
                              {{ prettyBytes(getSiteStatusNumber(card.mySite, 'uploaded')) }}
                            </a-col>
                            <a-col :span="7">
                              <cloud-download-outlined/>
                              {{ prettyBytes(getSiteStatusNumber(card.mySite, 'downloaded')) }}
                            </a-col>
                            <a-col :span="7">
                              <cloud-sync-outlined/>
                              {{ prettyBytes(getSiteStatusNumber(card.mySite, 'seed_volume')) }}
                            </a-col>
                            <a-col :span="10">
                              <bar-chart-outlined/>
                              {{ numberFormat(getSiteStatusNumber(card.mySite, 'my_bonus')) }}
                            </a-col>
                            <a-col :span="7">
                              <area-chart-outlined/>
                              {{ numberFormat(getSiteStatusNumber(card.mySite, 'my_score')) }}
                            </a-col>
                            <a-col :span="7">
                              <field-time-outlined/>
                              {{ numberFormat(getSiteStatusNumber(card.mySite, 'bonus_hour')) }}
                            </a-col>
                          </a-row>

                          <span class="site-updated">
                            <clock-circle-outlined/>
                            更新时间：{{ getSiteUpdatedAt(card.mySite) }}
                          </span>
                        </template>

                        <div v-else class="support-url-list">
                          <div v-for="url in card.urls" :key="url" class="support-url-row">
                            <div class="support-url-main">
                              <a :href="url" class="support-url-link" target="_blank">
                                {{ getSupportSiteUrlHost(url) }}
                              </a>
                              <span class="support-url-full">{{ url }}</span>
                            </div>
                            <div class="support-url-state">
                              <a-tag :color="hasLocalCookie(card.localCookie) ? 'green' : 'default'">
                                {{ hasLocalCookie(card.localCookie) ? '有 Cookie' : '无 Cookie' }}
                              </a-tag>
                            </div>
                          </div>
                        </div>
                      </template>
                    </a-card-meta>
                  </a-card>
                </a-badge-ribbon>
              </a-col>
            </a-row>
          </section>
        </div>
        <a-row v-else justify="space-around" type="flex">
          <a-col>
            倒车请注意
          </a-col>
        </a-row>

        <a-tabs v-if="false" v-model:activeKey="activeKey" centered type="card">
          <a-tab-pane key="1" tab="站点数据">
            <div v-if="showSiteList" class="site-panel">
              <div class="stats-grid">
                <div class="stat-item danger">
                  <span class="stat-label">禁用</span>
                  <strong>{{ siteStats.disabled }}</strong>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">存活</span>
                  <strong>{{ siteStats.alive }}</strong>
                </div>
                <div class="stat-item">
                  <span class="stat-label">总数</span>
                  <strong>{{ siteStats.total }}</strong>
                </div>
                <div class="stat-item primary">
                  <span class="stat-label">筛选</span>
                  <strong>{{ siteStats.filtered }}</strong>
                </div>
              </div>
              <a-row :gutter="[12,12]" class="site-grid" type="flex">
                <a-col
                    v-for="mySite in showMySiteList"
                    :key="mySite.id"
                    class="site-col"
                    :lg="8" :md="12"
                    :sm="24"
                    :xl="6">
                  <a-badge-ribbon :color="calcBadge(mySite)" :text="mySite.available ?'':'站点已禁用'"
                                  placement="start">
                    <a-card class="site-card" hoverable size="small">
                      <template #extra>
                        <a-badge v-if="mySite.notice > 0" :count="mySite.notice"
                                 :offset="[2,0]">
                          <bell-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                        </a-badge>
                        <a-badge v-if="mySite.mail > 0" :count="mySite.mail" :offset="[2,0]">
                          <mail-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                        </a-badge>

                        <a-badge v-if="mySite.status?.invitation != undefined &&
                  // @ts-ignore
                  mySite.status?.invitation > 0"
                                 :count="mySite.status?.invitation" :number-style="{
                      backgroundColor: '#1a5ec4',
                      color: 'floralwhite',
                    }"
                                 :offset="[1,1]"
                        >
                          <user-add-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                        </a-badge>
                      </template>
                      <template #title>
                        <a-avatar v-if="!privateMode" :size="20"
                                  :src="`${mySite.mirror}/${webSiteList![mySite.site].logo}`"/>
                        <a-button class="site-title-link" :href="mySite.mirror" target="_blank" type="link">
                          <a-tooltip>
                            <template #title>{{ mySite.nickname }}</template>
                            <span
                                v-text="`${mySite.nickname[0].toUpperCase()}${privateMode ? '*' :mySite.nickname.slice(1)}`"></span>
                          </a-tooltip>
                          <!--                    <span v-else-->
                          <!--                          v-text="`${mySite.site[0].toUpperCase()}${privateMode ? '*' :mySite.site.slice(1)}`"></span>-->
                        </a-button>
                        <span class="site-level">
                      {{
                            // @ts-ignore
                            `${mySite.status?.my_level.replace(/\s/g, '') || 'User'}`
                          }}
                    </span>
                      </template>
                      <template #actions>
                        <a-tooltip>
                          <template #title>刷新站点数据</template>
                          <loading-outlined v-if="isSiteOperationLoading('refreshSite', mySite)" key="refresh-loading" spin/>
                          <format-painter-outlined v-else key="refresh" @click="refreshSite(mySite)"/>
                        </a-tooltip>
                        <a-tooltip v-if="mySite.sign_in">
                          <template v-if="mySite.sign_info == null" #title>签到签到</template>
                          <template v-else #title>
                            <div style="font-size: 11px;">
                              {{ mySite.sign_info?.info }}
                              <br/>
                              签到时间：{{
                                // @ts-ignore
                                mySite.sign_info?.updated_at?.substring(0, 19)
                              }}
                            </div>
                          </template>
                          <loading-outlined v-if="isSiteOperationLoading('signSite', mySite)" key="sign-loading" spin/>
                          <edit-outlined v-else-if="mySite.sign_info == null" key="edit" @click="signSite(mySite)"/>
                          <check-circle-outlined v-else key="ok" style="color: #7cb305"/>
                        </a-tooltip>
                        <a-tooltip>
                          <template #title>同步 Cookie</template>
                          <loading-outlined v-if="isSiteOperationLoading('syncSingleSite', mySite)" key="sync-loading" spin/>
                          <sync-outlined v-else key="sync" @click="syncSingleSite(mySite)"/>
                        </a-tooltip>
                        <a-tooltip>
                          <template #title>导入 Cookie</template>
                          <loading-outlined v-if="isSiteOperationLoading('writeSiteCookies', mySite)" key="write-loading" spin/>
                          <download-outlined v-else key="write" @click="writeSiteCookies(mySite)"/>
                        </a-tooltip>

                        <a-tooltip>
                          <template #title>更多功能，敬请期待 {{ mySite.id }}</template>
                          <ellipsis-outlined key="ellipsis"/>
                        </a-tooltip>
                      </template>
                      <a-card-meta>
                        <template #avatar>

                        </template>
                        <template #description>
                          <a-row class="site-data" :gutter="[4,4]">
                            <a-col :span="10">
                              <arrow-up-outlined/>
                              {{ mySite.status?.seed }}
                            </a-col>
                            <a-col :span="7">
                              <arrow-down-outlined/>
                              {{ mySite.status?.leech }}
                            </a-col>
                            <a-col :span="7">
                              <share-alt-outlined/>
                              {{
                                // @ts-ignore
                                numberFormat(mySite.status?.downloaded ? (mySite.status?.uploaded / mySite.status?.downloaded).toFixed() : 0)
                              }}
                              [{{ mySite.status?.published || 0 }}]
                            </a-col>
                            <a-col :span="10">
                              <cloud-upload-outlined/>

                              {{
                                // @ts-ignore
                                prettyBytes(mySite.status?.uploaded || 0)
                              }}
                            </a-col>
                            <a-col :span="7">
                              <cloud-download-outlined/>
                              {{
                                // @ts-ignore
                                prettyBytes(mySite.status?.downloaded || 0)
                              }}
                            </a-col>
                            <a-col :span="7">
                              <cloud-sync-outlined/>
                              {{
                                // @ts-ignore
                                prettyBytes(mySite.status?.seed_volume || 0)
                              }}
                            </a-col>
                            <a-col :span="10">
                              <bar-chart-outlined/>
                              {{
                                // @ts-ignore
                                numberFormat(mySite.status?.my_bonus || 0)
                              }}
                            </a-col>
                            <a-col :span="7">
                              <area-chart-outlined/>
                              {{
                                // @ts-ignore
                                numberFormat(mySite.status?.my_score || 0)
                              }}
                            </a-col>
                            <a-col :span="7">
                              <field-time-outlined/>
                              {{
                                // @ts-ignore
                                numberFormat(mySite.status?.bonus_hour || 0)
                              }}
                            </a-col>

                          </a-row>

                          <span class="site-updated">
                    <clock-circle-outlined/>
                    更新时间：{{
                              // @ts-ignore
                              mySite.status?.updated_at.slice(0, 19)
                            }}
                  </span>
                        </template>
                      </a-card-meta>
                    </a-card>
                  </a-badge-ribbon>
                </a-col>

              </a-row>
            </div>
            <a-row v-else justify="space-around" type="flex">
              <a-col>
                倒车请注意
              </a-col>
            </a-row>
          </a-tab-pane>
          <a-tab-pane key="2" tab="站点列表">
            <div class="stats-grid compact">
              <div class="stat-item warning">
                <span class="stat-label">待添加</span>
                <strong>{{ Object.values(webSiteList!).filter((item) => !hadList.includes(item.name)).length }}</strong>
              </div>
              <div class="stat-item success">
                <span class="stat-label">已添加</span>
                <strong>{{ hadList.length }}</strong>
              </div>
            </div>
            <!--            <a-row :gutter="[12,8]" justify="space-around" type="flex">
               <span>
                 待添加：{{ Object.values(webSiteList!).filter((item) => !hadList.includes(item.name)).length }}
               </span>
              <span>
                 已添加：{{ hadList.length }}
               </span>
            </a-row>-->
            <a-row :gutter="[12,12]" class="site-grid" type="flex">
              <a-col
                  v-for="site in Object.values(webSiteList!).filter((item) =>item.alive && (item.name.includes(searchKey)
                  || item.url.some(url => url.includes(searchKey)))
                  ).sort((a, b) => a.url.length - b.url.length )"
                  :key="site.name"
                  class="site-col"
                  :lg="8" :md="12"
                  :sm="24"
                  :xl="6">
                <a-badge-ribbon :color="site.alive ? 'green' : 'red'" :placement="site.alive? 'start' : 'end'"
                                :text="site.alive ?'':'站点已禁用'">
                  <a-card class="site-card support-site-card" hoverable size="small">
                    <template #extra>
                      <a-space size="small">
                        <a-tag v-if="hadList.includes(site.name)" color="green">已添加</a-tag>
                        <a-tag v-else color="orange">待添加</a-tag>
                        <a-tag color="blue">{{ site.url.length }} URL</a-tag>
                      </a-space>
                    </template>
                    <template #title>
                      <a-avatar v-if="!privateMode" class="support-site-logo" :size="22"
                                :src="`${site.url[0]}/${site.logo}`"/>
                      <a-button class="site-title-link" :href="site.url[0]" target="_blank" type="link">
                        <a-tooltip>
                          <template #title>
                            {{ site.name }}
                          </template>

                          <span
                              v-text="`${site.name[0].toUpperCase()}${privateMode ? '*' :site.name.slice(1).toUpperCase()}`"></span>
                        </a-tooltip>
                        <!--                    <span v-else-->
                        <!--                          v-text="`${mySite.site[0].toUpperCase()}${privateMode ? '*' :mySite.site.slice(1)}`"></span>-->
                      </a-button>
                      <!--                    <span style="font-size: 12px;color: gray;">-->
                      <!--                      {{-->
                      <!--                        // @ts-ignore-->
                      <!--                        `${mySite.status?.my_level.replace(/\s/g, '') || 'User'}`-->
                      <!--                      }}-->
                      <!--                    </span>-->
                    </template>
                    <template #actions>
                      <!--                    <a-tooltip>-->
                      <!--                      <template #title>刷新站点数据</template>-->
                      <!--                      <format-painter-outlined key="refresh" @click="refreshSite(mySite)"/>-->
                      <!--                    </a-tooltip>-->
                      <!--                    <a-tooltip v-if="mySite.sign_in">-->
                      <!--                      <template v-if="mySite.sign_info == null" #title>签到签到</template>-->
                      <!--                      <template v-else #title>-->
                      <!--                        <div style="font-size: 11px;">-->
                      <!--                          {{ mySite.sign_info?.info }}-->
                      <!--                          <br/>-->
                      <!--                          签到时间：{{-->
                      <!--                            // @ts-ignore-->
                      <!--                            mySite.sign_info?.updated_at?.substring(0, 19)-->
                      <!--                          }}-->
                      <!--                        </div>-->
                      <!--                      </template>-->
                      <!--                      <edit-outlined v-if="mySite.sign_info == null" key="edit" @click="signSite(mySite)"/>-->
                      <!--                      <check-circle-outlined v-else key="ok" style="color: #7cb305"/>-->
                      <!--                    </a-tooltip>-->
                      <!--                    <a-tooltip>-->
                      <!--                      <template #title>同步 Cookie</template>-->
                      <!--                      <sync-outlined key="sync" @click="syncSingleSite(mySite)"/>-->
                      <!--                    </a-tooltip>-->
                      <!--                    <a-tooltip>-->
                      <!--                      <template #title>导入 Cookie</template>-->
                      <!--                      <download-outlined key="sync" @click="writeSiteCookies(mySite)"/>-->
                      <!--                    </a-tooltip>-->

                      <!--                    <a-tooltip>-->
                      <!--                      <template #title>更多功能，敬请期待 {{ mySite.id }}</template>-->
                      <!--                      <ellipsis-outlined key="ellipsis"/>-->
                      <!--                    </a-tooltip>-->
                    </template>
                    <a-card-meta>
                      <template #avatar>

                      </template>
                      <template #description>
                        <div class="support-url-list">
                          <div v-for="url in site.url" :key="url" class="support-url-row">
                            <div class="support-url-main">
                              <a :href="url" class="support-url-link" target="_blank">
                                {{ getSupportSiteUrlHost(url) }}
                              </a>
                              <span class="support-url-full">{{ url }}</span>
                            </div>
                            <div class="support-url-state">
                              <a-tag v-if="cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0" color="green">
                                有 Cookie
                              </a-tag>
                              <a-tag v-else>无 Cookie</a-tag>
                            </div>
                            <div class="support-url-actions">
                              <a-button
                                  v-if="!hadList.includes(site.name) && cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0"
                                  size="small"
                                  type="primary">
                                添加
                              </a-button>
                              <a-button
                                  v-else-if="hadList.includes(site.name) && cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0"
                                  size="small"
                                  type="primary"
                              >更新
                              </a-button>
                              <a-tooltip v-if="cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0">
                                <template #title>
                                  <a-typography-paragraph :content="`当前 Cookie：${ cookieInfoMap![url] }`" ellipsis>
                                  </a-typography-paragraph>
                                </template>
                                <a-button ghost size="small" type="primary" @click="copy(cookieInfoMap![url])">复制</a-button>
                              </a-tooltip>
                            </div>
                          </div>
                        </div>
                        <!--                      <a-row class="site-data">-->
                        <!--                        <a-col :span="10">-->
                        <!--                          <arrow-up-outlined/>-->
                        <!--                          {{ mySite.status?.seed }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <arrow-down-outlined/>-->
                        <!--                          {{ mySite.status?.leech }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <share-alt-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            numberFormat(mySite.status?.downloaded ? (mySite.status?.uploaded / mySite.status?.downloaded).toFixed() : 0)-->
                        <!--                          }}-->
                        <!--                          [{{ mySite.status?.published || 0 }}]-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="10">-->
                        <!--                          <cloud-upload-outlined/>-->

                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            prettyBytes(mySite.status?.uploaded || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <cloud-download-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            prettyBytes(mySite.status?.downloaded || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <cloud-sync-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            prettyBytes(mySite.status?.seed_volume || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="10">-->
                        <!--                          <bar-chart-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            numberFormat(mySite.status?.my_bonus || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <area-chart-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            numberFormat(mySite.status?.my_score || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->
                        <!--                        <a-col :span="7">-->
                        <!--                          <field-time-outlined/>-->
                        <!--                          {{-->
                        <!--                            // @ts-ignore-->
                        <!--                            numberFormat(mySite.status?.bonus_hour || 0)-->
                        <!--                          }}-->
                        <!--                        </a-col>-->

                        <!--                      </a-row>-->

                        <!--                      <span class="site-data">-->
                        <!--                    <clock-circle-outlined/>-->
                        <!--                    更新时间：{{-->
                        <!--                          // @ts-ignore-->
                        <!--                          mySite.status?.updated_at.slice(0, 19)-->
                        <!--                        }}-->
                        <!--                  </span>-->
                      </template>
                    </a-card-meta>
                  </a-card>
                </a-badge-ribbon>
              </a-col>

            </a-row>
          </a-tab-pane>
        </a-tabs>


      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.ant-layout {
  height: 100% !important;
}

.operate-page {
  min-height: 100vh;
  background: #f4f7fb;
}

.app-sider {
  background: #ffffff !important;
  border-right: 1px solid #e6edf5;
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.04);
  text-align: center;
}

.main-layout {
  background: #f4f7fb;
}

.menu-row {
  display: flex;
  top: 0;
  width: 100%;
  align-items: center;
  margin: 0;
}

.site-data {
  color: #334155;
  font-size: 11px;
  line-height: 18px;
}

.site-data :deep(.ant-col) {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.custom-header {
  min-height: 52px;
  height: 52px;
  background: #155e75 !important;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-header {
  justify-content: flex-end;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.toolbar-row {
  width: 100%;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}

.title {
  margin: 0;
  color: floralwhite !important;
}

.alert-content {
  padding: 12px !important;
}

.side-actions {
  width: 100%;
  padding: 12px;
}

.side-actions :deep(.ant-space-item),
.side-actions :deep(.ant-btn),
.side-actions :deep(.ant-input),
.side-actions :deep(.ant-input-affix-wrapper) {
  width: 100%;
}

.side-actions :deep(.ant-btn) {
  height: 32px;
  border-radius: 6px;
  font-size: 12px;
}

.server-setting-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.server-setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.float-image-setting {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
}

.float-image-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  overflow: hidden;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
}

.float-image-preview :deep(.ant-avatar) {
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.float-image-controls {
  min-width: 0;
}

.float-image-title {
  margin-bottom: 2px;
  color: #475569;
  font-size: 12px;
}

.float-image-controls :deep(.ant-slider) {
  margin: 4px 2px;
}

.content {
  display: block;
  padding: 12px;
  overflow-x: hidden;
}

.content :deep(.ant-tabs) {
  width: 100%;
}

.content :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.site-panel {
  width: 100%;
}

.unified-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.unified-group {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.unified-group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.unified-group-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 20px;
}

.unified-group-header p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 16px;
}

.unified-empty {
  padding: 18px 0;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
}

.unified-site-card :deep(.ant-card-actions > li) {
  margin: 5px 0;
}

.unified-site-card :deep(.ant-card-actions .ant-btn) {
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
}

.site-action-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
  padding: 0 6px;
}

.site-action-bar.secondary {
  padding-top: 5px;
  border-top: 1px dashed #e2e8f0;
}

.site-action-bar :deep(.ant-btn) {
  min-width: 48px;
  border-radius: 5px;
}

.site-action-bar :deep(.ant-btn-text) {
  color: #475569;
}

.site-action-bar :deep(.ant-btn-text:not(:disabled):hover) {
  color: #0369a1;
  background: #eff6ff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(96px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stats-grid.compact {
  grid-template-columns: repeat(2, minmax(120px, 180px));
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.stat-label {
  color: #64748b;
  font-size: 12px;
}

.stat-item strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 22px;
}

.stat-item.success strong {
  color: #15803d;
}

.stat-item.danger strong {
  color: #dc2626;
}

.stat-item.primary strong {
  color: #0369a1;
}

.stat-item.warning strong {
  color: #b45309;
}

.site-grid {
  width: 100%;
}

.site-col {
  min-width: 0;
}

.site-card {
  width: 100% !important;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.site-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.site-card :deep(.ant-card-head) {
  min-height: 42px;
  padding: 0 10px;
  border-bottom-color: #edf2f7;
}

.site-card :deep(.ant-card-head-title) {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 8px 0;
}

.site-card :deep(.ant-card-extra) {
  padding: 8px 0;
}

.site-card :deep(.ant-card-body) {
  padding: 8px 10px 10px;
}

.site-card :deep(.ant-card-actions) {
  border-top-color: #edf2f7;
  background: #fbfdff;
}

.site-card :deep(.ant-card-actions > li) {
  margin: 6px 0;
}

.site-card :deep(.ant-card-actions svg) {
  color: #64748b;
  transition: color 0.15s ease, transform 0.15s ease;
}

.site-card :deep(.ant-card-actions svg:hover) {
  color: #0369a1;
  transform: translateY(-1px);
}

.site-title-link {
  max-width: 150px;
  height: 24px;
  padding: 0 4px;
  overflow: hidden;
  vertical-align: middle;
}

.site-title-link span {
  display: inline-block;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-level {
  display: inline-flex;
  max-width: 84px;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.site-updated {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e2e8f0;
  color: #64748b;
  font-size: 11px;
}

.support-site-card :deep(.ant-card-body) {
  padding: 8px;
}

.support-site-card :deep(.ant-card-extra) {
  max-width: 154px;
  overflow: hidden;
}

.support-site-card :deep(.ant-space) {
  gap: 4px !important;
}

.support-site-card :deep(.ant-tag) {
  margin-right: 0;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
}

.support-site-logo {
  flex: 0 0 auto;
  margin-right: 2px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.support-url-list {
  display: grid;
  gap: 8px;
}

.support-url-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.support-url-row:hover {
  border-color: #bfdbfe;
  background: #ffffff;
}

.support-url-main {
  min-width: 0;
}

.support-url-link {
  display: block;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.support-url-full {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.support-url-state {
  white-space: nowrap;
}

.support-url-state :deep(.ant-tag) {
  min-width: 58px;
  text-align: center;
}

.support-url-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  white-space: nowrap;
}

.support-url-actions :deep(.ant-btn) {
  height: 24px;
  padding: 0 7px;
  border-radius: 5px;
  font-size: 12px;
}

.form-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

::v-deep(.custom-input-search input) {
  color: floralwhite !important;
}

::v-deep(input.ant-input.ant-input-borderless) {
  background-color: rgba(27, 108, 142, 0.0) !important;
  color: floralwhite !important;
  border: none !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .content {
    padding: 8px;
  }

  .toolbar-actions {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .stats-grid,
  .stats-grid.compact {
    grid-template-columns: 1fr;
  }

  .site-title-link {
    max-width: 120px;
  }

  .support-url-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .support-url-state,
  .support-url-actions {
    justify-content: flex-start;
  }
}

</style>
