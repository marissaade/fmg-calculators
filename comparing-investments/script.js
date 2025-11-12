// Investment Comparison Calculator JavaScript

class InvestmentComparisonCalculator {
    constructor() {
        this.calculateBtn = document.getElementById('ci-calculateBtn');
        this.mainResultSection = document.querySelector('.ci-main-result');
        this.breakdownSection = document.querySelector('.ci-breakdown');
        this.downloadBtn = document.getElementById('ci-downloadBtn');
        this.resetBtn = document.getElementById('ci-reset-btn');
        this.printBtn = document.getElementById('ci-print-btn');
        this.placeholderContent = document.querySelector('.ci-placeholder-content');
        this.chartContainer = document.querySelector('.ci-chart-container');
        this.chartHeading = document.querySelector('.ci-chart-section h2');
        this.chartInstance = null; // Store chart instance for updates
        
        // Check if essential elements exist
        if (!this.calculateBtn) {
            console.error('Calculate button not found. Expected ID: ci-calculateBtn');
            return;
        }
        
        this.initializeEventListeners();
        this.initializeInputFormatting();
        this.initializeCustomTooltip();
    }

    initializeEventListeners() {
        if (this.calculateBtn) {
            this.calculateBtn.addEventListener('click', (e) => this.handleCalculate(e));
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        if (this.printBtn) {
            this.printBtn.addEventListener('click', () => this.printResults());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Add input validation listeners
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateAndCapInput(input));
            input.addEventListener('input', () => {
                this.clearError(input);
                this.checkFormValidity();
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
                // Re-check form validity after capping
                this.checkFormValidity();
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
                // Re-check form validity after capping
                this.checkFormValidity();
            });
        });
        
        // Initial form validity check
        this.checkFormValidity();
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

    initializeCustomTooltip() {
        // Create custom tooltip for the calculate button
        if (!this.calculateBtn) return;
        
        // Remove the title attribute to prevent native tooltip
        const tooltipText = this.calculateBtn.getAttribute('title') || 'Please fill out all fields above to compare your investment options';
        this.calculateBtn.removeAttribute('title');
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'ci-custom-tooltip';
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
        
        // Add tooltip to document body
        document.body.appendChild(tooltip);
        
        // Show tooltip on mouseenter
        this.calculateBtn.addEventListener('mouseenter', (e) => {
            if (this.calculateBtn.disabled) {
                // Get button position and size
                const rect = this.calculateBtn.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Temporarily show tooltip to measure its size
                tooltip.style.opacity = '0';
                tooltip.style.display = 'block';
                tooltip.style.visibility = 'visible';
                const tooltipRect = tooltip.getBoundingClientRect();
                const tooltipWidth = tooltipRect.width;
                const tooltipHeight = tooltipRect.height;
                
                // Calculate ideal position (centered above button)
                let left = rect.left + (rect.width / 2);
                let top = rect.top - tooltipHeight - 8; // 8px gap above button
                
                // Adjust horizontal position if tooltip would go off-screen
                const tooltipHalfWidth = tooltipWidth / 2;
                if (left - tooltipHalfWidth < 10) {
                    // Too far left - align to left edge with padding
                    left = tooltipHalfWidth + 10;
                } else if (left + tooltipHalfWidth > viewportWidth - 10) {
                    // Too far right - align to right edge with padding
                    left = viewportWidth - tooltipHalfWidth - 10;
                }
                
                // Adjust vertical position if tooltip would go off-screen
                if (top < 10) {
                    // Not enough space above - show below button instead
                    top = rect.bottom + 8;
                }
                
                // Apply final positioning
                tooltip.style.position = 'fixed';
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.zIndex = '999999';
                tooltip.style.opacity = '1';
            }
        });
        
        // Hide tooltip on mouseleave
        this.calculateBtn.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
        
        // Store reference for cleanup
        this.customTooltip = tooltip;
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
                maxValue = 100000000; // $100 million cap
            } else if (input.id.includes('annual-contribution')) {
                maxValue = 10000000; // $10 million annual cap
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
        
        // Re-check form validity after formatting
        this.checkFormValidity();
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    }

