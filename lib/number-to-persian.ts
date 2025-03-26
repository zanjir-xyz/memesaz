// Convert numbers to Persian words
export function convertToPersianWords(num: number | string): string {
  if (num === undefined || num === null || num === "") return ""

  // Convert to number if it's a string
  const number = typeof num === "string" ? Number.parseFloat(num) : num

  // Handle zero
  if (number === 0) return "صفر"

  // Handle negative numbers
  if (number < 0) return `منفی ${convertToPersianWords(Math.abs(number))}`

  // Define Persian number words
  const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"]
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"]
  const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"]
  const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"]
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"]

  // Function to convert a 3-digit group to words
  function convertGroup(num: number): string {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    const ten = Math.floor(remainder / 10)
    const unit = remainder % 10

    let result = ""

    if (hundred > 0) {
      result += hundreds[hundred]
      if (remainder > 0) result += " و "
    }

    if (ten === 1) {
      result += teens[unit]
    } else {
      if (ten > 0) {
        result += tens[ten]
        if (unit > 0) result += " و "
      }
      if (unit > 0) {
        result += units[unit]
      }
    }

    return result
  }

  // Handle numbers up to 999 trillion
  const numStr = Math.floor(number).toString()
  const groups = []

  // Split into groups of 3 digits
  for (let i = numStr.length; i > 0; i -= 3) {
    groups.unshift(Number.parseInt(numStr.substring(Math.max(0, i - 3), i), 10))
  }

  // Convert each group and add scale
  let result = ""
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    if (group === 0) continue

    const words = convertGroup(group)
    const scale = scales[groups.length - i - 1]

    if (result.length > 0) result += " و "
    result += words
    if (scale) result += " " + scale
  }

  // Add decimal part if present
  if (number !== Math.floor(number)) {
    const decimalStr = number.toString().split(".")[1]
    if (decimalStr && decimalStr !== "0") {
      result += ` ممیز ${convertToPersianWords(decimalStr)} دهم`
    }
  }

  return result
}

// Format large numbers with commas
export function formatNumber(num: number | string): string {
  if (num === undefined || num === null || num === "") return ""

  const number = typeof num === "string" ? num : num.toString()
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

