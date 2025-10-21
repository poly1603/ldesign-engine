import type { Engine } from '../types';
export interface SecurityConfig {
    xss?: {
        enabled?: boolean;
        allowedTags?: string[];
        allowedAttributes?: Record<string, string[]>;
        stripIgnoreTag?: boolean;
    };
    csrf?: {
        enabled?: boolean;
        tokenName?: string;
        headerName?: string;
        cookieName?: string;
        sameSite?: 'strict' | 'lax' | 'none';
    };
    csp?: {
        enabled?: boolean;
        directives?: Record<string, string[]>;
        reportOnly?: boolean;
        reportUri?: string;
    };
    clickjacking?: {
        enabled?: boolean;
        policy?: 'deny' | 'sameorigin' | 'allow-from';
        allowFrom?: string;
    };
    https?: {
        enabled?: boolean;
        hsts?: {
            maxAge?: number;
            includeSubDomains?: boolean;
            preload?: boolean;
        };
    };
}
export interface XSSResult {
    safe: boolean;
    sanitized: string;
    threats: string[];
}
export interface CSRFToken {
    token: string;
    timestamp: number;
    expires: number;
}
export declare enum SecurityEventType {
    XSS_DETECTED = "xss_detected",
    CSRF_ATTACK = "csrf_attack",
    CSP_VIOLATION = "csp_violation",
    CLICKJACKING_ATTEMPT = "clickjacking_attempt",
    INSECURE_REQUEST = "insecure_request"
}
export interface SecurityEvent {
    type: SecurityEventType;
    message: string;
    details: unknown;
    timestamp: number;
    userAgent?: string;
    ip?: string;
    url?: string;
}
export interface SecurityManager {
    sanitizeHTML: (html: string) => XSSResult;
    sanitize: (input: string) => string;
    validateInput: (input: string, type?: 'html' | 'text' | 'url') => boolean;
    generateCSRFToken: () => CSRFToken;
    validateCSRFToken: (token: string) => boolean;
    getCSRFToken: () => string | null;
    generateCSPHeader: () => string;
    reportCSPViolation: (violation: unknown) => void;
    getSecurityHeaders: () => Record<string, string>;
    onSecurityEvent: (callback: (event: SecurityEvent) => void) => void;
    reportSecurityEvent: (event: SecurityEvent) => void;
    updateConfig: (config: Partial<SecurityConfig>) => void;
    getConfig: () => SecurityConfig;
}
export declare class SecurityManagerImpl implements SecurityManager {
    private config;
    private xssProtector;
    private csrfProtector;
    private eventCallbacks;
    private engine?;
    constructor(config?: SecurityConfig, engine?: Engine);
    sanitizeHTML(html: string): XSSResult;
    sanitize(input: string): string;
    validateInput(input: string, type?: 'html' | 'text' | 'url'): boolean;
    generateCSRFToken(): CSRFToken;
    validateCSRFToken(token: string): boolean;
    getCSRFToken(): string | null;
    generateCSPHeader(): string;
    reportCSPViolation(violation: unknown): void;
    getSecurityHeaders(): Record<string, string>;
    onSecurityEvent(callback: (event: SecurityEvent) => void): void;
    reportSecurityEvent(event: SecurityEvent): void;
    updateConfig(config: Partial<SecurityConfig>): void;
    getConfig(): SecurityConfig;
}
export declare function createSecurityManager(config?: SecurityConfig, engine?: Engine): SecurityManager;
