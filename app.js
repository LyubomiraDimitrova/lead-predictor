"use strict";

const translations = new Map([
  ["en", {
    language: "Language", currency: "Currency", campaignStart: "Campaign Start", campaignEnd: "Campaign End",
    totalRevenue: "Total Revenue", averageOrder: "Avg. Order Value", monthlyForecast: "Monthly funnel forecast",
    leadResponseRate: "Lead Response Rate", prospectResponseRate: "Prospect Response Rate",
    prospects: "Prospects", leads: "Leads", customers: "Customers",
    invalidNumbers: "Enter positive values for revenue, order value, and both response rates.",
    invalidDates: "The campaign end date must be on or after the start date.", month: "Month", chartLabel: "Monthly lead funnel forecast",
    usd: "US Dollar", eur: "Euro", bgn: "Bulgarian Lev"
  }],
  ["bg", {
    language: "Език", currency: "Валута", campaignStart: "Начало на кампанията", campaignEnd: "Край на кампанията",
    totalRevenue: "Общ приход", averageOrder: "Средна стойност на поръчка", monthlyForecast: "Месечна прогноза",
    leadResponseRate: "Процент отговорили лидове", prospectResponseRate: "Процент отговорили потенциални клиенти",
    prospects: "Потенциални клиенти", leads: "Лидове", customers: "Клиенти",
    invalidNumbers: "Въведете положителни стойности за приход, поръчка и процентите.",
    invalidDates: "Краят на кампанията трябва да е след или на началната дата.", month: "Месец", chartLabel: "Месечна прогноза за фунията",
    usd: "Щатски долар", eur: "Евро", bgn: "Български лев"
  }]
]);

const currencyDetails = new Map([
  ["USD", { symbol: "$", locale: "en-US", usdRate: 1 }],
  ["EUR", { symbol: "€", locale: "de-DE", usdRate: 1.08 }],
  ["BGN", { symbol: "лв", locale: "bg-BG", usdRate: 0.553 }]
]);

class LeadPredictor {
  constructor() {
    this.form = document.querySelector("#predictor-form");
    this.elements = {
      language: document.querySelector("#language"), currency: document.querySelector("#currency"),
      start: document.querySelector("#campaign-start"), end: document.querySelector("#campaign-end"),
      revenue: document.querySelector("#total-revenue"), averageOrder: document.querySelector("#average-order"),
      leadRate: document.querySelector("#lead-rate"), prospectRate: document.querySelector("#prospect-rate"),
      error: document.querySelector("#form-error"), chart: document.querySelector("#chart"),
      tooltip: document.querySelector("#chart-tooltip"), period: document.querySelector("#chart-period")
    };
    this.outputs = {
      prospects: document.querySelector("#prospects-value"), leads: document.querySelector("#leads-value"), customers: document.querySelector("#customers-value"),
      leadRate: document.querySelector("#lead-rate-output"), prospectRate: document.querySelector("#prospect-rate-output"),
      prospectsPercent: document.querySelector("#prospects-percent"), leadsPercent: document.querySelector("#leads-percent"), customersPercent: document.querySelector("#customers-percent"),
      prospectsProgress: document.querySelector("#prospects-progress"), leadsProgress: document.querySelector("#leads-progress"), customersProgress: document.querySelector("#customers-progress")
    };
    this.state = { language: "en", currency: "USD" };
    this.bindEvents();
    this.update();
  }

  bindEvents() {
    const updateInputs = [this.elements.start, this.elements.end, this.elements.revenue, this.elements.averageOrder, this.elements.leadRate, this.elements.prospectRate];
    updateInputs.forEach((input) => input.addEventListener("input", () => this.update()));
    this.form.addEventListener("submit", (event) => event.preventDefault());
    this.elements.language.addEventListener("change", () => { this.state.language = this.elements.language.value; this.localize(); this.update(); });
    this.elements.currency.addEventListener("change", () => {
      const previousCurrency = this.state.currency;
      this.state.currency = this.elements.currency.value;
      this.convertInputCurrency(previousCurrency, this.state.currency);
      this.updateCurrencySymbols();
      this.update();
    });
  }

