<template>
  <div class="performance-page">
    <div class="page-header">
      <h1>
        <Activity class="icon" />
        性能监控演示
      </h1>
      <p>展示性能指标收集、分析和优化建议功能</p>
    </div>

    <!-- 性能概览 -->
    <div class="section">
      <h2 class="section-title">
        <BarChart class="icon" />
        性能概览
      </h2>
      
      <div class="performance-overview">
        <div class="overview-stats">
          <div class="stat-card cpu">
            <div class="stat-icon">
              <Cpu class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ performanceStats.cpuUsage }}%</div>
              <div class="stat-label">CPU 使用率</div>
              <div class="stat-trend" :class="performanceStats.cpuTrend">
                <TrendingUp v-if="performanceStats.cpuTrend === 'up'" class="trend-icon" />
                <TrendingDown v-else class="trend-icon" />
                {{ performanceStats.cpuChange }}%
              </div>
            </div>
          </div>
          
          <div class="stat-card memory">
            <div class="stat-icon">
              <HardDrive class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ performanceStats.memoryUsage }}MB</div>
              <div class="stat-label">内存使用</div>
              <div class="stat-trend" :class="performanceStats.memoryTrend">
                <TrendingUp v-if="performanceStats.memoryTrend === 'up'" class="trend-icon" />
                <TrendingDown v-else class="trend-icon" />
                {{ performanceStats.memoryChange }}MB
              </div>
            </div>
          </div>
          
          <div class="stat-card response">
            <div class="stat-icon">
              <Clock class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ performanceStats.responseTime }}ms</div>
              <div class="stat-label">响应时间</div>
              <div class="stat-trend" :class="performanceStats.responseTrend">
                <TrendingUp v-if="performanceStats.responseTrend === 'up'" class="trend-icon" />
                <TrendingDown v-else class="trend-icon" />
                {{ performanceStats.responseChange }}ms
              </div>
            </div>
          </div>
          
          <div class="stat-card throughput">
            <div class="stat-icon">
              <Zap class="icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ performanceStats.throughput }}</div>
              <div class="stat-label">吞吐量/秒</div>
              <div class="stat-trend" :class="performanceStats.throughputTrend">
                <TrendingUp v-if="performanceStats.throughputTrend === 'up'" class="trend-icon" />
                <TrendingDown v-else class="trend-icon" />
                {{ performanceStats.throughputChange }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="performance-actions">
          <button 
            @click="toggleMonitoring"
            class="btn"
            :class="isMonitoring ? 'btn-warning' : 'btn-success'"
          >
            <component :is="isMonitoring ? 'Pause' : 'Play'" class="btn-icon" />
            {{ isMonitoring ? '停止监控' : '开始监控' }}
          </button>
          <button @click="runBenchmark" class="btn btn-primary" :disabled="isBenchmarkRunning">
            <TestTube class="btn-icon" />
            运行基准测试
          </button>
          <button @click="generateReport" class="btn btn-secondary">
            <FileText class="btn-icon" />
            生成报告
          </button>
          <button @click="optimizePerformance" class="btn btn-warning">
            <Settings class="btn-icon" />
            性能优化
          </button>
        </div>
      </div>
    </div>

    <!-- 实时性能图表 -->
    <div class="section">
      <h2 class="section-title">
        <LineChart class="icon" />
        实时性能图表
      </h2>
      
      <div class="performance-charts">
        <div class="chart-controls">
          <div class="time-range">
            <label>时间范围:</label>
            <select v-model="chartTimeRange" class="form-select" @change="updateChartData">
              <option value="1m">最近1分钟</option>
                <option value="5m">最近5分钟</option>
                <option value="15m">最近15分钟</option>
                <option value="1h">最近1小时</option>
            </select>
          </div>
          
          <div class="chart-metrics">
            <label>
              <input 
                v-model="visibleMetrics.cpu"
                type="checkbox"
                class="form-checkbox"
              />
              CPU 使用率
            </label>
            <label>
              <input 
                v-model="visibleMetrics.memory"
                type="checkbox"
                class="form-checkbox"
              />
              内存使用
            </label>
            <label>
              <input 
                v-model="visibleMetrics.response"
                type="checkbox"
                class="form-checkbox"
              />
              响应时间
            </label>
            <label>
              <input 
                v-model="visibleMetrics.throughput"
                type="checkbox"
                class="form-checkbox"
              />
              吞吐量
            </label>
          </div>
        </div>
        
        <div class="chart-container">
          <div class="chart-grid">
            <!-- CPU 使用率图表 -->
            <div v-if="visibleMetrics.cpu" class="chart-item">
              <h4>CPU 使用率 (%)</h4>
              <div class="chart-canvas">
                <div class="chart-line cpu-line">
                  <div 
                    v-for="(point, index) in chartData.cpu" 
                    :key="index"
                    class="chart-point"
                    :style="{
                      left: `${(index / (chartData.cpu.length - 1)) * 100}%`,
                      bottom: `${point}%`
                    }"
                    :title="`${point}%`"
                  ></div>
                </div>
                <div class="chart-axis">
                  <div class="y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 内存使用图表 -->
            <div v-if="visibleMetrics.memory" class="chart-item">
              <h4>内存使用 (MB)</h4>
              <div class="chart-canvas">
                <div class="chart-line memory-line">
                  <div 
                    v-for="(point, index) in chartData.memory" 
                    :key="index"
                    class="chart-point"
                    :style="{
                      left: `${(index / (chartData.memory.length - 1)) * 100}%`,
                      bottom: `${(point / Math.max(...chartData.memory)) * 100}%`
                    }"
                    :title="`${point}MB`"
                  ></div>
                </div>
                <div class="chart-axis">
                  <div class="y-axis">
                    <span>{{ Math.max(...chartData.memory) }}MB</span>
                    <span>{{ Math.round(Math.max(...chartData.memory) * 0.75) }}MB</span>
                    <span>{{ Math.round(Math.max(...chartData.memory) * 0.5) }}MB</span>
                    <span>{{ Math.round(Math.max(...chartData.memory) * 0.25) }}MB</span>
                    <span>0MB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 响应时间图表 -->
            <div v-if="visibleMetrics.response" class="chart-item">
              <h4>响应时间 (ms)</h4>
              <div class="chart-canvas">
                <div class="chart-line response-line">
                  <div 
                    v-for="(point, index) in chartData.response" 
                    :key="index"
                    class="chart-point"
                    :style="{
                      left: `${(index / (chartData.response.length - 1)) * 100}%`,
                      bottom: `${(point / Math.max(...chartData.response)) * 100}%`
                    }"
                    :title="`${point}ms`"
                  ></div>
                </div>
                <div class="chart-axis">
                  <div class="y-axis">
                    <span>{{ Math.max(...chartData.response) }}ms</span>
                    <span>{{ Math.round(Math.max(...chartData.response) * 0.75) }}ms</span>
                    <span>{{ Math.round(Math.max(...chartData.response) * 0.5) }}ms</span>
                    <span>{{ Math.round(Math.max(...chartData.response) * 0.25) }}ms</span>
                    <span>0ms</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 吞吐量图表 -->
            <div v-if="visibleMetrics.throughput" class="chart-item">
              <h4>吞吐量 (req/s)</h4>
              <div class="chart-canvas">
                <div class="chart-line throughput-line">
                  <div 
                    v-for="(point, index) in chartData.throughput" 
                    :key="index"
                    class="chart-point"
                    :style="{
                      left: `${(index / (chartData.throughput.length - 1)) * 100}%`,
                      bottom: `${(point / Math.max(...chartData.throughput)) * 100}%`
                    }"
                    :title="`${point} req/s`"
                  ></div>
                </div>
                <div class="chart-axis">
                  <div class="y-axis">
                    <span>{{ Math.max(...chartData.throughput) }}</span>
                    <span>{{ Math.round(Math.max(...chartData.throughput) * 0.75) }}</span>
                    <span>{{ Math.round(Math.max(...chartData.throughput) * 0.5) }}</span>
                    <span>{{ Math.round(Math.max(...chartData.throughput) * 0.25) }}</span>
                    <span>0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 基准测试 -->
    <div class="section">
      <h2 class="section-title">
        <TestTube class="icon" />
        基准测试
      </h2>
      
      <div class="benchmark-section">
        <div class="benchmark-controls">
          <div class="test-config">
            <h3>测试配置</h3>
            <div class="config-form">
              <div class="config-row">
                <label>测试类型:</label>
                <select v-model="benchmarkConfig.type" class="form-select">
                  <option value="cpu">CPU 密集型</option>
                  <option value="memory">内存密集型</option>
                  <option value="io">I/O 密集型</option>
                  <option value="mixed">混合测试</option>
                </select>
              </div>
              
              <div class="config-row">
                <label>测试时长 (秒):</label>
                <input 
                  v-model.number="benchmarkConfig.duration"
                  type="number"
                  min="5"
                  max="300"
                  class="form-input"
                />
              </div>
              
              <div class="config-row">
                <label>并发数:</label>
                <input 
                  v-model.number="benchmarkConfig.concurrency"
                  type="number"
                  min="1"
                  max="100"
                  class="form-input"
                />
              </div>
              
              <div class="config-row">
                <label>数据大小 (KB):</label>
                <input 
                  v-model.number="benchmarkConfig.dataSize"
                  type="number"
                  min="1"
                  max="10240"
                  class="form-input"
                />
              </div>
            </div>
            
            <div class="config-actions">
              <button 
                @click="runBenchmark"
                :disabled="isBenchmarkRunning"
                class="btn btn-primary"
              >
                <Play class="btn-icon" />
                开始测试
              </button>
              <button 
                @click="stopBenchmark"
                :disabled="!isBenchmarkRunning"
                class="btn btn-danger"
              >
                <Square class="btn-icon" />
                停止测试
              </button>
              <button @click="resetBenchmark" class="btn btn-secondary">
                <RotateCcw class="btn-icon" />
                重置
              </button>
            </div>
          </div>
          
          <div class="test-progress" v-if="isBenchmarkRunning">
            <h3>测试进度</h3>
            <div class="progress-info">
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: `${(benchmarkProgress / benchmarkConfig.duration) * 100}%` }"
                ></div>
              </div>
              <div class="progress-text">
                {{ benchmarkProgress }}s / {{ benchmarkConfig.duration }}s
              </div>
            </div>
            
            <div class="current-metrics">
              <div class="metric-item">
                <span class="metric-label">当前 CPU:</span>
                <span class="metric-value">{{ currentBenchmarkMetrics.cpu }}%</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">当前内存:</span>
                <span class="metric-value">{{ currentBenchmarkMetrics.memory }}MB</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">当前吞吐量:</span>
                <span class="metric-value">{{ currentBenchmarkMetrics.throughput }} ops/s</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="benchmark-results">
          <h3>测试结果</h3>
          <div v-if="benchmarkResults.length === 0" class="no-results">
            <p>暂无测试结果，请运行基准测试</p>
          </div>
          
          <div v-else class="results-list">
            <div 
              v-for="result in benchmarkResults" 
              :key="result.id"
              class="result-item"
            >
              <div class="result-header">
                <div class="result-title">
                  {{ getBenchmarkTypeText(result.type) }} - {{ formatTime(result.timestamp) }}
                </div>
                <div class="result-duration">{{ result.duration }}s</div>
              </div>
              
              <div class="result-metrics">
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-name">平均 CPU</div>
                    <div class="metric-value">{{ result.metrics.avgCpu }}%</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-name">峰值 CPU</div>
                    <div class="metric-value">{{ result.metrics.maxCpu }}%</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-name">平均内存</div>
                    <div class="metric-value">{{ result.metrics.avgMemory }}MB</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-name">峰值内存</div>
                    <div class="metric-value">{{ result.metrics.maxMemory }}MB</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-name">平均吞吐量</div>
                    <div class="metric-value">{{ result.metrics.avgThroughput }} ops/s</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-name">总操作数</div>
                    <div class="metric-value">{{ result.metrics.totalOps }}</div>
                  </div>
                </div>
              </div>
              
              <div class="result-actions">
                <button @click="viewResultDetails(result)" class="btn btn-sm btn-secondary">
                  <Eye class="btn-icon" />
                  查看详情
                </button>
                <button @click="compareResult(result)" class="btn btn-sm btn-primary">
                  <GitCompare class="btn-icon" />
                  对比
                </button>
                <button @click="exportResult(result)" class="btn btn-sm btn-secondary">
                  <Download class="btn-icon" />
                  导出
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能分析 -->
    <div class="section">
      <h2 class="section-title">
        <PieChart class="icon" />
        性能分析
      </h2>
      
      <div class="performance-analysis">
        <div class="analysis-tabs">
          <button 
            v-for="tab in analysisTabs" 
            :key="tab.id"
            @click="activeAnalysisTab = tab.id"
            class="tab-button"
            :class="{ active: activeAnalysisTab === tab.id }"
          >
            <component :is="tab.icon" class="tab-icon" />
            {{ tab.label }}
          </button>
        </div>
        
        <!-- 瓶颈分析 -->
        <div v-if="activeAnalysisTab === 'bottlenecks'" class="analysis-panel">
          <h3>性能瓶颈分析</h3>
          <div class="bottleneck-list">
            <div 
              v-for="bottleneck in performanceBottlenecks" 
              :key="bottleneck.id"
              class="bottleneck-item"
              :class="bottleneck.severity"
            >
              <div class="bottleneck-icon">
                <component :is="getBottleneckIcon(bottleneck.severity)" class="icon" />
              </div>
              
              <div class="bottleneck-content">
                <div class="bottleneck-title">{{ bottleneck.title }}</div>
                <div class="bottleneck-description">{{ bottleneck.description }}</div>
                <div class="bottleneck-impact">影响: {{ bottleneck.impact }}</div>
                
                <div class="bottleneck-suggestions">
                  <h4>优化建议:</h4>
                  <ul>
                    <li v-for="suggestion in bottleneck.suggestions" :key="suggestion">
                      {{ suggestion }}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div class="bottleneck-actions">
                <button @click="applyOptimization(bottleneck)" class="btn btn-sm btn-primary">
                  <Zap class="btn-icon" />
                  应用优化
                </button>
                <button @click="ignoreBottleneck(bottleneck)" class="btn btn-sm btn-secondary">
                  <EyeOff class="btn-icon" />
                  忽略
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 资源使用分析 -->
        <div v-if="activeAnalysisTab === 'resources'" class="analysis-panel">
          <h3>资源使用分析</h3>
          <div class="resource-analysis">
            <div class="resource-charts">
              <div class="resource-chart">
                <h4>CPU 使用分布</h4>
                <div class="pie-chart">
                  <div class="pie-slice" :style="{ '--percentage': 45, '--color': '#3b82f6' }"></div>
                  <div class="pie-slice" :style="{ '--percentage': 30, '--color': '#10b981' }"></div>
                  <div class="pie-slice" :style="{ '--percentage': 25, '--color': '#f59e0b' }"></div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color" style="background: #3b82f6;"></div>
                    <span>引擎核心 (45%)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: #10b981;"></div>
                    <span>插件系统 (30%)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: #f59e0b;"></div>
                    <span>其他 (25%)</span>
                  </div>
                </div>
              </div>
              
              <div class="resource-chart">
                <h4>内存使用分布</h4>
                <div class="pie-chart">
                  <div class="pie-slice" :style="{ '--percentage': 40, '--color': '#8b5cf6' }"></div>
                  <div class="pie-slice" :style="{ '--percentage': 35, '--color': '#06b6d4' }"></div>
                  <div class="pie-slice" :style="{ '--percentage': 25, '--color': '#84cc16' }"></div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color" style="background: #8b5cf6;"></div>
                    <span>配置管理 (40%)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: #06b6d4;"></div>
                    <span>事件系统 (35%)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: #84cc16;"></div>
                    <span>依赖注入 (25%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="resource-details">
              <div class="detail-section">
                <h4>CPU 使用详情</h4>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-name">引擎初始化</span>
                    <span class="detail-value">12%</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 12%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">插件加载</span>
                    <span class="detail-value">18%</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 18%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">事件处理</span>
                    <span class="detail-value">25%</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 25%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">中间件执行</span>
                    <span class="detail-value">15%</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 15%;"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h4>内存使用详情</h4>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-name">配置缓存</span>
                    <span class="detail-value">45MB</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 45%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">事件队列</span>
                    <span class="detail-value">32MB</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 32%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">插件实例</span>
                    <span class="detail-value">28MB</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 28%;"></div>
                    </div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-name">依赖容器</span>
                    <span class="detail-value">15MB</span>
                    <div class="detail-bar">
                      <div class="detail-fill" style="width: 15%;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 趋势分析 -->
        <div v-if="activeAnalysisTab === 'trends'" class="analysis-panel">
          <h3>性能趋势分析</h3>
          <div class="trend-analysis">
            <div class="trend-summary">
              <div class="summary-card positive">
                <div class="summary-icon">
                  <TrendingUp class="icon" />
                </div>
                <div class="summary-content">
                  <div class="summary-title">性能改善</div>
                  <div class="summary-value">+15%</div>
                  <div class="summary-description">相比上周</div>
                </div>
              </div>
              
              <div class="summary-card negative">
                <div class="summary-icon">
                  <TrendingDown class="icon" />
                </div>
                <div class="summary-content">
                  <div class="summary-title">内存使用增长</div>
                  <div class="summary-value">+8%</div>
                  <div class="summary-description">相比上周</div>
                </div>
              </div>
              
              <div class="summary-card neutral">
                <div class="summary-icon">
                  <Minus class="icon" />
                </div>
                <div class="summary-content">
                  <div class="summary-title">响应时间稳定</div>
                  <div class="summary-value">±2%</div>
                  <div class="summary-description">相比上周</div>
                </div>
              </div>
            </div>
            
            <div class="trend-insights">
              <h4>性能洞察</h4>
              <div class="insight-list">
                <div class="insight-item">
                  <div class="insight-icon">
                    <Lightbulb class="icon" />
                  </div>
                  <div class="insight-content">
                    <div class="insight-title">CPU 使用率优化</div>
                    <div class="insight-description">
                      通过优化事件处理逻辑，CPU 使用率在过去一周下降了 15%，建议继续监控并保持当前优化策略。
                    </div>
                  </div>
                </div>
                
                <div class="insight-item">
                  <div class="insight-icon">
                    <AlertTriangle class="icon" />
                  </div>
                  <div class="insight-content">
                    <div class="insight-title">内存泄漏风险</div>
                    <div class="insight-description">
                      检测到内存使用量持续增长，可能存在内存泄漏。建议检查事件监听器的清理和插件的生命周期管理。
                    </div>
                  </div>
                </div>
                
                <div class="insight-item">
                  <div class="insight-icon">
                    <CheckCircle class="icon" />
                  </div>
                  <div class="insight-content">
                    <div class="insight-title">响应时间稳定</div>
                    <div class="insight-description">
                      响应时间保持在合理范围内，系统整体性能稳定。当前的负载均衡和缓存策略效果良好。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 优化建议 -->
        <div v-if="activeAnalysisTab === 'recommendations'" class="analysis-panel">
          <h3>性能优化建议</h3>
          <div class="recommendations">
            <div 
              v-for="recommendation in performanceRecommendations" 
              :key="recommendation.id"
              class="recommendation-item"
              :class="recommendation.priority"
            >
              <div class="recommendation-header">
                <div class="recommendation-icon">
                  <component :is="getRecommendationIcon(recommendation.priority)" class="icon" />
                </div>
                <div class="recommendation-title">{{ recommendation.title }}</div>
                <div class="recommendation-priority" :class="recommendation.priority">
                  {{ getPriorityText(recommendation.priority) }}
                </div>
              </div>
              
              <div class="recommendation-content">
                <div class="recommendation-description">{{ recommendation.description }}</div>
                
                <div class="recommendation-impact">
                  <div class="impact-item">
                    <span class="impact-label">预期性能提升:</span>
                    <span class="impact-value positive">+{{ recommendation.impact.performance }}%</span>
                  </div>
                  <div class="impact-item">
                    <span class="impact-label">资源节省:</span>
                    <span class="impact-value positive">-{{ recommendation.impact.resources }}%</span>
                  </div>
                  <div class="impact-item">
                    <span class="impact-label">实施难度:</span>
                    <span class="impact-value" :class="getDifficultyClass(recommendation.impact.difficulty)">
                      {{ recommendation.impact.difficulty }}
                    </span>
                  </div>
                </div>
                
                <div class="recommendation-steps">
                  <h5>实施步骤:</h5>
                  <ol>
                    <li v-for="step in recommendation.steps" :key="step">
                      {{ step }}
                    </li>
                  </ol>
                </div>
              </div>
              
              <div class="recommendation-actions">
                <button @click="applyRecommendation(recommendation)" class="btn btn-sm btn-primary">
                  <Play class="btn-icon" />
                  应用建议
                </button>
                <button @click="scheduleRecommendation(recommendation)" class="btn btn-sm btn-secondary">
                  <Calendar class="btn-icon" />
                  计划实施
                </button>
                <button @click="dismissRecommendation(recommendation)" class="btn btn-sm btn-warning">
                  <X class="btn-icon" />
                  忽略
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import {
  Activity,
  BarChart,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  TestTube,
  FileText,
  Settings,
  LineChart,
  Square,
  RotateCcw,
  Eye,
  GitCompare,
  Download,
  PieChart,
  AlertTriangle,
  EyeOff,
  CheckCircle,
  Minus,
  Lightbulb,
  Calendar,
  X
} from 'lucide-vue-next'

// 注入引擎服务
const engine = inject('engine') as any

// 响应式数据
const isMonitoring = ref(true)
const isBenchmarkRunning = ref(false)
const benchmarkProgress = ref(0)
const chartTimeRange = ref('5m')
const activeAnalysisTab = ref('bottlenecks')
let monitoringInterval: number | null = null
let benchmarkInterval: number | null = null

// 性能统计
const performanceStats = ref({
  cpuUsage: 45,
  cpuTrend: 'down',
  cpuChange: -5,
  memoryUsage: 128,
  memoryTrend: 'up',
  memoryChange: 12,
  responseTime: 85,
  responseTrend: 'down',
  responseChange: -8,
  throughput: 1250,
  throughputTrend: 'up',
  throughputChange: 150
})

// 可见指标
const visibleMetrics = ref({
  cpu: true,
  memory: true,
  response: true,
  throughput: true
})

// 图表数据
const chartData = ref({
  cpu: [30, 35, 42, 38, 45, 41, 48, 44, 39, 42, 45, 43],
  memory: [110, 115, 120, 125, 128, 132, 128, 125, 130, 128, 126, 128],
  response: [95, 88, 92, 85, 78, 82, 85, 80, 75, 78, 85, 82],
  throughput: [1100, 1150, 1200, 1180, 1250, 1220, 1280, 1260, 1240, 1250, 1270, 1250]
})

// 基准测试配置
const benchmarkConfig = ref({
  type: 'mixed',
  duration: 30,
  concurrency: 10,
  dataSize: 1024
})

// 当前基准测试指标
const currentBenchmarkMetrics = ref({
  cpu: 0,
  memory: 0,
  throughput: 0
})

// 基准测试结果
const benchmarkResults = ref([
  {
    id: 1,
    timestamp: Date.now() - 3600000,
    type: 'cpu',
    duration: 60,
    metrics: {
      avgCpu: 65,
      maxCpu: 85,
      avgMemory: 145,
      maxMemory: 180,
      avgThroughput: 980,
      totalOps: 58800
    }
  },
  {
    id: 2,
    timestamp: Date.now() - 7200000,
    type: 'memory',
    duration: 45,
    metrics: {
      avgCpu: 42,
      maxCpu: 58,
      avgMemory: 220,
      maxMemory: 280,
      avgThroughput: 750,
      totalOps: 33750
    }
  }
])

// 分析标签页
const analysisTabs = [
  { id: 'bottlenecks', label: '瓶颈分析', icon: 'AlertTriangle' },
  { id: 'resources', label: '资源使用', icon: 'PieChart' },
  { id: 'trends', label: '趋势分析', icon: 'TrendingUp' },
  { id: 'recommendations', label: '优化建议', icon: 'Lightbulb' }
]

// 性能瓶颈
const performanceBottlenecks = ref([
  {
    id: 1,
    title: 'CPU 使用率过高',
    description: '事件处理器在高并发情况下消耗过多 CPU 资源',
    severity: 'high',
    impact: '响应时间增加 25%，吞吐量下降 15%',
    suggestions: [
      '优化事件处理逻辑，减少不必要的计算',
      '实现事件批处理机制',
      '使用 Web Workers 进行后台处理'
    ]
  },
  {
    id: 2,
    title: '内存泄漏风险',
    description: '插件卸载时未正确清理事件监听器',
    severity: 'medium',
    impact: '长期运行后内存使用量持续增长',
    suggestions: [
      '实现插件生命周期钩子',
      '自动清理未使用的事件监听器',
      '添加内存使用监控和告警'
    ]
  },
  {
    id: 3,
    title: '配置加载缓慢',
    description: '大型配置文件的解析和验证耗时过长',
    severity: 'low',
    impact: '应用启动时间增加 2-3 秒',
    suggestions: [
      '实现配置文件分片加载',
      '使用异步配置验证',
      '添加配置缓存机制'
    ]
  }
])

// 性能优化建议
const performanceRecommendations = ref([
  {
    id: 1,
    title: '启用事件批处理',
    description: '将多个相似事件合并处理，减少处理开销',
    priority: 'high',
    impact: {
      performance: 20,
      resources: 15,
      difficulty: '简单'
    },
    steps: [
      '配置事件批处理参数',
      '修改事件发射器支持批处理',
      '更新事件监听器处理逻辑',
      '测试批处理效果'
    ]
  },
  {
    id: 2,
    title: '实现智能缓存策略',
    description: '对频繁访问的配置和数据实施多级缓存',
    priority: 'medium',
    impact: {
      performance: 35,
      resources: 10,
      difficulty: '中等'
    },
    steps: [
      '分析数据访问模式',
      '设计缓存层次结构',
      '实现缓存失效策略',
      '监控缓存命中率'
    ]
  },
  {
    id: 3,
    title: '优化依赖注入容器',
    description: '使用延迟加载和单例模式优化服务实例化',
    priority: 'low',
    impact: {
      performance: 10,
      resources: 25,
      difficulty: '复杂'
    },
    steps: [
      '重构容器实现',
      '添加延迟加载支持',
      '实现服务代理',
      '性能测试和调优'
    ]
  }
])

// 方法
const toggleMonitoring = () => {
  isMonitoring.value = !isMonitoring.value
  
  if (isMonitoring.value) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
  
  if (benchmarkInterval) {
    clearInterval(benchmarkInterval)
  }
}
</script>

<style scoped>
.performance-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 20px 0;
}

