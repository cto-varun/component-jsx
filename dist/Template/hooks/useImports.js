"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _antd = require("antd");
var _get = _interopRequireDefault(require("lodash/get"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DEFAULT_COMPONENT_IMPORTS = {
  Space: _antd.Space,
  Row: _antd.Row,
  Col: _antd.Col,
  Typography: _antd.Typography,
  Button: _antd.Button
};
const DEFAULT_MODULE_IMPORTS = {
  notification: _antd.notification,
  get: _get.default
};

// relative to /src/plugins/pluginRegistry.js
const normalizeImport = toImport => {
  if (typeof toImport === 'string') {
    return {
      src: toImport,
      name: toImport,
      default: true
    };
  }
  if (Array.isArray(toImport) || typeof toImport !== 'object') {
    throw new Error(`Import configuration cannot be ${Array.isArray(toImport) ? 'an array.' : `of type \`${typeof toImport}\`.`}`);
  }
  return {
    name: toImport.name,
    default: toImport.default || true,
    src: toImport.src,
    as: toImport.as || 'component' // or 'module'
  };
};

const processImports = (plugin, imports, setImportList) => {
  imports.forEach(async toImport => {
    const {
      name,
      default: isDefault,
      src,
      as
    } = normalizeImport(toImport);
    try {
      const invoked = await plugin.invoke('async.loader', src)[0];
      if (invoked.module) {
        setImportList(importList => ({
          ...importList,
          [as]: {
            ...(importList[as] || {}),
            [name]: isDefault ? invoked.module.default : invoked.module
          }
        }));
      } else if (invoked.error) {
        setImportList(importList => ({
          ...importList,
          errors: importList.errors + 1
        }));
      }
    } catch (error) {
      console.warn(error);
      setImportList(importList => ({
        ...importList,
        errors: importList.errors + 1
      }));
    }
  });
};
const useImports = (_ref, plugin) => {
  let {
    import: imports = []
  } = _ref;
  const [isLoading, setIsLoading] = (0, _react.useState)(true);
  const [importList, setImportList] = (0, _react.useState)({
    errors: 0
  });
  (0, _react.useEffect)(() => {
    const loadImports = async () => {
      await processImports(plugin, imports, setImportList);
    };
    loadImports();
  }, []);
  (0, _react.useEffect)(() => {
    let objectCount = 0;
    Object.keys(importList).forEach(k => {
      if (k !== 'errors') {
        objectCount += Object.keys(importList[k]).length;
      }
    });
    if (objectCount + importList.errors === imports.length) {
      setIsLoading(false);
    }
  }, [importList, isLoading]);
  return {
    imports: {
      ...importList,
      module: {
        ...importList.module,
        ...DEFAULT_MODULE_IMPORTS
      },
      component: {
        ...importList.component,
        ...DEFAULT_COMPONENT_IMPORTS
      }
    },
    isLoading
  };
};
var _default = useImports;
exports.default = _default;
module.exports = exports.default;