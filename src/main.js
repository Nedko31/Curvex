import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";

const $ = id => document.getElementById(id);
const FIAT = [["EUR","Euro"],["USD","US dollar"],["GBP","British pound"],["TRY","Turkish lira"],["RON","Romanian leu"],["CHF","Swiss franc"],["JPY","Japanese yen"],["CAD","Canadian dollar"],["AUD","Australian dollar"],["CNY","Chinese yuan"],["INR","Indian rupee"],["PLN","Polish zloty"],["SEK","Swedish krona"],["NOK","Norwegian krone"],["DKK","Danish krone"],["CZK","Czech koruna"],["HUF","Hungarian forint"],["BRL","Brazilian real"],["MXN","Mexican peso"],["ZAR","South African rand"],["AED","UAE dirham"],["SAR","Saudi riyal"],["HKD","Hong Kong dollar"],["SGD","Singapore dollar"],["KRW","South Korean won"],["IDR","Indonesian rupiah"],["THB","Thai baht"],["NZD","New Zealand dollar"]];
const COINS = [["BTC","Bitcoin","BTCUSDT"],["ETH","Ethereum","ETHUSDT"],["BNB","BNB","BNBUSDT"],["SOL","Solana","SOLUSDT"],["XRP","XRP","XRPUSDT"],["DOGE","Dogecoin","DOGEUSDT"],["ADA","Cardano","ADAUSDT"],["TON","Toncoin","TONUSDT"],["LTC","Litecoin","LTCUSDT"],["TRX","TRON","TRXUSDT"]];
const LANGS = ["en","bg","tr","ro","de"];
const TEXT = {
 en:{tagline:"One converter for currencies and crypto",amount:"Amount",from:"From",to:"To",converted:"CONVERTED AMOUNT",refresh:"Refresh rates",copy:"Copy",disclaimer:"Exchange rates are indicative reference data, not bank or trading quotes. Crypto prices change rapidly. Verify rates with your provider before making a transaction.",loading:"Loading rates…",updating:"Updating rates…",valid:"Enter a valid amount",unavailable:"Rates unavailable. Tap Refresh rates.",updated:"Rates updated",copied:"Result copied",nothing:"Nothing to copy yet.",copyError:"Copy is unavailable on this device.",rate:"Reference rate",market:"Market price",failed:"Could not update all rates",same:"Same asset selected"},
 bg:{tagline:"Единен конвертор за валути и крипто",amount:"Сума",from:"От",to:"Към",converted:"ПРЕОБРАЗУВАНА СУМА",refresh:"Обнови курсовете",copy:"Копирай",disclaimer:"Курсовете са ориентировъчни, не са банкови или борсови котировки. Криптоцените се променят бързо. Проверете курса при доставчика преди транзакция.",loading:"Зареждане на курсове…",updating:"Обновяване на курсовете…",valid:"Въведете валидна сума",unavailable:"Няма налични курсове. Натиснете „Обнови курсовете“.",updated:"Курсовете са обновени",copied:"Резултатът е копиран",nothing:"Няма резултат за копиране.",copyError:"Копирането не е достъпно на това устройство.",rate:"Референтен курс",market:"Пазарна цена",failed:"Не всички курсове се обновиха",same:"Избрана е една и съща валута"},
 tr:{tagline:"Döviz ve kripto için tek dönüştürücü",amount:"Tutar",from:"Kaynak",to:"Hedef",converted:"DÖNÜŞTÜRÜLEN TUTAR",refresh:"Kurları yenile",copy:"Kopyala",disclaimer:"Kurlar gösterge niteliğindedir; banka veya işlem kotasyonu değildir. Kripto fiyatları hızla değişebilir. İşlemden önce sağlayıcınızdan doğrulayın.",loading:"Kurlar yükleniyor…",updating:"Kurlar yenileniyor…",valid:"Geçerli bir tutar girin",unavailable:"Kurlar kullanılamıyor. Yenileyin.",updated:"Kurlar güncellendi",copied:"Sonuç kopyalandı",nothing:"Kopyalanacak sonuç yok.",copyError:"Bu cihazda kopyalama kullanılamıyor.",rate:"Referans kuru",market:"Piyasa fiyatı",failed:"Tüm kurlar güncellenemedi",same:"Aynı varlık seçildi"},
 ro:{tagline:"Un convertor pentru valute și criptomonede",amount:"Sumă",from:"Din",to:"În",converted:"SUMĂ CONVERTITĂ",refresh:"Actualizează cursurile",copy:"Copiază",disclaimer:"Cursurile sunt orientative, nu cotații bancare sau de tranzacționare. Prețurile crypto se pot schimba rapid. Verificați cursul la furnizor înainte de tranzacție.",loading:"Se încarcă cursurile…",updating:"Se actualizează cursurile…",valid:"Introduceți o sumă validă",unavailable:"Cursuri indisponibile. Reîncercați.",updated:"Cursuri actualizate",copied:"Rezultatul a fost copiat",nothing:"Nimic de copiat încă.",copyError:"Copierea nu este disponibilă pe acest dispozitiv.",rate:"Curs de referință",market:"Preț de piață",failed:"Nu s-au putut actualiza toate cursurile",same:"Aceeași monedă selectată"},
 de:{tagline:"Ein Konverter für Währungen und Kryptowährungen",amount:"Betrag",from:"Von",to:"Nach",converted:"UMGERECHNETER BETRAG",refresh:"Kurse aktualisieren",copy:"Kopieren",disclaimer:"Die Kurse sind Richtwerte, keine Bank- oder Handelskurse. Kryptopreise können sich schnell ändern. Prüfen Sie den Kurs vor einer Transaktion beim Anbieter.",loading:"Kurse werden geladen…",updating:"Kurse werden aktualisiert…",valid:"Bitte einen gültigen Betrag eingeben",unavailable:"Kurse nicht verfügbar. Bitte aktualisieren.",updated:"Kurse aktualisiert",copied:"Ergebnis kopiert",nothing:"Noch nichts zum Kopieren.",copyError:"Kopieren ist auf diesem Gerät nicht verfügbar.",rate:"Referenzkurs",market:"Marktpreis",failed:"Nicht alle Kurse konnten aktualisiert werden",same:"Gleicher Vermögenswert ausgewählt"}
};
let lang = localStorage.getItem("curvex-lang") || (navigator.language||"en").slice(0,2);
if (!LANGS.includes(lang)) lang="en";
let fiatRates=null, cryptoUsd={}, fiatDate="", busy=false;
const t=key=>TEXT[lang][key]||TEXT.en[key]||key;
function applyLanguage(){document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;el.textContent=t(key)});$("language").value=lang;calculate();}
function fillCurrencies(){
 const all=[...FIAT.map(([code,name])=>({code,name,type:"fiat"})),...COINS.map(([code,name])=>({code,name,type:"crypto"}))];
 for(const id of ["from","to"]){const sel=$(id),old=sel.value;sel.replaceChildren();all.forEach(item=>{const o=document.createElement("option");o.value=item.code;o.textContent=item.type==="crypto"?item.code+" · "+item.name:item.code+" — "+item.name;sel.append(o)});sel.value=all.some(x=>x.code===old)?old:(id==="from"?"EUR":"USD");}
}
function typeOf(code){return COINS.some(x=>x[0]===code)?"crypto":"fiat";}
function num(n,code){if(!Number.isFinite(n))return "—";const digits=typeOf(code)==="crypto"?(n>=100?2:n>=1?4:8):(["JPY","KRW"].includes(code)?0:2);return new Intl.NumberFormat(lang,{maximumFractionDigits:digits,minimumFractionDigits:Math.min(2,digits)}).format(n);}
function usdValue(code){if(typeOf(code)==="crypto")return cryptoUsd[code];if(!fiatRates?.[code]||!fiatRates?.USD)return null;return fiatRates.USD/fiatRates[code];}
function calculate(){
 const amount=Number($("amount").value),from=$("from").value,to=$("to").value;
 if(!Number.isFinite(amount)||amount<0){$("result").textContent=t("valid");$("calculation").textContent="";return;}
 if(from===to){$("result").textContent=num(amount,to)+" "+to;$("calculation").textContent=t("same");return;}
 const a=usdValue(from),b=usdValue(to);
 if(!(a>0&&b>0)){$("result").textContent="—";$("calculation").textContent=t("unavailable");return;}
 const rate=a/b,converted=amount*rate;
 $("result").textContent=num(converted,to)+" "+to;
 $("calculation").textContent="1 "+from+" ≈ "+num(rate,to)+" "+to+" · "+(typeOf(from)==="crypto"||typeOf(to)==="crypto"?t("market"):t("rate"))+(fiatDate?" · "+fiatDate:"");
}
async function fetchJson(url){const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(timer)}}
async function loadFiat(){const data=await fetchJson("https://api.frankfurter.dev/v2/rates?base=EUR");const rates={EUR:1};data.forEach(x=>{if(x?.quote&&Number.isFinite(Number(x.rate)))rates[x.quote]=Number(x.rate)});if(!rates.USD)throw Error("USD reference missing");fiatRates=rates;fiatDate=data.reduce((latest,x)=>x.date>latest?x.date:latest,"");}
async function loadCrypto(){const symbols=COINS.map(x=>x[2]);const data=await fetchJson("https://data-api.binance.vision/api/v3/ticker/price?symbols="+encodeURIComponent(JSON.stringify(symbols)));const next={};data.forEach(row=>{const coin=COINS.find(x=>x[2]===row.symbol),price=Number(row.price);if(coin&&price>0&&Number.isFinite(price))next[coin[0]]=price});if(!Object.keys(next).length)throw Error("No crypto prices");cryptoUsd=next;}
async function refresh(){if(busy)return;busy=true;$("refresh").disabled=true;$("refresh").textContent=t("updating");$("status").textContent=t("updating");const results=await Promise.allSettled([loadFiat(),loadCrypto()]);const failed=results.some(x=>x.status==="rejected");$("status").textContent=failed?t("failed")+(results.find(x=>x.status==="rejected")?.reason?.message?": "+results.find(x=>x.status==="rejected").reason.message:""):t("updated")+(fiatDate?" · "+fiatDate:"");$("status").className="status "+(failed?"error":"ok");calculate();busy=false;$("refresh").disabled=false;$("refresh").textContent=t("refresh");}
$("amount").addEventListener("input",calculate);$("from").addEventListener("change",calculate);$("to").addEventListener("change",calculate);
$("swap").addEventListener("click",()=>{const f=$("from").value;$("from").value=$("to").value;$("to").value=f;calculate()});
$("refresh").addEventListener("click",refresh);
$("language").addEventListener("change",()=>{lang=$("language").value;localStorage.setItem("curvex-lang",lang);applyLanguage()});
$("copy").addEventListener("click",async()=>{const value=$("result").textContent;if(!value||value==="—"||value===t("valid")){$("status").textContent=t("nothing");return}try{await navigator.clipboard.writeText(value);$("status").textContent=t("copied")}catch{$("status").textContent=t("copyError")}});
fillCurrencies();applyLanguage();calculate();refresh();

const ADMOB_TEST_MODE = import.meta.env.VITE_ADMOB_TEST_MODE !== "false";
const ADMOB_BANNER_ID = ADMOB_TEST_MODE
  ? "ca-app-pub-3940256099942544/6300978111"
  : "ca-app-pub-7326151414179206/9459917889";

async function startAdMob() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    let consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      consent = await AdMob.showConsentForm();
    }
    if (!consent.canRequestAds) return;
    await AdMob.initialize();
    await AdMob.showBanner({
      adId: ADMOB_BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: ADMOB_TEST_MODE
    });
  } catch (error) {
    console.error("AdMob could not start; Curvex will continue without ads.", error);
  }
}

if (document.readyState === "complete") {
  void startAdMob();
} else {
  window.addEventListener("load", () => void startAdMob(), { once: true });
}
