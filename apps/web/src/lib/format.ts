export const currency = (amount:string|number|undefined, code="NGN") =>
  new Intl.NumberFormat("en-NG",{style:"currency",currency:code,maximumFractionDigits:0}).format(Number(amount||0));
