export const invalidInputChecks = (expected) => [
  ["no input", , expected],
  ["undefined", undefined, expected],
  ["null", null, expected],
  ["Truthy", true, expected],
  ["Falsy", false, expected],
  ["int zero", 0, expected],
  ["int non zero", 123, expected],
  ["empty object", {}, expected],
  ["empty list", [], expected],
  ["non empty list", ["XXX"], expected],
  ["invalid .json file path", "./xxx.json", expected],
  ["invalid .js file", "./xxx.js", expected],
  ["invalid folder", "./xxx", expected],
]

export const forwardSlash = (path: string) => path.replace(/\\/g, "/");