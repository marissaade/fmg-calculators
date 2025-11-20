// What is My Net Worth Calculator JavaScript

class WhatIsMyNetWorthCalculator {
    constructor() {
        this.calculationTimeout = null;
        this.chartInstance = null;
        
        // Store default values for reset
        this.defaultValues = {
            'winw-cash': '10000',
            'winw-investments': '50000',
            'winw-real-estate': '300000',
            'winw-vehicles': '25000',
            'winw-other-valuables': '5000',
            'winw-mortgage': '200000',
            'winw-student-loans': '25000',
            'winw-credit-card-debt': '5000',
            'winw-car-loans': '15000',
            'winw-other-debt': '500'
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
        this.resultsSection = document.getElementById('winw-results-section');
        this.resetBtn = document.getElementById('winw-reset-btn');
        this.downloadBtn = document.getElementById('winw-downloadBtn');
        this.placeholderContent = document.querySelector('.winw-placeholder-content');
        this.chartContainer = document.querySelector('.winw-chart-container');
        this.chartSection = document.querySelector('.winw-chart-section');
        this.chartToggle = document.getElementById('winw-chart-toggle');
        this.chartHeader = document.querySelector('.winw-chart-header');
    }
    
    diagnoseStickyPositioning() {
        // Only apply on desktop (viewport width > 750px)
        if (window.innerWidth <= 750) return;
        
        const formColumn = document.querySelector('.winw-form-column');
        const resultsColumn = document.querySelector('.winw-results-column');
        const layoutContainer = document.querySelector('.winw-calculator-layout');
        
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
        const resetBtnMobile = document.getElementById('winw-reset-btn-mobile');
        if (resetBtnMobile) {
            resetBtnMobile.addEventListener('click', () => this.resetForm());
        }
        
        // Download button (mobile)
        const downloadBtnMobile = document.getElementById('winw-downloadBtn-mobile');
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
            'winw-cash', 'winw-investments', 'winw-real-estate', 'winw-vehicles', 
            'winw-other-valuables',
            'winw-mortgage', 'winw-student-loans', 'winw-credit-card-debt', 'winw-car-loans', 'winw-other-debt'
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
        const tooltips = document.querySelectorAll('.winw-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isActive = tooltip.classList.contains('active');
                // Close all other tooltips
                document.querySelectorAll('.winw-tooltip').forEach(t => t.classList.remove('active'));
                // Toggle this tooltip
                if (!isActive) {
                    tooltip.classList.add('active');
                }
            });
        });
        
        // Close tooltips when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.winw-tooltip')) {
                document.querySelectorAll('.winw-tooltip').forEach(t => t.classList.remove('active'));
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
        const maxValue = 1000000000; // $1 billion
        
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
            'winw-cash', 'winw-investments', 'winw-real-estate', 'winw-vehicles', 
            'winw-other-valuables',
            'winw-mortgage', 'winw-student-loans', 'winw-credit-card-debt', 'winw-car-loans', 'winw-other-debt'
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
        const inputGroup = input.closest('.winw-input-group');
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
        
        // Create error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'winw-error-message show';
        errorMsg.textContent = message;
        
        // Insert error message after input
        if (inputGroup) {
            inputGroup.appendChild(errorMsg);
        }
    }

    clearError(input) {
        const inputGroup = input.closest('.winw-input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            const errorMsg = inputGroup.querySelector('.winw-error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }


    getFormData() {
        return {
            // Assets
            cash: this.parseCurrencyValue(document.getElementById('winw-cash').value),
            investments: this.parseCurrencyValue(document.getElementById('winw-investments').value),
            realEstate: this.parseCurrencyValue(document.getElementById('winw-real-estate').value),
            vehicles: this.parseCurrencyValue(document.getElementById('winw-vehicles').value),
            otherValuables: this.parseCurrencyValue(document.getElementById('winw-other-valuables').value),
            
            // Liabilities
            mortgage: this.parseCurrencyValue(document.getElementById('winw-mortgage').value),
            studentLoans: this.parseCurrencyValue(document.getElementById('winw-student-loans').value),
            creditCardDebt: this.parseCurrencyValue(document.getElementById('winw-credit-card-debt').value),
            carLoans: this.parseCurrencyValue(document.getElementById('winw-car-loans').value),
            otherDebt: this.parseCurrencyValue(document.getElementById('winw-other-debt').value)
        };
    }

    calculateResults(data) {
        // Calculate total assets
        const totalAssets = data.cash + data.investments + data.realEstate + 
                           data.vehicles + data.otherValuables;
        
        // Calculate total liabilities
        const totalLiabilities = data.mortgage + data.studentLoans + data.creditCardDebt + 
                                 data.carLoans + data.otherDebt;
        
        // Calculate net worth
        const netWorth = totalAssets - totalLiabilities;
        
        return {
            totalAssets: totalAssets,
            totalLiabilities: totalLiabilities,
            netWorth: netWorth,
            assets: {
                cash: data.cash,
                investments: data.investments,
                realEstate: data.realEstate,
                vehicles: data.vehicles,
                otherValuables: data.otherValuables
            },
            liabilities: {
                mortgage: data.mortgage,
                studentLoans: data.studentLoans,
                creditCardDebt: data.creditCardDebt,
                carLoans: data.carLoans,
                otherDebt: data.otherDebt
            }
        };
    }

    displayResults(results, formData) {
        // Update net worth
        document.getElementById('winw-net-worth').textContent = this.formatCurrency(results.netWorth);
        
        // Update totals
        document.getElementById('winw-total-assets').textContent = this.formatCurrency(results.totalAssets);
        document.getElementById('winw-total-liabilities').textContent = this.formatCurrency(results.totalLiabilities);
        
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
        
        const canvas = document.getElementById('winw-net-worth-chart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const fontFamily = getComputedStyle(document.body).fontFamily || 'system-ui, -apple-system, sans-serif';
        
        // Create doughnut chart showing assets vs liabilities
        // Using softer, more muted colors
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Assets', 'Liabilities'],
                datasets: [{
                    data: [results.totalAssets, results.totalLiabilities],
                    backgroundColor: [
                        '#60a5fa', // Soft blue for assets
                        '#f87171'  // Soft coral/red for liabilities
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
        const firstInput = document.getElementById('winw-cash');
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
        
        if (!confirm('Download your net worth analysis?')) {
            return;
        }
        
        const formData = this.getFormData();
        const results = this.calculateResults(formData);
        
        const doc = new jsPDF();
        
        // Add PDF metadata
        doc.setProperties({
            title: 'Net Worth Analysis',
            subject: 'Financial Calculator Results',
            author: 'FMG Financial Calculators',
            keywords: 'net worth, assets, liabilities, financial calculator, personal finance',
            creator: 'FMG Financial Calculators'
        });
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('What is My Net Worth?', 20, yPosition);
        yPosition += 20;
        
        // Net Worth
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Net Worth: ${this.formatCurrency(results.netWorth)}`, 20, yPosition);
        yPosition += 15;
        
        // Two-column layout for Assets and Liabilities
        const leftColumn = 20;
        const rightColumn = 110;
        let leftY = yPosition;
        let rightY = yPosition;
        
        // Assets Section (Left Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Assets', leftColumn, leftY);
        leftY += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Cash: ${this.formatCurrency(results.assets.cash)}`, leftColumn, leftY);
        leftY += 7;
        doc.text(`Investments: ${this.formatCurrency(results.assets.investments)}`, leftColumn, leftY);
        leftY += 7;
        doc.text(`Real Estate: ${this.formatCurrency(results.assets.realEstate)}`, leftColumn, leftY);
        leftY += 7;
        doc.text(`Vehicles: ${this.formatCurrency(results.assets.vehicles)}`, leftColumn, leftY);
        leftY += 7;
        doc.text(`Other Valuables: ${this.formatCurrency(results.assets.otherValuables)}`, leftColumn, leftY);
        leftY += 7;
        doc.setFont(undefined, 'bold');
        doc.text(`Total Assets: ${this.formatCurrency(results.totalAssets)}`, leftColumn, leftY);
        leftY += 10;
        
        // Liabilities Section (Right Column)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Liabilities', rightColumn, rightY);
        rightY += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Mortgage: ${this.formatCurrency(results.liabilities.mortgage)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Student Loans: ${this.formatCurrency(results.liabilities.studentLoans)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Credit Card Debt: ${this.formatCurrency(results.liabilities.creditCardDebt)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Car Loans: ${this.formatCurrency(results.liabilities.carLoans)}`, rightColumn, rightY);
        rightY += 7;
        doc.text(`Other Debt: ${this.formatCurrency(results.liabilities.otherDebt)}`, rightColumn, rightY);
        rightY += 7;
        doc.setFont(undefined, 'bold');
        doc.text(`Total Liabilities: ${this.formatCurrency(results.totalLiabilities)}`, rightColumn, rightY);
        rightY += 10;
        
        // Use the taller of the two columns for yPosition
        yPosition = Math.max(leftY, rightY) + 10;
        
        // Add chart to PDF
        const chartCanvas = document.getElementById('winw-net-worth-chart');
        if (chartCanvas) {
            // Add chart heading
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Net Worth Breakdown', 20, yPosition);
            yPosition += 10;
            
            // Get chart as image
            const chartImage = chartCanvas.toDataURL('image/png');
            const imgWidth = 100;
            const imgHeight = 100;
            
            // Center the chart
            const xOffset = (210 - imgWidth) / 2; // A4 width is 210mm
            
            // Check if we need a new page
            if (yPosition + imgHeight > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            doc.addImage(chartImage, 'PNG', xOffset, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
        }
        
        // Disclaimer
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const disclaimer = 'This analysis is based on the values provided. Actual net worth may vary based on market conditions and valuation methods. Consult with a financial professional for personalized advice.';
        const disclaimerText = doc.splitTextToSize(disclaimer, 170);
        
        // Check if we need a new page for disclaimer
        if (yPosition + 20 > 280) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.text(disclaimerText, 20, yPosition);
        
        // Save PDF
        doc.save('net-worth-analysis.pdf');
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
    window.calculatorInstance = new WhatIsMyNetWorthCalculator();
}

// Try multiple initialization methods for CMS compatibility
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCalculator);
} else {
    initializeCalculator();
}
