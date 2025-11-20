// College Savings Calculator JavaScript

class CollegeSavingsCalculator {
    constructor() {
        this.resetBtn = document.getElementById('sfc-reset-btn');
        this.downloadBtn = document.getElementById('sfc-downloadBtn');
        this.chartToggle = document.getElementById('sfc-chart-toggle');
        this.chartSection = document.querySelector('.sfc-chart-section');
        this.chartInstance = null;
        this.calculationTimeout = null;
        this.resizeTimeout = null;
        
        this.defaultValues = {
            'sfc-current-savings': '5000',
            'sfc-years-until-college': '15',
            'sfc-annual-contribution': '2400',
            'sfc-rate-of-return': '7',
            'sfc-current-college-cost': '25000',
            'sfc-college-inflation-rate': '5'
        };
        
        this.diagnoseStickyPositioning();
        this.initializeInputFormatting();
        this.initializeSliders();
        this.initializeTooltips();
        this.initializeEventListeners();
        this.initializeChart();
        this.calculateOnLoad();
    }

    diagnoseStickyPositioning() {
        // Only apply on desktop (viewport width > 750px)
        if (window.innerWidth <= 750) {
            const resultsColumn = document.querySelector('.sfc-results-column');
            if (resultsColumn) {
                resultsColumn.style.minHeight = '0';
            }
            return;
        }
        
        const formColumn = document.querySelector('.sfc-form-column');
        const resultsColumn = document.querySelector('.sfc-results-column');
        const layoutContainer = document.querySelector('.sfc-calculator-layout');
        
        if (!formColumn || !resultsColumn || !layoutContainer) return;
        
        const formHeight = formColumn.getBoundingClientRect().height;
        const resultsHeight = resultsColumn.getBoundingClientRect().height;
        
        // If form column is taller than results column
        if (formHeight >= resultsHeight) {
            const viewportHeight = window.innerHeight;
            // Add min-height to results column to create scrollable space
            resultsColumn.style.minHeight = (formHeight + viewportHeight * 0.5) + 'px';
        }
    }

