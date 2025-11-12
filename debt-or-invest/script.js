/**
 * Should I Pay Off Debt or Invest Calculator
 * Helps users determine whether paying off debt or investing is more beneficial
 * Based on FMG Calculator Design Pattern
 */

class DebtOrInvestCalculator {
    constructor() {
        this.elements = {};
        this.chart = null;
        this.customTooltip = null;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.cacheElements();
        this.initializeInputFormatting();
        this.initializeSliders();
        this.initializeTooltips();
        this.initializeCustomTooltip();
        this.attachEventListeners();
        // Initial form validity check
        this.checkFormValidity();
    }

    cacheElements() {
        // Input elements
        this.elements.totalDebt = document.getElementById('doi-total-debt');
        this.elements.debtInterestRate = document.getElementById('doi-debt-interest-rate');
        this.elements.investmentRate = document.getElementById('doi-investment-rate');
        this.elements.monthlyPayment = document.getElementById('doi-monthly-payment');
        
        // Button elements
        this.calculateBtn = document.getElementById('doi-calculateBtn');
        this.resetBtn = document.getElementById('doi-reset-btn');
        this.downloadBtn = document.getElementById('doi-downloadBtn');
        
        // Results elements
        this.resultsSection = document.querySelector('.doi-results-section');
        this.recommendationText = document.getElementById('doi-recommendation-text');
        this.elements.recommendation = document.getElementById('doi-recommendation');
        this.elements.timeToPayoff = document.getElementById('doi-time-to-payoff');
        this.elements.interestSaved = document.getElementById('doi-interest-saved');
        this.elements.investmentValue = document.getElementById('doi-investment-value');
        this.elements.investmentInterest = document.getElementById('doi-investment-interest');
        
        // Chart elements
        this.chartCanvas = document.getElementById('doi-comparison-chart');
        this.placeholderContent = document.querySelector('.doi-placeholder-content');
        this.chartContainer = document.querySelector('.doi-chart-container');
        this.chartHeading = document.querySelector('.doi-chart-section h2');
    }

