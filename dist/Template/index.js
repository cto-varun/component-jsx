"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _antd = require("antd");
var _utils = require("./utils");
var _useImports = _interopRequireDefault(require("./hooks/useImports"));
var _useTemplateEffect = _interopRequireDefault(require("./hooks/useTemplateEffect"));
var _useTemplateState = _interopRequireDefault(require("./hooks/useTemplateState"));
var _ParsedTemplate = _interopRequireDefault(require("./ParsedTemplate"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const Template = props => {
  const {
    data: {
      data
    },
    component: {
      params: config
    },
    children = [],
    plugin,
    parentState = {},
    parentSetState = null,
    parentProps = {}
  } = props;
  const {
    datasources = {}
  } = parentProps;
  (0, _utils.setDefaultDelimiter)(config.delimiter || '@');
  const {
    isLoading,
    imports
  } = (0, _useImports.default)(config, plugin);
  const {
    stateHook,
    constants,
    isProcessed
  } = (0, _useTemplateState.default)(config, parentState, parentSetState, imports.module);
  const {
    state,
    setState
  } = (0, _useTemplateEffect.default)(config, isProcessed, stateHook, constants);
  const stringifiedState = JSON.stringify(state);
  const forwardToChild = {
    parentSetState: setState,
    parentProps: props,
    parentConstants: constants,
    parentState: state
  };
  return !isLoading && isProcessed ? /*#__PURE__*/_react.default.createElement(_ParsedTemplate.default, {
    render: config.render,
    imports: imports,
    state: state,
    setState: setState,
    datasources: datasources,
    constants: {
      ...constants,
      data
    },
    childElements: _react.default.Children.toArray(children),
    forwardToChild: forwardToChild,
    stringifiedState: stringifiedState
  }) : /*#__PURE__*/_react.default.createElement(_antd.Spin, {
    tip: "Loading..."
  });
};
var _default = Template;
exports.default = _default;
module.exports = exports.default;