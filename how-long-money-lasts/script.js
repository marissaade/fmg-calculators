// How Long Will Your Money Last Calculator JavaScript

class HowLongWillYourMoneyLastCalculator {
    constructor() {
        this.downloadBtn = document.getElementById('hlywml-downloadBtn');
        this.resetBtn = document.getElementById('hlywml-reset-btn');
        this.resultsSection = document.getElementById('hlywml-results-section');
        this.placeholderContent = document.querySelector('.hlywml-placeholder-content');
        this.chartContainer = document.querySelector('.hlywml-chart-container');
        this.chartHeading = document.querySelector('.hlywml-chart-section h2');
        this.chartToggle = document.getElementById('hlywml-chart-toggle');
        this.chartSection = document.querySelector('.hlywml-chart-section');
        this.chartInstance = null;
        this.resizeTimeout = null;
        
        // Store default values for reset
        this.defaultValues = {
            'hlywml-initial-balance': '2000000',
            'hlywml-annual-withdrawal': '65000',
            'hlywml-rate-of-return': '5.0',
            'hlywml-inflation-rate': '2.0'
        };
        
        this.initializeInputFormatting();
        this.initializeSliders();
        this.initializeSteppers();
        this.initializeEventListeners();
        // Calculate and display results on page load (includes chart generation)
        this.calculateOnLoad();
    }
    
