"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stringParser = exports.setDefaultDelimiter = exports.parse = exports.isStringFn = exports.isString = exports.isObject = exports.isJSX = exports.isChild = exports.isArray = exports.getChild = void 0;
var _mapValues = _interopRequireDefault(require("lodash/mapValues"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
let DEFAULT_DELIMITER = '@';
let FUNCTION = '@@';
let JSX = '@jsx';
let CHILD = '@child';
const setDefaultDelimiter = delimiter => {
  DEFAULT_DELIMITER = delimiter;
  FUNCTION = `${DEFAULT_DELIMITER}${DEFAULT_DELIMITER}`;
  JSX = `${DEFAULT_DELIMITER}jsx`;
  CHILD = `${DEFAULT_DELIMITER}child`;
};
exports.setDefaultDelimiter = setDefaultDelimiter;
const isArray = v => Array.isArray(v);
exports.isArray = isArray;
const isObject = obj => obj && typeof obj === 'object' && obj.constructor === Object;
exports.isObject = isObject;
const isString = v => typeof v === 'string';
exports.isString = isString;
const isJSX = v => isString(v) && v.startsWith(JSX);
exports.isJSX = isJSX;
const isStringFn = v => isString(v) && v.startsWith(FUNCTION);
exports.isStringFn = isStringFn;
const isChild = v => isString(v) && v.startsWith(CHILD);
exports.isChild = isChild;
const getChild = (v, children) => isString(v) && v.startsWith(CHILD) && children && children[v.slice(CHILD.length).trim()] || null;
exports.getChild = getChild;
const stringParser = _ref => {
  let {
    parameters = {},
    expression,
    warn = false
  } = _ref;
  const keys = Object.keys(parameters).join(', ');
  try {
    const fn = new Function(`{ ${keys} }`, `return ${expression}`)(parameters);
    return fn;
  } catch (e) {
    if (warn) {
      console.warn(`Failed to parse function: ${expression}`);
    }
    return null;
  }
};
exports.stringParser = stringParser;
const process = (value, parameters) => {
  if (isStringFn(value)) {
    const expression = value.slice(FUNCTION.length).trim();
    return stringParser({
      parameters,
      expression
    });
  }
  if (isJSX(value)) {
    const expression = value.slice(JSX.length).trim();
    return expression;
  }
  return value;
};
const valueIterator = parameters => value => {
  if (isString(value)) return process(value, parameters);
  if (isObject(value)) return (0, _mapValues.default)(value, valueIterator(parameters));
  if (isArray(value)) return parseArray(value, parameters);
  return value;
};
const parse = (value, parameters) => (0, _mapValues.default)({
  value
}, valueIterator(parameters)).value;
exports.parse = parse;
const parseArray = (arr, parameters) => arr.map(item => {
  if (isString(item)) return process(item, parameters);
  if (isObject(item)) return parse(item, parameters);
  if (isArray(item)) return parseArray(item, parameters);
  return item;
});