    initializeInputFormatting() {
        // Format currency inputs with commas
        const currencyInputs = ['doi-total-debt', 'doi-monthly-payment'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Already type="text" for comma formatting
                input.addEventListener('input', (e) => this.formatCurrencyInput(e));
                input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
                input.addEventListener('focus', (e) => this.handleCurrencyFocus(e));
            }
        });
    }

    formatCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value) {
            const numValue = parseInt(value);
            let maxValue;
            
            if (input.id === 'doi-total-debt') {
                maxValue = 1000000; // $1 million cap
            } else if (input.id === 'doi-monthly-payment') {
                maxValue = 50000; // $50K monthly cap
            }
            
            if (maxValue && numValue > maxValue) {
                value = maxValue.toString();
            }
            
            // Add comma formatting for display
            if (value && value !== '0') {
                const formattedValue = parseInt(value).toLocaleString();
                input.value = formattedValue;
            } else if (value === '0') {
                input.value = '0';
            }
        } else {
            input.value = '';
        }
        
        // Update corresponding slider
        this.updateSliderFromInput(input);
        
        // Re-check form validity after formatting
        this.checkFormValidity();
    }

    handleCurrencyFocus(event) {
        const input = event.target;
        const rawValue = input.value.replace(/[^\d]/g, '');
        input.value = rawValue;
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d]/g, '')) || 0;
    }

    initializeSliders() {
        // Sync sliders with currency text inputs
        const sliderPairs = [
            { slider: 'doi-total-debt-slider', input: 'doi-total-debt', max: 1000000 },
            { slider: 'doi-monthly-payment-slider', input: 'doi-monthly-payment', max: 50000 }
        ];
        
        sliderPairs.forEach(pair => {
            const slider = document.getElementById(pair.slider);
            const input = document.getElementById(pair.input);
            
            if (slider && input) {
                // Update input when slider changes
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        // Format with commas
                        input.value = value.toLocaleString();
                        this.checkFormValidity();
                    }
                });
            }
        });
    }

    updateSliderFromInput(input) {
        const value = this.parseCurrencyValue(input.value);
        let sliderId;
        
        if (input.id === 'doi-total-debt') {
            sliderId = 'doi-total-debt-slider';
        } else if (input.id === 'doi-monthly-payment') {
            sliderId = 'doi-monthly-payment-slider';
        }
        
        if (sliderId) {
            const slider = document.getElementById(sliderId);
            if (slider && !isNaN(value)) {
                slider.value = value;
            }
        }
    }

    initializeTooltips() {
        // Make tooltips clickable for mobile compatibility
        const tooltips = document.querySelectorAll('.doi-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Toggle active class
                const isActive = tooltip.classList.contains('active');
                // Close all tooltips first
                document.querySelectorAll('.doi-tooltip').forEach(t => t.classList.remove('active'));
                // Toggle this tooltip
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        // Close tooltips when clicking outside (single global listener)
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.doi-tooltip')) {
                document.querySelectorAll('.doi-tooltip').forEach(t => t.classList.remove('active'));
            }
        });
    }

    initializeCustomTooltip() {
        if (!this.calculateBtn) return;
        
        const tooltipText = this.calculateBtn.getAttribute('title') || 'Please complete all fields above to calculate your best option';
        this.calculateBtn.removeAttribute('title');
        
        const tooltip = document.createElement('div');
        tooltip.className = 'doi-custom-tooltip';
        tooltip.textContent = tooltipText;
        tooltip.style.cssText = `
            position: fixed !important;
            background: #333 !important;
            color: white !important;
            padding: 8px 12px !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            white-space: nowrap !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            display: block !important;
            visibility: visible !important;
        `;
        
        document.body.appendChild(tooltip);
        
        this.calculateBtn.addEventListener('mouseenter', (e) => {
            if (this.calculateBtn.disabled) {
                const rect = this.calculateBtn.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                tooltip.style.opacity = '0';
                tooltip.style.display = 'block';
                tooltip.style.visibility = 'visible';
                
                const tooltipRect = tooltip.getBoundingClientRect();
                const tooltipWidth = tooltipRect.width;
                const tooltipHeight = tooltipRect.height;
                const tooltipHalfWidth = tooltipWidth / 2;
                
                let left = rect.left + (rect.width / 2);
                let top = rect.top - tooltipHeight - 8;
                
                if (left - tooltipHalfWidth < 10) {
                    left = tooltipHalfWidth + 10;
                } else if (left + tooltipHalfWidth > viewportWidth - 10) {
                    left = viewportWidth - tooltipHalfWidth - 10;
                }
                
                if (top < 10) {
                    top = rect.bottom + 8;
                }
                
                tooltip.style.position = 'fixed';
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.zIndex = '999999';
                tooltip.style.opacity = '1';
            }
        });
        
        this.calculateBtn.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
        
        this.customTooltip = tooltip;
    }

    attachEventListeners() {
        // Input validation
        const inputs = [
            this.elements.totalDebt,
            this.elements.debtInterestRate,
            this.elements.investmentRate,
            this.elements.monthlyPayment
        ];
        
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.checkFormValidity();
                });
                input.addEventListener('blur', () => this.validateAndCapInput(input));
            }
        });
        
        // Add real-time validation for percentage inputs
        const percentageInputs = document.querySelectorAll('#doi-debt-interest-rate, #doi-investment-rate');
        percentageInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value > 100) {
                    e.target.value = 100;
                } else if (value < 0 && e.target.value !== '') {
                    e.target.value = 0;
                }
                // Re-check form validity after capping
                this.checkFormValidity();
            });
        });
        
        // Currency inputs are handled by formatCurrencyInput method
        
        // Calculate button
        if (this.calculateBtn) {
            this.calculateBtn.addEventListener('click', () => this.handleCalculate());
        }
        
        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Download button
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
    }

    checkFormValidity() {
        const inputs = [
            this.elements.totalDebt,
            this.elements.debtInterestRate,
            this.elements.investmentRate,
            this.elements.monthlyPayment
        ];
        
        const allValid = inputs.every(input => {
            if (!input) return false;
            // Use parseCurrencyValue for currency inputs, parseFloat for others
            const value = (input.id === 'doi-total-debt' || input.id === 'doi-monthly-payment') 
                ? this.parseCurrencyValue(input.value)
                : parseFloat(input.value);
            return !isNaN(value) && value > 0;
        });
        
        if (this.calculateBtn) {
            this.calculateBtn.disabled = !allValid;
        }
    }

    validateAndCapInput(input) {
        // Handle currency inputs differently
        if (input.id === 'doi-total-debt' || input.id === 'doi-monthly-payment') {
            // Currency formatting is handled by formatCurrencyInput
            const value = this.parseCurrencyValue(input.value);
            
            if (isNaN(value) || value < 0) {
                input.value = '';
                return;
            }
            
            let maxValue;
            if (input.id === 'doi-total-debt') {
                maxValue = 1000000; // $1 million
            } else if (input.id === 'doi-monthly-payment') {
                maxValue = 50000; // $50K per month
            }
            
            if (maxValue && value > maxValue) {
                input.value = maxValue.toLocaleString();
                this.updateSliderFromInput(input);
            }
            
            // Special validation for monthly payment - must be at least 4% of debt
            if (input === this.elements.monthlyPayment) {
                const totalDebt = this.parseCurrencyValue(this.elements.totalDebt.value);
                if (!isNaN(totalDebt) && totalDebt > 0) {
                    const minPayment = totalDebt * 0.04;
                    if (value < minPayment) {
                        // Show warning but don't prevent calculation
                        console.warn(`Monthly payment should be at least ${this.formatCurrency(minPayment)} (4% of debt)`);
                    }
                }
            }
        } else {
            // Handle percentage inputs
            const value = parseFloat(input.value);
            
            if (isNaN(value) || value < 0) {
                input.value = '';
                return;
            }
            
            let maxValue = 100; // 100% for percentage inputs
            
            if (value > maxValue) {
                input.value = maxValue.toString();
            }
        }
        
        // Re-check form validity after capping
        this.checkFormValidity();
    }


    handleCalculate() {
        if (this.calculateBtn.disabled) return;
        
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        this.displayResults(results);
        this.updateChart(results);
    }

    getFormData() {
        return {
            totalDebt: this.parseCurrencyValue(this.elements.totalDebt.value),
            debtInterestRate: parseFloat(this.elements.debtInterestRate.value) / 100,
            investmentRate: parseFloat(this.elements.investmentRate.value) / 100,
            monthlyPayment: this.parseCurrencyValue(this.elements.monthlyPayment.value)
        };
    }

    calculateResults(data) {
        // Calculate debt payoff scenario
        const monthlyDebtRate = data.debtInterestRate / 12;
        const monthlyInvestmentRate = data.investmentRate / 12;
        
        // Calculate time to pay off debt and total interest
        let remainingDebt = data.totalDebt;
        let totalInterestPaid = 0;
        let months = 0;
        const maxMonths = 600; // 50 years maximum
        
        while (remainingDebt > 0 && months < maxMonths) {
            const interestCharge = remainingDebt * monthlyDebtRate;
            totalInterestPaid += interestCharge;
            const principalPayment = data.monthlyPayment - interestCharge;
            
            if (principalPayment <= 0) {
                // Payment doesn't cover interest - debt will never be paid off
                months = maxMonths;
                break;
            }
            
            remainingDebt -= principalPayment;
            months++;
        }
        
        // Calculate what the total interest would be if debt wasn't paid early
        const standardMonths = months;
        let standardInterest = 0;
        let standardRemaining = data.totalDebt;
        
        for (let i = 0; i < standardMonths; i++) {
            const interestCharge = standardRemaining * monthlyDebtRate;
            standardInterest += interestCharge;
            standardRemaining -= (data.monthlyPayment - interestCharge);
        }
        
        const interestSaved = standardInterest - totalInterestPaid;
        
        // Calculate investment scenario over the same time period
        let investmentValue = 0;
        for (let i = 0; i < months; i++) {
            investmentValue = (investmentValue + data.monthlyPayment) * (1 + monthlyInvestmentRate);
        }
        
        const totalInvested = data.monthlyPayment * months;
        const investmentInterest = investmentValue - totalInvested;
        
        // Determine recommendation
        let recommendation = 'Pay Off Debt';
        let recommendationText = '';
        
        if (investmentInterest > interestSaved) {
            recommendation = 'Invest';
            recommendationText = 'If your answer suggests investing, you might want to play with your expected interest rates and monthly investments to see what kind of outcomes you get. Often, people have the goal of paying off debt in a steady, timely fashion, but life gets in the way. Experiment to see what could change your mind.';
        } else {
            recommendation = 'Pay Off Debt';
            recommendationText = 'If your answer suggests debt, you might want to consider adjusting some of your inputs to see if that changes your thinking. Often, when people feel burdened by debt, they delay other financial decisions until they are more comfortable. However, without a strategy, you might struggle thinking there is no way out.';
        }
        
        return {
            recommendation,
            recommendationText,
            timeToPayoff: months,
            interestSaved: Math.max(0, interestSaved),
            investmentValue,
            investmentInterest: Math.max(0, investmentInterest)
        };
    }

    displayResults(results) {
        // Update result values
        this.elements.recommendation.textContent = results.recommendation;
        this.elements.timeToPayoff.textContent = `${results.timeToPayoff} months`;
        this.elements.interestSaved.textContent = this.formatCurrency(results.interestSaved);
        this.elements.investmentValue.textContent = this.formatCurrency(results.investmentValue);
        this.elements.investmentInterest.textContent = this.formatCurrency(results.investmentInterest);
        
        // Update recommendation text
        if (this.recommendationText) {
            const textParagraph = this.recommendationText.querySelector('p');
            if (textParagraph) {
                textParagraph.textContent = results.recommendationText;
            }
        }
        
        // Generate and display chart
        this.updateChart(results);
        
        // Hide placeholder content and show chart
        if (this.placeholderContent) {
            this.placeholderContent.style.display = 'none';
        }
        if (this.chartContainer) {
            this.chartContainer.style.display = 'block';
        }
        if (this.chartHeading) {
            // Remove inline style to show the heading
            this.chartHeading.removeAttribute('style');
        }
        
        // Show results section
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
        
        // Show recommendation text
        if (this.recommendationText) {
            this.recommendationText.style.display = 'block';
        }
        
        // Scroll to results
        if (this.resultsSection) {
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Change button text to "Recalculate"
        if (this.calculateBtn) {
            this.calculateBtn.textContent = 'Recalculate';
        }
    }

    updateChart(results) {
        // Get CSS variables from :root for dynamic colors
        const rootStyles = getComputedStyle(document.documentElement);
        const debtColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#ef4444"; // Fallback color
        const investmentColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#10b981"; // Fallback color
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        // Update existing chart or create new one
        if (this.chart) {
            this.chart.data.datasets[0].data = [
                results.interestSaved,
                results.investmentInterest
            ];
            
            // Update colors to use dynamic values
            this.chart.data.datasets[0].backgroundColor = [
                debtColor + 'B3', // Add transparency
                investmentColor + 'B3' // Add transparency
            ];
            this.chart.data.datasets[0].borderColor = [
                debtColor,
                investmentColor
            ];
            
            this.chart.update();
        } else {
            // Create chart if it doesn't exist
            if (!this.chartCanvas) return;
            
            const ctx = this.chartCanvas.getContext('2d');
            
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Interest Saved (Debt)', 'Interest Accrued (Investment)'],
                    datasets: [{
                        label: 'Amount',
                        data: [
                            results.interestSaved,
                            results.investmentInterest
                        ],
                        backgroundColor: [
                            debtColor + 'B3', // Add transparency
                            investmentColor + 'B3' // Add transparency
                        ],
                        borderColor: [
                            debtColor,
                            investmentColor
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: false
                        },
                        tooltip: {
                            titleFont: {
                                family: fontFamily
                            },
                            bodyFont: {
                                family: fontFamily
                            },
                            callbacks: {
                                label: (context) => {
                                    return this.formatCurrency(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                font: {
                                    family: fontFamily
                                }
                            },
                            ticks: {
                                font: {
                                    family: fontFamily
                                },
                                callback: (value) => {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    family: fontFamily
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    resetForm() {
        // Clear all inputs
        if (this.elements.totalDebt) this.elements.totalDebt.value = '';
        if (this.elements.debtInterestRate) this.elements.debtInterestRate.value = '';
        if (this.elements.investmentRate) this.elements.investmentRate.value = '';
        if (this.elements.monthlyPayment) this.elements.monthlyPayment.value = '';
        
        // Reset sliders
        const totalDebtSlider = document.getElementById('doi-total-debt-slider');
        const monthlyPaymentSlider = document.getElementById('doi-monthly-payment-slider');
        if (totalDebtSlider) totalDebtSlider.value = 0;
        if (monthlyPaymentSlider) monthlyPaymentSlider.value = 0;
        
        // Hide results section
        if (this.resultsSection) {
            this.resultsSection.style.display = 'none';
        }
        
        // Hide recommendation text
        if (this.recommendationText) {
            this.recommendationText.style.display = 'none';
        }
        
        // Show placeholder content and hide chart
        if (this.placeholderContent) {
            this.placeholderContent.style.display = 'block';
        }
        if (this.chartContainer) {
            this.chartContainer.style.display = 'none';
        }
        if (this.chartHeading) {
            // Hide the heading with inline style
            this.chartHeading.style.display = 'none';
        }
        
        // Reset chart
        if (this.chart) {
            this.chart.data.datasets[0].data = [0, 0];
            this.chart.update();
        }
        
        // Reset button text
        if (this.calculateBtn) {
            this.calculateBtn.textContent = 'Calculate';
            this.calculateBtn.disabled = true;
        }
        
        this.checkFormValidity();
    }

    downloadResults() {
        console.log('Download button clicked');
        
        // Show notification before download
        const userConfirmed = confirm('Your debt vs invest analysis will be downloaded as a PDF file. This may take a moment to generate. Continue?');
        if (!userConfirmed) {
            console.log('Download cancelled by user');
            return;
        }
        
        try {
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                console.error('jsPDF library not loaded');
                this.downloadResultsAsText();
                return;
            }
            
            const { jsPDF } = window.jspdf;
        
        const doc = new jsPDF();
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        // Standardized PDF spacing constants
        const PDF_SPACING = {
            SECTION_GAP: 20,           // Space between major sections
            HEADER_TO_CONTENT: 8,      // Space from section header to its content
            CONTENT_LINE_HEIGHT: 8,    // Line height for content
            SUMMARY_LINE_HEIGHT: 1.5,  // Line height factor for summary text
            CHART_HEIGHT: 100,         // Fixed chart height
            CHART_TO_DISCLAIMER: 10    // Space between chart and disclaimer
        };
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Should I Pay Off Debt or Invest?', 20, yPosition);
        yPosition += PDF_SPACING.SECTION_GAP;
        
        // Input Values (Left Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Input Values', 20, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const inputY = yPosition;
        doc.text(`Total Debt: ${this.formatCurrency(formData.totalDebt)}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Debt Interest Rate: ${(formData.debtInterestRate * 100).toFixed(1)}%`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Investment Rate: ${(formData.investmentRate * 100).toFixed(1)}%`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Monthly Payment: ${this.formatCurrency(formData.monthlyPayment)}`, 20, yPosition);
        
        // Analysis Results (Right Column)
        yPosition = inputY - PDF_SPACING.HEADER_TO_CONTENT;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Analysis Results', 110, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const resultsY = yPosition;
        doc.text(`Recommendation: ${results.recommendation}`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Time to Pay Off: ${results.timeToPayoff} months`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Interest Saved (Debt): ${this.formatCurrency(results.interestSaved)}`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Investment Value: ${this.formatCurrency(results.investmentValue)}`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Investment Interest: ${this.formatCurrency(results.investmentInterest)}`, 110, yPosition);
        
        // Move to next section
        yPosition = Math.max(yPosition, resultsY + (PDF_SPACING.CONTENT_LINE_HEIGHT * 4)) + PDF_SPACING.SECTION_GAP;
        
        // Recommendation Text
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Recommendation', 20, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const splitText = doc.splitTextToSize(results.recommendationText, 170);
        doc.text(splitText, 20, yPosition, { lineHeightFactor: PDF_SPACING.SUMMARY_LINE_HEIGHT });
        yPosition += (splitText.length * 11 * PDF_SPACING.SUMMARY_LINE_HEIGHT) + PDF_SPACING.SECTION_GAP - 25;
        
        // Chart
        if (this.chartCanvas) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Interest Comparison', 20, yPosition);
            yPosition += PDF_SPACING.HEADER_TO_CONTENT;
            
            const chartImage = this.chartCanvas.toDataURL('image/png');
            doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 0);
            yPosition += PDF_SPACING.CHART_HEIGHT + PDF_SPACING.CHART_TO_DISCLAIMER;
        }
        
        // Disclaimer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const disclaimer = 'This analysis is based on the assumptions provided and should be reviewed regularly as circumstances change. Consult with a financial professional for personalized advice.';
        const disclaimerText = doc.splitTextToSize(disclaimer, 170);
        doc.text(disclaimerText, 20, yPosition);
        
        // Save PDF
        doc.save('debt-vs-invest-analysis.pdf');
        console.log('PDF download completed successfully');
        
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to text download if PDF fails
            this.downloadResultsAsText();
        }
    }
    
    downloadResultsAsText() {
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        let text = 'Should I Pay Off Debt or Invest?\n\n';
        text += 'Input Values:\n';
        text += `Total Debt: ${this.formatCurrency(formData.totalDebt)}\n`;
        text += `Debt Interest Rate: ${(formData.debtInterestRate * 100).toFixed(1)}%\n`;
        text += `Investment Rate: ${(formData.investmentRate * 100).toFixed(1)}%\n`;
        text += `Monthly Payment: ${this.formatCurrency(formData.monthlyPayment)}\n\n`;
        text += 'Analysis Results:\n';
        text += `Recommendation: ${results.recommendation}\n`;
        text += `Time to Pay Off: ${results.timeToPayoff} months\n`;
        text += `Interest Saved (Debt): ${this.formatCurrency(results.interestSaved)}\n`;
        text += `Investment Value: ${this.formatCurrency(results.investmentValue)}\n`;
        text += `Investment Interest: ${this.formatCurrency(results.investmentInterest)}\n\n`;
        text += 'Recommendation:\n';
        text += `${results.recommendationText}\n\n`;
        text += 'This analysis is based on the assumptions provided and should be reviewed regularly as circumstances change. Consult with a financial professional for personalized advice.';
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'debt-vs-invest-analysis.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Text download completed successfully');
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
}

// Initialize calculator when script loads
new DebtOrInvestCalculator();

