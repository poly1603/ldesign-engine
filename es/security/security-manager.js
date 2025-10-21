/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
var SecurityEventType;
(function(SecurityEventType2) {
  SecurityEventType2["XSS_DETECTED"] = "xss_detected";
  SecurityEventType2["CSRF_ATTACK"] = "csrf_attack";
  SecurityEventType2["CSP_VIOLATION"] = "csp_violation";
  SecurityEventType2["CLICKJACKING_ATTEMPT"] = "clickjacking_attempt";
  SecurityEventType2["INSECURE_REQUEST"] = "insecure_request";
})(SecurityEventType || (SecurityEventType = {}));
class XSSProtector {
  constructor(config = {}) {
    this.allowedTags = new Set(config.allowedTags || [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "i",
      "b",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre"
    ]);
    this.allowedAttributes = /* @__PURE__ */ new Map();
    const attrs = config.allowedAttributes || {
      a: ["href", "title"],
      img: ["src", "alt", "title", "width", "height"],
      blockquote: ["cite"]
    };
    for (const [tag, attrList] of Object.entries(attrs)) {
      this.allowedAttributes.set(tag, new Set(attrList));
    }
    this.stripIgnoreTag = config.stripIgnoreTag ?? true;
  }
  sanitize(html) {
    const threats = [];
    let sanitized = html;
    const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
    const scripts = html.match(scriptRegex);
    if (scripts) {
      threats.push("Script tags detected");
      sanitized = sanitized.replace(scriptRegex, "");
    }
    const eventRegex = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
    const events = html.match(eventRegex);
    if (events) {
      threats.push("Event handlers detected");
      sanitized = sanitized.replace(eventRegex, "");
    }
    const jsProtocolRegex = /javascript\s*:/gi;
    if (jsProtocolRegex.test(html)) {
      threats.push("JavaScript protocol detected");
      sanitized = sanitized.replace(jsProtocolRegex, "");
    }
    const dataProtocolRegex = /data\s*:(?!image\/)\w+/giu;
    if (dataProtocolRegex.test(html)) {
      threats.push("Suspicious data protocol detected");
      sanitized = sanitized.replace(dataProtocolRegex, "");
    }
    sanitized = this.filterTags(sanitized, threats);
    sanitized = this.filterAttributes(sanitized, threats);
    return {
      safe: threats.length === 0,
      sanitized,
      threats
    };
  }
  filterTags(html, threats) {
    const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/giu;
    return html.replace(tagRegex, (match, tagName) => {
      const tag = tagName.toLowerCase();
      if (!this.allowedTags.has(tag)) {
        threats.push(`Disallowed tag: ${tag}`);
        return this.stripIgnoreTag ? "" : match.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      return match;
    });
  }
  filterAttributes(html, threats) {
    const tagRegex = /<([a-z][a-z0-9]*)[^>]*>/giu;
    return html.replace(tagRegex, (match, tagName) => {
      const tag = tagName.toLowerCase();
      const allowedAttrs = this.allowedAttributes.get(tag) || /* @__PURE__ */ new Set();
      const tagNameEndIndex = match.indexOf(tagName) + tagName.length;
      const attributesStr = match.substring(tagNameEndIndex, match.length - 1);
      if (!attributesStr || !attributesStr.trim()) {
        return `<${tag}>`;
      }
      const attrRegex = /\s+([a-z][a-z0-9-]*)\s*=\s*["']([^"']*)["']/giu;
      let filteredAttributes = "";
      let attrExecMatch;
      while ((attrExecMatch = attrRegex.exec(attributesStr)) !== null) {
        const [, attrName, attrValue] = attrExecMatch;
        const attr = attrName.toLowerCase();
        if (allowedAttrs.has(attr)) {
          if (this.isValidAttributeValue(attr, attrValue)) {
            filteredAttributes += ` ${attrName}="${attrValue}"`;
          } else {
            threats.push(`Invalid attribute value: ${attr}="${attrValue}"`);
          }
        } else {
          threats.push(`Disallowed attribute: ${attr}`);
        }
      }
      return `<${tagName}${filteredAttributes}>`;
    });
  }
  isValidAttributeValue(_attr, value) {
    const dangerousPatterns = [
      /javascript\s*:/i,
      /vbscript\s*:/i,
      /data\s*:(?!image\/)/i,
      /expression\s*\(/i
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(value));
  }
}
class CSRFProtector {
  constructor(_config = {}) {
    this.tokens = /* @__PURE__ */ new Map();
  }
  generateToken() {
    const token = this.generateRandomToken();
    const now = Date.now();
    const expires = now + 24 * 60 * 60 * 1e3;
    const csrfToken = {
      token,
      timestamp: now,
      expires
    };
    this.tokens.set(token, csrfToken);
    this.cleanupExpiredTokens();
    return csrfToken;
  }
  validateToken(token) {
    const csrfToken = this.tokens.get(token);
    if (!csrfToken) {
      return false;
    }
    if (Date.now() > csrfToken.expires) {
      this.tokens.delete(token);
      return false;
    }
    return true;
  }
  generateRandomToken() {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, csrfToken] of this.tokens.entries()) {
      if (now > csrfToken.expires) {
        this.tokens.delete(token);
      }
    }
  }
}
class SecurityManagerImpl {
  constructor(config = {}, engine) {
    this.eventCallbacks = [];
    this.engine = engine;
    this.config = {
      xss: {
        enabled: true,
        allowedTags: config.xss?.allowedTags || void 0,
        // 让 XSSProtector 使用默认值
        allowedAttributes: config.xss?.allowedAttributes || void 0,
        // 让 XSSProtector 使用默认值
        stripIgnoreTag: true,
        ...config.xss
      },
      csrf: {
        enabled: true,
        tokenName: "_csrf_token",
        headerName: "X-CSRF-Token",
        cookieName: "csrf_token",
        sameSite: "strict",
        ...config.csrf
      },
      csp: {
        enabled: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
          "font-src": ["'self'"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"]
        },
        reportOnly: false,
        reportUri: "/csp-report",
        ...config.csp
      },
      clickjacking: {
        enabled: true,
        policy: "deny",
        ...config.clickjacking
      },
      https: {
        enabled: true,
        hsts: {
          maxAge: 31536e3,
          // 1年
          includeSubDomains: true,
          preload: false,
          ...config.https?.hsts
        },
        ...config.https
      }
    };
    this.xssProtector = new XSSProtector(this.config?.xss);
    this.csrfProtector = new CSRFProtector(this.config?.csrf);
  }
  sanitizeHTML(html) {
    if (!this.config?.xss.enabled) {
      return {
        safe: true,
        sanitized: html,
        threats: []
      };
    }
    const result = this.xssProtector.sanitize(html);
    if (!result.safe) {
      this.reportSecurityEvent({
        type: SecurityEventType.XSS_DETECTED,
        message: "XSS attempt detected and blocked",
        details: {
          originalHTML: html,
          sanitizedHTML: result.sanitized,
          threats: result.threats
        },
        timestamp: Date.now()
      });
    }
    return result;
  }
  sanitize(input) {
    return this.sanitizeHTML(input).sanitized;
  }
  validateInput(input, type = "text") {
    switch (type) {
      case "html":
        return this.sanitizeHTML(input).safe;
      case "url":
        try {
          new URL(input);
          return !input.toLowerCase().startsWith("javascript:");
        } catch {
          return false;
        }
      case "text":
      default:
        return !/<[^>]*>/.test(input) && !/javascript\s*:/i.test(input);
    }
  }
  generateCSRFToken() {
    if (!this.config?.csrf.enabled) {
      throw new Error("CSRF protection is disabled");
    }
    return this.csrfProtector.generateToken();
  }
  validateCSRFToken(token) {
    if (!this.config?.csrf.enabled) {
      return true;
    }
    const isValid = this.csrfProtector.validateToken(token);
    if (!isValid) {
      this.reportSecurityEvent({
        type: SecurityEventType.CSRF_ATTACK,
        message: "Invalid CSRF token detected",
        details: { token },
        timestamp: Date.now()
      });
    }
    return isValid;
  }
  getCSRFToken() {
    if (!this.config?.csrf.enabled) {
      return null;
    }
    if (typeof document !== "undefined") {
      const meta = document.querySelector(`meta[name="${this.config?.csrf.tokenName}"]`);
      if (meta) {
        return meta.getAttribute("content");
      }
    }
    return null;
  }
  generateCSPHeader() {
    if (!this.config?.csp.enabled) {
      return "";
    }
    const directives = Object.entries(this.config?.csp.directives || {}).map(([key, values]) => `${key} ${values.join(" ")}`).join("; ");
    const headerName = this.config?.csp.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
    return `${headerName}: ${directives}`;
  }
  reportCSPViolation(violation) {
    this.reportSecurityEvent({
      type: SecurityEventType.CSP_VIOLATION,
      message: "Content Security Policy violation",
      details: violation,
      timestamp: Date.now()
    });
  }
  getSecurityHeaders() {
    const headers = {};
    if (this.config?.csp.enabled) {
      const cspHeader = this.generateCSPHeader();
      if (cspHeader) {
        const [headerName, headerValue] = cspHeader.split(": ", 2);
        headers[headerName] = headerValue;
      }
    }
    if (this.config?.clickjacking.enabled) {
      switch (this.config?.clickjacking.policy) {
        case "deny":
          headers["X-Frame-Options"] = "DENY";
          break;
        case "sameorigin":
          headers["X-Frame-Options"] = "SAMEORIGIN";
          break;
        case "allow-from":
          if (this.config?.clickjacking.allowFrom) {
            headers["X-Frame-Options"] = `ALLOW-FROM ${this.config?.clickjacking.allowFrom}`;
          }
          break;
      }
    }
    if (this.config?.https.enabled) {
      const { hsts } = this.config?.https;
      if (hsts) {
        let hstsValue = `max-age=${hsts.maxAge}`;
        if (hsts.includeSubDomains) {
          hstsValue += "; includeSubDomains";
        }
        if (hsts.preload) {
          hstsValue += "; preload";
        }
        headers["Strict-Transport-Security"] = hstsValue;
      }
    }
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-XSS-Protection"] = "1; mode=block";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    return headers;
  }
  onSecurityEvent(callback) {
    this.eventCallbacks.push(callback);
  }
  reportSecurityEvent(event) {
    if (this.engine?.logger) {
      this.engine.logger.warn("Security event detected", event);
    }
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        if (this.engine?.logger) {
          this.engine.logger.error("Error in security event callback", error);
        }
      }
    });
    if (this.engine?.events) {
      this.engine.events.emit("security:event", event);
    }
  }
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      xss: { ...this.config?.xss, ...config.xss },
      csrf: { ...this.config?.csrf, ...config.csrf },
      csp: { ...this.config?.csp, ...config.csp },
      clickjacking: { ...this.config?.clickjacking, ...config.clickjacking },
      https: { ...this.config?.https, ...config.https }
    };
    this.xssProtector = new XSSProtector(this.config?.xss);
    this.csrfProtector = new CSRFProtector(this.config?.csrf);
  }
  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }
}
function createSecurityManager(config, engine) {
  return new SecurityManagerImpl(config, engine);
}

export { SecurityEventType, SecurityManagerImpl, createSecurityManager };
//# sourceMappingURL=security-manager.js.map
