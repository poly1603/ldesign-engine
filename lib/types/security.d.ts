/**
 * 安全管理类型定义
 * 包含安全配置、验证器等相关类型
 */
export interface SecurityManager {
    validate: (input: unknown) => SecurityValidationResult;
    sanitize: (input: string) => string;
    validateInput: (input: string, type: string) => boolean;
    encrypt: (data: string) => Promise<string>;
    decrypt: (data: string) => Promise<string>;
    hash: (data: string) => Promise<string>;
    verify: (data: string, hash: string) => Promise<boolean>;
    generateToken: () => string;
    validateToken: (token: string) => boolean;
    setPolicy: (policy: SecurityPolicy) => void;
    getPolicy: () => SecurityPolicy;
}
export interface SecurityValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitized?: unknown;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface SecurityPolicy {
    xss: XSSPolicy;
    csrf: CSRFPolicy;
    injection: InjectionPolicy;
    authentication: AuthenticationPolicy;
    authorization: AuthorizationPolicy;
    encryption: EncryptionPolicy;
    logging: SecurityLoggingPolicy;
}
export interface XSSPolicy {
    enabled: boolean;
    mode: 'strict' | 'moderate' | 'permissive';
    allowedTags: string[];
    allowedAttributes: string[];
    allowedProtocols: string[];
    stripComments: boolean;
    stripUnsafe: boolean;
}
export interface CSRFPolicy {
    enabled: boolean;
    tokenLength: number;
    tokenExpiry: number;
    headerName: string;
    cookieName: string;
    validateOrigin: boolean;
    validateReferer: boolean;
}
export interface InjectionPolicy {
    enabled: boolean;
    sqlInjection: boolean;
    noSqlInjection: boolean;
    commandInjection: boolean;
    xpathInjection: boolean;
    ldapInjection: boolean;
    patternMatching: string[];
}
export interface AuthenticationPolicy {
    enabled: boolean;
    methods: AuthenticationMethod[];
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordPolicy: PasswordPolicy;
    mfa: MFAPolicy;
}
export interface AuthenticationMethod {
    type: 'password' | 'token' | 'oauth' | 'saml' | 'ldap';
    enabled: boolean;
    config: Record<string, unknown>;
}
export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number;
    preventReuse: number;
}
export interface MFAPolicy {
    enabled: boolean;
    methods: ('sms' | 'email' | 'totp' | 'hardware')[];
    required: boolean;
    backupCodes: boolean;
}
export interface AuthorizationPolicy {
    enabled: boolean;
    model: 'rbac' | 'abac' | 'pbac';
    defaultRole: string;
    roles: Role[];
    permissions: Permission[];
    inheritance: boolean;
}
export interface Role {
    name: string;
    description: string;
    permissions: string[];
    inherits: string[];
    metadata?: Record<string, unknown>;
}
export interface Permission {
    name: string;
    resource: string;
    action: string;
    conditions?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface EncryptionPolicy {
    algorithm: string;
    keySize: number;
    mode: string;
    padding: string;
    saltLength: number;
    iterations: number;
    keyDerivation: string;
}
export interface SecurityLoggingPolicy {
    enabled: boolean;
    level: 'low' | 'medium' | 'high' | 'all';
    events: SecurityEvent[];
    retention: number;
    encryption: boolean;
    alerting: boolean;
}
export interface SecurityEvent {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    source: string;
    details: Record<string, unknown>;
    action: string;
}
export interface SecurityScanner {
    scan: (target: unknown) => Promise<SecurityScanResult>;
    scanFile: (file: File) => Promise<SecurityScanResult>;
    scanUrl: (url: string) => Promise<SecurityScanResult>;
    getVulnerabilities: () => Vulnerability[];
    getRecommendations: () => string[];
}
export interface SecurityScanResult {
    target: string;
    timestamp: number;
    vulnerabilities: Vulnerability[];
    riskScore: number;
    recommendations: string[];
    scanDuration: number;
}
export interface Vulnerability {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cve?: string;
    cvss?: number;
    affected: string[];
    remediation: string;
    references: string[];
}
