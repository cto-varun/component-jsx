import React from 'react';
import { Spin } from 'antd';
import { setDefaultDelimiter } from './utils';
import useImports from './hooks/useImports';
import useTemplateEffect from './hooks/useTemplateEffect';
import useTemplateState from './hooks/useTemplateState';
import ParsedTemplate from './ParsedTemplate';

const Template = (props) => {
    const {
        data: { data },
        component: { params: config },
        children = [],
        plugin,
        parentState = {},
        parentSetState = null,
        parentProps = {}
    } = props;

    const {datasources = {}} = parentProps;

    setDefaultDelimiter(config.delimiter || '@');
    const { isLoading, imports } = useImports(config, plugin);
    const { stateHook, constants, isProcessed } = useTemplateState(
        config,
        parentState,
        parentSetState,
        imports.module
    );
    const { state, setState } = useTemplateEffect(
        config,
        isProcessed,
        stateHook,
        constants
    );

    const stringifiedState = JSON.stringify(state);

    const forwardToChild = {
        parentSetState: setState,
        parentProps: props,
        parentConstants: constants,
        parentState: state,
    };

    return !isLoading && isProcessed ? (
        <ParsedTemplate
            render={config.render}
            imports={imports}
            state={state}
            setState={setState}
            datasources={datasources}
            constants={{ ...constants, data }}
            childElements={React.Children.toArray(children)}
            forwardToChild={forwardToChild}
            stringifiedState={stringifiedState}
        />
    ) : (
        <Spin tip="Loading..." />
    );
};

export default Template;
