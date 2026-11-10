const $ = (id) => document.getElementById(id);

const FIAT = [
  ["AED","UAE dirham"],["ARS","Argentine peso"],["AUD","Australian dollar"],["BRL","Brazilian real"],
  ["CAD","Canadian dollar"],["CHF","Swiss franc"],["CNY","Chinese yuan"],["CZK","Czech koruna"],
  ["DKK","Danish krone"],["EUR","Euro"],["GBP","British pound"],["HKD","Hong Kong dollar"],
  ["HUF","Hungarian forint"],["IDR","Indonesian rupiah"],["ILS","Israeli new shekel"],["INR","Indian rupee"],
  ["ISK","Icelandic krona"],["JPY","Japanese yen"],["KRW","South Korean won"],["MXN","Mexican peso"],
  ["MYR","Malaysian ringgit"],["NOK","Norwegian krone"],["NZD","New Zealand dollar"],["PHP","Philippine peso"],
  ["PLN","Polish zloty"],["RON","Romanian leu"],["RSD","Serbian dinar"],["SAR","Saudi riyal"],
  ["SEK","Swedish krona"],["SGD","Singapore dollar"],["THB","Thai baht"],["TRY","Turkish lira"],
  ["UAH","Ukrainian hryvnia"],["USD","US dollar"],["ZAR","South African rand"]
];
const COINS = [
  ["BTC","Bitcoin","BTCUSDT"],["ETH","Ethereum","ETHUSDT"],["BNB","BNB","BNBUSDT"],
  ["SOL","Solana","SOLUSDT"],["XRP","XRP","XRPUSDT"],["DOGE","Dogecoin","DOGEUSDT"],
  ["ADA","Cardano","ADAUSDT"],["TON","Toncoin","TONUSDT"],["LTC","Litecoin","LTCUSDT"],
  ["TRX","TRON","TRXUSDT"]
];

let mode = "fiat";
let fiatRates = null;
let cryptoUsd = {};
let fiatDate = "";
let cryptoUpdated = 0;
let busy = false;

