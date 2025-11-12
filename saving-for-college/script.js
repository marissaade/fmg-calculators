// College Savings Calculator JavaScript

class CollegeSavingsCalculator {
    constructor() {
        this.calculateBtn = document.getElementById('sfc-calculateBtn');
        this.resultsSection = document.getElementById('sfc-results-section');
        this.resetBtn = document.getElementById('sfc-reset-btn');
        this.printBtn = document.getElementById('sfc-print-btn');
        this.downloadBtn = document.getElementById('sfc-downloadBtn');
        this.placeholderContent = document.querySelector('.sfc-placeholder-content');
        this.chartContainer = document.querySelector('.sfc-chart-container');
        this.chartHeading = document.querySelector('.sfc-chart-section h2');
        this.chartInstance = null; // Store chart instance for updates
        
        // Check if essential elements exist
        if (!this.calculateBtn) {
            console.error('Calculate button not found. Expected ID: sfc-calculateBtn');
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
        
        // Add real-time validation for years input (like age validation in retirement calculator)
        const yearsInput = document.getElementById('sfc-years-until-college');
        if (yearsInput) {
            yearsInput.addEventListener('input', function(e) {
                const value = parseInt(e.target.value);
                if (value > 50) {
                    e.target.value = 50;
                } else if (value < 1 && e.target.value !== '') {
                    e.target.value = 1;
                }
            });
        }
        
        // Add real-time validation for percentage inputs
        const percentageInputs = document.querySelectorAll('#sfc-rate-of-return, #sfc-college-inflation-rate');
        percentageInputs.forEach(input => {
            input.addEventListener('input', function(e) {
                const value = parseFloat(e.target.value);
                if (input.id === 'sfc-rate-of-return' && value > 100) {
                    e.target.value = 100;
                } else if (input.id === 'sfc-college-inflation-rate' && value > 50) {
                    e.target.value = 50;
                } else if (value < 0 && e.target.value !== '') {
                    e.target.value = 0;
                }
            });
        });
        
        // Initial form validity check
        this.checkFormValidity();
    }

    initializeInputFormatting() {
        // Format currency inputs with commas
        const currencyInputs = ['sfc-current-savings', 'sfc-annual-contribution', 'sfc-current-college-cost'];
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

    initializeCustomTooltip() {
        // Create custom tooltip for the calculate button
        if (!this.calculateBtn) return;
        
        // Remove the title attribute to prevent native tooltip
        const tooltipText = this.calculateBtn.getAttribute('title') || 'Please complete all fields above to calculate your college savings projection';
        this.calculateBtn.removeAttribute('title');
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'sfc-custom-tooltip';
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

    initializeEmptyChart() {
        const ctx = document.getElementById('sfc-savings-chart');
        if (!ctx) {
            console.error('Chart canvas not found: sfc-savings-chart');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        
        console.log('Initializing empty chart...');
        
        // Get CSS variables from :root for dynamic colors
        const rootStyles = getComputedStyle(document.documentElement);
        const savingsColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#1a1a1a"; // Fallback color
        const collegeCostColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#10b981"; // Fallback color
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        // Create empty chart with basic structure
        this.chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Total Savings',
                        data: [],
                        borderColor: savingsColor,
                        backgroundColor: 'rgba(34, 34, 34, 0.1)', // Very light gray with 10% opacity
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: savingsColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Annual College Cost',
                        data: [],
                        borderColor: collegeCostColor,
                        backgroundColor: collegeCostColor + '0D', // Add transparency
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: collegeCostColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderDash: [4, 4]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: fontFamily
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        titleFont: {
                            family: fontFamily
                        },
                        bodyFont: {
                            family: fontFamily
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
                                family: fontFamily
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                family: fontFamily
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount ($)',
                            font: {
                                family: fontFamily
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                family: fontFamily
                            },
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        console.log('Empty chart initialized successfully');
    }


    handleCalculate(event) {
        event.preventDefault();
        console.log('Calculate button clicked');
        
        if (this.validateForm()) {
            console.log('Form is valid, proceeding with calculation');
            const formData = this.getFormData();
            const results = this.calculateResults(formData);
            console.log('Calculation results:', results);
            this.displayResults(results, formData);
        } else {
            console.log('Form validation failed');
        }
    }

    getFormData() {
        return {
            currentSavings: this.parseCurrencyValue(document.getElementById('sfc-current-savings').value),
            yearsUntilCollege: parseInt(document.getElementById('sfc-years-until-college').value),
            annualContribution: this.parseCurrencyValue(document.getElementById('sfc-annual-contribution').value),
            rateOfReturn: parseFloat(document.getElementById('sfc-rate-of-return').value) / 100,
            currentCollegeCost: this.parseCurrencyValue(document.getElementById('sfc-current-college-cost').value),
            collegeInflationRate: parseFloat(document.getElementById('sfc-college-inflation-rate').value) / 100
        };
    }

    calculateResults(data) {
        // Formula: Future Annual College Cost = Current Annual College Cost × (1 + College Inflation Rate)^Years Until College
        const futureCollegeCost = data.currentCollegeCost * Math.pow(1 + data.collegeInflationRate, data.yearsUntilCollege);
        
        // Formula: Future Value of Current Savings = Current College Savings × (1 + Annual Rate of Return)^Years Until College
        const futureValueCurrentSavings = data.currentSavings * Math.pow(1 + data.rateOfReturn, data.yearsUntilCollege);
        
        // Formula: Future Value of Annual Contributions = Annual Contribution × [((1 + Annual Rate of Return)^Years Until College - 1) / Annual Rate of Return]
        let futureValueAnnualContributions = 0;
        if (data.rateOfReturn > 0) {
            futureValueAnnualContributions = data.annualContribution * 
                ((Math.pow(1 + data.rateOfReturn, data.yearsUntilCollege) - 1) / data.rateOfReturn);
        } else {
            // If rate of return is 0, it's just the sum of contributions
            futureValueAnnualContributions = data.annualContribution * data.yearsUntilCollege;
        }
        
        // Formula: Projected Savings at College Start = Future Value of Current Savings + Future Value of Annual Contributions
        const projectedSavings = futureValueCurrentSavings + futureValueAnnualContributions;
        
        // Formula: Projected Shortfall or Surplus = Projected Savings at College Start – Future Annual College Cost
        const shortfallOrSurplus = projectedSavings - futureCollegeCost;
        
        // Safety check for Infinity and NaN values
        const safeProjectedSavings = isFinite(projectedSavings) ? Math.round(projectedSavings) : 0;
        const safeFutureCollegeCost = isFinite(futureCollegeCost) ? Math.round(futureCollegeCost) : 0;
        const safeShortfallOrSurplus = isFinite(shortfallOrSurplus) ? Math.round(shortfallOrSurplus) : 0;
        
        return {
            projectedSavings: safeProjectedSavings,
            futureCollegeCost: safeFutureCollegeCost,
            shortfallOrSurplus: safeShortfallOrSurplus,
            isShortfall: safeShortfallOrSurplus < 0
        };
    }

    displayResults(results, formData) {
        // Update result values
        document.getElementById('sfc-projected-savings').textContent = this.formatCurrency(results.projectedSavings);
        document.getElementById('sfc-future-college-cost').textContent = this.formatCurrency(results.futureCollegeCost);
        document.getElementById('sfc-surplus-shortfall-amount').textContent = this.formatCurrency(Math.abs(results.shortfallOrSurplus));
        
        // Update status message based on shortfall/surplus
        const statusMessage = document.getElementById('sfc-status-message');
        if (statusMessage) {
            if (results.isShortfall) {
                statusMessage.textContent = "It looks like you might have a shortfall. That's OK. Don't get discouraged. Remember, every little bit helps. If you want to ramp up your efforts, there are a variety of strategies and tools we can discuss. Congratulations on what you've done so far! You're future student will be thrilled!";
            } else {
                statusMessage.textContent = "Congratulations. It looks like you have made saving for college a priority. It shows! The next question is, \"now what?\" Do you keep putting money aside for college? Do you focus on other financial priorities? There's no easy answer, but you are in a great position to start the discussion!";
            }
        }
        
        // Update status card (only if elements exist)
        const statusCard = document.getElementById('sfc-surplus-shortfall-card');
        const statusTitle = document.getElementById('sfc-surplus-shortfall-title');
        
        if (statusCard && statusTitle) {
        if (results.isShortfall) {
            statusCard.className = 'result-card status-card shortfall';
            statusTitle.textContent = 'Projected Shortfall';
        } else {
            statusCard.className = 'result-card status-card surplus';
            statusTitle.textContent = 'Projected Surplus';
            }
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
            this.chartHeading.style.display = 'block !important';
        }
        
        // Generate explanation text (only if element exists)
        const explanationElement = document.getElementById('sfc-explanation-text');
        if (explanationElement) {
        const explanationText = this.generateExplanationText(results, formData);
            explanationElement.innerHTML = explanationText;
        }
        
        // Show results section
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Change button text to "Recalculate"
        this.calculateBtn.textContent = 'Recalculate';
    }

    generateExplanationText(results, formData) {
        const yearsText = formData.yearsUntilCollege === 1 ? 'year' : 'years';
        const currentSavingsFormatted = this.formatCurrency(formData.currentSavings);
        const annualContributionFormatted = this.formatCurrency(formData.annualContribution);
        
        if (results.isShortfall) {
            const shortfallAmount = this.formatCurrency(Math.abs(results.shortfallOrSurplus));
            const monthlyNeeded = Math.round(Math.abs(results.shortfallOrSurplus) / (formData.yearsUntilCollege * 12));
            
            return `
                <p><strong>You have a projected shortfall of ${shortfallAmount}.</strong></p>
                <p>Based on your current savings of ${currentSavingsFormatted} and planned annual contributions of ${annualContributionFormatted}, 
                you'll have ${this.formatCurrency(results.projectedSavings)} saved when college starts in ${formData.yearsUntilCollege} ${yearsText}.</p>
                <p>However, college costs are projected to be ${this.formatCurrency(results.futureCollegeCost)} per year by then.</p>
                <p><strong>To close this gap, consider:</strong></p>
                <ul>
                    <li>Increasing your annual contribution by approximately ${this.formatCurrency(Math.round(Math.abs(results.shortfallOrSurplus) / formData.yearsUntilCollege))} per year</li>
                    <li>Or adding about ${this.formatCurrency(monthlyNeeded)} per month to your current savings plan</li>
                    <li>Exploring higher-yield investment options to improve your rate of return</li>
                    <li>Looking into college savings tax advantages like 529 plans</li>
                </ul>
            `;
        } else {
            const surplusAmount = this.formatCurrency(results.shortfallOrSurplus);
            
            return `
                <p><strong>Great news! You're on track with a projected surplus of ${surplusAmount}.</strong></p>
                <p>Your current savings of ${currentSavingsFormatted} plus annual contributions of ${annualContributionFormatted} 
                will grow to ${this.formatCurrency(results.projectedSavings)} over the next ${formData.yearsUntilCollege} ${yearsText}.</p>
                <p>This should comfortably cover the projected annual college cost of ${this.formatCurrency(results.futureCollegeCost)}.</p>
                <p><strong>Ways to optimize your plan:</strong></p>
                <ul>
                    <li>Consider if this surplus could cover multiple years of college expenses</li>
                    <li>Explore tax-advantaged college savings accounts like 529 plans</li>
                    <li>Keep reviewing your plan annually as circumstances change</li>
                    <li>Consider saving for additional college expenses like room, board, and books</li>
                </ul>
            `;
        }
    }

    generateChart(formData, results) {
        console.log('generateChart called with:', formData, results);
        
        // Get CSS variables from :root for dynamic colors
        const rootStyles = getComputedStyle(document.documentElement);
        const savingsColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#1a1a1a"; // Fallback color
        const collegeCostColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#10b981"; // Fallback color
        const shortfallColor = rootStyles.getPropertyValue("--paletteColor3").trim() || "#ef4444"; // Fallback color
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        // Generate data points for each year
        const chartData = this.generateChartData(formData);
        console.log('Generated chart data:', chartData);
        
        // Update existing chart with new data
        if (this.chartInstance) {
            console.log('Updating existing chart...');
            this.chartInstance.data.labels = chartData.years;
            this.chartInstance.data.datasets[0].data = chartData.savingsData;
            this.chartInstance.data.datasets[1].data = chartData.collegeCostData;
            
            // Update colors based on shortfall/surplus using dynamic colors
            if (results.isShortfall) {
                this.chartInstance.data.datasets[1].borderColor = shortfallColor;
                this.chartInstance.data.datasets[1].backgroundColor = shortfallColor + '0D';
                this.chartInstance.data.datasets[1].pointBackgroundColor = shortfallColor;
            } else {
                this.chartInstance.data.datasets[1].borderColor = collegeCostColor;
                this.chartInstance.data.datasets[1].backgroundColor = collegeCostColor + '0D';
                this.chartInstance.data.datasets[1].pointBackgroundColor = collegeCostColor;
            }
            
            console.log('Calling chart.update()...');
            this.chartInstance.update();
            console.log('Chart update completed');
        } else {
            // Fallback: create new chart if none exists
            const ctx = document.getElementById('sfc-savings-chart').getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: 'Total Savings',
                        data: chartData.savingsData,
                        borderColor: savingsColor,
                        backgroundColor: 'rgba(34, 34, 34, 0.1)', // Very light gray with 10% opacity
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: savingsColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Annual College Cost',
                        data: chartData.collegeCostData,
                        borderColor: results.isShortfall ? shortfallColor : collegeCostColor,
                        backgroundColor: results.isShortfall ? shortfallColor + '0D' : collegeCostColor + '0D',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: results.isShortfall ? shortfallColor : collegeCostColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderDash: [4, 4]
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
                            size: 13,
                            weight: '500'
                        },
                        bodyFont: {
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
                            text: 'Years from Now',
                            font: {
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
                                size: 11
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount ($)',
                            font: {
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
        const savingsData = [];
        const collegeCostData = [];
        
        // Generate data for each year from now until college
        for (let year = 0; year <= formData.yearsUntilCollege; year++) {
            years.push(year);
            
            // Calculate savings at this point in time
            const futureValueCurrentSavings = formData.currentSavings * Math.pow(1 + formData.rateOfReturn, year);
            
            let futureValueContributions = 0;
            if (year > 0) {
                if (formData.rateOfReturn > 0) {
                    futureValueContributions = formData.annualContribution * 
                        ((Math.pow(1 + formData.rateOfReturn, year) - 1) / formData.rateOfReturn);
                } else {
                    futureValueContributions = formData.annualContribution * year;
                }
            }
            
            const totalSavings = futureValueCurrentSavings + futureValueContributions;
            savingsData.push(Math.round(totalSavings));
            
            // Calculate college cost at this point in time
            const collegeCost = formData.currentCollegeCost * Math.pow(1 + formData.collegeInflationRate, year);
            collegeCostData.push(Math.round(collegeCost));
        }
        
        return {
            years,
            savingsData,
            collegeCostData
        };
    }

    checkFormValidity() {
        const requiredFields = [
            'sfc-current-savings',
            'sfc-years-until-college',
            'sfc-annual-contribution',
            'sfc-rate-of-return',
            'sfc-current-college-cost',
            'sfc-college-inflation-rate'
        ];

        let allFieldsValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Check if field is filled
                if (!field.value || field.value.trim() === '') {
                    allFieldsValid = false;
                } else {
                    // Simple validation - just check if the value is a valid number within reasonable bounds
                    const numericValue = this.parseCurrencyValue(field.value);
                    if (isNaN(numericValue) || numericValue < 0) {
                        allFieldsValid = false;
                    } else {
                        // Check specific limits for each field type
                        switch (fieldId) {
                            case 'sfc-current-savings':
                                if (numericValue > 10000000) allFieldsValid = false;
                                break;
                            case 'sfc-annual-contribution':
                                if (numericValue > 1000000) allFieldsValid = false;
                                break;
                            case 'sfc-current-college-cost':
                                if (numericValue > 200000) allFieldsValid = false;
                                break;
                            case 'sfc-years-until-college':
                                if (numericValue < 1 || numericValue > 50) allFieldsValid = false;
                                break;
                            case 'sfc-rate-of-return':
                                if (numericValue > 100) allFieldsValid = false;
                                break;
                            case 'sfc-college-inflation-rate':
                                if (numericValue > 50) allFieldsValid = false;
                                break;
                        }
                    }
                }
            }
        });

        // Enable/disable calculate button based on form validity
        if (this.calculateBtn) {
            this.calculateBtn.disabled = !allFieldsValid;
        }

        return allFieldsValid;
    }

    validateForm() {
        // Use the same validation logic as checkFormValidity
        return this.checkFormValidity();
    }

    validateAndCapInput(input) {
        const value = input.value.trim();
        const numericValue = this.parseCurrencyValue(value);
        
        // Set reasonable limits based on input type
        let maxValue;
        let minValue = 0;
        
        switch (input.id) {
            case 'sfc-current-savings':
                maxValue = 10000000; // $10 million
                break;
            case 'sfc-annual-contribution':
                maxValue = 1000000; // $1 million
                break;
            case 'sfc-current-college-cost':
                maxValue = 200000; // $200K
                break;
            case 'sfc-years-until-college':
                maxValue = 50;
                minValue = 1;
                break;
            case 'sfc-rate-of-return':
                maxValue = 100; // 100%
                break;
            case 'sfc-college-inflation-rate':
                maxValue = 50; // 50%
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
                if (input.type === 'text' && (input.id.includes('currency') || input.id.includes('savings') || input.id.includes('contribution') || input.id.includes('cost'))) {
                    input.value = this.formatCurrency(numericValue);
                }
            }
        }
        
        // Run normal validation
        return this.validateInput(input);
    }

    validateInput(input, silent = false) {
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
            switch (input.id) {
                case 'sfc-current-savings':
                    const savingsValue = this.parseCurrencyValue(value);
                    if (savingsValue < 0) {
                        errorMessage = 'Savings amount cannot be negative.';
                        isValid = false;
                    } else if (savingsValue > 10000000) {
                        errorMessage = 'Savings amount cannot exceed $10,000,000.';
                        isValid = false;
                    }
                    break;
                    
                case 'sfc-annual-contribution':
                    const contributionValue = this.parseCurrencyValue(value);
                    if (contributionValue < 0) {
                        errorMessage = 'Annual contribution cannot be negative.';
                        isValid = false;
                    } else if (contributionValue > 1000000) {
                        errorMessage = 'Annual contribution cannot exceed $1,000,000.';
                        isValid = false;
                    }
                    break;
                    
                case 'sfc-current-college-cost':
                    const costValue = this.parseCurrencyValue(value);
                    if (costValue < 0) {
                        errorMessage = 'College cost cannot be negative.';
                        isValid = false;
                    } else if (costValue > 200000) {
                        errorMessage = 'Annual college cost cannot exceed $200,000.';
                        isValid = false;
                    }
                    break;
                    
                case 'sfc-years-until-college':
                    const years = parseInt(value);
                    if (years < 1 || years > 50) {
                        errorMessage = 'Years until college must be between 1 and 50.';
                        isValid = false;
                    }
                    break;
                    
                case 'sfc-rate-of-return':
                    const returnRate = parseFloat(value);
                    if (returnRate < 0 || returnRate > 100) {
                        errorMessage = 'Rate of return must be between 0% and 100%.';
                        isValid = false;
                    }
                    break;
                    
                case 'sfc-college-inflation-rate':
                    const inflationRate = parseFloat(value);
                    if (inflationRate < 0 || inflationRate > 50) {
                        errorMessage = 'Inflation rate must be between 0% and 50%.';
                        isValid = false;
                    }
                    break;
            }
        }
        
        if (!isValid && !silent) {
            this.showError(input, errorMessage);
        }
        
        return isValid;
    }

    showCappedValueAlert(input, maxValue) {
        // Create a temporary visual alert
        const inputGroup = input.closest('.sfc-input-group');
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
            'sfc-current-savings': 'Current College Savings',
            'sfc-annual-contribution': 'Annual Contribution',
            'sfc-current-college-cost': 'Current Annual College Cost',
            'sfc-years-until-college': 'Years Until College',
            'sfc-rate-of-return': 'Expected Annual Rate of Return',
            'sfc-college-inflation-rate': 'Projected College Inflation Rate'
        };
        return fieldNames[fieldId] || 'This field';
    }

    showError(input, message) {
        const inputGroup = input.closest('.sfc-input-group');
        if (!inputGroup) {
            console.warn('Input group not found for input:', input);
            return;
        }
        
        // Add error class to input group
        inputGroup.classList.add('error');
        
        // Only try to show error message if element exists
        const errorElement = inputGroup.querySelector('.sfc-error-message');
        if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        }
    }

    clearError(input) {
        const inputGroup = input.closest('.sfc-input-group');
        if (!inputGroup) {
            return;
        }
        
        // Remove error class from input group
        inputGroup.classList.remove('error');
        
        // Only try to clear error message if it exists
        const errorElement = inputGroup.querySelector('.sfc-error-message');
        if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.textContent = '';
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
        // Clear all input fields
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        
        // Hide results section
        if (this.resultsSection) {
        this.resultsSection.style.display = 'none';
        }
        
        // Show placeholder content and hide chart
        if (this.placeholderContent) {
            this.placeholderContent.style.display = 'block';
        }
        if (this.chartContainer) {
            this.chartContainer.style.display = 'none';
        }
        if (this.chartHeading) {
            this.chartHeading.style.display = 'none !important';
        }
        
        // Clear chart data and reset to empty state
        if (this.chartInstance) {
            this.chartInstance.data.labels = [];
            this.chartInstance.data.datasets[0].data = [];
            this.chartInstance.data.datasets[1].data = [];
            this.chartInstance.update();
        }
        
        // Clear all error states
        const inputGroups = document.querySelectorAll('.sfc-input-group');
        inputGroups.forEach(group => {
            group.classList.remove('error', 'value-capped');
            const errorElement = group.querySelector('.sfc-error-message');
            if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
            }
        });
        
        // Reset button state
        if (this.calculateBtn) {
            this.calculateBtn.disabled = true;
            this.calculateBtn.textContent = 'Calculate';
        }
        
        // Scroll back to top of calculator
        const calculator = document.querySelector('.sfc-calculator-layout');
        if (calculator) {
            calculator.scrollIntoView({ behavior: 'smooth' });
        }
    }

