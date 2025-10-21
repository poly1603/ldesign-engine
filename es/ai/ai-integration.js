/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class AIIntegration {
  constructor(config, engine) {
    this.cache = /* @__PURE__ */ new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimiter = {
      tokens: 10,
      maxTokens: 10,
      refillRate: 1e3,
      // ms
      lastRefill: Date.now()
    };
    this.config = config;
    this.engine = engine;
    this.logger = engine?.logger;
    this.initializeProvider();
  }
  // ==================== 初始化 ====================
  initializeProvider() {
    switch (this.config.provider) {
      case "openai":
        this.provider = this.createOpenAIProvider();
        break;
      case "anthropic":
        this.provider = this.createAnthropicProvider();
        break;
      case "gemini":
        this.provider = this.createGeminiProvider();
        break;
      case "local":
        this.provider = this.createLocalProvider();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
    this.logger?.info(`AI provider initialized: ${this.config.provider}`);
  }
  // ==================== 核心功能 ====================
  /**
   * 分析代码并提供优化建议
   */
  async analyzeCode(request) {
    const cacheKey = this.getCacheKey("code", request);
    if (this.config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const prompt = this.buildCodeAnalysisPrompt(request);
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: this.config.maxTokens || 2e3,
      temperature: this.config.temperature || 0.3
    }));
    const result = this.parseAnalysisResponse(response);
    if (this.config.cache) {
      this.cache.set(cacheKey, result);
    }
    return result;
  }
  /**
   * 分析错误并提供修复建议
   */
  async analyzeError(request) {
    const cacheKey = this.getCacheKey("error", request);
    if (this.config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const prompt = this.buildErrorAnalysisPrompt(request);
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: this.config.maxTokens || 1500,
      temperature: 0.2
      // 低温度以获得更确定的答案
    }));
    const result = this.parseAnalysisResponse(response);
    result.suggestions = result.suggestions.map((suggestion) => ({
      ...suggestion,
      fix: this.createErrorFix(request.error, suggestion)
    }));
    if (this.config.cache) {
      this.cache.set(cacheKey, result);
    }
    this.engine?.errors?.onError((errorInfo) => {
      this.logger?.info("AI Error Analysis:", { errorInfo, result });
    });
    return result;
  }
  /**
   * 优化性能
   */
  async optimizePerformance(request) {
    const prompt = this.buildPerformancePrompt(request);
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 2e3,
      temperature: 0.4
    }));
    const result = this.parseAnalysisResponse(response);
    if (result.confidence > 0.8) {
      for (const suggestion of result.suggestions) {
        if (suggestion.severity === "critical" && suggestion.fix) {
          await suggestion.fix();
          this.logger?.info(`Applied performance optimization: ${suggestion.title}`);
        }
      }
    }
    return result;
  }
  /**
   * 生成代码
   */
  async generateCode(description, language = "typescript", context) {
    const prompt = `Generate ${language} code for: ${description}
    ${context ? `Context: ${context}` : ""}
    Requirements:
    - Follow best practices
    - Include error handling
    - Add comments for complex logic
    - Use TypeScript if applicable`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 3e3,
      temperature: 0.7
    }));
    return this.extractCodeFromResponse(response);
  }
  /**
   * 生成文档
   */
  async generateDocumentation(code, format = "markdown") {
    const prompt = `Generate ${format} documentation for the following code:
    \`\`\`
    ${code}
    \`\`\`
    Include: API reference, usage examples, parameters description`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 2e3,
      temperature: 0.3
    }));
    return response;
  }
  /**
   * 生成测试
   */
  async generateTests(code, framework = "vitest") {
    const prompt = `Generate comprehensive ${framework} tests for:
    \`\`\`
    ${code}
    \`\`\`
    Include: unit tests, edge cases, error scenarios`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 2500,
      temperature: 0.4
    }));
    return this.extractCodeFromResponse(response);
  }
  /**
   * 安全分析
   */
  async analyzeSecuirty(code) {
    const prompt = `Analyze the following code for security vulnerabilities:
    \`\`\`
    ${code}
    \`\`\`
    Check for: XSS, SQL injection, CSRF, sensitive data exposure, etc.`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 2e3,
      temperature: 0.2
    }));
    const result = this.parseAnalysisResponse(response);
    if (result.suggestions.some((s) => s.severity === "critical")) {
      this.logger?.error("Critical security issue detected:", result);
    }
    return result;
  }
  /**
   * 智能代码补全
   */
  async autocomplete(code, cursorPosition, maxSuggestions = 5) {
    const context = code.substring(Math.max(0, cursorPosition - 500), cursorPosition);
    const prompt = `Complete the following code:
    \`\`\`
    ${context}
    [CURSOR]
    \`\`\`
    Provide ${maxSuggestions} completions.`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 500,
      temperature: 0.8
    }));
    return this.parseCompletions(response);
  }
  /**
   * 代码重构建议
   */
  async suggestRefactoring(code) {
    const prompt = `Suggest refactoring for the following code:
    \`\`\`
    ${code}
    \`\`\`
    Focus on: readability, maintainability, performance, DRY principle`;
    const response = await this.executeWithRateLimit(() => this.provider.analyze(prompt, {
      maxTokens: 2e3,
      temperature: 0.5
    }));
    return this.parseAnalysisResponse(response);
  }
  // ==================== 工具方法 ====================
  buildCodeAnalysisPrompt(request) {
    return `Analyze the following ${request.language || "code"}:
    \`\`\`
    ${request.code}
    \`\`\`
    
    ${request.context ? `Context: ${request.context}` : ""}
    ${request.intent ? `Intent: ${request.intent}` : ""}
    ${request.rules ? `Rules to check: ${request.rules.join(", ")}` : ""}
    
    Provide:
    1. Code quality issues
    2. Performance optimizations
    3. Security concerns
    4. Best practice violations
    5. Suggested improvements
    
    Format response as JSON with suggestions array.`;
  }
  buildErrorAnalysisPrompt(request) {
    return `Analyze this error:
    Error: ${request.error.message}
    ${request.stackTrace ? `Stack: ${request.stackTrace}` : ""}
    ${request.context ? `Context: ${JSON.stringify(request.context)}` : ""}
    ${request.previousFixes ? `Previous attempts: ${request.previousFixes.join(", ")}` : ""}
    
    Provide:
    1. Root cause analysis
    2. Step-by-step fix
    3. Prevention strategies
    4. Related issues
    
    Format as JSON with suggestions.`;
  }
  buildPerformancePrompt(request) {
    return `Analyze performance metrics:
    ${JSON.stringify(request.metrics, null, 2)}
    
    ${request.code ? `Related code:
\`\`\`
${request.code}
\`\`\`` : ""}
    ${request.threshold ? `Thresholds: ${JSON.stringify(request.threshold)}` : ""}
    
    Identify:
    1. Performance bottlenecks
    2. Optimization opportunities
    3. Resource usage issues
    4. Scalability concerns
    
    Provide actionable suggestions.`;
  }
  parseAnalysisResponse(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning,
        metadata: parsed.metadata
      };
    } catch {
      return this.parseTextResponse(response);
    }
  }
  parseTextResponse(response) {
    const suggestions = [];
    const lines = response.split("\n");
    let currentSuggestion = {};
    for (const line of lines) {
      if (line.includes("Error:") || line.includes("Warning:") || line.includes("Suggestion:")) {
        if (currentSuggestion.title) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = {
          type: line.includes("Error") ? "error" : "optimization",
          severity: line.includes("Critical") ? "critical" : "medium",
          title: line.replace(/^(Error|Warning|Suggestion):\s*/, ""),
          description: ""
        };
      } else if (currentSuggestion.title) {
        currentSuggestion.description += `${line}
