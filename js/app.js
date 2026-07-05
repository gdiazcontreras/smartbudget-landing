// =========================
// CONFIGURACIÓN INICIAL
// =========================
const INITIAL_BALANCE = 100000;
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

// =========================
// FUNCIONES AUXILIARES
// =========================
function setBalance(newBalance) {
    localStorage.setItem("balance", newBalance.toString());
}

function recalcBalance() {
    let data = JSON.parse(localStorage.getItem("transactions")) || [];
    let total = INITIAL_BALANCE;

    data.forEach(tx => {
        let monto = parseInt(tx.monto.replace(/\D/g, "")) || 0;
        if (tx.tipo === "Depósito") total += monto;
        else if (tx.tipo === "Transferencia") total -= monto;
    });

    setBalance(total);
    return total;
}

function formatInputAmount(input) {
    let raw = input.val().replace(/\D/g, "");
    input.val(raw ? new Intl.NumberFormat("es-CL").format(raw) : "");
}

function saveTransaction(tipo, monto) {
    transactions.push({
        fecha: new Date().toLocaleDateString(),
        tipo,
        monto: (tipo === "Depósito" ? "+$" : "-$") + new Intl.NumberFormat("es-CL").format(monto),
        estado: "Completado"
    });
    localStorage.setItem("transactions", JSON.stringify(transactions));
    recalcBalance();
    updateBalanceUI();
    updateStats();
}