  values() {
    return {
      revenue: Number(this.elements.revenue.value), averageOrder: Number(this.elements.averageOrder.value),
      leadRate: Number(this.elements.leadRate.value), prospectRate: Number(this.elements.prospectRate.value),
      start: new Date(`${this.elements.start.value}T00:00:00`), end: new Date(`${this.elements.end.value}T00:00:00`)
    };
  }

  calculate(values) {
    if (![values.revenue, values.averageOrder, values.leadRate, values.prospectRate].every((value) => Number.isFinite(value) && value > 0)) {
      return { error: translations.get(this.state.language).invalidNumbers };
    }
    if (Number.isNaN(values.start.getTime()) || Number.isNaN(values.end.getTime()) || values.end < values.start) {
      return { error: translations.get(this.state.language).invalidDates };
    }
    const customers = Math.ceil(values.revenue / values.averageOrder);
    const leads = Math.ceil((customers * 100) / values.leadRate);
    const prospects = Math.ceil((leads * 100) / values.prospectRate);
    return { customers, leads, prospects };
  }

  update() {
    const values = this.values();
    const result = this.calculate(values);
    this.updateRangeStyles(values);
    if (result.error) { this.renderError(result.error); return; }
    this.elements.error.textContent = "";
    this.elements.revenue.setAttribute("aria-invalid", "false");
    this.elements.averageOrder.setAttribute("aria-invalid", "false");
    this.elements.start.setAttribute("aria-invalid", "false");
    this.elements.end.setAttribute("aria-invalid", "false");
    this.renderResults(result);
    this.renderChart(this.monthlyForecast(result, values.start, values.end));
  }

  renderError(message) {
    this.elements.error.textContent = message;
    [this.elements.revenue, this.elements.averageOrder, this.elements.start, this.elements.end].forEach((input) => input.setAttribute("aria-invalid", "true"));
    [this.outputs.prospects, this.outputs.leads, this.outputs.customers].forEach((output) => { output.textContent = "—"; });
    this.elements.chart.replaceChildren();
    this.elements.period.textContent = "";
  }

  renderResults(result) {
    const funnel = [
      ["prospects", result.prospects, 100],
      ["leads", result.leads, (result.leads / result.prospects) * 100],
      ["customers", result.customers, (result.customers / result.prospects) * 100]
    ];
    funnel.forEach(([name, amount, percent]) => {
      this.outputs[name].textContent = this.formatNumber(amount);
      this.outputs[`${name}Percent`].textContent = `${this.formatPercent(percent, 0)}`;
      this.outputs[`${name}Progress`].style.width = `${Math.max(0, Math.min(percent, 100))}%`;
    });
  }

  updateRangeStyles(values) {
    [[this.elements.leadRate, this.outputs.leadRate, values.leadRate], [this.elements.prospectRate, this.outputs.prospectRate, values.prospectRate]].forEach(([input, output, rate]) => {
      const percent = Math.max(0, Math.min(rate || 0, 100));
      input.style.setProperty("--range-pct", `${percent}%`);
      output.textContent = this.formatPercent(percent, 2);
    });
  }

  monthlyForecast(result, start, end) {
    const millisecondsPerDay = 86_400_000;
    const days = Math.max(1, Math.round((end - start) / millisecondsPerDay));
    const months = Math.max(1, Math.ceil(days / 30.44));
    return Array.from({ length: months }, (_, index) => {
      const fraction = (index + 1) / months;
      const segmentStart = new Date(start);
      const segmentEnd = new Date(start);
      segmentStart.setDate(start.getDate() + Math.round((index * days) / months));
      segmentEnd.setDate(start.getDate() + Math.round(((index + 1) * days) / months));
      return {
        number: index + 1,
        period: this.formatDateRange(segmentStart, segmentEnd),
        customers: Math.ceil(result.customers * fraction),
        leads: Math.ceil(result.leads * fraction),
        prospects: Math.ceil(result.prospects * fraction)
      };
    });
  }

