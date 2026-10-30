
// =====================================
// SECTION 1: SELECT HTML ELEMENTS
// =====================================

const transactionForm = document.getElementById("transactionForm");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalIncomeElement = document.getElementById("totalIncome");
const totalExpensesElement = document.getElementById("totalExpenses");
const totalBalanceElement = document.getElementById("totalBalance");
const savingsRateElement = document.getElementById("savingsRate");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");
const filterType = document.getElementById("filterType");


// =====================================
// SECTION 2: INITIAL DATA
// =====================================

// Get today's date in local time.
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getToday();

// Read saved transactions from the browser.
let transactions = [];

try {
    const savedTransactions = JSON.parse(
        localStorage.getItem("personalExpenses") || "[]"
    );

    if (Array.isArray(savedTransactions)) {
        transactions = savedTransactions.filter((item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            (item.type === "income" || item.type === "expense") &&
            typeof item.category === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date)
        );
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
}


// =====================================
// SECTION 3: SAVE DATA
// =====================================

function saveTransactions() {
    try {
        localStorage.setItem(
            "personalExpenses",
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Could not save data. Check your browser storage.");
        console.error(error);
    }
}


// =====================================
// SECTION 4: FORMAT MONEY
// =====================================

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}


// =====================================
// SECTION 5: CALCULATE SUMMARY
// =====================================

function updateSummary() {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    });

    const balance = income - expenses;

    // Savings rate = (income - expenses) / income * 100
    const savingsRate = income > 0
        ? (balance / income) * 100
        : 0;

    totalIncomeElement.textContent = formatMoney(income);
    totalExpensesElement.textContent = formatMoney(expenses);
    totalBalanceElement.textContent = formatMoney(balance);
    savingsRateElement.textContent = savingsRate.toFixed(1) + "%";

    // Make a negative balance visible.
    totalBalanceElement.style.color =
        balance < 0 ? "#ff7777" : "#00ddf5";
}


// =====================================
// SECTION 6: DISPLAY TRANSACTIONS
// =====================================

function displayTransactions() {
    transactionList.replaceChildren();

    const selectedFilter = filterType.value;

    const filteredTransactions = transactions
        .filter(function (transaction) {
            return selectedFilter === "all" ||
                transaction.type === selectedFilter;
        })
        .sort(function (a, b) {
            return b.date.localeCompare(a.date) ||
                b.id.localeCompare(a.id);
        });

    emptyMessage.hidden = filteredTransactions.length > 0;

    filteredTransactions.forEach(function (transaction) {
        const row = document.createElement("tr");

        // Date
        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;

        // Transaction name
        const titleCell = document.createElement("td");
        titleCell.textContent = transaction.title;

        // Category
        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;

        // Type
        const typeCell = document.createElement("td");
        typeCell.textContent =
            transaction.type === "income" ? "Income" : "Expense";

        // Amount
        const amountCell = document.createElement("td");
        amountCell.textContent =
            (transaction.type === "income" ? "+" : "-") +
            formatMoney(transaction.amount);

        amountCell.className =
            transaction.type === "income"
                ? "amount-income"
                : "amount-expense";

        // Delete button
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.dataset.id = transaction.id;
        deleteButton.setAttribute(
            "aria-label",
            "Delete " + transaction.title
        );

        actionCell.appendChild(deleteButton);

        row.append(
            dateCell,
            titleCell,
            categoryCell,
            typeCell,
            amountCell,
            actionCell
        );

        transactionList.appendChild(row);
    });
}


// =====================================
// SECTION 7: ADD A TRANSACTION
// =====================================

