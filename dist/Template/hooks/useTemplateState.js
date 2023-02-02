"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _utils = require("../utils");
const reducer = (obj, imports) => Object.keys(obj).reduce((acc, k) => {
  return {
    ...acc,
    [k]: (0, _utils.parse)(obj[k], acc)
  };
}, {
  ...imports
});
const useTemplateState = (_ref, parentState, parentSetState, moduleImports) => {
  let {
    state = {},
    constants = {}
  } = _ref;
  const [isProcessed, setIsProcessed] = (0, _react.useState)(false);
  const [templateState, setTemplateState] = (0, _react.useState)({});
  const constantsRef = (0, _react.useRef)();
  (0, _react.useLayoutEffect)(() => {
    const parsedState = reducer(state, moduleImports);
    constantsRef.current = reducer(constants, moduleImports);
    if (parentSetState) {
      parentSetState(s => ({
        ...s,
        ...parsedState
      }));
    } else {
      setTemplateState({
        ...parsedState,
        ...parentState
      });
    }
    setIsProcessed(true);
  }, []);
  return {
    stateHook: parentState && parentSetState ? [parentState, parentSetState] : [templateState, setTemplateState],
    constants: constantsRef.current,
    isProcessed
  };
};
var _default = useTemplateState;
exports.default = _default;
module.exports = exports.default;