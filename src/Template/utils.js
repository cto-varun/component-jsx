import mapValues from 'lodash/mapValues';

let DEFAULT_DELIMITER = '@';
let FUNCTION = '@@';
let JSX = '@jsx';
let CHILD = '@child';

export const setDefaultDelimiter = (delimiter) => {
    DEFAULT_DELIMITER = delimiter;
    FUNCTION = `${DEFAULT_DELIMITER}${DEFAULT_DELIMITER}`;
    JSX = `${DEFAULT_DELIMITER}jsx`;
    CHILD = `${DEFAULT_DELIMITER}child`;
};

export const isArray = (v) => Array.isArray(v);
export const isObject = (obj) =>
    obj && typeof obj === 'object' && obj.constructor === Object;
export const isString = (v) => typeof v === 'string';
export const isJSX = (v) => isString(v) && v.startsWith(JSX);
export const isStringFn = (v) => isString(v) && v.startsWith(FUNCTION);
export const isChild = (v) => isString(v) && v.startsWith(CHILD);
export const getChild = (v, children) =>
    (isString(v) &&
        v.startsWith(CHILD) &&
        children &&
        children[v.slice(CHILD.length).trim()]) ||
    null;

export const stringParser = ({ parameters = {}, expression, warn = false }) => {
    const keys = Object.keys(parameters).join(', ');
    try {
        const fn = new Function(`{ ${keys} }`, `return ${expression}`)(
            parameters
        );
        return fn;
    } catch (e) {
        if (warn) {
            console.warn(`Failed to parse function: ${expression}`);
        }
        return null;
    }
};

const process = (value, parameters) => {
    if (isStringFn(value)) {
        const expression = value.slice(FUNCTION.length).trim();
        return stringParser({
            parameters,
            expression,
        });
    }

    if (isJSX(value)) {
        const expression = value.slice(JSX.length).trim();
        return expression;
    }

    return value;
};

const valueIterator = (parameters) => (value) => {
    if (isString(value)) return process(value, parameters);
    if (isObject(value)) return mapValues(value, valueIterator(parameters));
    if (isArray(value)) return parseArray(value, parameters);
    return value;
};

export const parse = (value, parameters) =>
    mapValues({ value }, valueIterator(parameters)).value;

const parseArray = (arr, parameters) =>
    arr.map((item) => {
        if (isString(item)) return process(item, parameters);
        if (isObject(item)) return parse(item, parameters);
        if (isArray(item)) return parseArray(item, parameters);
        return item;
    });
