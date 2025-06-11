<script lang="ts" setup>
import {computed, onMounted} from 'vue';
import {message} from "ant-design-vue";
import {useSettingStore} from "@/hooks/use-setting";
import {storeToRefs} from "pinia";

const settingStore = useSettingStore()
const {
  setting,
  canSave,
  baseUrl,
  token,
} = storeToRefs(settingStore)
const {saveSetting, getSetting, testServer} = settingStore
// const mySiteId = ref<number>(0)
// const siteInfo = ref();

// 响应式表单最大宽度
const formMaxWidth = computed(() => {
  return window.innerWidth < 350 ? '90%' : '350px';
});

// 保存设置
const saveSettings = async () => {
  if (!setting.value.baseUrl.startsWith('https://') && !setting.value.baseUrl.startsWith('http://')) {
    message.warn("服务器地址填写出错了，请以 http:// 或 https:// 开头");
    return;
  }
  if (!setting.value.baseUrl.endsWith('/')) {
    setting.value.baseUrl = `${setting.value.baseUrl}/`;
  }
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

          <a-form-item>
            <a-space>
              <a-button block ghost type="primary" @click="testServer">
                测试
              </a-button>
              <a-button
                  :href="baseUrl"
                  danger
                  target="_blank"
                  type="primary"
              >
                打开
              </a-button>

              <a-button
                  v-if="canSave"
                  block
                  type="primary"
                  @click="saveSettings"
              >
                保存
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
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
