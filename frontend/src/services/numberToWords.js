function toWords(num) {
  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
  ];
  const teens = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const tens = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];

  if (num === 0) return "zéro";

  let words = "";

  if (Math.floor(num / 1000000) > 0) {
    const millions = Math.floor(num / 1000000);
    words +=
      (millions > 1 ? toWords(millions) : "") +
      (millions > 1 ? " millions " : " un million ");
    num %= 1000000;
  }

  if (Math.floor(num / 1000) > 0) {
    const thousands = Math.floor(num / 1000);
    words += (thousands > 1 ? toWords(thousands) : "") + " mille ";
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    const hundreds = Math.floor(num / 100);
    words +=
      (hundreds > 1 ? units[hundreds] : "") +
      " cent" +
      (hundreds > 1 && num % 100 === 0 ? "s " : " ");
    num %= 100;
  }

  if (num > 0) {
    if (num < 10) {
      words += units[num];
    } else if (num < 20) {
      words += teens[num - 10];
    } else {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      words += tens[ten];
      if (unit > 0) {
        if (unit === 1 && ten < 8) words += " et ";
        else words += "-";
        words += units[unit];
      }
    }
  }

  return words.trim();
}

export function numberToWordsFr(num) {
  const numericValue = typeof num === "string" ? parseFloat(num) : num;
  if (typeof numericValue !== "number" || isNaN(numericValue)) {
    return "Invalid number";
  }

  const integerPart = Math.floor(numericValue);
  const decimalPart = Math.round((numericValue - integerPart) * 100);

  let result = toWords(integerPart) + " dirhams";

  if (decimalPart > 0) {
    result += " et " + toWords(decimalPart) + " centimes";
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
