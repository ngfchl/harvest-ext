<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";
import {message} from "ant-design-vue";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CloudSyncOutlined,
  CloudUploadOutlined,
  EditOutlined,
  EllipsisOutlined,
  FormatPainterOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  SyncOutlined,
} from '@ant-design/icons-vue';
import prettyBytes from "pretty-bytes";
import {MySite} from "@/types";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  importMode,
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
  signSingleSite,
  isOpenInPopup,
  cacheServerData,
  switchImportMode,
  syncSingleSiteCookie,
  autoClearSitesHarvestInfo,
} = settingStore
// const mySiteId = ref<number>(0)
const showSider = ref(false);
const showSiteList = ref(false);
const collapsed = ref(false);
const privateMode = ref(false);
const searchKey = ref('');

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
  message.loading({content: () => showText.value, duration: 0, type: 'warning'});
  await autoSyncCookie()
}
onMounted(async () => {
  console.log("打开弹出页面！:")
  await getSetting()
  console.log(setting.value)
  isOpenInPopupFlag.value = await isOpenInPopup()
  importMode.value = await storage.getItem('local:importMode') || false
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  showSiteList.value = JSON.parse(localStorage.getItem('switchShowSiteList') || 'true');
  privateMode.value = JSON.parse(localStorage.getItem('privateMode') || 'true');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
})
const onCollapse = (collapse: boolean) => {
  collapsed.value = collapse;
}
const checkScreenSize = () => {
  showSider.value = window.innerWidth >= 768;
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
</script>

<template>
  <a-layout>
    <a-layout-sider
        v-show="showSider"
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
              v-if="syncMode"
              :description="showText"
              type="info"
          />
          <a-alert
              v-if="syncMode"
              :description="`正在同步站点 Cookie ${count}/${Object.values(mySiteList!).filter((site) => site.available && site.nickname.includes(searchKey)).length}`"
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
                :danger="privateMode"
                block
                type="primary"
                @click="switchPrivateMode"
            >
              <span v-if="privateMode">公开模式</span>
              <span v-else>隐私模式</span>
            </a-button>
            <a-popover title="缓存服务器数据">
              <template #content>
                <p>从收割机服务器拉取站点配置列表，已有站点列表，下载器列表，缓存到本地，减少交互，提高效率</p>
              </template>
              <a-button
                  block
                  type="primary"
                  @click="cacheServerData"
              >
                更新缓存
              </a-button>
            </a-popover>
            <a-popover title="一键同步Cookie">
              <template #content>
                <p>一键同步已添加站点的 Cookie 信息，此功能仅同步 Cookie 和 UserAgent</p>
              </template>
              <a-button
                  block
                  type="primary"
                  @click="oneKeySync"
              >
                一键同步
              </a-button>
            </a-popover>
            <a-popover title="导入模式开关">
              <template #content>
                <p>
                  打开导入模式时，会显示一键添加按钮，此时可以一键导入未添加的站点
                </p>
                <p>
                  站点添加成功后会关掉当前页面，未关掉的站点就是添加失败的，可以手动点击同步数据按钮
                </p>
                <p>
                  如果你发现你的个人中心或者控制面板打开后页面自动关闭，请关闭导入模式！
                </p>
              </template>
              <a-button
                  v-if="importMode"
                  block
                  danger
                  ghost
                  type="primary"
                  @click="switchImportMode"
              >
                <span>导入模式:开</span>
              </a-button>
              <a-button
                  v-else
                  block
                  type="primary"
                  @click="switchImportMode"
              >
                <span>导入模式:关</span>
              </a-button>
            </a-popover>
            <a-popover title="一键添加站点">
              <template #content>
                <p>筛选未添加的站点列表，同时在本地的 Cookie 信息中筛选访问过的站点，抓取 Cookie 和
                  UserAgent，同步到收割机服务器，然后批量打开</p>
              </template>
              <a-button
                  v-if="importMode"
                  block
                  ghost
                  type="primary"
                  @click="autoAddSites"
              >
                一键添加
              </a-button>
            </a-popover>
            <a-popover title="清理单站收割机缓存">
              <template #content>
                <p>
                  清理单站收割机缓存会挨个打开站点所有 url，并从本地存储删除收割机站点 ID 和站点配置文件缓存
                </p>
              </template>
              <a-button
                  block
                  danger
                  ghost
                  type="primary"
                  @click="autoClearSitesHarvestInfo"
              >
                <span>清理缓存:慎用</span>
              </a-button>
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
                placeholder="站点快速搜索"
            />
          </a-col>
        </a-row>
      </a-layout-header>
      <a-layout-content class="content">

        <div v-if="canSave">

          <a-row v-if="showSiteList" :gutter="[12,8]" justify="space-around" type="flex">
            <a-col
                v-for="mySite in Object.values(mySiteList!).filter((site) => site.available && ( site.nickname.includes(searchKey.trim()) || site.site.includes(searchKey.trim())  || site.mirror?.includes(searchKey.trim())))"
                :lg="8" :md="12"
                :sm="24"
                :xl="6">
              <a-card hoverable style="width: 100% !important;min-width: 300px;">
                <template v-if="mySite.mail>0" #extra>
                  <a-badge :count="mySite.mail" :offset="[5,-1]">
                    <mail-outlined style="color: #a6a6a6"/>
                  </a-badge>
                </template>
                <template #title>
                  <a-avatar v-if="!privateMode" :size="20" :src="`${mySite.mirror}/${webSiteList![mySite.site].logo}`"/>
                  <a-button :href="mySite.mirror" target="_blank" type="link">
                    <span
                        v-text="`${mySite.nickname[0].toUpperCase()}${privateMode ? '*' :mySite.nickname.slice(1)}`"></span>
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
                    <template #title>更多功能，敬请期待</template>
                    <ellipsis-outlined key="ellipsis"/>
                  </a-tooltip>


                </template>
                <a-card-meta>
                  <template #avatar>

                  </template>
                  <template #description>
                    <a-row class="site-data">
                      <a-col :span="8">
                        <arrow-up-outlined/>
                        {{ mySite.status?.seed }}
                      </a-col>
                      <a-col :span="8">
                        <arrow-down-outlined/>
                        {{ mySite.status?.leech }}
                      </a-col>
                      <a-col :span="8">
                        <share-alt-outlined/>
                        {{
                          // @ts-ignore
                          mySite.status?.downloaded ? (mySite.status?.uploaded / mySite.status?.downloaded).toFixed() : 0
                        }}
                        [{{ mySite.status?.publish || 0 }}]
                      </a-col>
                      <a-col :span="8">
                        <cloud-upload-outlined/>

                        {{
                          // @ts-ignore
                          prettyBytes(mySite.status?.uploaded || 0)
                        }}
                      </a-col>
                      <a-col :span="8">
                        <cloud-download-outlined/>
                        {{
                          // @ts-ignore
                          prettyBytes(mySite.status?.downloaded || 0)
                        }}
                      </a-col>
                      <a-col :span="8">
                        <cloud-sync-outlined/>
                        {{
                          // @ts-ignore
                          prettyBytes(mySite.status?.seed_volume || 0)
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
}
</style>
