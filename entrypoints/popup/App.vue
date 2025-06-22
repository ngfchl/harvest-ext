<script lang="ts" setup>
onMounted(() => {
  // 页面加载后自动打开目标页面并关闭自己
  browser.tabs.create({url: browser.runtime.getURL('/operate.html')});
  window.close();
})
</script>

<template>

</template>

<style scoped>

</style>