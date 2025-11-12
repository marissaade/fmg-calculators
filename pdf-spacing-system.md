# Standardized PDF Spacing System

## Overview
Create a clear, constant-based spacing system for PDF generation that eliminates spacing inconsistencies and can be easily replicated across all calculators.

## Implementation Steps

### 1. Define Spacing Constants
At the top of the `downloadResults()` method in any calculator script, define all spacing constants:

```javascript
/**
 * PDF SPACING SYSTEM
 * Use these constants for all spacing throughout the PDF.
 * This ensures consistency and makes it easy to adjust spacing globally.
 * Copy these constants to other calculator PDF generation functions.
 */
const PDF_SPACING = {
    SECTION_GAP: 20,           // Space between major sections
    HEADER_TO_CONTENT: 8,      // Space from section header to its content
    CONTENT_LINE_HEIGHT: 8,    // Line height for all paragraph content
    SUMMARY_LINE_HEIGHT: 1.5,  // Line height factor for summary text
    CHART_HEIGHT: 100,         // Fixed chart height in PDF
    CHART_TO_DISCLAIMER: 10    // Space between chart and disclaimer text
};
```

### 2. Replace All Hardcoded Spacing Values
Update the PDF generation code to use only the constants defined above:

- Replace `sectionSpacing` variable with `PDF_SPACING.SECTION_GAP`
- Replace hardcoded `8` values with `PDF_SPACING.HEADER_TO_CONTENT`
- Replace `contentLineHeight` with `PDF_SPACING.CONTENT_LINE_HEIGHT`
- Replace chart height calculation (`yPosition += 120`) with `PDF_SPACING.CHART_HEIGHT + PDF_SPACING.CHART_TO_DISCLAIMER`
- Replace summary lineHeightFactor with `PDF_SPACING.SUMMARY_LINE_HEIGHT`

### 3. Fix Chart Overlap Issue
Set the chart to a fixed height using the constant:

```javascript
doc.addImage(chartImage, 'PNG', 20, yPosition, 170, PDF_SPACING.CHART_HEIGHT);
```

Then position disclaimer text using:

```javascript
yPosition += PDF_SPACING.CHART_HEIGHT + PDF_SPACING.CHART_TO_DISCLAIMER;
```

### 4. Usage Examples

#### Section Headers
```javascript
// Section header
doc.text('Section Title', 20, yPosition);
yPosition += PDF_SPACING.HEADER_TO_CONTENT;
```

#### Content Lines
```javascript
// Content lines
doc.text('Content line 1', 20, yPosition);
yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
doc.text('Content line 2', 20, yPosition);
yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
```

#### Section Breaks
```javascript
// Move to next section
yPosition += PDF_SPACING.SECTION_GAP;
```

#### Summary Text
```javascript
// Summary with proper line height
const summaryText = "Your summary text here...";
const splitText = doc.splitTextToSize(summaryText, 170);
doc.text(splitText, 20, yPosition, { lineHeightFactor: PDF_SPACING.SUMMARY_LINE_HEIGHT });
```

## Expected Outcome
- All spacing uses named constants (no magic numbers)
- Chart displays at fixed height and disclaimer appears below it
- Consistent 20px gaps between major sections
- Easy to replicate across all calculators by copying the constants
- Simple to adjust spacing globally by changing one constant value

## Files to Apply This System
- `/saving-for-college/script.js` ✅ (Already implemented)
- `/comparing-investments/script.js` (To be updated)
- Future calculator PDF generation functions

## Benefits
1. **Consistency** - All PDFs will have identical spacing
2. **Maintainability** - Change one value to adjust spacing globally
3. **Readability** - Code is self-documenting with named constants
4. **Reusability** - Easy to copy to new calculators
5. **Debugging** - No more hunting for hardcoded spacing values
