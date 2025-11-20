// What Is My Monthly Budget Calculator JavaScript

class WhatIsMyMonthlyBudgetCalculator {
    constructor() {
        this.calculationTimeout = null;
        this.chartInstance = null;
        
        // Store default values for reset
        this.defaultValues = {
            'wimb-take-home-pay': '5000',
            'wimb-other-income': '500',
            'wimb-housing': '1500',
            'wimb-utilities': '200',
            'wimb-food': '600',
            'wimb-transportation': '300',
            'wimb-debt-payments': '350',
            'wimb-discretionary': '500',
            'wimb-other-expenses': '100'
        };
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.diagnoseStickyPositioning();
        this.initializeInputFormatting();
        this.initializeTooltips();
        this.initializeEventListeners();
        // Calculate and display results on page load
        this.calculateOnLoad();
    }
    
    cacheElements() {
        this.resultsSection = document.getElementById('wimb-results-section');
        this.resetBtn = document.getElementById('wimb-reset-btn');
        this.downloadBtn = document.getElementById('wimb-downloadBtn');
        this.placeholderContent = document.querySelector('.wimb-placeholder-content');
        this.chartContainer = document.querySelector('.wimb-chart-container');
        this.chartSection = document.querySelector('.wimb-chart-section');
        this.chartToggle = document.getElementById('wimb-chart-toggle');
        this.chartHeader = document.querySelector('.wimb-chart-header');
    }
    
