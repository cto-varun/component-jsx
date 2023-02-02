"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactJsxParser = _interopRequireDefault(require("react-jsx-parser"));
var _react2 = require("@emotion/react");
var _componentMessageBus = require("@ivoyant/component-message-bus");
var _componentCache = require("@ivoyant/component-cache");
var _moment = _interopRequireDefault(require("moment"));
var _utils = require("./utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const renderError = (jsx, fallback, warn) => {
  if (warn) {
    console.warn(`Failed to parse expression "${jsx}". Rendering fallback.`);
  }
  return fallback || '';
};
const parseJSX = (str, parameters) => {
  const jsx = (0, _utils.parse)(str, parameters);
  const {
    bindings,
    components,
    fallback,
    showWarnings = true
  } = parameters;
  return (0, _react2.jsx)(_reactJsxParser.default, {
    jsx: jsx,
    bindings: bindings,
    components: components,
    renderInWrapper: false,
    renderError: () => renderError(jsx, fallback, showWarnings)
  });
};
const wrapper = key => el => (0, _react2.jsx)(_react.default.Fragment, {
  key: key
}, el || null);
const parseElement = function (element, childElements, options, jsxOptions, forwardToChild) {
  let nestedLevel = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  let i = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
  let keyModifier = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : '';
  const key = `e${nestedLevel}${i}${keyModifier ? `-${keyModifier}` : ''}`;
  const wrap = wrapper(key);
  if ((0, _utils.isString)(element)) {
    if ((0, _utils.isChild)(element)) {
      const el = /*#__PURE__*/_react.default.cloneElement((0, _utils.getChild)(element, childElements), {
        ...forwardToChild,
        key: `child-${key}`
      });
      return wrap(el);
    }
    return wrap((0, _utils.isJSX)(element) ? parseJSX(element, {
      ...options,
      ...jsxOptions
    }) : (0, _utils.parse)(element, options));
  }
  if ((0, _utils.isObject)(element)) {
    if (element.condition && element.render) {
      const condition = (0, _utils.parse)(element.condition, options);
      return wrap(condition ? parseElement(element.render[0], childElements, options, jsxOptions, forwardToChild, nestedLevel + 1, i, 'c-0') : parseElement(element.render[1], childElements, options, jsxOptions, forwardToChild, nestedLevel + 1, i, 'c-1'));
    }
    return wrap(null);
  }
  if ((0, _utils.isArray)(element)) {
    let Tag = 'div';
    let props = {};
    let children = null;
    const isProps = el => (0, _utils.isObject)(el) && !(el.condition && el.render);
    element.forEach((el, index) => {
      if (index === 0 && ((0, _utils.isString)(el) || el == null)) {
        Tag = options.get(options.components, el, el || _react.default.Fragment);
      } else if (index === 1 && isProps(el)) {
        props = (0, _utils.parse)(el, options) || {};
        if (props.css) {
          props = {
            ...props,
            css: (0, _react2.css)`
                            ${props.css}
                        `
          };
        }
      } else {
        children = [...(children || []), parseElement(el, childElements, options, jsxOptions, forwardToChild, nestedLevel + 1, index + i)];
      }
    });
    return (0, _react2.jsx)(Tag, _extends({}, props, {
      key: key
    }), children);
  }
  return wrap((0, _utils.parse)(element, options, jsxOptions));
};
const sendWorkflowEvent = (workflowEvent, data, datasources) => {
  const workflow = workflowEvent.split('.')[0];
  const event = workflowEvent.split('.')[1];
  let datasource;
  if (data?.datasource) {
    datasource = datasources[data.datasource];
  }
  _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
    header: {
      registrationId: workflow,
      workflow,
      eventType: event
    },
    body: {
      request: {
        ...(data || {
          body: {}
        })
      },
      datasource
    }
  });
};
const sendEvent = datasources => function (event, data) {
  let isWorkflow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  isWorkflow ? sendWorkflowEvent(event, data, datasources) : _componentMessageBus.MessageBus.send(event, data);
};
const ParsedTemplate = _ref => {
  let {
    childElements,
    render = [],
    imports,
    state,
    setState,
    constants,
    forwardToChild,
    stringifiedState,
    datasources
  } = _ref;
  const components = {
    ...imports.component
  };
  const parameters = {
    ...constants,
    ...imports.module,
    state,
    setState,
    sendEvent: sendEvent(datasources),
    components,
    cache: _componentCache.cache.getAll()
  };
  const jsxParameters = {
    components,
    bindings: {
      ...constants,
      ...imports.module,
      state,
      log: console.log,
      cache: _componentCache.cache.getAll()
    }
  };
  return _react.default.useMemo(() => parseElement(render, childElements, parameters, jsxParameters, forwardToChild), [stringifiedState]);
};
var _default = ParsedTemplate;
exports.default = _default;
module.exports = exports.default;