import plugin from 'tailwindcss';
import { mtConfig } from '@material-tailwind/react';

// Theme copied from fileglancer (frontend/tailwind.config.js) so zipglancer
// looks visually consistent with fileglancer.
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'hover-gradient':
          'linear-gradient(120deg, rgb(var(--color-primary-light) / 0.2) , rgb(var(--color-secondary-light) / 0.2))',
        'hover-gradient-dark':
          'linear-gradient(120deg, rgb(var(--color-primary-dark) / 0.4), rgb(var(--color-secondary-dark) / 0.4))'
      },
      screens: {
        short: { raw: '(min-height: 0px) and (max-height: 420px)' }
      },
      keyframes: {
        appear: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        appear: 'appear 0.01s ease-in-out backwards'
      }
    }
  },
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'animation-delay': value => {
            return {
              'animation-delay': value
            };
          }
        },
        {
          values: theme('transitionDelay')
        }
      );
    }),
    mtConfig({
      colors: {
        background: '#FFFFFF',
        foreground: '#4B5563',
        surface: {
          default: '#E5E7EB',
          dark: '#D1D5DB',
          light: '#F9FAFB',
          foreground: '#1F2937'
        },
        primary: {
          default: '#058d96',
          dark: '#04767f',
          light: '#36a9b0',
          foreground: '#FFFFFF'
        },
        secondary: {
          default: '#6D28D9',
          dark: '#4C1D95',
          light: '#8B5CF6',
          foreground: '#FFFFFF'
        },
        success: {
          default: '#16a34a',
          dark: '#15803d',
          light: '#f0fdf4',
          foreground: '#FFFFFF'
        },
        info: {
          default: '#2563eb',
          dark: '#1d4ed8',
          light: '#eff6ff',
          foreground: '#FFFFFF'
        },
        warning: {
          default: '#d97706',
          dark: '#92400e',
          light: '#fffbeb',
          foreground: '#FFFFFF'
        },
        error: {
          default: '#dc2626',
          dark: '#991b1b',
          light: '#f25555',
          foreground: '#FFFFFF'
        }
      },
      darkColors: {
        background: '#111827',
        foreground: '#D1D5DB',
        surface: {
          default: '#1F2937',
          dark: '#171f2e',
          light: '#374151',
          foreground: '#F3F4F6'
        },
        primary: {
          default: '#45bcc4',
          dark: '#36a9b0',
          light: '#5cc8cf',
          foreground: '#F3F4F6'
        },
        secondary: {
          default: '#A78BFA',
          dark: '#8B5CF6',
          light: '#DDD6FE',
          foreground: '#F3F4F6'
        },
        success: {
          default: '#4ade80',
          dark: '#0a3d1e',
          light: '#86efac',
          foreground: '#F3F4F6'
        },
        info: {
          default: '#60a5fa',
          dark: '#1e3a5f',
          light: '#93c5fd',
          foreground: '#F3F4F6'
        },
        warning: {
          default: '#fbbf24',
          dark: '#5c2d0e',
          light: '#fcd34d',
          foreground: '#F3F4F6'
        },
        error: {
          default: '#f87171',
          dark: '#5c1414',
          light: '#fca5a5',
          foreground: '#F3F4F6'
        }
      }
    })
  ]
};

export default config;
