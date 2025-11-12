// Chart.js is loaded in HTML
document.addEventListener("DOMContentLoaded", () => {
   const labels = document.querySelectorAll("label");
   const calculateButton = document.getElementById("calculateButton");
   const inputFields = document.querySelectorAll('input[type="number"]');

   labels.forEach((label) => {
      label.addEventListener("click", () => {
         const inputId = label.getAttribute("for");
         const inputElement = document.getElementById(inputId);
         if (inputElement) {
            inputElement.classList.toggle("show");
            // If it was just shown, focus it.
            if (inputElement.classList.contains("show")) {
               inputElement.focus();
            }
         }
      });
   });

   function checkInputs() {
      let allFilled = true;
      inputFields.forEach((input) => {
         if (!input.value.trim()) {
            allFilled = false;
         }
      });
      calculateButton.disabled = !allFilled;
      calculateButton.style.opacity = allFilled ? 1 : 0.5;
      calculateButton.style.cursor = allFilled ? "pointer" : "not-allowed";
   }

   inputFields.forEach((input) => {
      input.addEventListener("input", checkInputs);
   });
   checkInputs();
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
   let actualAnnualSavings = annualSavings;
   if (savingsRate > 0) {
      actualAnnualSavings = annualIncome * savingsRate;
   }

   // Future Value Calculation - MATCHING GOOGLE SHEET FORMULA
   const presentValue = currentSavings;
   const monthlyInterestRate = annualReturn / 12;
   const totalNumberOfMonths = yearsOfSaving * 12;
   const futureValue = presentValue * Math.pow(1 + monthlyInterestRate, totalNumberOfMonths);

   // Monthly Expenses Calculation - MATCHING GOOGLE SHEET FORMULA
   const estimatedMonthlyExpenses = (retirementIncomeRate * annualIncome) / 12;

   // Monthly Income Calculation - MATCHING GOOGLE SHEET FORMULA
   const estimatedMonthlyIncomeFromSavings = (futureValue * 0.04) / 12;
   const totalMonthlyIncome = estimatedMonthlyIncomeFromSavings;

   // Safely update elements, checking if they exist first
   const retirementAgeResult = document.getElementById("retirementAgeResult");
   const retirementBalanceResult = document.getElementById("retirementBalanceResult");
   const monthlyExpensesResult = document.getElementById("monthlyExpensesResult");
   const monthlyIncomeResult = document.getElementById("monthlyIncomeResult");
   const incomeExpensesChart = document.getElementById("incomeExpensesChart");
   
   // Only update elements that exist
   if (retirementAgeResult) retirementAgeResult.textContent = retirementAge;
   if (retirementBalanceResult) retirementBalanceResult.textContent = `$${futureValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
   if (monthlyExpensesResult) monthlyExpensesResult.textContent = `$${estimatedMonthlyExpenses.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
   if (monthlyIncomeResult) monthlyIncomeResult.textContent = `$${totalMonthlyIncome.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

   // Only create chart if the canvas element exists
   if (incomeExpensesChart) {
      const incomeExpensesChartCtx = incomeExpensesChart.getContext("2d");
      
      // Create the chart
      try {
         const chart = new Chart(incomeExpensesChartCtx, {
      type: "bar", // Use a bar chart to compare income and expenses
      data: {
         labels: ["Monthly Income", "Monthly Expenses"],
         datasets: [
            {
               label: "Amount ($)",
               data: [totalMonthlyIncome, estimatedMonthlyExpenses],
               backgroundColor: [
                  "rgba(75, 192, 192, 0.7)", // Green for income
                  "rgba(255, 99, 132, 0.7)", // Red for expenses
               ],
               borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
               borderWidth: 1,
            },
         ],
      },
      options: {
         responsive: true,
         maintainAspectRatio: false,
         animation: {
            duration: 1000,
            easing: "easeInOutQuad",
         },
         scales: {
            x: {
               display: true,
               title: {
                  display: true,
                  text: "Category",
                  font: {
                     size: 14,
                  },
               },
            },
            y: {
               display: true,
               title: {
                  display: true,
                  text: "Amount ($)",
                  font: {
                     size: 14,
                  },
               },
               beginAtZero: true,
               ticks: {
                  // Include a dollar sign and format the ticks
                  callback: function (value) {
                     return "$" + value.toLocaleString();
                  },
               },
            },
         },
         plugins: {
            legend: {
               display: false, // Remove the legend
               position: "top",
               labels: {
                  font: {
                     size: 12,
                  },
               },
            },
            title: {
               display: true,
               text: "Monthly Income vs. Expenses",
               font: {
                  size: 16,
               },
            },
            tooltip: {
               // Customize the tooltip
               callbacks: {
                  label: function (context) {
                     let label = context.label || "";
                     if (label) {
                        label += ": ";
                     }
                     if (context.parsed.y !== null) {
                        label += "$" + context.parsed.y.toLocaleString();
                     }
                     return label;
                  },
               },
            },
         },
      },
   });
      } catch (err) {
         console.log("Error creating chart:", err);
      }
   }

   // Show the results section after calculations are done, if it exists
   const resultsDiv = document.getElementById("results");
   const savePdfButton = document.getElementById("savePdfButton");
   
   if (resultsDiv) resultsDiv.style.display = "block";
   if (savePdfButton) savePdfButton.style.display = "block";
}

function handleSavePdf() {
   window.print();
}

