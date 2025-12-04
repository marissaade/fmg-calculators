# UX Decisions Comparison

## ✅ Matches Current Implementation

### 1. Form & Results Layout
- ✅ Form on left, results on right (desktop)
- ✅ Form on top, results below (mobile)
- ✅ Matches our current implementation

### 2. Form Field Data
- ✅ All fields use pre-filled data
- ✅ Values come from Kyle's spreadsheet
- ✅ Matches our current implementation

### 3. Initial State of Results Panel
- ✅ Auto-calculate immediately using pre-filled values
- ✅ Results display on page load
- ✅ Matches our current implementation

### 4. Tooltips
- ✅ Use clickable "?" icons
- ✅ Tooltip targets trigger only on icon tap (not whole label)
- ✅ Mobile-friendly (click to show/hide)
- ✅ Desktop hover support
- ✅ Matches our current implementation

### 5. Auto-Calculating vs. Calculate Button
- ✅ Auto-calculate on input change (debounced)
- ✅ No Calculate button for pre-filled forms
- ✅ Matches our current implementation

### 6. Reset / Start Over
- ✅ "Start Over" button visible at bottom of results panel
- ✅ Resets fields to original spreadsheet values
- ✅ Matches our current implementation

### 7. Sliders
- ✅ Use sliders on both desktop and mobile
- ✅ Always paired with text input for precision + tactile control
- ✅ Matches our current implementation

### 8. Dropdowns
- ✅ Use dropdowns for limited-choice inputs and well-defined numeric ranges
- ✅ Matches our current implementation

### 9. Download / Print Results
- ✅ Only "Download Results" (PDF)
- ✅ PDF is print-friendly and modern-looking
- ✅ Avoid heavy dark colors
- ✅ Matches our current implementation

---

## ⚠️ Needs Attention

### 1. Averages & Disclaimers
**New UX Requirement:**
- Add a clear disclaimer noting that pre-filled values are hypothetical averages
- Kyle/Mike will provide the exact copy

**Current Status:**
- ✅ We have disclaimers in PDF downloads
- ❌ We do NOT have visible disclaimers on the webpage about hypothetical averages
- ✅ `.cursorrules` mentions disclaimers but they're not implemented on webpages

**Action Needed:**
- Wait for Kyle/Mike to provide disclaimer copy
- Add disclaimer section to webpage (not just PDF)
- Update all calculators to include disclaimer

### 2. Input Steppers (Up/Down Arrows)
**New UX Requirement:**
- Use hover-only steppers (appear on hover)
- Fields must be `type="text"` to enable comma formatting
- Kyle will identify which fields need steppers

**Current Status:**
- ✅ Currency fields are `type="text"` for comma formatting
- ✅ We've been removing steppers entirely (via CSS `appearance: textfield`)
- ⚠️ New UX wants hover-only steppers for SOME fields (Kyle will specify)

**Action Needed:**
- Wait for Kyle to identify which fields need steppers
- Implement hover-only steppers for specified fields
- Keep steppers removed for fields not specified by Kyle

**Note:** Since Kyle hasn't specified which fields need steppers yet, we should:
- Keep current implementation (no steppers)
- Document in `.cursorrules` that hover-only steppers will be added per Kyle's specifications
- Implement when Kyle provides the list

---

## 📝 Recommendations

### Immediate Actions:
1. **Update `.cursorrules`** to reflect:
   - Hover-only steppers will be implemented per Kyle's specifications (pending)
   - Webpage disclaimers about hypothetical averages (pending Kyle/Mike copy)

### Pending Kyle/Mike Input:
1. **Disclaimer Copy**: Need exact text for webpage disclaimer about hypothetical averages
2. **Stepper Fields**: Need list of which fields should have hover-only steppers

### Future Considerations:
- Mobile improvements for "Start Over" (auto-scroll to form)
- "View Results" button for mobile
- Sticky summary during editing (if 1-2 key outputs)
- Flexible inputs ($ vs %) - future feature

---

## Summary

**Overall Match: 9/11 items** ✅

**Status:**
- Most implementation matches the new UX decisions
- Two items pending Kyle/Mike input:
  1. Disclaimer copy for webpage
  2. List of fields needing hover-only steppers

**Current Implementation is Correct:**
- We're correctly NOT implementing steppers until Kyle specifies which fields need them
- We're correctly waiting for disclaimer copy before adding webpage disclaimers

