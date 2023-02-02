import { useLayoutEffect, useRef, useState } from 'react';
import { parse } from '../utils';

const reducer = (obj, imports) =>
    Object.keys(obj).reduce(
        (acc, k) => {
            return {
                ...acc,
                [k]: parse(obj[k], acc),
            };
        },
        { ...imports }
    );

const useTemplateState = (
    { state = {}, constants = {} },
    parentState,
    parentSetState,
    moduleImports
) => {
    const [isProcessed, setIsProcessed] = useState(false);
    const [templateState, setTemplateState] = useState({});
    const constantsRef = useRef();
    useLayoutEffect(() => {
        const parsedState = reducer(state, moduleImports);
        constantsRef.current = reducer(constants, moduleImports);

        if (parentSetState) {
            parentSetState((s) => ({
                ...s,
                ...parsedState,
            }));
        } else {
            setTemplateState({ ...parsedState, ...parentState });
        }

        setIsProcessed(true);
    }, []);

    return {
        stateHook:
            parentState && parentSetState
                ? [parentState, parentSetState]
                : [templateState, setTemplateState],
        constants: constantsRef.current,
        isProcessed,
    };
};

export default useTemplateState;
