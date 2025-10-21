/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { reactive, ref, computed, onUnmounted } from 'vue';

class Transport {
  constructor() {
    this.listeners = /* @__PURE__ */ new Set();
    this.connected = false;
  }
  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit(message) {
    this.listeners.forEach((listener) => listener(message));
  }
  isConnected() {
    return this.connected;
  }
}
class BroadcastTransport extends Transport {
  constructor(channelName, logger) {
    super();
    this.channelName = channelName;
    this.logger = logger;
  }
  async connect() {
    if (typeof BroadcastChannel === "undefined") {
      this.logger?.warn("BroadcastChannel not supported");
      return;
    }
    this.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessage = (event) => {
      this.emit(event.data);
    };
    this.channel.onmessageerror = (event) => {
      this.logger?.error("BroadcastChannel message error", event);
    };
    this.connected = true;
    this.logger?.debug("BroadcastChannel connected");
  }
  async disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = void 0;
    }
    this.connected = false;
  }
  async send(message) {
    if (!this.channel) {
      throw new Error("BroadcastChannel not connected");
    }
    this.channel.postMessage(message);
  }
}
class WebSocketTransport extends Transport {
  constructor(url, config = {}, logger) {
    super();
    this.url = url;
    this.config = config;
    this.logger = logger;
    this.reconnectAttempts = 0;
  }
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.logger?.debug("WebSocket connected");
          resolve();
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.emit(message);
          } catch (error) {
            this.logger?.error("Failed to parse WebSocket message", error);
          }
        };
        this.ws.onerror = (error) => {
          this.logger?.error("WebSocket error", error);
          reject(error);
        };
        this.ws.onclose = () => {
          this.connected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  async disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = void 0;
    }
    this.connected = false;
  }
  async send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(message));
  }
  startHeartbeat() {
    const interval = this.config.heartbeatInterval || 3e4;
    this.pingInterval = setInterval(() => {
      if (this.connected) {
        this.send({
          id: `ping-${Date.now()}`,
          type: "heartbeat",
          source: "client",
          timestamp: Date.now(),
          data: null
        }).catch((error) => {
          this.logger?.error("Heartbeat failed", error);
        });
      }
    }, interval);
  }
  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = void 0;
    }
  }
  attemptReconnect() {
    const maxAttempts = this.config.maxReconnectAttempts || 5;
    const delay = this.config.reconnectDelay || 1e3;
    if (this.reconnectAttempts >= maxAttempts) {
      this.logger?.error("Max reconnection attempts reached");
      return;
    }
    this.reconnectAttempts++;
    this.logger?.debug(`Attempting reconnection ${this.reconnectAttempts}/${maxAttempts}`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.logger?.error("Reconnection failed", error);
      });
    }, delay * 2 ** (this.reconnectAttempts - 1));
  }
}
class WebRTCTransport extends Transport {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
  }
  async connect() {
    await this.connectSignaling();
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers || [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });
    this.setupPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel("sync", {
      ordered: true
    });
    this.setupDataChannel();
    await this.createOffer();
  }
  async disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.signaling) {
      this.signaling.close();
    }
    this.connected = false;
  }
  async send(message) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("WebRTC data channel not open");
    }
    this.dataChannel.send(JSON.stringify(message));
  }
  async connectSignaling() {
    return new Promise((resolve, reject) => {
      this.signaling = new WebSocket(this.config.signalingServer);
      this.signaling.onopen = () => {
        this.signaling.send(JSON.stringify({
          type: "join",
          roomId: this.config.roomId || "default"
        }));
        resolve();
      };
      this.signaling.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await this.handleSignalingMessage(data);
      };
      this.signaling.onerror = reject;
    });
  }
  setupPeerConnection() {
    if (!this.peerConnection)
      return;
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signaling) {
        this.signaling.send(JSON.stringify({
          type: "ice",
          candidate: event.candidate
        }));
      }
    };
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };
  }
  setupDataChannel(channel) {
    const dc = channel || this.dataChannel;
    if (!dc)
      return;
    dc.onopen = () => {
      this.connected = true;
      this.logger?.debug("WebRTC data channel opened");
    };
    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message);
      } catch (error) {
        this.logger?.error("Failed to parse WebRTC message", error);
      }
    };
    dc.onerror = (error) => {
      this.logger?.error("WebRTC data channel error", error);
    };
    dc.onclose = () => {
      this.connected = false;
      this.logger?.debug("WebRTC data channel closed");
    };
  }
  async createOffer() {
    if (!this.peerConnection || !this.signaling)
      return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signaling.send(JSON.stringify({
      type: "offer",
      offer
    }));
  }
  async handleSignalingMessage(data) {
    if (!this.peerConnection)
      return;
    switch (data.type) {
      case "offer": {
        await this.peerConnection.setRemoteDescription(data.offer);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        if (this.signaling) {
          this.signaling.send(JSON.stringify({
            type: "answer",
            answer
          }));
        }
        break;
      }
      case "answer":
        await this.peerConnection.setRemoteDescription(data.answer);
        break;
      case "ice":
        await this.peerConnection.addIceCandidate(data.candidate);
        break;
    }
  }
}
class DistributedSync {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;
    this.transports = /* @__PURE__ */ new Map();
    this.localState = reactive({});
    this.remoteState = reactive({});
    this.syncQueue = [];
    this.isSyncing = ref(false);
    this.version = 0;
    this.listeners = /* @__PURE__ */ new Map();
    this.peerId = config.id || this.generatePeerId();
    this.syncStatus = ref({
      connected: false,
      syncing: false,
      lastSync: 0,
      peers: 0,
      errors: 0,
      latency: 0
    });
    this.initialize();
  }
  /**
   * 初始化传输层
   */
  async initialize() {
    const transports = this.config.transports || ["broadcast"];
    for (const type of transports) {
      try {
        const transport = await this.createTransport(type);
        if (transport) {
          this.transports.set(type, transport);
          await this.setupTransport(transport);
        }
      } catch (error) {
        this.logger?.error(`Failed to initialize ${type} transport`, error);
      }
    }
  }
  /**
   * 创建传输实例
   */
  async createTransport(type) {
    switch (type) {
      case "broadcast":
        return new BroadcastTransport("ldesign-sync", this.logger);
      case "websocket":
        if (!this.config.websocketUrl) {
          this.logger?.warn("WebSocket URL not configured");
          return null;
        }
        return new WebSocketTransport(this.config.websocketUrl, {
          reconnectDelay: this.config.reconnectDelay,
          maxReconnectAttempts: this.config.maxReconnectAttempts,
          heartbeatInterval: this.config.heartbeatInterval
        }, this.logger);
      case "webrtc":
        if (!this.config.signalingServer) {
          this.logger?.warn("Signaling server not configured");
          return null;
        }
        return new WebRTCTransport({
          signalingServer: this.config.signalingServer,
          iceServers: this.config.iceServers,
          roomId: this.config.roomId
        }, this.logger);
      default:
        this.logger?.warn(`Unknown transport type: ${type}`);
        return null;
    }
  }
  /**
   * 设置传输层
   */
  async setupTransport(transport) {
    await transport.connect();
    transport.onMessage((message) => {
      this.handleRemoteMessage(message);
    });
    this.updateConnectionStatus();
  }
  /**
   * 设置状态值
   */
  async set(key, value) {
    const oldValue = this.localState[key];
    this.localState[key] = value;
    this.version++;
    const message = {
      id: this.generateMessageId(),
      type: "state",
      source: this.peerId,
      timestamp: Date.now(),
      data: { key, value, oldValue },
      version: this.version
    };
    await this.broadcast(message);
    this.notifyListeners(key, value, oldValue);
  }
  /**
   * 获取状态值
   */
  get(key) {
    return this.localState[key] ?? this.remoteState[key];
  }
  /**
   * 批量更新状态
   */
  async batch(updates) {
    const changes = [];
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.localState[key];
      this.localState[key] = value;
      changes.push({ key, value, oldValue });
    }
    this.version++;
    const message = {
      id: this.generateMessageId(),
      type: "patch",
      source: this.peerId,
      timestamp: Date.now(),
      data: changes,
      version: this.version
    };
    await this.broadcast(message);
    for (const { key, value, oldValue } of changes) {
      this.notifyListeners(key, value, oldValue);
    }
  }
  /**
   * 监听状态变化
   */
  watch(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, /* @__PURE__ */ new Set());
    }
    this.listeners.get(key).add(callback);
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  /**
   * 全量同步
   */
  async sync() {
    if (this.isSyncing.value) {
      this.logger?.debug("Sync already in progress");
      return;
    }
    this.isSyncing.value = true;
    this.syncStatus.value.syncing = true;
    try {
      const message = {
        id: this.generateMessageId(),
        type: "sync",
        source: this.peerId,
        timestamp: Date.now(),
        data: this.localState,
        version: this.version
      };
      await this.broadcast(message);
      this.syncStatus.value.lastSync = Date.now();
    } finally {
      this.isSyncing.value = false;
      this.syncStatus.value.syncing = false;
    }
  }
  /**
   * 广播消息
   */
  async broadcast(message) {
    const promises = [];
    for (const transport of this.transports.values()) {
      if (transport.isConnected()) {
        promises.push(transport.send(message).catch((error) => {
          this.logger?.error("Failed to send message", error);
          this.syncStatus.value.errors++;
        }));
      }
    }
    await Promise.all(promises);
  }
  /**
   * 处理远程消息
   */
  handleRemoteMessage(message) {
    if (message.source === this.peerId) {
      return;
    }
    const startTime = Date.now();
    switch (message.type) {
      case "state":
        this.handleStateUpdate(message);
        break;
      case "patch":
        this.handlePatchUpdate(message);
        break;
      case "sync":
        this.handleSyncRequest(message);
        break;
      case "ack":
        this.handleAck(message);
        break;
      case "heartbeat":
        this.syncStatus.value.latency = Date.now() - message.timestamp;
        break;
    }
    this.logger?.debug("Message processed", {
      type: message.type,
      source: message.source,
      duration: Date.now() - startTime
    });
  }
  /**
   * 处理状态更新
   */
  handleStateUpdate(message) {
    const { key, value, oldValue } = message.data;
    const resolvedValue = this.resolveConflict(key, this.localState[key], value, message);
    if (resolvedValue !== this.localState[key]) {
      this.remoteState[key] = resolvedValue;
      this.notifyListeners(key, resolvedValue, oldValue);
    }
  }
  /**
   * 处理批量更新
   */
  handlePatchUpdate(message) {
    const changes = message.data;
    for (const { key, value, oldValue } of changes) {
      const resolvedValue = this.resolveConflict(key, this.localState[key], value, message);
      if (resolvedValue !== this.localState[key]) {
        this.remoteState[key] = resolvedValue;
        this.notifyListeners(key, resolvedValue, oldValue);
      }
    }
  }
  /**
   * 处理同步请求
   */
  handleSyncRequest(message) {
    const remoteState = message.data;
    for (const [key, value] of Object.entries(remoteState)) {
      const resolvedValue = this.resolveConflict(key, this.localState[key], value, message);
      if (resolvedValue !== this.localState[key]) {
        this.remoteState[key] = resolvedValue;
        this.notifyListeners(key, resolvedValue, this.localState[key]);
      }
    }
    this.sendAck(message.id, message.source);
  }
  /**
   * 处理确认消息
   */
  handleAck(message) {
    this.logger?.debug("Received ack", {
      from: message.source,
      for: message.data.messageId
    });
  }
  /**
   * 解决冲突
   */
  resolveConflict(key, localValue, remoteValue, message) {
    if (localValue === void 0) {
      return remoteValue;
    }
    if (this.config.conflictResolver) {
      return this.config.conflictResolver(localValue, remoteValue);
    }
    switch (this.config.strategy || "last-write-wins") {
      case "last-write-wins":
        return message.version > this.version ? remoteValue : localValue;
      case "first-write-wins":
        return localValue;
      case "merge":
        if (typeof localValue === "object" && typeof remoteValue === "object") {
          return { ...localValue, ...remoteValue };
        }
        return remoteValue;
      default:
        return remoteValue;
    }
  }
  /**
   * 发送确认消息
   */
  async sendAck(messageId, target) {
    const message = {
      id: this.generateMessageId(),
      type: "ack",
      source: this.peerId,
      timestamp: Date.now(),
      data: { messageId, target }
    };
    await this.broadcast(message);
  }
  /**
   * 通知监听器
   */
  notifyListeners(key, value, oldValue) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(value, oldValue);
        } catch (error) {
          this.logger?.error("Listener error", error);
        }
      });
    }
  }
  /**
   * 更新连接状态
   */
  updateConnectionStatus() {
    let connected = false;
    let peers = 0;
    for (const transport of this.transports.values()) {
      if (transport.isConnected()) {
        connected = true;
        peers++;
      }
    }
    this.syncStatus.value.connected = connected;
    this.syncStatus.value.peers = peers;
  }
  /**
   * 生成消息 ID
   */
  generateMessageId() {
    return `${this.peerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 生成对等节点 ID
   */
  generatePeerId() {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 获取同步状态
   */
  getStatus() {
    return this.syncStatus.value;
  }
  /**
   * 获取所有状态
   */
  getState() {
    return { ...this.localState, ...this.remoteState };
  }
  /**
   * 清空状态
   */
  clear() {
    Object.keys(this.localState).forEach((key) => delete this.localState[key]);
    Object.keys(this.remoteState).forEach((key) => delete this.remoteState[key]);
    this.version = 0;
  }
  /**
   * 销毁
   */
  async dispose() {
    for (const transport of this.transports.values()) {
      await transport.disconnect();
    }
    this.transports.clear();
    this.listeners.clear();
    this.syncQueue = [];
    this.clear();
  }
}
function useDistributedSync(config) {
  const sync = new DistributedSync(config);
  const state = computed(() => sync.getState());
  const status = ref(sync.getStatus());
  const interval = setInterval(() => {
    status.value = sync.getStatus();
  }, 1e3);
  onUnmounted(() => {
    clearInterval(interval);
    sync.dispose();
  });
  return {
    sync,
    state,
    status,
    set: (key, value) => sync.set(key, value),
    get: (key) => sync.get(key),
    watch: (key, callback) => sync.watch(key, callback)
  };
}
function createDistributedSync(config, logger) {
  return new DistributedSync(config, logger);
}

export { DistributedSync, createDistributedSync, useDistributedSync };
//# sourceMappingURL=distributed-sync.js.map