    initializeSteppers() {
        const stepperBtns = document.querySelectorAll('[data-stepper-action]');
        const currencyInputs = ['hlywml-initial-balance', 'hlywml-annual-withdrawal'];
        const percentageInputs = ['hlywml-rate-of-return', 'hlywml-inflation-rate'];
        
        stepperBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const stepper = btn.closest('[data-stepper]');
                if (!stepper) return;
                
                const inputId = stepper.getAttribute('data-stepper');
                const input = document.getElementById(inputId);
                if (!input) return;
                
                const action = btn.getAttribute('data-stepper-action');
                const currentValue = this.parseCurrencyValue(input.value);
                const step = parseFloat(input.getAttribute('data-step')) || 1;
                const min = parseFloat(input.getAttribute('data-min')) || 0;
                const max = parseFloat(input.getAttribute('data-max')) || 100000000;
                
                let newValue;
                if (action === 'increment') {
                    newValue = Math.min(currentValue + step, max);
                } else {
                    newValue = Math.max(currentValue - step, min);
                }
                
                // Format based on input type
                if (currencyInputs.includes(inputId)) {
                    input.value = this.formatNumber(Math.round(newValue));
                    // Sync slider
                    const sliderId = inputId + '-slider';
                    const slider = document.getElementById(sliderId);
                    if (slider) slider.value = newValue;
                } else if (percentageInputs.includes(inputId)) {
                    newValue = Math.round(newValue * 10) / 10;
                    input.value = newValue % 1 === 0 ? newValue.toString() : newValue.toFixed(1);
                } else {
                    input.value = newValue.toString();
                }
                
                // Trigger calculation
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
        });
    }
    
    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Math.round(value));
    }

    initializeEventListeners() {
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Mobile buttons
        const resetBtnMobile = document.getElementById('hlywml-reset-btn-mobile');
        const downloadBtnMobile = document.getElementById('hlywml-downloadBtn-mobile');
        
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        if (downloadBtnMobile) {
            downloadBtnMobile.addEventListener('click', () => this.downloadResults());
        }
        
        // Chart toggle
        if (this.chartToggle) {
            this.chartToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChart();
            });
        }
        
        // Make entire chart header clickable
        const chartHeader = document.querySelector('.hlywml-chart-header');
        if (chartHeader) {
            chartHeader.addEventListener('click', () => {
                this.toggleChart();
            });
        }
        
        // Add real-time calculation listeners to all inputs
        const inputs = document.querySelectorAll('input[type="text"]');
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
    }
    
    calculateOnLoad() {
        // Set default values for all inputs
        const initialBalance = document.getElementById('hlywml-initial-balance');
        const annualWithdrawal = document.getElementById('hlywml-annual-withdrawal');
        const rateOfReturn = document.getElementById('hlywml-rate-of-return');
        const inflationRate = document.getElementById('hlywml-inflation-rate');
        
        // Set and format currency inputs
        if (initialBalance) {
            initialBalance.value = '2,000,000';
            const slider = document.getElementById('hlywml-initial-balance-slider');
            if (slider) slider.value = 2000000;
        }
        if (annualWithdrawal) {
            annualWithdrawal.value = '65,000';
            const slider = document.getElementById('hlywml-annual-withdrawal-slider');
            if (slider) slider.value = 65000;
        }
        
        // Set percentage inputs
        if (rateOfReturn) {
            rateOfReturn.value = '5.0';
        }
        if (inflationRate) {
            inflationRate.value = '2.0';
        }
        
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
        const initialBalance = this.parseCurrencyValue(document.getElementById('hlywml-initial-balance').value);
        const annualWithdrawal = this.parseCurrencyValue(document.getElementById('hlywml-annual-withdrawal').value);
        const rateOfReturn = parseFloat(document.getElementById('hlywml-rate-of-return').value);
        const inflationRate = parseFloat(document.getElementById('hlywml-inflation-rate').value);
        
        return initialBalance > 0 && 
               annualWithdrawal > 0 && 
               !isNaN(rateOfReturn) && rateOfReturn >= 0 && 
               !isNaN(inflationRate) && inflationRate >= 0;
    }

    initializeSliders() {
        // Sync sliders with currency inputs
        const sliderPairs = [
            { slider: 'hlywml-initial-balance-slider', input: 'hlywml-initial-balance' },
            { slider: 'hlywml-annual-withdrawal-slider', input: 'hlywml-annual-withdrawal' }
        ];
        
        sliderPairs.forEach(pair => {
            const slider = document.getElementById(pair.slider);
            const input = document.getElementById(pair.input);
            
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
                
                // Update slider when input changes
                input.addEventListener('input', (e) => {
                    const value = this.parseCurrencyValue(e.target.value);
                    if (!isNaN(value)) {
                        slider.value = value;
                    }
                });
            }
        });
    }

    initializeInputFormatting() {
        // Format currency inputs with commas and numeric-only filtering
        const currencyInputs = ['hlywml-initial-balance', 'hlywml-annual-withdrawal'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    // Filter to only allow digits
                    const cursorPosition = e.target.selectionStart;
                    const oldValue = e.target.value;
                    const newValue = oldValue.replace(/[^\d]/g, '');
                    
                    if (oldValue !== newValue) {
                        e.target.value = newValue;
                        const removedChars = oldValue.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
                        const newCursorPos = Math.min(removedChars, newValue.length);
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    // Format with commas
                    this.formatCurrencyInput(e);
                });
                input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
                input.addEventListener('focus', (e) => this.handleCurrencyFocus(e));
            }
        });
        
        // Format percentage inputs with numeric-only filtering
        const percentageInputs = ['hlywml-rate-of-return', 'hlywml-inflation-rate'];
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
                        const removedChars = oldValue.substring(0, cursorPosition).length - oldValue.substring(0, cursorPosition).replace(/[^\d.]/g, '').length;
                        const newCursorPos = Math.max(0, cursorPosition - removedChars);
                        e.target.setSelectionRange(newCursorPos, newCursorPos);
                    }
                });
                
                // Format to one decimal place on blur
                input.addEventListener('blur', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        e.target.value = value.toFixed(1);
                    }
                });
            }
        });
    }

    formatCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value) {
            input.value = this.formatNumber(parseInt(value));
        }
    }

    handleCurrencyFocus(event) {
        const input = event.target;
        // Remove commas when focusing for easier editing
        input.value = input.value.replace(/,/g, '');
    }

    parseCurrencyValue(value) {
        // Parse numeric value (handles both plain numbers and numbers with commas)
        return parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
    }

    validateAndCapInput(input) {
        const value = input.value.trim();
        const numericValue = this.parseCurrencyValue(value);
        
        // Set reasonable limits based on input type
        let maxValue;
        let minValue = 0;
        let isPercentage = false;
        
        switch (input.id) {
            case 'hlywml-initial-balance':
                maxValue = 100000000; // $100 million
                break;
            case 'hlywml-annual-withdrawal':
                maxValue = 10000000; // $10 million
                break;
            case 'hlywml-rate-of-return':
                maxValue = 20; // 20%
                isPercentage = true;
                break;
            case 'hlywml-inflation-rate':
                maxValue = 10; // 10%
                isPercentage = true;
                break;
            default:
                return;
        }
        
        if (value && !isNaN(numericValue)) {
            if (numericValue > maxValue) {
                input.value = maxValue;
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
        const inputGroup = input.closest('.hlywml-input-group');
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'hlywml-error-message show';
        errorMsg.textContent = message;
        
        // Insert error message after input
        if (inputGroup) {
            inputGroup.appendChild(errorMsg);
        }
    }

    clearError(input) {
        const inputGroup = input.closest('.hlywml-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorMsg = inputGroup.querySelector('.hlywml-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }

    getFormData() {
        return {
            initialBalance: this.parseCurrencyValue(document.getElementById('hlywml-initial-balance').value),
            annualWithdrawal: this.parseCurrencyValue(document.getElementById('hlywml-annual-withdrawal').value),
            rateOfReturn: parseFloat(document.getElementById('hlywml-rate-of-return').value) / 100,
            inflationRate: parseFloat(document.getElementById('hlywml-inflation-rate').value) / 100
        };
    }

    calculateResults(data) {
        const maxYears = 30;
        const yearlyData = [];
        let startingBalance = data.initialBalance;
        let depletionYear = null;
        
        for (let year = 1; year <= maxYears; year++) {
            // Calculate inflation-adjusted withdrawal for this year
            const withdrawal = data.annualWithdrawal * Math.pow(1 + data.inflationRate, year - 1);
            
            // Calculate earnings (on balance after withdrawal)
            const balanceAfterWithdrawal = startingBalance - withdrawal;
            const earnings = balanceAfterWithdrawal * data.rateOfReturn;
            
            // Calculate ending balance
            const endingBalance = balanceAfterWithdrawal + earnings;
            
            yearlyData.push({
                year: year,
                startingBalance: startingBalance,
                withdrawal: withdrawal,
                earnings: earnings,
                endingBalance: endingBalance
            });
            
            // Check if depleted
            if (endingBalance <= 0 && depletionYear === null) {
                depletionYear = year;
            }
            
            // Update for next year
            startingBalance = endingBalance;
            
            // Stop if depleted
            if (endingBalance <= 0) {
                break;
            }
        }
        
        return {
            yearlyData: yearlyData,
            depletionYear: depletionYear,
            lastsAtLeast30Years: depletionYear === null && yearlyData.length === maxYears
        };
    }

    displayResults(results, formData) {
        // Determine result message
        const resultMessageEl = document.getElementById('hlywml-result-message');
        const yearsResultEl = document.getElementById('hlywml-years-result');
        
        if (results.depletionYear) {
            resultMessageEl.textContent = 'Your savings will be depleted by year';
            yearsResultEl.textContent = results.depletionYear;
        } else {
            resultMessageEl.textContent = 'Your savings will last at least';
            yearsResultEl.textContent = '30 years';
        }
        
        // Display explanation text
        const explanationTextEl = document.getElementById('hlywml-explanation-text');
        if (results.depletionYear) {
            explanationTextEl.textContent = `Based on your current withdrawal rate, your savings will be depleted by year ${results.depletionYear}. Seeing what you have, and how long it will last, is the first step to creating a long-term financial strategy. Often, all it takes is a little adjustment here and there to help the numbers align with your vision of retirement. Plus, other factors, including how much Social Security will add, can change how you view your retirement.`;
        } else {
            explanationTextEl.textContent = 'Based on your current withdrawal rates, your savings will last you at least 30 years into retirement. Seeing what you have, and how long it will last, is the first step to creating a long-term financial strategy. Often, all it takes is a little adjustment here and there to help the numbers align with your vision of retirement. Plus, other factors, including how much Social Security will add, can change how you view your retirement.';
        }
        
        // Display year-by-year breakdown
        this.displayBreakdown(results.yearlyData);
        
        // Generate and display chart with data
        this.generateChart(results.yearlyData);
        
        // Ensure chart is visible (already visible on page load)
        if (this.chartContainer) {
            this.chartContainer.style.display = 'block';
        }
        if (this.placeholderContent) {
            this.placeholderContent.style.display = 'none';
        }
        
        // Show results section
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
    }

    displayBreakdown(yearlyData) {
        const breakdownItemsEl = document.getElementById('hlywml-breakdown-items');
        if (!breakdownItemsEl) return;
        
        // Clear existing items
        breakdownItemsEl.innerHTML = '';
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'hlywml-breakdown-dropdown';
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'hlywml-breakdown-toggle';
        toggleButton.type = 'button';
        toggleButton.innerHTML = `
            <span class="hlywml-breakdown-toggle-text">View Year-by-Year Breakdown</span>
            <span class="hlywml-breakdown-toggle-icon">▼</span>
        `;
        
        // Create content container (initially hidden)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'hlywml-breakdown-content';
        contentContainer.style.display = 'none';
        
        // Display first 10 years or until depletion, whichever comes first
        const displayYears = Math.min(10, yearlyData.length);
        
        for (let i = 0; i < displayYears; i++) {
            const yearData = yearlyData[i];
            const card = document.createElement('div');
            card.className = 'hlywml-breakdown-card';
            card.innerHTML = `
                <div class="hlywml-breakdown-card-header">
                    <span class="hlywml-breakdown-year">Year ${yearData.year}</span>
                </div>
                <div class="hlywml-breakdown-card-body">
                    <div class="hlywml-breakdown-row">
                        <span class="hlywml-breakdown-label">Starting Balance</span>
                        <span class="hlywml-breakdown-value">${this.formatCurrency(yearData.startingBalance)}</span>
                    </div>
                    <div class="hlywml-breakdown-row">
                        <span class="hlywml-breakdown-label">Withdrawal</span>
                        <span class="hlywml-breakdown-value">${this.formatCurrency(yearData.withdrawal)}</span>
                    </div>
                    <div class="hlywml-breakdown-row">
                        <span class="hlywml-breakdown-label">Earnings</span>
                        <span class="hlywml-breakdown-value">${this.formatCurrency(yearData.earnings)}</span>
                    </div>
                    <div class="hlywml-breakdown-row hlywml-breakdown-row-final">
                        <span class="hlywml-breakdown-label">Ending Balance</span>
                        <span class="hlywml-breakdown-value hlywml-breakdown-value-final">${this.formatCurrency(yearData.endingBalance)}</span>
                    </div>
                </div>
            `;
            contentContainer.appendChild(card);
        }
        
        // Toggle functionality
        toggleButton.addEventListener('click', () => {
            const isExpanded = contentContainer.style.display !== 'none';
            contentContainer.style.display = isExpanded ? 'none' : 'block';
            toggleButton.classList.toggle('hlywml-breakdown-toggle-active');
            const icon = toggleButton.querySelector('.hlywml-breakdown-toggle-icon');
            if (icon) {
                icon.textContent = isExpanded ? '▼' : '▲';
            }
        });
        
        dropdownContainer.appendChild(toggleButton);
        dropdownContainer.appendChild(contentContainer);
        breakdownItemsEl.appendChild(dropdownContainer);
    }

    generateChart(yearlyData) {
        const canvas = document.getElementById('hlywml-balance-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        // Get CSS variables from :root for dynamic colors
        const rootStyles = getComputedStyle(document.documentElement);
        // TODO: Fix chart color to properly use --paletteColor1 CSS variable
        // Currently hardcoded to green because CSS variable is returning black
        // Need to investigate why --paletteColor1 is black and fix the fallback logic
        const chartColor = "#10b981"; // Green color (temporary hardcoded value)
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        const labels = yearlyData.map(d => d.year);
        const balances = yearlyData.map(d => d.endingBalance);
        
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Balance',
                    data: balances,
                    borderColor: chartColor,
                    backgroundColor: chartColor + '1A',
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
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        titleFont: {
                            family: fontFamily,
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: fontFamily,
                            size: 13
                        },
                        padding: 12,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: chartColor,
                        borderWidth: 1,
                        callbacks: {
                            title: (context) => {
                                if (context && context.length > 0 && context[0].label) {
                                    return `Year ${context[0].label}`;
                                }
                                return '';
                            },
                            label: (context) => {
                                if (context.parsed && context.parsed.y !== null && context.parsed.y !== undefined) {
                                    return 'Portfolio Balance: ' + this.formatCurrency(context.parsed.y);
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Portfolio Balance',
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
                            text: 'Year',
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

    downloadResults() {
        const { jsPDF } = window.jspdf;
        
        if (!confirm('Download your retirement analysis?')) {
            return;
        }
        
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        const doc = new jsPDF();
        
        // Add PDF metadata
        doc.setProperties({
            title: 'How Long Will Your Money Last - Retirement Analysis',
            subject: 'Financial Calculator Results',
            author: 'FMG Financial Calculators',
            keywords: 'retirement, savings, withdrawal, financial calculator, retirement planning',
            creator: 'FMG Financial Calculators'
        });
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('How Long Will Your Money Last?', 20, yPosition);
        yPosition += 20;
        
        // Input Values
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Input Values', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Initial Portfolio Balance: ${this.formatCurrency(formData.initialBalance)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Annual Withdrawal Amount: ${this.formatCurrency(formData.annualWithdrawal)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Annual Rate of Return: ${(formData.rateOfReturn * 100).toFixed(1)}%`, 20, yPosition);
        yPosition += 7;
        doc.text(`Inflation Rate: ${(formData.inflationRate * 100).toFixed(1)}%`, 20, yPosition);
        yPosition += 15;
        
        // Results
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Results', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        if (results.depletionYear) {
            doc.text(`Your savings will be depleted by year ${results.depletionYear}`, 20, yPosition);
        } else {
            doc.text('Your savings will last at least 30 years into retirement', 20, yPosition);
        }
        yPosition += 15;
        
        // Chart - wider aspect ratio to match actual chart
        if (this.chartInstance && this.chartInstance.canvas) {
            const chartImage = this.chartInstance.canvas.toDataURL('image/png');
            const chartWidth = 170;
            const chartHeight = 85;
            const chartX = (doc.internal.pageSize.width - chartWidth) / 2; // Center the chart
            doc.addImage(chartImage, 'PNG', chartX, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 15;
        }
        
        // Disclaimer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const disclaimer = 'This analysis is based on the inputs provided and assumes constant rates of return and inflation. Actual results may vary. Consult with a financial professional for personalized advice.';
        const disclaimerText = doc.splitTextToSize(disclaimer, 170);
        doc.text(disclaimerText, 20, yPosition);
        
        // Save PDF
        doc.save('how-long-will-your-money-last.pdf');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    resetForm() {
        // Reset all input fields to default values
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = this.defaultValues[id];
                
                // Format currency inputs with commas
                if (id === 'hlywml-initial-balance' || id === 'hlywml-annual-withdrawal') {
                    const numericValue = parseFloat(input.value.replace(/[^\d]/g, '')) || 0;
                    if (numericValue > 0) {
                        input.value = this.formatNumber(numericValue);
                    }
                }
                
                // Format percentage inputs
                if (id === 'hlywml-rate-of-return' || id === 'hlywml-inflation-rate') {
                    const numericValue = parseFloat(input.value);
                    if (!isNaN(numericValue)) {
                        input.value = numericValue.toFixed(1);
                    }
                }
                
                // Clear any error states
                this.clearError(input);
            }
        });
        
        // Also reset sliders to match input values
        const balanceSlider = document.getElementById('hlywml-initial-balance-slider');
        const withdrawalSlider = document.getElementById('hlywml-annual-withdrawal-slider');
        if (balanceSlider) balanceSlider.value = this.defaultValues['hlywml-initial-balance'];
        if (withdrawalSlider) withdrawalSlider.value = this.defaultValues['hlywml-annual-withdrawal'];
        
        // Recalculate and display results with default values
        this.calculateAndDisplay();
        
        // On mobile, scroll to the first input
        if (window.innerWidth <= 750) {
            const firstInput = document.getElementById('hlywml-initial-balance');
            if (firstInput) {
                firstInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    
}

// Initialize the calculator when the DOM is loaded
function initializeCalculator() {
    window.calculatorInstance = new HowLongWillYourMoneyLastCalculator();
}

// Try multiple initialization methods for CMS compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else {
    initializeCalculator();
}
