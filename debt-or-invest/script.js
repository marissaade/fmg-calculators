/**
 * Should I Pay Off Debt or Invest Calculator
 * Helps users determine whether paying off debt or investing is more beneficial
 * Based on FMG Calculator Design Pattern
 */

class DebtOrInvestCalculator {
    constructor() {
        this.elements = {};
        this.chart = null;
        this.calculationTimeout = null;
        
        // Default values
        this.defaultValues = {
            'doi-total-debt': '10000',
            'doi-debt-interest-rate': '30',
            'doi-investment-rate': '2',
            'doi-monthly-payment': '400'
        };
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.cacheElements();
        this.diagnoseStickyPositioning();
        this.initializeInputFormatting();
        this.initializeSliders();
        this.initializeSteppers();
        this.initializeTooltips();
        this.attachEventListeners();
        this.calculateOnLoad();
    }

    cacheElements() {
        // Input elements
        this.elements.totalDebt = document.getElementById('doi-total-debt');
        this.elements.debtInterestRate = document.getElementById('doi-debt-interest-rate');
        this.elements.investmentRate = document.getElementById('doi-investment-rate');
        this.elements.monthlyPayment = document.getElementById('doi-monthly-payment');
        
        // Button elements
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
        this.chartSection = document.querySelector('.doi-chart-section');
        this.chartToggle = document.getElementById('doi-chart-toggle');
        this.chartHeader = document.querySelector('.doi-chart-header');
    }

    diagnoseStickyPositioning() {
        const formColumn = document.querySelector('.doi-form-column');
        const resultsColumn = document.querySelector('.doi-results-column');
        
        if (!formColumn || !resultsColumn) return;
        
        // Clear min-height on mobile
        if (window.innerWidth <= 750) {
            resultsColumn.style.minHeight = '';
            return;
        }
        
        // Fix overflow issues on parent containers
        let current = formColumn;
        let depth = 0;
        const maxDepth = 20;
        
        while (current && depth < maxDepth) {
            current = current.parentElement;
            if (!current || current === document.documentElement) break;
            
            const parentStyle = window.getComputedStyle(current);
            const overflow = parentStyle.overflow;
            const overflowX = parentStyle.overflowX;
            const overflowY = parentStyle.overflowY;
            
            // Fix any overflow constraints
            if (overflow !== 'visible' || overflowX !== 'visible' || overflowY !== 'visible') {
                current.style.setProperty('overflow', 'visible', 'important');
                current.style.setProperty('overflow-x', 'visible', 'important');
                current.style.setProperty('overflow-y', 'visible', 'important');
            }
            
            depth++;
        }
        
        // Ensure results column is tall enough for sticky to work (desktop only)
        const formHeight = formColumn.getBoundingClientRect().height;
        const resultsHeight = resultsColumn.getBoundingClientRect().height;
        
        if (formHeight >= resultsHeight) {
            const viewportHeight = window.innerHeight;
            resultsColumn.style.minHeight = (formHeight + viewportHeight * 0.5) + 'px';
        }
    }

    initializeInputFormatting() {
        // Format currency inputs with commas and filter to digits only
        const currencyInputs = ['doi-total-debt', 'doi-monthly-payment'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Real-time numeric filtering
                input.addEventListener('input', (e) => {
                    // Filter to only allow digits (strip all non-numeric characters)
                    const cursorPosition = e.target.selectionStart;
                    const oldValue = e.target.value;
                    const newValue = oldValue.replace(/[^\d]/g, '');
                    
                    if (oldValue !== newValue) {
                        e.target.value = newValue;
                        // Adjust cursor position based on removed characters
                        const removedChars = oldValue.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
                        const newCursorPos = Math.min(removedChars, newValue.length);
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    // Update slider BEFORE formatting (using raw numeric value)
                    if (input.id === 'doi-total-debt') {
                        const slider = document.getElementById('doi-total-debt-slider');
                        if (slider && newValue) {
                            const numValue = parseInt(newValue);
                            if (!isNaN(numValue)) {
                                slider.value = numValue;
                            }
                        }
                    }
                    
                    // Then format with commas
                    this.formatCurrencyInput(e);
                });
                input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
                input.addEventListener('focus', (e) => this.handleCurrencyFocus(e));
            }
        });
        
