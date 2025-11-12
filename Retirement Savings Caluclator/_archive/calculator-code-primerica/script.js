// Translation data
const translations = {
   en: {
      language: "Language:",
      current_situation: "Your Current Situation",
      retirement_vision: "Your Retirement Vision",
      calculate_button: "Calculate My Retirement Readiness",
      recalculate_button: "Recalculate My Retirement Readiness",
      results: "Results",
      retirement_savings: "Retirement Savings",
      monthly_expenses: "Monthly Retirement Expenses",
      monthly_income: "Monthly Retirement Income",
      save_pdf: "Save Results as PDF",
      chart_title: "Monthly Retirement Income vs. Expenses",
      chart_income_label: "Estimated Monthly Income",
      chart_expenses_label: "Estimated Monthly Expenses",
      current_situation_text: "I'm {currentAge} years old and want to retire at {retirementAge}. My current annual income is ${annualIncome}, and I'm currently saving ${annualSavings} each year for retirement ({savingsRate}% of my income). I've already saved ${currentSavings} for retirement.",
      retirement_vision_text: "I'll need {retirementIncomeRate}% of my current income in retirement to maintain my desired lifestyle. I expect my retirement investments to grow at {annualReturn}% annually."
   },
   fr: {
      language: "Langue :",
      current_situation: "Votre Situation Actuelle",
      retirement_vision: "Votre Vision de Retraite",
      calculate_button: "Calculer Ma Preparation a la Retraite",
      recalculate_button: "Recalculer Ma Preparation a la Retraite",
      results: "Resultats",
      retirement_savings: "Epargne Retraite",
      monthly_expenses: "Depenses Mensuelles de Retraite",
      monthly_income: "Revenus Mensuels de Retraite",
      save_pdf: "Enregistrer les Resultats en PDF",
      chart_title: "Revenus Mensuels de Retraite vs. Depenses",
      chart_income_label: "Revenus Mensuels Estimes",
      chart_expenses_label: "Depenses Mensuelles Estimees",
      current_situation_text: "J'ai {currentAge} ans et je veux prendre ma retraite a {retirementAge}. Mon revenu annuel actuel est de {annualIncome}$, et j'epargne actuellement {annualSavings}$ chaque annee pour la retraite ({savingsRate}% de mon revenu). J'ai deja epargne {currentSavings}$ pour la retraite.",
      retirement_vision_text: "J'aurai besoin de {retirementIncomeRate}% de mon revenu actuel a la retraite pour maintenir le style de vie souhaite. Je m'attends a ce que mes investissements de retraite croissent de {annualReturn}% par annee."
   },
   es: {
      language: "Idioma:",
      current_situation: "Su Situacion Actual",
      retirement_vision: "Su Vision de Jubilacion",
      calculate_button: "Calcular Mi Preparacion para la Jubilacion",
      recalculate_button: "Recalcular Mi Preparacion para la Jubilacion",
      results: "Resultados",
      retirement_savings: "Ahorros para la Jubilacion",
      monthly_expenses: "Gastos Mensuales de Jubilacion",
      monthly_income: "Ingresos Mensuales de Jubilacion",
      save_pdf: "Guardar Resultados como PDF",
      chart_title: "Ingresos Mensuales de Jubilacion vs. Gastos",
      chart_income_label: "Ingresos Mensuales Estimados",
      chart_expenses_label: "Gastos Mensuales Estimados",
      current_situation_text: "Tengo {currentAge} anos y quiero jubilarme a los {retirementAge}. Mi ingreso anual actual es ${annualIncome}, y actualmente estoy ahorrando ${annualSavings} cada ano para la jubilacion ({savingsRate}% de mis ingresos). Ya he ahorrado ${currentSavings} para la jubilacion.",
      retirement_vision_text: "Necesitare {retirementIncomeRate}% de mis ingresos actuales en la jubilacion para mantener mi estilo de vida deseado. Espero que mis inversiones de jubilacion crezcan {annualReturn}% anualmente."
   }
};

// Current language (default to English)
let currentLanguage = 'en';

// Function to change language
function changeLanguage(language) {
   currentLanguage = language;
   updateTranslations();
   
   // Save language preference
   localStorage.setItem('calculatorLanguage', language);
}