.icon {
  width: 20px;
  height: 20px;
}

/* 性能概览 */
.performance-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.cpu {
  border-left: 4px solid #3b82f6;
}

.stat-card.memory {
  border-left: 4px solid #10b981;
}

.stat-card.response {
  border-left: 4px solid #f59e0b;
}

.stat-card.throughput {
  border-left: 4px solid #8b5cf6;
}

.stat-icon {
  padding: 12px;
  border-radius: 8px;
  background: #f3f4f6;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-trend.up {
  color: #dc2626;
}

.stat-trend.down {
  color: #16a34a;
}

.trend-icon {
  width: 12px;
  height: 12px;
}

.performance-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.75rem;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 性能图表 */
.performance-charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.chart-metrics {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.chart-metrics label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.form-checkbox {
  width: 16px;
  height: 16px;
}

.chart-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.chart-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.chart-item h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.chart-canvas {
  position: relative;
  height: 200px;
  background: #f9fafb;
  border-radius: 6px;
  overflow: hidden;
}

.chart-line {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-point {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.cpu-line .chart-point {
  background: #3b82f6;
}

.memory-line .chart-point {
  background: #10b981;
}

.response-line .chart-point {
  background: #f59e0b;
}

.throughput-line .chart-point {
  background: #8b5cf6;
}

.chart-axis {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.y-axis {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  padding: 4px 0;
}

/* 基准测试 */
.benchmark-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.benchmark-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-config h3,
.test-progress h3,
.benchmark-results h3 {
  margin: 0 0 16px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-row label {
  min-width: 120px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.config-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.test-progress {
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
}

.progress-info {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0f2fe;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #0ea5e9;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 0.875rem;
  color: #0c4a6e;
  font-weight: 500;
}

.current-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.metric-label {
  color: #0c4a6e;
}

.metric-value {
  font-weight: 600;
  color: #0369a1;
}

.benchmark-results {
  max-height: 600px;
  overflow-y: auto;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-title {
  font-weight: 600;
  color: #374151;
}

.result-duration {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.result-metrics {
  margin-bottom: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.metric-card {
  text-align: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.metric-name {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.metric-card .metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.result-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 性能分析 */
.performance-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #374151;
  background: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.analysis-panel {
  padding: 20px 0;
}

.analysis-panel h3 {
  margin: 0 0 20px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

/* 瓶颈分析 */
.bottleneck-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bottleneck-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.bottleneck-item.high {
  border-left: 4px solid #dc2626;
  background: #fef2f2;
}

.bottleneck-item.medium {
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

.bottleneck-item.low {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

.bottleneck-icon {
  flex-shrink: 0;
  padding: 8px;
  border-radius: 6px;
  background: white;
}

.bottleneck-content {
  flex: 1;
}

.bottleneck-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.bottleneck-description {
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.5;
}

.bottleneck-impact {
  font-size: 0.875rem;
  color: #dc2626;
  margin-bottom: 12px;
  font-weight: 500;
}

.bottleneck-suggestions h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.bottleneck-suggestions ul {
  margin: 0;
  padding-left: 16px;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.bottleneck-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* 资源使用分析 */
.resource-analysis {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.resource-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.resource-chart {
  text-align: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.resource-chart h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.pie-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: conic-gradient(
    var(--color) 0deg calc(var(--percentage) * 3.6deg),
    #e5e7eb calc(var(--percentage) * 3.6deg) 360deg
  );
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #374151;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.resource-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.detail-section {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-name {
  min-width: 100px;
  font-size: 0.875rem;
  color: #374151;
}

.detail-value {
  min-width: 60px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.detail-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.detail-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}

/* 趋势分析 */
.trend-analysis {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.trend-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.summary-card.positive {
  background: #f0fdf4;
  border-color: #16a34a;
}

.summary-card.negative {
  background: #fef2f2;
  border-color: #dc2626;
}

.summary-card.neutral {
  background: #f8fafc;
  border-color: #64748b;
}

.summary-icon {
  padding: 12px;
  border-radius: 8px;
  background: white;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.positive .summary-value {
  color: #16a34a;
}

.negative .summary-value {
  color: #dc2626;
}

.neutral .summary-value {
  color: #64748b;
}

.summary-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.trend-insights {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.trend-insights h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.insight-icon {
  flex-shrink: 0;
  padding: 8px;
  border-radius: 6px;
  background: white;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.insight-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

/* 优化建议 */
.recommendations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.recommendation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recommendation-item.high {
  border-left: 4px solid #dc2626;
}

.recommendation-item.medium {
  border-left: 4px solid #f59e0b;
}

.recommendation-item.low {
  border-left: 4px solid #10b981;
}

.recommendation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.recommendation-icon {
  padding: 8px;
  border-radius: 6px;
  background: #f3f4f6;
}

.recommendation-title {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.recommendation-priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.recommendation-priority.high {
  background: #fef2f2;
  color: #dc2626;
}

.recommendation-priority.medium {
  background: #fffbeb;
  color: #f59e0b;
}

.recommendation-priority.low {
  background: #f0fdf4;
  color: #16a34a;
}

.recommendation-content {
  margin-bottom: 16px;
}

.recommendation-description {
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.recommendation-impact {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.impact-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
}

.impact-label {
  color: #6b7280;
}

.impact-value {
  font-weight: 600;
}

.impact-value.positive {
  color: #16a34a;
}

.impact-value.negative {
  color: #dc2626;
}

.impact-value.neutral {
  color: #6b7280;
}

.recommendation-steps {
  margin-bottom: 16px;
}

.recommendation-steps h5 {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.recommendation-steps ol {
  margin: 0;
  padding-left: 16px;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.recommendation-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .performance-page {
    padding: 16px;
  }
  
  .overview-stats {
    grid-template-columns: 1fr;
  }
  
  .benchmark-section {
    grid-template-columns: 1fr;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-metrics {
    justify-content: center;
  }
  
  .chart-grid {
    grid-template-columns: 1fr;
  }
  
  .resource-charts {
    grid-template-columns: 1fr;
  }
  
  .resource-details {
    grid-template-columns: 1fr;
  }
  
  .trend-summary {
    grid-template-columns: 1fr;
  }
  
  .recommendation-impact {
    flex-direction: column;
    gap: 8px;
  }
  
  .recommendation-actions {
    justify-content: stretch;
  }
  
  .recommendation-actions .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>Monitoring()
  }
  
  if (engine) {
    engine.emit('performance:monitoring-toggled', {
      monitoring: isMonitoring.value
    })
  }
}

const startMonitoring = () => {
  monitoringInterval = setInterval(() => {
    // 模拟性能数据更新
    updatePerformanceStats()
    updateChartData()
  }, 2000)
}

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
}

const updatePerformanceStats = () => {
  // 模拟 CPU 使用率变化
  const cpuChange = (Math.random() - 0.5) * 10
  performanceStats.value.cpuUsage = Math.max(0, Math.min(100, performanceStats.value.cpuUsage + cpuChange))
  performanceStats.value.cpuTrend = cpuChange > 0 ? 'up' : 'down'
  performanceStats.value.cpuChange = Math.abs(Math.round(cpuChange))
  
  // 模拟内存使用变化
  const memoryChange = (Math.random() - 0.4) * 8
  performanceStats.value.memoryUsage = Math.max(50, performanceStats.value.memoryUsage + memoryChange)
  performanceStats.value.memoryTrend = memoryChange > 0 ? 'up' : 'down'
  performanceStats.value.memoryChange = Math.abs(Math.round(memoryChange))
  
  // 模拟响应时间变化
  const responseChange = (Math.random() - 0.5) * 15
  performanceStats.value.responseTime = Math.max(20, performanceStats.value.responseTime + responseChange)
  performanceStats.value.responseTrend = responseChange > 0 ? 'up' : 'down'
  performanceStats.value.responseChange = Math.abs(Math.round(responseChange))
  
  // 模拟吞吐量变化
  const throughputChange = (Math.random() - 0.5) * 100
  performanceStats.value.throughput = Math.max(500, performanceStats.value.throughput + throughputChange)
  performanceStats.value.throughputTrend = throughputChange > 0 ? 'up' : 'down'
  performanceStats.value.throughputChange = Math.abs(Math.round(throughputChange))
}

const updateChartData = () => {
  // 更新图表数据
  chartData.value.cpu.shift()
  chartData.value.cpu.push(performanceStats.value.cpuUsage)
  
  chartData.value.memory.shift()
  chartData.value.memory.push(performanceStats.value.memoryUsage)
  
  chartData.value.response.shift()
  chartData.value.response.push(performanceStats.value.responseTime)
  
  chartData.value.throughput.shift()
  chartData.value.throughput.push(performanceStats.value.throughput)
}

const runBenchmark = () => {
  if (isBenchmarkRunning.value) return
  
  isBenchmarkRunning.value = true
  benchmarkProgress.value = 0
  
  // 重置当前指标
  currentBenchmarkMetrics.value = {
    cpu: 0,
    memory: 0,
    throughput: 0
  }
  
  benchmarkInterval = setInterval(() => {
    benchmarkProgress.value++
    
    // 模拟基准测试指标
    currentBenchmarkMetrics.value.cpu = Math.floor(Math.random() * 40) + 40
    currentBenchmarkMetrics.value.memory = Math.floor(Math.random() * 50) + 100
    currentBenchmarkMetrics.value.throughput = Math.floor(Math.random() * 200) + 800
    
    if (benchmarkProgress.value >= benchmarkConfig.value.duration) {
      completeBenchmark()
    }
  }, 1000)
  
  if (engine) {
    engine.emit('performance:benchmark-started', {
      config: benchmarkConfig.value
    })
  }
}

const stopBenchmark = () => {
  if (benchmarkInterval) {
    clearInterval(benchmarkInterval)
    benchmarkInterval = null
  }
  
  isBenchmarkRunning.value = false
  
  if (engine) {
    engine.emit('performance:benchmark-stopped', {
      progress: benchmarkProgress.value,
      duration: benchmarkConfig.value.duration
    })
  }
}

const completeBenchmark = () => {
  stopBenchmark()
  
  // 生成测试结果
  const result = {
    id: Date.now(),
    timestamp: Date.now(),
    type: benchmarkConfig.value.type,
    duration: benchmarkConfig.value.duration,
    metrics: {
      avgCpu: Math.floor(Math.random() * 30) + 50,
      maxCpu: Math.floor(Math.random() * 20) + 70,
      avgMemory: Math.floor(Math.random() * 50) + 120,
      maxMemory: Math.floor(Math.random() * 40) + 160,
      avgThroughput: Math.floor(Math.random() * 300) + 900,
      totalOps: Math.floor((Math.random() * 300 + 900) * benchmarkConfig.value.duration)
    }
  }
  
  benchmarkResults.value.unshift(result)
  
  if (engine) {
    engine.emit('performance:benchmark-completed', { result })
  }
}

const resetBenchmark = () => {
  if (isBenchmarkRunning.value) {
    stopBenchmark()
  }
  
  benchmarkProgress.value = 0
  currentBenchmarkMetrics.value = {
    cpu: 0,
    memory: 0,
    throughput: 0
  }
}

const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    stats: performanceStats.value,
    chartData: chartData.value,
    benchmarkResults: benchmarkResults.value,
    bottlenecks: performanceBottlenecks.value,
    recommendations: performanceRecommendations.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
  
  if (engine) {
    engine.emit('performance:report-generated', { report })
  }
}

const optimizePerformance = () => {
  // 模拟性能优化
  alert('正在应用性能优化...\n\n优化项目:\n- 启用事件批处理\n- 优化内存使用\n- 减少 CPU 开销\n\n预计性能提升: 15-25%')
  
  // 模拟优化效果
  setTimeout(() => {
    performanceStats.value.cpuUsage = Math.max(20, performanceStats.value.cpuUsage - 15)
    performanceStats.value.responseTime = Math.max(30, performanceStats.value.responseTime - 20)
    performanceStats.value.throughput += 200
    
    if (engine) {
      engine.emit('performance:optimization-applied')
    }
  }, 2000)
}

const viewResultDetails = (result: any) => {
  const details = [
    `测试类型: ${getBenchmarkTypeText(result.type)}`,
    `测试时长: ${result.duration}秒`,
    `测试时间: ${formatTime(result.timestamp)}`,
    '',
    '性能指标:',
    `平均 CPU: ${result.metrics.avgCpu}%`,
    `峰值 CPU: ${result.metrics.maxCpu}%`,
    `平均内存: ${result.metrics.avgMemory}MB`,
    `峰值内存: ${result.metrics.maxMemory}MB`,
    `平均吞吐量: ${result.metrics.avgThroughput} ops/s`,
    `总操作数: ${result.metrics.totalOps}`
  ]
  
  alert('基准测试详情:\n\n' + details.join('\n'))
}

const compareResult = (result: any) => {
  if (benchmarkResults.value.length < 2) {
    alert('需要至少两个测试结果才能进行对比')
    return
  }
  
  const latest = benchmarkResults.value[0]
  const comparison = [
    '性能对比结果:',
    '',
    `CPU 使用率: ${result.metrics.avgCpu}% → ${latest.metrics.avgCpu}% (${latest.metrics.avgCpu - result.metrics.avgCpu > 0 ? '+' : ''}${latest.metrics.avgCpu - result.metrics.avgCpu}%)`,
    `内存使用: ${result.metrics.avgMemory}MB → ${latest.metrics.avgMemory}MB (${latest.metrics.avgMemory - result.metrics.avgMemory > 0 ? '+' : ''}${latest.metrics.avgMemory - result.metrics.avgMemory}MB)`,
    `吞吐量: ${result.metrics.avgThroughput} → ${latest.metrics.avgThroughput} (${latest.metrics.avgThroughput - result.metrics.avgThroughput > 0 ? '+' : ''}${latest.metrics.avgThroughput - result.metrics.avgThroughput} ops/s)`
  ]
  
  alert(comparison.join('\n'))
}

const exportResult = (result: any) => {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `benchmark-result-${result.id}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

const applyOptimization = (bottleneck: any) => {
  alert(`正在应用优化: ${bottleneck.title}\n\n${bottleneck.suggestions.join('\n')}`)
  
  // 模拟优化效果
  setTimeout(() => {
    const index = performanceBottlenecks.value.findIndex(b => b.id === bottleneck.id)
    if (index > -1) {
      performanceBottlenecks.value.splice(index, 1)
    }
    
    if (engine) {
      engine.emit('performance:optimization-applied', {
        bottleneck: bottleneck.title
      })
    }
  }, 1000)
}

const ignoreBottleneck = (bottleneck: any) => {
  if (confirm(`确定要忽略瓶颈 "${bottleneck.title}" 吗？`)) {
    const index = performanceBottlenecks.value.findIndex(b => b.id === bottleneck.id)
    if (index > -1) {
      performanceBottlenecks.value.splice(index, 1)
    }
  }
}

const applyRecommendation = (recommendation: any) => {
  alert(`正在应用建议: ${recommendation.title}\n\n实施步骤:\n${recommendation.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`)
  
  // 模拟应用效果
  setTimeout(() => {
    const index = performanceRecommendations.value.findIndex(r => r.id === recommendation.id)
    if (index > -1) {
      performanceRecommendations.value.splice(index, 1)
    }
    
    if (engine) {
      engine.emit('performance:recommendation-applied', {
        recommendation: recommendation.title
      })
    }
  }, 1000)
}

const scheduleRecommendation = (recommendation: any) => {
  alert(`已计划实施建议: ${recommendation.title}\n\n将在下次维护窗口期间实施`)
}

const dismissRecommendation = (recommendation: any) => {
  if (confirm(`确定要忽略建议 "${recommendation.title}" 吗？`)) {
    const index = performanceRecommendations.value.findIndex(r => r.id === recommendation.id)
    if (index > -1) {
      performanceRecommendations.value.splice(index, 1)
    }
  }
}

const getBenchmarkTypeText = (type: string) => {
  const types = {
    cpu: 'CPU 密集型',
    memory: '内存密集型',
    io: 'I/O 密集型',
    mixed: '混合测试'
  }
  return types[type] || type
}

const getBottleneckIcon = (severity: string) => {
  const icons = {
    high: 'AlertTriangle',
    medium: 'AlertTriangle',
    low: 'AlertTriangle'
  }
  return icons[severity] || 'AlertTriangle'
}

const getRecommendationIcon = (priority: string) => {
  const icons = {
    high: 'Zap',
    medium: 'Lightbulb',
    low: 'CheckCircle'
  }
  return icons[priority] || 'Lightbulb'
}

const getPriorityText = (priority: string) => {
  const priorities = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return priorities[priority] || priority
}

const getDifficultyClass = (difficulty: string) => {
  const classes = {
    '简单': 'positive',
    '中等': 'neutral',
    '复杂': 'negative'
  }
  return classes[difficulty] || 'neutral'
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 生命周期
onMounted(() => {
  // 监听引擎事件
  if (engine) {
    engine.on('performance:*', (eventName: string, data: any) => {
      console.log('Performance Event:', eventName, data)
    })
  }
  
  // 开始监控
  if (isMonitoring.value) {
    startMonitoring()
  }
})

onUnmounted(() => {
  stop