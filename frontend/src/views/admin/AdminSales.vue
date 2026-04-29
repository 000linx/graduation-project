<script setup lang="ts">
import SalesBarChart from '../../components/admin/SalesBarChart.vue'
</script>

<template>
  <div class="space-y-5">
    <div>
      <div class="text-2xl font-semibold text-gray-900">销售报表</div>
      <div class="text-sm text-gray-500 mt-1">按时间维度与分类查看销售额，并支持下钻与导出</div>
    </div>
    <SalesBarChart />
  </div>
</template>
