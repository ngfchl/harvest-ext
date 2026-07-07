<script lang="ts" setup>
const operateUrl = browser.runtime.getURL('/operate.html');
const openOperatePage = async () => {
  await browser.tabs.create({url: operateUrl});
  window.close();
}

onMounted(() => {
  // 页面加载后自动打开目标页面并关闭自己
  openOperatePage();
})
</script>

<template>
  <main class="popup-page">
    <img alt="收割机助手" class="popup-logo" src="/icon/128.png"/>
    <h1>收割机助手</h1>
    <p>正在打开管理页</p>
    <button type="button" @click="openOperatePage">立即打开</button>
  </main>
</template>

<style scoped>
.popup-page {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  gap: 8px;
  min-width: 240px;
  min-height: 180px;
  padding: 22px;
  background: #f8fafc;
  color: #172033;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-align: center;
}

.popup-logo {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
}

h1 {
  margin: 4px 0 0;
  font-size: 16px;
  line-height: 22px;
}

p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

button {
  width: 100%;
  height: 32px;
  margin-top: 6px;
  border: 1px solid #0e7490;
  border-radius: 6px;
  background: #155e75;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

button:hover {
  background: #0e7490;
}
</style>
