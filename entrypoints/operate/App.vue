<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue';
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
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FieldTimeOutlined,
  FilterOutlined,
  FormatPainterOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SwapOutlined,
  SyncOutlined,
  UserAddOutlined,
} from '@ant-design/icons-vue';
import prettyBytes from "pretty-bytes";
import {MySite} from "@/types";
import numberFormat from "@/utils/numberFormat";
import copy from "copy-to-clipboard";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  importMode,
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
  autoAddSites,
  autoSyncCookie,
  getCookieString,
  refreshSingleSite,
  autoImportCookie,
  signSingleSite,
  cacheServerData,
  switchImportMode,
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
const filterKey = ref('alive');
const showMySiteList = ref<MySite[]>([]);
const hadList = ref<string[]>([]);
const cookieInfoMap = ref<{ [key: string]: string }>();

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
  null: '清除筛选',
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
const doSort = (value: string = '') => {
  switch (value) {
    case 'mail':
    case 'notice':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.mail + b.notice - (a.mail + a.notice))
      break;
    case 'downloaded':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.downloaded - a.status?.downloaded)
      break;
    case 'uploaded':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.uploaded - a.status?.uploaded)
      break;
    case 'my_bonus':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.my_bonus - a.status?.my_bonus)
      break;
    case 'my_score':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.my_score - a.status?.my_score)
      break;
    case 'seed':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.seed - a.status?.seed)
      break;
    case 'leech':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.leech - a.status?.leech)
      break;
    case 'invitation':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.invitation - a.status?.invitation)
      break;
    case 'seed_volume':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.seed_volume - a.status?.seed_volume)
      break;
    case 'updated_at':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.updated_at - a.status?.updated_at)
      break;
    case 'bonus_hour':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.bonus_hour - a.status?.bonus_hour)
      break;
    case 'ratio':
      showMySiteList.value = showMySiteList.value.sort((a, b) => b.status?.ratio - a.status?.ratio)
      break;
  }
  if (reverseMode.value) {
    showMySiteList.value = [...(showMySiteList.value || [])].reverse()
  }
}
const handleSortList: MenuProps['onClick'] = key => {
  console.log(key)
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
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await autoSyncCookie()
  await sleep(3000)
  message.destroy()
  showText.value = ''
}
const oneKeySignIn = async () => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = "正在批量打开未签到站点"
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  const toSignList = Object.values(mySiteList.value!).filter(site => site.available && site.sign_in && site.sign_info == null)
  await autoSignAll(toSignList)
  await sleep(3000)
  message.destroy()
  showText.value = ''
}
const oneKeyOpenInTab = async () => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = "正在批量打开站点"
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await autoOpenAll(showMySiteList.value)
  await sleep(3000)
  message.destroy()
  showText.value = ''
}
const oneKeyImportCookies = async () => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await autoImportCookie()
  await sleep(3000)
  message.destroy()
  showText.value = ''
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
  let urlList = Object.values(webSiteList.value!).map(item => item.url).flat();
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
    importMode.value = await storage.getItem('local:importMode') || false
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
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = `正在抓取站点 ${site.nickname || site.site} Cookie信息...`;
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await syncSingleSiteCookie(site)
  await sleep(3000)
  message.destroy()
  showText.value = ''
}

const refreshSite = async (site: MySite) => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = `正在获取站点 ${site.nickname || site.site}最新数据...`
  message.loading({
    content: () => showText.value,
    duration: 0,
    type: 'warning',
    style: {
      maxWidth: '360px',
      margin: 'auto',
      left: '40vw',
      top: '40px',
    },
  });
  const res = await refreshSingleSite(site)
  if (res.succeed) {
    await cacheServerData()
    onSearch()
  }
  await sleep(2000)
  message.destroy()
  showText.value = ''
}
const signSite = async (site: MySite) => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = `正在签到站点 ${site.nickname || site.site}...`
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  const res = await signSingleSite(site)
  if (res.succeed) {
    await cacheServerData()
    onSearch()
  }
  await sleep(3000)
  message.destroy()
  showText.value = ''
}
const writeSiteCookies = async (site: MySite) => {
  if (showText.value.length > 0) {
    message.warning('有其他操作正在进行，请稍后再试！');
    return;
  }
  showText.value = `正在写入 ${site.nickname || site.site} 站点Cookie...`
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await writeSingleSiteCookies(site)
  await sleep(1000)
  message.destroy()
  showText.value = ''
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
  await saveSetting()
  window.location.reload()
}
const loginServer = async () => {
  await testServer()
  await initData()
}
</script>