    printResults() {
        window.print();
    }

    downloadResults() {
        console.log('Download button clicked');
        
        // Show notification before download
        const userConfirmed = confirm('Your college savings projection will be downloaded as a PDF file. This may take a moment to generate. Continue?');
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
            doc.text('College Savings Calculator Results', 20, 25);

            // Date
            doc.setFontSize(10);
            doc.setTextColor(...mutedColor);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

            // Get form data and results
            const formData = this.getFormData();
            const results = this.calculateResults(formData);

            // PDF Spacing Constants - See pdf-spacing-system.md for documentation
            const PDF_SPACING = {
                SECTION_GAP: 20,           // Space between major sections
                HEADER_TO_CONTENT: 8,      // Space from section header to its content
                CONTENT_LINE_HEIGHT: 7,    // Slightly tightened line height for input/projection content
                SUMMARY_LINE_HEIGHT: 1.5,  // Line height factor for summary text
                CHART_HEIGHT: 100,         // Fixed chart height in PDF
                CHART_TO_DISCLAIMER: 10    // Space between chart and disclaimer text
            };
            let yPosition = 45; // Slightly moved up from 50

            // Input Values Section (Left side)
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Input Values', 20, yPosition);

            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'normal');

            yPosition += PDF_SPACING.HEADER_TO_CONTENT;
            doc.text(`Current College Savings: ${this.formatCurrency(formData.currentSavings)}`, 20, yPosition);
            yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Years Until College: ${formData.yearsUntilCollege}`, 20, yPosition);
            yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Annual Contribution: ${this.formatCurrency(formData.annualContribution)}`, 20, yPosition);
            yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Expected Annual Rate of Return: ${(formData.rateOfReturn * 100).toFixed(1)}%`, 20, yPosition);
            yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Current Annual College Cost: ${this.formatCurrency(formData.currentCollegeCost)}`, 20, yPosition);
            yPosition += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Projected College Inflation Rate: ${(formData.collegeInflationRate * 100).toFixed(1)}%`, 20, yPosition);

            // Results Section (Right side)
            let resultsY = 45; // Slightly moved up from 50
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Projection Results', 110, resultsY);

            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'normal');

            resultsY += PDF_SPACING.HEADER_TO_CONTENT;
            doc.text(`Projected Savings at College Start: ${this.formatCurrency(results.projectedSavings)}`, 110, resultsY);
            resultsY += PDF_SPACING.CONTENT_LINE_HEIGHT;
            doc.text(`Future Annual College Cost: ${this.formatCurrency(results.futureCollegeCost)}`, 110, resultsY);
            resultsY += PDF_SPACING.CONTENT_LINE_HEIGHT;

            const title = results.isShortfall ? 'Projected Shortfall' : 'Projected Surplus';
            const amount = Math.abs(results.shortfallOrSurplus);
            doc.text(`${title}: ${this.formatCurrency(amount)}`, 110, resultsY);

            // Next section starts after the taller of the two columns with more spacing
            yPosition = Math.max(yPosition, resultsY) + 12; // Increased spacing for summary

            // Summary section (full width)
            doc.setFontSize(12);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 20, yPosition);

            yPosition += PDF_SPACING.HEADER_TO_CONTENT;
            doc.setFontSize(10);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'normal');

            const summaryText = this.generateSummaryText(formData, results);
            const splitText = doc.splitTextToSize(summaryText, 170);
            doc.text(splitText, 20, yPosition, { lineHeightFactor: PDF_SPACING.SUMMARY_LINE_HEIGHT });

            // Chart section starts after summary with more spacing
            yPosition += splitText.length * PDF_SPACING.CONTENT_LINE_HEIGHT + PDF_SPACING.SECTION_GAP + 5; // Added extra 5px spacing
            // Move chart and its header up by 25px
            yPosition -= 25;

            if (this.chartInstance && this.chartInstance.canvas) {
                try {
                    const chartImage = this.chartInstance.canvas.toDataURL('image/png');
                    doc.setFontSize(12);
                    doc.setTextColor(...primaryColor);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Savings Growth Projection', 20, yPosition);

                    yPosition += PDF_SPACING.HEADER_TO_CONTENT;
                    // Chart with proper aspect ratio (width only, height auto-scales)
                    doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 0);

                    // Move disclaimer to bottom of page
                    const pageHeight = doc.internal.pageSize.height;
                    const disclaimerY = pageHeight - 20; // 20px from bottom
                    doc.setFontSize(8);
                    doc.setTextColor(...mutedColor);
                    doc.text('This analysis is based on the assumptions provided and should be reviewed regularly as circumstances change.', 20, disclaimerY);
                } catch (chartError) {
                    console.warn('Could not add chart to PDF:', chartError);
                }
            }
            
            // Save the PDF
            doc.save('college-savings-results.pdf');
            console.log('PDF download completed successfully');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback to text download if PDF fails
            this.downloadResultsAsText();
        }
    }

    generateSummaryText(formData, results) {
        const yearsText = formData.yearsUntilCollege === 1 ? 'year' : 'years';
        
        if (results.isShortfall) {
            const shortfallAmount = this.formatCurrency(Math.abs(results.shortfallOrSurplus));
            const monthlyNeeded = Math.round(Math.abs(results.shortfallOrSurplus) / (formData.yearsUntilCollege * 12));
            
            return `You have a projected shortfall of ${shortfallAmount}. Based on your current savings of ${this.formatCurrency(formData.currentSavings)} and planned annual contributions of ${this.formatCurrency(formData.annualContribution)}, you'll have ${this.formatCurrency(results.projectedSavings)} saved when college starts in ${formData.yearsUntilCollege} ${yearsText}. However, college costs are projected to be ${this.formatCurrency(results.futureCollegeCost)} per year by then. To close this gap, consider increasing your annual contribution by approximately ${this.formatCurrency(Math.round(Math.abs(results.shortfallOrSurplus) / formData.yearsUntilCollege))} per year, or adding about ${this.formatCurrency(monthlyNeeded)} per month to your current savings plan.`;
        } else {
            const surplusAmount = this.formatCurrency(results.shortfallOrSurplus);
            
            return `Great news! You have a projected surplus of ${surplusAmount}. Based on your current savings of ${this.formatCurrency(formData.currentSavings)} and planned annual contributions of ${this.formatCurrency(formData.annualContribution)}, you'll have ${this.formatCurrency(results.projectedSavings)} saved when college starts in ${formData.yearsUntilCollege} ${yearsText}. College costs are projected to be ${this.formatCurrency(results.futureCollegeCost)} per year by then, so you're on track to meet your college savings goals.`;
        }
    }

    downloadResultsAsText() {
        const results = this.getResultsForDownload();
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'college-savings-results.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Text download completed successfully');
    }

    getResultsForDownload() {
        const projectedSavings = document.getElementById('sfc-projected-savings').textContent;
        const futureCollegeCost = document.getElementById('sfc-future-college-cost').textContent;
        const surplusShortfall = document.getElementById('sfc-surplus-shortfall-amount').textContent;
        
        // Get form data to determine if it's a shortfall or surplus
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        const title = results.isShortfall ? 'Projected Shortfall' : 'Projected Surplus';
        
        return `COLLEGE SAVINGS CALCULATOR RESULTS
Generated on: ${new Date().toLocaleDateString()}

INPUT VALUES:
• Current College Savings: ${this.formatCurrency(formData.currentSavings)}
• Years Until College: ${formData.yearsUntilCollege}
• Annual Contribution: ${this.formatCurrency(formData.annualContribution)}
• Expected Annual Rate of Return: ${(formData.rateOfReturn * 100).toFixed(1)}%
• Current Annual College Cost: ${this.formatCurrency(formData.currentCollegeCost)}
• Projected College Inflation Rate: ${(formData.collegeInflationRate * 100).toFixed(1)}%

PROJECTION RESULTS:
• Projected Savings at College Start: ${projectedSavings}
• Future Annual College Cost: ${futureCollegeCost}
• ${title}: ${surplusShortfall}

---
This analysis is based on the assumptions provided and should be reviewed regularly as circumstances change.`;
    }
}

