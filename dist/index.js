"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Template = _interopRequireDefault(require("./Template"));
var _jsxTemplate = require("./jsxTemplate.schema");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = {
  component: _Template.default,
  schema: _jsxTemplate.schema,
  ui: _jsxTemplate.ui
};
exports.default = _default;
module.exports = exports.default;