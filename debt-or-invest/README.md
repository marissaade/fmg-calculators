# Should I Pay Off Debt or Invest? Calculator

A financial calculator that helps users determine whether it's more beneficial to pay off debt or invest their extra funds.

## Features

- **Debt Analysis**: Calculate how long it will take to pay off debt and how much interest will be saved
- **Investment Projection**: Project the future value of investments over the same time period
- **Smart Recommendation**: Automatically recommends the better option based on calculations
- **Interactive Chart**: Visual comparison of interest saved vs. interest accrued
- **PDF Export**: Download detailed analysis results
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **CMS Compatible**: Follows FMG CMS requirements for single-line HTML

## Input Fields

1. **Total Debt Amount** - The total amount of debt to be paid off
2. **Debt Interest Rate (%)** - Annual interest rate on the debt
3. **Investment Rate of Return (%)** - Expected annual return on investments
4. **Monthly Payment / Investment** - Amount allocated monthly (minimum 4% of debt recommended)

## Output Results

1. **Recommendation** - Whether to pay off debt or invest
2. **Time to Pay Off Debt** - Number of months to eliminate debt
3. **Total Interest Saved (Debt)** - Interest saved by paying off debt early
4. **Future Value of Investment** - Projected investment value
5. **Total Interest Accrued (Investment)** - Interest earned from investments

## Calculation Logic

### Debt Payoff Scenario
1. Calculates monthly interest charges on remaining debt balance
2. Determines principal payment after interest
3. Tracks total interest paid over the payoff period
4. Calculates interest saved compared to standard amortization

### Investment Scenario
1. Compounds monthly investment payments over the same time period
2. Applies monthly investment rate of return
3. Calculates total interest accrued on investments

### Recommendation Logic
- **Invest**: If investment interest > debt interest saved
- **Pay Off Debt**: If debt interest saved >= investment interest

## Files

- `index.html` - Single-line HTML for CMS deployment
- `test-local.html` - Full HTML for local testing
- `styles.css` - Complete styling with responsive design
- `script.js` - Calculator logic and functionality
- `README.md` - This file

## Testing

Use `test-local.html` to test locally with default values:
- Total Debt: $10,000
- Debt Interest Rate: 30%
- Investment Rate: 2%
- Monthly Payment: $400

Expected Results (from CSV):
- Time to Pay Off: 40 months
- Interest Saved (Debt): $5,889
- Investment Interest: $6,412
- Recommendation: Invest

## Deployment

1. Copy contents from `index.html` (single-line format)
2. Upload `styles.css` to S3: `s3://fmg-websites-custom/calculators/debtOrInvest/styles.css`
3. Upload `script.js` to S3: `s3://fmg-websites-custom/calculators/debtOrInvest/script.js`
4. Paste HTML into CMS calculator field
5. Remove CMS testing styles before production:
   - `.c-matter--article .c-matter__title { display: none; }`
   - `.c-matter__meta { display: none; }`

## Design Pattern

This calculator follows the standardized FMG calculator pattern:
- Two-column layout (form left, results right)
- Sticky results column on desktop
- Custom tooltip for disabled button
- Empty chart on load, populates after calculation
- Dynamic "Calculate" / "Recalculate" button
- Standardized PDF spacing system
- Consistent styling across all calculators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest) - includes `-webkit-sticky` prefix
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Minimum monthly payment warning: Calculator warns if payment is less than 4% of debt (prevents infinite payoff scenarios)
- Maximum payoff period: 600 months (50 years) to prevent infinite loops
- Chart updates dynamically when recalculating
- PDF includes chart visualization for complete analysis
- Recommendation text changes based on which option is better

## Version History

- v1.0 (2025-10-21) - Initial release
  - Two-column responsive layout
  - Debt vs investment calculation logic
  - Interactive chart with Chart.js
  - PDF export with jsPDF
  - Custom tooltip system
  - CMS compatible single-line HTML