        // Filter percentage inputs to only allow digits and one decimal point
        const percentageInputs = ['doi-debt-interest-rate', 'doi-investment-rate'];
        percentageInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    // Filter to only allow digits and one decimal point
                    const cursorPosition = e.target.selectionStart;
                    const oldValue = e.target.value;
                    let newValue = oldValue.replace(/[^\d.]/g, '');
                    
                    // Ensure only one decimal point
                    const parts = newValue.split('.');
                    if (parts.length > 2) {
                        newValue = parts[0] + '.' + parts.slice(1).join('');
                    }
                    
                    if (oldValue !== newValue) {
                        e.target.value = newValue;
                        // Adjust cursor position
                        const removedChars = oldValue.substring(0, cursorPosition).length - oldValue.substring(0, cursorPosition).replace(/[^\d.]/g, '').length;
                        const newCursorPos = Math.max(0, cursorPosition - removedChars);
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                    }
                });
            }
        });
    }

    initializeSliders() {
        // Sync slider with Total Debt Amount text input
        const slider = document.getElementById('doi-total-debt-slider');
        const input = document.getElementById('doi-total-debt');
        
        if (slider && input) {
            // Update input when slider changes
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                input.value = this.formatNumber(value);
                this.clearError(input);
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
        }
    }

    initializeSteppers() {
        const stepperBtns = document.querySelectorAll('[data-stepper-action]');
        const currencyInputs = ['doi-total-debt', 'doi-monthly-payment'];
        const percentageInputs = ['doi-debt-interest-rate', 'doi-investment-rate'];

        stepperBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const stepper = btn.closest('[data-stepper]');
                if (!stepper) return;

                const inputId = stepper.getAttribute('data-stepper');
                const input = document.getElementById(inputId);
                if (!input) return;

                const action = btn.getAttribute('data-stepper-action');
                // Use parseFloat for percentages (preserves decimals), parseCurrencyValue for currency
                const currentValue = percentageInputs.includes(inputId) 
                    ? parseFloat(input.value) || 0
                    : this.parseCurrencyValue(input.value);
                const step = parseFloat(input.getAttribute('data-step')) || 1;
                const min = parseFloat(input.getAttribute('data-min')) || 0;
                const max = parseFloat(input.getAttribute('data-max')) || 1000000;

                let newValue;
                if (action === 'increment') {
                    newValue = Math.min(currentValue + step, max);
                } else {
                    newValue = Math.max(currentValue - step, min);
                }

                // Format based on input type
                if (currencyInputs.includes(inputId)) {
                    input.value = this.formatNumber(Math.round(newValue));
                    // Sync slider if applicable
                    if (inputId === 'doi-total-debt') {
                        const slider = document.getElementById('doi-total-debt-slider');
                        if (slider) slider.value = newValue;
                    }
                } else if (percentageInputs.includes(inputId)) {
                    newValue = Math.round(newValue * 10) / 10;
                    input.value = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
                } else {
                    input.value = newValue.toString();
                }

                // Trigger calculation with small debounce to reduce chart shakiness
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 100);
            });
        });
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Math.round(value));
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
                input.value = this.formatNumber(parseInt(value));
            } else if (value === '0') {
                input.value = '0';
            }
        } else {
            input.value = '';
        }
        
        // Trigger calculation after formatting
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => {
            this.calculateAndDisplay();
        }, 300);
    }

    handleCurrencyFocus(event) {
        // Remove formatting on focus for easier editing
        const input = event.target;
        const rawValue = input.value.replace(/[^\d]/g, '');
        input.value = rawValue;
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d]/g, '')) || 0;
    }

    clearError(input) {
        const inputGroup = input.closest('.doi-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorMsg = inputGroup.querySelector('.doi-error-message');
            if (errorMsg) {
                errorMsg.remove();
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

    calculateOnLoad() {
        // Format initial currency values with commas
        const currencyInputs = ['doi-total-debt', 'doi-monthly-payment'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value) {
                const value = this.parseCurrencyValue(input.value);
                if (value > 0) {
                    input.value = this.formatNumber(value);
                }
            }
        });
        
        // Set slider value for Total Debt Amount
        const totalDebtSlider = document.getElementById('doi-total-debt-slider');
        const totalDebtInput = document.getElementById('doi-total-debt');
        if (totalDebtSlider && totalDebtInput) {
            const value = this.parseCurrencyValue(totalDebtInput.value);
            totalDebtSlider.value = value;
        }
        
        // Calculate and display results on page load
        this.calculateAndDisplay();
    }

    calculateAndDisplay() {
        if (!this.hasValidInputs()) {
            return;
        }
        
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        this.displayResults(results);
        this.updateChart(results);
    }

    hasValidInputs() {
        const inputs = [
            this.elements.totalDebt,
            this.elements.debtInterestRate,
            this.elements.investmentRate,
            this.elements.monthlyPayment
        ];
        
        return inputs.every(input => {
            if (!input) return false;
            // Use parseCurrencyValue for currency inputs, parseFloat for others
            const value = (input.id === 'doi-total-debt' || input.id === 'doi-monthly-payment') 
                ? this.parseCurrencyValue(input.value)
                : parseFloat(input.value);
            return !isNaN(value) && value > 0;
        });
    }

    attachEventListeners() {
        // Reset button (desktop)
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (desktop)
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Reset button (mobile)
        const resetBtnMobile = document.getElementById('doi-reset-btn-mobile');
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (mobile)
        const downloadBtnMobile = document.getElementById('doi-downloadBtn-mobile');
        if (downloadBtnMobile) {
            downloadBtnMobile.addEventListener('click', () => this.downloadResults());
        }
        
        // Chart toggle button
        if (this.chartToggle) {
            this.chartToggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click from also firing
                this.toggleChart();
            });
        }
        
        // Make chart header clickable
        if (this.chartHeader) {
            this.chartHeader.addEventListener('click', () => this.toggleChart());
        }
        
        // Real-time calculation on all inputs (exclude range sliders)
        const inputs = document.querySelectorAll('input:not([type="range"])');
        inputs.forEach(input => {
            // Skip currency inputs (handled by formatCurrencyInput)
            if (input.id === 'doi-total-debt' || input.id === 'doi-monthly-payment') {
                return; // Currency inputs handled separately
            }
            
            input.addEventListener('input', () => {
                this.validateAndCapInput(input);
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
            
            input.addEventListener('blur', () => {
                this.validateAndCapInput(input);
                this.calculateAndDisplay();
            });
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
            });
        });
        
        // Handle window resize to recalculate sticky positioning
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.diagnoseStickyPositioning();
            }, 250);
        });
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
                input.value = this.formatNumber(maxValue);
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
    }

    getFormData() {
        return {
            totalDebt: this.parseCurrencyValue(this.elements.totalDebt.value),
            debtInterestRate: parseFloat(this.elements.debtInterestRate.value) / 100, // Annual rate
            investmentRate: parseFloat(this.elements.investmentRate.value) / 100, // Monthly rate (input is per month, not per year)
            monthlyPayment: this.parseCurrencyValue(this.elements.monthlyPayment.value)
        };
    }

    calculateResults(data) {
        // Calculate debt payoff scenario
        const monthlyDebtRate = data.debtInterestRate / 12;
        const monthlyInvestmentRate = data.investmentRate; // Input is monthly rate, not annual
        
        // Calculate time to pay off debt and total interest
        let remainingDebt = data.totalDebt;
        let totalInterestPaid = 0;
        let months = 0;
        const maxMonths = 600; // 50 years maximum
        
        while (remainingDebt > 0.01 && months < maxMonths) {
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
        
        // Calculate precise fractional month for final payment
        let preciseMonths = months;
        if (remainingDebt > 0 && remainingDebt < data.monthlyPayment) {
            // Calculate the fraction of the final month needed
            const finalInterest = remainingDebt * monthlyDebtRate;
            const finalPayment = remainingDebt + finalInterest;
            const fractionOfMonth = finalPayment / data.monthlyPayment;
            preciseMonths = months - 1 + fractionOfMonth;
            totalInterestPaid += finalInterest;
        }
        
        // Calculate investment scenario over the same time period using precise months
        // Using future value of ordinary annuity formula for precise calculation
        const n = preciseMonths;
        const r = monthlyInvestmentRate;
        const pmt = data.monthlyPayment;
        
        // FV = PMT × [((1 + r)^n - 1) / r]
        let investmentValue;
        if (r === 0) {
            investmentValue = pmt * n;
        } else {
            investmentValue = pmt * (((Math.pow(1 + r, n) - 1) / r));
        }
        
        const totalInvested = data.monthlyPayment * preciseMonths;
        const investmentInterest = investmentValue - totalInvested;
        
        // Calculate net benefit: investment gains minus debt interest paid
        const netBenefit = investmentInterest - totalInterestPaid;
        
        // Determine recommendation based on which option is financially better
        let recommendation = 'Pay Off Debt';
        let recommendationText = '';
        
        if (netBenefit > 0) {
            // Investing yields more than the cost of debt interest
            recommendation = 'Invest';
            recommendationText = 'If your answer suggests investing, you might want to play with your expected interest rates and monthly investments to see what kind of outcomes you get. Often, people have the goal of paying off debt in a steady, timely fashion, but life gets in the way. Experiment to see what could change your mind.';
        } else {
            // Paying off debt saves more than investing would earn
            recommendation = 'Pay Off Debt';
            recommendationText = 'If your answer suggests debt, you might want to consider adjusting some of your inputs to see if that changes your thinking. Often, when people feel burdened by debt, they delay other financial decisions until they are more comfortable. However, without a strategy, you might struggle thinking there is no way out.';
        }
        
        return {
            recommendation,
            recommendationText,
            timeToPayoff: Math.round(preciseMonths), // Display as whole number
            preciseMonths: preciseMonths, // Keep precise value for reference
            debtInterestPaid: Math.max(0, totalInterestPaid), // Total interest paid on debt
            investmentValue,
            investmentInterest: Math.max(0, investmentInterest) // Investment gains
        };
    }

    displayResults(results) {
        // Update result values
        this.elements.recommendation.textContent = results.recommendation;
        this.elements.timeToPayoff.textContent = `${results.timeToPayoff} months`;
        this.elements.interestSaved.textContent = this.formatCurrency(results.debtInterestPaid);
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
            results.debtInterestPaid,
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
                    labels: ['Debt Interest Cost', 'Investment Gains'],
                    datasets: [{
                        label: 'Amount',
                        data: [
                            results.debtInterestPaid,
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
        // Reset all inputs to default values
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const defaultValue = this.defaultValues[id];
                if (id === 'doi-total-debt' || id === 'doi-monthly-payment') {
                    // Format currency values with commas
                    input.value = this.formatNumber(parseInt(defaultValue));
                } else {
                    input.value = defaultValue;
                }
            }
        });
        
        // Reset slider to default value
        const totalDebtSlider = document.getElementById('doi-total-debt-slider');
        if (totalDebtSlider) {
            totalDebtSlider.value = this.defaultValues['doi-total-debt'];
        }
        
        // Recalculate and display results
        this.calculateAndDisplay();
        
        // Move focus to first input field
        const firstInput = document.getElementById('doi-total-debt');
        if (firstInput) {
            firstInput.focus();
            // On mobile, scroll to first field
            if (window.innerWidth <= 750) {
                firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    toggleChart() {
        if (!this.chartSection || !this.chartToggle) return;
        
        const isCollapsed = this.chartSection.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            this.chartSection.classList.remove('collapsed');
            this.chartToggle.setAttribute('aria-expanded', 'true');
        } else {
            // Collapse
            this.chartSection.classList.add('collapsed');
            this.chartToggle.setAttribute('aria-expanded', 'false');
        }
    }

    downloadResults() {
        // Show notification before download
        const userConfirmed = confirm('Your debt vs invest analysis will be downloaded as a PDF file. This may take a moment to generate. Continue?');
        if (!userConfirmed) {
            return;
        }
        
        try {
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                this.downloadResultsAsText();
                return;
            }
            
            const { jsPDF } = window.jspdf;
        
        const doc = new jsPDF();
        
        // Add PDF metadata
        doc.setProperties({
            title: 'Debt vs Invest Analysis',
            subject: 'Financial Calculator Results',
            author: 'FMG Financial Calculators',
            keywords: 'debt, investment, financial calculator, debt payoff, investment strategy',
            creator: 'FMG Financial Calculators'
        });
        
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
        doc.text(`Debt Interest Cost: ${this.formatCurrency(results.debtInterestPaid)}`, 110, yPosition);
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
        
        } catch (error) {
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
        text += `Debt Interest Cost: ${this.formatCurrency(results.debtInterestPaid)}\n`;
        text += `Investment Value: ${this.formatCurrency(results.investmentValue)}\n`;
        text += `Investment Gains: ${this.formatCurrency(results.investmentInterest)}\n\n`;
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
