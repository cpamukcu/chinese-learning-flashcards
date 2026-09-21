// Tiny text checks with no dependencies. Kept apart from pinyin.ts because
// importing pinyin-pro drags its ~140 KB dictionary into whatever bundle uses it.

const CJK = /[㐀-鿿]/;

export function containsChinese(text: string): boolean {
  return CJK.test(text);
}

// Explanations and translations quote Chinese words ("米饭 is one word"), so
// text only counts as "not English" when Chinese characters outnumber Latin letters.
export function isMostlyChinese(text: string): boolean {
  const han = (text.match(/[㐀-鿿]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return han > latin;
}