    initializeEventListeners() {
        // Window resize handler for sticky positioning
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.diagnoseStickyPositioning();
            }, 250);
        });
        
        if (this.resetBtn) {
        this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        if (this.downloadBtn) {
        this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Mobile button event listeners
        const resetBtnMobile = document.getElementById('sfc-reset-btn-mobile');
        const downloadBtnMobile = document.getElementById('sfc-downloadBtn-mobile');
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        if (downloadBtnMobile) {
            downloadBtnMobile.addEventListener('click', () => this.downloadResults());
        }
        
        if (this.chartToggle) {
            this.chartToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChart();
            });
        }
        
        const chartHeader = document.querySelector('.sfc-chart-header');
        if (chartHeader && this.chartToggle) {
            chartHeader.addEventListener('click', (e) => {
                if (e.target !== this.chartToggle && !this.chartToggle.contains(e.target)) {
                    this.toggleChart();
                }
            });
        }
        
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                if (input.type === 'text') {
                    e.target.select();
                }
            });
            
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
        
        const yearsInput = document.getElementById('sfc-years-until-college');
        if (yearsInput) {
            yearsInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                const numValue = parseInt(value);
                if (value && !isNaN(numValue)) {
                    if (numValue > 50) {
                        value = '50';
                    } else if (numValue < 1) {
                        value = '1';
                    }
                }
                e.target.value = value;
            });
        }
        
        const percentageInputs = document.querySelectorAll('#sfc-rate-of-return, #sfc-college-inflation-rate');
        percentageInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^\d.]/g, '');
                const numValue = parseFloat(value);
                if (value && !isNaN(numValue)) {
                    if (input.id === 'sfc-rate-of-return' && numValue > 100) {
                        value = '100';
                    } else if (input.id === 'sfc-college-inflation-rate' && numValue > 50) {
                        value = '50';
                    } else if (numValue < 0) {
                        value = '0';
                    }
                }
                e.target.value = value;
            });
        });
    }

    initializeInputFormatting() {
        const currencyInputs = ['sfc-current-savings', 'sfc-annual-contribution', 'sfc-current-college-cost'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
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
            const numValue = parseInt(value);
            let maxValue;
            
            if (input.id === 'sfc-current-savings') {
                maxValue = 500000;
            } else if (input.id === 'sfc-annual-contribution') {
                maxValue = 100000;
            } else if (input.id === 'sfc-current-college-cost') {
                maxValue = 200000;
            }
            
            if (maxValue && numValue > maxValue) {
                value = maxValue.toString();
            }
            
            if (value && value !== '0') {
                input.value = parseInt(value).toLocaleString();
            } else if (value === '0') {
                input.value = '0';
            }
        } else {
            input.value = '';
        }
        
        this.updateSliderFromInput(input);
        this.checkFormValidity();
    }

    handleCurrencyFocus(event) {
        const input = event.target;
        input.select();
        input.value = input.value.replace(/,/g, '');
    }

    parseCurrencyValue(value) {
        return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    }

    calculateOnLoad() {
        const currencyInputs = ['sfc-current-savings', 'sfc-annual-contribution', 'sfc-current-college-cost'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.value) {
                const numericValue = parseFloat(input.value.replace(/[^\d]/g, '')) || 0;
                if (numericValue > 0) {
                    input.value = numericValue.toLocaleString();
                }
            }
        });
        
        const currentSavingsInput = document.getElementById('sfc-current-savings');
        const annualContributionInput = document.getElementById('sfc-annual-contribution');
        if (currentSavingsInput) {
            this.updateSliderFromInput(currentSavingsInput);
        }
        if (annualContributionInput) {
            this.updateSliderFromInput(annualContributionInput);
        }
        
        this.calculateAndDisplay();
    }

    calculateAndDisplay() {
        if (!this.hasValidInputs()) {
            return;
        }
        
            const formData = this.getFormData();
            const results = this.calculateResults(formData);
            this.displayResults(results, formData);
        }

    hasValidInputs() {
        const currentSavings = this.parseCurrencyValue(document.getElementById('sfc-current-savings').value);
        const yearsUntilCollege = parseInt(document.getElementById('sfc-years-until-college').value);
        const annualContribution = this.parseCurrencyValue(document.getElementById('sfc-annual-contribution').value);
        const rateOfReturn = parseFloat(document.getElementById('sfc-rate-of-return').value);
        const currentCollegeCost = this.parseCurrencyValue(document.getElementById('sfc-current-college-cost').value);
        const collegeInflationRate = parseFloat(document.getElementById('sfc-college-inflation-rate').value);
        
        return !isNaN(currentSavings) && currentSavings >= 0 &&
               !isNaN(yearsUntilCollege) && yearsUntilCollege >= 1 && yearsUntilCollege <= 50 &&
               !isNaN(annualContribution) && annualContribution >= 0 &&
               !isNaN(rateOfReturn) && rateOfReturn >= 0 && rateOfReturn <= 100 &&
               !isNaN(currentCollegeCost) && currentCollegeCost >= 0 &&
               !isNaN(collegeInflationRate) && collegeInflationRate >= 0 && collegeInflationRate <= 50;
    }

    initializeSliders() {
        const sliderPairs = [
            { slider: 'sfc-current-savings-slider', input: 'sfc-current-savings', max: 500000 },
            { slider: 'sfc-annual-contribution-slider', input: 'sfc-annual-contribution', max: 100000 }
        ];
        
        sliderPairs.forEach(pair => {
            const slider = document.getElementById(pair.slider);
            const input = document.getElementById(pair.input);
            
            if (slider && input) {
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
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
        
        if (input.id === 'sfc-current-savings') {
            sliderId = 'sfc-current-savings-slider';
        } else if (input.id === 'sfc-annual-contribution') {
            sliderId = 'sfc-annual-contribution-slider';
        }
        
        if (sliderId) {
            const slider = document.getElementById(sliderId);
            if (slider && !isNaN(value)) {
                slider.value = value;
            }
        }
    }

    initializeTooltips() {
        const tooltips = document.querySelectorAll('.sfc-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isActive = tooltip.classList.contains('active');
                document.querySelectorAll('.sfc-tooltip').forEach(t => t.classList.remove('active'));
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sfc-tooltip')) {
                document.querySelectorAll('.sfc-tooltip').forEach(t => t.classList.remove('active'));
            }
        });
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
        this.initializeEmptyChart();
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
        
        const rootStyles = getComputedStyle(document.documentElement);
        const savingsColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#1a1a1a";
        const collegeCostColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#10b981";
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        this.chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Total Savings',
                        data: [],
                        borderColor: savingsColor,
                        backgroundColor: 'rgba(34, 34, 34, 0.1)',
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
                        backgroundColor: collegeCostColor + '0D',
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
        const futureCollegeCost = data.currentCollegeCost * Math.pow(1 + data.collegeInflationRate, data.yearsUntilCollege);
        const futureValueCurrentSavings = data.currentSavings * Math.pow(1 + data.rateOfReturn, data.yearsUntilCollege);
        
        let futureValueAnnualContributions = 0;
        if (data.rateOfReturn > 0) {
            futureValueAnnualContributions = data.annualContribution * 
                ((Math.pow(1 + data.rateOfReturn, data.yearsUntilCollege) - 1) / data.rateOfReturn);
        } else {
            futureValueAnnualContributions = data.annualContribution * data.yearsUntilCollege;
        }
        
        const projectedSavings = futureValueCurrentSavings + futureValueAnnualContributions;
        const shortfallOrSurplus = projectedSavings - futureCollegeCost;
        
        return {
            projectedSavings: isFinite(projectedSavings) ? Math.round(projectedSavings) : 0,
            futureCollegeCost: isFinite(futureCollegeCost) ? Math.round(futureCollegeCost) : 0,
            shortfallOrSurplus: isFinite(shortfallOrSurplus) ? Math.round(shortfallOrSurplus) : 0,
            isShortfall: shortfallOrSurplus < 0
        };
    }

    displayResults(results, formData) {
        document.getElementById('sfc-projected-savings').textContent = this.formatCurrency(results.projectedSavings);
        document.getElementById('sfc-future-college-cost').textContent = this.formatCurrency(results.futureCollegeCost);
        document.getElementById('sfc-surplus-shortfall-amount').textContent = this.formatCurrency(Math.abs(results.shortfallOrSurplus));
        
        const statusMessage = document.getElementById('sfc-status-message');
        if (statusMessage) {
        if (results.isShortfall) {
                statusMessage.textContent = "It looks like you might have a shortfall. That's OK. Don't get discouraged. Remember, every little bit helps. If you want to ramp up your efforts, there are a variety of strategies and tools we can discuss. Congratulations on what you've done so far! You're future student will be thrilled!";
        } else {
                statusMessage.textContent = "Congratulations. It looks like you have made saving for college a priority. It shows! The next question is, \"now what?\" Do you keep putting money aside for college? Do you focus on other financial priorities? There's no easy answer, but you are in a great position to start the discussion!";
            }
        }
        
        this.generateChart(formData, results);
    }

    generateChart(formData, results) {
        const rootStyles = getComputedStyle(document.documentElement);
        const savingsColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#1a1a1a";
        const collegeCostColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#10b981";
        const shortfallColor = rootStyles.getPropertyValue("--paletteColor3").trim() || "#ef4444";
        const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        
        const chartData = this.generateChartData(formData);
        
        if (this.chartInstance) {
            this.chartInstance.data.labels = chartData.years;
            this.chartInstance.data.datasets[0].data = chartData.savingsData;
            this.chartInstance.data.datasets[1].data = chartData.collegeCostData;
        
        if (results.isShortfall) {
                this.chartInstance.data.datasets[1].borderColor = shortfallColor;
                this.chartInstance.data.datasets[1].backgroundColor = shortfallColor + '0D';
                this.chartInstance.data.datasets[1].pointBackgroundColor = shortfallColor;
        } else {
                this.chartInstance.data.datasets[1].borderColor = collegeCostColor;
                this.chartInstance.data.datasets[1].backgroundColor = collegeCostColor + '0D';
                this.chartInstance.data.datasets[1].pointBackgroundColor = collegeCostColor;
            }
            
            this.chartInstance.update();
        } else {
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
                            backgroundColor: 'rgba(34, 34, 34, 0.1)',
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
        
        for (let year = 0; year <= formData.yearsUntilCollege; year++) {
            years.push(year);
            
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
                if (!field.value || field.value.trim() === '') {
                    allFieldsValid = false;
                } else {
                    const isCurrencyField = fieldId === 'sfc-current-savings' || 
                                          fieldId === 'sfc-annual-contribution' || 
                                          fieldId === 'sfc-current-college-cost';
                    const numericValue = isCurrencyField 
                        ? this.parseCurrencyValue(field.value)
                        : (fieldId === 'sfc-years-until-college' 
                            ? parseInt(field.value) 
                            : parseFloat(field.value));
                    
                    if (isNaN(numericValue) || numericValue < 0) {
                        allFieldsValid = false;
                    } else {
                        switch (fieldId) {
                            case 'sfc-current-savings':
                                if (numericValue > 500000) allFieldsValid = false;
                                break;
                            case 'sfc-annual-contribution':
                                if (numericValue > 100000) allFieldsValid = false;
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

        return allFieldsValid;
    }

    validateAndCapInput(input) {
        const value = input.value.trim();
        const numericValue = this.parseCurrencyValue(value);
        
        let maxValue;
        let minValue = 0;
        
        switch (input.id) {
            case 'sfc-current-savings':
                maxValue = 10000000;
                break;
            case 'sfc-annual-contribution':
                maxValue = 1000000;
                break;
            case 'sfc-current-college-cost':
                maxValue = 200000;
                break;
            case 'sfc-years-until-college':
                maxValue = 50;
                minValue = 1;
                break;
            case 'sfc-rate-of-return':
                maxValue = 100;
                break;
            case 'sfc-college-inflation-rate':
                maxValue = 50;
                break;
            default:
                return this.validateInput(input);
        }
        
        if (!isNaN(numericValue)) {
            if (numericValue > maxValue) {
                if (input.type === 'number') {
                    input.value = maxValue.toString();
                } else {
                    input.value = maxValue.toLocaleString();
                }
                
                this.showCappedValueAlert(input, maxValue);
                this.showError(input, `⚠️ Value automatically capped at ${this.formatCurrency(maxValue)}`);
                setTimeout(() => this.clearError(input), 4000);
            } else if (numericValue < minValue) {
                input.value = minValue.toString();
                this.showError(input, `⚠️ Value cannot be less than ${minValue}`);
                setTimeout(() => this.clearError(input), 3000);
            } else {
                if (input.type === 'text' && (input.id.includes('currency') || input.id.includes('savings') || input.id.includes('contribution') || input.id.includes('cost'))) {
                    input.value = numericValue.toLocaleString();
                }
            }
        }
        
        return this.validateInput(input);
    }

    validateInput(input, silent = false) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        this.clearError(input);
        
        if (!value) {
            errorMessage = 'This field is required.';
            isValid = false;
        } else {
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
        const inputGroup = input.closest('.sfc-input-group');
        if (!inputGroup) return;
        
        inputGroup.classList.add('value-capped');
        input.style.backgroundColor = '#fff3cd';
        input.style.borderColor = '#ffc107';
        
        setTimeout(() => {
            input.style.backgroundColor = '';
            input.style.borderColor = '';
            inputGroup.classList.remove('value-capped');
        }, 1000);
    }

    showError(input, message) {
        const inputGroup = input.closest('.sfc-input-group');
        if (!inputGroup) {
            console.warn('Input group not found for input:', input);
            return;
        }
        
        inputGroup.classList.add('error');
        
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
        
        inputGroup.classList.remove('error');
        
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
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const defaultValue = this.defaultValues[id];
                input.value = defaultValue;
                
                if (id === 'sfc-current-savings' || id === 'sfc-annual-contribution' || id === 'sfc-current-college-cost') {
                    const numericValue = parseFloat(defaultValue) || 0;
                    if (numericValue > 0) {
                        input.value = numericValue.toLocaleString();
                    }
                }
            }
        });
        
        const currentSavingsSlider = document.getElementById('sfc-current-savings-slider');
        const annualContributionSlider = document.getElementById('sfc-annual-contribution-slider');
        if (currentSavingsSlider) currentSavingsSlider.value = this.defaultValues['sfc-current-savings'];
        if (annualContributionSlider) annualContributionSlider.value = this.defaultValues['sfc-annual-contribution'];
        
        const inputGroups = document.querySelectorAll('.sfc-input-group');
        inputGroups.forEach(group => {
            group.classList.remove('error', 'value-capped');
            const errorElement = group.querySelector('.sfc-error-message');
            if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
            }
        });
        
        this.calculateAndDisplay();
        
        if (window.innerWidth <= 750) {
            const calculator = document.querySelector('.sfc-calculator-layout');
            if (calculator) {
                calculator.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    downloadResults() {
        const userConfirmed = confirm('Your college savings projection will be downloaded as a PDF file. This may take a moment to generate. Continue?');
        if (!userConfirmed) {
            return;
        }
        
        try {
            if (typeof window.jspdf === 'undefined') {
                console.error('jsPDF library not loaded');
                this.downloadResultsAsText();
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setProperties({
                title: 'College Savings Projection',
                subject: 'Financial Calculator Results',
                author: 'FMG Financial Calculators',
                keywords: 'college savings, 529 plan, education savings, financial calculator, college planning',
                creator: 'FMG Financial Calculators'
            });
            
            const primaryColor = [51, 51, 51];
            const mutedColor = [107, 114, 128];
            
            doc.setFontSize(18);
            doc.setTextColor(...primaryColor);
            doc.setFont('helvetica', 'bold');
            doc.text('College Savings Calculator Results', 20, 25);

            doc.setFontSize(10);
            doc.setTextColor(...mutedColor);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

            const formData = this.getFormData();
            const results = this.calculateResults(formData);

            const PDF_SPACING = {
                SECTION_GAP: 20,
                HEADER_TO_CONTENT: 8,
                CONTENT_LINE_HEIGHT: 7,
                SUMMARY_LINE_HEIGHT: 1.5,
                CHART_HEIGHT: 100,
                CHART_TO_DISCLAIMER: 10
            };
            let yPosition = 45;

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

            let resultsY = 45;
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

            yPosition = Math.max(yPosition, resultsY) + 12;

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

            yPosition += splitText.length * PDF_SPACING.CONTENT_LINE_HEIGHT + PDF_SPACING.SECTION_GAP + 5;
            yPosition -= 25;

            if (this.chartInstance && this.chartInstance.canvas) {
                try {
                    const chartImage = this.chartInstance.canvas.toDataURL('image/png');
                    doc.setFontSize(12);
                    doc.setTextColor(...primaryColor);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Savings Growth Projection', 20, yPosition);

                    yPosition += PDF_SPACING.HEADER_TO_CONTENT;
                    doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 0);

                    const pageHeight = doc.internal.pageSize.height;
                    const disclaimerY = pageHeight - 20;
                    doc.setFontSize(8);
                    doc.setTextColor(...mutedColor);
                    doc.text('This analysis is based on the assumptions provided and should be reviewed regularly as circumstances change.', 20, disclaimerY);
                } catch (chartError) {
                    console.warn('Could not add chart to PDF:', chartError);
                }
            }
            
            doc.save('college-savings-results.pdf');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
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
    }

    getResultsForDownload() {
        const projectedSavings = document.getElementById('sfc-projected-savings').textContent;
        const futureCollegeCost = document.getElementById('sfc-future-college-cost').textContent;
        const surplusShortfall = document.getElementById('sfc-surplus-shortfall-amount').textContent;
        
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

function initializeCalculator() {
    const calculator = new CollegeSavingsCalculator();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initializeCalculator();
} else {
    setTimeout(initializeCalculator, 100);
}
