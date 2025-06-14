<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
} = storeToRefs(settingStore)
const {
  saveSetting,
  getSetting,
  testServer,
  autoAddSites,
  autoSyncCookie,
  cacheServerData,
} = settingStore
// const mySiteId = ref<number>(0)
// const siteInfo = ref();

// 响应式表单最大宽度
const formMaxWidth = computed(() => {
  return window.innerWidth < 350 ? '90%' : '350px';
});

// 保存设置
const saveSettings = async () => {
  console.log('保存设置:', setting.value);
  try {
    await saveSetting(setting.value)
    console.log('设置保存成功');
  } catch (e) {
    console.error('保存失败:', e);
  }
};


onMounted(async () => {
  console.log("打开弹出页面！")
  await getSetting()
  console.log(setting.value)
});


</script>

<template>
  <div class="popup-container">
    <a-layout class="full-height">
      <a-layout-header class="header">
        <a-typography-title :level="3" class="title">收割机</a-typography-title>
      </a-layout-header>
      <a-layout-content class="content">
        <a-space direction="vertical">
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
                :href="setting.baseUrl"
                danger
                target="_blank"
                type="primary"
            >
              打开网页
            </a-button>
          </a-space>
          <a-space v-if="canSave">
            <a-button
                block
                type="primary"
                @click="saveSettings"
            >
              保存配置
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
                数据缓存
              </a-button>
            </a-popover>
          </a-space>
          <a-space v-if="canSave">
            <a-popover title="一键添加站点">
              <template #content>
                <p>筛选未添加的站点列表，同时在本地的 Cookie 信息中筛选访问过的站点，抓取 Cookie 和
                  UserAgent，同步到收割机服务器，然后批量打开</p>
              </template>
              <a-button
                  block
                  type="primary"
                  @click="autoAddSites"
              >
                一键添加
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
        </a-space>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
.popup-container,
.ant-layout {
  min-height: 200px; /* 设置最小高度防止内容溢出 */
  min-width: 320px;
  overflow: hidden;
  width: 100%;
  height: 100%;
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

/* 响应式调整 */
@media (max-width: 350px) {
  .ant-input-group {
    flex-direction: column;
  }

  .ant-input-group .ant-btn {
    width: 100%;
    margin-top: 8px;
  }
}

body {
  margin: 0 !important;
  padding: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