  renderChart(months) {
    const labels = translations.get(this.state.language);
    const maxValue = Math.max(...months.map((month) => month.prospects), 1);
    this.elements.chart.style.setProperty("--months", months.length);
    this.elements.chart.setAttribute("aria-label", labels.chartLabel);
    this.elements.chart.replaceChildren(...months.map((month) => {
      const item = document.createElement("div");
      item.className = "chart-month";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", this.tooltipText(month));
      item.innerHTML = `<div class="chart-bars"><span class="chart-bar customers" style="height:${(month.customers / maxValue) * 100}%"></span><span class="chart-bar leads" style="height:${(month.leads / maxValue) * 100}%"></span><span class="chart-bar prospects" style="height:${(month.prospects / maxValue) * 100}%"></span></div><span class="month-label">${labels.month} ${month.number}</span>`;
      const show = (event) => this.showTooltip(event, month);
      item.addEventListener("mouseenter", show);
      item.addEventListener("focus", show);
      item.addEventListener("mouseleave", () => this.hideTooltip());
      item.addEventListener("blur", () => this.hideTooltip());
      item.addEventListener("keydown", (event) => { if (event.key === "Escape") this.hideTooltip(); });
      return item;
    }));
    this.elements.period.textContent = `${months.length} ${months.length === 1 ? labels.month.toLowerCase() : `${labels.month.toLowerCase()}s`}`;
  }

  tooltipText(month) {
    const labels = translations.get(this.state.language);
    return `${labels.month} ${month.number}, ${month.period}. ${labels.prospects}: ${this.formatNumber(month.prospects)}. ${labels.leads}: ${this.formatNumber(month.leads)}. ${labels.customers}: ${this.formatNumber(month.customers)}.`;
  }

  showTooltip(event, month) {
    const labels = translations.get(this.state.language);
    this.elements.tooltip.innerHTML = `<strong>${labels.month} ${month.number}</strong><span>${month.period}</span><br>${labels.prospects}: ${this.formatNumber(month.prospects)}<br>${labels.leads}: ${this.formatNumber(month.leads)}<br>${labels.customers}: ${this.formatNumber(month.customers)}`;
    this.elements.tooltip.hidden = false;
    const host = this.elements.chart.parentElement.getBoundingClientRect();
    const item = event.currentTarget.getBoundingClientRect();
    const left = Math.max(0, Math.min(item.left - host.left + item.width / 2, host.width - 175));
    this.elements.tooltip.style.left = `${left}px`;
    this.elements.tooltip.style.top = `${Math.max(30, item.top - host.top - 70)}px`;
  }

  hideTooltip() { this.elements.tooltip.hidden = true; }

  localize() {
    const dictionary = translations.get(this.state.language);
    document.documentElement.lang = this.state.language;
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = dictionary[element.dataset.i18n]; });
    this.elements.currency.options[0].text = `$ ${dictionary.usd}`;
    this.elements.currency.options[1].text = `€ ${dictionary.eur}`;
    this.elements.currency.options[2].text = `лв ${dictionary.bgn}`;
  }

  updateCurrencySymbols() {
    const symbol = currencyDetails.get(this.state.currency).symbol;
    document.querySelectorAll(".currency-symbol").forEach((node) => { node.textContent = symbol; });
  }

  convertInputCurrency(fromCode, toCode) {
    const fromRate = currencyDetails.get(fromCode).usdRate;
    const toRate = currencyDetails.get(toCode).usdRate;
    [this.elements.revenue, this.elements.averageOrder].forEach((input) => {
      const amount = Number(input.value);
      if (Number.isFinite(amount) && amount > 0) input.value = ((amount * fromRate) / toRate).toFixed(2);
    });
  }

  formatDateRange(start, end) {
    const locale = currencyDetails.get(this.state.currency).locale;
    const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
    return `${format.format(start)} – ${format.format(end)}`;
  }

  formatNumber(value) { return new Intl.NumberFormat(currencyDetails.get(this.state.currency).locale, { maximumFractionDigits: 0 }).format(value); }
  formatPercent(value, digits) { return new Intl.NumberFormat(currencyDetails.get(this.state.currency).locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) + "%"; }
}

new LeadPredictor();