    checkFormValidity() {
        const requiredFields = [
            'ci-initial-investment-a',
            'ci-annual-contribution-a', 
            'ci-rate-of-return-a',
            'ci-initial-investment-b',
            'ci-annual-contribution-b',
            'ci-rate-of-return-b',
            'ci-years-to-grow'
        ];

        let allFieldsValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Get the raw value and trim whitespace
                const rawValue = field.value ? field.value.trim() : '';
                
                // Check if field is filled
                if (!rawValue || rawValue === '') {
                    allFieldsValid = false;
                    return; // Continue to next field
                }
                
                // Parse value based on field type
                let numericValue;
                if (fieldId === 'ci-rate-of-return-a' || fieldId === 'ci-rate-of-return-b') {
                    // For percentage fields, use parseFloat directly
                    numericValue = parseFloat(rawValue);
                } else if (fieldId === 'ci-years-to-grow') {
                    // For years field, use parseInt
                    numericValue = parseInt(rawValue, 10);
                } else {
                    // For currency fields, use parseCurrencyValue (handles commas)
                    numericValue = this.parseCurrencyValue(rawValue);
                }
                
                // Check if value is valid number
                if (isNaN(numericValue) || numericValue < 0) {
                    allFieldsValid = false;
                    return; // Continue to next field
                }
                
                // Check specific limits for each field type
                switch (fieldId) {
                    case 'ci-initial-investment-a':
                    case 'ci-initial-investment-b':
                        if (numericValue > 10000000) allFieldsValid = false;
                        break;
                    case 'ci-annual-contribution-a':
                    case 'ci-annual-contribution-b':
                        if (numericValue > 1000000) allFieldsValid = false;
                        break;
                    case 'ci-years-to-grow':
                        if (numericValue < 1 || numericValue > 100) allFieldsValid = false;
                        break;
                    case 'ci-rate-of-return-a':
                    case 'ci-rate-of-return-b':
                        if (numericValue > 100) allFieldsValid = false;
                        break;
                }
            }
        });

        // Enable/disable calculate button based on form validity
        if (this.calculateBtn) {
            this.calculateBtn.disabled = !allFieldsValid;
        }

        return allFieldsValid;
    }

    handleCalculate(event) {
        event.preventDefault();
        
        // Double-check form validity before proceeding
        if (!this.checkFormValidity()) {
            return;
        }
        
        if (this.validateForm()) {
            const formData = this.getFormData();
            const results = this.calculateComparison(formData);
            this.displayResults(results, formData);
        }
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
        
        // Generate explanation text
        const explanationText = this.generateExplanationText(results, formData);
        const explanationElement = document.getElementById('ci-explanation-text');
        if (explanationElement) {
            explanationElement.innerHTML = explanationText;
        }
        
        if (this.mainResultSection) {
            this.mainResultSection.style.display = 'block';
        }
        if (this.breakdownSection) {
            this.breakdownSection.style.display = 'block';
        }
        if (this.downloadBtn) {
            this.downloadBtn.style.display = 'block';
        }
        if (this.mainResultSection) {
            this.mainResultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    generateExplanationText(results, formData) {
        const betterOption = results.betterOption;
        const worseOption = betterOption === 'A' ? 'B' : 'A';
        const betterResult = results[`option${betterOption}`];
        const worseResult = results[`option${worseOption}`];
        const betterRate = formData[`option${betterOption}`].rateOfReturn * 100;
        const worseRate = formData[`option${worseOption}`].rateOfReturn * 100;
        
        return `
            <p><strong>Investment Option ${betterOption} is projected to perform better over ${formData.yearsToGrow} years.</strong></p>
            <p>With an expected annual return of ${betterRate.toFixed(1)}%, Option ${betterOption} is projected to grow to ${this.formatCurrency(betterResult.futureValue)}, 
            while Option ${worseOption} with ${worseRate.toFixed(1)}% return is projected to reach ${this.formatCurrency(worseResult.futureValue)}.</p>
            <p><strong>Key insights:</strong></p>
            <ul>
                <li>Option ${betterOption} provides ${this.formatCurrency(results.difference)} more in total value</li>
                <li>Option ${betterOption} generates ${this.formatCurrency(betterResult.totalGain)} in gains vs ${this.formatCurrency(worseResult.totalGain)} for Option ${worseOption}</li>
                <li>The ${(betterRate - worseRate).toFixed(1)} percentage point difference in returns compounds significantly over time</li>
                <li>Both options require the same total contributions of ${this.formatCurrency(betterResult.totalContributed)}</li>
            </ul>
            <p><em>Remember: These projections are based on assumed rates of return. Actual investment performance may vary, and past performance doesn't guarantee future results.</em></p>
        `;
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

    validateForm() {
        let isValid = true;
        const inputs = document.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
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
                maxValue = 10000000; // $10 million
                break;
            case 'ci-annual-contribution-a':
            case 'ci-annual-contribution-b':
                maxValue = 1000000; // $1 million
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
                    input.value = this.formatCurrency(maxValue);
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
                    input.value = this.formatCurrency(numericValue);
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
    
    getFieldDisplayName(fieldId) {
        const fieldNames = {
            'ci-initial-investment-a': 'Initial Investment (Option A)',
            'ci-initial-investment-b': 'Initial Investment (Option B)',
            'ci-annual-contribution-a': 'Annual Contribution (Option A)',
            'ci-annual-contribution-b': 'Annual Contribution (Option B)',
            'ci-years-to-grow': 'Years to Grow',
            'ci-rate-of-return-a': 'Rate of Return (Option A)',
            'ci-rate-of-return-b': 'Rate of Return (Option B)'
        };
        return fieldNames[fieldId] || 'This field';
    }

    validateInput(input) {
        const value = input.value.trim();
        const inputGroup = input.closest('.input-group');
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
        // Reset all input fields
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type === 'number' || input.type === 'text') {
                input.value = '';
            }
        });
        
        if (this.mainResultSection) {
            this.mainResultSection.style.display = 'none';
        }
        if (this.breakdownSection) {
            this.breakdownSection.style.display = 'none';
        }
        if (this.downloadBtn) {
            this.downloadBtn.style.display = 'none';
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
        
        // Reset chart to empty state instead of destroying it
        if (this.chartInstance) {
            this.chartInstance.data.labels = [];
            this.chartInstance.data.datasets[0].data = [];
            this.chartInstance.data.datasets[1].data = [];
            this.chartInstance.update();
        }
        
        // Clear all error states
        const inputGroups = document.querySelectorAll('.ci-input-group');
        inputGroups.forEach(group => {
            group.classList.remove('error');
            const errorElement = group.querySelector('.ci-error-message');
            if (errorElement) {
                errorElement.classList.remove('show');
                errorElement.textContent = '';
            }
        });
        
        // Re-check form validity
        this.checkFormValidity();
        
        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    printResults() {
        window.print();
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
            yPosition += 10;
            
            // Investment Option A
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Investment Option A:', 20, yPosition);
            yPosition += 6;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Initial Investment: ${this.formatCurrency(formData.optionA.initialInvestment)}`, 25, yPosition);
            yPosition += 5;
            doc.text(`• Annual Contribution: ${this.formatCurrency(formData.optionA.annualContribution)}`, 25, yPosition);
            yPosition += 5;
            doc.text(`• Expected Annual Return: ${(formData.optionA.rateOfReturn * 100).toFixed(1)}%`, 25, yPosition);
            yPosition += 8;
            
            // Investment Option B
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Investment Option B:', 20, yPosition);
            yPosition += 6;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Initial Investment: ${this.formatCurrency(formData.optionB.initialInvestment)}`, 25, yPosition);
            yPosition += 5;
            doc.text(`• Annual Contribution: ${this.formatCurrency(formData.optionB.annualContribution)}`, 25, yPosition);
            yPosition += 5;
            doc.text(`• Expected Annual Return: ${(formData.optionB.rateOfReturn * 100).toFixed(1)}%`, 25, yPosition);
            yPosition += 8;
            
            // Investment Timeline
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Investment Timeline: ${formData.yearsToGrow} years`, 20, yPosition);
            yPosition += 12;
            
            // Results Section
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.setFont('helvetica', 'bold');
            doc.text('COMPARISON RESULTS', 20, yPosition);
            yPosition += 10;
            
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
            yPosition += 7;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Investment Option A: ${projectedValueA}`, 25, yPosition);
            yPosition += 5;
            doc.text(`• Investment Option B: ${projectedValueB}`, 25, yPosition);
            yPosition += 8;
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Better Option: ${betterOption}`, 25, yPosition);
            yPosition += 5;
            doc.text(`Advantage: ${this.formatCurrency(difference)}`, 25, yPosition);
            yPosition += 10;
            
            // Add summary section
            doc.setFontSize(12);
            doc.setTextColor(...accentColor);
            doc.setFont('helvetica', 'bold');
            doc.text('SUMMARY', 20, yPosition);
            yPosition += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'normal');
            
            const summaryText = this.generateSummaryText(formData, valueA, valueB, betterOption);
            const splitText = doc.splitTextToSize(summaryText, 170);
            doc.text(splitText, 20, yPosition);
            yPosition += splitText.length * 4 + 10;
            
            // Add disclaimer (no page break check - force single page)
            doc.setFontSize(7);
            doc.setTextColor(...mutedColor);
            doc.setFont('helvetica', 'italic');
            const disclaimer = 'This calculation is for educational purposes only and should not be considered as financial advice. Actual investment returns may vary due to market conditions, fees, taxes, and other factors. Please consult with a financial advisor for personalized investment guidance.';
            const disclaimerText = doc.splitTextToSize(disclaimer, 170);
            doc.text(disclaimerText, 20, yPosition);
            
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
        const contributionsA = document.getElementById('ci-total-contributions-a').textContent;
        const contributionsB = document.getElementById('ci-total-contributions-b').textContent;
        const comparisonTitle = document.getElementById('ci-comparison-title').textContent;
        const differenceAmount = document.getElementById('ci-difference-amount').textContent;
        const explanation = document.getElementById('ci-explanation-text').textContent;
        
        const formData = this.getFormData();
        
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
• ${contributionsA}

• Investment Option B: ${projectedValueB}
• ${contributionsB}

• ${comparisonTitle}: ${differenceAmount} difference

ANALYSIS:
${explanation.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}

---
This analysis is based on the assumed rates of return provided and should be reviewed regularly. Past performance does not guarantee future results.`;
    }
}

// Initialize the calculator when the DOM is loaded
function initializeCalculator() {
    // Check if essential elements exist
    const calculateBtn = document.getElementById('ci-calculateBtn');
    if (!calculateBtn) {
        console.error('Calculator initialization failed: ci-calculateBtn not found');
        return;
    }
    
    new InvestmentComparisonCalculator();
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


// Test function for the provided CSV scenario (for development/debugging)
function runTestScenario() {
    console.log('Running CSV test scenario...');
    
    const calculator = new InvestmentComparisonCalculator();
    
    // Test with CSV data
    const testData = {
        yearsToGrow: 20,
        optionA: {
            initialInvestment: 5000,
            annualContribution: 2000,
            rateOfReturn: 0.09
        },
        optionB: {
            initialInvestment: 5000,
            annualContribution: 2000,
            rateOfReturn: 0.05
        }
    };
    
    const results = calculator.calculateComparison(testData);
    console.log('Expected: Option A: $130,342, Option B: $79,398');
    console.log('Actual: Option A:', calculator.formatCurrency(results.optionA.futureValue), 
                'Option B:', calculator.formatCurrency(results.optionB.futureValue));
}

// Uncomment the line below to run test scenario in the browser console
// runTestScenario();
