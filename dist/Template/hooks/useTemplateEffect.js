"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _usePrevious = _interopRequireDefault(require("./usePrevious"));
var _utils = require("../utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const normalizeEffectObj = effect => {
  if (!effect) {
    throw new Error('Effect must be specified.');
  }
  if ((0, _utils.isString)(effect)) {
    return {
      effectName: effect,
      effectExpression: effect
    };
  }
  if (Array.isArray(effect) && effect.length === 2) {
    return {
      effectName: effect[0],
      effectExpression: effect[1]
    };
  }
  throw new Error('Invalid format for `effect`');
};
const normalizeEffect = effect => {
  if ((0, _utils.isString)(effect)) {
    return {
      effectName: null,
      effectExpression: effect,
      dependencies: null
    };
  }
  if (!(0, _utils.isObject)(effect)) {
    throw new Error('Effect must be an object.');
  }
  if ((0, _utils.isObject)(effect)) {
    return {
      ...normalizeEffectObj(effect.effect),
      dependencies: effect.dependencies || null
    };
  }
};
const processDependencies = (effects, _ref, constants) => {
  let [state, setState] = _ref;
  return effects.reduce((acc, effect) => {
    const {
      effectName,
      effectExpression,
      dependencies
    } = normalizeEffect(effect);
    if (!dependencies) {
      return {
        ...acc,
        effectsByNull: [...acc.effectsByNull, (0, _utils.parse)(effectExpression, {
          state,
          setState,
          constants
        })]
      };
    }
    if (Array.isArray(dependencies) && dependencies.length === 0) {
      return {
        ...acc,
        effectsByMount: [...acc.effectsByMount, (0, _utils.parse)(effectExpression, {
          state,
          setState,
          constants
        })]
      };
    }
    if (Array.isArray(dependencies) && dependencies.length) {
      return {
        ...acc,
        effectsByValue: {
          ...acc.effectsByValue,
          [effectName]: (0, _utils.parse)(effectExpression, {
            state,
            setState,
            constants
          })
        },
        dependencyList: {
          ...acc.dependencyList,
          ...dependencies.map(dep => {
            if (!dep.startsWith('@f')) {
              throw new Error(`Dependency \`${dep}\` must be parseable with \`@f\``);
            }
            const name = dep.slice('@f'.length).trim();
            const expression = (0, _utils.parse)(dep, {
              state,
              constants
            });
            return {
              name,
              expression
            };
          }).reduce((curr, dep) => {
            return {
              ...curr,
              [dep.name]: {
                dependents: [...(curr[dep.name]?.dependents || []), effectName],
                value: dep.expression
              }
            };
          }, acc.dependencyList)
        }
      };
    }
    return acc;
  }, {
    effectsByNull: [],
    effectsByMount: [],
    effectsByValue: {},
    dependencyList: {}
  });
};
const useTemplateEffect = (_ref2, isProcessed, stateHook, constants) => {
  let {
    effects = []
  } = _ref2;
  const {
    effectsByNull,
    effectsByMount,
    effectsByValue,
    dependencyList
  } = (0, _react.useMemo)(() => processDependencies(effects, stateHook, constants), []);
  const {
    names,
    deps
  } = (0, _react.useMemo)(() => Object.keys(dependencyList).reduce((acc, k) => {
    return {
      ...acc,
      names: [...acc.names, k],
      deps: [...acc.deps, dependencyList[k].value]
    };
  }, {
    names: [],
    deps: []
  }), []);
  const previousDeps = (0, _usePrevious.default)(deps, []);
  (0, _react.useEffect)(() => {
    if (effectsByNull.length && isProcessed) {
      effectsByNull.forEach(e => e());
    }
  });
  (0, _react.useEffect)(() => {
    if (effectsByMount.length && isProcessed) {
      effectsByMount.forEach(e => e());
    }
  }, []);
  (0, _react.useEffect)(() => {
    if (isProcessed) {
      deps.forEach((dep, index) => {
        if (dep !== previousDeps[index]) {
          const name = names[index];
          (dependencyList[name]?.dependents || []).forEach(effectName => {
            const effect = effectsByValue[effectName];
            if (effect) {
              effect();
            }
          });
        }
      });
    }
  }, deps);
  return {
    state: stateHook[0],
    setState: stateHook[1]
  };
};
var _default = useTemplateEffect;
exports.default = _default;
module.exports = exports.default;