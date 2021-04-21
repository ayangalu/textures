export function format(svg: string) {
   return svg.replace(/&apos;/gmu, `'`).replace(
      /^(  )+/gmu,
      (indent) =>
         indent
            .match(/ {1,2}/gu)
            ?.map(() => '\t')
            .join('') ?? '',
   );
}
