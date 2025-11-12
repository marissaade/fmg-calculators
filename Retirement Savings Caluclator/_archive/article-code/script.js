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

   // Initial check
   checkFormValidity();

   // Listen for input changes
   form.addEventListener("input", checkFormValidity);
});


function calculateSavingsRate() {
   const annualIncome = parseFloat(document.getElementById("annualIncome").value);
   const annualSavings = parseFloat(document.getElementById("annualSavings").value);

   if (!isNaN(annualIncome) && !isNaN(annualSavings) && annualIncome > 0) {
      const savingsRate = (annualSavings / annualIncome) * 100;
      document.getElementById("savingsRate").value = savingsRate.toFixed(1); // Changed to 1 decimal place
   } else {
      document.getElementById("savingsRate").value = ""; // Clear the field if inputs are invalid
   }
}

function calculateRetirement() {
   const currentAge = parseInt(document.getElementById("currentAge").value);
   const retirementAge = parseInt(document.getElementById("retirementAge").value);
   const annualIncome = parseFloat(document.getElementById("annualIncome").value);
   const annualSavings = parseFloat(document.getElementById("annualSavings").value || 0); // Handle potential empty input
   const savingsRate = parseFloat(document.getElementById("savingsRate").value || 0) / 100; // Handle percentage
   const currentSavings = parseFloat(document.getElementById("currentSavings").value);
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

   // Skip retirement age result since that element is no longer in the HTML
   // document.getElementById("retirementAgeResult").textContent = retirementAge;
   document.getElementById("retirementBalanceResult").textContent = `$${futureValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   document.getElementById("monthlyExpensesResult").textContent = `$${estimatedMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
   document.getElementById("monthlyIncomeResult").textContent = `$${estimatedMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

   // Create chart
   createRetirementChart(estimatedMonthlyIncome, estimatedMonthlyExpenses);

   // Show results
   document.getElementById("results").style.display = "flex";
   
   // Update button text to "Recalculate"
   document.getElementById("calculateButton").textContent = "Recalculate My Retirement Readiness";
   
   // Make the Save PDF button visible and enabled
   const savePdfBtn = document.getElementById("savePdfButton");
   savePdfBtn.style.display = "inline-block";
   savePdfBtn.classList.add("enabled");
}

function printResults() {
   // Simply trigger the print dialog
   window.print();
}

function createRetirementChart(monthlyIncome, monthlyExpenses) {
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
      const data = {
         labels: ["Estimated Monthly Income", "Estimated Monthly Expenses"],
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
               family: fontFamily
            },
            scales: {
               y: {
                  beginAtZero: true,
                  ticks: {
                     callback: function (value) {
                        return "$" + value.toLocaleString();
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
                        family: fontFamily
                     }
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
                     label: function (context) {
                        return (
                           "$" +
                           context.raw.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                           })
                        );
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
                     size: 16,
                  },
               },
            },
         },
      };

      new Chart(ctx, config);
   } catch (error) {
      console.error("Error creating chart:", error);
   }
}