// Function to update all translations on the page
function updateTranslations() {
   const elements = document.querySelectorAll('[data-translate]');
   elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[currentLanguage] && translations[currentLanguage][key]) {
         element.textContent = translations[currentLanguage][key];
      }
   });
   
   // Update complex text elements with placeholders
   updateComplexTexts();
   
   // Update chart if it exists
   const resultsDiv = document.getElementById("results");
   if (resultsDiv.style.display !== "none") {
      // Get current values and recreate chart with new labels
      const monthlyIncome = parseFloat(document.getElementById("monthlyIncomeResult").textContent.replace(/[$,]/g, ''));
      const monthlyExpenses = parseFloat(document.getElementById("monthlyExpensesResult").textContent.replace(/[$,]/g, ''));
      if (!isNaN(monthlyIncome) && !isNaN(monthlyExpenses)) {
         createRetirementChart(monthlyIncome, monthlyExpenses);
      }
   }
}

// Function to update complex text elements with input values
function updateComplexTexts() {
   const currentAgeInput = document.getElementById("currentAge");
   const retirementAgeInput = document.getElementById("retirementAge");
   const annualIncomeInput = document.getElementById("annualIncome");
   const annualSavingsInput = document.getElementById("annualSavings");
   const savingsRateInput = document.getElementById("savingsRate");
   const currentSavingsInput = document.getElementById("currentSavings");
   const retirementIncomeRateInput = document.getElementById("retirementIncomeRate");
   const annualReturnInput = document.getElementById("annualReturn");
   
   // Update current situation text
   const currentSituationElement = document.getElementById("currentSituationText");
   if (currentSituationElement && translations[currentLanguage].current_situation_text) {
      let text = translations[currentLanguage].current_situation_text;
      text = text.replace('{currentAge}', `<input type="number" id="currentAge" name="currentAge" required value="${currentAgeInput.value}" />`);
      text = text.replace('{retirementAge}', `<input type="number" id="retirementAge" name="retirementAge" required value="${retirementAgeInput.value}" />`);
      text = text.replace('{annualIncome}', `<input type="number" id="annualIncome" name="annualIncome" required value="${annualIncomeInput.value}" />`);
      text = text.replace('{annualSavings}', `<input type="number" id="annualSavings" name="annualSavings" oninput="calculateSavingsRate()" value="${annualSavingsInput.value}" />`);
      text = text.replace('{savingsRate}', `<input type="number" id="savingsRate" name="savingsRate" min="0" max="100" readonly value="${savingsRateInput.value}" />`);
      text = text.replace('{currentSavings}', `<input type="number" id="currentSavings" name="currentSavings" required value="${currentSavingsInput.value}" />`);
      currentSituationElement.innerHTML = text;
   }
   
   // Update retirement vision text
   const retirementVisionElement = document.getElementById("retirementVisionText");
   if (retirementVisionElement && translations[currentLanguage].retirement_vision_text) {
      let text = translations[currentLanguage].retirement_vision_text;
      text = text.replace('{retirementIncomeRate}', `<input type="number" id="retirementIncomeRate" name="retirementIncomeRate" min="0" max="100" value="${retirementIncomeRateInput.value}" required />`);
      text = text.replace('{annualReturn}', `<input type="number" id="annualReturn" name="annualReturn" step="0.01" value="${annualReturnInput.value}" required />`);
      retirementVisionElement.innerHTML = text;
   }
}

document.addEventListener("DOMContentLoaded", function () {
   const form = document.getElementById("retirementForm");
   const button = document.getElementById("calculateButton");

   // Load saved language preference
   const savedLanguage = localStorage.getItem('calculatorLanguage');
   if (savedLanguage && translations[savedLanguage]) {
      currentLanguage = savedLanguage;
      document.getElementById('languageSelect').value = savedLanguage;
      updateTranslations();
   }

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
   
   // Update button text to "Recalculate" in current language
   document.getElementById("calculateButton").textContent = translations[currentLanguage].recalculate_button;
   
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
         labels: [translations[currentLanguage].chart_income_label, translations[currentLanguage].chart_expenses_label],
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
                  text: translations[currentLanguage].chart_title,
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
