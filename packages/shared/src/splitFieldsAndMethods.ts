export const splitFieldsAndMethods = (obj) => {
  const fields = {};
  const methods = {};
  for (const k in obj) {
    if (typeof obj[k] === "function") {
      methods[k] = obj[k];
    } else {
      fields[k] = obj[k];
    }
  }
  return {
    fields,
    methods,
  };
}
