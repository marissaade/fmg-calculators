/**
 * Contributing to an IRA Calculator
 * Helps users determine IRA contribution eligibility and project future value
 * Based on FMG Calculator Design Pattern
 */

class IRACalculator {
    constructor() {
        this.elements = {};
        this.chart = null;
        this.calculationTimeout = null;
        
        // 2024 IRA contribution limits and phase-out ranges
        this.CONTRIBUTION_LIMIT_2024 = 6500;
        this.CONTRIBUTION_LIMIT_50_PLUS = 7500; // With catch-up
        
        // MAGI phase-out ranges for 2024 (Traditional IRA deduction limits when covered by workplace plan)
        this.PHASE_OUT_RANGES = {
            single: { min: 77000, max: 87000 },
            'married-joint': { min: 123000, max: 143000 },
            'married-separate': { min: 0, max: 10000 },
            'head-of-household': { min: 77000, max: 87000 }
        };
        
        // Store default values for reset
        this.defaultValues = {
            'ira-magi': '100000',
            'ira-filing-status': 'single',
            'ira-retirement-plan': 'yes',
            'ira-initial-balance': '50000',
            'ira-annual-contribution': '6500',
            'ira-rate-of-return': '7',
            'ira-years-to-contribute': '30'
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
        this.initializeInputFormatting();
        this.initializeSliders();
        this.attachEventListeners();
        // Calculate and display results on page load
        this.calculateOnLoad();
    }

    cacheElements() {
        // Input elements
        this.elements.magi = document.getElementById('ira-magi');
        this.elements.filingStatus = document.getElementById('ira-filing-status');
        this.elements.retirementPlan = document.getElementById('ira-retirement-plan');
        this.elements.initialBalance = document.getElementById('ira-initial-balance');
        this.elements.annualContribution = document.getElementById('ira-annual-contribution');
        this.elements.rateOfReturn = document.getElementById('ira-rate-of-return');
        this.elements.yearsToContribute = document.getElementById('ira-years-to-contribute');
        
        // Button elements
        this.resetBtn = document.getElementById('ira-reset-btn');
        this.downloadBtn = document.getElementById('ira-downloadBtn');
        
        // Results elements
        this.elements.resultsSection = document.getElementById('ira-results-section');
        this.elements.eligibilityCard = document.getElementById('ira-eligibility-card');
        this.elements.eligibilityStatus = document.getElementById('ira-eligibility-status');
        this.elements.deductibleInfo = document.getElementById('ira-deductible-info');
        this.elements.futureValue = document.getElementById('ira-future-value');
        this.elements.totalContributions = document.getElementById('ira-total-contributions');
        this.elements.totalEarnings = document.getElementById('ira-total-earnings');
        
        // Chart elements
        this.chartCanvas = document.getElementById('ira-growth-chart');
    }

    initializeInputFormatting() {
        // Format currency inputs with commas
        const currencyInputs = ['ira-magi', 'ira-initial-balance', 'ira-annual-contribution'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Change to text type to allow commas
                input.type = 'text';
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
            // Add commas for display
            const formattedValue = parseInt(value).toLocaleString();
            input.value = formattedValue;
        }
    }

    handleCurrencyFocus(event) {
        const input = event.target;
        // Remove commas when focusing for easier editing
        input.value = input.value.replace(/,/g, '');
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    }

    initializeSliders() {
        // Sync sliders with text inputs
        const sliderPairs = [
            { slider: 'ira-rate-of-return-slider', input: 'ira-rate-of-return' },
            { slider: 'ira-years-to-contribute-slider', input: 'ira-years-to-contribute' }
        ];
        
        sliderPairs.forEach(pair => {
            const slider = document.getElementById(pair.slider);
            const input = document.getElementById(pair.input);
            
            if (slider && input) {
                // Update input when slider changes
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (pair.input === 'ira-rate-of-return') {
                        input.value = value.toFixed(1);
                    } else {
                        input.value = Math.round(value);
                    }
                    this.clearError(input);
                    clearTimeout(this.calculationTimeout);
                    this.calculationTimeout = setTimeout(() => {
                        this.calculateAndDisplay();
                    }, 300);
                });
                
                // Update slider when input changes
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        slider.value = value;
                    }
                });
            }
        });
    }
    
    calculateOnLoad() {
        // Format initial currency values with commas
        const currencyInputs = ['ira-magi', 'ira-initial-balance', 'ira-annual-contribution'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value) {
                const numericValue = parseFloat(input.value.replace(/[^\d]/g, '')) || 0;
                if (numericValue > 0) {
                    input.value = numericValue.toLocaleString();
                }
            }
        });
        
        // Trigger initial calculation
        this.calculateAndDisplay();
    }
    
    calculateAndDisplay() {
        // Check if all fields have valid values
        if (this.hasValidInputs()) {
            const formData = this.getFormData();
            const results = this.calculateResults(formData);
            this.displayResults(results, formData);
        }
    }
    
    hasValidInputs() {
        const magi = this.parseCurrencyValue(document.getElementById('ira-magi').value);
        const initialBalance = this.parseCurrencyValue(document.getElementById('ira-initial-balance').value);
        const annualContribution = this.parseCurrencyValue(document.getElementById('ira-annual-contribution').value);
        const rateOfReturn = parseFloat(document.getElementById('ira-rate-of-return').value);
        const yearsToContribute = parseFloat(document.getElementById('ira-years-to-contribute').value);
        
        return magi >= 0 && 
               initialBalance >= 0 && 
               annualContribution >= 0 && 
               !isNaN(rateOfReturn) && rateOfReturn >= 0 && 
               !isNaN(yearsToContribute) && yearsToContribute >= 1;
    }

    attachEventListeners() {
        // Reset button
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Download button
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Add real-time calculation listeners to all inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            // Real-time calculation on input change
            input.addEventListener('input', () => {
                this.clearError(input);
                this.validateAndCapInput(input);
                // Debounce calculation to avoid too many calculations
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
            
            // Also calculate on blur for immediate feedback
            input.addEventListener('blur', () => {
                this.validateAndCapInput(input);
                this.calculateAndDisplay();
            });
        });
        
        // Dropdown changes - trigger calculation
        const filingStatus = document.getElementById('ira-filing-status');
        if (filingStatus) {
            filingStatus.addEventListener('change', () => this.calculateAndDisplay());
        }
        const retirementPlan = document.getElementById('ira-retirement-plan');
        if (retirementPlan) {
            retirementPlan.addEventListener('change', () => this.calculateAndDisplay());
        }
    }

    validateAndCapInput(input) {
        const value = input.value.trim();
        let numericValue;
        let maxValue;
        let minValue = 0;
        let isPercentage = false;
        
        // Determine input type based on ID
        if (input.id === 'ira-magi' || input.id === 'ira-initial-balance' || input.id === 'ira-annual-contribution') {
            numericValue = this.parseCurrencyValue(value);
            maxValue = 1000000000; // $1 billion
        } else if (input.id === 'ira-rate-of-return') {
            numericValue = parseFloat(value);
            maxValue = 20; // 20%
            minValue = 0;
            isPercentage = true;
        } else if (input.id === 'ira-years-to-contribute') {
            numericValue = parseInt(value);
            maxValue = 50; // 50 years
            minValue = 1;
        } else {
            numericValue = parseFloat(value);
        }
        
        if (value && !isNaN(numericValue)) {
            if (numericValue > maxValue) {
                if (input.id === 'ira-rate-of-return') {
                    input.value = maxValue.toFixed(1);
                } else if (input.id === 'ira-years-to-contribute') {
                    input.value = maxValue;
                } else {
                    input.value = maxValue.toLocaleString();
                }
                const formattedValue = isPercentage ? `${maxValue}%` : this.formatCurrency(maxValue);
                this.showError(input, `Value cannot exceed ${formattedValue}`);
            } else if (numericValue < minValue) {
            input.value = '';
                this.showError(input, 'Value cannot be negative');
            }
        }
    }
    
    showError(input, message) {
        // Remove existing error
        this.clearError(input);
        
        // Add error class
        const inputGroup = input.closest('.ira-input-group');
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'ira-error-message show';
        errorMsg.textContent = message;
        
        // Insert error message after input
        if (inputGroup) {
            inputGroup.appendChild(errorMsg);
        }
    }
    
    clearError(input) {
        const inputGroup = input.closest('.ira-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorMsg = inputGroup.querySelector('.ira-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }

    initializeChart() {
        if (!this.chartCanvas) return;
        
        const ctx = this.chartCanvas.getContext('2d');
        
        // Get CSS variables from :root for dynamic colors
        // TODO: Investigate why --paletteColor1 CSS variable is returning black instead of the expected color
        // For now, hardcoding to green as a temporary fix
        const iraColor = '#10b981'; // Green - hardcoded until CSS variable issue is resolved
        
        const rootStyles = getComputedStyle(document.documentElement);
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'IRA Value',
                    data: [],
                    borderColor: iraColor,
                    backgroundColor: iraColor + '1A', // Add transparency
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 6
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
                                return 'IRA Value: ' + this.formatCurrency(context.parsed.y);
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
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Years',
                            font: {
                                family: fontFamily
                            }
                        },
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

    getFormData() {
        return {
            magi: this.parseCurrencyValue(document.getElementById('ira-magi').value),
            filingStatus: document.getElementById('ira-filing-status').value,
            hasRetirementPlan: document.getElementById('ira-retirement-plan').value === 'yes',
            initialBalance: this.parseCurrencyValue(document.getElementById('ira-initial-balance').value),
            annualContribution: this.parseCurrencyValue(document.getElementById('ira-annual-contribution').value),
            rateOfReturn: parseFloat(document.getElementById('ira-rate-of-return').value) / 100,
            yearsToContribute: parseInt(document.getElementById('ira-years-to-contribute').value)
        };
    }
    
    calculateResults(formData) {
        const eligibility = this.calculateEligibility(formData);
        const results = this.calculateProjection(formData, eligibility);
        return { eligibility, results };
    }

    calculateEligibility(data) {
        // Check contribution limit
        const contributionLimit = this.CONTRIBUTION_LIMIT_2024;
        
        // If no workplace retirement plan, can contribute up to limit and fully deduct
        if (!data.hasRetirementPlan) {
            return {
                eligible: true,
                maxContribution: contributionLimit,
                maxDeductible: Math.min(data.annualContribution, contributionLimit),
                phaseOutApplies: false
            };
        }
        
        // If has workplace plan, check phase-out ranges
        const phaseOut = this.PHASE_OUT_RANGES[data.filingStatus];
        
        if (data.magi < phaseOut.min) {
            // Below phase-out range - full deduction
            return {
                eligible: true,
                maxContribution: contributionLimit,
                maxDeductible: Math.min(data.annualContribution, contributionLimit),
                phaseOutApplies: false
            };
        } else if (data.magi >= phaseOut.max) {
            // Above phase-out range - no deduction (but can still contribute)
            return {
                eligible: true,
                maxContribution: contributionLimit,
                maxDeductible: 0,
                phaseOutApplies: true,
                message: 'You can contribute, but deductions are not available at your income level.'
            };
        } else {
            // Within phase-out range - partial deduction
            const phaseOutPercentage = (data.magi - phaseOut.min) / (phaseOut.max - phaseOut.min);
            const deductibleAmount = contributionLimit * (1 - phaseOutPercentage);
            
            return {
                eligible: true,
                maxContribution: contributionLimit,
                maxDeductible: Math.min(deductibleAmount, data.annualContribution),
                phaseOutApplies: true,
                message: 'Partial deduction available based on your income level.'
            };
        }
    }

    calculateProjection(data, eligibility) {
        let balance = data.initialBalance;
        const yearlyData = [{ year: 0, value: balance }];
        let totalContributions = 0;
        
        for (let year = 1; year <= data.yearsToContribute; year++) {
            // Add contribution at beginning of year
            const contribution = Math.min(data.annualContribution, eligibility.maxContribution);
            balance += contribution;
            totalContributions += contribution;
            
            // Apply annual return
            balance *= (1 + data.rateOfReturn);
            
            yearlyData.push({ year, value: balance });
        }
        
        const totalEarnings = balance - data.initialBalance - totalContributions;
        
        return {
            futureValue: balance,
            totalContributions,
            totalEarnings,
            yearlyData
        };
    }

    displayResults(calcResults, formData) {
        const { eligibility, results } = calcResults;
        
        // Update eligibility card
        const statusIcon = this.elements.eligibilityStatus.querySelector('.ira-status-icon');
        const statusText = this.elements.eligibilityStatus.querySelector('.ira-status-text');
        
        if (eligibility.eligible) {
            statusIcon.textContent = '✓';
            statusText.textContent = 'Eligible to Contribute';
            this.elements.eligibilityCard.classList.remove('ineligible');
        } else {
            statusIcon.textContent = '✗';
            statusText.textContent = 'Not Eligible to Contribute';
            this.elements.eligibilityCard.classList.add('ineligible');
        }
        
        // Update deductible info
        this.elements.deductibleInfo.innerHTML = `Max Deductible Contribution: <strong>${this.formatCurrency(eligibility.maxDeductible)}</strong>`;
        if (eligibility.message) {
            this.elements.deductibleInfo.innerHTML += `<br><small style="color: #666; font-style: italic;">${eligibility.message}</small>`;
        }
        
        // Update result values
        this.elements.futureValue.textContent = this.formatCurrency(results.futureValue);
        this.elements.totalContributions.textContent = this.formatCurrency(results.totalContributions);
        this.elements.totalEarnings.textContent = this.formatCurrency(results.totalEarnings);
        
        // Generate and display chart
        this.updateChart(results);
        
        // Show results section
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }
    }

    updateChart(results) {
        // Initialize chart if it doesn't exist
        if (!this.chart) {
            this.initializeChart();
        }
        
        if (!this.chart) return;
        
        // Get CSS variables from :root for dynamic colors
        // TODO: Investigate why --paletteColor1 CSS variable is returning black instead of the expected color
        // For now, hardcoding to green as a temporary fix
        const iraColor = '#10b981'; // Green - hardcoded until CSS variable issue is resolved
        
        this.chart.data.labels = results.yearlyData.map(d => d.year);
        this.chart.data.datasets[0].data = results.yearlyData.map(d => d.value);
        
        // Update colors to use dynamic values
        this.chart.data.datasets[0].borderColor = iraColor;
        this.chart.data.datasets[0].backgroundColor = iraColor + '1A'; // Add transparency
        
        this.chart.update();
    }

    resetForm() {
        // Reset all input fields to default values
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                if (input.tagName === 'SELECT') {
                    input.value = this.defaultValues[id];
                } else {
                    input.value = this.defaultValues[id];
                    
                    // Format currency inputs with commas
                    if (id === 'ira-magi' || id === 'ira-initial-balance' || id === 'ira-annual-contribution') {
                        const numericValue = parseFloat(input.value.replace(/[^\d]/g, '')) || 0;
                        if (numericValue > 0) {
                            input.value = numericValue.toLocaleString();
                        }
                    }
                    
                    // Clear any error states
                    this.clearError(input);
                }
            }
        });
        
        // Also reset sliders to match input values
        const rateSlider = document.getElementById('ira-rate-of-return-slider');
        const yearsSlider = document.getElementById('ira-years-to-contribute-slider');
        if (rateSlider) rateSlider.value = this.defaultValues['ira-rate-of-return'];
        if (yearsSlider) yearsSlider.value = this.defaultValues['ira-years-to-contribute'];
        
        // Recalculate and display results with default values
        this.calculateAndDisplay();
    }

    downloadResults() {
        const { jsPDF } = window.jspdf;
        
        if (!confirm('Download your IRA contribution analysis?')) {
            return;
        }
        
        const doc = new jsPDF();
        const formData = this.getFormData();
        const eligibility = this.calculateEligibility(formData);
        const results = this.calculateProjection(formData, eligibility);
        
        // Standardized PDF spacing constants
        const PDF_SPACING = {
            SECTION_GAP: 20,
            HEADER_TO_CONTENT: 8,
            CONTENT_LINE_HEIGHT: 8,
            CHART_HEIGHT: 100,
            CHART_TO_DISCLAIMER: 10
        };
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Contributing to an IRA Analysis', 20, yPosition);
        yPosition += PDF_SPACING.SECTION_GAP;
        
        // Eligibility Status
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Eligibility Status', 20, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Status: ${eligibility.eligible ? 'Eligible' : 'Not Eligible'}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Max Deductible: ${this.formatCurrency(eligibility.maxDeductible)}`, 20, yPosition);
        yPosition += PDF_SPACING.SECTION_GAP;
        
        // Input Values (Left Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Input Values', 20, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const inputY = yPosition;
        doc.text(`MAGI: ${this.formatCurrency(formData.magi)}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Filing Status: ${formData.filingStatus}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Initial Balance: ${this.formatCurrency(formData.initialBalance)}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Annual Contribution: ${this.formatCurrency(formData.annualContribution)}`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Rate of Return: ${(formData.rateOfReturn * 100).toFixed(1)}%`, 20, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Years: ${formData.yearsToContribute}`, 20, yPosition);
        
        // Projection Results (Right Column)
        yPosition = inputY - PDF_SPACING.HEADER_TO_CONTENT;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Projection Results', 110, yPosition);
        yPosition += PDF_SPACING.HEADER_TO_CONTENT;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Future Value: ${this.formatCurrency(results.futureValue)}`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Total Contributions: ${this.formatCurrency(results.totalContributions)}`, 110, yPosition);
        yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
        doc.text(`Total Earnings: ${this.formatCurrency(results.totalEarnings)}`, 110, yPosition);
        
        yPosition = inputY + (PDF_SPACING.CONTENT_LINE_HEIGHT * 6) + PDF_SPACING.SECTION_GAP - 25;
        
        // Chart
        if (this.chartCanvas) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('IRA Growth Projection', 20, yPosition);
            yPosition += PDF_SPACING.HEADER_TO_CONTENT;
            
            const chartImage = this.chartCanvas.toDataURL('image/png');
            doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 0);
            yPosition += PDF_SPACING.CHART_HEIGHT + PDF_SPACING.CHART_TO_DISCLAIMER;
        }
        
        // Disclaimer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const disclaimer = 'This analysis is based on 2024 IRA contribution limits and current tax law. Consult with a financial professional for personalized advice. Past performance does not guarantee future results.';
        const disclaimerText = doc.splitTextToSize(disclaimer, 170);
        doc.text(disclaimerText, 20, yPosition);
        
        // Save PDF
        doc.save('ira-contribution-analysis.pdf');
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
new IRACalculator();

