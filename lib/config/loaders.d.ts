/**
 * 配置加载器模块
 *
 * 提供多种配置加载器实现，支持从不同来源加载配置
 */
export type ConfigValue = string | number | boolean | null | undefined | ConfigObject | ConfigValue[];
export interface ConfigObject {
    [key: string]: ConfigValue;
}
export interface ConfigLoader {
    load: () => Promise<ConfigObject> | ConfigObject;
    watch?: (callback: (config: ConfigObject) => void) => (() => void) | void;
}
/**
 * 环境变量配置加载器
 *
 * 从环境变量中加载配置，支持自定义前缀
 *
 * @example
 * ```ts
 * const loader = new EnvironmentConfigLoader('APP_')
 * const config = loader.load()
 * ```
 */
export declare class EnvironmentConfigLoader implements ConfigLoader {
    private prefix;
    private logger;
    constructor(prefix?: string);
    load(): ConfigObject;
    private parseValue;
}
/**
 * JSON 文件配置加载器
 *
 * 从远程 JSON 文件加载配置，支持热重载
 *
 * @example
 * ```ts
 * const loader = new JsonConfigLoader('/config.json')
 * const config = await loader.load()
 * ```
 */
export declare class JsonConfigLoader implements ConfigLoader {
    private configPath;
    private logger;
    constructor(configPath: string);
    load(): Promise<ConfigObject>;
    watch(callback: (config: ConfigObject) => void): (() => void) | void;
}
/**
 * 内存配置加载器
 *
 * 从内存中加载配置，适用于测试和简单场景
 *
 * @example
 * ```ts
 * const loader = new MemoryConfigLoader({ apiUrl: 'https://api.example.com' })
 * const config = loader.load()
 * ```
 */
export declare class MemoryConfigLoader implements ConfigLoader {
    private config;
    constructor(config: ConfigObject);
    load(): ConfigObject;
    updateConfig(updates: Partial<ConfigObject>): void;
}
/**
 * LocalStorage 配置加载器
 *
 * 从浏览器 LocalStorage 加载配置
 *
 * @example
 * ```ts
 * const loader = new LocalStorageConfigLoader('app-config')
 * const config = loader.load()
 * ```
 */
export declare class LocalStorageConfigLoader implements ConfigLoader {
    private key;
    private logger;
    constructor(key: string);
    load(): ConfigObject;
    save(config: ConfigObject): void;
    watch(callback: (config: ConfigObject) => void): (() => void) | void;
}
/**
 * 组合配置加载器
 *
 * 按顺序加载多个配置源，后面的配置会覆盖前面的
 *
 * @example
 * ```ts
 * const loader = new CompositeConfigLoader([
 *   new EnvironmentConfigLoader(),
 *   new JsonConfigLoader('/config.json'),
 *   new LocalStorageConfigLoader('user-config')
 * ])
 * const config = await loader.load()
 * ```
 */
export declare class CompositeConfigLoader implements ConfigLoader {
    private loaders;
    private logger;
    constructor(loaders: ConfigLoader[]);
    load(): Promise<ConfigObject>;
    watch(callback: (config: ConfigObject) => void): (() => void) | void;
}