    diagnoseStickyPositioning() {
        // Only apply on desktop (viewport width > 750px)
        if (window.innerWidth <= 750) return;
        
        const formColumn = document.querySelector('.wimb-form-column');
        const resultsColumn = document.querySelector('.wimb-results-column');
        const layoutContainer = document.querySelector('.wimb-calculator-layout');
        
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
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetForm());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadResults());
        }
        
        // Reset button (mobile)
        const resetBtnMobile = document.getElementById('wimb-reset-btn-mobile');
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (mobile)
        const downloadBtnMobile = document.getElementById('wimb-downloadBtn-mobile');
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
        
        // Window resize listener for sticky positioning
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.diagnoseStickyPositioning();
            }, 250);
        });
        
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
    }

    initializeInputFormatting() {
        // Format all currency inputs with commas and numeric-only filtering
        const currencyInputs = [
            'wimb-take-home-pay', 'wimb-other-income',
            'wimb-housing', 'wimb-utilities', 'wimb-food', 'wimb-transportation',
            'wimb-debt-payments', 'wimb-discretionary', 'wimb-other-expenses'
        ];
        currencyInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Change to text type to allow commas
                input.type = 'text';
                input.inputMode = 'numeric';
                
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
                    
                    // Format currency input
                    this.formatCurrencyInput(e);
                    
                    // Clear errors
                    this.clearError(e.target);
                    
                    // Trigger calculation
                    clearTimeout(this.calculationTimeout);
                    this.calculationTimeout = setTimeout(() => {
                        this.calculateAndDisplay();
                    }, 300);
                });
                
                input.addEventListener('blur', (e) => this.formatCurrencyInput(e));
                input.addEventListener('focus', (e) => {
                    // Auto-select entire value on focus
                    e.target.select();
                    // Remove commas when focusing for easier editing
                    e.target.value = e.target.value.replace(/,/g, '');
                });
            }
        });
    }
    
    initializeTooltips() {
        const tooltips = document.querySelectorAll('.wimb-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isActive = tooltip.classList.contains('active');
                // Close all other tooltips
                document.querySelectorAll('.wimb-tooltip').forEach(t => t.classList.remove('active'));
                // Toggle this tooltip
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        // Close tooltips when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.wimb-tooltip')) {
                document.querySelectorAll('.wimb-tooltip').forEach(t => t.classList.remove('active'));
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

    validateAndCapInput(input) {
        const value = input.value.trim();
        const numericValue = this.parseCurrencyValue(value);
        
        // Set reasonable limit
        const maxValue = 1000000; // $1 million per month
        
        if (value && !isNaN(numericValue)) {
            if (numericValue > maxValue) {
                input.value = maxValue.toLocaleString();
                this.showError(input, `Value cannot exceed ${this.formatCurrency(maxValue)}`);
            } else if (numericValue < 0) {
                input.value = '';
                this.showError(input, 'Value cannot be negative');
            }
        }
    }
    
    calculateOnLoad() {
        // Format initial currency values with commas
        const currencyInputs = [
            'wimb-take-home-pay', 'wimb-other-income',
            'wimb-housing', 'wimb-utilities', 'wimb-food', 'wimb-transportation',
            'wimb-debt-payments', 'wimb-discretionary', 'wimb-other-expenses'
        ];
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
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        this.displayResults(results, formData);
    }

    showError(input, message) {
        // Remove existing error
        this.clearError(input);
        
        // Add error class
        const inputGroup = input.closest('.wimb-input-group');
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'wimb-error-message show';
        errorMsg.textContent = message;
        
        // Insert error message after input
        if (inputGroup) {
            inputGroup.appendChild(errorMsg);
        }
    }

    clearError(input) {
        const inputGroup = input.closest('.wimb-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorMsg = inputGroup.querySelector('.wimb-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }

    getFormData() {
        return {
            // Income
            takeHomePay: this.parseCurrencyValue(document.getElementById('wimb-take-home-pay').value),
            otherIncome: this.parseCurrencyValue(document.getElementById('wimb-other-income').value),
            
            // Expenses
            housing: this.parseCurrencyValue(document.getElementById('wimb-housing').value),
            utilities: this.parseCurrencyValue(document.getElementById('wimb-utilities').value),
            food: this.parseCurrencyValue(document.getElementById('wimb-food').value),
            transportation: this.parseCurrencyValue(document.getElementById('wimb-transportation').value),
            debtPayments: this.parseCurrencyValue(document.getElementById('wimb-debt-payments').value),
            discretionary: this.parseCurrencyValue(document.getElementById('wimb-discretionary').value),
            otherExpenses: this.parseCurrencyValue(document.getElementById('wimb-other-expenses').value)
        };
    }

    calculateResults(data) {
        // Calculate total income
        const totalIncome = data.takeHomePay + data.otherIncome;
        
        // Calculate total expenses
        const totalExpenses = data.housing + data.utilities + data.food + 
                             data.transportation + data.debtPayments + 
                             data.discretionary + data.otherExpenses;
        
        // Calculate net monthly cash flow
        const netCashFlow = totalIncome - totalExpenses;
        
        return {
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            netCashFlow: netCashFlow,
            isSurplus: netCashFlow > 0,
            income: {
                takeHomePay: data.takeHomePay,
                otherIncome: data.otherIncome
            },
            expenses: {
                housing: data.housing,
                utilities: data.utilities,
                food: data.food,
                transportation: data.transportation,
                debtPayments: data.debtPayments,
                discretionary: data.discretionary,
                otherExpenses: data.otherExpenses
            }
        };
    }

    displayResults(results, formData) {
        const netCashFlowEl = document.getElementById('wimb-net-cash-flow');
        
        // Update net cash flow with color coding
        netCashFlowEl.textContent = this.formatCurrency(results.netCashFlow);
        netCashFlowEl.classList.remove('wimb-surplus', 'wimb-deficit');
        if (results.isSurplus) {
            netCashFlowEl.classList.add('wimb-surplus');
        } else if (results.netCashFlow < 0) {
            netCashFlowEl.classList.add('wimb-deficit');
        }
        
        // Update totals
        document.getElementById('wimb-total-income').textContent = this.formatCurrency(results.totalIncome);
        document.getElementById('wimb-total-expenses').textContent = this.formatCurrency(results.totalExpenses);
        
        // Hide placeholder content
        if (this.placeholderContent) {
            this.placeholderContent.style.display = 'none';
        }
        
        // Generate and display chart
        this.generateChart(results, formData);
        
        // Ensure chart is visible
        if (this.chartContainer) {
            this.chartContainer.style.display = 'block';
        }
        
        // Show results section
        if (this.resultsSection) {
            this.resultsSection.style.display = 'block';
        }
    }
    
    generateChart(results, formData) {
        if (!this.chartContainer) return;
        
        const canvas = document.getElementById('wimb-budget-chart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const fontFamily = getComputedStyle(document.body).fontFamily || 'system-ui, -apple-system, sans-serif';
        
        // Create doughnut chart showing income vs expenses
        // Using softer colors
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [results.totalIncome, results.totalExpenses],
                    backgroundColor: [
                        '#60a5fa', // Soft blue for income
                        '#f87171'  // Soft coral/red for expenses
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                family: fontFamily,
                                size: 12
                            },
                            padding: 15,
                            usePointStyle: true
                        }
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
                                const label = context.label || '';
                                const value = this.formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }

    resetForm() {
        // Reset all input fields to default values
        Object.keys(this.defaultValues).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = this.defaultValues[id];
                
                // Format currency inputs with commas
                const numericValue = parseFloat(input.value.replace(/[^\d]/g, '')) || 0;
                if (numericValue > 0) {
                    input.value = numericValue.toLocaleString();
                }
                
                // Clear any error states
                this.clearError(input);
            }
        });
        
        // Recalculate and display results with default values
        this.calculateAndDisplay();
        
        // Move focus to first input field
        const firstInput = document.getElementById('wimb-take-home-pay');
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
        const { jsPDF } = window.jspdf;
        
        if (!confirm('Download your monthly budget analysis?')) {
            return;
        }
        
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        const doc = new jsPDF();
        
        // Add PDF metadata
        doc.setProperties({
            title: 'Monthly Budget Analysis',
            subject: 'Financial Calculator Results',
            author: 'FMG Financial Calculators',
            keywords: 'budget, monthly budget, income, expenses, financial calculator, personal finance',
            creator: 'FMG Financial Calculators'
        });
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('What Is My Monthly Budget?', 20, yPosition);
        yPosition += 20;
        
        // Net Cash Flow
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Net Monthly Cash Flow: ${this.formatCurrency(results.netCashFlow)}`, 20, yPosition);
        yPosition += 15;
        
        // Two-column layout for Income and Expenses
        const leftColumn = 20;
        const rightColumn = 110;
        let leftY = yPosition;
        let rightY = yPosition;
        
        // Income Section (Left Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Income', leftColumn, leftY);
        leftY += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Take-Home Pay: ${this.formatCurrency(results.income.takeHomePay)}`, leftColumn, leftY);
        leftY += 7;
        doc.text(`Other Income: ${this.formatCurrency(results.income.otherIncome)}`, leftColumn, leftY);
        leftY += 7;
        doc.setFont(undefined, 'bold');
        doc.text(`Total Income: ${this.formatCurrency(results.totalIncome)}`, leftColumn, leftY);
        leftY += 10;
        
        // Expenses Section (Right Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Expenses', rightColumn, rightY);
        rightY += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Housing: ${this.formatCurrency(results.expenses.housing)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Utilities: ${this.formatCurrency(results.expenses.utilities)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Food: ${this.formatCurrency(results.expenses.food)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Transportation: ${this.formatCurrency(results.expenses.transportation)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Debt: ${this.formatCurrency(results.expenses.debtPayments)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Discretionary: ${this.formatCurrency(results.expenses.discretionary)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Other: ${this.formatCurrency(results.expenses.otherExpenses)}`, rightColumn, rightY);
        rightY += 7;
        doc.setFont(undefined, 'bold');
        doc.text(`Total: ${this.formatCurrency(results.totalExpenses)}`, rightColumn, rightY);
        rightY += 10;
        
        // Use the taller of the two columns for yPosition
        yPosition = Math.max(leftY, rightY) + 10;
        
        // Status
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        if (results.isSurplus) {
            doc.setTextColor(5, 150, 105); // Green
            doc.text(`Status: Surplus of ${this.formatCurrency(results.netCashFlow)}`, 20, yPosition);
        } else {
            doc.setTextColor(220, 38, 38); // Red
            doc.text(`Status: Deficit of ${this.formatCurrency(Math.abs(results.netCashFlow))}`, 20, yPosition);
        }
        doc.setTextColor(0, 0, 0); // Reset to black
        yPosition += 15;
        
        // Add chart to PDF
        const chartCanvas = document.getElementById('wimb-budget-chart');
        if (chartCanvas) {
            // Add chart heading
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Monthly Budget Breakdown', 20, yPosition);
            yPosition += 8;
            
            // Get chart as image
            const chartImage = chartCanvas.toDataURL('image/png');
            const imgWidth = 80;
            const imgHeight = 80;
            
            // Center the chart
            const xOffset = (210 - imgWidth) / 2; // A4 width is 210mm
            
            doc.addImage(chartImage, 'PNG', xOffset, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
        }
        
        // Disclaimer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const disclaimer = 'This analysis is based on the values provided. Actual monthly cash flow may vary. Consult with a financial professional for personalized advice.';
        const disclaimerText = doc.splitTextToSize(disclaimer, 170);
        doc.text(disclaimerText, 20, yPosition);
        
        // Save PDF
        doc.save('monthly-budget-analysis.pdf');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize the calculator when the DOM is loaded
function initializeCalculator() {
    window.calculatorInstance = new WhatIsMyMonthlyBudgetCalculator();
}

// Try multiple initialization methods for CMS compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else {
    initializeCalculator();
}

