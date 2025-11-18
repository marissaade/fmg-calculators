// Investment Comparison Calculator JavaScript

class InvestmentComparisonCalculator {
    constructor() {
        this.downloadBtn = document.getElementById('ci-downloadBtn');
        this.resetBtn = document.getElementById('ci-reset-btn');
        this.chartSection = document.querySelector('.ci-chart-section');
        this.chartToggle = document.getElementById('ci-chart-toggle');
        this.chartInstance = null; // Store chart instance for updates
        
        // Default values
        this.defaultValues = {
            'ci-initial-investment-a': '5000',
            'ci-annual-contribution-a': '2000',
            'ci-rate-of-return-a': '9',
            'ci-initial-investment-b': '5000',
            'ci-annual-contribution-b': '2000',
            'ci-rate-of-return-b': '5',
            'ci-years-to-grow': '20'
        };
        
        // Calculation timeout for debouncing
        this.calculationTimeout = null;
        
        this.initializeInputFormatting();
        this.initializeSliders();
        this.initializeTooltips();
        this.initializeEventListeners();
        this.initializeChart();
        this.calculateOnLoad();
    }

    initializeEventListeners() {
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        if (this.chartToggle) {
            this.chartToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChart();
            });
        }
        
        const chartHeader = document.querySelector('.ci-chart-header');
        if (chartHeader && this.chartToggle) {
            chartHeader.addEventListener('click', (e) => {
                if (e.target !== this.chartToggle && !this.chartToggle.contains(e.target)) {
                    this.toggleChart();
                }
            });
        }
        
        // Real-time calculation on all inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearError(input);
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
        
        // Add real-time validation for years input
        const yearsInput = document.getElementById('ci-years-to-grow');
        if (yearsInput) {
            yearsInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value > 100) {
                    e.target.value = 100;
                } else if (value < 1 && e.target.value !== '') {
                    e.target.value = 1;
                }
            });
        }
        
        // Add real-time validation for percentage inputs
        const percentageInputs = document.querySelectorAll('#ci-rate-of-return-a, #ci-rate-of-return-b');
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
    }

    initializeTooltips() {
        // Make tooltips clickable for mobile compatibility
        const tooltips = document.querySelectorAll('.ci-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Toggle active class
                const isActive = tooltip.classList.contains('active');
                // Close all tooltips first
                document.querySelectorAll('.ci-tooltip').forEach(t => t.classList.remove('active'));
                // Toggle this tooltip
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        // Close tooltips when clicking outside (single global listener)
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ci-tooltip')) {
                document.querySelectorAll('.ci-tooltip').forEach(t => t.classList.remove('active'));
            }
        });
    }

    initializeInputFormatting() {
        // Format currency inputs with commas
        const currencyInputs = ['ci-initial-investment-a', 'ci-annual-contribution-a', 'ci-initial-investment-b', 'ci-annual-contribution-b'];
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

    handleCurrencyFocus(event) {
        // Remove formatting on focus for easier editing
        const input = event.target;
        const rawValue = input.value.replace(/[^\d]/g, '');
        input.value = rawValue;
    }

    formatCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value) {
            // Apply caps based on field type
            const numValue = parseInt(value);
            let maxValue;
            
            if (input.id.includes('initial-investment')) {
                maxValue = 500000; // $500K cap
            } else if (input.id.includes('annual-contribution')) {
                maxValue = 100000; // $100K annual cap
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
            
            // Update corresponding slider
            this.updateSliderFromInput(input);
        } else {
            input.value = '';
        }
        
        // Trigger calculation after formatting
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => {
            this.calculateAndDisplay();
        }, 300);
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    }

    initializeSliders() {
        // Sync sliders with currency text inputs
        const sliderPairs = [
            { slider: 'ci-initial-investment-a-slider', input: 'ci-initial-investment-a', max: 500000 },
            { slider: 'ci-annual-contribution-a-slider', input: 'ci-annual-contribution-a', max: 100000 },
            { slider: 'ci-initial-investment-b-slider', input: 'ci-initial-investment-b', max: 500000 },
            { slider: 'ci-annual-contribution-b-slider', input: 'ci-annual-contribution-b', max: 100000 }
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
                        clearTimeout(this.calculationTimeout);
                        this.calculationTimeout = setTimeout(() => {
                            this.calculateAndDisplay();
                        }, 300);
                    }
                });
                
            }
        });
    }

    updateSliderFromInput(input) {
        const value = this.parseCurrencyValue(input.value);
        let sliderId;
        
        if (input.id === 'ci-initial-investment-a') {
            sliderId = 'ci-initial-investment-a-slider';
        } else if (input.id === 'ci-annual-contribution-a') {
            sliderId = 'ci-annual-contribution-a-slider';
        } else if (input.id === 'ci-initial-investment-b') {
            sliderId = 'ci-initial-investment-b-slider';
        } else if (input.id === 'ci-annual-contribution-b') {
            sliderId = 'ci-annual-contribution-b-slider';
        }
        
        if (sliderId) {
            const slider = document.getElementById(sliderId);
            if (slider && !isNaN(value)) {
                // Cap value at slider max
                let maxValue;
                if (input.id.includes('initial-investment')) {
                    maxValue = 500000; // $500K
                } else if (input.id.includes('annual-contribution')) {
                    maxValue = 100000; // $100K
                } else {
                    maxValue = parseFloat(slider.getAttribute('max')) || 500000;
                }
                const cappedValue = Math.min(value, maxValue);
                slider.value = cappedValue;
            }
        }
    }

    hasValidInputs() {
        const requiredFields = [
            'ci-initial-investment-a',
            'ci-annual-contribution-a', 
            'ci-rate-of-return-a',
            'ci-initial-investment-b',
            'ci-annual-contribution-b',
            'ci-rate-of-return-b',
            'ci-years-to-grow'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field) continue;
            
            const rawValue = field.value ? field.value.trim() : '';
            if (!rawValue || rawValue === '') {
                return false;
            }
            
            let numericValue;
            if (fieldId === 'ci-rate-of-return-a' || fieldId === 'ci-rate-of-return-b') {
                numericValue = parseFloat(rawValue);
            } else if (fieldId === 'ci-years-to-grow') {
                numericValue = parseInt(rawValue, 10);
            } else {
                numericValue = this.parseCurrencyValue(rawValue);
            }
            
            if (isNaN(numericValue) || numericValue < 0) {
                return false;
            }
        }

        return true;
    }

    calculateOnLoad() {
        // Format initial currency values with commas
        const currencyInputs = ['ci-initial-investment-a', 'ci-annual-contribution-a', 'ci-initial-investment-b', 'ci-annual-contribution-b'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value) {
                const value = this.parseCurrencyValue(input.value);
                input.value = value.toLocaleString();
            }
        });
        
        // Trigger calculation if inputs are valid
        if (this.hasValidInputs()) {
            this.calculateAndDisplay();
        }
    }

    calculateAndDisplay() {
        if (!this.hasValidInputs()) {
            return;
        }
        
        const formData = this.getFormData();
        const results = this.calculateComparison(formData);
        this.displayResults(results, formData);
    }

    getFormData() {
        return {
            yearsToGrow: parseInt(document.getElementById('ci-years-to-grow').value),
            optionA: {
                initialInvestment: this.parseCurrencyValue(document.getElementById('ci-initial-investment-a').value),
                annualContribution: this.parseCurrencyValue(document.getElementById('ci-annual-contribution-a').value),
                rateOfReturn: parseFloat(document.getElementById('ci-rate-of-return-a').value) / 100
            },
            optionB: {
                initialInvestment: this.parseCurrencyValue(document.getElementById('ci-initial-investment-b').value),
                annualContribution: this.parseCurrencyValue(document.getElementById('ci-annual-contribution-b').value),
                rateOfReturn: parseFloat(document.getElementById('ci-rate-of-return-b').value) / 100
            }
        };
    }

    calculateInvestmentValue(initialInvestment, annualContribution, rateOfReturn, years) {
        // Future Value of Initial Investment = Initial × (1 + rate)^years
        const futureValueInitial = initialInvestment * Math.pow(1 + rateOfReturn, years);
        
        // Future Value of Annual Contributions = Annual × [((1 + rate)^years - 1) / rate]
        let futureValueContributions = 0;
        if (rateOfReturn > 0) {
            futureValueContributions = annualContribution * 
                ((Math.pow(1 + rateOfReturn, years) - 1) / rateOfReturn);
        } else {
            // If rate of return is 0, it's just the sum of contributions
            futureValueContributions = annualContribution * years;
        }
        
        const totalValue = futureValueInitial + futureValueContributions;
        const totalContributed = initialInvestment + (annualContribution * years);
        
        return {
            futureValue: Math.round(totalValue),
            totalContributed: Math.round(totalContributed),
            totalGain: Math.round(totalValue - totalContributed)
        };
    }

    calculateComparison(formData) {
        const resultA = this.calculateInvestmentValue(
            formData.optionA.initialInvestment,
            formData.optionA.annualContribution,
            formData.optionA.rateOfReturn,
            formData.yearsToGrow
        );
        
        const resultB = this.calculateInvestmentValue(
            formData.optionB.initialInvestment,
            formData.optionB.annualContribution,
            formData.optionB.rateOfReturn,
            formData.yearsToGrow
        );
        
        const difference = Math.abs(resultA.futureValue - resultB.futureValue);
        const betterOption = resultA.futureValue > resultB.futureValue ? 'A' : 'B';
        
        return {
            optionA: resultA,
            optionB: resultB,
            difference: difference,
            betterOption: betterOption
        };
    }

    displayResults(results, formData) {
        // Update main result - better option
        const betterOption = document.getElementById('ci-better-option');
        if (betterOption) {
            betterOption.textContent = `Option ${results.betterOption}`;
        }
        
        // Update breakdown values
        const projectedValueA = document.getElementById('ci-projected-value-a');
        const projectedValueB = document.getElementById('ci-projected-value-b');
        const differenceAmount = document.getElementById('ci-difference-amount');
        
        if (projectedValueA) {
            projectedValueA.textContent = this.formatCurrency(results.optionA.futureValue);
        }
        if (projectedValueB) {
            projectedValueB.textContent = this.formatCurrency(results.optionB.futureValue);
        }
        if (differenceAmount) {
            differenceAmount.textContent = this.formatCurrency(results.difference);
        }
        
        // Generate and display chart
        this.generateChart(formData, results);
    }

    toggleChart() {
        if (!this.chartSection || !this.chartToggle) return;
        
        const isCollapsed = this.chartSection.classList.contains('collapsed');
        
        if (isCollapsed) {
            this.chartSection.classList.remove('collapsed');
            this.chartToggle.setAttribute('aria-expanded', 'true');
        } else {
            this.chartSection.classList.add('collapsed');
            this.chartToggle.setAttribute('aria-expanded', 'false');
        }
    }

    initializeChart() {
        // Chart is initialized when generateChart is called
        // This method is here for consistency with other calculators
    }

    generateChart(formData, results) {
        const canvas = document.getElementById('ci-comparison-chart');
        const ctx = canvas.getContext('2d');
        
        // Get CSS variables from :root for dynamic colors
        const rootStyles = getComputedStyle(document.documentElement);
        const optionAColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#3b82f6"; // Fallback color
        const optionBColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#8b5cf6"; // Fallback color
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        // Generate data points for each year
        const chartData = this.generateChartData(formData);
        
        // Update existing chart with new data
        if (this.chartInstance) {
            this.chartInstance.data.labels = chartData.years;
            this.chartInstance.data.datasets[0].data = chartData.optionAData;
            this.chartInstance.data.datasets[1].data = chartData.optionBData;
            this.chartInstance.update();
        } else {
            // Create the chart if it doesn't exist
            this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: 'Investment Option A',
                        data: chartData.optionAData,
                        borderColor: optionAColor,
                        backgroundColor: optionAColor + '1A', // Add transparency
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: optionAColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Investment Option B',
                        data: chartData.optionBData,
                        borderColor: optionBColor,
                        backgroundColor: optionBColor + '1A', // Add transparency
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: optionBColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: {
                                family: fontFamily,
                                size: 13,
                                weight: '500'
                            },
                            color: '#6b7280'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            family: fontFamily,
                            size: 13,
                            weight: '500'
                        },
                        bodyFont: {
                            family: fontFamily,
                            size: 12
                        },
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = this.formatCurrency(context.parsed.y);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Years',
                            font: {
                                family: fontFamily,
                                size: 12,
                                weight: '500'
                            },
                            color: '#6b7280'
                        },
                        grid: {
                            color: 'rgba(229, 231, 235, 0.8)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                family: fontFamily,
                                size: 11
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Investment Value ($)',
                            font: {
                                family: fontFamily,
                                size: 12,
                                weight: '500'
                            },
                            color: '#6b7280'
                        },
                        grid: {
                            color: 'rgba(229, 231, 235, 0.8)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                family: fontFamily,
                                size: 11
                            },
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
        }
    }

    generateChartData(formData) {
        const years = [];
        const optionAData = [];
        const optionBData = [];
        
        // Generate data for each year
        for (let year = 0; year <= formData.yearsToGrow; year++) {
            years.push(year);
            
            // Calculate Option A value at this year
            const resultA = this.calculateInvestmentValue(
                formData.optionA.initialInvestment,
                formData.optionA.annualContribution,
                formData.optionA.rateOfReturn,
                year
            );
            optionAData.push(resultA.futureValue);
            
            // Calculate Option B value at this year
            const resultB = this.calculateInvestmentValue(
                formData.optionB.initialInvestment,
                formData.optionB.annualContribution,
                formData.optionB.rateOfReturn,
                year
            );
            optionBData.push(resultB.futureValue);
        }
        
        return {
            years,
            optionAData,
            optionBData
        };
    }

    validateAndCapInput(input) {
        const value = input.value.trim();
        const numericValue = this.parseCurrencyValue(value);
        
        // Set reasonable limits based on input type
        let maxValue;
        let minValue = 0;
        
        switch (input.id) {
            case 'ci-initial-investment-a':
            case 'ci-initial-investment-b':
                maxValue = 500000; // $500K
                break;
            case 'ci-annual-contribution-a':
            case 'ci-annual-contribution-b':
                maxValue = 100000; // $100K
                break;
            case 'ci-years-to-grow':
                maxValue = 100;
                minValue = 1;
                break;
            case 'ci-rate-of-return-a':
            case 'ci-rate-of-return-b':
                maxValue = 100; // 100%
                break;
            default:
                return this.validateInput(input);
        }
        
        // Apply limits automatically
        if (!isNaN(numericValue)) {
            if (numericValue > maxValue) {
                // Set raw numeric value for number inputs, formatted for text inputs
                if (input.type === 'number') {
                    input.value = maxValue.toString();
                } else {
                    input.value = maxValue.toLocaleString();
                }
                
                // Show prominent alert for capped values
                this.showCappedValueAlert(input, maxValue);
                this.showError(input, `⚠️ Value automatically capped at ${this.formatCurrency(maxValue)}`);
                setTimeout(() => this.clearError(input), 4000);
            } else if (numericValue < minValue) {
                input.value = minValue.toString();
                this.showError(input, `⚠️ Value cannot be less than ${minValue}`);
                setTimeout(() => this.clearError(input), 3000);
            } else {
                // Format the value properly for text inputs only
                if (input.type === 'text' && (input.id.includes('investment') || input.id.includes('contribution'))) {
                    input.value = numericValue.toLocaleString();
                }
            }
        }
        
        // Run normal validation
        return this.validateInput(input);
    }
    
    showCappedValueAlert(input, maxValue) {
        // Create a temporary visual alert
        const inputGroup = input.closest('.ci-input-group');
        if (!inputGroup) return;
        
        // Add a temporary highlight class
        inputGroup.classList.add('value-capped');
        
        // Create a brief flash effect
        input.style.backgroundColor = '#fff3cd';
        input.style.borderColor = '#ffc107';
        
        // Reset the styling after a brief moment
        setTimeout(() => {
            input.style.backgroundColor = '';
            input.style.borderColor = '';
            inputGroup.classList.remove('value-capped');
        }, 1000);
        
    }
    
    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Clear previous error state
        this.clearError(input);
        
        // Required field validation
        if (!value) {
            errorMessage = 'This field is required.';
            isValid = false;
        } else {
            // Specific validations based on input type
            if (input.id.includes('initial-investment')) {
                const currencyValue = this.parseCurrencyValue(value);
                if (currencyValue < 0) {
                    errorMessage = 'Amount cannot be negative.';
                    isValid = false;
                } else if (currencyValue > 100000000) {
                    errorMessage = 'Initial investment cannot exceed $100 million.';
                    isValid = false;
                }
            } else if (input.id.includes('annual-contribution')) {
                const currencyValue = this.parseCurrencyValue(value);
                if (currencyValue < 0) {
                    errorMessage = 'Amount cannot be negative.';
                    isValid = false;
                } else if (currencyValue > 10000000) {
                    errorMessage = 'Annual contribution cannot exceed $10 million.';
                    isValid = false;
                }
            } else if (input.id === 'ci-years-to-grow') {
                const years = parseInt(value);
                if (years < 1 || years > 100) {
                    errorMessage = 'Years must be between 1 and 100.';
                    isValid = false;
                }
            } else if (input.id.includes('rate-of-return')) {
                const percentage = parseFloat(value);
                if (percentage < 0 || percentage > 100) {
                    errorMessage = 'Rate must be between 0% and 100%.';
                    isValid = false;
                }
            }
        }
        
        if (!isValid) {
            this.showError(input, errorMessage);
        }
        
        return isValid;
    }

    showError(input, message) {
        const inputGroup = input.closest('.ci-input-group');
        if (!inputGroup) {
            return;
        }
        
        // Create error element if it doesn't exist
        let errorElement = inputGroup.querySelector('.ci-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'ci-error-message';
            inputGroup.appendChild(errorElement);
        }
        
        inputGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    clearError(input) {
        const inputGroup = input.closest('.ci-input-group');
        if (!inputGroup) {
            return;
        }
        
        const errorElement = inputGroup.querySelector('.ci-error-message');
        if (errorElement) {
            inputGroup.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        } else {
            // Just remove error class if no error element exists
            inputGroup.classList.remove('error');
        }
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
        // Reset all inputs to default values
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const defaultValue = this.defaultValues[id];
                input.value = defaultValue;
                
                // Format currency inputs with commas
                if (id.includes('initial-investment') || id.includes('annual-contribution')) {
                    const value = this.parseCurrencyValue(defaultValue);
                    input.value = value.toLocaleString();
                }
            }
        });
        
        // Reset sliders
        const sliderPairs = [
            { slider: 'ci-initial-investment-a-slider', input: 'ci-initial-investment-a' },
            { slider: 'ci-annual-contribution-a-slider', input: 'ci-annual-contribution-a' },
            { slider: 'ci-initial-investment-b-slider', input: 'ci-initial-investment-b' },
            { slider: 'ci-annual-contribution-b-slider', input: 'ci-annual-contribution-b' }
        ];
        
        sliderPairs.forEach(pair => {
            const slider = document.getElementById(pair.slider);
            const input = document.getElementById(pair.input);
            if (slider && input) {
                const value = this.parseCurrencyValue(input.value);
                slider.value = value;
            }
        });
        
        // Clear any error messages
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            this.clearError(input);
        });
        
        // Recalculate with default values
        this.calculateAndDisplay();
        
        // Reset chart to empty state instead of destroying it
        if (this.chartInstance) {
            this.chartInstance.data.labels = [];
            this.chartInstance.data.datasets[0].data = [];
            this.chartInstance.data.datasets[1].data = [];
            this.chartInstance.update();
        }
        
        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    downloadResults() {
        console.log('Download button clicked');
        
        // Show notification before download
        const userConfirmed = confirm('Your investment comparison will be downloaded as a PDF file. This may take a moment to generate. Continue?');
        if (!userConfirmed) {
            console.log('Download cancelled by user');
            return;
        }
        
        try {
            // Check if jsPDF is available
            if (!window.jspdf) {
                console.error('jsPDF library not loaded');
                this.downloadResultsAsText();
                return;
            }
            
            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add PDF metadata
            doc.setProperties({
                title: 'Investment Comparison Results',
                subject: 'Financial Calculator Results',
                author: 'FMG Financial Calculators',
                keywords: 'investment, comparison, financial calculator, investment options',
                creator: 'FMG Financial Calculators'
            });
            
            // Set up fonts and colors
            const primaryColor = [51, 51, 51]; // #333333
            const accentColor = [79, 70, 229]; // #4f46e5
            const mutedColor = [107, 114, 128]; // #6b7280
            
            // Header
            doc.setFontSize(18);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Investment Comparison Results', 20, 25);
            
            // Date
            doc.setFontSize(9);
            doc.setTextColor(...mutedColor);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 33);
            
            // Get form data
            const formData = this.getFormData();
            let yPosition = 45;
            
            // Input Values Section
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.setFont('helvetica', 'bold');
            doc.text('INPUT VALUES', 20, yPosition);
            yPosition += 8;
            
            // Side-by-side layout for Investment Options
            const leftColumnX = 20;
            const rightColumnX = 110; // Approximately halfway across the page
            
            // Investment Option A (left column)
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Investment Option A:', leftColumnX, yPosition);
            
            // Investment Option B (right column)
            doc.text('Investment Option B:', rightColumnX, yPosition);
            yPosition += 5;
            
            // Option A details (left column)
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Initial Investment: ${this.formatCurrency(formData.optionA.initialInvestment)}`, leftColumnX + 5, yPosition);
            doc.text(`• Initial Investment: ${this.formatCurrency(formData.optionB.initialInvestment)}`, rightColumnX + 5, yPosition);
            yPosition += 4;
            
            doc.text(`• Annual Contribution: ${this.formatCurrency(formData.optionA.annualContribution)}`, leftColumnX + 5, yPosition);
            doc.text(`• Annual Contribution: ${this.formatCurrency(formData.optionB.annualContribution)}`, rightColumnX + 5, yPosition);
            yPosition += 4;
            
            doc.text(`• Expected Annual Return: ${(formData.optionA.rateOfReturn * 100).toFixed(1)}%`, leftColumnX + 5, yPosition);
            doc.text(`• Expected Annual Return: ${(formData.optionB.rateOfReturn * 100).toFixed(1)}%`, rightColumnX + 5, yPosition);
            yPosition += 6;
            
            // Investment Timeline
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Investment Timeline: ${formData.yearsToGrow} years`, 20, yPosition);
            yPosition += 8;
            
            // Results Section
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.setFont('helvetica', 'bold');
            doc.text('COMPARISON RESULTS', 20, yPosition);
            yPosition += 8;
            
            // Get result values
            const projectedValueA = document.getElementById('ci-projected-value-a').textContent;
            const projectedValueB = document.getElementById('ci-projected-value-b').textContent;
            const differenceAmount = document.getElementById('ci-difference-amount').textContent;
            
            // Calculate which option is better
            const valueA = this.parseCurrencyValue(projectedValueA);
            const valueB = this.parseCurrencyValue(projectedValueB);
            const betterOption = valueA > valueB ? 'Investment Option A' : 'Investment Option B';
            const difference = Math.abs(valueA - valueB);
            
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Final Values:', 20, yPosition);
            yPosition += 5;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Investment Option A: ${projectedValueA}`, 25, yPosition);
            yPosition += 4;
            doc.text(`• Investment Option B: ${projectedValueB}`, 25, yPosition);
            yPosition += 6;
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Better Option: ${betterOption}`, 25, yPosition);
            yPosition += 4;
            doc.text(`Advantage: ${this.formatCurrency(difference)}`, 25, yPosition);
            yPosition += 10;
            
            // Add chart to PDF
            if (this.chartInstance && this.chartInstance.canvas) {
                try {
                    const chartImage = this.chartInstance.canvas.toDataURL('image/png');
                    doc.setFontSize(12);
                    doc.setTextColor(...primaryColor);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Investment Growth Comparison', 20, yPosition);
                    yPosition += 6;
                    // Chart with proper aspect ratio - make it slightly smaller to fit better
                    const chartWidth = 160; // Reduced from 170
                    doc.addImage(chartImage, 'PNG', 20, yPosition, chartWidth, 0);
                    // Get the actual height of the image after scaling
                    const imgHeight = (this.chartInstance.canvas.height / this.chartInstance.canvas.width) * chartWidth;
                    yPosition += imgHeight + 8;
                } catch (chartError) {
                    console.warn('Could not add chart to PDF:', chartError);
                }
            }
            
            // Add summary section
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.setFont('helvetica', 'bold');
            doc.text('SUMMARY', 20, yPosition);
            yPosition += 6;
            
            doc.setFontSize(9);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'normal');
            
            const summaryText = this.generateSummaryText(formData, valueA, valueB, betterOption);
            const splitText = doc.splitTextToSize(summaryText, 170);
            doc.text(splitText, 20, yPosition);
            yPosition += splitText.length * 3.5 + 8;
            
            // Add disclaimer at bottom of page
            const pageHeight = doc.internal.pageSize.height;
            const disclaimerY = pageHeight - 15; // 15px from bottom
            doc.setFontSize(7);
            doc.setTextColor(...mutedColor);
            doc.setFont('helvetica', 'italic');
            const disclaimer = 'This calculation is for educational purposes only and should not be considered as financial advice. Actual investment returns may vary due to market conditions, fees, taxes, and other factors. Please consult with a financial advisor for personalized investment guidance.';
            const disclaimerText = doc.splitTextToSize(disclaimer, 170);
            doc.text(disclaimerText, 20, disclaimerY);
            
            // Save the PDF
            doc.save('investment-comparison-results.pdf');
            console.log('PDF download completed successfully');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to text download if PDF fails
            this.downloadResultsAsText();
        }
    }

    generateSummaryText(formData, valueA, valueB, betterOption) {
        const difference = Math.abs(valueA - valueB);
        const percentageDifference = ((difference / Math.min(valueA, valueB)) * 100).toFixed(1);
        
        let summary = `Based on your inputs, ${betterOption} would result in a higher final value after ${formData.yearsToGrow} years. `;
        
        if (difference > 10000) {
            summary += `The advantage is significant at ${this.formatCurrency(difference)} (${percentageDifference}% more than the lower option). `;
        } else {
            summary += `The difference is relatively modest at ${this.formatCurrency(difference)} (${percentageDifference}% more than the lower option). `;
        }
        
        // Add insights based on the rate differences
        const rateDiff = Math.abs(formData.optionA.rateOfReturn - formData.optionB.rateOfReturn) * 100;
        if (rateDiff > 2) {
            summary += `The ${rateDiff.toFixed(1)}% difference in expected annual returns compounds significantly over time, demonstrating the power of compound interest. `;
        }
        
        summary += 'Remember that higher returns typically come with higher risk, so consider your risk tolerance and investment timeline when making decisions.';
        
        return summary;
    }

    downloadResultsAsText() {
        const results = this.getResultsForDownload();
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'investment-comparison-results.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getResultsForDownload() {
        const projectedValueA = document.getElementById('ci-projected-value-a').textContent;
        const projectedValueB = document.getElementById('ci-projected-value-b').textContent;
        const differenceAmount = document.getElementById('ci-difference-amount').textContent;
        
        const formData = this.getFormData();
        const valueA = this.parseCurrencyValue(projectedValueA);
        const valueB = this.parseCurrencyValue(projectedValueB);
        const betterOption = valueA > valueB ? 'Investment Option A' : 'Investment Option B';
        const difference = Math.abs(valueA - valueB);
        
        return `INVESTMENT COMPARISON RESULTS
Generated on: ${new Date().toLocaleDateString()}

INPUT VALUES:
Investment Option A:
• Initial Investment: ${this.formatCurrency(formData.optionA.initialInvestment)}
• Annual Contribution: ${this.formatCurrency(formData.optionA.annualContribution)}
• Expected Annual Return: ${(formData.optionA.rateOfReturn * 100).toFixed(1)}%

Investment Option B:
• Initial Investment: ${this.formatCurrency(formData.optionB.initialInvestment)}
• Annual Contribution: ${this.formatCurrency(formData.optionB.annualContribution)}
• Expected Annual Return: ${(formData.optionB.rateOfReturn * 100).toFixed(1)}%

Investment Timeline: ${formData.yearsToGrow} years

COMPARISON RESULTS:
• Investment Option A: ${projectedValueA}
• Investment Option B: ${projectedValueB}
• Better Option: ${betterOption}
• Advantage: ${this.formatCurrency(difference)}

---
This analysis is based on the assumed rates of return provided and should be reviewed regularly. Past performance does not guarantee future results.`;
    }
}

// Initialize the calculator when the DOM is loaded
function initializeCalculator() {
    try {
        new InvestmentComparisonCalculator();
    } catch (error) {
        console.error('Error initializing calculator:', error);
    }
}

// Try multiple initialization methods for CMS compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initializeCalculator();
} else {
    // Fallback - try after a short delay
    setTimeout(initializeCalculator, 100);
}