// Initialize the calculator when the DOM is loaded
function initializeCalculator() {
    console.log('Attempting to initialize College Savings Calculator...');
    
    // Check if essential elements exist
    const calculateBtn = document.getElementById('sfc-calculateBtn');
    if (!calculateBtn) {
        console.error('Calculator initialization failed: sfc-calculateBtn not found');
        console.log('Available elements with sfc- prefix:', 
            Array.from(document.querySelectorAll('[id^="sfc-"]')).map(el => el.id));
        return;
    }
    
    console.log('Essential elements found, initializing calculator...');
    const calculator = new CollegeSavingsCalculator();
    console.log('Calculator initialized:', calculator);
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

// Test function for the provided scenarios (for development/debugging)
function runTestScenarios() {
    console.log('Running test scenarios...');
    
    const calculator = new CollegeSavingsCalculator();
    
    // Test Scenario 1 (Expected Surplus)
    const test1 = calculator.calculateResults({
        currentSavings: 5000,
        yearsUntilCollege: 10,
        annualContribution: 2400,
        rateOfReturn: 0.07,
        currentCollegeCost: 25000,
        collegeInflationRate: 0.04
    });
    console.log('Test 1 - Expected: Future Cost: $37,006, Projected Savings: $42,994, Surplus: $5,988');
    console.log('Test 1 - Actual:', test1);
    
    // Test Scenario 2 (Expected Shortfall)
    const test2 = calculator.calculateResults({
        currentSavings: 1000,
        yearsUntilCollege: 15,
        annualContribution: 1200,
        rateOfReturn: 0.05,
        currentCollegeCost: 40000,
        collegeInflationRate: 0.06
    });
    console.log('Test 2 - Expected: Future Cost: $95,862, Projected Savings: $27,974, Shortfall: $67,888');
    console.log('Test 2 - Actual:', test2);
    
    // Test Scenario 3 (No Current Savings)
    const test3 = calculator.calculateResults({
        currentSavings: 0,
        yearsUntilCollege: 18,
        annualContribution: 3000,
        rateOfReturn: 0.06,
        currentCollegeCost: 30000,
        collegeInflationRate: 0.05
    });
    console.log('Test 3 - Expected: Future Cost: $72,199, Projected Savings: $92,717, Surplus: $20,518');
    console.log('Test 3 - Actual:', test3);
}

// Uncomment the line below to run test scenarios in the browser console
// runTestScenarios();
