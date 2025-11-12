# Contributing to an IRA Calculator

A financial calculator that helps users determine their IRA contribution eligibility, calculate potential tax deductions, and project future IRA value based on contributions and growth.

## Features

- **Eligibility Check**: Determines if user is eligible to contribute based on MAGI and filing status
- **Deduction Calculation**: Calculates maximum deductible contribution based on 2024 IRA rules
- **Phase-Out Handling**: Applies IRS phase-out ranges for Traditional IRA deductions
- **Growth Projection**: Projects IRA value over time with compound growth
- **Interactive Chart**: Line chart showing IRA growth trajectory
- **PDF Export**: Download detailed analysis with chart
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **CMS Compatible**: Follows FMG CMS requirements for single-line HTML

## Input Fields

1. **Modified Adjusted Gross Income (MAGI)** - Annual income for tax purposes
2. **Tax Filing Status** - Single, Married Filing Jointly, Married Filing Separately, or Head of Household
3. **Employer Retirement Plan** - Whether user participates in workplace retirement plan
4. **Initial IRA Balance** - Current IRA account balance
5. **Annual Contribution** - Amount to contribute each year
6. **Expected Annual Rate of Return (%)** - Projected investment return rate
7. **Number of Years to Contribute** - Investment time horizon

## Output Results

1. **Eligibility Status** - Whether user can contribute to IRA
2. **Max Deductible Contribution** - Maximum tax-deductible amount
3. **Future Value of IRA** - Projected IRA value at end of contribution period
4. **Total Contributions** - Sum of all contributions made
5. **Total Earnings** - Investment earnings over time period

## IRA Rules (2024)

### Contribution Limits
- **Standard Limit**: $6,500 per year
- **Age 50+ Catch-up**: $7,500 per year (not implemented in this version)

### Phase-Out Ranges (When Covered by Workplace Plan)

**Single / Head of Household:**
- Full deduction: MAGI < $77,000
- Partial deduction: MAGI $77,000 - $87,000
- No deduction: MAGI > $87,000

**Married Filing Jointly:**
- Full deduction: MAGI < $123,000
- Partial deduction: MAGI $123,000 - $143,000
- No deduction: MAGI > $143,000

**Married Filing Separately:**
- Full deduction: MAGI < $0 (not available)
- Partial deduction: MAGI $0 - $10,000
- No deduction: MAGI > $10,000

**Note:** Users can always contribute up to the limit, but deduction availability depends on income when covered by a workplace retirement plan.

## Calculation Logic

### Eligibility Determination
1. Check if user has workplace retirement plan
2. If no workplace plan → full deduction available (up to contribution limit)
3. If has workplace plan → apply phase-out ranges based on MAGI and filing status
4. Calculate deductible amount using phase-out percentage

### Phase-Out Calculation
```javascript
phaseOutPercentage = (MAGI - minThreshold) / (maxThreshold - minThreshold)
deductibleAmount = contributionLimit * (1 - phaseOutPercentage)
```

### Future Value Projection
1. Start with initial IRA balance
2. For each year:
   - Add annual contribution (capped at contribution limit)
   - Apply annual rate of return
   - Track balance growth
3. Calculate total contributions and earnings

## Files

- `index.html` - Single-line HTML for CMS deployment
- `test-local.html` - Full HTML for local testing
- `styles.css` - Complete styling with responsive design
- `script.js` - Calculator logic and functionality
- `README.md` - This file

## Testing

Use `test-local.html` to test locally with default values:
- MAGI: $100,000
- Filing Status: Single
- Retirement Plan: Yes
- Initial Balance: $50,000
- Annual Contribution: $6,500
- Rate of Return: 7%
- Years: 30

Expected Results (from CSV):
- Eligible: Yes
- Max Deductible: $6,500
- Future Value: $994,608
- Total Contributions: $245,000
- Total Earnings: $749,608

## Deployment

1. Copy contents from `index.html` (single-line format)
2. Upload `styles.css` to S3: `s3://fmg-websites-custom/calculators/contributingToIra/styles.css`
3. Upload `script.js` to S3: `s3://fmg-websites-custom/calculators/contributingToIra/script.js`
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
- Select dropdown styling with custom arrow
- Eligibility card with conditional styling

## Unique Features

### Eligibility Card
- Green styling when eligible
- Red styling when ineligible
- Shows max deductible contribution
- Displays phase-out messages when applicable

### Select Dropdowns
- Filing status selection
- Retirement plan participation
- Custom styled with arrow indicator
- Accessible keyboard navigation

### Line Chart
- Shows growth trajectory over time
- Smooth curve with tension
- Hover tooltips with formatted values
- Y-axis shows values in thousands (K)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest) - includes `-webkit-sticky` prefix
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Important Notes

- **2024 Tax Year**: Rules and limits based on 2024 IRS guidelines
- **Simplified Model**: Does not account for catch-up contributions, Roth IRA conversions, or spousal IRAs
- **Tax Disclaimer**: This is an educational tool; users should consult tax professionals
- **Phase-Out Logic**: Applies only when user is covered by workplace retirement plan
- **Always Can Contribute**: Even when deduction is $0, users can still make non-deductible contributions

## Future Enhancements

Potential features for future versions:
- Age-based catch-up contributions ($7,500 for 50+)
- Roth IRA eligibility and phase-out ranges
- Spousal IRA contributions
- Backdoor Roth conversion scenarios
- Comparison with other retirement accounts
- Inflation adjustment for future contribution limits

## Version History

- v1.0 (2025-10-21) - Initial release
  - Two-column responsive layout
  - IRA eligibility determination
  - Phase-out calculation logic
  - Growth projection with line chart
  - PDF export with chart
  - Custom tooltip system
  - CMS compatible single-line HTML

