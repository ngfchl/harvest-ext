<script lang="ts" setup>
import {computed, onMounted, ref,} from "vue";
import {message} from "ant-design-vue"
import {
  ArrowDownOutlined,
  CheckSquareOutlined,
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  DragOutlined,
  EyeOutlined,
  LockOutlined,
  PushpinFilled,
  RollbackOutlined,
  SearchOutlined,
  SendOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UnlockOutlined,
} from '@ant-design/icons-vue'
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";
import {Category, CommonResponse, RepeatInfo} from "@/types";
import copy from "copy-to-clipboard";
import {MENU_IDS} from "@/components/menu";

const props = withDefaults(defineProps<{
  initialWebsite?: any;
  initialMySiteId?: number;
}>(), {
  initialMySiteId: 0,
})

const settingStore = useSettingStore()
const {
  setting, downloaders,
} = storeToRefs(settingStore)
const {
  initializeCore,
  initializeDownloaders,
  filterSiteByHost,
  filterMySiteBySiteName,
  sendSiteInfo,
  saveSetting,
  getCookieString,
  testDownloader,
  getDownloaderCategorise,
  pushTorrent,
  repeatInfo,
  syncTorrents,
  cacheServerData,
  loadCoreFromCacheIfAvailable,
} = settingStore

const drawer = ref(false)
const repeat_info = ref<RepeatInfo>({
  url_list: [],
  can_list: []
})

message.config({
  top: `50px`,
});
const activeKey = ref<number>();
const current_site_page = ref<SitePageType>(null)
const user_detail_page = ref(false)
const torrent_list_page = ref(false)
const torrent_detail_page = ref(false)
const torrent_detail_repeat = ref(false)
const open = ref<boolean>(false);
const categories = ref<Category[]>([])
const fallback_image = ref<string>('https://picsum.photos/100/100/?random')
const cookie = ref<string>('')
const url_list = ref<string[]>([])
const modal_title = ref<string>('下载到')
const singleTorrent = ref<ExtractedTorrent>()
const downloadMode = ref<'single' | 'all' | 'free'>('all')
const torrentSearchKey = ref('')
const torrentSaleFilter = ref<string[]>([])
const torrentTagFilter = ref<string[]>([])
const torrentCategoryFilter = ref<string[]>([])
const torrentSortKey = ref('seeders')
const torrentSortOrder = ref<'ascend' | 'descend'>('descend')
const downloaderPanelVisible = ref(false)
const pushModalVisible = ref(false)
const selectedTorrentKeys = ref<string[]>([])
const pushSelectedDownloaderId = ref<number>()
const pushSavePath = ref('')
const pushSelectedCategory = ref<string | null>(null)
const pushSelectedTags = ref<string[]>([])
const pushCustomTag = ref('')
const pushSubmitting = ref(false)
const pushPaused = ref(false)
const pushAdvancedExpanded = ref(false)
const pushSkipChecking = ref(false)
const pushForced = ref(false)
const pushAutoManagement = ref(false)
const pushCreateSubfolder = ref(false)
const pushSequentialDownload = ref(false)
const pushFirstLastPiecePriority = ref(false)
const pushAddToTop = ref(false)
const pushContentLayout = ref('Original')
const pushRename = ref('')
const pushUploadLimit = ref('')
const pushDownloadLimit = ref('')
const pushRatioLimit = ref('')
const pushSeedingTimeLimit = ref('')
const pushStopCondition = ref<string | null>(null)
const pushShareLimitAction = ref<string | null>(null)
const siteDataModalVisible = ref(false)
const siteDataLoading = ref(false)
const siteDataEncrypted = ref(false)
const siteDataSyncLoading = ref(false)
const siteDataPreview = ref<Record<string, any>>({})
const mySiteId = ref<number>(0)
const topPosition = ref<number>(0)
const myUid = ref<string>('')
const hover = ref(false)
const siteInfo = ref();
const harvestWrap = ref<HTMLElement | null>(null);
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const onMouseDown = (e: MouseEvent) => {
  if (!harvestWrap.value) return;
  isDragging = true;
  offsetX = e.clientX - harvestWrap.value.getBoundingClientRect().left;
  offsetY = e.clientY - harvestWrap.value.getBoundingClientRect().top;
  harvestWrap.value.style.cursor = "grabbing";
};

const onMouseMove = async (e: MouseEvent) => {
  if (!isDragging || !harvestWrap.value) return;
  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;
  harvestWrap.value.style.left = `${x}px`;
  harvestWrap.value.style.top = `${y}px`;
  topPosition.value = y;
  console.log('topPosition', topPosition.value);
  await storage.setItem('local:topPosition', JSON.stringify(topPosition.value))
};

const onMouseUp = () => {
  isDragging = false;
  if (!harvestWrap.value) return;
  harvestWrap.value.style.cursor = "grab";

  // 获取屏幕宽度和元素宽度
  const screenWidth = window.innerWidth;
  const elementWidth = harvestWrap.value?.offsetWidth;
  const elementLeft = parseInt(harvestWrap.value.style.left, 10);
// 先清理方向 class
  harvestWrap.value.classList.remove("dock-left", "dock-right");
  // 判断停靠位置
  if (elementLeft > screenWidth / 2 - elementWidth / 2) {
    // 靠右停放
    harvestWrap.value.style.right = `5px`;
    harvestWrap.value.classList.add("dock-right");
  } else {
    // 靠左停放
    harvestWrap.value!.style.left = "5px";
    harvestWrap.value.classList.add("dock-left");
  }
};

const resetPosition = async () => {
  if (!harvestWrap.value) return;
  harvestWrap.value.classList.remove("dock-left", "dock-right");
  harvestWrap.value.style.top = `240px`;
  harvestWrap.value.style.left = `5px`;
  harvestWrap.value.classList.add("dock-left");
  await storage.setItem('local:topPosition', JSON.stringify(240));
  // location.reload();
}
const loadLocalStorage = async () => {
  // 使用当前页面 host 查找站点配置文件，再根据固定配置名反查已添加站点 ID。
  siteInfo.value = props.initialWebsite || filterSiteByHost(location.host)
  console.log('使用站点 host 查找站点信息：', siteInfo.value)
  if (!siteInfo.value) {
    console.warn('查找站点失败，未在缓存中找到站点信息')
    // message.error()
    return;
  }
  mySiteId.value = props.initialMySiteId || filterMySiteBySiteName(siteInfo.value.name);
  console.log('查找到的站点 ID：', mySiteId.value)

  topPosition.value = parseInt(await storage.getItem('local:topPosition') || '240')
  console.log('topPosition', topPosition.value);
}
onMounted(async () => {
  // 处理 message 不显示的 BUG
  message.config({
    getContainer: () => document.querySelector('harvest-ui')?.shadowRoot?.querySelector('#message-container') || document.body,
  });
  const initializePromise = initializeCore().catch(error => {
    console.error('初始化设置失败:', error)
  });
  initializeDownloaders().catch(error => {
    console.error('初始化下载器失败:', error)
  })
  initializePromise.then(async () => {
    if (!siteInfo.value) {
      await loadLocalStorage()
    }
  })
  // 从本地存储加载站点信息
  await loadLocalStorage();

  // await getSiteInfo()
  // 在 Shadow DOM 中添加事件监听器
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  window.addEventListener('harvest:action', (e: any) => {
    handleHarvestAction(e.detail);
  });
  const initPageState = async () => {
    console.log('页面已就绪，初始化悬浮窗状态');
    await getUid()
    await init_button()
  }
  await nextTick(async () => {
    if (document.readyState === 'complete') {
      setTimeout(initPageState, 300)
      return
    }
    window.addEventListener('load', () => {
      setTimeout(initPageState, 300)
    }, {once: true})
  });
});

const handleHarvestAction = async (action: string) => {
  switch (action) {
    case MENU_IDS.SYNC:
      await go_to_control_page();
      break;
    case MENU_IDS.CLEAR_CACHE:
      await clearCurrentCache();
      break;
    case MENU_IDS.GET_COOKIE:
      await copyCookieString();
      break;
    case MENU_IDS.OPEN_HARVESTER:
      await openHarvester();
      break;
  }
}
const openHarvester = async () => {
  window.open(setting.value.baseUrl, '_blank');
}
/**
 * 获取站点相关规则
 * @returns
 */
const getSiteInfo = async () => {
  if (mySiteId.value > 0 && siteInfo.value) {
    return null;
  }
  await loadCoreFromCacheIfAvailable()
  const website = filterSiteByHost(location.host)
  if (!website) {
    const msg = `获取站点信息出错：未在插件缓存的站点配置列表中找到 ${location.host}`;
    console.warn(msg);
    // message.warning(msg, 10000);
    return null;
  }

  mySiteId.value = filterMySiteBySiteName(website.name);
  siteInfo.value = website;
}

/**
 * 跳转控制面板页面并同步 Cookie
 */
async function go_to_control_page() {
  console.log('跳转控制面板页面...')
  console.log(siteInfo.value)
  if (!(siteInfo.value)) {
    await getSiteInfo()
  }
  let url = siteInfo.value.page_control_panel
  if (!url.startsWith('/')) {
    url = `/${url}`
  }
  if (url.includes('{}')) {
    let UserIdRes = await getUid()
    if (!UserIdRes.succeed) {
      console.error('用户ID解析失败！')
      return CommonResponse.error(-1, '用户ID解析失败！')
    }
    url = `${location.origin}/${url.replace('{}', myUid.value)}`
    console.log('站点 UID 解析成功：', myUid.value)
    console.log('生成访问地址：', url)
  }
  window.location = url;
}

async function getUid() {
  const node = document.evaluate(siteInfo.value.my_uid_rule, document).iterateNext();
  console.log('解析UID元素节点', node)
  let href = node?.textContent?.trim();
  console.log('解析 UID 链接', href)
  if (!href) {
    console.log('解析 UID 链接出错啦！')
    return CommonResponse.error(-1, '解析 UID 链接出错啦！')
  }

  let user_id: string | null = null;
  const segments = href
      .split('/')
      .map(s => s.trim())
      .filter(s => s !== '');

  if (href.includes('=')) {
    // URL 模式
    const fullUrl = href.startsWith('http') ? href : `${location.origin}/${href}`;
    const url = new URL(fullUrl);
    user_id =
        url.searchParams.get('id') ||
        url.searchParams.get('uid') ||
        url.searchParams.get('user_id') ||
        url.searchParams.get('uuid') ||
        url.searchParams.get('u');
  } else if (!href.includes('/')) {
    user_id = href.trim()
  } else {
    // path 模式
    if (/\/\d+$/.test(href)) {
      const lastSegment = segments[segments.length - 1];
      if (/^\d+$/.test(lastSegment)) {
        user_id = lastSegment;
      }
    } else {
      user_id = href.split('/').pop()?.trim() || null;
    }
  }
  console.log('当前站点UID为：', user_id);
  if (!user_id) {
    return CommonResponse.error(-1, '非本人主页，取消同步！')
  }
  if (!/^[a-zA-Z0-9-]+$/.test(user_id)) {
    return CommonResponse.error(-1, '站点 Uid 获取失败，请上报给开发者！')
  }
  myUid.value = user_id
  localStorage.setItem('myUid', JSON.stringify(myUid.value));
  return CommonResponse.success(user_id)
}

async function download_to() {
  resetTorrentListControls()
  downloadMode.value = 'single'
  await get_torrent_detail()
  console.log(torrents.value)
  singleTorrent.value = torrents.value[0]
  if (!await ensureDownloadersAvailable()) {
    return
  }
  if (torrents.value.length <= 0) {
    message.warning('没有符合条件的种子！')
    return
  }
  await prepareTorrentPush()
}

const ensureDownloadersAvailable = async () => {
  if ((downloaders.value?.length || 0) <= 0) {
    await initializeDownloaders().catch(error => {
      console.error('加载下载器失败:', error)
    })
  }
  if ((downloaders.value?.length || 0) <= 0) {
    message.warning('没有可用的下载器！请先在收割机中添加！')
    return false
  }
  return true
}

const showModal = async () => {
  if (!await ensureDownloadersAvailable()) {
    return
  }
  if (torrents.value.length <= 0) {
    message.warning('没有符合条件的种子！')
    return
  }
  open.value = true;
};

async function download_all() {

  resetTorrentListControls()
  downloadMode.value = 'all'
  await get_torrent_list()
  await generate_magnet_url(false)
  modal_title.value = '选择本页种子并推送'
  await showModal()
}

const handleOk = (e: MouseEvent) => {
  open.value = false;
};

async function download_free() {
  resetTorrentListControls()
  downloadMode.value = 'free'
  await get_torrent_list()
  await generate_magnet_url(true)
  modal_title.value = '选择免费种子并推送'
  await showModal()
}

/**
 * 发送站点信息到服务器
 * @param data - 要发送的数据，格式为 URL-encoded 字符串
 * @returns
 */
async function doSendSiteInfo(data: Record<string, any>, options: { closeTabOnSuccess?: boolean } = {}) {
  try {
    const res = await sendSiteInfo(data, options)
    console.log('站点信息获取结果', res);
    if (!res.succeed) {
      message.error(res.msg);
    } else {
      message.success(res.msg);
    }

  } catch (error) {
    console.error('站点信息获取失败', error);
    message.error(`收割机提醒您：站点信息获取失败！${error}`);
  }
}

type PageConfig = string | string[] | null | undefined;
type SitePageType =
    | 'index'
    | 'torrents'
    | 'sign_in'
    | 'control_panel'
    | 'detail'
    | 'user'
    | 'search'
    | 'message'
    | 'hr'
    | 'mybonus'
    | null

const sitePageLabels: Record<Exclude<SitePageType, null>, string> = {
  index: '主页',
  torrents: '种子列表页',
  sign_in: '签到页',
  control_panel: '控制面板页',
  detail: '种子详情页',
  user: '用户个人主页',
  search: '搜索页',
  message: '消息页面',
  hr: 'HR 页面',
  mybonus: '魔力页面',
}

