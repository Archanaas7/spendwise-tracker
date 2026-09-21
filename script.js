let transactions =
    JSON.parse(localStorage.getItem("spendwiseTransactions")) || [];

let categories =
    JSON.parse(localStorage.getItem("spendwiseCategories")) || [
        "Food",
        "Transport",
        "Shopping",
        "Education",
        "Bills",
        "Entertainment",
        "Health",
        "Other"
    ];

let budget =
    Number(localStorage.getItem("spendwiseBudget")) || 0;

let currentType = "expense";
let editingId = null;


/* -------------------------
   TRANSACTION MODAL
------------------------- */

function openModal() {

    document.getElementById("transactionModal").style.display = "flex";

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    loadCategories();

}

function closeModal() {

    document.getElementById("transactionModal").style.display = "none";

    document.getElementById("transactionForm").reset();

    editingId = null;

    document.getElementById("modalTitle").textContent =
        "Add Transaction";

    selectType("expense");
}


/* -------------------------
   INCOME / EXPENSE
------------------------- */

function selectType(type) {

    currentType = type;

    document
        .getElementById("expenseType")
        .classList.remove("active");

    document
        .getElementById("incomeType")
        .classList.remove("active");

    if (type === "expense") {

        document
            .getElementById("expenseType")
            .classList.add("active");

    } else {

        document
            .getElementById("incomeType")
            .classList.add("active");

    }
}


/* -------------------------
   ADD / EDIT TRANSACTION
------------------------- */

document
    .getElementById("transactionForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const amount =
            Number(document.getElementById("amount").value);

        const category =
            document.getElementById("category").value;

        const date =
            document.getElementById("date").value;

        const description =
            document.getElementById("description").value.trim()
            || category;


        if (amount <= 0) {

            alert("Please enter a valid amount.");

            return;

        }


        if (editingId) {

            const transaction =
                transactions.find(t => t.id === editingId);

            transaction.type = currentType;
            transaction.amount = amount;
            transaction.category = category;
            transaction.date = date;
            transaction.description = description;

        } else {

            transactions.push({

                id: Date.now(),

                type: currentType,

                amount: amount,

                category: category,

                date: date,

                description: description

            });

        }


        saveData();

        displayTransactions();

        updateSummary();

        updateBudget();

        closeModal();

    });


/* -------------------------
   SAVE
------------------------- */

function saveData() {

    localStorage.setItem(
        "spendwiseTransactions",
        JSON.stringify(transactions)
    );

}


/* -------------------------
   SUMMARY
------------------------- */

function updateSummary() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += transaction.amount;

        } else {

            expense += transaction.amount;

        }

    });


    const balance = income - expense;


    document.getElementById("income").textContent =
        formatCurrency(income);

    document.getElementById("expense").textContent =
        formatCurrency(expense);

    document.getElementById("balance").textContent =
        formatCurrency(balance);

}


/* -------------------------
   TRANSACTIONS
------------------------- */

function displayTransactions() {

    const list =
        document.getElementById("transactionsList");

    const filter =
        document.getElementById("filter").value;

    const search =
        document
            .getElementById("search")
            .value
            .toLowerCase();


    let filtered = transactions.filter(transaction => {

        const matchesFilter =
            filter === "all" ||
            transaction.type === filter;

        const matchesSearch =
            transaction.description
                .toLowerCase()
                .includes(search)

            ||

            transaction.category
                .toLowerCase()
                .includes(search);


        return matchesFilter && matchesSearch;

    });


    if (filtered.length === 0) {

        list.innerHTML = `

            <div class="empty">

                <div class="empty-icon">💸</div>

                <h3>No transactions found</h3>

                <p>Add your first transaction to start tracking.</p>

            </div>

        `;

        return;

    }


    filtered.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );


    list.innerHTML = filtered.map(transaction => {

        const sign =
            transaction.type === "income"
                ? "+"
                : "-";

        const amountClass =
            transaction.type === "income"
                ? "income"
                : "expense";


        return `

            <div class="transaction">

                <div class="transaction-left">

                    <div class="icon">
                        ${getIcon(transaction.category)}
                    </div>

                    <div class="transaction-info">

                        <h3>
                            ${escapeHTML(transaction.description)}
                        </h3>

                        <p>
                            ${escapeHTML(transaction.category)}
                            •
                            ${formatDate(transaction.date)}
                        </p>

                    </div>

                </div>


                <div class="transaction-right">

                    <strong class="${amountClass}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </strong>

                    <button
                        class="edit-btn"
                        onclick="editTransaction(${transaction.id})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>

                </div>

            </div>

        `;

    }).join("");

}


/* -------------------------
   DELETE
------------------------- */

function deleteTransaction(id) {

    if (!confirm("Delete this transaction?")) {
        return;
    }


    transactions =
        transactions.filter(transaction =>
            transaction.id !== id
        );


    saveData();

    displayTransactions();

    updateSummary();

    updateBudget();

}


/* -------------------------
   EDIT
------------------------- */

