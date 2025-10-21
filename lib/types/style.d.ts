/**
 * 样式管理类型定义
 * 包含样式管理器、主题等相关类型
 */
export interface StyleManager {
    add: (styles: string | CSSStyleSheet, options?: StyleOptions) => void;
    remove: (id: string) => void;
    update: (id: string, styles: string) => void;
    get: (id: string) => CSSStyleSheet | undefined;
    getAll: () => CSSStyleSheet[];
    clear: () => void;
    inject: (styles: string, target?: HTMLElement) => void;
    extract: (selector: string) => string;
    compile: (template: string, variables: Record<string, unknown>) => string;
}
export interface StyleOptions {
    id?: string;
    priority?: number;
    scoped?: boolean;
    media?: string;
    disabled?: boolean;
    source?: string;
    metadata?: Record<string, unknown>;
}
export interface ThemeManager {
    set: (theme: Theme) => void;
    get: () => Theme;
    getAll: () => Theme[];
    create: (name: string, colors: ColorPalette, options?: ThemeOptions) => Theme;
    update: (name: string, updates: Partial<Theme>) => void;
    delete: (name: string) => void;
    export: (name: string) => string;
    import: (themeData: string) => Theme;
    preview: (theme: Theme) => void;
    reset: () => void;
}
export interface Theme {
    name: string;
    description?: string;
    author?: string;
    version: string;
    colors: ColorPalette;
    typography: Typography;
    spacing: Spacing;
    shadows: Shadows;
    borders: Borders;
    animations: Animations;
    breakpoints: Breakpoints;
    metadata?: Record<string, unknown>;
}
export interface ColorPalette {
    primary: ColorVariants;
    secondary: ColorVariants;
    success: ColorVariants;
    warning: ColorVariants;
    error: ColorVariants;
    info: ColorVariants;
    neutral: ColorVariants;
    background: ColorVariants;
    surface: ColorVariants;
    text: ColorVariants;
    border: ColorVariants;
    overlay: ColorVariants;
}
export interface ColorVariants {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    light?: string;
    main: string;
    dark?: string;
    contrast?: string;
}
export interface Color {
    hex: string;
    rgb: RGB;
    hsl: HSL;
    alpha: number;
    name?: string;
    isLight: boolean;
    isDark: boolean;
    contrast: string;
}
export interface RGB {
    r: number;
    g: number;
    b: number;
}
export interface HSL {
    h: number;
    s: number;
    l: number;
}
export interface Typography {
    fontFamily: FontFamily;
    fontSize: FontSize;
    fontWeight: FontWeight;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
    textAlign: TextAlign;
    textTransform: TextTransform;
    textDecoration: TextDecoration;
}
export interface FontFamily {
    primary: string[];
    secondary: string[];
    monospace: string[];
    display: string[];
    body: string[];
}
export interface FontSize {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
}
export interface FontWeight {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
}
export interface LineHeight {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
}
export interface LetterSpacing {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
}
export type TextAlign = 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextDecoration = 'none' | 'underline' | 'overline' | 'line-through';
export interface Spacing {
    px: string;
    0: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
}
export interface Shadows {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
}
export interface Borders {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
}
export interface Animations {
    duration: Duration;
    easing: Easing;
    delay: Delay;
    iteration: Iteration;
    direction: Direction;
    fillMode: FillMode;
    playState: PlayState;
}
export interface Duration {
    fast: string;
    base: string;
    slow: string;
    slower: string;
}
export interface Easing {
    linear: string;
    in: string;
    out: string;
    inOut: string;
    bounce: string;
    elastic: string;
}
export interface Delay {
    none: string;
    fast: string;
    base: string;
    slow: string;
}
export interface Iteration {
    once: number;
    twice: number;
    infinite: number;
}
export type Direction = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
export type FillMode = 'none' | 'forwards' | 'backwards' | 'both';
export type PlayState = 'running' | 'paused';
export interface Breakpoints {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
}
export interface ThemeOptions {
    description?: string;
    author?: string;
    version?: string;
    metadata?: Record<string, unknown>;
}
export interface CSSVariableManager {
    set: (name: string, value: string, scope?: string) => void;
    get: (name: string, scope?: string) => string | undefined;
    delete: (name: string, scope?: string) => boolean;
    getAll: (scope?: string) => Record<string, string>;
    clear: (scope?: string) => void;
    export: (scope?: string) => string;
    import: (variables: Record<string, string>, scope?: string) => void;
}
export interface StyleCompiler {
    compile: (template: string, variables: Record<string, unknown>) => string;
    minify: (css: string) => string;
    autoprefix: (css: string) => string;
    validate: (css: string) => StyleValidationResult;
    transform: (css: string, transforms: StyleTransform[]) => string;
}
export interface StyleTransform {
    name: string;
    apply: (css: string) => string;
    options?: Record<string, unknown>;
}
export interface StyleValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
}