transactionForm.addEventListener("submit", function (event) {
    // Prevent the browser from reloading the page.
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    // Basic validation
    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000000 ||
        !date ||
        !["income", "expense"].includes(type)
    ) {
        alert("Please enter valid transaction details.");
        return;
    }

    // Create a transaction object.
    const transaction = {
        id: crypto.randomUUID(),
        title: title,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    // Add it to our array.
    transactions.push(transaction);

    // Save, refresh the display and recalculate.
    saveTransactions();
    updateSummary();
    displayTransactions();

    // Clear the form for the next transaction.
    transactionForm.reset();
    typeInput.value = "expense";
    dateInput.value = getToday();
    titleInput.focus();
});


// =====================================
// SECTION 8: DELETE A TRANSACTION
// =====================================

transactionList.addEventListener("click", function (event) {
    const button = event.target.closest(".delete-btn");

    if (!button) {
        return;
    }

    const transactionId = button.dataset.id;

    transactions = transactions.filter(function (transaction) {
        return transaction.id !== transactionId;
    });

    saveTransactions();
    updateSummary();
    displayTransactions();
});


// =====================================
// SECTION 9: FILTER TRANSACTIONS
// =====================================

filterType.addEventListener("change", function () {
    displayTransactions();
});


// =====================================
// SECTION 10: START THE APP
// =====================================

updateSummary();
displayTransactions();



// =====================================
// SECTION 11: MONTHLY SPENDING ANALYTICS
// =====================================

const analyticsMonth = document.getElementById("analyticsMonth");
const monthlyExpenseTotal = document.getElementById("monthlyExpenseTotal");
const analyticsTransactionCount = document.getElementById(
    "analyticsTransactionCount"
);
const categoryBreakdown = document.getElementById("categoryBreakdown");
const chartContainer = document.getElementById("chartContainer");
const chartEmptyState = document.getElementById("chartEmptyState");


// Use local calendar time, not UTC, to select the current month.
function getCurrentMonth() {
    const today = getToday();
    return today.slice(0, 7);
}

analyticsMonth.value = getCurrentMonth();


// Each category gets a consistent chart color.
const categoryColors = [
    "#00DDF5",
    "#54D6A0",
    "#B69AFF",
    "#FFB86B",
    "#FF7777",
    "#6EA8FE",
    "#F4D35E",
    "#F08AB5",
    "#8793A3"
];


// Store the chart instance so we update it instead of
// creating a new chart every time.
let spendingChart = null;


// Convert rupees to integer paise to avoid floating-point
// addition errors when calculating totals.
function toPaise(rupees) {
    return Math.round(rupees * 100);
}


// =====================================
// SECTION 12: UPDATE MONTHLY ANALYTICS
// =====================================

function updateMonthlyAnalytics() {
    const selectedMonth = analyticsMonth.value;

    // Ignore incomplete month selections.
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) {
        return;
    }

    // Include expenses only from the selected month.
    const monthlyTransactions = transactions.filter(function (item) {
        return item.type === "expense" &&
            item.date.startsWith(selectedMonth);
    });

    // Group amounts by category in integer paise.
    const totalsByCategory = new Map();

    monthlyTransactions.forEach(function (item) {
        const currentTotal = totalsByCategory.get(item.category) || 0;

        totalsByCategory.set(
            item.category,
            currentTotal + toPaise(item.amount)
        );
    });

    // Sort the largest spending categories first.
    const categoryEntries = Array.from(totalsByCategory.entries())
        .sort(function (a, b) {
            return b[1] - a[1];
        });

    const totalPaise = categoryEntries.reduce(
        function (sum, entry) {
            return sum + entry[1];
        },
        0
    );

    // Format the monthly total.
    monthlyExpenseTotal.textContent = formatMoney(totalPaise / 100);

    analyticsTransactionCount.textContent =
        monthlyTransactions.length +
        (monthlyTransactions.length === 1
            ? " expense transaction"
            : " expense transactions");

    // Handle the empty state.
    const hasExpenses = totalPaise > 0;

    chartContainer.hidden = !hasExpenses;
    chartEmptyState.hidden = hasExpenses;

    // Render the category list.
    renderCategoryBreakdown(categoryEntries, totalPaise);

    // Render or update the chart.
    renderSpendingChart(categoryEntries, totalPaise);
}


