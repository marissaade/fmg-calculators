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
        
        // Realistic caps for other inputs
        this.MAX_IRA_BALANCE = 10000000; // $10 million
        this.MAX_MAGI = 10000000; // $10 million
        
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
        this.diagnoseStickyPositioning();
        this.initializeInputFormatting();
        this.initializeSteppers();
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
        this.chartToggle = document.getElementById('ira-chart-toggle');
        this.chartSection = document.querySelector('.ira-chart-section');
        
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

    diagnoseStickyPositioning() {
        const formColumn = document.querySelector('.ira-form-column');
        const resultsColumn = document.querySelector('.ira-results-column');
        const layoutContainer = document.querySelector('.ira-calculator-layout');
        
        if (!formColumn || !resultsColumn || !layoutContainer) return;
        
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
        // Format currency inputs with commas
        const currencyInputs = ['ira-magi', 'ira-initial-balance', 'ira-annual-contribution'];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Remove commas on focus
                input.addEventListener('focus', (e) => {
                    // Remove commas when focusing for easier editing
                    e.target.value = e.target.value.replace(/,/g, '');
                    // Auto-select entire value on focus for quick overwrite
                    e.target.select();
                });
                
                // Keep removing commas while typing AND trigger calculation
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
                    
                    // Clear any validation errors or info messages while typing
                    this.clearError(e.target);
                    this.clearInfo(e.target);
                    
                    // Trigger debounced calculation
                    clearTimeout(this.calculationTimeout);
                    this.calculationTimeout = setTimeout(() => {
                        this.calculateAndDisplay();
                    }, 300);
                });
                
                // Format with commas on blur and always trigger calculation
                input.addEventListener('blur', (e) => {
                    const value = this.parseCurrencyValue(e.target.value);
                    
                    // Cap Annual Contribution at IRA limit (with info message)
                    if (id === 'ira-annual-contribution') {
                        if (value > this.CONTRIBUTION_LIMIT_2024) {
                            e.target.value = this.CONTRIBUTION_LIMIT_2024.toString();
                            this.showInfo(e.target, `Contribution capped at the 2024 IRA limit of ${this.formatCurrency(this.CONTRIBUTION_LIMIT_2024)}.`);
                        } else {
                            this.clearInfo(e.target);
                        }
                    }
                    
                    // Cap Initial IRA Balance (silent cap, no message)
                    if (id === 'ira-initial-balance' && value > this.MAX_IRA_BALANCE) {
                        e.target.value = this.MAX_IRA_BALANCE.toLocaleString();
                    }
                    
                    // Cap MAGI (silent cap, no message)
                    if (id === 'ira-magi' && value > this.MAX_MAGI) {
                        e.target.value = this.MAX_MAGI.toLocaleString();
                    }
                    
                    this.formatCurrencyInput(e);
                    // Always calculate on blur to ensure results update
                    this.calculateAndDisplay();
                });
            }
        });
        
        // Handle percent input
        const percentInput = document.getElementById('ira-rate-of-return');
        if (percentInput) {
            percentInput.addEventListener('input', (e) => {
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
                
                // Clear any validation errors while typing
                this.clearError(e.target);
                // Don't format while typing - just trigger calculation
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
            percentInput.addEventListener('blur', (e) => {
                this.formatPercentInput(e);
                this.calculateAndDisplay();
            });
            percentInput.addEventListener('focus', (e) => this.handlePercentFocus(e));
        }
        
        // Handle plain number input
        const numberInput = document.getElementById('ira-years-to-contribute');
        if (numberInput) {
            numberInput.addEventListener('input', (e) => {
                // Filter to only allow digits
                const cursorPosition = e.target.selectionStart;
                const oldValue = e.target.value;
                const newValue = oldValue.replace(/[^\d]/g, '');
                
                if (oldValue !== newValue) {
                    e.target.value = newValue;
                    // Adjust cursor position
                    const removedChars = oldValue.substring(0, cursorPosition).replace(/[^\d]/g, '').length;
                    const newCursorPos = Math.min(removedChars, newValue.length);
                    e.target.setSelectionRange(newCursorPos, newCursorPos);
                }
                
                // Clear any validation errors while typing
                this.clearError(e.target);
                // Trigger debounced calculation on input
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 300);
            });
            numberInput.addEventListener('blur', () => {
                this.calculateAndDisplay();
            });
            numberInput.addEventListener('focus', (e) => this.handleNumberFocus(e));
        }
    }
    
    formatPercentInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^\d.]/g, '');
        
        if (value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                // Format to one decimal place on blur
                input.value = numValue.toFixed(1);
            }
        }
    }

    formatCurrencyInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value) {
            // Add commas for display using consistent formatter
            input.value = this.formatNumber(parseInt(value));
        }
    }

    handlePercentFocus(event) {
        const input = event.target;
        // Auto-select entire value on focus for quick overwrite
        input.select();
    }
    
    handleNumberFocus(event) {
        const input = event.target;
        // Auto-select entire value on focus for quick overwrite
        input.select();
    }

    parseCurrencyValue(value) {
        const cleaned = value.replace(/[^\d.]/g, '');
        const result = parseFloat(cleaned) || 0;
        return result;
    }

    initializeSteppers() {
        const stepperButtons = document.querySelectorAll('.ira-stepper-btn');
        stepperButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const stepper = btn.closest('.ira-stepper');
                const inputId = stepper.dataset.stepper;
                const input = document.getElementById(inputId);
                
                if (!input) return;
                
                const action = btn.dataset.stepperAction;
                const min = parseFloat(input.dataset.min) || 0;
                const max = parseFloat(input.dataset.max) || 10000000;
                const step = parseFloat(input.dataset.step) || 1000;
                
                // Parse current value
                let currentValue;
                if (inputId === 'ira-rate-of-return') {
                    currentValue = parseFloat(input.value) || 0;
                } else if (inputId === 'ira-years-to-contribute') {
                    currentValue = parseInt(input.value) || 0;
                } else {
                    currentValue = this.parseCurrencyValue(input.value) || 0;
                }
                
                if (action === 'increment') {
                    currentValue = Math.min(currentValue + step, max);
                } else if (action === 'decrement') {
                    currentValue = Math.max(currentValue - step, min);
                }
                
                // Format based on input type
                if (inputId === 'ira-rate-of-return') {
                    input.value = currentValue.toFixed(1);
                    // Update slider
                    const slider = document.getElementById('ira-rate-of-return-slider');
                    if (slider) slider.value = currentValue;
                } else if (inputId === 'ira-years-to-contribute') {
                    input.value = Math.round(currentValue).toString();
                    // Update slider
                    const slider = document.getElementById('ira-years-to-contribute-slider');
                    if (slider) slider.value = currentValue;
                } else {
                    // Currency input
                    input.value = this.formatNumber(currentValue);
                }
                
                // Trigger calculation with debounce
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.calculateAndDisplay();
                }, 100);
            });
        });
    }
    
    formatNumber(value) {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0
        }).format(value);
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
                        input.value = Math.round(value).toString();
                    }
                    this.clearError(input);
                    clearTimeout(this.calculationTimeout);
                    this.calculationTimeout = setTimeout(() => {
                        this.calculateAndDisplay();
                    }, 300);
                });
                
                // Update slider when input changes (syncing only, calculation handled by initializeInputFormatting)
                input.addEventListener('input', (e) => {
                    let value = parseFloat(e.target.value.replace(/[^\d.]/g, ''));
                    if (!isNaN(value)) {
                        // Cap values to slider range
                        if (pair.input === 'ira-rate-of-return') {
                            value = Math.max(0, Math.min(20, value));
                        } else {
                            value = Math.max(1, Math.min(50, Math.round(value)));
                        }
                        slider.value = value;
                    }
                    // Note: Calculation is triggered by the input event listener in initializeInputFormatting()
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
                    input.value = this.formatNumber(numericValue);
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
        const rateOfReturn = parseFloat(document.getElementById('ira-rate-of-return').value.replace(/[^\d.]/g, ''));
        const yearsToContribute = parseFloat(document.getElementById('ira-years-to-contribute').value.replace(/[^\d]/g, ''));
        
        return magi >= 0 && 
               initialBalance >= 0 && 
               annualContribution >= 0 && 
               !isNaN(rateOfReturn) && rateOfReturn >= 0 && rateOfReturn <= 20 && 
               !isNaN(yearsToContribute) && yearsToContribute >= 1 && yearsToContribute <= 50;
    }

    attachEventListeners() {
        // Start Over button (desktop)
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (desktop)
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Start Over button (mobile)
        const resetBtnMobile = document.getElementById('ira-reset-btn-mobile');
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (mobile)
        const downloadBtnMobile = document.getElementById('ira-downloadBtn-mobile');
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
        const chartHeader = document.querySelector('.ira-chart-header');
        if (chartHeader) {
            chartHeader.addEventListener('click', () => this.toggleChart());
        }
        
        // Initialize tooltips (click/tap only, not hover)
        this.initializeTooltips();
        
        // Note: Event listeners for text inputs are already set up in initializeInputFormatting()
        // and initializeSliders(), so we don't need duplicate listeners here
        
        // Dropdown changes - trigger calculation
        const filingStatus = document.getElementById('ira-filing-status');
        if (filingStatus) {
            filingStatus.addEventListener('change', () => this.calculateAndDisplay());
        }
        const retirementPlan = document.getElementById('ira-retirement-plan');
        if (retirementPlan) {
            retirementPlan.addEventListener('change', () => this.calculateAndDisplay());
        }
        
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
        const value = input.value.trim();
        let numericValue;
        let maxValue;
        let minValue = 0;
        let isPercentage = false;
        let errorMessage = '';
        
        // Determine input type based on ID
        if (input.id === 'ira-magi') {
            numericValue = this.parseCurrencyValue(value);
            maxValue = this.MAX_MAGI;
            if (numericValue < 0) {
                errorMessage = 'Value cannot be negative';
            } else if (numericValue > maxValue) {
                errorMessage = `Value cannot exceed ${this.formatCurrency(maxValue)}`;
            }
        } else if (input.id === 'ira-initial-balance') {
            numericValue = this.parseCurrencyValue(value);
            maxValue = this.MAX_IRA_BALANCE;
            if (numericValue < 0) {
                errorMessage = 'Value cannot be negative';
            } else if (numericValue > maxValue) {
                errorMessage = `Value cannot exceed ${this.formatCurrency(maxValue)}`;
            }
        } else if (input.id === 'ira-annual-contribution') {
            numericValue = this.parseCurrencyValue(value);
            maxValue = this.CONTRIBUTION_LIMIT_2024;
            if (numericValue < 0) {
                errorMessage = 'Value cannot be negative';
            } else if (numericValue > maxValue) {
                errorMessage = `Value cannot exceed ${this.formatCurrency(maxValue)}`;
            }
        } else if (input.id === 'ira-rate-of-return') {
            numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
            maxValue = 20; // 20%
            minValue = 0;
            isPercentage = true;
            if (isNaN(numericValue) && value) {
                errorMessage = 'Please enter a valid number';
            } else if (!isNaN(numericValue)) {
                if (numericValue < minValue) {
                    errorMessage = 'Rate cannot be negative';
                } else if (numericValue > maxValue) {
                    errorMessage = `Please enter a rate between ${minValue}% and ${maxValue}%`;
                }
            }
        } else if (input.id === 'ira-years-to-contribute') {
            numericValue = parseInt(value.replace(/[^\d]/g, ''));
            maxValue = 50; // 50 years
            minValue = 1;
            if (isNaN(numericValue) && value) {
                errorMessage = 'Please enter a valid number';
            } else if (!isNaN(numericValue)) {
                if (numericValue < minValue) {
                    errorMessage = `Please enter a value between ${minValue} and ${maxValue} years`;
                } else if (numericValue > maxValue) {
                    errorMessage = `Please enter a value between ${minValue} and ${maxValue} years`;
                }
            }
        }
        
        if (errorMessage) {
            this.showError(input, errorMessage);
            return false;
        }
        
        // Cap values if needed
        if (value && !isNaN(numericValue)) {
            if (numericValue > maxValue) {
                if (input.id === 'ira-rate-of-return') {
                    input.value = maxValue.toFixed(1);
                } else if (input.id === 'ira-years-to-contribute') {
                    input.value = maxValue.toString();
                } else {
                    input.value = maxValue.toLocaleString();
                }
                this.clearError(input);
            } else if (numericValue < minValue && input.id !== 'ira-years-to-contribute') {
                input.value = '';
            }
        }
        
        return true;
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
    
    showInfo(input, message) {
        // Remove existing info message
        this.clearInfo(input);
        
        // Add info class
        const inputGroup = input.closest('.ira-input-group');
        if (inputGroup) {
            inputGroup.classList.add('info');
        }
        
        // Create info message
        const infoMsg = document.createElement('div');
        infoMsg.className = 'ira-info-message show';
        infoMsg.textContent = message;
        
        // Insert info message after input wrapper
        const inputWrapper = input.closest('.ira-input-wrapper');
        if (inputWrapper && inputGroup) {
            inputWrapper.insertAdjacentElement('afterend', infoMsg);
        }
    }
    
    clearInfo(input) {
        const inputGroup = input.closest('.ira-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('info');
            const infoMsg = inputGroup.querySelector('.ira-info-message');
            if (infoMsg) {
                infoMsg.remove();
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
        const magiInput = document.getElementById('ira-magi');
        const initialBalanceInput = document.getElementById('ira-initial-balance');
        const annualContributionInput = document.getElementById('ira-annual-contribution');
        
        const formData = {
            magi: this.parseCurrencyValue(magiInput.value),
            filingStatus: document.getElementById('ira-filing-status').value,
            hasRetirementPlan: document.getElementById('ira-retirement-plan').value === 'yes',
            initialBalance: this.parseCurrencyValue(initialBalanceInput.value),
            annualContribution: this.parseCurrencyValue(annualContributionInput.value),
            rateOfReturn: parseFloat(document.getElementById('ira-rate-of-return').value.replace(/[^\d.]/g, '')) / 100,
            yearsToContribute: parseInt(document.getElementById('ira-years-to-contribute').value.replace(/[^\d]/g, ''))
        };
        
        return formData;
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
        const statusIcon = this.elements.eligibilityStatus?.querySelector('.ira-status-icon');
        const statusText = this.elements.eligibilityStatus?.querySelector('.ira-status-text');
        
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
        if (this.elements.futureValue) {
            this.elements.futureValue.textContent = this.formatCurrency(results.futureValue);
        }
        if (this.elements.totalContributions) {
            this.elements.totalContributions.textContent = this.formatCurrency(results.totalContributions);
        }
        if (this.elements.totalEarnings) {
            this.elements.totalEarnings.textContent = this.formatCurrency(results.totalEarnings);
        }
        
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
                            input.value = this.formatNumber(numericValue);
                        }
                    }
                    
                    // Format percent input
                    if (id === 'ira-rate-of-return') {
                        const numericValue = parseFloat(input.value.replace(/[^\d.]/g, '')) || 0;
                        if (numericValue > 0) {
                            input.value = numericValue.toFixed(1);
                        }
                    }
                    
                    // Clear any error states and info messages
                    this.clearError(input);
                    this.clearInfo(input);
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
        
        // Move focus to first input field
        const firstInput = document.getElementById('ira-magi');
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
    
    initializeTooltips() {
        // Make tooltips click/tap only (not hover)
        const tooltips = document.querySelectorAll('.ira-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Toggle active state
                const isActive = tooltip.classList.contains('active');
                // Close all other tooltips
                document.querySelectorAll('.ira-tooltip').forEach(t => t.classList.remove('active'));
                // Toggle this tooltip
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        // Close tooltips when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.ira-tooltip')) {
                document.querySelectorAll('.ira-tooltip').forEach(t => t.classList.remove('active'));
            }
        });
    }

    downloadResults() {
        const { jsPDF } = window.jspdf;
        
        if (!confirm('Download your IRA contribution analysis?')) {
            return;
        }
        
        const doc = new jsPDF();
        
        // Add PDF metadata
        doc.setProperties({
            title: 'IRA Contribution Analysis',
            subject: 'Financial Calculator Results',
            author: 'FMG Financial Calculators',
            keywords: 'IRA, retirement savings, IRA contribution, financial calculator, retirement planning',
            creator: 'FMG Financial Calculators'
        });
        
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
        
        yPosition = inputY + (PDF_SPACING.CONTENT_LINE_HEIGHT * 6) + PDF_SPACING.SECTION_GAP;
        
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

