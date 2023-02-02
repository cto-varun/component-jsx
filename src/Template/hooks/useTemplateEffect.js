import { useEffect, useMemo } from 'react';
import usePrevious from './usePrevious';
import { parse, isObject, isString } from '../utils';

const normalizeEffectObj = (effect) => {
    if (!effect) {
        throw new Error('Effect must be specified.');
    }

    if (isString(effect)) {
        return {
            effectName: effect,
            effectExpression: effect,
        };
    }

    if (Array.isArray(effect) && effect.length === 2) {
        return {
            effectName: effect[0],
            effectExpression: effect[1],
        };
    }

    throw new Error('Invalid format for `effect`');
};

const normalizeEffect = (effect) => {
    if (isString(effect)) {
        return {
            effectName: null,
            effectExpression: effect,
            dependencies: null,
        };
    }

    if (!isObject(effect)) {
        throw new Error('Effect must be an object.');
    }

    if (isObject(effect)) {
        return {
            ...normalizeEffectObj(effect.effect),
            dependencies: effect.dependencies || null,
        };
    }
};

const processDependencies = (effects, [state, setState], constants) => {
    return effects.reduce(
        (acc, effect) => {
            const {
                effectName,
                effectExpression,
                dependencies,
            } = normalizeEffect(effect);

            if (!dependencies) {
                return {
                    ...acc,
                    effectsByNull: [
                        ...acc.effectsByNull,
                        parse(effectExpression, { state, setState, constants }),
                    ],
                };
            }

            if (Array.isArray(dependencies) && dependencies.length === 0) {
                return {
                    ...acc,
                    effectsByMount: [
                        ...acc.effectsByMount,
                        parse(effectExpression, { state, setState, constants }),
                    ],
                };
            }

            if (Array.isArray(dependencies) && dependencies.length) {
                return {
                    ...acc,
                    effectsByValue: {
                        ...acc.effectsByValue,
                        [effectName]: parse(effectExpression, {
                            state,
                            setState,
                            constants,
                        }),
                    },
                    dependencyList: {
                        ...acc.dependencyList,
                        ...dependencies
                            .map((dep) => {
                                if (!dep.startsWith('@f')) {
                                    throw new Error(
                                        `Dependency \`${dep}\` must be parseable with \`@f\``
                                    );
                                }

                                const name = dep.slice('@f'.length).trim();
                                const expression = parse(dep, {
                                    state,
                                    constants,
                                });

                                return {
                                    name,
                                    expression,
                                };
                            })
                            .reduce((curr, dep) => {
                                return {
                                    ...curr,
                                    [dep.name]: {
                                        dependents: [
                                            ...(curr[dep.name]?.dependents ||
                                                []),
                                            effectName,
                                        ],
                                        value: dep.expression,
                                    },
                                };
                            }, acc.dependencyList),
                    },
                };
            }

            return acc;
        },
        {
            effectsByNull: [],
            effectsByMount: [],
            effectsByValue: {},
            dependencyList: {},
        }
    );
};
const useTemplateEffect = (
    { effects = [] },
    isProcessed,
    stateHook,
    constants
) => {
    const {
        effectsByNull,
        effectsByMount,
        effectsByValue,
        dependencyList,
    } = useMemo(() => processDependencies(effects, stateHook, constants), []);
    const { names, deps } = useMemo(
        () =>
            Object.keys(dependencyList).reduce(
                (acc, k) => {
                    return {
                        ...acc,
                        names: [...acc.names, k],
                        deps: [...acc.deps, dependencyList[k].value],
                    };
                },
                { names: [], deps: [] }
            ),
        []
    );

    const previousDeps = usePrevious(deps, []);

    useEffect(() => {
        if (effectsByNull.length && isProcessed) {
            effectsByNull.forEach((e) => e());
        }
    });

    useEffect(() => {
        if (effectsByMount.length && isProcessed) {
            effectsByMount.forEach((e) => e());
        }
    }, []);

    useEffect(() => {
        if (isProcessed) {
            deps.forEach((dep, index) => {
                if (dep !== previousDeps[index]) {
                    const name = names[index];
                    (dependencyList[name]?.dependents || []).forEach(
                        (effectName) => {
                            const effect = effectsByValue[effectName];
                            if (effect) {
                                effect();
                            }
                        }
                    );
                }
            });
        }
    }, deps);

    return { state: stateHook[0], setState: stateHook[1] };
};

export default useTemplateEffect;
