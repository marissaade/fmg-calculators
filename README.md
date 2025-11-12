# Calculator Redesign Project

## Overview
This project contains four financial calculators that have been redesigned for consistency, accessibility, and improved user experience.

## Calculators Included
- **How Long Will Your Money Last** (`how-long-money-lasts/`)
- **What Is My Net Worth** (`what-is-my-net-worth/`)
- **Contributing to IRA** (`contributing-to-ira/`)
- **What Is My Monthly Budget** (`what-is-my-monthly-budget/`)
- **Debt or Invest** (`debt-or-invest/`)
- **Comparing Investments** (`comparing-investments/`)
- **Saving for College** (`saving-for-college/`)

## Recent Updates

### ✅ Accessibility Improvements
- **Fixed label associations**: All form labels now have proper `for` attributes matching their input `id`s
- **Added autocomplete attributes**: All inputs have `autocomplete="off"` to prevent browser interference
- **Improved screen reader support**: Proper label-input associations for better accessibility

### ✅ Visual Consistency
- **Dynamic chart colors**: Charts now use CSS custom properties (`--paletteColor1`, `--paletteColor2`, `--paletteColor3`, `--bodyFontFamily`)
- **Consistent styling**: Dollar sign alignment, background colors, and heading centering across all calculators
- **Responsive design**: Mobile-friendly layouts with proper button stacking

### ✅ User Experience Enhancements
- **Reset buttons**: Added to all calculators for easy form clearing
- **Comma formatting**: Currency inputs automatically format with commas
- **Removed browser alerts**: No more disruptive popup alerts for input validation
- **Placeholder content**: Inspirational messages shown before calculation (Saving for College)

## Console Issues Status

### ✅ Resolved Issues (From Our Code)
- **"No label associated with a form field"** - Fixed by adding `for` attributes to all labels
- **"An element doesn't have an autocomplete attribute"** - Fixed by adding `autocomplete="off"` to all inputs

### ⚠️ External Issues (Not From Our Code)
- **"Deprecated feature used: Unload event listeners"** - This comes from:
  - CMS scripts (`scripts.js?v=2.86.45.33681.2977:12`)
  - Third-party libraries (Chart.js, jspdf)
  - Main website JavaScript
  
  **Note**: This is outside our control as it's part of the CMS infrastructure. The `window.onunload` event listener is deprecated but still functional. Consider this a known issue that would need to be addressed at the CMS level.

## File Structure
```
Calculator Redesign Project/
├── comparing-investments/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── saving-for-college/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── contributing-to-ira/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── debt-or-invest/
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

## Technical Notes

### CMS Compatibility
- Single-line HTML format required
- No form tags - direct button click handlers
- Self-closing canvas tags: `<canvas id="name" />`
- Consistent class prefixes (sfc-, ci-, ira-, doi-)

### Dynamic Theming
All calculators now support dynamic color theming through CSS custom properties:
- `--paletteColor1`: Primary chart color
- `--paletteColor2`: Secondary chart color  
- `--paletteColor3`: Tertiary chart color
- `--bodyFontFamily`: Font family for charts

### Browser Support
- Modern browsers with CSS custom properties support
- Chart.js 3.x+ for interactive charts
- jspdf for PDF generation

## Deployment
Files are deployed to AWS S3 buckets:
- `https://fmg-websites-custom.s3.amazonaws.com/calculators/[calculatorName]/`

## Future Enhancements
- Quick Start (≤5 fields) and Customize expandable panels
- Up/down arrows and mobile sliders for numeric inputs
- Sticky Calculate button behavior
- Enhanced focus management and ARIA labels
- Improved mobile touch interactions
