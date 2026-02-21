// ===== SAVINGS CALCULATOR APP =====
(function () {
    'use strict';

    // --- DOM Elements ---
    const $ = (id) => document.getElementById(id);
    const capitalInicialEl  = $('capitalInicial');
    const edadActualEl      = $('edadActual');
    const edadObjetivoEl    = $('edadObjetivo');
    const tasaInteresEl     = $('tasaInteres');
    const aportacionEl      = $('aportacionMensual');
    const btnCalcular       = $('btnCalcular');
    const btnDescargar      = $('btnDescargar');
    const themeToggle       = $('themeToggle');

    // Result elements
    const valorFinalEl      = $('valorFinal');
    const totalInvertidoEl  = $('totalInvertido');
    const totalInteresesEl  = $('totalIntereses');
    const interesMensualEl  = $('interesMensual');
    const rendimientoEl     = $('rendimientoTotal');
    const motivationalMsg   = $('motivationalMsg');
    const motivationalEmoji = $('motivationalEmoji');
    const resultsSection    = $('resultsSection');

    // Chips
    const chips = document.querySelectorAll('.chip[data-rate]');

    // --- Charts ---
    let pieChart = null;
    let lineChart = null;

    // Chart color helpers
    function getChartColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            invested: '#3b82f6',
            interest: '#10b981',
            gridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            textColor: isDark ? '#94a3b8' : '#64748b',
            lineGradientStart: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.25)',
            lineGradientEnd: isDark ? 'rgba(99,102,241,0)' : 'rgba(99,102,241,0)',
        };
    }

    // --- Format Numbers ---
    function formatCurrency(num) {
        return '$' + num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function formatPercent(num) {
        return num.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + '%';
    }

    // --- Compound Interest Calculation ---
    function calculate() {
        const P = parseFloat(capitalInicialEl.value) || 0;   // Capital inicial
        const edadActual = parseInt(edadActualEl.value) || 0;
        const edadObj    = parseInt(edadObjetivoEl.value) || 0;
        const r = (parseFloat(tasaInteresEl.value) || 0) / 100; // tasa anual decimal
        const PMT = parseFloat(aportacionEl.value) || 0;         // aportación mensual

        const years = Math.max(0, edadObj - edadActual);
        const n = 12; // compounding periods per year
        const totalMonths = years * n;
        const monthlyRate = r / n;

        // Valor futuro del capital inicial
        const fvCapital = P * Math.pow(1 + monthlyRate, totalMonths);

        // Valor futuro de las aportaciones mensuales (annuity)
        let fvAportaciones = 0;
        if (monthlyRate > 0) {
            fvAportaciones = PMT * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
        } else {
            fvAportaciones = PMT * totalMonths;
        }

        const valorFinal = fvCapital + fvAportaciones;
        const totalInvertido = P + (PMT * totalMonths);
        const totalIntereses = valorFinal - totalInvertido;
        const rendimiento = totalInvertido > 0 ? ((totalIntereses / totalInvertido) * 100) : 0;
        const interesMensual = monthlyRate * 100;

        // Yearly breakdown for line chart
        const yearlyData = [];
        for (let y = 0; y <= years; y++) {
            const months = y * n;
            const fv1 = P * Math.pow(1 + monthlyRate, months);
            let fv2 = 0;
            if (monthlyRate > 0) {
                fv2 = PMT * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
            } else {
                fv2 = PMT * months;
            }
            const invested = P + (PMT * months);
            yearlyData.push({
                year: edadActual + y,
                total: fv1 + fv2,
                invested: invested,
            });
        }

        return {
            valorFinal,
            totalInvertido,
            totalIntereses,
            rendimiento,
            interesMensual,
            years,
            yearlyData,
        };
    }

    // --- Display Results ---
    function displayResults(data) {
        // Animate results section
        resultsSection.style.animation = 'none';
        void resultsSection.offsetHeight;
        resultsSection.style.animation = 'fadeInUp 0.6s ease forwards';

        valorFinalEl.textContent = formatCurrency(data.valorFinal);
        totalInvertidoEl.textContent = formatCurrency(data.totalInvertido);
        totalInteresesEl.textContent = formatCurrency(data.totalIntereses);
        interesMensualEl.textContent = formatPercent(data.interesMensual);
        rendimientoEl.textContent = formatPercent(data.rendimiento);

        // Motivational message
        setMotivationalMessage(data);

        // Charts
        renderPieChart(data);
        renderLineChart(data);
    }

    // --- Motivational Messages ---
    function setMotivationalMessage(data) {
        let emoji, msg;
        const vf = data.valorFinal;
        const rendimiento = data.rendimiento;

        if (data.years === 0) {
            emoji = '⏳';
            msg = 'Ajusta tu edad objetivo para proyectar tus ahorros en el tiempo.';
        } else if (rendimiento > 500) {
            emoji = '🏆';
            msg = `¡Impresionante! Tus intereses representan ${formatPercent(rendimiento)} de lo invertido. ¡El interés compuesto es tu mejor aliado!`;
        } else if (rendimiento > 200) {
            emoji = '🚀';
            msg = `¡Excelente! Tu dinero se multiplicará significativamente. En ${data.years} años tendrás ${formatCurrency(vf)}.`;
        } else if (rendimiento > 100) {
            emoji = '💪';
            msg = `¡Muy bien! Duplicarás tu inversión. La constancia y el tiempo son la clave del éxito financiero.`;
        } else if (rendimiento > 50) {
            emoji = '📈';
            msg = `¡Buen camino! Tus ahorros crecerán un ${formatPercent(rendimiento)} por encima de lo que inviertas.`;
        } else if (rendimiento > 0) {
            emoji = '🌱';
            msg = `Cada peso cuenta. Con constancia y tiempo, verás crecer tus ahorros.`;
        } else {
            emoji = '💡';
            msg = 'Comienza a invertir hoy. ¡El mejor momento para empezar fue ayer, el segundo mejor es ahora!';
        }

        motivationalEmoji.textContent = emoji;
        motivationalMsg.textContent = msg;
    }

    // --- Pie Chart ---
    function renderPieChart(data) {
        const ctx = document.getElementById('pieChart').getContext('2d');
        const colors = getChartColors();

        if (pieChart) pieChart.destroy();

        const investedPct = data.totalInvertido;
        const interestPct = data.totalIntereses;

        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Capital Aportado', 'Intereses Ganados'],
                datasets: [{
                    data: [Math.max(0, investedPct), Math.max(0, interestPct)],
                    backgroundColor: [colors.invested, colors.interest],
                    borderWidth: 0,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 12, weight: '600' },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { family: 'Inter', weight: '700' },
                        bodyFont: { family: 'Inter' },
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${formatCurrency(value)} (${pct}%)`;
                            },
                        },
                    },
                },
            },
        });
    }

    // --- Line Chart ---
    function renderLineChart(data) {
        const ctx = document.getElementById('lineChart').getContext('2d');
        const colors = getChartColors();

        if (lineChart) lineChart.destroy();

        // Limit labels for readability
        const yd = data.yearlyData;
        let step = 1;
        if (yd.length > 30) step = 5;
        else if (yd.length > 15) step = 2;

        const labels = yd.map((d, i) => (i % step === 0 || i === yd.length - 1) ? d.year : '');
        const totalValues = yd.map(d => d.total);
        const investedValues = yd.map(d => d.invested);

        // Gradient for total line
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, colors.lineGradientStart);
        gradient.addColorStop(1, colors.lineGradientEnd);

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Valor Acumulado',
                        data: totalValues,
                        borderColor: '#6366f1',
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#6366f1',
                        fill: true,
                        tension: 0.35,
                    },
                    {
                        label: 'Capital Invertido',
                        data: investedValues,
                        borderColor: colors.invested,
                        borderWidth: 2,
                        borderDash: [6, 4],
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: colors.invested,
                        fill: false,
                        tension: 0.1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        grid: { color: colors.gridColor },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11 },
                            maxRotation: 0,
                        },
                        title: {
                            display: true,
                            text: 'Edad',
                            color: colors.textColor,
                            font: { family: 'Inter', size: 12, weight: '600' },
                        },
                    },
                    y: {
                        grid: { color: colors.gridColor },
                        ticks: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11 },
                            callback: function (value) {
                                if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
                                if (value >= 1e3) return '$' + (value / 1e3).toFixed(0) + 'K';
                                return '$' + value;
                            },
                        },
                    },
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: colors.textColor,
                            font: { family: 'Inter', size: 11, weight: '600' },
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            padding: 14,
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { family: 'Inter', weight: '700' },
                        bodyFont: { family: 'Inter' },
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            title: function (items) {
                                const idx = items[0].dataIndex;
                                return `Edad: ${data.yearlyData[idx].year} años`;
                            },
                            label: function (context) {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            },
                        },
                    },
                },
            },
        });
    }

    // --- Theme Toggle ---
    function initTheme() {
        const saved = localStorage.getItem('smartsave-theme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('smartsave-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('smartsave-theme', 'dark');
        }
        // Re-render charts with new colors
        const data = calculate();
        renderPieChart(data);
        renderLineChart(data);
    });

    // --- Scenario Chips ---
    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            tasaInteresEl.value = chip.dataset.rate;
            runCalculation();
        });
    });

    // Sync chips when rate is manually changed
    tasaInteresEl.addEventListener('input', () => {
        const val = parseFloat(tasaInteresEl.value);
        chips.forEach(c => {
            c.classList.toggle('active', parseFloat(c.dataset.rate) === val);
        });
    });

    // --- Calculate on button click ---
    function runCalculation() {
        const data = calculate();
        displayResults(data);
    }

    btnCalcular.addEventListener('click', runCalculation);

    // Real-time update on input change
    const allInputs = [capitalInicialEl, edadActualEl, edadObjetivoEl, tasaInteresEl, aportacionEl];
    allInputs.forEach(input => {
        input.addEventListener('input', runCalculation);
    });

    // --- PDF Download ---
    btnDescargar.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const data = calculate();

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(99, 102, 241);
        pdf.text('SmartSave - Reporte de Ahorros', 20, 25);

        // Date
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        const today = new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        pdf.text(`Generado el ${today}`, 20, 33);

        // Separator
        pdf.setDrawColor(99, 102, 241);
        pdf.setLineWidth(0.5);
        pdf.line(20, 37, 190, 37);

        // Input Summary
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('Datos de inversión', 20, 47);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const inputLines = [
            `Capital inicial: ${formatCurrency(parseFloat(capitalInicialEl.value) || 0)}`,
            `Edad actual: ${edadActualEl.value} años`,
            `Edad objetivo: ${edadObjetivoEl.value} años`,
            `Tasa de interés anual: ${tasaInteresEl.value}%`,
            `Aportación mensual: ${formatCurrency(parseFloat(aportacionEl.value) || 0)}`,
            `Período de inversión: ${data.years} años`,
        ];
        inputLines.forEach((line, i) => {
            pdf.text(line, 24, 56 + i * 7);
        });

        // Results
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('Resultados', 20, 103);

        const resultLines = [
            { label: 'Valor final acumulado:', value: formatCurrency(data.valorFinal), color: [99, 102, 241] },
            { label: 'Total invertido:', value: formatCurrency(data.totalInvertido), color: [59, 130, 246] },
            { label: 'Ganado por intereses:', value: formatCurrency(data.totalIntereses), color: [16, 185, 129] },
            { label: 'Rendimiento sobre inversión:', value: formatPercent(data.rendimiento), color: [60, 60, 60] },
        ];

        resultLines.forEach((item, i) => {
            const y = 112 + i * 9;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);
            pdf.text(item.label, 24, y);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...item.color);
            pdf.text(item.value, 100, y);
        });

        // Capture charts as images
        try {
            const pieCanvas = document.getElementById('pieChart');
            const lineCanvas = document.getElementById('lineChart');

            if (pieCanvas) {
                const pieImg = pieCanvas.toDataURL('image/png');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(30, 30, 30);
                pdf.text('Distribución del Capital', 20, 155);
                pdf.addImage(pieImg, 'PNG', 30, 158, 70, 70);
            }

            if (lineCanvas) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.setTextColor(30, 30, 30);
                pdf.text('Crecimiento por Año', 110, 155);
                const lineImg = lineCanvas.toDataURL('image/png');
                pdf.addImage(lineImg, 'PNG', 105, 158, 85, 55);
            }
        } catch (e) {
            console.warn('Could not capture charts:', e);
        }

        // Footer
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('SmartSave — Calculadora Inteligente de Ahorros', 20, 285);

        pdf.save('SmartSave-Reporte-Ahorros.pdf');
    });

    // --- Init ---
    initTheme();
    runCalculation();
})();
