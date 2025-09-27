// utils/format.ts

export const formatCurrency = (num: number | string) => {
  if (num === null || num === undefined || isNaN(Number(num))) return "0₫";
  const n = Number(num);
  return n.toLocaleString("vi-VN", { minimumFractionDigits: 0 }) + "₫";
};

export const formatPhone = (sdt: string | number) => {
  if (!sdt) return "";
  let str = sdt.toString().replace(/\D/g, "");

  if (str.startsWith("0")) str = "+84" + str.slice(1);
  else if (!str.startsWith("+84")) str = "+84" + str.slice(str.length - 9);

  const country = str.slice(0, 3);
  const part1 = str.slice(3, 6);
  const part2 = str.slice(6, 9);
  const part3 = str.slice(9);

  return [country, part1, part2, part3].filter(Boolean).join(" ");
};
