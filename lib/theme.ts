// 青椒老師家教中心 - 主題色系統
// 設計理念：自然、專業、溫暖、可信賴

export const colors = {
  // 主要品牌色
  primary: {
    50: '#f0f7ed',   // 最淺綠 - 背景色
    100: '#d8ebc8',  // 淺綠 - 懸停背景
    200: '#B4CD93',  // 用戶指定 - 主要輔助色
    300: '#9bbf7a',  // 中綠
    400: '#82b061',  // 深綠
    500: '#427A5B',  // 用戶指定 - 主要品牌色
    600: '#3a6b50',  // 更深綠
    700: '#2d5240',  // 深綠
    800: '#1f3a2d',  // 最深綠
    900: '#142419',  // 極深綠
  },
  
  // 輔助色系
  secondary: {
    50: '#f8fafc',   // 淺灰背景
    100: '#f1f5f9',  // 灰色背景
    200: '#e2e8f0',  // 邊框色
    300: '#cbd5e1',  // 分隔線
    400: '#94a3b8',  // 輔助文字
    500: '#64748b',  // 一般文字
    600: '#475569',  // 深度文字
    700: '#334155',  // 標題文字
    800: '#1e293b',  // 主要文字
    900: '#0f172a',  // 最深文字
  },
  
  // 功能色
  accent: {
    blue: '#3b82f6',     // 連結色
    green: '#10b981',    // 成功色
    yellow: '#f59e0b',   // 警告色
    red: '#ef4444',      // 錯誤色
    purple: '#8b5cf6',   // 特殊強調
  },
  
  // 語義化顏色
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // 常用組合
  combinations: {
    // 主要按鈕
    buttonPrimary: {
      bg: '#427A5B',
      text: '#ffffff',
      hover: '#3a6b50',
      active: '#2d5240',
    },
    
    // 次要按鈕
    buttonSecondary: {
      bg: '#B4CD93',
      text: '#1f3a2d',
      hover: '#9bbf7a',
      active: '#82b061',
    },
    
    // 文字按鈕
    buttonText: {
      bg: 'transparent',
      text: '#427A5B',
      hover: '#f0f7ed',
      active: '#d8ebc8',
    },
    
    // 卡片
    card: {
      bg: '#ffffff',
      border: '#e2e8f0',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    
    // 背景
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      accent: '#f0f7ed',
    },
  },
}

// Tailwind CSS 自定義色彩 (供 tailwind.config.js 使用)
export const tailwindColors = {
  brand: {
    50: colors.primary[50],
    100: colors.primary[100],
    200: colors.primary[200],
    300: colors.primary[300],
    400: colors.primary[400],
    500: colors.primary[500],
    600: colors.primary[600],
    700: colors.primary[700],
    800: colors.primary[800],
    900: colors.primary[900],
  },
  neutral: {
    50: colors.secondary[50],
    100: colors.secondary[100],
    200: colors.secondary[200],
    300: colors.secondary[300],
    400: colors.secondary[400],
    500: colors.secondary[500],
    600: colors.secondary[600],
    700: colors.secondary[700],
    800: colors.secondary[800],
    900: colors.secondary[900],
  },
}

// CSS 變數 (供全域使用)
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-light': colors.primary[200],
  '--color-primary-dark': colors.primary[700],
  '--color-secondary': colors.secondary[500],
  '--color-text-primary': colors.secondary[800],
  '--color-text-secondary': colors.secondary[600],
  '--color-background': colors.combinations.background.primary,
  '--color-background-secondary': colors.combinations.background.secondary,
  '--color-border': colors.secondary[200],
}

// 實用函數
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.')
  let result: any = colors
  
  for (const key of keys) {
    result = result[key]
    if (!result) return undefined
  }
  
  return result
}

// 預設主題配置
export const defaultTheme = {
  colors,
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
} 