function setStatus(message, type = "") {
  $("status").textContent = message;
  $("status").className = "status " + type;
}
function optionsForMode() {
  return mode === "fiat"
    ? FIAT.map(([code,name]) => [code, `${code} — ${name}`])
    : COINS.map(([code,name]) => [code, `${code} — ${name}`]);
}
function fillSelects(keep = true) {
  const previousFrom = keep ? $("from").value : (mode === "fiat" ? "EUR" : "BTC");
  const previousTo = keep ? $("to").value : (mode === "fiat" ? "USD" : "ETH");
  const opts = optionsForMode();
  for (const id of ["from","to"]) {
    const select = $(id);
    select.replaceChildren();
    for (const [value,label] of opts) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  }
  $("from").value = opts.some(x => x[0] === previousFrom) ? previousFrom : opts[0][0];
  $("to").value = opts.some(x => x[0] === previousTo) ? previousTo : opts[1][0];
}
function formatNumber(value, currency, crypto = false) {
  if (!Number.isFinite(value)) return "—";
  const digits = crypto ? (value >= 100 ? 2 : value >= 1 ? 4 : 8) : (["JPY","KRW"].includes(currency) ? 0 : 2);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits, minimumFractionDigits: Math.min(digits,2) }).format(value);
}
function currencyLabel(code) {
  return mode === "fiat" ? code : code;
}
function calculate() {
  const amount = Number($("amount").value);
  const from = $("from").value;
  const to = $("to").value;
  if (!Number.isFinite(amount) || amount < 0) {
    $("result").textContent = "Enter a valid amount";
    $("calculation").textContent = "";
    return;
  }
  if (mode === "fiat") {
    if (!fiatRates || !fiatRates[from] || !fiatRates[to]) {
      $("result").textContent = "—";
      $("calculation").textContent = "Currency rates unavailable. Tap Refresh rates.";
      return;
    }
    const rate = fiatRates[to] / fiatRates[from];
    const converted = amount * rate;
    $("result").textContent = `${formatNumber(converted,to)} ${to}`;
    $("calculation").textContent = `1 ${from} = ${formatNumber(rate,to)} ${to} · Reference rate dated ${fiatDate}`;
  } else {
    if (from === to) {
      $("result").textContent = `${formatNumber(amount,to,true)} ${to}`;
      $("calculation").textContent = "Same asset selected.";
      return;
    }
    if (!cryptoUsd[from] || !cryptoUsd[to] || !fiatRates?.USD) {
      $("result").textContent = "—";
      $("calculation").textContent = "Crypto prices unavailable. Tap Refresh rates.";
      return;
    }
    const usdValue = amount * cryptoUsd[from];
    const converted = usdValue / cryptoUsd[to];
    $("result").textContent = `${formatNumber(converted,to,true)} ${to}`;
    $("calculation").textContent = `1 ${from} ≈ $${formatNumber(cryptoUsd[from],"USD",true)} · Market prices via Binance · USDT reference`;
  }
}
async function fetchJson(url, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
async function loadFiat() {
  const data = await fetchJson("https://api.frankfurter.dev/v2/rates?base=EUR");
  const rates = { EUR: 1 };
  for (const item of data) {
    if (item && item.quote && Number.isFinite(Number(item.rate))) rates[item.quote] = Number(item.rate);
  }
  if (!rates.USD) throw new Error("USD reference rate missing");
  fiatRates = rates;
  fiatDate = data.reduce((latest,item) => item.date > latest ? item.date : latest, "");
}
async function loadCrypto() {
  const symbols = COINS.map(x => x[2]);
  const url = "https://data-api.binance.vision/api/v3/ticker/price?symbols=" + encodeURIComponent(JSON.stringify(symbols));
  const data = await fetchJson(url);
  const next = {};
  for (const row of data) {
    const coin = COINS.find(x => x[2] === row.symbol);
    const price = Number(row.price);
    if (coin && Number.isFinite(price) && price > 0) next[coin[0]] = price;
  }
  if (!Object.keys(next).length) throw new Error("No crypto prices received");
  cryptoUsd = next;
  cryptoUpdated = Date.now();
}
async function refresh() {
  if (busy) return;
  busy = true;
  $("refresh").disabled = true;
  $("refresh").textContent = "Updating…";
  setStatus("Updating exchange rates…");
  const tasks = mode === "fiat"
    ? [loadFiat()]
    : [loadFiat(), loadCrypto()];
  const results = await Promise.allSettled(tasks);
  const failed = results.filter(x => x.status === "rejected");
  if (!failed.length) {
    setStatus(mode === "fiat" ? `Rates updated · ${fiatDate || "latest available"}` : "Crypto market prices updated · " + new Date(cryptoUpdated).toLocaleTimeString(), "ok");
  } else {
    const reason = failed[0].reason?.message || "Network error";
    setStatus("Could not update rates: " + reason, "error");
  }
  calculate();
  busy = false;
  $("refresh").disabled = false;
  $("refresh").textContent = "Refresh rates";
}
function changeMode(next) {
  if (mode === next) return;
  mode = next;
  $("fiatTab").classList.toggle("active", mode === "fiat");
  $("cryptoTab").classList.toggle("active", mode === "crypto");
  fillSelects(false);
  calculate();
  refresh();
}
$("fiatTab").addEventListener("click", () => changeMode("fiat"));
$("cryptoTab").addEventListener("click", () => changeMode("crypto"));
$("amount").addEventListener("input", calculate);
$("from").addEventListener("change", calculate);
$("to").addEventListener("change", calculate);
$("swap").addEventListener("click", () => {
  const oldFrom = $("from").value;
  $("from").value = $("to").value;
  $("to").value = oldFrom;
  calculate();
});
$("refresh").addEventListener("click", refresh);
$("copy").addEventListener("click", async () => {
  const value = $("result").textContent;
  if (!value || value === "—" || value.startsWith("Enter")) {
    setStatus("Nothing to copy yet.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    setStatus("Converted amount copied.", "ok");
  } catch {
    setStatus("Copy is unavailable on this device.", "error");
  }
});

fillSelects(false);
calculate();
refresh();
