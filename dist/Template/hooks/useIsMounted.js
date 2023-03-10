"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
const useIsMountedRef = () => {
  const isMountedRef = (0, _react.useRef)(false);
  (0, _react.useEffect)(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  return isMountedRef;
};
var _default = useIsMountedRef;
exports.default = _default;
module.exports = exports.default;