<template>
  <a-layout>
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
        style="background: #FFF;text-align: center;" @collapse="onCollapse">
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
            <a-button v-if="!canSave" block ghost type="primary" @click="loginServer">
              登录鉴权
            </a-button>

          </a-space>
          <a-space v-if="canSave" direction="vertical">
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
                <a-button block type="primary">
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
                  @confirm="cacheServerData"
              >
                <a-button
                    block
                    type="primary"
                    @click="cacheServerData"
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
                <a-button block type="primary">
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
                <a-button block type="primary">
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
                <a-button block type="primary">
                  一键写入
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover
                v-if="importMode"
                title="一键添加站点">
              <template #content>
                <div style="max-width: 200px;">
                  筛选未添加的站点列表，同时在本地的 Cookie 信息中筛选访问过的站点，打开站点并抓取
                  Cookie、UserAgent、用户名、UID、Passkey、邮箱等信息，同步到收割机服务器，站点添加成功后会关掉当前页面，未关掉的站点就是添加失败的，请手动处理
                </div>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  placement="bottomRight"
                  title="确定执行批量添加站点功能吗？"
                  @confirm="autoAddSites"
              >
                <a-button block ghost type="primary">
                  一键添加
                </a-button>
              </a-popconfirm>
            </a-popover>
            <a-popover title="批量导入模式开关">
              <template #content>
                <div style="max-width: 200px;">
                  <p>打开导入模式时，会显示一键添加按钮，此时可以一键导入未添加的站点,</p>
                  <p>站点添加成功后会关掉当前页面，未关掉的站点就是添加失败的，可以手动点击同步数据按钮,</p>
                  <p>如果你发现你的个人中心或者控制面板打开后页面自动关闭，请关闭导入模式！</p>
                </div>
              </template>
              <a-button
                  v-if="importMode"
                  block
                  danger
                  ghost
                  type="primary"
                  @click="switchImportMode"
              >
                <span>批量添加:开启</span>
              </a-button>
              <a-button
                  v-else
                  block
                  type="primary"
                  @click="switchImportMode"
              >
                <span>批量添加:关闭</span>
              </a-button>
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
                  @confirm="autoClearSitesHarvestInfo"
              >
                <a-button block
                          danger
                          ghost
                          type="primary">
                  <span>清理缓存:慎用</span>
                </a-button>
              </a-popconfirm>
            </a-popover>
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

            <!--            <a-input-->
            <!--                v-model:value.lazy="setting.imgUrl"-->
            <!--                autofocus-->
            <!--                label="图片地址"-->
            <!--                placeholder="图片地址"-->
            <!--                style="width: 100%"-->
            <!--            />-->
            <a-popover title="更新服务器信息">
              <template #content>
                <p style="max-width: 200px;">
                  这里可以更新收割机服务器地址和认证 Token 信息，并且可以修改站点页面悬浮窗口显示的图片 API，可以是随机图片
                  API，也可以是指定图片 URL 地址
                </p>
              </template>
              <a-popconfirm
                  cancel-text="取消"
                  ok-text="确定"
                  title="确定更新服务器信息吗？？"
                  @confirm="updateSetting"
              >
                <a-button block
                          danger
                          ghost
                          type="primary">
                  <span>更新</span>
                </a-button>
              </a-popconfirm>
            </a-popover>

          </a-space>
        </a-space>
      </a-space>
    </a-layout-sider>
    <a-layout v-if="canSave">
      <a-layout-header class="custom-header" style=" justify-content: end;">
        <a-row justify="end" type="flex">
          <a-col></a-col>
          <a-col style="display: flex;align-items: center;justify-items: end">
            <a-button shape="circle" type="text" @click="handleReverse">
              <template #icon>
                <sort-descending-outlined v-if="reverseMode" style="color: floralwhite;"/>
                <sort-ascending-outlined v-else style="color: floralwhite;"/>
              </template>
            </a-button>

            <a-dropdown>
              <template #overlay>
                <a-menu @click="handleSortList">
                  <a-menu-item v-for="(key,value) in sortKeyList" :key="value" style="font-size: 12px;">{{ key }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="text">
                <swap-outlined style="color: floralwhite;"/>
                <span style="color: floralwhite;font-size: 12px;">{{
                    // @ts-ignore
                    sortKeyList[sortKey]
                  }}</span>
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
        <a-tabs v-model:activeKey="activeKey" centered type="card">
          <a-tab-pane key="1" tab="站点数据">
            <div v-if="showSiteList">
              <a-row :gutter="[12,8]" justify="space-around" style="color: rgba(27, 108, 142, 0.9);" type="flex">
                <a-col>
                  <span>禁用：{{ Object.values(mySiteList!).filter(item => !item.available).length }}</span>
                </a-col>
                <a-col>
                  <span>存活：{{ Object.values(mySiteList!).filter(item => item.available).length }}</span>
                </a-col>
                <a-col>
                  <span>总数：{{ Object.values(mySiteList!).length }}</span>
                </a-col>
                <a-col>
                  <span>筛选：{{ showMySiteList.length }}</span>
                </a-col>
              </a-row>
              <a-row :gutter="[12,8]" justify="space-around" type="flex">
                <a-col
                    v-for="mySite in showMySiteList"
                    :lg="8" :md="12"
                    :sm="24"
                    :xl="6">
                  <a-badge-ribbon :color="calcBadge(mySite)" :text="mySite.available ?'':'站点已禁用'"
                                  placement="start">
                    <a-card hoverable size="small" style="width: 100% !important;min-width: 300px;">
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
                        <a-button :href="mySite.mirror" target="_blank" type="link">
                          <a-tooltip>
                            <template #title>{{ mySite.nickname }}</template>
                            <span
                                v-text="`${mySite.nickname[0].toUpperCase()}${privateMode ? '*' :mySite.nickname.slice(1)}`"></span>
                          </a-tooltip>
                          <!--                    <span v-else-->
                          <!--                          v-text="`${mySite.site[0].toUpperCase()}${privateMode ? '*' :mySite.site.slice(1)}`"></span>-->
                        </a-button>
                        <span style="font-size: 12px;color: gray;">
                      {{
                            // @ts-ignore
                            `${mySite.status?.my_level.replace(/\s/g, '') || 'User'}`
                          }}
                    </span>
                      </template>
                      <template #actions>
                        <a-tooltip>
                          <template #title>刷新站点数据</template>
                          <format-painter-outlined key="refresh" @click="refreshSite(mySite)"/>
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
                          <edit-outlined v-if="mySite.sign_info == null" key="edit" @click="signSite(mySite)"/>
                          <check-circle-outlined v-else key="ok" style="color: #7cb305"/>
                        </a-tooltip>
                        <a-tooltip>
                          <template #title>同步 Cookie</template>
                          <sync-outlined key="sync" @click="syncSingleSite(mySite)"/>
                        </a-tooltip>
                        <a-tooltip>
                          <template #title>导入 Cookie</template>
                          <download-outlined key="sync" @click="writeSiteCookies(mySite)"/>
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
                          <a-row class="site-data">
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

                          <span class="site-data">
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
            <a-row :gutter="[12,8]" justify="space-around" type="flex">
               <span>
                 待添加：{{ Object.values(webSiteList!).filter((item) => !hadList.includes(item.name)).length }}
               </span>
              <span>
                 已添加：{{ hadList.length }}
               </span>
            </a-row>
            <a-row :gutter="[12,8]" justify="space-around" type="flex">
              <a-col
                  v-for="site in Object.values(webSiteList!).filter((item) =>item.alive && (item.name.includes(searchKey)
                  || item.url.some(url => url.includes(searchKey)))
                  ).sort((a, b) => a.url.length - b.url.length )"
                  :lg="8" :md="12"
                  :sm="24"
                  :xl="6">
                <a-badge-ribbon :color="site.alive ? 'green' : 'red'" :placement="site.alive? 'start' : 'end'"
                                :text="site.alive ?'':'站点已禁用'">
                  <a-card hoverable size="small" style="width: 100% !important;min-width: 300px;">
                    <template #extra>
                      <a-tag v-if="hadList.includes(site.name)" color="green">已添加</a-tag>
                      <a-tag v-else color="red">待添加</a-tag>
                    </template>
                    <template #title>
                      <a-avatar v-if="!privateMode" :size="20"
                                :src="`${site.url[0]}/${site.logo}`"/>
                      <a-button :href="site.url[0]" target="_blank" type="link">
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
                        <a-row v-for="url in site.url" style="align-items: center;">

                          <a-button :href="url" target="_blank" type="link">
                            {{ url }}
                          </a-button>

                          <a-button
                              v-if="!hadList.includes(site.name) && cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0"
                              color="green" danger size="small"
                              type="link">
                            添加
                          </a-button>
                          <a-button
                              v-else-if="hadList.includes(site.name) && cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0"
                              color="green" danger size="small" type="link"
                          >更新
                          </a-button>
                          <a-tooltip v-if="cookieInfoMap![url]!=null && cookieInfoMap![url].length > 0">
                            <template #title>
                              <a-typography-paragraph :content="`当前 Cookie：${ cookieInfoMap![url] }`" ellipsis>
                              </a-typography-paragraph>
                            </template>
                            <a-button ghost size="small" type="link" @click="copy(cookieInfoMap![url])">复制</a-button>
                          </a-tooltip>

                        </a-row>
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

.menu-row {
  display: flex;
  top: 0;
  width: 100%;
  align-items: center;
  margin: 0;
}

.site-data {
  font-size: 11px;
}

.custom-header {
  background-color: rgba(27, 108, 142, 0.9) !important;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  margin: 0;
  color: floralwhite !important;
}

.alert-content {
  padding: 12px !important;
}

.content {
  display: flex;
  justify-content: center;
  align-items: start;
  padding: 8px;
  overflow-x: hidden;
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

</style>
