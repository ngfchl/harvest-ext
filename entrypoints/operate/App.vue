<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";
import {message} from "ant-design-vue";
import {
  AreaChartOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FieldTimeOutlined,
  FormatPainterOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  SyncOutlined,
  UserAddOutlined,
} from '@ant-design/icons-vue';
import prettyBytes from "pretty-bytes";
import {MySite} from "@/types";
import numberFormat from "@/utils/numberFormat";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  importMode,
  importCookieMode,
  isOpenInPopupFlag,
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
  autoAddSites,
  autoSyncCookie,
  refreshSingleSite,
  autoImportCookie,
  signSingleSite,
  isOpenInPopup,
  cacheServerData,
  switchImportMode,
  syncSingleSiteCookie,
  autoClearSitesHarvestInfo,
  writeSingleSiteCookies,
} = settingStore
// const mySiteId = ref<number>(0)
const showSiteList = ref(false);
const collapsed = ref(false);
const privateMode = ref(false);
const searchKey = ref('');
const sortKey = ref('mail');
const showMySiteList = ref<MySite[]>([]);


const onSearch = (value: string | null = '') => {
  console.log(value);
  showMySiteList.value = Object.values(mySiteList.value!).filter(
      (site) => site.available && (
          site.nickname.toLowerCase().includes(searchKey.value.trim().toLowerCase()) ||
          site.site.toLowerCase().includes(searchKey.value.trim().toLowerCase()) ||
          site.mirror?.toLowerCase().includes(searchKey.value.trim().toLowerCase())
      )
  ).sort((a, b) => b.mail + b.notice - (a.mail + a.notice))
  switch (sortKey.value) {
    case 'mail':
    case 'notice':
      showMySiteList.value.toSorted((a, b) => b.mail + b.notice - (a.mail + a.notice))
      break;
    case 'downloaded':
      showMySiteList.value.toSorted((a, b) => b.status?.downloaded - a.status?.downloaded)
      break;
    case 'uploaded':
      showMySiteList.value.toSorted((a, b) => b.status?.uploaded - a.status?.uploaded)
      break;
    case 'my_bonus':
      showMySiteList.value.toSorted((a, b) => b.status?.my_bonus - a.status?.my_bonus)
      break;
    case 'my_score':
      showMySiteList.value.toSorted((a, b) => b.status?.my_score - a.status?.my_score)
      break;
    case 'seed':
      showMySiteList.value.toSorted((a, b) => b.status?.seed - a.status?.seed)
      break;
    case 'leech':
      showMySiteList.value.toSorted((a, b) => b.status?.leech - a.status?.leech)
      break;
    case 'invitation':
      showMySiteList.value.toSorted((a, b) => b.status?.invitation - a.status?.invitation)
      break;
    case 'seed_volume':
      showMySiteList.value.toSorted((a, b) => b.status?.seed_volume - a.status?.seed_volume)
      break;
    case 'updated_at':
      showMySiteList.value.toSorted((a, b) => b.status?.updated_at - a.status?.updated_at)
      break;
    case 'bonus_hour':
      showMySiteList.value.toSorted((a, b) => b.status?.bonus_hour - a.status?.bonus_hour)
      break;
    case 'ratio':
      showMySiteList.value.toSorted((a, b) => b.status?.ratio - a.status?.ratio)
      break;
  }
}
// 响应式表单最大宽度
const formMaxWidth = computed(() => {
  return window.innerWidth < 350 ? '90%' : '350px';
});
const switchShowSiteList = () => {
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
  await cacheServerData()
  isOpenInPopupFlag.value = await isOpenInPopup()
  importMode.value = await storage.getItem('local:importMode') || false
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  showSiteList.value = JSON.parse(localStorage.getItem('switchShowSiteList') || 'true');
  privateMode.value = JSON.parse(localStorage.getItem('privateMode') || 'true');
  showMySiteList.value = Object.values(mySiteList.value!)
});

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
  await refreshSingleSite(site)
  await cacheServerData()
  await sleep(3000)
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
  await signSingleSite(site)
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
</script>

