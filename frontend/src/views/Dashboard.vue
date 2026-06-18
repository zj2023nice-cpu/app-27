<template>
  <div class="dashboard">
    <h1 class="page-title">数据仪表盘</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
          👥
        </div>
        <div class="stat-content">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          ✓
        </div>
        <div class="stat-content">
          <div class="stat-label">活跃用户</div>
          <div class="stat-value">{{ stats.activeUsers || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-label">今日新增</div>
          <div class="stat-value">{{ stats.todayUsers || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 角色分布图 -->
      <div class="chart-card">
        <h3 class="chart-title">角色分布</h3>
        <div ref="roleChartRef" style="width: 100%; height: 300px;"></div>
      </div>

      <!-- 操作统计图 -->
      <div class="chart-card">
        <h3 class="chart-title">操作统计</h3>
        <div ref="actionChartRef" style="width: 100%; height: 300px;"></div>
      </div>
    </div>

    <Toast 
      :visible="toastVisible" 
      :message="toastMessage" 
      :type="toastType"
      @close="closeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { dashboardAPI } from '@/api';
import Toast from '@/components/Toast.vue';
import { useToast } from '@/composables/useUI';

const { toastVisible, toastMessage, toastType, showToast, closeToast } = useToast();

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  todayUsers: 0,
  roleDistribution: [],
  actionStats: []
});

const roleChartRef = ref(null);
const actionChartRef = ref(null);

onMounted(async () => {
  await loadStats();
  initCharts();
});

async function loadStats() {
  try {
    const response = await dashboardAPI.getStats();
    if (response.success) {
      stats.value = response.data;
    }
  } catch (error) {
    showToast('获取统计数据失败', 'error');
  }
}

function initCharts() {
  // 角色分布饼图
  if (roleChartRef.value) {
    const roleChart = echarts.init(roleChartRef.value);
    roleChart.setOption({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '0%',
        left: 'center'
      },
      series: [
        {
          name: '角色分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: stats.value.roleDistribution?.map(item => ({
            value: item.count,
            name: item.name
          })) || []
        }
      ],
      color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b']
    });
  }

  // 操作统计柱状图
  if (actionChartRef.value) {
    const actionChart = echarts.init(actionChartRef.value);
    actionChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: stats.value.actionStats?.map(item => item.action) || [],
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#6b7280'
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6'
          }
        }
      },
      series: [
        {
          data: stats.value.actionStats?.map(item => item.count) || [],
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#818cf8' },
              { offset: 1, color: '#6366f1' }
            ])
          }
        }
      ]
    });
  }
}

</script>

<style scoped>
.dashboard {
  width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

</style>
