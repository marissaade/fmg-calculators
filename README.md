# FMG Calculator Redesign Project

## Overview
This project contains financial calculators redesigned for consistency, accessibility, and improved user experience. All calculators follow standardized patterns documented in `.cursorrules` for maintainability and UX consistency.

## Calculators Included

### Active Calculators (Redesigned)
- **How Long Will Your Money Last** (`how-long-money-lasts/`) - Prefix: `hlywml-`
- **What Is My Net Worth** (`what-is-my-net-worth/`) - Prefix: `winw-`
- **Contributing to an IRA** (`contributing-to-ira/`) - Prefix: `ira-`
- **What Is My Monthly Budget** (`what-is-my-monthly-budget/`) - Prefix: `wimb-`
- **Debt or Invest** (`debt-or-invest/`) - Prefix: `doi-`

### Legacy Calculators (Pending Update)
These calculators have not yet been updated to match the new design patterns and will be updated in the future:

- **Comparing Investments** (`comparing-investments/`) - Prefix: `ci-`
  - Still uses "Calculate" button pattern
  - Forms are not pre-filled
  - Does not auto-calculate on page load
  - Missing slider implementations where applicable
  
- **Saving for College** (`saving-for-college/`) - Prefix: `sfc-`
  - Still uses "Calculate" button pattern
  - Forms are not pre-filled
  - Does not auto-calculate on page load
  - Missing slider implementations where applicable

## Key Features

### ✅ Pre-filled Forms with Auto-Calculation
- All calculators are pre-filled with realistic default values
- Results display automatically on page load
- Real-time calculation as users modify inputs (debounced)
- No "Calculate" buttons required for pre-filled forms

### ✅ Input Formatting & Sliders
- **Currency inputs**: Automatically format with commas (e.g., $10,000)
- **Sliders**: Available for percentage and currency fields where appropriate
- **No spinner arrows**: Removed for better UX and accuracy
- **Bidirectional sync**: Sliders and text inputs stay in sync

### ✅ Tooltips
- Clickable '?' icons for field explanations
- Mobile-friendly (click to show/hide)
- Desktop hover support
- Reduces visual clutter compared to persistent helper text

### ✅ Consistent Styling
- Unified color palette (soft, muted colors for charts)
- Consistent button styling and placement
- Responsive design (mobile, tablet, desktop)
- Chart integration with Chart.js
- PDF download functionality (jsPDF)

### ✅ User Experience
- **Reset/Start Over buttons**: Restore defaults and clear results
- **Mobile scrolling**: Auto-scroll to results/form sections
- **Breakdown sections**: Nested in main result cards with dividers
- **Chart headings**: Consistent styling and positioning

## Development Standards

### Naming Conventions
Each calculator uses a unique prefix for all classes and IDs:
- `hlywml-`: How Long Will Your Money Last
- `winw-`: What Is My Net Worth
- `ira-`: Contributing to an IRA
- `wimb-`: What Is My Monthly Budget
- `doi-`: Debt or Invest
- `ci-`: Comparing Investments (legacy)
- `sfc-`: Saving for College (legacy)

### Code Patterns
All calculators follow patterns documented in `.cursorrules`:
- Single-line HTML format (CMS compatibility)
- Consistent class structure
- Standardized JavaScript methods
- Unified CSS patterns

### Required Methods
- `calculateOnLoad()`: Format defaults and trigger initial calculation
- `calculateAndDisplay()`: Main calculation logic
- `initializeInputFormatting()`: Currency comma formatting
- `initializeSliders()`: Slider synchronization
- `resetForm()`: Restore defaults

## File Structure
```
Calculator Redesign Project/
├── .cursorrules                    # Development standards and patterns
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
├── GITHUB_SETUP.md                 # GitHub setup instructions
├── how-long-money-lasts/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── what-is-my-net-worth/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── contributing-to-ira/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── what-is-my-monthly-budget/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── debt-or-invest/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── comparing-investments/          # Legacy
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── saving-for-college/             # Legacy
    ├── index.html
    ├── styles.css
    └── script.js
```

## Technical Implementation

### HTML Structure
- **Single-line format**: Required for CMS compatibility
- **No form tags**: Direct button click handlers
- **Self-closing canvas**: `<canvas id="name" />`
- **CDN scripts**: Chart.js and jsPDF included

### CSS Patterns
- Consistent spacing and typography
- Responsive breakpoints
- Slider styling (green theme: `#10b981`)
- Tooltip positioning and styling
- Breakdown sections with dividers

### JavaScript Patterns
- Class-based structure
- Debounced calculations (300ms)
- Currency parsing with comma support
- Slider synchronization
- Chart initialization and updates

### CMS Compatibility
- **Do NOT include `.dev-calculator` class**: CMS adds it automatically
- Single-line HTML required
- Full CDN URLs for scripts/stylesheets
- Consistent prefix system for all classes/IDs

## Dependencies

### External Libraries
- **Chart.js**: `https://cdn.jsdelivr.net/npm/chart.js`
- **jsPDF**: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

### Browser Support
- Modern browsers with CSS custom properties support
- Chart.js 3.x+ for interactive charts
- Mobile-friendly touch interactions

## Deployment

Files are deployed to AWS S3 buckets:
- `https://fmg-websites-custom.s3.amazonaws.com/calculators/[calculatorName]/`

### Calculator Names (S3 paths)
- `howLongMoneyLasts`
- `whatIsMyNetWorth`
- `contributingToIra`
- `whatIsMyMonthlyBudget`
- `debtOrInvest`
- `comparingInvestments` (legacy)
- `savingForCollege` (legacy)

## UX Guidelines

### Form & Results Layout
- Form on left, results on right (desktop)
- Stacked layout on mobile
- Pre-filled data preferred over empty fields
- Placeholder format: `"10,000"` (no "i.e.," or "$" since currency symbol is shown)

### Calculation Behavior
- **Pre-filled forms**: Auto-calculate on load and input changes
- **Empty forms**: Require "Calculate" button (not currently used)
- Mobile: Auto-scroll to results after calculation

### Input Guidelines
- **No steppers**: Up/down arrows removed for accuracy
- **Sliders**: Always paired with text inputs for precision
- **Tooltips**: Preferred over persistent helper text
- **Dropdowns**: Use for ≤10 options, text fields for precise values

## Contributing

When adding new calculators:
1. Review `.cursorrules` for patterns and standards
2. Use consistent prefix for all classes/IDs
3. Follow established HTML, CSS, and JavaScript patterns
4. Test on mobile, tablet, and desktop
5. Ensure CMS compatibility (single-line HTML)

## Repository

This project is hosted on GitHub:
- **Repository**: https://github.com/marissaade/fmg-calculators
- **Main branch**: `main`

## Notes

- All calculators follow the patterns documented in `.cursorrules`
- Color palettes use soft, muted tones (avoid black/red)
- Calculations are accurate and match expected financial formulas
- Maintain consistency with existing calculators for user experience
- Document any deviations from standards with clear reasoning