`;
      }
    }
    if (currentSuggestion.title) {
      suggestions.push(currentSuggestion);
    }
    return {
      suggestions,
      confidence: 0.7,
      reasoning: response
    };
  }
  extractCodeFromResponse(response) {
    const codeMatch = response.match(/```\w*\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1] : response;
  }
  parseCompletions(response) {
    const completions = [];
    for (const raw of response.split("\n")) {
      const line = raw.trim();
      const dot = line.indexOf(".");
      if (dot > 0) {
        const leading = line.slice(0, dot);
        if (/^\d+$/.test(leading)) {
          const text = line.slice(dot + 1).trim();
          if (text)
            completions.push(text);
        }
      }
    }
    return completions.slice(0, 5);
  }
  createErrorFix(error, suggestion) {
    return async () => {
      this.logger?.info(`Applying AI fix for: ${error.message}`);
      if (suggestion.code) {
        this.engine?.events?.emit("ai:fix-applied", {
          error,
          suggestion,
          code: suggestion.code
        });
      }
    };
  }
  getCacheKey(type, request) {
    const str = JSON.stringify(request);
    return `${type}:${this.hashString(str)}`;
  }
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  // ==================== 速率限制 ====================
  async executeWithRateLimit(fn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    this.isProcessing = true;
    while (this.requestQueue.length > 0) {
      await this.waitForToken();
      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }
    }
    this.isProcessing = false;
  }
  async waitForToken() {
    this.refillTokens();
    if (this.rateLimiter.tokens <= 0) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimiter.refillRate));
      return this.waitForToken();
    }
    this.rateLimiter.tokens--;
  }
  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.rateLimiter.refillRate);
    if (tokensToAdd > 0) {
      this.rateLimiter.tokens = Math.min(this.rateLimiter.maxTokens, this.rateLimiter.tokens + tokensToAdd);
      this.rateLimiter.lastRefill = now;
    }
  }
  // ==================== Provider 实现 ====================
  createOpenAIProvider() {
    return {
      name: "OpenAI",
      analyze: async (prompt, options) => {
        if (!this.config.apiKey) {
          throw new Error("OpenAI API key is required");
        }
        const response = await fetch(this.config.endpoint || "https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.config.model || "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: options?.maxTokens,
            temperature: options?.temperature
          })
        });
        const data = await response.json();
        return data.choices[0].message.content;
      },
      stream: async (prompt, onChunk) => {
        const response = await fetch(this.config.endpoint || "https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.config.model || "gpt-4",
            messages: [{ role: "user", content: prompt }],
            stream: true
          })
        });
        const reader = response.body?.getReader();
        if (!reader)
          return;
        while (true) {
          const { done, value } = await reader.read();
          if (done)
            break;
          const text = new TextDecoder().decode(value);
          onChunk(text);
        }
      }
    };
  }
  createAnthropicProvider() {
    return {
      name: "Anthropic",
      analyze: async (prompt, options) => {
        if (!this.config.apiKey) {
          throw new Error("Anthropic API key is required");
        }
        const response = await fetch(this.config.endpoint || "https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": this.config.apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: this.config.model || "claude-3-opus-20240229",
            messages: [{ role: "user", content: prompt }],
            max_tokens: options?.maxTokens || 1e3
          })
        });
        const data = await response.json();
        return data.content[0].text;
      }
    };
  }
  createGeminiProvider() {
    return {
      name: "Gemini",
      analyze: async (prompt, options) => {
        if (!this.config.apiKey) {
          throw new Error("Gemini API key is required");
        }
        const url = `${this.config.endpoint || "https://generativelanguage.googleapis.com/v1beta"}/models/${this.config.model || "gemini-pro"}:generateContent?key=${this.config.apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: options?.maxTokens,
              temperature: options?.temperature
            }
          })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }
    };
  }
  createLocalProvider() {
    return {
      name: "Local",
      analyze: async (prompt, options) => {
        const response = await fetch(this.config.endpoint || "http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.config.model || "codellama",
            prompt,
            options: {
              num_predict: options?.maxTokens,
              temperature: options?.temperature
            }
          })
        });
        const data = await response.json();
        return data.response;
      }
    };
  }
  // ==================== 公共 API ====================
  /**
   * 配置 AI 提供商
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    this.initializeProvider();
  }
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * 获取使用统计
   */
  getStats() {
    return {
      provider: this.config.provider,
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      rateLimitStatus: {
        tokens: this.rateLimiter.tokens,
        maxTokens: this.rateLimiter.maxTokens
      }
    };
  }
  /**
   * 销毁
   */
  destroy() {
    this.cache.clear();
    this.requestQueue = [];
    this.isProcessing = false;
  }
}
function createAIIntegration(config, engine) {
  return new AIIntegration(config, engine);
}

export { AIIntegration, createAIIntegration };
//# sourceMappingURL=ai-integration.js.map
