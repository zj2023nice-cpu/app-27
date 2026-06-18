import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify()
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#6366f1',
        dark: '#4f46e5',
        light: '#818cf8'
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium cursor-pointer transition-all duration-200',
    'btn-primary': 'btn bg-primary text-white hover:bg-primary-dark active:scale-95',
    'btn-success': 'btn bg-success text-white hover:bg-green-600 active:scale-95',
    'btn-danger': 'btn bg-error text-white hover:bg-red-600 active:scale-95',
    'btn-secondary': 'btn bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95',
    'card': 'bg-white rounded-xl shadow-sm p-6',
    'input': 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
  }
});
