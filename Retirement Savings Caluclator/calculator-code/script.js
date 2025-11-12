document.addEventListener("DOMContentLoaded", function () {
   const form = document.getElementById("retirementForm");
   const button = document.getElementById("calculateButton");

   function checkFormValidity() {
      // Check if all required inputs are filled
      const requiredInputs = form.querySelectorAll("input[required]");
      let allFilled = true;
      requiredInputs.forEach((input) => {
         if (!input.value.trim()) {
            allFilled = false;
         }
      });
      button.disabled = !allFilled;
   }

   // Function to format number with commas
   function formatNumberWithCommas(value) {
      // Handle empty or invalid input
      if (!value || value.trim() === '') return '';
      
      // Remove all non-digit characters except decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      
      // Handle empty result after cleaning
      if (!numericValue) return '';
      
      // Split by decimal point
      const parts = numericValue.split('.');
      
      // Add commas to the integer part
      if (parts[0]) {
         parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      
      // Return formatted number (keep only first decimal part if multiple dots)
      return parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
   }

   // Add comma formatting to monetary text inputs
   const monetaryInputs = form.querySelectorAll('#annualIncome, #annualSavings, #currentSavings');
   
   monetaryInputs.forEach(input => {
      input.addEventListener('input', function(e) {
         const cursorPosition = e.target.selectionStart;
         const oldValue = e.target.value;
         const newValue = formatNumberWithCommas(oldValue);
         
         // Only update if the value actually changed to avoid cursor jumping
         if (oldValue !== newValue) {
            e.target.value = newValue;
            
            // Adjust cursor position for added/removed commas
            const commasDiff = (newValue.match(/,/g) || []).length - (oldValue.match(/,/g) || []).length;
            const newCursorPosition = cursorPosition + commasDiff;
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
         }
         
         // Calculate savings rate whenever income or savings changes
         if (input.id === 'annualIncome' || input.id === 'annualSavings') {
            calculateSavingsRate();
         }
      });
      
      // Also format and validate on blur to ensure consistency
      input.addEventListener('blur', function(e) {
         const numericValue = parseFloat(e.target.value.replace(/,/g, ''));
         
         // Set reasonable limits based on input type
         let maxValue;
         if (input.id === 'annualIncome') {
            maxValue = 2000000; // $2 million annual income
         } else if (input.id === 'annualSavings') {
            maxValue = 1000000; // $1 million annual savings
         } else if (input.id === 'currentSavings') {
            maxValue = 50000000; // $50 million current savings
         }
         
         // Apply limits
         if (!isNaN(numericValue)) {
            if (numericValue > maxValue) {
               e.target.value = formatNumberWithCommas(maxValue.toString());
            } else if (numericValue < 0) {
               e.target.value = '';
            } else {
               e.target.value = formatNumberWithCommas(e.target.value);
            }
         } else {
            e.target.value = formatNumberWithCommas(e.target.value);
         }
      });
   });

   // Add validation for age inputs to prevent unreasonable values
   const ageInputs = form.querySelectorAll('#currentAge, #retirementAge');
   ageInputs.forEach(input => {
      input.addEventListener('input', function(e) {
         const value = parseInt(e.target.value);
         if (value > 120) {
            e.target.value = 120;
         } else if (value < 0) {
            e.target.value = '';
         }
      });
   });

   // Initial check
   checkFormValidity();
   
   // Initialize savings rate field with 0
   calculateSavingsRate();

   // Listen for input changes
   form.addEventListener("input", checkFormValidity);
   
   // Position tooltip to prevent overflow
   const infoIcon = document.querySelector('.info-icon');
   const tooltip = document.querySelector('.tooltip');
   
   if (infoIcon && tooltip) {
      const positionTooltip = () => {
         // Reset to center position first
         tooltip.style.left = '50%';
         tooltip.style.transform = 'translateX(-50%)';
         
         // Force a reflow to get accurate measurements
         tooltip.offsetWidth;
         
         const rect = tooltip.getBoundingClientRect();
         const viewportWidth = window.innerWidth;
         
         // Check if tooltip overflows on the right
         if (rect.right > viewportWidth - 10) {
            const overflow = rect.right - viewportWidth + 10;
            tooltip.style.left = `calc(50% - ${overflow}px)`;
         }
         
         // Check if tooltip overflows on the left
         if (rect.left < 10) {
            const overflow = 10 - rect.left;
            tooltip.style.left = `calc(50% + ${overflow}px)`;
         }
      };
      
      // Position tooltip when shown
      infoIcon.addEventListener('mouseenter', () => {
         setTimeout(positionTooltip, 10);
      });
      
      infoIcon.addEventListener('focus', () => {
         setTimeout(positionTooltip, 10);
      });
      
      // Reset on mouse leave
      infoIcon.addEventListener('mouseleave', () => {
         tooltip.style.left = '50%';
         tooltip.style.transform = 'translateX(-50%)';
      });
      
      // Reposition on window resize
      window.addEventListener('resize', () => {
         if (tooltip.style.visibility === 'visible') {
            positionTooltip();
         }
      });
   }
});


function calculateSavingsRate() {
   const annualIncome = parseFloat(document.getElementById("annualIncome").value.replace(/,/g, ''));
   const annualSavings = parseFloat(document.getElementById("annualSavings").value.replace(/,/g, ''));
   const savingsRateField = document.getElementById("savingsRate");

   if (!isNaN(annualIncome) && !isNaN(annualSavings) && annualIncome > 0) {
      let savingsRate = (annualSavings / annualIncome) * 100;
      
      // Cap the savings rate at 100% for display purposes
      if (savingsRate > 100) {
         savingsRate = 100;
      }
      
      savingsRateField.value = savingsRate.toFixed(1); // Changed to 1 decimal place
      
      // Auto-adjust width based on content
      adjustInputWidth(savingsRateField);
   } else {
      savingsRateField.value = "x"; // Show x% if inputs are invalid
      adjustInputWidth(savingsRateField);
   }
}

function adjustInputWidth(input) {
   const value = input.value || 'x';
   const charCount = value.length;
   
   // Remove existing width classes
   input.classList.remove('width-small', 'width-medium', 'width-large');
   
   // Add appropriate width class based on character count
   if (charCount === 1) {
      input.classList.add('width-small'); // For "x" only
   } else if (charCount <= 4) {
      input.classList.add('width-medium'); // For values like "0.1", "5.0", "10.0"
   } else {
      input.classList.add('width-large'); // For values like "100.0"
   }
}

function calculateRetirement() {
   const currentAge = parseInt(document.getElementById("currentAge").value);
   const retirementAge = parseInt(document.getElementById("retirementAge").value);
   const annualIncome = parseFloat(document.getElementById("annualIncome").value.replace(/,/g, ''));
   const annualSavings = parseFloat((document.getElementById("annualSavings").value || 0).toString().replace(/,/g, '')); // Handle potential empty input
   const savingsRate = parseFloat(document.getElementById("savingsRate").value || 0) / 100; // Handle percentage
   const currentSavings = parseFloat(document.getElementById("currentSavings").value.replace(/,/g, ''));
   const retirementIncomeRate = parseFloat(document.getElementById("retirementIncomeRate").value) / 100;
   const annualReturn = parseFloat(document.getElementById("annualReturn").value) / 100;

   const yearsOfSaving = retirementAge - currentAge;
   
   // Determine actual annual savings - prioritize direct input over calculated rate
   let actualAnnualSavings = annualSavings;
   if (annualSavings === 0 && savingsRate > 0) {
      actualAnnualSavings = annualIncome * savingsRate;
   }

   // Complete Future Value Calculation using proper formula
   // FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]
   const presentValue = currentSavings;
   const annualInterestRate = annualReturn;
   const numberOfYears = yearsOfSaving;
   
   // Future value of current savings (compound growth)
   const futureValueOfCurrentSavings = presentValue * Math.pow(1 + annualInterestRate, numberOfYears);
   
   // Future value of annual contributions (annuity)
   let futureValueOfAnnualSavings = 0;
   if (actualAnnualSavings > 0 && annualInterestRate > 0) {
      futureValueOfAnnualSavings = actualAnnualSavings * ((Math.pow(1 + annualInterestRate, numberOfYears) - 1) / annualInterestRate);
   } else if (actualAnnualSavings > 0 && annualInterestRate === 0) {
      // Handle zero interest rate case
      futureValueOfAnnualSavings = actualAnnualSavings * numberOfYears;
   }
   
   // Total future value
   const futureValue = futureValueOfCurrentSavings + futureValueOfAnnualSavings;

   // Monthly Expenses Calculation
   const estimatedMonthlyExpenses = (retirementIncomeRate * annualIncome) / 12;

   // Monthly Income Calculation using 4% rule (safe withdrawal rate)
   const estimatedMonthlyIncome = (futureValue * 0.04) / 12;

   document.getElementById("retirementBalanceResult").textContent = `$${Math.round(futureValue).toLocaleString()}`;
   document.getElementById("monthlyExpensesResult").textContent = `$${Math.round(estimatedMonthlyExpenses).toLocaleString()}`;
   document.getElementById("monthlyIncomeResult").textContent = `$${Math.round(estimatedMonthlyIncome).toLocaleString()}`;

   // Create chart
   createRetirementChart(estimatedMonthlyIncome, estimatedMonthlyExpenses);

   // Show results
   const resultsSection = document.getElementById("results");
   resultsSection.style.display = "block";
   
   // Scroll to results section smoothly
   setTimeout(() => {
      resultsSection.scrollIntoView({ 
         behavior: 'smooth', 
         block: 'start'
      });
   }, 100);
   
   // Update button text to "Recalculate"
   document.getElementById("calculateButton").textContent = "Recalculate My Retirement Readiness";
   
   // Make the Save PDF button visible and enabled
   const savePdfBtn = document.getElementById("savePdfButton");
   savePdfBtn.style.display = "inline-block";
   savePdfBtn.classList.add("enabled");
}

function printResults() {
   // Show confirmation dialog before downloading
   const userConfirmed = confirm('This will download a PDF file with your retirement planning summary to your device. Do you want to continue?');
   
   if (!userConfirmed) {
      return; // User cancelled, don't generate PDF
   }
   
   // Create a new jsPDF instance
   const { jsPDF } = window.jspdf;
   const doc = new jsPDF();
   
   // Get current values
   const currentAge = document.getElementById("currentAge").value;
   const retirementAge = document.getElementById("retirementAge").value;
   const annualIncome = document.getElementById("annualIncome").value;
   const annualSavings = document.getElementById("annualSavings").value;
   const savingsRate = document.getElementById("savingsRate").value;
   const currentSavings = document.getElementById("currentSavings").value;
   const retirementIncomeRate = document.getElementById("retirementIncomeRate").value;
   const annualReturn = document.getElementById("annualReturn").value;
   
   // Get results
   const retirementBalance = document.getElementById("retirementBalanceResult").textContent;
   const monthlyExpenses = document.getElementById("monthlyExpensesResult").textContent;
   const monthlyIncome = document.getElementById("monthlyIncomeResult").textContent;
   
   // Set up the document
   let yPosition = 20;
   const leftMargin = 20;
   const rightMargin = 20;
   const lineHeight = 7;
   const pageWidth = 210; // A4 width in mm
   const contentWidth = pageWidth - leftMargin - rightMargin;
   
   // Title
   doc.setFontSize(18);
   doc.setFont(undefined, 'bold');
   doc.text('Retirement Planning Summary', leftMargin, yPosition);
   yPosition += 20;
   
   // Two-column layout: Current Situation | Retirement Vision, then Results below
   const leftColumn = leftMargin;
   const rightColumn = leftMargin + (contentWidth / 2) + 10;
   const sectionStartY = yPosition;
   
   // Left Column - Current Situation
   doc.setFontSize(14);
   doc.setFont(undefined, 'bold');
   doc.text('Current Situation', leftColumn, sectionStartY);
   let leftY = sectionStartY + 10;
   
   doc.setFontSize(10);
   doc.setFont(undefined, 'normal');
   doc.text(`Current Age: ${currentAge} years`, leftColumn, leftY);
   leftY += lineHeight;
   doc.text(`Retirement Age: ${retirementAge} years`, leftColumn, leftY);
   leftY += lineHeight;
   doc.text(`Annual Income: $${annualIncome}`, leftColumn, leftY);
   leftY += lineHeight;
   doc.text(`Annual Savings: $${annualSavings} (${savingsRate}%)`, leftColumn, leftY);
   leftY += lineHeight;
   doc.text(`Current Savings: $${currentSavings}`, leftColumn, leftY);
   leftY += lineHeight;
   doc.text(`Expected Return: ${annualReturn}%`, leftColumn, leftY);
   
   // Right Column - Retirement Vision
   doc.setFontSize(14);
   doc.setFont(undefined, 'bold');
   doc.text('Retirement Vision', rightColumn, sectionStartY);
   let rightY = sectionStartY + 10;
   
   doc.setFontSize(10);
   doc.setFont(undefined, 'normal');
   doc.text(`Income Replacement: ${retirementIncomeRate}% of current income`, rightColumn, rightY);
   rightY += lineHeight;
   doc.text(`Expected Annual Return: ${annualReturn}%`, rightColumn, rightY);
   
   // Results Section (below both columns)
   const resultsY = Math.max(leftY, rightY) + 15;
   doc.setFontSize(14);
   doc.setFont(undefined, 'bold');
   doc.text('Results', leftMargin, resultsY);
   let resultsContentY = resultsY + 10;
   
   doc.setFontSize(11);
   doc.setFont(undefined, 'bold');
   doc.text(`Total Savings: ${retirementBalance}`, leftMargin, resultsContentY);
   resultsContentY += lineHeight + 2;
   doc.text(`Monthly Expenses: ${monthlyExpenses}`, leftMargin, resultsContentY);
   resultsContentY += lineHeight + 2;
   doc.text(`Monthly Income: ${monthlyIncome}`, leftMargin, resultsContentY);
   
   // Calculate the bottom of the content to position chart below
   const contentBottom = resultsContentY + 15;
   
   // Add bar chart
   const chartY = contentBottom;
   const chartWidth = contentWidth;
   const chartHeight = 95; // Increased chart height for more breathing room
   
   // Chart styling with subtle border and light background
   doc.setFillColor(250, 250, 250);
   doc.rect(leftMargin, chartY, chartWidth, chartHeight, 'F');
   
   doc.setDrawColor(200, 200, 200);
   doc.rect(leftMargin, chartY, chartWidth, chartHeight, 'S');
   
   // Chart title
   doc.setFontSize(12);
   doc.setFont(undefined, 'bold');
   doc.text('Monthly Income vs Expenses', leftMargin + 8, chartY + 10);
   
   // Extract numeric values for chart
   const expensesValue = parseFloat(monthlyExpenses.replace(/[$,]/g, ''));
   const incomeValue = parseFloat(monthlyIncome.replace(/[$,]/g, ''));
   const maxValue = Math.max(expensesValue, incomeValue);
   
   // Chart bars - centered with left-aligned text
   const barWidth = 40;
   const barSpacing = 25;
   const chartStartX = leftMargin + 30;
   const chartStartY = chartY + 35;
   const maxBarHeight = 35;
   
   // Expenses bar
   const expensesHeight = (expensesValue / maxValue) * maxBarHeight;
   doc.setFillColor(70, 130, 180); // Steel blue for expenses
   doc.rect(chartStartX, chartStartY + maxBarHeight - expensesHeight, barWidth, expensesHeight, 'F');
   doc.setFontSize(10);
   doc.setFont(undefined, 'normal');
   doc.text('Estimated Monthly Expenses', chartStartX, chartStartY + maxBarHeight + 8, { align: 'left' });
   doc.setFontSize(9);
   doc.text(`$${Math.round(expensesValue).toLocaleString()}`, chartStartX, chartStartY + maxBarHeight + 15, { align: 'left' });
   
   // Income bar
   const incomeHeight = (incomeValue / maxValue) * maxBarHeight;
   doc.setFillColor(25, 25, 112); // Midnight blue for income
   doc.rect(chartStartX + barWidth + barSpacing, chartStartY + maxBarHeight - incomeHeight, barWidth, incomeHeight, 'F');
   doc.setFontSize(10);
   doc.text('Estimated Monthly Income', chartStartX + barWidth + barSpacing, chartStartY + maxBarHeight + 8, { align: 'left' });
   doc.setFontSize(9);
   doc.text(`$${Math.round(incomeValue).toLocaleString()}`, chartStartX + barWidth + barSpacing, chartStartY + maxBarHeight + 15, { align: 'left' });
   
   // Disclosure Section
   yPosition = chartY + chartHeight + 15;
   
   doc.setFontSize(7);
   doc.setFont(undefined, 'normal');
   const disclosureText = 'This is a hypothetical example used for illustrative purposes only. It is not representative of any specific investment or combination of investments. Monthly income is based on an annual withdrawal rate of 4%. Calculations are based on annual compoundings and annual contributions.';
   
   // Split text into lines that fit the page width
   const maxWidth = contentWidth;
   const lines = doc.splitTextToSize(disclosureText, maxWidth);
   doc.text(lines, leftMargin, yPosition);
   
   // Save the PDF
   doc.save('retirement-planning-summary.pdf');
}

function createRetirementChart(monthlyIncome, monthlyExpenses) {
   // Check if mobile device first (matching CSS media query breakpoint)
   const isMobile = window.innerWidth <= 900;
   
   // Get CSS variables from :root
   const rootStyles = getComputedStyle(document.documentElement);
   const incomeColor = rootStyles.getPropertyValue("--paletteColor2").trim() || "#4A678C"; // Fallback color
   const expensesColor = rootStyles.getPropertyValue("--paletteColor1").trim() || "#A0AEC0"; // Fallback color
   const fontFamily = rootStyles.getPropertyValue("--bodyFontFamily").trim() || "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";

   // Get the chart canvas
   const chartCanvas = document.getElementById("incomeExpensesChart");

   try {
      const parent = chartCanvas.parentNode;
      parent.removeChild(chartCanvas);

      const newCanvas = document.createElement("canvas");
      newCanvas.id = "incomeExpensesChart";
      newCanvas.width = 400;
      newCanvas.height = 250;
      parent.appendChild(newCanvas);

      const ctx = newCanvas.getContext("2d");

      // Use CSS variables for colors here!
      // Set labels based on device - multi-line for mobile, multi-line for desktop to prevent overlap
      const labels = isMobile 
         ? ["Est. Income", "Est. Expenses"]
         : [
            ["Estimated Monthly", "Income"],
            ["Estimated Monthly", "Expenses"]
           ];
      
      const data = {
         labels: labels,
         datasets: [
            {
               data: [monthlyIncome, monthlyExpenses],
               backgroundColor: [
                  incomeColor, // Use paletteColor2 for income
                  expensesColor, // Use paletteColor1 for expenses
               ],
               borderColor: [incomeColor, expensesColor],
               borderWidth: 1,
            },
         ],
      };

      const config = {
         type: "bar",
         data: data,
         options: {
            responsive: true,
            maintainAspectRatio: false,
            font: {
               family: fontFamily,
               size: isMobile ? 14 : 12
            },
            scales: {
               y: {
                  beginAtZero: true,
                  ticks: {
                     callback: function (value) {
                        return "$" + Math.round(value).toLocaleString();
                     },
                     font: {
                        family: fontFamily
                     }
                  },
                  title: {
                     display: false,
                     text: "Amount ($)",
                     font: {
                        family: fontFamily
                     }
                  },
               },
               x: {
                  title: {
                     display: false,
                     text: "Category",
                  },
                  ticks: {
                     font: {
                        family: fontFamily,
                        size: isMobile ? 13 : 12
                     },
                     autoSkip: false,
                     maxRotation: 0,
                     minRotation: 0,
                     padding: isMobile ? 10 : 5
                  }
               },
            },
            plugins: {
               legend: {
                  display: false,
                  labels: {
                     font: {
                        family: fontFamily
                     }
                  }
               },
               tooltip: {
                  callbacks: {
                     title: function (tooltipItems) {
                        // Handle array labels properly by joining with space instead of comma
                        const dataIndex = tooltipItems[0].dataIndex;
                        const label = tooltipItems[0].chart.data.labels[dataIndex];
                        if (Array.isArray(label)) {
                           return label.join(' ');
                        }
                        return label;
                     },
                     label: function (context) {
                        return "$" + Math.round(context.raw).toLocaleString();
                     },
                  },
                  titleFont: {
                     family: fontFamily
                  },
                  bodyFont: {
                     family: fontFamily
                  }
               },
               title: {
                  display: true,
                  text: "Monthly Retirement Income vs. Expenses",
                  font: {
                     family: fontFamily,
                     size: isMobile ? 18 : 16,
                  },
                  padding: {
                     bottom: isMobile ? 20 : 10
                  }
               },
            },
         },
      };

      new Chart(ctx, config);
   } catch (error) {
      console.error("Error creating chart:", error);
   }
}