<template>
  <a-layout>
    <a-layout-sider
        :collapsed="collapsed"
        :collapsible="true"
        :zeroWidthTriggerStyle="{
          top: 0,
          backgroundColor: 'transparent !important',
        }"
        collapsedWidth="0"
        style="background: #FFF;text-align: center;"
        width="220" @collapse="onCollapse">
      <template #trigger>
        <menu-unfold-outlined v-if="collapsed"/>
        <menu-fold-outlined v-else/>
      </template>
      <a-layout-header class="custom-header">
        <a-avatar :size="22" shape="square" style="color: #f56a00; background-color: #fde3cf">
          H
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
              <a-form-item
                  :wrapper-col="{ span: 24 }"
              >
                <a-input
                    v-model:value.lazy="setting.imgUrl"
                    autofocus
                    label="图片地址"
                    placeholder="图片地址"
                    style="width: 100%"
                />
              </a-form-item>
            </a-form>
          </a-space>
          <a-space>
            <a-button v-if="!canSave" block ghost type="primary" @click="testServer">
              登录鉴权
            </a-button>
            <!--          <a-button-->
            <!--              v-if="isOpenInPopupFlag"-->
            <!--              danger-->
            <!--              ghost-->
            <!--              type="primary"-->
            <!--              @click="openPopupInTab"-->
            <!--          >-->
            <!--            打开网页-->
            <!--          </a-button>-->
          </a-space>
          <a-space v-if="canSave" direction="vertical">
            <a-button
                block
                type="primary"
                @click="switchShowSiteList"
            >
              <span v-if="showSiteList">隐藏站点</span>
              <span v-else>显示站点</span>
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
          </a-space>
        </a-space>
      </a-space>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="custom-header" style=" justify-content: end;">
        <a-row justify="end" type="flex">
          <a-col></a-col>
          <a-col style="display: flex;align-items: center;justify-items: end">
            <a-input-search
                v-model:value="searchKey" :bordered="false"
                :loading="searchKey.length > 0"
                allow-clear
                class="custom-input-search"
                placeholder="站点快速搜索"
                @change="onSearch"
            />
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content class="content">

        <div v-if="canSave">

          <a-row v-if="showSiteList" :gutter="[12,8]" justify="space-around" type="flex">
            <a-col
                v-for="mySite in showMySiteList"
                :lg="8" :md="12"
                :sm="24"
                :xl="6">
              <a-card hoverable style="width: 100% !important;min-width: 300px;">
                <template #extra>
                  <a-badge v-if="mySite.notice > 0" :count="mySite.notice" :offset="[2,0]">
                    <bell-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                  </a-badge>
                  <a-badge v-if="mySite.mail > 0" :count="mySite.mail" :offset="[2,0]">
                    <mail-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                  </a-badge>
                  <a-badge v-if="mySite.status?.invitation != undefined && mySite.status?.invitation > 0"
                           :count="mySite.status?.invitation" :offset="[2,0]">
                    <user-add-outlined style="color: #a6a6a6;margin-left: 6px !important;"/>
                  </a-badge>
                </template>
                <template #title>
                  <a-avatar v-if="!privateMode" :size="20" :src="`${mySite.mirror}/${webSiteList![mySite.site].logo}`"/>
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
                    <template #title>签到签到</template>
                    <edit-outlined key="edit" @click="signSite(mySite)"/>
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
                    <template #title>更多功能，敬请期待</template>
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
                          mySite.status?.downloaded ? (mySite.status?.uploaded / mySite.status?.downloaded).toFixed() : 0
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
            </a-col>
          </a-row>

          <a-row v-else justify="space-around" type="flex">
            <a-col>
              倒车请注意
            </a-col>
          </a-row>
        </div>
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
  color: floralwhite;
}

::v-deep(.custom-input-search .ant-input-search-button) {
  background-color: rgba(27, 108, 142, 0.0) !important;
  color: floralwhite !important;
  border: none !important;
  box-shadow: none !important;
}

</style>