// =========================
// DOM READY
// =========================
$(document).ready(function () {
    const currentPage = window.location.pathname.split("/").pop();
    const isLogged = localStorage.getItem("loggedIn");

    // -------------------------
    // RUTAS PROTEGIDAS
    // -------------------------
    const protectedPages = ["menu.html", "deposit.html", "sendmoney.html", "transactions.html"];
    if (protectedPages.includes(currentPage) && isLogged !== "true") {
        window.location.href = "login.html";
        return;
    }

    // -------------------------
    // NAVBAR ACTIVO
    // -------------------------
    $(".nav-link").removeClass("active");
    $("a[href='" + currentPage + "']").addClass("active");

    // -------------------------
    // UI DE SESIÓN
    // -------------------------
    if (isLogged === "true") {
        $("#nav-guest").addClass("d-none");
        $("#nav-user").removeClass("d-none");
    } else {
        $("#nav-guest").removeClass("d-none");
        $("#nav-user").addClass("d-none");
    }

    // -------------------------
    // LOGOUT
    // -------------------------
    $("#logout").click(function (e) {
        e.preventDefault();
        localStorage.removeItem("loggedIn");
        window.location.href = "index.html";
    });

    // -------------------------
    // LOGIN
    // -------------------------
    $("#loginForm").submit(function (e) {
        e.preventDefault();
        const user = $("#usuario").val().trim();
        const pass = $("#password").val().trim();
        const btn = $(".hero-btn");

        const validUser = "usuario@email.com";
        const validPass = "123456";

        if (user === validUser && pass === validPass) {
            btn.prop("disabled", true).html("⚙️ Inicializando...");
            setTimeout(() => {
                btn.html("🔐 Ingresando...");
                setTimeout(() => {
                    localStorage.setItem("loggedIn", "true");
                    window.location.href = "menu.html";
                }, 800);
            }, 600);
        } else {
            $("#login-error").removeClass("d-none");
        }
    });

    // -------------------------
    // DEPÓSITO
    // -------------------------
    $("#depositBtn").click(function () {
        const btn = $(this);
        const monto = parseInt($("#depositMonto").val().replace(/\./g, ""));
        const alertBox = $("<div class='alert-ux'></div>").hide();
        btn.closest("form").append(alertBox);

        if (!monto || monto <= 0) {
            alertBox.addClass("alert-error").text("Ingresa un monto válido").fadeIn();
            return;
        }

        btn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span>Procesando...`);

        setTimeout(() => {
            btn.html("✅ Depósito realizado").removeClass("hero-btn").addClass("btn-success-custom");
            alertBox.removeClass("alert-error").addClass("alert-success").text("Depósito exitoso").fadeIn();
            btn.prop("disabled", false);

            setTimeout(() => {
                btn.removeClass("btn-success-custom").addClass("hero-btn").html("🧾 Realizar depósito");
            }, 2000);
        }, 1500);

        saveTransaction("Depósito", monto);
    });

    // -------------------------
    // TRANSFERENCIA
    // -------------------------
    $("#sendBtn").click(function () {
        const btn = $(this);
        const monto = parseInt($("#monto").val().replace(/\./g, ""));
        $(".alert-ux").remove();
        const alertBox = $("<div class='alert-ux'></div>").hide();
        $(".send-card form").append(alertBox);

        if (!monto || monto <= 0 || isNaN(monto)) {
            alertBox.addClass("alert-error").text("Monto inválido").fadeIn();
            return;
        }

        // Validar saldo disponible
        if (monto > recalcBalance()) {
            alertBox.addClass("alert-error").text("Saldo insuficiente").fadeIn();
            return;
        }

        btn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span>Enviando...`);

        setTimeout(() => {
            btn.html("✅ Transferencia enviada").removeClass("hero-btn").addClass("btn-success-custom");
            alertBox.addClass("alert-success").text("✅ Transferencia enviada correctamente").fadeIn();
            btn.prop("disabled", false);

            setTimeout(() => alertBox.fadeOut(), 3000);
            setTimeout(() => btn.removeClass("btn-success-custom").addClass("hero-btn").html("✈️ Realizar transferencia"), 2000);
        }, 1500);

        saveTransaction("Transferencia", monto);
    });

    // -------------------------
    // FORMATO DE MONTO (REUTILIZADO)
    // -------------------------
    $("#monto, #depositMonto").on("input", function () {
        formatInputAmount($(this));
    });

    // -------------------------
    // RENDER TRANSACCIONES
    // -------------------------
    function renderTransactions() {
        let data = JSON.parse(localStorage.getItem("transactions")) || [];
        let tbody = $("tbody").html("");

        data.forEach(tx => {
            let color = tx.tipo === "Depósito" ? "text-success" : "text-danger";
            tbody.append(`
                <tr>
                    <td>${tx.fecha}</td>
                    <td>${tx.tipo}</td>
                    <td class="${color} fw-bold">${tx.monto}</td>
                    <td><span class="badge bg-success">Completado ✓</span></td>
                </tr>
            `);
        });
    }

    if (currentPage.includes("transactions")) {
        renderTransactions();
        updateStats();
    }

    // -------------------------
    // ACTUALIZAR SALDO EN NAVBAR
    // -------------------------
    function updateBalanceUI() {
        let balance = recalcBalance();
        $("#balanceText").text(new Intl.NumberFormat("es-CL").format(balance));
    }
    updateBalanceUI();

    // -------------------------
    // ACTUALIZAR STATS EN CARDS
    // -------------------------
    function updateStats() {
        let data = JSON.parse(localStorage.getItem("transactions")) || [];
        let ingresos = 0, gastos = 0;

        data.forEach(tx => {
            let monto = parseInt(tx.monto.replace(/\D/g, "")) || 0;
            if (tx.tipo === "Depósito") ingresos += monto;
            else if (tx.tipo === "Transferencia") gastos += monto;
        });

        let balance = recalcBalance();
        $("#statBalance").text(new Intl.NumberFormat("es-CL").format(balance));
        $("#statIngresos").text(new Intl.NumberFormat("es-CL").format(ingresos));
        $("#statGastos").text(new Intl.NumberFormat("es-CL").format(gastos));
    }

    // =========================
    // VALIDACIONES EXTRA
    // =========================

    // DEPÓSITO
    $("#depositBtn").click(function () {
        const btn = $(this);
        const monto = parseInt($("#depositMonto").val().replace(/\./g, ""));
        const alertBox = $("<div class='alert-ux'></div>").hide();
        btn.closest("form").append(alertBox);

        // Validación: monto válido
        if (!monto || monto <= 0) {
            alertBox.addClass("alert-error").text("⚠️ Ingresa un monto válido").fadeIn();
            return;
        }

        // Procesar depósito
        btn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span>Procesando...`);
        setTimeout(() => {
            btn.html("✅ Depósito realizado").removeClass("hero-btn").addClass("btn-success-custom");
            alertBox.removeClass("alert-error").addClass("alert-success").text("Depósito exitoso").fadeIn();
            btn.prop("disabled", false);

            setTimeout(() => {
                btn.removeClass("btn-success-custom").addClass("hero-btn").html("🧾 Realizar depósito");
            }, 2000);
        }, 1500);

        saveTransaction("Depósito", monto);
    });

    // TRANSFERENCIA
    $("#sendBtn").click(function () {
        const btn = $(this);
        const monto = parseInt($("#monto").val().replace(/\./g, ""));
        $(".alert-ux").remove();
        const alertBox = $("<div class='alert-ux'></div>").hide();
        $(".send-card form").append(alertBox);

        // Validación: monto válido
        if (!monto || monto <= 0 || isNaN(monto)) {
            alertBox.addClass("alert-error").text("⚠️ Ingresa un monto válido").fadeIn();
            return;
        }

        // Validación: saldo suficiente
        if (monto > recalcBalance()) {
            alertBox.addClass("alert-error").text("❌ Saldo insuficiente").fadeIn();
            return;
        }

        // Procesar transferencia
        btn.prop("disabled", true).html(`<span class="spinner-border spinner-border-sm me-2"></span>Enviando...`);
        setTimeout(() => {
            btn.html("✅ Transferencia enviada").removeClass("hero-btn").addClass("btn-success-custom");
            alertBox.addClass("alert-success").text("✅ Transferencia enviada correctamente").fadeIn();
            btn.prop("disabled", false);

            setTimeout(() => alertBox.fadeOut(), 3000);
            setTimeout(() => btn.removeClass("btn-success-custom").addClass("hero-btn").html("✈️ Realizar transferencia"), 2000);
        }, 1500);

        saveTransaction("Transferencia", monto);
    });

});
