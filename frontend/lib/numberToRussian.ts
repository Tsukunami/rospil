// lib/numberToRussian.ts

const UNITS_MALE = [
  "",
  "один",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
];

const UNITS_FEMALE = [
  "",
  "одна",
  "две",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
];

const TEENS = [
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать",
];

const TENS = [
  "",
  "",
  "двадцать",
  "тридцать",
  "сорок",
  "пятьдесят",
  "шестьдесят",
  "семьдесят",
  "восемьдесят",
  "девяносто",
];

const HUNDREDS = [
  "",
  "сто",
  "двести",
  "триста",
  "четыреста",
  "пятьсот",
  "шестьсот",
  "семьсот",
  "восемьсот",
  "девятьсот",
];

function getPlural(n: number, one: string, twoToFour: string, fivePlus: string) {
  const nAbs = Math.abs(n) % 100;
  const n1 = nAbs % 10;

  if (nAbs > 10 && nAbs < 20) return fivePlus;
  if (n1 > 1 && n1 < 5) return twoToFour;
  if (n1 === 1) return one;
  return fivePlus;
}

function tripletToWords(num: number, female = false): string {
  if (num === 0) return "";

  const words: string[] = [];
  const hundreds = Math.floor(num / 100);
  const tensUnits = num % 100;
  const tens = Math.floor(tensUnits / 10);
  const units = tensUnits % 10;

  if (hundreds > 0) {
    words.push(HUNDREDS[hundreds]);
  }

  if (tensUnits >= 10 && tensUnits <= 19) {
    words.push(TEENS[tensUnits - 10]);
  } else {
    if (tens > 1) {
      words.push(TENS[tens]);
    }
    if (units > 0) {
      words.push((female ? UNITS_FEMALE : UNITS_MALE)[units]);
    }
  }

  return words.join(" ");
}

function numberToWords(num: number): string {
  if (num === 0) return "ноль";

  const parts: string[] = [];

  const millions = Math.floor(num / 1_000_000);
  const thousands = Math.floor((num % 1_000_000) / 1_000);
  const rest = num % 1_000;

  if (millions > 0) {
    parts.push(tripletToWords(millions));
    parts.push(getPlural(millions, "миллион", "миллиона", "миллионов"));
  }

  if (thousands > 0) {
    parts.push(tripletToWords(thousands, true));
    parts.push(getPlural(thousands, "тысяча", "тысячи", "тысяч"));
  }

  if (rest > 0) {
    parts.push(tripletToWords(rest));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function capitalizeFirst(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function amountToRussianWords(amount: number): string {
  const rubles = Math.floor(amount);

  const formatted = new Intl.NumberFormat("ru-RU").format(rubles);
  const words = capitalizeFirst(numberToWords(rubles));

  return `${formatted} (${words}) рублей`;
}