function editTransaction(id) {

    const transaction =
        transactions.find(t => t.id === id);

    if (!transaction) return;


    editingId = id;

    openModal();

    document.getElementById("modalTitle").textContent =
        "Edit Transaction";

    document.getElementById("amount").value =
        transaction.amount;

    document.getElementById("category").value =
        transaction.category;

    document.getElementById("date").value =
        transaction.date;

    document.getElementById("description").value =
        transaction.description;

    selectType(transaction.type);

}


/* -------------------------
   CUSTOM CATEGORIES
------------------------- */

function loadCategories() {

    const select =
        document.getElementById("category");

    select.innerHTML = categories.map(category => {

        return `
            <option value="${escapeHTML(category)}">
                ${getIcon(category)} ${escapeHTML(category)}
            </option>
        `;

    }).join("");

}


function addCategory() {

    const input =
        document.getElementById("newCategory");

    const name =
        input.value.trim();


    if (!name) {

        alert("Enter a category name.");

        return;

    }


    const exists =
        categories.some(category =>
            category.toLowerCase() === name.toLowerCase()
        );


    if (exists) {

        alert("This category already exists.");

        return;

    }


    categories.push(name);

    localStorage.setItem(
        "spendwiseCategories",
        JSON.stringify(categories)
    );


    input.value = "";

    displayCategories();

    loadCategories();

}


function displayCategories() {

    const list =
        document.getElementById("categoryList");


    list.innerHTML = categories.map((category, index) => {

        return `

            <div class="category-item">

                <span>
                    ${getIcon(category)}
                    ${escapeHTML(category)}
                </span>

                <button
                    class="category-delete"
                    onclick="deleteCategory(${index})">
                    Delete
                </button>

            </div>

        `;

    }).join("");

}


function deleteCategory(index) {

    if (categories.length <= 1) {

        alert("You need at least one category.");

        return;

    }


    if (!confirm("Delete this category?")) {
        return;
    }


    categories.splice(index, 1);


    localStorage.setItem(
        "spendwiseCategories",
        JSON.stringify(categories)
    );


    displayCategories();

    loadCategories();

}


/* -------------------------
   SETTINGS
------------------------- */

function openSettings() {

    document.getElementById("settingsModal").style.display =
        "flex";

    displayCategories();

}


function closeSettings() {

    document.getElementById("settingsModal").style.display =
        "none";

}


/* -------------------------
   BUDGET
------------------------- */

function openBudget() {

    document.getElementById("budgetModal").style.display =
        "flex";

    document.getElementById("budgetInput").value =
        budget || "";

}


function closeBudget() {

    document.getElementById("budgetModal").style.display =
        "none";

}


function saveBudget() {

    const value =
        Number(document.getElementById("budgetInput").value);


    if (value <= 0) {

        alert("Enter a valid budget.");

        return;

    }


    budget = value;


    localStorage.setItem(
        "spendwiseBudget",
        budget
    );


    updateBudget();

    closeBudget();

}


function updateBudget() {

    const budgetAmount =
        document.getElementById("budgetAmount");

    const progress =
        document.getElementById("budgetProgress");

    const spentText =
        document.getElementById("budgetSpent");

    const remainingText =
        document.getElementById("budgetRemaining");

    const message =
        document.getElementById("budgetMessage");


    budgetAmount.textContent =
        formatCurrency(budget);


    let spent = 0;


    transactions.forEach(transaction => {

        if (transaction.type === "expense") {

            spent += transaction.amount;

        }

    });


    spentText.textContent =
        formatCurrency(spent) + " spent";


    if (budget === 0) {

        remainingText.textContent =
            "Set a budget to track spending";

        progress.style.width = "0%";

        message.textContent = "";

        return;

    }


    const percentage =
        (spent / budget) * 100;


    progress.style.width =
        Math.min(percentage, 100) + "%";


    const remaining =
        budget - spent;


    if (remaining >= 0) {

        remainingText.textContent =
            formatCurrency(remaining) + " remaining";

        message.textContent =
            percentage >= 80
                ? "⚠️ You're close to your budget limit."
                : "You're within your budget.";

    } else {

        remainingText.textContent =
            formatCurrency(Math.abs(remaining)) +
            " over budget";

        message.textContent =
            "⚠️ You have exceeded your monthly budget.";

    }

}


/* -------------------------
   ICONS
------------------------- */

function getIcon(category) {

    const icons = {

        Food: "🍔",

        Transport: "🚌",

        Shopping: "🛍️",

        Education: "📚",

        Bills: "💡",

        Entertainment: "🎬",

        Health: "❤️",

        Other: "📦",

        Gym: "🏋️",

        Travel: "✈️",

        Salary: "💰",

        Freelance: "💻"

    };


    return icons[category] || "🏷️";

}


/* -------------------------
   CURRENCY
------------------------- */

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR"

    }).format(amount);

}


/* -------------------------
   DATE
------------------------- */

function formatDate(date) {

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* -------------------------
   DARK MODE
------------------------- */

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");


    localStorage.setItem(
        "spendwiseDark",
        dark
    );

}


/* -------------------------
   SECURITY
------------------------- */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* -------------------------
   LOAD APP
------------------------- */

if (
    localStorage.getItem("spendwiseDark")
    === "true"
) {

    document.body.classList.add("dark");

}


loadCategories();

displayTransactions();

updateSummary();

updateBudget();