// =====================================
// SECTION 13: CATEGORY BREAKDOWN
// =====================================

function renderCategoryBreakdown(entries, totalPaise) {
    categoryBreakdown.replaceChildren();

    if (totalPaise === 0) {
        const message = document.createElement("p");

        message.className = "text-secondary small";
        message.textContent =
            "Your category totals will appear here when you record expenses.";

        categoryBreakdown.appendChild(message);
        return;
    }

    entries.forEach(function (entry, index) {
        const category = entry[0];
        const amountPaise = entry[1];

        // Calculate the share from the unformatted amounts.
        const percentage = (amountPaise / totalPaise) * 100;
        const color = categoryColors[index % categoryColors.length];

        const row = document.createElement("div");
        row.className = "category-row";

        const top = document.createElement("div");
        top.className = "category-row-top";

        const dot = document.createElement("span");
        dot.className = "category-dot";
        dot.style.backgroundColor = color;

        const name = document.createElement("span");
        name.className = "category-name";
        name.textContent = category;

        const amount = document.createElement("span");
        amount.className = "category-amount";
        amount.textContent = formatMoney(amountPaise / 100);

        const percent = document.createElement("span");
        percent.className = "category-percent";
        percent.textContent = percentage.toFixed(1) + "%";

        top.append(dot, name, amount, percent);

        const progress = document.createElement("div");
        progress.className = "category-progress";
        progress.setAttribute("role", "progressbar");
        progress.setAttribute("aria-label", category + " share of expenses");
        progress.setAttribute("aria-valuemin", "0");
        progress.setAttribute("aria-valuemax", "100");
        progress.setAttribute("aria-valuenow", percentage.toFixed(1));

        const fill = document.createElement("div");
        fill.className = "category-progress-fill";
        fill.style.width = percentage + "%";
        fill.style.backgroundColor = color;

        progress.appendChild(fill);
        row.append(top, progress);
        categoryBreakdown.appendChild(row);
    });
}


// =====================================
// SECTION 14: DOUGHNUT CHART
// =====================================

function renderSpendingChart(entries, totalPaise) {
    // If Chart.js did not load, show a useful error.
    if (typeof Chart === "undefined") {
        chartEmptyState.hidden = false;
        chartEmptyState.textContent =
            "Chart library unavailable. Check your internet connection.";
        chartContainer.hidden = true;
        return;
    }

    const labels = entries.map(function (entry) {
        return entry[0];
    });

    const values = entries.map(function (entry) {
        return entry[1] / 100;
    });

    const colors = entries.map(function (_, index) {
        return categoryColors[index % categoryColors.length];
    });

    const chartData = {
        labels: labels,
        datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: "#1b2027",
            borderWidth: 3,
            hoverOffset: 6
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",

        plugins: {
            legend: {
                display: false
            },

            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = toPaise(context.raw);
                        const percentage = totalPaise > 0
                            ? (value / totalPaise) * 100
                            : 0;

                        return " " +
                            formatMoney(value / 100) +
                            " (" + percentage.toFixed(1) + "%)";
                    }
                }
            }
        }
    };

    if (spendingChart) {
        // Update the existing chart with current data.
        spendingChart.data = chartData;
        spendingChart.options = chartOptions;
        spendingChart.update();
    } else {
        // Create the chart only once.
        const canvas = document.getElementById("spendingChart");

        spendingChart = new Chart(canvas, {
            type: "doughnut",
            data: chartData,
            options: chartOptions
        });
    }
}


// =====================================
// SECTION 15: ANALYTICS EVENTS
// =====================================

// Recalculate when the reporting month changes.
analyticsMonth.addEventListener("change", function () {
    updateMonthlyAnalytics();
});


// Run once when the app starts.
updateMonthlyAnalytics();