const toPageConfigList = (config: PageConfig): string[] => {
  if (Array.isArray(config)) {
    return config.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  return typeof config === 'string' && config.trim().length > 0 ? [config] : []
}

const stripTrailingSlash = (path: string) => {
  const suffixIndex = path.search(/[?#]/)
  const basePath = suffixIndex >= 0 ? path.slice(0, suffixIndex) : path
  const suffix = suffixIndex >= 0 ? path.slice(suffixIndex) : ''
  if (basePath === '/') {
    return `${basePath}${suffix}`
  }
  return `${basePath.replace(/\/$/, '')}${suffix}`
}

const normalizePagePath = (path: string) => {
  let normalized = path.trim().replace(/^https?:\/\/[^/]+/i, '')
  normalized = normalized.split('#')[0]
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }
  return stripTrailingSlash(normalized)
}

const splitPagePath = (path: string) => {
  const queryIndex = path.indexOf('?')
  return {
    pathname: stripTrailingSlash(queryIndex >= 0 ? path.slice(0, queryIndex) : path),
    search: queryIndex >= 0 ? path.slice(queryIndex) : '',
  }
}

const hasMeaningfulSearch = (path: string) => {
  const {search} = splitPagePath(path)
  return search.length > 1
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getCurrentPagePath = () => stripTrailingSlash(`${location.pathname}${location.search}`)

const pagePathnameMatches = (configPathname: string, currentPathname: string) => {
  if (configPathname.includes('{}')) {
    const regexSource = configPathname.split('{}').map(escapeRegExp).join('[^/?&#]+')
    return new RegExp(`^${regexSource}$`).test(currentPathname)
  }
  return currentPathname === configPathname
}

const pageSearchMatches = (configSearch: string, currentSearch: string) => {
  if (!configSearch || configSearch.length <= 1) {
    return true
  }
  const configParams = new URLSearchParams(configSearch)
  const currentParams = new URLSearchParams(currentSearch)
  for (const [key, value] of configParams.entries()) {
    const currentValue = currentParams.get(key)
    if (!currentValue) {
      return false
    }
    if (value.includes('{}')) {
      const regexSource = value.split('{}').map(escapeRegExp).join('[^&#]+')
      if (!new RegExp(`^${regexSource}$`).test(currentValue)) {
        return false
      }
      continue
    }
    if (currentValue !== value) {
      return false
    }
  }
  return true
}

const pageConfigMatchesCurrentPath = (normalizedConfig: string, currentPath: string) => {
  const {pathname: configPathname, search: configSearch} = splitPagePath(normalizedConfig)
  const {pathname: currentPathname, search: currentSearch} = splitPagePath(currentPath)
  return pagePathnameMatches(configPathname, currentPathname) && pageSearchMatches(configSearch, currentSearch)
}

const pagePathMatches = (config: PageConfig) => {
  const currentPath = getCurrentPagePath()
  const currentPathname = stripTrailingSlash(location.pathname)

  return toPageConfigList(config).some((item) => {
    const normalizedConfig = normalizePagePath(item)
    const {pathname: configPathname} = splitPagePath(normalizedConfig)
    const shouldMatchSearch = hasMeaningfulSearch(normalizedConfig)

    if (item.includes('{}')) {
      if (myUid.value) {
        const uidConfig = normalizePagePath(item.replaceAll('{}', myUid.value))
        if (hasMeaningfulSearch(uidConfig) ? pageConfigMatchesCurrentPath(uidConfig, currentPath) : currentPathname === splitPagePath(uidConfig).pathname) {
          return true
        }
      }

      if (shouldMatchSearch && pageConfigMatchesCurrentPath(normalizedConfig, currentPath)) {
        return true
      }

      const target = shouldMatchSearch ? currentPath : currentPathname
      const regexConfig = shouldMatchSearch ? normalizedConfig : configPathname
      const regexSource = regexConfig.split('{}').map(escapeRegExp).join('[^/?&#]+')
      const regexSuffix = shouldMatchSearch ? '(?:[&#].*)?' : ''
      return new RegExp(`^${regexSource}${regexSuffix}$`).test(target)
    }

    if (shouldMatchSearch) {
      return pageConfigMatchesCurrentPath(normalizedConfig, currentPath) || currentPathname === configPathname
    }
    return currentPathname === configPathname
  })
}

const detectCurrentSitePage = (): SitePageType => {
  const pageControlPanel = siteInfo.value.page_control_panel ?? siteInfo.value.page_control
  const pageRules: Array<{ type: Exclude<SitePageType, null>, config: PageConfig }> = [
    {type: 'detail', config: siteInfo.value.page_detail},
    {type: 'user', config: siteInfo.value.page_user},
    {type: 'control_panel', config: pageControlPanel},
    {type: 'search', config: siteInfo.value.page_search},
    {type: 'torrents', config: siteInfo.value.page_torrents},
    {type: 'sign_in', config: siteInfo.value.page_sign_in},
    {type: 'message', config: siteInfo.value.page_message},
    {type: 'hr', config: siteInfo.value.page_hr},
    {type: 'mybonus', config: siteInfo.value.page_mybonus},
    {type: 'index', config: siteInfo.value.page_index},
  ]

  return pageRules.find(({config}) => pagePathMatches(config))?.type ?? null
}

async function init_button() {
  /**
   * 初始化页面按钮
   */

  console.log('开始初始化按钮，当前页面地址：', location.href)
  if (!siteInfo.value) {
    console.warn('站点信息未初始化，跳过按钮初始化')
    return;
  }

  user_detail_page.value = false
  torrent_list_page.value = false
  torrent_detail_page.value = false

  current_site_page.value = detectCurrentSitePage()
  console.log('当前站点页面识别结果：', getCurrentPagePath(), current_site_page.value ? sitePageLabels[current_site_page.value] : '未知页面')

  if (current_site_page.value === 'user') {
    user_detail_page.value = true
    console.log('当前为用户个人主页')
    await nextTick(async () => {
      // 可以在这里操作已经渲染的 DOM 元素或执行其他需要在 DOM 渲染完成后执行的逻辑
      console.log('DOM 已更新');
      await syncCookie()
    });
    return;
  }

  if (current_site_page.value === 'control_panel') {
    user_detail_page.value = true
    console.log('当前为控制面板页')
    await nextTick(async () => {
      // 可以在这里操作已经渲染的 DOM 元素或执行其他需要在 DOM 渲染完成后执行的逻辑
      console.log('DOM 已更新');
      await syncCookie()
    });
    return;
  }

  if (current_site_page.value === 'detail') {
    console.log('当前为种子详情页')
    torrent_detail_page.value = true
    await get_torrent_detail()
    // await sync_torrents()
    let tid = Number(torrents.value[0].tid)
    console.log('当前种子Id: ', torrents.value)
    if (!tid) {
      message.warning('未获取到种子 id！')
      return
    }
    await nextTick(async () => {
      // 可以在这里操作已经渲染的 DOM 元素或执行其他需要在 DOM 渲染完成后执行的逻辑
      console.log('DOM 已更新');
      await repeat(tid)
    });
    return;
  }

  if (current_site_page.value === 'torrents' || current_site_page.value === 'search') {
    console.log(current_site_page.value === 'search' ? '当前为搜索页' : '当前为种子列表页')
    torrent_list_page.value = true
    await nextTick(async () => {
      // 可以在这里操作已经渲染的 DOM 元素或执行其他需要在 DOM 渲染完成后执行的逻辑
      console.log('DOM 已更新');
      await get_torrent_id_list()
    });
    return;
  }
}

/**
 * 获取passkey
 */
const getPasskey = () => {
  try {
    let passkey = document.evaluate(siteInfo.value.my_passkey_rule, document).iterateNext()!.textContent
    return passkey!.trim()
  } catch (e) {
    console.error('解析Passkey失败: ', e)
    return false
  }
}

/**
 * 获取注册时间
 */
const getTimeJoin = () => {
  try {
    let time_join = document.evaluate(siteInfo.value.my_time_join_rule, document).iterateNext()!.textContent
    return time_join!.trim()
        .replace('T', ' ')
        .replace('+08:00', '')
        .match(/\d{4}\D\d{2}\D\d{2}\D\d{2}\D\d{2}\D\d{2}/)![0]
  } catch (e) {
    console.error('解析站点注册时间失败: ', e)
    return false
  }
}
/**
 * 获取用户名
 */
const getUsername = () => {
  try {
    let username = document.evaluate(siteInfo.value.my_username_rule, document).iterateNext()!.textContent
    return username!.trim()
  } catch (e) {
    console.error('解析用户名失败: ', e)
    return false
  }
}

/**
 * 提取邮箱方法
 */
function extractFirstEmail(text: string) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * 邮箱验证方法
 */
function validateEmail(email: string) {
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

/**
 * 清理本站缓存
 */
const clearCurrentCache = async () => {
  localStorage.removeItem('website')
  localStorage.removeItem('mySite')
  console.log('本站缓存清理完毕！重新加载缓存..')
  message.success('本站缓存清理完毕！正在刷新页面..')
  cacheServerData().then(() => {
    console.log('重新加载缓存完成！正在刷新页面..')
    setTimeout(() => {
    }, 100)
    location.reload()
  })
}

/**
 * 获取邮箱地址
 */
const getEmail = () => {
  try {
    let emailString = document.evaluate(siteInfo.value.my_email_rule, document).iterateNext()!.textContent
    console.log('解析邮箱中：', emailString)
    if (!emailString) {
      return false
    }
    let email = extractFirstEmail(emailString)
    console.log('提取邮箱', email)
    if (!email || !validateEmail(email)) {
      return false
    }
    return email
  } catch (e) {
    console.error('解析邮箱失败: ', e)
    return false
  }
}

/**
 * 复制Cookie
 */
const copyCookieString = async () => {
  let response = await getCookieString(location.host)
  if (response.succeed) {
    const success = copy(response.data)
    message.open({
      type: success ? 'success' : 'error',
      content: success ? 'Cookie复制成功' : 'Cookie复制失败',
    })
  } else {
    message.error(response.msg)
  }
}

/**
 * 组装站点信息
 * @returns
 */
async function getSiteData() {

  console.log('站点配置信息', siteInfo.value)

  if (siteInfo.value === false) {
    console.error('收割机服务器连接失败！')
    return CommonResponse.error(-1, '收割机服务器连接失败！');
  }
  console.log('站点UID：', siteInfo.value.my_uid_rule)

  //获取UID
  let UserIdRes = await getUid()
  if (!UserIdRes.succeed) {
    console.error('用户ID解析失败！')
    return CommonResponse.error(-1, '用户ID解析失败！')
  }
  console.log('站点 UID 解析成功：', myUid.value)

  /* 处理馒头域名 */
  let host = `${document.location.origin}/`
  if (host.includes("m-team")) {
    cookie.value = localStorage.getItem('auth') || ''
  } else {
    let cookieResponse = await getCookieString(location.host)
    if (!cookieResponse.succeed) {
      console.error(`Cookie获取失败，${cookieResponse.msg}！`)
      return CommonResponse.error(-1, `Cookie获取失败，${cookieResponse.msg}！`)
    }
    cookie.value = cookieResponse.data
  }

  const siteData: Record<string, any> = {
    user_id: myUid.value,
    site: siteInfo.value.name,
    cookie: cookie.value,
    user_agent: window.navigator.userAgent,
  };

  if (mySiteId.value != 0) {
    siteData.id = mySiteId.value;
  }
  if (mySiteId.value == 0) {
    // siteData += `&nickname=${siteInfo.value.name}&mirror=${host}&tags=${siteInfo.value.tags.split(',')}`
    siteData.nickname = siteInfo.value.name;
    siteData.mirror = host;
    siteData.tags = siteInfo.value.tags.split(','); // string[]
  }
  let passkey = getPasskey()
  console.log("passkey抓取结果：", passkey)
  if (passkey != false) {
    siteData.passkey = passkey;
  }
  let time_join = getTimeJoin()
  console.log("注册时间抓取结果：", time_join)
  if (time_join != false) {
    siteData.time_join = time_join;
  }
  let username = getUsername()
  console.log("用户名抓取结果：", username)
  if (username != false) {
    siteData.username = username;
  }
  let email = getEmail()
  console.log("注册邮箱抓取结果：", email)
  if (email != false) {
    siteData.email = email;
  }

  console.log('最终站点数据:', siteData);
  return CommonResponse.success(siteData)
}


/**
 * 保存站点信息到收割机
 */
async function syncCookie() {
  // 1. 获取站点信息
  // 2. 获取同步所需信息
  let data: CommonResponse<any> = await getSiteData();
  if (!data.succeed) {
    message.error(data.msg)
    return
  }
  console.log(data)
  // 3. 同步信息
  await doSendSiteInfo(data.data, {
    closeTabOnSuccess: mySiteId.value === 0,
  });
}

const siteDataFieldLabels: Record<string, string> = {
  id: '站点 ID',
  site: '站点标识',
  user_id: '用户 ID',
  username: '用户名',
  email: '邮箱',
  passkey: 'PassKey',
  time_join: '注册时间',
  nickname: '站点昵称',
  mirror: '镜像地址',
  tags: '标签',
  cookie: 'Cookie',
  user_agent: 'User Agent',
}

const siteDataPrimaryKeys = ['id', 'site', 'user_id', 'username', 'email', 'time_join', 'nickname', 'mirror', 'tags']
const siteDataSecretKeys = ['passkey', 'cookie']
const siteDataAlwaysPlainKeys = ['site', 'user_agent']
const siteDataEnvKeys = ['user_agent']

const formatSiteDataValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

const encryptSiteDataValue = (value: any) => {
  const text = formatSiteDataValue(value)
  if (text === '-') {
    return text
  }
  if (text.length <= 8) {
    return '*'.repeat(text.length)
  }
  return `${text.slice(0, 4)}${'*'.repeat(Math.min(text.length - 8, 24))}${text.slice(-4)}`
}

const formatSiteDataDisplayValue = (key: string, value: any) => {
  return siteDataEncrypted.value && !siteDataAlwaysPlainKeys.includes(key)
      ? encryptSiteDataValue(value)
      : formatSiteDataValue(value)
}

const getSiteDataTitle = () => {
  const site = siteDataPreview.value.site || siteInfo.value?.name || '-'
  return formatSiteDataValue(site)
}

const getSiteDataFields = (keys: string[]) => {
  return keys
      .filter(key => Object.prototype.hasOwnProperty.call(siteDataPreview.value, key))
      .map(key => ({
        key,
        label: siteDataFieldLabels[key] ?? key,
        value: formatSiteDataDisplayValue(key, siteDataPreview.value[key]),
      }))
}

const showSiteDataModal = async () => {
  siteDataLoading.value = true
  siteDataModalVisible.value = true
  siteDataEncrypted.value = true
  try {
    const res: CommonResponse<any> = await getSiteData()
    if (!res.succeed) {
      message.error(res.msg)
      siteDataPreview.value = {}
      return
    }
    siteDataPreview.value = res.data
  } finally {
    siteDataLoading.value = false
  }
}

const toggleSiteDataEncrypted = () => {
  siteDataEncrypted.value = !siteDataEncrypted.value
  message.success(siteDataEncrypted.value ? '抓取信息已加密显示' : '抓取信息已解密显示')
}

const syncSiteData = async () => {
  siteDataSyncLoading.value = true
  try {
    await syncCookie()
  } finally {
    siteDataSyncLoading.value = false
  }
}

function xpath(query: string, node: Node) {
  return document.evaluate(query, node, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

/**
 * 抓取种子列表页
 */
const torrents = ref<ExtractedTorrent[]>([])
const resetTorrentListControls = () => {
  torrentSearchKey.value = ''
  torrentSaleFilter.value = []
  torrentTagFilter.value = []
  torrentCategoryFilter.value = []
  torrentSortKey.value = 'seeders'
  torrentSortOrder.value = 'descend'
  downloaderPanelVisible.value = false
  pushModalVisible.value = false
  selectedTorrentKeys.value = []
  url_list.value = []
}

const normalizeTorrentText = (value: unknown) => String(value ?? '').trim()

type ExtractedTorrent = {
  key: string
  tid: string
  site_id: number | string
  title: string
  subtitle: string
  detailUrl: string
  magnetUrl: string
  primaryUrl: string
  category: string
  poster: string
  size: string
  progress: string
  hr: string | boolean
  sale_status: string
  sale_expire: string
  published: string
  seeders: string
  leechers: string
  completers: string
  page_tags: string[]
  tags: string[]
  hash_string?: string
  douban_url?: string
  imdb_url?: string
  files_count?: string
}

const ruleVariants = (rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  const raw = normalizeTorrentText(rule)
  if (!raw) {
    return []
  }
  const values = new Set<string>()
  const push = (value: string) => {
    const text = normalizeTorrentText(value)
    if (text) {
      values.add(text)
    }
  }
  const removeTbody = (value: string) => value.replace(/\/tbody(?=\/|$)/gi, '')
  const addTbody = (value: string) => value.replace(
      /(\/table(?:\[[^\]]+])?)(?=\/tr(?:\[[^\]]+])?(?:\/|$))/gi,
      '$1/tbody',
  )

  push(raw)
  if (options.tbody) {
    push(removeTbody(raw))
    push(addTbody(raw))
    push(addTbody(removeTbody(raw)))
  }
  return [...values]
}

const readNodeValue = (node: Node | null) => {
  if (!node) {
    return ''
  }
  if (
      node.nodeType === Node.ATTRIBUTE_NODE ||
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.CDATA_SECTION_NODE
  ) {
    return normalizeTorrentText(node.nodeValue)
  }
  if (node instanceof HTMLAnchorElement) {
    return normalizeTorrentText(node.getAttribute('href') || node.href || node.textContent)
  }
  if (node instanceof HTMLImageElement) {
    return normalizeTorrentText(node.getAttribute('src') || node.src)
  }
  return normalizeTorrentText(node.textContent)
}

const readDisplayNodeValue = (node: Node | null) => {
  if (!node) {
    return ''
  }
  if (
      node.nodeType === Node.ATTRIBUTE_NODE ||
      node.nodeType === Node.TEXT_NODE ||
      node.nodeType === Node.CDATA_SECTION_NODE
  ) {
    return normalizeTorrentText(node.nodeValue)
  }
  if (node instanceof HTMLImageElement) {
    return normalizeTorrentText(node.alt)
        || normalizeTorrentText(node.title)
        || normalizeTorrentText(node.getAttribute('aria-label'))
        || readNodeValue(node)
  }
  if (node instanceof HTMLElement) {
    return normalizeTorrentText(node.textContent)
        || normalizeTorrentText(node.title)
        || normalizeTorrentText(node.getAttribute('aria-label'))
        || readNodeValue(node)
  }
  return normalizeTorrentText(node.textContent || readNodeValue(node))
}

const absoluteUrl = (value: unknown) => {
  const text = normalizeTorrentText(value)
  if (!text) {
    return ''
  }
  try {
    return new URL(text, window.location.href).toString()
  } catch {
    return text
  }
}

const evaluateNodes = (contextNode: Node, rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  if (!rule) {
    return []
  }
  for (const candidate of ruleVariants(rule, options)) {
    try {
      const result = document.evaluate(candidate, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      const nodes: Node[] = []
      for (let i = 0; i < result.snapshotLength; i += 1) {
        const node = result.snapshotItem(i)
        if (node) {
          nodes.push(node)
        }
      }
      if (nodes.length > 0) {
        return nodes
      }
    } catch {
      // Ignore invalid site rules and try the next variant.
    }
  }
  return []
}

const evaluateValue = (contextNode: Node, rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  if (!rule) {
    return ''
  }
  for (const candidate of ruleVariants(rule, options)) {
    try {
      const result = document.evaluate(candidate, contextNode, null, XPathResult.ANY_TYPE, null)
      if (result.resultType === XPathResult.STRING_TYPE) {
        const value = normalizeTorrentText(result.stringValue)
        if (value) {
          return value
        }
        continue
      }
      if (result.resultType === XPathResult.NUMBER_TYPE) {
        if (Number.isFinite(result.numberValue)) {
          return String(result.numberValue)
        }
        continue
      }
      if (result.resultType === XPathResult.BOOLEAN_TYPE) {
        if (result.booleanValue) {
          return 'true'
        }
        continue
      }
      const node = result.singleNodeValue || result.iterateNext?.()
      const value = readNodeValue(node)
      if (value) {
        return value
      }
    } catch {
      // Ignore invalid site rules and try the next variant.
    }
  }
  const nodes = evaluateNodes(contextNode, rule, options)
  return nodes.length > 0 ? readNodeValue(nodes[0]) : ''
}

const evaluateJoinedValue = (contextNode: Node, rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  const nodes = evaluateNodes(contextNode, rule, options)
  if (nodes.length > 1) {
    return nodes
        .map(node => readNodeValue(node))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
  }
  return evaluateValue(contextNode, rule, options)
}

const evaluateDisplayValue = (contextNode: Node, rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  const nodes = evaluateNodes(contextNode, rule, options)
  if (nodes.length > 0) {
    const value = readDisplayNodeValue(nodes[0])
    if (value) {
      return value
    }
  }
  return evaluateValue(contextNode, rule, options)
}

const evaluateDisplayList = (contextNode: Node, rule: string | null | undefined, options: { tbody?: boolean } = {}) => {
  const nodes = evaluateNodes(contextNode, rule, options)
  if (nodes.length > 0) {
    return nodes.map(node => readDisplayNodeValue(node)).filter(Boolean)
  }
  const value = evaluateDisplayValue(contextNode, rule, options)
  return value
      .split(/[,，/|]/)
      .map(item => item.trim())
      .filter(Boolean)
}

const extractTorrentIdFromUrl = (value: string) => {
  const text = normalizeTorrentText(value)
  if (!text) {
    return ''
  }
  try {
    const url = new URL(text, location.href)
    for (const key of ['tid', 'id', 'torrentid', 'topicid']) {
      const id = url.searchParams.get(key)
      if (id) {
        return id
      }
    }
    const pathMatch = url.pathname.match(/(?:t[-/]|detail\/|torrent\/)([0-9a-f-]{8,}|\d+)/i)
    if (pathMatch?.[1]) {
      return pathMatch[1]
    }
  } catch {
    // Fall back to regex below.
  }
  return text.match(/(?:[?&](?:tid|id|torrentid|topicid)=|t[-/]|detail\/|torrent\/)([^&#/]+)/i)?.[1] || ''
}

const buildDownloadUrl = (tid: string) => {
  if (!tid || !siteInfo.value?.page_download) {
    return ''
  }
  const pageDownload = String(siteInfo.value.page_download)
  let url = pageDownload.replace('{}', tid)
  if (url.includes('{}')) {
    url = url.replace('&passkey={}', '').replace('?passkey={}', '')
  }
  return absoluteUrl(url)
}

const formatCategory = (value: unknown) => normalizeTorrentText(value)
    .replace(/\s+/g, ' ')
    .replace(/\s*[/|>]+\s*/g, ' · ')
    .replace(/_/g, ' ')
    .replace(/\s*-\s*/g, ' · ')
    .replace(/\s*·\s*/g, ' · ')
    .trim()

const createTorrentKey = (torrent: Partial<ExtractedTorrent>, index = 0) => {
  return [
    torrent.tid,
    torrent.magnetUrl,
    torrent.detailUrl,
    torrent.title,
    index,
  ].map(item => normalizeTorrentText(item)).find(Boolean) || `torrent-${index}`
}

const normalizeExtractedTorrent = (item: Partial<ExtractedTorrent>, index = 0): ExtractedTorrent => {
  const detailUrl = absoluteUrl(item.detailUrl)
  const magnetUrl = absoluteUrl(item.magnetUrl)
  const tid = normalizeTorrentText(item.tid || extractTorrentIdFromUrl(detailUrl || magnetUrl))
  const fallbackDownloadUrl = buildDownloadUrl(tid)
  const primaryUrl = magnetUrl || fallbackDownloadUrl || detailUrl
  const rawPageTags = Array.isArray(item.page_tags)
      ? item.page_tags.map(tag => normalizeTorrentText(tag)).filter(Boolean)
      : []
  const fallbackTags = Array.isArray(item.tags)
      ? item.tags.map(tag => normalizeTorrentText(tag)).filter(Boolean)
      : []
  const pageTags = rawPageTags.length > 0 ? rawPageTags : fallbackTags
  const key = normalizeTorrentText(item.key) || createTorrentKey({tid, magnetUrl, detailUrl, title: item.title}, index)
  const rawSaleExpire = normalizeTorrentText(item.sale_expire)
  const saleExpire = extractSaleExpireText(rawSaleExpire)
      || normalizeSaleExpireText(rawSaleExpire)
      || extractSaleExpireText(item.sale_status, pageTags)
  const saleStatus = cleanSaleStatusText(item.sale_status, saleExpire)

  return {
    key,
    tid,
    site_id: item.site_id || mySiteId.value || siteInfo.value?.name || '',
    title: normalizeTorrentText(item.title),
    subtitle: normalizeTorrentText(item.subtitle),
    detailUrl,
    magnetUrl,
    primaryUrl,
    category: formatCategory(item.category),
    poster: absoluteUrl(item.poster),
    size: normalizeTorrentText(item.size),
    progress: normalizeTorrentText(item.progress),
    hr: item.hr ?? '',
    sale_status: saleStatus || '无优惠',
    sale_expire: saleExpire,
    published: normalizeTorrentText(item.published),
    seeders: normalizeTorrentText(item.seeders),
    leechers: normalizeTorrentText(item.leechers),
    completers: normalizeTorrentText(item.completers),
    page_tags: pageTags,
    tags: [...pageTags, siteInfo.value?.name].filter(Boolean),
    hash_string: normalizeTorrentText(item.hash_string),
    douban_url: normalizeTorrentText(item.douban_url),
    imdb_url: normalizeTorrentText(item.imdb_url),
    files_count: normalizeTorrentText(item.files_count),
  }
}

const hasPushableTorrentUrl = (torrent: ExtractedTorrent) => Boolean(torrent.primaryUrl || torrent.detailUrl)

const getTorrentTags = (torrent: any) => {
  const sourceTags = Array.isArray(torrent.page_tags) && torrent.page_tags.length > 0
      ? torrent.page_tags
      : torrent.tags
  const siteName = normalizeTorrentText(siteInfo.value?.name)
  const tags = Array.isArray(sourceTags) ? sourceTags : [sourceTags]
  return tags
      .flatMap((tag: unknown) => normalizeTorrentText(tag).split(/[,，/|]/))
      .map((tag: string) => tag.trim())
      .filter(tag => tag && tag !== siteName)
}

const getUniqueTorrentValues = (values: string[]) => {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', {numeric: true}))
}

const normalizeSaleExpireText = (value: unknown) => normalizeTorrentText(value)
    .replace(/^[:：,\s-]+/, '')
    .replace(/[）)\]】。；;,\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

const extractSaleExpireText = (...values: unknown[]) => {
  const text = values
      .flatMap(value => Array.isArray(value) ? value : [value])
      .map(value => normalizeTorrentText(value))
      .filter(Boolean)
      .join(' ')
  if (!text) {
    return ''
  }

  const datePattern = String.raw`\d{4}\s*[-/.年]\s*\d{1,2}\s*[-/.月]\s*\d{1,2}\s*(?:[日号]?\s*\d{1,2}\s*[:：]\s*\d{2}(?:\s*[:：]\s*\d{2})?)?`
  const shortDatePattern = String.raw`\d{1,2}\s*[-/.月]\s*\d{1,2}\s*(?:[日号]?\s*\d{1,2}\s*[:：]\s*\d{2})?`
  const relativePattern = String.raw`(?:\d+(?:\.\d+)?\s*(?:天|日|小时|时|分钟|分|day|days|hour|hours|minute|minutes)\s*)+`
  const expireHints = String.raw`(?:优惠|免费|促销|折扣|限时|到期|过期|有效期|剩余|还有|expire|expires|until|deadline|left)`
  const patterns = [
    new RegExp(`${expireHints}[^\\d]*((${datePattern})|(${relativePattern}))`, 'i'),
    new RegExp(`(${datePattern})`, 'i'),
    new RegExp(`${expireHints}[^\\d]*((${shortDatePattern})|(${relativePattern}))`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return normalizeSaleExpireText(match[1])
    }
  }
  return ''
}

const cleanSaleStatusText = (saleStatus: unknown, saleExpire: string) => {
  let text = normalizeTorrentText(saleStatus)
  if (!text) {
    return saleExpire ? '限时优惠' : ''
  }
  if (saleExpire) {
    text = text.replace(saleExpire, '')
  }
  text = text
      .replace(/\d{4}\s*[-/.年]\s*\d{1,2}\s*[-/.月]\s*\d{1,2}\s*(?:[日号]?\s*\d{1,2}\s*[:：]\s*\d{2}(?:\s*[:：]\s*\d{2})?)?/g, '')
      .replace(/(?:剩余|还有|left)\s*(?:\d+(?:\.\d+)?\s*(?:天|日|小时|时|分钟|分|day|days|hour|hours|minute|minutes)\s*)+/gi, '')
      .replace(/(?:优惠|免费|促销|折扣|限时)?(?:到期|到|至|有效期|expires?|until|deadline)\s*(?:时间)?\s*[:：-]?/gi, '')
      .replace(/[()（）【】\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  return text || (saleExpire ? '限时优惠' : '')
}

const torrentSaleOptions = computed(() => getUniqueTorrentValues(
    torrents.value.map((torrent: ExtractedTorrent) => normalizeTorrentText(torrent.sale_status))
))

const torrentCategoryOptions = computed(() => getUniqueTorrentValues(
    torrents.value.map((torrent: ExtractedTorrent) => normalizeTorrentText(torrent.category))
))

const torrentTagOptions = computed(() => getUniqueTorrentValues(
    torrents.value.flatMap((torrent: ExtractedTorrent) => getTorrentTags(torrent))
))

type TorrentFilterType = 'sale' | 'category' | 'tag'

const torrentSortOptions: Array<{ key: string; label: string; defaultOrder: 'ascend' | 'descend' }> = [
  {key: 'seeders', label: '做种人数', defaultOrder: 'descend'},
  {key: 'size', label: '大小', defaultOrder: 'descend'},
  {key: 'title', label: '标题', defaultOrder: 'ascend'},
  {key: 'sale_status', label: '优惠', defaultOrder: 'ascend'},
]

const toggleTorrentFilter = (type: TorrentFilterType, value: string) => {
  const target = type === 'sale'
      ? torrentSaleFilter
      : type === 'category'
          ? torrentCategoryFilter
          : torrentTagFilter
  target.value = target.value.includes(value)
      ? target.value.filter(item => item !== value)
      : [...target.value, value]
  syncSelectionToCurrentFilter()
}

const clearTorrentFilter = (type: TorrentFilterType) => {
  const target = type === 'sale'
      ? torrentSaleFilter
      : type === 'category'
          ? torrentCategoryFilter
          : torrentTagFilter
  target.value = []
  syncSelectionToCurrentFilter()
}

const setTorrentSort = (key: string, defaultOrder: 'ascend' | 'descend' = 'descend') => {
  if (torrentSortKey.value === key) {
    torrentSortOrder.value = torrentSortOrder.value === 'ascend' ? 'descend' : 'ascend'
    return
  }
  torrentSortKey.value = key
  torrentSortOrder.value = defaultOrder
}

const getTorrentFilterLabel = (label: string, values: string[]) => values.length > 0
    ? `${label}（${values.length}）`
    : label

const getTorrentSortLabel = () => {
  const labels: Record<string, string> = {
    title: '标题',
    subtitle: '副标题',
    seeders: '做种人数',
    leechers: '下载人数',
    size: '种子大小',
    category: '分类',
    sale_status: '优惠状态',
  }
  return labels[torrentSortKey.value] || '做种人数'
}

const isFreeTorrent = (torrent: any) => {
  const saleStatus = normalizeTorrentText(torrent.sale_status).toLowerCase()
  return ['free', '免费', '100%', '0x'].some(keyword => saleStatus.includes(keyword))
}

const parseTorrentNumber = (value: unknown) => {
  const text = normalizeTorrentText(value).replace(/,/g, '')
  const match = text.match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

const parseTorrentSize = (value: unknown) => {
  const text = normalizeTorrentText(value).replace(/,/g, '')
  const match = text.match(/([\d.]+)\s*([KMGTPE]?i?B|[KMGTPE])?/i)
  if (!match) {
    return 0
  }
  const number = Number(match[1])
  const unit = (match[2] || 'B').toUpperCase().replace('IB', 'B')
  const unitPowerMap: Record<string, number> = {
    B: 0,
    K: 1,
    KB: 1,
    M: 2,
    MB: 2,
    G: 3,
    GB: 3,
    T: 4,
    TB: 4,
    P: 5,
    PB: 5,
    E: 6,
    EB: 6,
  }
  return number * Math.pow(1024, unitPowerMap[unit] ?? 0)
}

const getTorrentSortValue = (torrent: any) => {
  switch (torrentSortKey.value) {
    case 'title':
      return normalizeTorrentText(torrent.title).toLowerCase()
    case 'subtitle':
      return normalizeTorrentText(torrent.subtitle).toLowerCase()
    case 'seeders':
      return parseTorrentNumber(torrent.seeders)
    case 'leechers':
      return parseTorrentNumber(torrent.leechers)
    case 'size':
      return parseTorrentSize(torrent.size)
    case 'category':
      return normalizeTorrentText(torrent.category).toLowerCase()
    case 'sale_status':
      return normalizeTorrentText(torrent.sale_status).toLowerCase()
    default:
      return parseTorrentNumber(torrent.seeders)
  }
}

const filteredTorrents = computed(() => {
  const searchKey = torrentSearchKey.value.trim().toLowerCase()
  const baseList = downloadMode.value === 'free'
      ? torrents.value.filter((torrent: ExtractedTorrent) => isFreeTorrent(torrent))
      : [...torrents.value]

  return baseList
      .filter((torrent: ExtractedTorrent) => {
        if (!searchKey) {
          return true
        }
        return [
          torrent.title,
          torrent.subtitle,
        ].some(value => normalizeTorrentText(value).toLowerCase().includes(searchKey))
      })
      .filter((torrent: ExtractedTorrent) => {
        if (torrentSaleFilter.value.length <= 0) {
          return true
        }
        return torrentSaleFilter.value.includes(normalizeTorrentText(torrent.sale_status))
      })
      .filter((torrent: ExtractedTorrent) => {
        if (torrentCategoryFilter.value.length <= 0) {
          return true
        }
        return torrentCategoryFilter.value.includes(normalizeTorrentText(torrent.category))
      })
      .filter((torrent: ExtractedTorrent) => {
        if (torrentTagFilter.value.length <= 0) {
          return true
        }
        const tags = getTorrentTags(torrent)
        return torrentTagFilter.value.every(tag => tags.includes(tag))
      })
      .sort((a: ExtractedTorrent, b: ExtractedTorrent) => {
        const aValue = getTorrentSortValue(a)
        const bValue = getTorrentSortValue(b)
        const order = torrentSortOrder.value === 'ascend' ? 1 : -1
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * order
        }
        return String(aValue).localeCompare(String(bValue), 'zh-Hans-CN', {numeric: true}) * order
      })
})

const pushableFilteredTorrents = computed(() => filteredTorrents.value.filter((torrent: ExtractedTorrent) => hasPushableTorrentUrl(torrent)))

const selectedTorrents = computed(() => {
  const selected = new Set(selectedTorrentKeys.value)
  return torrents.value.filter((torrent: ExtractedTorrent) => selected.has(torrent.key) && hasPushableTorrentUrl(torrent))
})

const pushSelectedDownloader = computed(() => {
  return downloaders.value?.find(item => item.id === pushSelectedDownloaderId.value) || downloaders.value?.[0]
})

const pushIsQb = computed(() => String(pushSelectedDownloader.value?.category || '').toLowerCase().includes('qb'))

const pushDefaultTags = computed(() => getUniqueTorrentValues([
  siteInfo.value?.name || '',
  'harvest-monkey',
].map(tag => normalizeTorrentText(tag))))

const pushAvailableTags = computed(() => {
  return getUniqueTorrentValues([
    ...selectedTorrents.value.flatMap((torrent: ExtractedTorrent) => torrent.tags || []),
    ...pushDefaultTags.value,
  ].map(tag => normalizeTorrentText(tag)))
})

const selectedTorrentPreview = computed(() => selectedTorrents.value[0])

const getPreparedTorrentIds = () => pushableFilteredTorrents.value
    .map((torrent: ExtractedTorrent) => normalizeTorrentText(torrent.primaryUrl || torrent.detailUrl))
    .filter(Boolean)

const getSelectedTorrentIds = () => selectedTorrents.value
    .map((torrent: ExtractedTorrent) => normalizeTorrentText(torrent.primaryUrl || torrent.detailUrl))
    .filter(Boolean)

const syncSelectionToCurrentFilter = () => {
  selectedTorrentKeys.value = pushableFilteredTorrents.value.map((torrent: ExtractedTorrent) => torrent.key)
}

const toggleTorrentSelection = (torrent: ExtractedTorrent) => {
  if (!hasPushableTorrentUrl(torrent)) {
    return
  }
  const selected = new Set(selectedTorrentKeys.value)
  if (selected.has(torrent.key)) {
    selected.delete(torrent.key)
  } else {
    selected.add(torrent.key)
  }
  selectedTorrentKeys.value = [...selected]
}

const selectAllTorrents = () => {
  selectedTorrentKeys.value = torrents.value
      .filter((torrent: ExtractedTorrent) => hasPushableTorrentUrl(torrent))
      .map((torrent: ExtractedTorrent) => torrent.key)
}

const invertVisibleTorrents = () => {
  const selected = new Set(selectedTorrentKeys.value)
  pushableFilteredTorrents.value.forEach((torrent: ExtractedTorrent) => {
    if (selected.has(torrent.key)) {
      selected.delete(torrent.key)
    } else {
      selected.add(torrent.key)
    }
  })
  selectedTorrentKeys.value = [...selected]
}

const clearTorrentSelection = () => {
  selectedTorrentKeys.value = []
}

const clearTorrentFilters = () => {
  torrentSearchKey.value = ''
  torrentSaleFilter.value = []
  torrentCategoryFilter.value = []
  torrentTagFilter.value = []
  syncSelectionToCurrentFilter()
}

const handleTorrentSelectionMenu = ({key}: { key: string }) => {
  switch (key) {
    case 'current':
      syncSelectionToCurrentFilter()
      break
    case 'all':
      selectAllTorrents()
      break
    case 'invert':
      invertVisibleTorrents()
      break
    case 'clear':
      clearTorrentSelection()
      break
  }
}

const prepareTorrentPush = async () => {
  if (selectedTorrentKeys.value.length <= 0) {
    syncSelectionToCurrentFilter()
  }
  url_list.value = getSelectedTorrentIds()
  if (url_list.value.length <= 0) {
    downloaderPanelVisible.value = false
    message.warning('当前没有可推送的种子')
    return
  }

  await ensureTorrentCookie()
  resetPushSheetState()
  downloaderPanelVisible.value = true
  pushModalVisible.value = true
  const downloaderId = downloaders.value?.[0]?.id
  if (downloaderId) {
    await selectPushDownloader(downloaderId)
  }
}

const getTorrentCardTitle = (torrent: any) => {
  return normalizeTorrentText(torrent.title) || `种子 ${normalizeTorrentText(torrent.tid)}`
}

const ensureTorrentCookie = async () => {
  if (cookie.value) {
    return
  }
  if (location.host.includes('m-team')) {
    cookie.value = localStorage.getItem('auth') || ''
    return
  }
  const cookieResponse = await getCookieString(location.host)
  if (cookieResponse.succeed) {
    cookie.value = cookieResponse.data
  }
}

const handleDownloaderPanelChange = async (key: number | string | Array<number | string>) => {
  const rawKey = Array.isArray(key) ? key[0] : key
  const downloaderId = Number(rawKey)
  if (!Number.isFinite(downloaderId) || downloaderId <= 0) {
    return
  }
  activeKey.value = downloaderId
  await selectPushDownloader(downloaderId)
}

const resetPushSheetState = () => {
  pushSavePath.value = ''
  pushSelectedCategory.value = null
  pushSelectedTags.value = selectedTorrents.value.length > 1
      ? pushDefaultTags.value
      : pushAvailableTags.value
  pushCustomTag.value = ''
  pushPaused.value = false
  pushAdvancedExpanded.value = false
  pushSkipChecking.value = false
  pushForced.value = false
  pushAutoManagement.value = false
  pushCreateSubfolder.value = false
  pushSequentialDownload.value = false
  pushFirstLastPiecePriority.value = false
  pushAddToTop.value = false
  pushContentLayout.value = 'Original'
  pushRename.value = ''
  pushUploadLimit.value = ''
  pushDownloadLimit.value = ''
  pushRatioLimit.value = ''
  pushSeedingTimeLimit.value = ''
  pushStopCondition.value = null
  pushShareLimitAction.value = null
}

const selectPushDownloader = async (downloaderId: number) => {
  pushSelectedDownloaderId.value = downloaderId
  activeKey.value = downloaderId
  categories.value = []
  pushSelectedCategory.value = null
  pushSavePath.value = ''
  await getDownloaderCategoryList(downloaderId)
}

const selectPushCategory = (category: Category) => {
  if (pushSelectedCategory.value === category.name) {
    pushSelectedCategory.value = null
    pushSavePath.value = ''
    return
  }
  pushSelectedCategory.value = category.name
  pushSavePath.value = category.savePath || ''
}

const togglePushTag = (tag: string) => {
  pushSelectedTags.value = pushSelectedTags.value.includes(tag)
      ? pushSelectedTags.value.filter(item => item !== tag)
      : [...pushSelectedTags.value, tag]
}

const addCustomPushTags = () => {
  const tags = pushCustomTag.value
      .split(/[,，;；\s]+/)
      .map(tag => tag.trim())
      .filter(Boolean)
  if (tags.length <= 0) {
    return
  }
  pushSelectedTags.value = getUniqueTorrentValues([...pushSelectedTags.value, ...tags])
  pushCustomTag.value = ''
}

const buildPushSheetOptions = () => {
  const options: Record<string, any> = {
    tags: pushSelectedTags.value,
    is_paused: pushPaused.value,
    is_skip_checking: pushSkipChecking.value,
  }
  if (pushRename.value.trim()) {
    options.rename = pushRename.value.trim()
  }
  if (pushUploadLimit.value.trim()) {
    const value = Number(pushUploadLimit.value.trim())
    if (Number.isFinite(value) && value > 0) {
      options.upload_limit = value
    }
  }
  if (pushDownloadLimit.value.trim()) {
    const value = Number(pushDownloadLimit.value.trim())
    if (Number.isFinite(value) && value > 0) {
      options.download_limit = value
    }
  }
  if (pushRatioLimit.value.trim()) {
    const value = Number(pushRatioLimit.value.trim())
    if (Number.isFinite(value)) {
      options.ratio_limit = value
    }
  }
  if (pushSeedingTimeLimit.value.trim()) {
    const value = Number(pushSeedingTimeLimit.value.trim())
    if (Number.isFinite(value) && value > 0) {
      options.seeding_time_limit = value
    }
  }
  if (pushIsQb.value) {
    options.use_auto_torrent_management = pushAutoManagement.value
    options.is_root_folder = pushCreateSubfolder.value
    options.is_sequential_download = pushSequentialDownload.value
    options.is_first_last_piece_priority = pushFirstLastPiecePriority.value
    options.add_to_top_of_queue = pushAddToTop.value
    options.content_layout = pushContentLayout.value
    options.forced = pushForced.value
    if (pushStopCondition.value) {
      options.stop_condition = pushStopCondition.value
    }
    if (pushShareLimitAction.value) {
      options.share_limit_action = pushShareLimitAction.value
    }
  }
  return options
}

const submitPushSheet = async () => {
  const downloader = pushSelectedDownloader.value
  if (!downloader) {
    message.warning('请选择下载器')
    return
  }
  pushSubmitting.value = true
  try {
    await push_torrent(downloader.id, pushSelectedCategory.value || '', pushSavePath.value || null, buildPushSheetOptions())
  } finally {
    pushSubmitting.value = false
  }
}

async function get_torrent_id_list() {
  await get_torrent_list()
}

async function get_torrent_list() {
  const rows = evaluateNodes(document, siteInfo.value.torrents_rule, {tbody: true})
  console.log('获取到种子数量：', rows.length)
  torrents.value = rows
      .map((row, index) => {
        const detailUrl = absoluteUrl(evaluateValue(row, siteInfo.value.torrent_detail_url_rule))
        const magnetUrl = absoluteUrl(evaluateValue(row, siteInfo.value.torrent_magnet_url_rule))
        const tags = evaluateDisplayList(row, siteInfo.value.torrent_tags_rule)

        return normalizeExtractedTorrent({
          title: evaluateValue(row, siteInfo.value.torrent_title_rule),
          subtitle: evaluateValue(row, siteInfo.value.torrent_subtitle_rule),
          detailUrl,
          magnetUrl,
          category: evaluateDisplayValue(row, siteInfo.value.torrent_category_rule),
          poster: evaluateValue(row, siteInfo.value.torrent_poster_rule),
          size: evaluateJoinedValue(row, siteInfo.value.torrent_size_rule),
          progress: evaluateValue(row, siteInfo.value.torrent_progress_rule),
          hr: evaluateValue(row, siteInfo.value.torrent_hr_rule),
          sale_status: evaluateDisplayValue(row, siteInfo.value.torrent_sale_rule),
          sale_expire: evaluateDisplayValue(row, siteInfo.value.torrent_sale_expire_rule),
          published: evaluateValue(row, siteInfo.value.torrent_release_rule),
          seeders: evaluateValue(row, siteInfo.value.torrent_seeders_rule),
          leechers: evaluateValue(row, siteInfo.value.torrent_leechers_rule),
          completers: evaluateValue(row, siteInfo.value.torrent_completers_rule),
          page_tags: tags,
          site_id: siteInfo.value.name,
        }, index)
      })
      .filter(torrent => torrent.title || torrent.detailUrl || torrent.magnetUrl || torrent.primaryUrl)
  selectAllTorrents()
  console.log(torrents.value)
}

/**
 * 抓取种子详情页
 */
async function get_torrent_detail() {
  const tags = evaluateDisplayList(document, siteInfo.value.detail_tags_rule)
  const hashText = evaluateValue(document, siteInfo.value.detail_hash_rule)
  const filesCountText = evaluateValue(document, siteInfo.value.detail_count_files_rule)
  const torrent = normalizeExtractedTorrent({
    tid: extractTorrentIdFromUrl(location.href),
    site_id: mySiteId.value,
    title: evaluateValue(document, siteInfo.value.detail_title_rule),
    subtitle: evaluateValue(document, siteInfo.value.detail_subtitle_rule),
    detailUrl: location.href,
    magnetUrl: evaluateValue(document, siteInfo.value.detail_download_url_rule),
    size: evaluateValue(document, siteInfo.value.detail_size_rule),
    category: evaluateDisplayValue(document, siteInfo.value.detail_category_rule),
    hr: evaluateValue(document, siteInfo.value.detail_hr_rule),
    sale_expire: evaluateDisplayValue(document, siteInfo.value.detail_free_expire_rule),
    sale_status: evaluateDisplayValue(document, siteInfo.value.detail_free_rule),
    douban_url: evaluateValue(document, siteInfo.value.detail_douban_rule),
    imdb_url: evaluateValue(document, siteInfo.value.detail_imdb_rule),
    files_count: filesCountText.match(/\d+/g)?.[0] || filesCountText,
    hash_string: hashText.match(/[0-9a-f]{40}/i)?.[0] || hashText,
    poster: evaluateValue(document, siteInfo.value.detail_poster_rule),
    page_tags: tags,
  }, 0)
  torrents.value = [torrent].filter(item => item.title || item.detailUrl || item.magnetUrl || item.primaryUrl)
  selectAllTorrents()
}

/**
 * 获取下载器分类列表
 */
async function getDownloaderCategoryList(downloaderId: number) {

  if (!downloaderId) {
    return;
  }
  if (categories.value) {
    categories.value.length = 0;
  }
  try {
    // 先测试连接
    const response: CommonResponse<any> = await testDownloader(downloaderId);
    console.log(response);

    if (!response.succeed) {
      message.error(response.msg);
      return
    } else {
      message.success(response.msg);
    }

    const res = await getDownloaderCategorise(downloaderId);
    console.log(res);

    if (!res || res.code !== 0) {
      message.error(res.msg);
    } else {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('获取下载器分类列表失败:', error);
    message.error('获取分类列表失败，请检查网络连接');
  }
}

/**
 * 生成下载链接
 */
const generate_magnet_url = async (flag: boolean) => {
  url_list.value.length = 0
  if (torrents.value.length <= 0) {
    return
  }
  console.log(flag)
  downloadMode.value = flag ? 'free' : downloadMode.value
  url_list.value = getPreparedTorrentIds()
  console.log(url_list.value)
}

/**
 * 推送种子到下载器
 */
const push_torrent = async (
    downloaderId: number,
    category: string,
    save_path: string | null,
    options: Record<string, any> = {},
) => {
  // await generate_magnet_url(false)
  url_list.value = getSelectedTorrentIds()
  console.log(url_list.value);
  if (url_list.value.length <= 0) {
    message.error('请先在种子列表中点击推送，选择要传递到下载器的种子');
    return;
  }

  try {
    const res = await pushTorrent(
        downloaderId,
        toRaw(mySiteId.value),
        category,
        toRaw(siteInfo.value.name),
	        toRaw(cookie.value),
	        save_path,
	        toRaw(url_list.value),
	        options,
	    );
    console.log(res);

    if (!res || res.code !== 0) {
      message.error(res.msg);
    } else {
      message.success(`种子已推送，请检查下载器！${res.msg}`);
    }
  } catch (error) {
    console.error('推送种子失败:', error);
    message.error('推送种子失败，请检查网络连接');
  } finally {
    pushModalVisible.value = false;
    downloaderPanelVisible.value = false;
    open.value = false;
  }
};


/**
 * 同步种子信息到 收割机
 */
const sync_torrents = async () => {
  try {
    const res = await syncTorrents(torrents.value as any, mySiteId.value,);
    console.log('种子信息同步结果！', res.msg);
    if (res.code === 0) {
      message.success('收割机 提醒您：' + res.msg)
    } else {
      message.error(res.msg);
    }
  } catch (error) {
    console.error("种子信息同步失败", error);
    message.error(`种子信息同步失败: ${error}`);
  }
};


/**
 * 辅种助手
 * 获取辅种嘻嘻
 */
async function repeat(tid: number) {
  console.log(siteInfo.value);
  if (siteInfo.value && siteInfo.value.iyuu > 0) {
    torrent_detail_repeat.value = true;
  }

  try {

    const res = await repeatInfo(tid, mySiteId.value);
    console.log(res);

    if (res.code !== 0) {
      message.warn(res.msg);
    } else {
      console.log('种子列表获取成功！', res);
      message.success(res.msg);
      repeat_info.value = res.data;
    }
  } catch (error) {
    console.error('获取种子列表失败:', error);
    message.error('网络请求失败，请检查连接');
  }
}

const getModalContainer = (id: string = 'modal-container') => {
  // 假设你的 shadow host 是 <harvest-ui>
  const shadowRoot = document.querySelector('harvest-ui')?.shadowRoot?.querySelector(`#${id}`)
  // 你也可以在 shadow DOM 中放一个 div#modal-container
  return shadowRoot || document.body
}

const getPopupContainer = () => getModalContainer()
</script>

<template>
  <div id="harvest-ext" ref="harvestWrap" :style="{
    top: `${topPosition}px`,
  }" class="harvest-wrap" @mouseenter="hover = true" @mouseleave="hover = false">
    <div id="message-container"></div>
    <div id="modal-container"></div>
    <div id="drawer-container"></div>
    <div class="harvest-img">
      <a-avatar :fallback="`${setting.baseUrl}favicon.ico`" :size="setting.imgSize"
                :src="`${setting.imgUrl ? setting.imgUrl : `${setting.baseUrl}favicon.ico`}`"
      />
      <DragOutlined class="move-item" @mousedown="onMouseDown"/>
    </div>
    <div v-if="hover" :style="{
      marginTop: `${Math.max(setting.imgSize / 1.5, 30)}px`
    }" class="harvest-menu">
      <div class="harvest-menu-header">
        <div class="harvest-menu-title">收割机</div>
        <a-tag class="harvest-page-tag" color="blue">
          {{ current_site_page ? sitePageLabels[current_site_page] : '当前站点' }}
        </a-tag>
      </div>
      <a-slider
          v-model:value="setting.imgSize"
          class="harvest-size-slider"
          :max="100"
          :min="36"
          @after-change="saveSetting"/>
      <a-button
          :href="setting.baseUrl" block
          class="harvest-action primary"
          size="small"
          target="_blank" type="link"
      >
        <template #icon>
          <ThunderboltOutlined/>
        </template>
        收割机
      </a-button>
      <a-button
          block danger
          class="harvest-action"
          size="small"
          type="text"
          @click="resetPosition"
      >
        <template #icon>
          <rollback-outlined/>
        </template>
        重新定位
      </a-button>
      <a-button
          block
          danger
          class="harvest-action"
          size="small"
          type="text"
          @click="clearCurrentCache">
        <template #icon>
          <ClearOutlined/>
        </template>
        清理缓存
      </a-button>
      <!--        <a-button-->
      <!--            v-if="user_detail_page && mySiteId == 0"-->
      <!--            block size="small"-->
      <!--            type="primary"-->
      <!--            @click="go_to_control_page">-->
      <!--          <template #icon>-->
      <!--            <SyncOutlined/>-->
      <!--          </template>-->
      <!--          同步数据-->
      <!--        </a-button>-->
      <a-button
          block
          class="harvest-action"
          size="small"
          type="text"
          @click="go_to_control_page">
        <template #icon>
          <SyncOutlined/>
        </template>
        同步数据
      </a-button>
      <a-button
          v-if="current_site_page === 'user' || current_site_page === 'control_panel'"
          block
          class="harvest-action"
          size="small"
          type="text"
          @click="showSiteDataModal">
        <template #icon>
          <EyeOutlined/>
        </template>
        查看信息
      </a-button>
      <a-button
          block
          class="harvest-action"
          size="small"
          type="text"
          @click="copyCookieString">
        <template #icon>
          <copy-outlined/>
        </template>
        获取Cookie
      </a-button>

      <a-button
          v-if="torrent_list_page && (downloaders?.length || 0) > 0  && mySiteId > 0"
          block
          class="harvest-action"
          size="small"
          type="text"
          @click="download_all"
      >
        <template #icon>
          <ArrowDownOutlined/>
        </template>
        下载种子
      </a-button>
      <!--        <a-button-->
      <!--            size="small" block-->
      <!--            v-if="torrent_list_page || torrent_detail_page"-->
      <!--            @click="sync_torrents"-->
      <!--        >-->
      <!--          <template #icon>-->
      <!--            <DownloadOutlined/>-->
      <!--          </template>-->
      <!--          sync-->
      <!--        </a-button>-->
      <!--        <a-button-->
      <!--            size="small" block-->
      <!--            v-if="torrent_list_page"-->
      <!--            @click="copy_all"-->
      <!--        >-->
      <!--          <template #icon>-->
      <!--            <CopyFilled/>-->
      <!--          </template>-->
      <!--          复制链接-->
      <!--        </a-button>-->
      <!--        <a-button-->
      <!--            size="small" block-->
      <!--            v-if="torrent_list_page"-->
      <!--            @click="copy_free"-->
      <!--        >-->
      <!--          <template #icon>-->
      <!--            <CopyOutlined/>-->
      <!--          </template>-->
      <!--          复制免费-->
      <!--        </a-button>-->
      <!--        <a-button-->
      <!--            size="small" block-->
      <!--            v-if="torrent_detail_page"-->
      <!--            @click="copy_link"-->
      <!--        >-->
      <!--          <template #icon>-->
      <!--            <CopyOutlined/>-->
      <!--          </template>-->
      <!--          复制链接-->
      <!--        </a-button>-->
      <a-button
          v-if="torrent_detail_page && mySiteId > 0" block
          class="harvest-action"
          size="small" type="text"
          @click="download_to">
        <template #icon>
          <DownloadOutlined/>
        </template>
        下载种子
      </a-button>
      <a-button
          v-if="torrent_detail_repeat && mySiteId > 0" block
          class="harvest-action"
          size="small" type="text"
          @click="drawer = true">
        <template #icon>
          <PushpinFilled/>
        </template>
        辅种助手
      </a-button>
      <!--      <a-space-compact direction="vertical">-->
      <!--        <a-button block @click="getDownloadersList">下载器列表</a-button>-->
      <!--        <a-button block @click="get_torrent_list">种子列表页</a-button>-->
      <!--        <a-button block @click="get_torrent_detail">种子详情页</a-button>-->
      <!--        <a-button block @click="generate_magnet_url(false)">组装URL</a-button>-->
      <!--        <a-button block @click="generate_magnet_url(true)">免费URL</a-button>-->
      <!--      </a-space-compact>-->
    </div>
    <a-modal
        v-model:visible="open"
        :bodyStyle="{ padding: 0 }"
        :closable="false"
        :get-container="getModalContainer"
        :title="modal_title"
        :width="760"
        wrap-class-name="harvest-modal-wrap torrent-modal-wrap"
    >
      <template #footer>
        <div class="torrent-list-action-bar">
          <div class="torrent-list-action-summary">
            已选 {{ selectedTorrents.length }} / 可推送 {{ pushableFilteredTorrents.length }}
          </div>
          <div class="torrent-list-action-buttons">
            <a-button class="torrent-list-cancel-button" @click="handleOk">关闭</a-button>
            <a-dropdown
                :get-popup-container="getPopupContainer"
                :trigger="['click']"
                overlay-class-name="torrent-selection-dropdown"
                placement="topRight">
              <template #overlay>
                <a-menu @click="handleTorrentSelectionMenu">
                  <a-menu-item key="current" :disabled="pushableFilteredTorrents.length <= 0">
                    选择当前
                  </a-menu-item>
                  <a-menu-item key="all" :disabled="torrents.length <= 0">
                    全选所有
                  </a-menu-item>
                  <a-menu-item key="invert" :disabled="pushableFilteredTorrents.length <= 0">
                    反选当前
                  </a-menu-item>
                  <a-menu-divider/>
                  <a-menu-item key="clear" :disabled="selectedTorrentKeys.length <= 0">
                    清空
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button class="torrent-list-select-button">
                <template #icon>
                  <CheckSquareOutlined/>
                </template>
                选择
                <ArrowDownOutlined/>
              </a-button>
            </a-dropdown>
            <a-button
                :disabled="selectedTorrents.length <= 0 && pushableFilteredTorrents.length <= 0"
                class="torrent-list-submit-button"
                type="primary"
                @click="prepareTorrentPush"
            >
              <template #icon>
                <SendOutlined/>
              </template>
              {{ torrents.length > 1 ? '推送已选' : '推送当前种子' }}（{{ selectedTorrents.length }}）
            </a-button>
          </div>
        </div>
      </template>
      <div class="torrent-push-panel">
        <div v-if="torrents.length > 1" class="torrent-toolbar">
          <a-input
              v-model:value="torrentSearchKey"
              allow-clear
              class="torrent-search"
              placeholder="搜索标题 / 副标题"
              size="middle"
          >
            <template #prefix>
              <SearchOutlined/>
            </template>
          </a-input>

          <div class="torrent-toolbar-meta">
            <div class="torrent-count">
              共 {{ torrents.length }} 条，当前 {{ filteredTorrents.length }} 条，可推送 {{ pushableFilteredTorrents.length }} 条，已选 {{ selectedTorrents.length }} 条
            </div>
          </div>

          <div class="torrent-filter-panel">
            <div class="torrent-filter-label">筛选</div>
            <a-popover
                :get-popup-container="getPopupContainer"
                overlay-class-name="torrent-filter-popover"
                trigger="click"
                placement="bottomLeft">
              <template #content>
                <div class="torrent-popover-card">
                  <div class="torrent-popover-title">排序</div>
                  <div class="torrent-popover-options">
                    <button
                        v-for="option in torrentSortOptions"
                        :key="option.key"
                        :class="{ active: torrentSortKey === option.key }"
                        class="torrent-popover-option"
                        type="button"
                        @click="setTorrentSort(option.key, option.defaultOrder)">
                      {{ option.label }}
                    </button>
                  </div>
                  <div class="torrent-popover-title secondary">方向</div>
                  <div class="torrent-popover-options two">
                    <button
                        :class="{ active: torrentSortOrder === 'descend' }"
                        class="torrent-popover-option"
                        type="button"
                        @click="torrentSortOrder = 'descend'">
                      降序
                    </button>
                    <button
                        :class="{ active: torrentSortOrder === 'ascend' }"
                        class="torrent-popover-option"
                        type="button"
                        @click="torrentSortOrder = 'ascend'">
                      升序
                    </button>
                  </div>
                </div>
              </template>
              <a-button size="small">
                排序：{{ getTorrentSortLabel() }}{{ torrentSortOrder === 'ascend' ? '↑' : '↓' }}
                <ArrowDownOutlined/>
              </a-button>
            </a-popover>

            <a-popover
                :get-popup-container="getPopupContainer"
                overlay-class-name="torrent-filter-popover"
                trigger="click"
                placement="bottomLeft">
              <template #content>
                <div class="torrent-popover-card">
                  <div class="torrent-popover-head">
                    <div class="torrent-popover-title">优惠</div>
                    <a-button size="small" type="link" @click="clearTorrentFilter('sale')">全部</a-button>
                  </div>
                  <div class="torrent-popover-options">
                    <button
                        v-for="sale in torrentSaleOptions"
                        :key="sale"
                        :class="{ active: torrentSaleFilter.includes(sale) }"
                        class="torrent-popover-option"
                        type="button"
                        @click="toggleTorrentFilter('sale', sale)">
                      {{ sale }}
                    </button>
                  </div>
                </div>
              </template>
              <a-button :disabled="torrentSaleOptions.length <= 0" size="small">
                {{ getTorrentFilterLabel('优惠', torrentSaleFilter) }}
                <ArrowDownOutlined/>
              </a-button>
            </a-popover>

            <a-popover
                :get-popup-container="getPopupContainer"
                overlay-class-name="torrent-filter-popover"
                trigger="click"
                placement="bottomLeft">
              <template #content>
                <div class="torrent-popover-card">
                  <div class="torrent-popover-head">
                    <div class="torrent-popover-title">分类</div>
                    <a-button size="small" type="link" @click="clearTorrentFilter('category')">全部</a-button>
                  </div>
                  <div class="torrent-popover-options">
                    <button
                        v-for="category in torrentCategoryOptions"
                        :key="category"
                        :class="{ active: torrentCategoryFilter.includes(category) }"
                        class="torrent-popover-option"
                        type="button"
                        @click="toggleTorrentFilter('category', category)">
                      {{ category }}
                    </button>
                  </div>
                </div>
              </template>
              <a-button :disabled="torrentCategoryOptions.length <= 0" size="small">
                {{ getTorrentFilterLabel('分类', torrentCategoryFilter) }}
                <ArrowDownOutlined/>
              </a-button>
            </a-popover>

            <a-popover
                :get-popup-container="getPopupContainer"
                overlay-class-name="torrent-filter-popover"
                trigger="click"
                placement="bottomLeft">
              <template #content>
                <div class="torrent-popover-card">
                  <div class="torrent-popover-head">
                    <div class="torrent-popover-title">标签</div>
                    <a-button size="small" type="link" @click="clearTorrentFilter('tag')">全部</a-button>
                  </div>
                  <div class="torrent-popover-options">
                    <button
                        v-for="tag in torrentTagOptions"
                        :key="tag"
                        :class="{ active: torrentTagFilter.includes(tag) }"
                        class="torrent-popover-option"
                        type="button"
                        @click="toggleTorrentFilter('tag', tag)">
                      {{ tag }}
                    </button>
                  </div>
                </div>
              </template>
              <a-button :disabled="torrentTagOptions.length <= 0" size="small">
                {{ getTorrentFilterLabel('标签', torrentTagFilter) }}
                <ArrowDownOutlined/>
              </a-button>
            </a-popover>

            <div class="torrent-filter-summary">
              <span v-if="torrentSaleFilter.length > 0">优惠：{{ torrentSaleFilter.join('、') }}</span>
              <span v-if="torrentCategoryFilter.length > 0">分类：{{ torrentCategoryFilter.join('、') }}</span>
              <span v-if="torrentTagFilter.length > 0">标签：{{ torrentTagFilter.join('、') }}</span>
              <a-button
                  v-if="torrentSearchKey || torrentSaleFilter.length > 0 || torrentCategoryFilter.length > 0 || torrentTagFilter.length > 0"
                  size="small"
                  type="link"
                  @click="clearTorrentFilters">
                重置
              </a-button>
            </div>
          </div>
        </div>

        <a-tooltip v-else :title="getPreparedTorrentIds()[0]">
          <a-alert :message="singleTorrent?.subtitle || getTorrentCardTitle(torrents[0] || {})"
                   class="torrent-single-alert"></a-alert>
        </a-tooltip>

        <div class="torrent-card-list">
          <a-empty v-if="filteredTorrents.length <= 0" description="没有符合条件的种子"/>
          <a-card
              v-for="torrent in filteredTorrents"
              :key="torrent.key"
              :class="{
                  selected: selectedTorrentKeys.includes(torrent.key),
                  disabled: !hasPushableTorrentUrl(torrent),
                }"
              class="torrent-card"
              size="small"
              @click="toggleTorrentSelection(torrent)"
          >
            <div class="torrent-card-row">
              <div class="torrent-card-main">
                <div class="torrent-card-head">
                  <div class="torrent-card-title">{{ getTorrentCardTitle(torrent) }}</div>
                  <a-tag v-if="torrent.sale_status" class="torrent-sale-tag" color="green">{{ torrent.sale_status }}</a-tag>
                </div>
                <div v-if="torrent.subtitle" class="torrent-card-subtitle">{{ torrent.subtitle }}</div>
                <a-space class="torrent-card-tags" size="small" wrap>
                  <a-tag v-if="torrent.category" color="blue">{{ torrent.category }}</a-tag>
                  <a-tag v-for="tag in getTorrentTags(torrent).slice(0, 6)" :key="`${torrent.key}-${tag}`" color="purple">{{ tag }}</a-tag>
                </a-space>
                <div class="torrent-card-stats">
                  <span v-if="torrent.size" class="torrent-stat-pill size">
                    <span class="torrent-stat-label">大小</span>
                    <strong>{{ torrent.size }}</strong>
                  </span>
                  <span v-if="torrent.seeders" class="torrent-stat-pill seeders">
                    <span class="torrent-stat-label">做种</span>
                    <strong>{{ torrent.seeders }}</strong>
                  </span>
                  <span v-if="torrent.leechers" class="torrent-stat-pill leechers">
                    <span class="torrent-stat-label">下载</span>
                    <strong>{{ torrent.leechers }}</strong>
                  </span>
                  <span v-if="torrent.completers" class="torrent-stat-pill completers">
                    <span class="torrent-stat-label">完成</span>
                    <strong>{{ torrent.completers }}</strong>
                  </span>
                  <span v-if="torrent.sale_expire" class="torrent-stat-pill expire">
                    <span class="torrent-stat-label">优惠到</span>
                    <strong>{{ torrent.sale_expire }}</strong>
                  </span>
                  <span v-if="!hasPushableTorrentUrl(torrent)" class="torrent-card-warning">缺少可用链接</span>
                </div>
              </div>
              <a-button
                  :disabled="!hasPushableTorrentUrl(torrent)"
                  ghost
                  size="small"
                  type="primary"
                  @click.stop="selectedTorrentKeys = [torrent.key]; prepareTorrentPush()">
                <template #icon>
                  <SendOutlined/>
                </template>
              </a-button>
            </div>
          </a-card>
        </div>
      </div>
    </a-modal>
    <a-modal
        v-model:visible="pushModalVisible"
        :bodyStyle="{ padding: 0 }"
        :closable="false"
        :confirm-loading="pushSubmitting"
        :get-container="getModalContainer"
        :width="760"
        wrap-class-name="harvest-modal-wrap torrent-push-modal-wrap"
        @cancel="downloaderPanelVisible = false"
    >
      <template #footer>
        <div class="push-action-bar">
          <div class="push-action-summary">
            {{ selectedTorrents.length }} 个任务 · {{ pushSelectedDownloader?.name || '未选择下载器' }}
          </div>
          <div class="push-action-buttons">
            <a-button class="push-cancel-button" @click="pushModalVisible = false; downloaderPanelVisible = false">
              取消
            </a-button>
            <a-button
                :disabled="selectedTorrents.length <= 0 || !pushSelectedDownloader"
                :loading="pushSubmitting"
                class="push-submit-button"
                type="primary"
                @click="submitPushSheet">
              <template #icon>
                <SendOutlined/>
              </template>
              下载
            </a-button>
          </div>
        </div>
      </template>
      <div class="push-sheet">
        <div class="push-sheet-header">
          <div class="push-sheet-title-block">
            <div class="push-sheet-title">添加种子</div>
            <div class="push-sheet-subtitle">
              {{ selectedTorrents.length }} 个任务 · {{ pushSavePath || '未设置保存路径' }}
            </div>
          </div>
          <a-tag class="push-provider-tag" :color="pushIsQb ? 'blue' : 'orange'">
            {{ pushIsQb ? 'qBittorrent' : 'Transmission' }}
          </a-tag>
        </div>

        <div class="push-sheet-content">
          <section class="push-sheet-section">
            <div class="push-sheet-section-title">下载器</div>
            <div class="push-downloader-list">
              <button
                  v-for="d in downloaders"
                  :key="d.id"
                  :class="{ active: pushSelectedDownloaderId === d.id || (!pushSelectedDownloaderId && pushSelectedDownloader?.id === d.id) }"
                  class="push-downloader-chip"
                  type="button"
                  @click="selectPushDownloader(d.id)">
                <span class="push-downloader-avatar">{{ d.category }}</span>
                <span>
                  <strong>{{ d.name }}</strong>
                  <small>{{ d.host || d.category }}</small>
                </span>
              </button>
            </div>
          </section>

          <section class="push-sheet-section">
            <div class="push-sheet-section-title">链接</div>
            <div v-if="selectedTorrents.length === 1 && selectedTorrentPreview" class="push-torrent-preview">
              <div class="push-file-icon">
                <DownloadOutlined/>
              </div>
              <div class="push-torrent-main">
                <div class="push-torrent-title">
                  {{ getTorrentCardTitle(selectedTorrentPreview) }}
                </div>
                <div v-if="selectedTorrentPreview.subtitle" class="push-torrent-subtitle">
                  {{ selectedTorrentPreview.subtitle }}
                </div>
                <div class="push-torrent-meta">
                  <span v-if="selectedTorrentPreview.size" class="push-meta-pill size">
                    <span>大小</span><strong>{{ selectedTorrentPreview.size }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.seeders" class="push-meta-pill seeders">
                    <span>做种</span><strong>{{ selectedTorrentPreview.seeders }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.leechers" class="push-meta-pill leechers">
                    <span>下载</span><strong>{{ selectedTorrentPreview.leechers }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.completers" class="push-meta-pill completers">
                    <span>完成</span><strong>{{ selectedTorrentPreview.completers }}</strong>
                  </span>
                  <span class="push-meta-pill site">
                    <span>站点</span><strong>{{ siteInfo?.name || selectedTorrentPreview.site_id }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.category" class="push-meta-pill category">
                    <span>分类</span><strong>{{ selectedTorrentPreview.category }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.sale_status" class="push-meta-pill sale">
                    <span>优惠</span><strong>{{ selectedTorrentPreview.sale_status }}</strong>
                  </span>
                  <span v-if="selectedTorrentPreview.sale_expire" class="push-meta-pill expire">
                    <span>到期</span><strong>{{ selectedTorrentPreview.sale_expire }}</strong>
                  </span>
                </div>
                <div v-if="getTorrentTags(selectedTorrentPreview).length > 0" class="push-tag-row">
                  <span
                      v-for="tag in getTorrentTags(selectedTorrentPreview).slice(0, 6)"
                      :key="`preview-${tag}`"
                      class="push-tag selected">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="push-batch-preview">
              <div class="push-file-icon">
                <DownloadOutlined/>
              </div>
              <div class="push-torrent-main">
                <div class="push-torrent-title">批量添加 {{ selectedTorrents.length }} 个种子</div>
                <div class="push-torrent-subtitle">将按当前选择列表推送到下载器</div>
                <a-textarea
                    :value="url_list.join('\n')"
                    class="push-url-textarea"
                    readonly
                    :rows="3"/>
              </div>
            </div>
          </section>

          <section class="push-sheet-section">
            <div class="push-sheet-section-title">路径</div>
            <div v-if="categories.length > 0" class="push-category-list">
              <button
                  v-for="cat in categories"
                  :key="`${cat.name}-${cat.savePath}`"
                  :class="{ active: pushSelectedCategory === cat.name }"
                  class="push-category-chip"
                  type="button"
                  @click="selectPushCategory(cat)">
                {{ cat.name }}
              </button>
            </div>
            <a-input
                v-model:value="pushSavePath"
                class="push-path-input"
                placeholder="/downloads"
                size="small"/>
          </section>

          <section class="push-sheet-section">
            <div class="push-sheet-title-row">
              <div class="push-sheet-section-title">标签</div>
              <a-input
                  v-model:value="pushCustomTag"
                  class="push-custom-tag"
                  placeholder="自定义标签"
                  size="small"
                  @pressEnter="addCustomPushTags"/>
            </div>
            <div class="push-tag-row">
              <button
                  v-for="tag in pushAvailableTags"
                  :key="tag"
                  :class="{ selected: pushSelectedTags.includes(tag) }"
                  class="push-tag"
                  type="button"
                  @click="togglePushTag(tag)">
                {{ tag }}
              </button>
            </div>
          </section>

          <section class="push-sheet-section compact push-pause-section">
            <div>
              <div class="push-sheet-section-title">暂停下载</div>
              <div class="push-sheet-section-hint">添加任务后先保持暂停状态</div>
            </div>
            <a-switch v-model:checked="pushPaused" size="small"/>
          </section>

          <section class="push-sheet-section">
            <button class="push-advanced-toggle" type="button" @click="pushAdvancedExpanded = !pushAdvancedExpanded">
              <span>高级选项</span>
              <span class="push-advanced-state">{{ pushAdvancedExpanded ? '收起' : '展开' }}</span>
            </button>
            <div v-if="pushAdvancedExpanded" class="push-advanced-panel">
              <div class="push-option-group">
                <div class="push-option-group-title">基础</div>
                <label class="push-option-row">
                  <span>跳过哈希检查</span>
                  <a-switch v-model:checked="pushSkipChecking" size="small"/>
                </label>
                <label v-if="pushIsQb" class="push-option-row">
                  <span>强制下载</span>
                  <a-switch v-model:checked="pushForced" size="small"/>
                </label>
              </div>

              <div class="push-option-group">
                <div class="push-option-group-title">下载链接</div>
                <label class="push-inline-field">
                  <span>Cookie</span>
                  <a-input v-model:value="cookie" placeholder="站点 Cookie" size="small"/>
                </label>
              </div>

              <div class="push-option-group">
                <div class="push-option-group-title">重命名</div>
                <label class="push-inline-field">
                  <span>任务名称</span>
                  <a-input v-model:value="pushRename" placeholder="留空使用原始名称" size="small"/>
                </label>
              </div>

              <div class="push-option-group">
                <div class="push-option-group-title">速度限制</div>
                <label class="push-inline-field">
                  <span>上传限制</span>
                  <a-input v-model:value="pushUploadLimit" placeholder="KB/s" size="small"/>
                </label>
                <label class="push-inline-field">
                  <span>下载限制</span>
                  <a-input v-model:value="pushDownloadLimit" placeholder="KB/s" size="small"/>
                </label>
                <label class="push-inline-field">
                  <span>分享比率</span>
                  <a-input v-model:value="pushRatioLimit" placeholder="默认" size="small"/>
                </label>
                <label v-if="pushIsQb" class="push-inline-field">
                  <span>做种时间</span>
                  <a-input v-model:value="pushSeedingTimeLimit" placeholder="分钟" size="small"/>
                </label>
              </div>

              <div v-if="pushIsQb" class="push-option-group">
                <div class="push-option-group-title">qBittorrent</div>
                <label class="push-option-row">
                  <span>自动管理</span>
                  <a-switch v-model:checked="pushAutoManagement" size="small"/>
                </label>
                <label class="push-option-row">
                  <span>创建子文件夹</span>
                  <a-switch v-model:checked="pushCreateSubfolder" size="small"/>
                </label>
                <label class="push-option-row">
                  <span>顺序下载</span>
                  <a-switch v-model:checked="pushSequentialDownload" size="small"/>
                </label>
                <label class="push-option-row">
                  <span>优先首尾文件</span>
                  <a-switch v-model:checked="pushFirstLastPiecePriority" size="small"/>
                </label>
                <label class="push-option-row">
                  <span>添加到队列顶部</span>
                  <a-switch v-model:checked="pushAddToTop" size="small"/>
                </label>
                <div class="push-layout-row">
                  <span>内容布局</span>
                  <a-radio-group v-model:value="pushContentLayout" size="small">
                    <a-radio-button value="Original">原始</a-radio-button>
                    <a-radio-button value="Subfolder">子文件夹</a-radio-button>
                    <a-radio-button value="NoSubfolder">无子文件夹</a-radio-button>
                  </a-radio-group>
                </div>
                <label class="push-inline-field">
                  <span>停止条件</span>
                  <a-select
                      v-model:value="pushStopCondition"
                      :get-popup-container="getPopupContainer"
                      allow-clear
                      placeholder="不自动停止"
                      size="small">
                    <a-select-option value="MetadataReceived">收到元数据后</a-select-option>
                    <a-select-option value="FilesChecked">文件校验后</a-select-option>
                  </a-select>
                </label>
                <label class="push-inline-field">
                  <span>分享限制</span>
                  <a-select
                      v-model:value="pushShareLimitAction"
                      :get-popup-container="getPopupContainer"
                      allow-clear
                      placeholder="使用默认"
                      size="small">
                    <a-select-option value="Stop">停止</a-select-option>
                    <a-select-option value="Remove">移除</a-select-option>
                    <a-select-option value="RemoveWithContent">移除并删除</a-select-option>
                    <a-select-option value="EnableSuperSeeding">超级做种</a-select-option>
                  </a-select>
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </a-modal>
    <a-modal
        v-model:visible="siteDataModalVisible"
        :bodyStyle="{ padding: 0 }"
        :footer="null"
        :get-container="getModalContainer"
        :width="560"
        title="当前页面抓取信息"
        wrap-class-name="harvest-modal-wrap site-data-modal-wrap"
    >
      <a-spin :spinning="siteDataLoading">
        <div class="site-data-panel">
          <div class="site-data-summary">
            <div>
              <div class="site-data-site">{{ getSiteDataTitle() }}</div>
              <div class="site-data-subtitle">
                {{ current_site_page ? sitePageLabels[current_site_page] : '当前页面' }}
              </div>
            </div>
            <a-space class="site-data-actions">
              <a-button
                  :danger="siteDataEncrypted"
                  :disabled="Object.keys(siteDataPreview).length === 0"
                  size="small"
                  type="primary"
                  @click="toggleSiteDataEncrypted"
              >
                <template #icon>
                  <UnlockOutlined v-if="siteDataEncrypted"/>
                  <LockOutlined v-else/>
                </template>
                {{ siteDataEncrypted ? '解密' : '加密' }}
              </a-button>
              <a-button
                  :loading="siteDataSyncLoading"
                  size="small"
                  type="default"
                  @click="syncSiteData"
              >
                <template #icon>
                  <SyncOutlined/>
                </template>
                同步
              </a-button>
            </a-space>
          </div>

          <a-alert
              v-if="!siteDataLoading && Object.keys(siteDataPreview).length === 0"
              message="当前页面暂未抓取到站点信息"
              show-icon
              type="warning"
          />

          <div v-if="Object.keys(siteDataPreview).length > 0" class="site-data-content">
            <section v-if="getSiteDataFields(siteDataPrimaryKeys).length > 0" class="site-data-section">
              <div class="site-data-section-title">基础信息</div>
              <div class="site-data-grid">
                <div v-for="field in getSiteDataFields(siteDataPrimaryKeys)" :key="field.key" class="site-data-item">
                  <span class="site-data-label">{{ field.label }}</span>
                  <span class="site-data-value">{{ field.value }}</span>
                </div>
              </div>
            </section>

            <section v-if="getSiteDataFields(siteDataSecretKeys).length > 0" class="site-data-section">
              <div class="site-data-section-title">凭据信息</div>
              <div class="site-data-stack">
                <div v-for="field in getSiteDataFields(siteDataSecretKeys)" :key="field.key"
                     class="site-data-long-item">
                  <span class="site-data-label">{{ field.label }}</span>
                  <code class="site-data-code">{{ field.value }}</code>
                </div>
              </div>
            </section>

            <section v-if="getSiteDataFields(siteDataEnvKeys).length > 0" class="site-data-section">
              <div class="site-data-section-title">环境信息</div>
              <div class="site-data-stack">
                <div v-for="field in getSiteDataFields(siteDataEnvKeys)" :key="field.key" class="site-data-long-item">
                  <span class="site-data-label">{{ field.label }}</span>
                  <code class="site-data-code">{{ field.value }}</code>
                </div>
              </div>
            </section>
          </div>
        </div>
      </a-spin>
    </a-modal>
    <a-drawer
        v-model:visible="drawer" :bodyStyle="{
          padding:0
        }" :get-container="getModalContainer('drawer-container')"
        :width="400" :zIndex="10001" placement="right"
        title="辅种助手"
        @close="drawer = false"
    >
      <template #extra>
        <a-avatar :src="`${setting.baseUrl}favicon.png`">
          辅种助手
        </a-avatar>
      </template>
      <a-card :title="`可辅种站点: ${repeat_info!.url_list.length}`" style="width: 100%">
        <a-space align="center" wrap>
          <a-button
              v-for="info in repeat_info!.url_list"
              :key="info.site.id"
              :href="info.details_url"
              ghost
              size="small"
              target="_blank"
              type="primary"
          >
            <template #icon>
              <a-image
                  :fallback="fallback_image"
                  :preview="false" :src="info.site.logo.replace('http://','https://')"
                  :width="13"
              ></a-image>
            </template>
            {{ info.site.name }}
          </a-button>
        </a-space>
      </a-card>
      <a-card :title="`可发布站点: ${repeat_info!.can_list.length}`">
        <a-space align="center" wrap>
          <a-button
              v-for="site in repeat_info!.can_list"
              :key="site.id" :href="site.url"
              danger
              ghost
              size="small" target="_blank">
            <template #icon>
              <a-image
                  :fallback="fallback_image" :src="site.logo.replace('http://','https://')"
                  :width="13"
              ></a-image>
            </template>
            {{ site.name }}
          </a-button>
        </a-space>
      </a-card>
    </a-drawer>
  </div>
</template>

<style scoped>

.harvest-wrap {
  position: fixed;
  top: 240px;
  z-index: 999999;
  width: 128px;
  left: 5px;
  float: left;
  opacity: 0.9;
  font-size: 12px;
  padding-top: 2px;
  cursor: grab;
  color: #172033;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.harvest-wrap:hover {
  opacity: 1.0;
}

/* 图片固定在顶部 */
.harvest-img {
  position: absolute;
  z-index: 9999;
  top: -24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  margin: auto;
  text-align: center;
  pointer-events: auto;
}

.harvest-img :deep(.ant-avatar) {
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.96);
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.26), 0 0 0 1px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.harvest-img :deep(.ant-avatar img) {
  animation: harvest-avatar-spin 12s linear infinite;
  transform-origin: center;
}

.harvest-wrap:hover .harvest-img :deep(.ant-avatar img) {
  animation-duration: 3s;
}

.harvest-wrap:hover .harvest-img :deep(.ant-avatar) {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.08);
}

@keyframes harvest-avatar-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .harvest-img :deep(.ant-avatar img) {
    animation: none;
  }
}

/* 左右停靠 */
.dock-left .harvest-img {
  left: 5px;
}

.dock-right .harvest-img {
  right: 5px;
}

.ant-form {
  text-align: center;
}

.ant-form-item-label {
  text-align: center !important;
  margin: auto !important;
}

.move-item {
  width: 44px;
  height: 44px;
  position: absolute;
  top: 50%;
  left: 50%;
  padding: 12px;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  color: rgba(15, 23, 42, 0);
  transform: translate(-50%, -50%);
  transition: color 0.18s ease, background 0.18s ease;
}

.harvest-img:hover .move-item {
  background: rgba(15, 23, 42, 0.34);
  color: rgba(255, 255, 255, 0.88);
}

.harvest-menu {
  display: grid;
  width: 128px;
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(210, 220, 232, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);
}

.harvest-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 6px;
  padding: 1px 1px 2px;
}

.harvest-menu-title {
  overflow: hidden;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.harvest-page-tag {
  flex-shrink: 0;
  max-width: 66px;
  margin-right: 0;
  overflow: hidden;
  font-size: 11px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.harvest-size-slider {
  margin: 0 4px 2px;
}

.harvest-size-slider :deep(.ant-slider-rail),
.harvest-size-slider :deep(.ant-slider-track) {
  height: 3px;
}

.harvest-size-slider :deep(.ant-slider-handle) {
  width: 12px;
  height: 12px;
  margin-top: -4px;
}

.harvest-action {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 27px;
  padding: 0 8px;
  border-radius: 6px;
  color: #334155;
  font-size: 12px;
  line-height: 27px;
  transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.harvest-action :deep(.anticon) {
  color: #64748b;
  font-size: 13px;
}

.harvest-action.primary {
  color: #0f766e;
  background: #ecfdf5;
}

.harvest-action.primary :deep(.anticon) {
  color: #0f766e;
}

.harvest-action:not(:disabled):hover {
  color: #0369a1;
  background: #eff6ff;
}

.harvest-action:not(:disabled):hover :deep(.anticon) {
  color: #0369a1;
}

.harvest-action.ant-btn-dangerous:not(:disabled):hover {
  color: #b91c1c;
  background: #fef2f2;
}

.harvest-action.ant-btn-dangerous:not(:disabled):hover :deep(.anticon) {
  color: #b91c1c;
}

.torrent-push-panel {
  box-sizing: border-box;
  display: grid;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  max-height: 72vh;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef5f8 100%);
}

.torrent-toolbar {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  align-items: center;
  gap: 7px 10px;
  width: 100%;
  max-width: 100%;
  margin-bottom: 6px;
  padding: 9px;
  border: 1px solid #dbe7ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
}

.torrent-search {
  max-width: 100%;
  width: 100%;
}

.torrent-search :deep(.ant-input-affix-wrapper) {
  height: 32px;
  border-color: #dbe7ef;
  border-radius: 8px;
  background: #f8fafc;
}

.torrent-search :deep(.anticon) {
  color: #64748b;
}

.torrent-toolbar-meta {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.torrent-count {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  line-height: 18px;
  text-align: right;
  white-space: nowrap;
}

.torrent-filter-panel {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;
  max-width: 100%;
  padding: 8px;
  border: 1px solid #e6edf5;
  border-radius: 8px;
  background: linear-gradient(180deg, #fbfdff 0%, #f8fafc 100%);
}

.torrent-filter-label {
  flex: 0 0 auto;
  padding: 0 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  line-height: 24px;
}

.torrent-filter-panel :deep(.ant-btn) {
  max-width: 170px;
  height: 26px;
  padding: 0 9px;
  overflow: hidden;
  border-color: #dbe7ef;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-filter-panel :deep(.ant-btn:not(:disabled):hover) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #0369a1;
}

.torrent-filter-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1 1 100%;
  min-height: 20px;
  padding-top: 1px;
  color: #64748b;
  font-size: 11px;
  line-height: 16px;
}

.torrent-filter-summary span {
  max-width: 180px;
  padding: 2px 7px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-filter-summary :deep(.ant-btn-link) {
  height: 20px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 20px;
}

.torrent-single-alert {
  text-align: center !important;
}

.torrent-card-list {
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 100%;
  max-height: 440px;
  margin-top: 0;
  overflow-x: hidden;
  overflow-y: auto;
  gap: 7px;
  padding-right: 2px;
}

.torrent-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  cursor: pointer;
  border: 1px solid #e5edf4;
  border-radius: 7px;
  background: #ffffff;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.torrent-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.torrent-card.selected {
  border-color: #60a5fa;
  background: #eff6ff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.torrent-card.disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.torrent-card-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.torrent-card-main {
  flex: 1;
  min-width: 0;
}

.torrent-card-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.torrent-card-title {
  flex: 1;
  overflow: hidden;
  color: #1f2937;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-sale-tag {
  flex-shrink: 0;
  max-width: 116px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.torrent-card-subtitle {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
  line-height: 16px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.torrent-card-tags {
  margin-top: 6px;
}

.torrent-card-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.torrent-stat-pill {
  display: inline-flex;
  align-items: center;
  max-width: 170px;
  min-height: 22px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 11px;
  line-height: 20px;
  white-space: nowrap;
}

.torrent-stat-label {
  flex: 0 0 auto;
  padding: 0 6px;
  border-right: 1px solid rgba(148, 163, 184, 0.28);
  color: #64748b;
  font-weight: 600;
}

.torrent-stat-pill strong {
  min-width: 0;
  padding: 0 7px;
  overflow: hidden;
  color: #172033;
  font-weight: 800;
  text-overflow: ellipsis;
}

.torrent-stat-pill.size {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.torrent-stat-pill.seeders {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.torrent-stat-pill.seeders strong {
  color: #047857;
}

.torrent-stat-pill.leechers {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.torrent-stat-pill.leechers strong {
  color: #1d4ed8;
}

.torrent-stat-pill.completers {
  border-color: #ddd6fe;
  background: #f5f3ff;
}

.torrent-stat-pill.completers strong {
  color: #6d28d9;
}

.torrent-stat-pill.expire {
  max-width: 220px;
  border-color: #fde68a;
  background: #fffbeb;
}

.torrent-stat-pill.expire strong {
  color: #b45309;
}

.torrent-card-warning {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 7px;
  border: 1px solid #fecaca;
  border-radius: 999px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 11px;
  font-weight: 700;
}

.downloader-push-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.downloader-push-modal {
  display: grid;
  gap: 10px;
  max-height: 70vh;
  overflow: auto;
  padding: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef5f8 100%);
}

.downloader-push-title {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.downloader-push-subtitle {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  line-height: 16px;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.downloader-push-collapse {
  background: #ffffff;
}

.downloader-push-panel {
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px !important;
  background: #ffffff;
}

.downloader-push-panel :deep(.ant-collapse-header) {
  align-items: center !important;
  padding: 9px 10px !important;
}

.downloader-push-panel :deep(.ant-collapse-content-box) {
  padding: 10px !important;
  background: #f8fafc;
}

.downloader-push-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.downloader-name {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.downloader-meta {
  color: #64748b;
  font-size: 11px;
  line-height: 15px;
}

.downloader-category-list {
  width: 100%;
}

.push-sheet {
  display: flex;
  flex-direction: column;
  height: min(620px, 80vh);
  max-width: 100%;
  overflow-x: hidden;
  background: #f6f8fb;
}

.push-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  padding: 13px 16px 11px;
  border-bottom: 1px solid #e6edf5;
  background: #ffffff;
}

.push-sheet-title-block {
  min-width: 0;
}

.push-sheet-title {
  color: #172033;
  font-size: 17px;
  font-weight: 700;
  line-height: 24px;
}

.push-sheet-subtitle {
  max-width: 520px;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-provider-tag {
  flex-shrink: 0;
  margin-right: 0;
  font-weight: 700;
}

.push-sheet-content {
  display: grid;
  flex: 1;
  gap: 10px;
  min-height: 0;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px;
}

.push-sheet-section {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid #e3ebf3;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.push-sheet-section.compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.push-sheet-section-title {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.push-sheet-section-hint {
  color: #94a3b8;
  font-size: 11px;
  line-height: 16px;
}

.push-sheet-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.push-custom-tag {
  width: 160px;
}

.push-custom-tag :deep(.ant-input),
.push-path-input :deep(.ant-input),
.push-url-textarea :deep(.ant-input) {
  border-radius: 6px;
}

.push-downloader-list,
.push-category-list,
.push-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.push-downloader-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 188px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #dbe7ef;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  text-align: left;
  transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.push-downloader-chip:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.push-downloader-chip.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.18), 0 6px 14px rgba(37, 99, 235, 0.08);
}

.push-downloader-chip strong,
.push-downloader-chip small {
  display: block;
  max-width: 124px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-downloader-chip strong {
  font-size: 12px;
  line-height: 16px;
}

.push-downloader-chip small {
  color: #64748b;
  font-size: 10px;
  line-height: 14px;
}

.push-downloader-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
}

.push-torrent-preview,
.push-batch-preview {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid #dfe9f2;
  border-radius: 8px;
  background: #f8fafc;
}

.push-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 16px;
}

.push-torrent-main {
  flex: 1;
  min-width: 0;
}

.push-torrent-title {
  display: -webkit-box;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 19px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.push-torrent-subtitle {
  overflow: hidden;
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-torrent-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.push-meta-pill {
  display: inline-flex;
  align-items: center;
  max-width: 176px;
  min-height: 22px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 10px;
  line-height: 20px;
  white-space: nowrap;
}

.push-meta-pill span {
  flex: 0 0 auto;
  padding: 0 6px;
  border-right: 1px solid rgba(148, 163, 184, 0.28);
  color: #64748b;
  font-weight: 700;
}

.push-meta-pill strong {
  min-width: 0;
  padding: 0 7px;
  overflow: hidden;
  color: #172033;
  font-weight: 800;
  text-overflow: ellipsis;
}

.push-meta-pill.seeders {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.push-meta-pill.seeders strong {
  color: #047857;
}

.push-meta-pill.leechers,
.push-meta-pill.site {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.push-meta-pill.leechers strong,
.push-meta-pill.site strong {
  color: #1d4ed8;
}

.push-meta-pill.completers,
.push-meta-pill.category {
  border-color: #ddd6fe;
  background: #f5f3ff;
}

.push-meta-pill.completers strong,
.push-meta-pill.category strong {
  color: #6d28d9;
}

.push-meta-pill.sale,
.push-meta-pill.expire {
  border-color: #fde68a;
  background: #fffbeb;
}

.push-meta-pill.sale strong,
.push-meta-pill.expire strong {
  color: #b45309;
}

.push-tag {
  max-width: 140px;
  padding: 2px 7px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 10px;
  font-weight: 600;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-tag {
  min-height: 21px;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.push-tag.selected,
.push-tag:hover {
  border-color: #8b5cf6;
  background: #ede9fe;
  color: #6d28d9;
}

.push-category-chip {
  max-width: 150px;
  padding: 5px 11px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.push-category-chip:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.push-category-chip.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
}

.push-url-textarea {
  margin-top: 8px;
  max-width: 100%;
  font-size: 12px;
}

.push-pause-section {
  background: #fbfdff;
}

.push-advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #172033;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.push-advanced-state {
  color: #2563eb;
  font-size: 12px;
}

.push-advanced-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding-top: 6px;
}

.push-option-group {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.push-option-group-title {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 16px;
}

.push-option-row,
.push-inline-field,
.push-layout-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.push-option-row {
  justify-content: space-between;
}

.push-option-row span,
.push-inline-field span,
.push-layout-row span {
  flex: 0 0 86px;
  color: #475569;
  font-size: 11px;
  line-height: 22px;
}

.push-inline-field :deep(.ant-input),
.push-inline-field :deep(.ant-select) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.push-layout-row :deep(.ant-radio-group) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  white-space: normal;
}

.site-data-panel {
  max-height: 72vh;
  overflow: auto;
  padding: 12px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef5f8 100%);
}

.site-data-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #dbe7ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.site-data-site {
  max-width: 360px;
  overflow: hidden;
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-data-subtitle {
  margin-top: 1px;
  color: #6b7280;
  font-size: 12px;
}

.site-data-actions {
  flex-shrink: 0;
}

.site-data-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-data-section {
  padding: 10px;
  border: 1px solid #dfe9f2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
}

.site-data-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.site-data-section-title::before {
  display: block;
  width: 3px;
  height: 13px;
  border-radius: 999px;
  background: #0ea5e9;
  content: "";
}

.site-data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.site-data-item,
.site-data-long-item {
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid #edf2f7;
  border-radius: 6px;
  background: #f8fafc;
}

.site-data-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-data-label {
  display: block;
  margin-bottom: 3px;
  color: #6b7280;
  font-size: 12px;
  line-height: 14px;
}

.site-data-value {
  display: block;
  overflow-wrap: anywhere;
  color: #111827;
  font-size: 13px;
  line-height: 16px;
}

.site-data-code {
  display: block;
  max-height: 88px;
  overflow: auto;
  padding: 7px;
  border: 1px solid #d7e1ea;
  border-radius: 6px;
  background: #172033;
  color: #f8fafc;
  font-size: 12px;
  line-height: 16px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

:global(.harvest-modal-wrap .ant-modal-content) {
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 20px 55px rgba(15, 23, 42, 0.24);
}

:global(.harvest-modal-wrap .ant-modal-header) {
  padding: 12px 16px;
  border-bottom: 1px solid #e6edf5;
  background: #ffffff;
}

:global(.harvest-modal-wrap .ant-modal-title) {
  color: #172033;
  font-size: 15px;
  font-weight: 700;
}

:global(.harvest-modal-wrap .ant-modal-close-x) {
  width: 44px;
  height: 44px;
  line-height: 44px;
}

:global(.harvest-modal-wrap .ant-modal-footer) {
  padding: 10px 12px;
  border-top: 1px solid #e6edf5;
  background: #f8fafc;
}

:global(.torrent-modal-wrap .ant-modal-footer) {
  padding: 0;
  border-top: 0;
  background: #ffffff;
}

.torrent-list-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid #e6edf5;
  background: #ffffff;
}

.torrent-list-action-summary {
  min-width: 0;
  padding: 4px 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-list-action-buttons {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.torrent-list-cancel-button,
.torrent-list-select-button,
.torrent-list-submit-button {
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
}

.torrent-list-cancel-button,
.torrent-list-select-button {
  border-color: #dbe7ef;
  color: #475569;
}

.torrent-list-cancel-button:hover,
.torrent-list-select-button:hover {
  border-color: #93c5fd;
  color: #0369a1;
}

.torrent-list-submit-button {
  min-width: 132px;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16);
}

:global(.torrent-selection-dropdown),
:global(.torrent-filter-popover) {
  z-index: 1100;
}

:global(.torrent-selection-dropdown .ant-dropdown-menu) {
  max-height: 280px;
  overflow-y: auto;
}

:global(.torrent-selection-dropdown .ant-dropdown-menu-item) {
  min-width: 112px;
  max-width: 220px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.torrent-filter-popover .ant-popover-inner-content) {
  padding: 0;
}

:global(.torrent-filter-popover .torrent-popover-card) {
  width: min(280px, 72vw);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

:global(.torrent-filter-popover .torrent-popover-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px 7px;
  border-bottom: 1px solid #edf2f7;
  background: #f8fafc;
}

:global(.torrent-filter-popover .torrent-popover-title) {
  padding: 9px 10px 7px;
  border-bottom: 1px solid #edf2f7;
  background: #f8fafc;
  color: #172033;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

:global(.torrent-filter-popover .torrent-popover-head .torrent-popover-title) {
  padding: 0;
  border-bottom: 0;
  background: transparent;
}

:global(.torrent-filter-popover .torrent-popover-title.secondary) {
  margin-top: 0;
  border-top: 1px solid #edf2f7;
}

:global(.torrent-filter-popover .torrent-popover-options) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 188px;
  overflow-y: auto;
  padding: 10px;
}

:global(.torrent-filter-popover .torrent-popover-options.two) {
  max-height: none;
  padding-top: 8px;
}

:global(.torrent-filter-popover .torrent-popover-option) {
  max-width: 128px;
  height: 26px;
  padding: 0 9px;
  overflow: hidden;
  border: 1px solid #dbe7ef;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  font-size: 11px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

:global(.torrent-filter-popover .torrent-popover-option:hover) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #0369a1;
}

:global(.torrent-filter-popover .torrent-popover-option.active) {
  border-color: #2563eb;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);
}

:global(.torrent-push-modal-wrap .ant-modal-footer) {
  padding: 0;
  border-top: 0;
  background: #ffffff;
}

:global(.torrent-push-modal-wrap .ant-btn-primary) {
  font-weight: 700;
}

.push-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid #e6edf5;
  background: #ffffff;
}

.push-action-summary {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 20px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.push-action-buttons {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.push-cancel-button,
.push-submit-button {
  min-width: 92px;
  height: 32px;
  border-radius: 8px;
  font-weight: 700;
}

.push-cancel-button {
  border-color: #dbe7ef;
  color: #475569;
}

.push-cancel-button:hover {
  border-color: #93c5fd;
  color: #0369a1;
}

.push-submit-button {
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
}

@media (max-width: 640px) {
  .torrent-toolbar {
    grid-template-columns: 1fr;
  }

  .torrent-toolbar-meta {
    justify-content: flex-start;
  }

  .torrent-count {
    text-align: left;
    white-space: normal;
  }

  .torrent-filter-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .torrent-list-action-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .torrent-list-action-buttons {
    width: 100%;
  }

  .torrent-list-cancel-button,
  .torrent-list-select-button,
  .torrent-list-submit-button {
    flex: 1;
    min-width: 0;
  }

  .push-sheet {
    height: min(620px, 84vh);
  }

  .push-sheet-header,
  .push-sheet-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .push-provider-tag {
    align-self: flex-start;
  }

  .push-custom-tag {
    width: 100%;
  }

  .push-advanced-panel {
    grid-template-columns: 1fr;
  }

  .push-action-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .push-action-buttons {
    width: 100%;
  }

  .push-cancel-button,
  .push-submit-button {
    flex: 1;
  }

  .site-data-grid {
    grid-template-columns: 1fr;
  }

  .site-data-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .site-data-site {
    max-width: 100%;
  }
}
</style>
