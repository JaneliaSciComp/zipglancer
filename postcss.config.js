import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Material Tailwind uses `[&_data-slot=icon]` Tailwind arbitrary variants,
// which generate selectors like `… data-slot=icon` — missing the brackets that
// make it a valid CSS attribute selector. This plugin fixes them before esbuild
// minifies the CSS.
const fixDataSlotSelectors = {
  postcssPlugin: 'fix-data-slot-selectors',
  Rule(rule) {
    if (rule.selector && / data-slot=\w/.test(rule.selector)) {
      rule.selector = rule.selector.replace(/ (data-slot=\S+)/g, ' [$1]');
    }
  }
};

export default {
  plugins: [tailwindcss, autoprefixer, fixDataSlotSelectors]
};
