<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  importMode,
  isOpenInPopupFlag,
} = storeToRefs(settingStore)
const {
  getSetting,
  testServer,
  autoAddSites,
  autoSyncCookie,
  openPopupInTab,
  isOpenInPopup,
  cacheServerData,
  switchImportMode,
  autoClearSitesHarvestInfo,
} = settingStore
// const mySiteId = ref<number>(0)
// const siteInfo = ref();

// 响应式表单最大宽度
const formMaxWidth = computed(() => {
  return window.innerWidth < 350 ? '90%' : '350px';
});


onMounted(async () => {
  console.log("打开弹出页面！:")
  await getSetting()
  console.log(setting.value)
  isOpenInPopupFlag.value = await isOpenInPopup()
  importMode.value = await storage.getItem('local:importMode') || false
});


</script>

<template>
  <a-layout>
    <a-layout-header class="header">
      <a-typography-title :level="3" class="title">收割机</a-typography-title>
    </a-layout-header>
    <a-layout-content class="content">
      <a-space align="center" direction="vertical">
        <a-space size="small">
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
          <a-button block ghost type="primary" @click="testServer">
            登录鉴权
          </a-button>
          <a-button
              v-if="isOpenInPopupFlag"
              danger
              ghost
              type="primary"
              @click="openPopupInTab"
          >
            打开网页
          </a-button>
        </a-space>
        <a-space v-if="canSave">
          <!--            <a-button-->
          <!--                block-->
          <!--                type="primary"-->
          <!--                @click="saveSettings"-->
          <!--            >-->
          <!--              保存配置-->
          <!--            </a-button>-->
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
                @click="autoSyncCookie"
            >
              一键同步
            </a-button>
          </a-popover>
        </a-space>
        <a-space v-if="canSave">
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
        </a-space>
        <a-space v-if="canSave">
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
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
.ant-layout {
  min-height: 200px; /* 设置最小高度防止内容溢出 */
  min-width: 320px;
  overflow: hidden;
}

.header {
  background-color: rgba(27, 108, 142, 0.9);
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.title {
  color: white;
  margin: 0;
}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.form-container {
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
}

</style>
