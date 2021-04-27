export function format(svg: string) {
   return svg
      .replace(/&apos;/gmu, `'`)
      .replace(
         /^(  )+/gmu,
         (indent) =>
            indent
               .match(/ {1,2}/gu)
               ?.map(() => '\t')
               .join('') ?? '',
      )
      .replace(/&#x([0-9A-F]{4});/gmu, (_, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)));
}
