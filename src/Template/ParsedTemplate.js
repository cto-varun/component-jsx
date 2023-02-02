import React from 'react';
import JSXParser from 'react-jsx-parser';
/** @jsx emotionJSX */
import { css, jsx as emotionJSX } from '@emotion/react';
import { MessageBus } from '@ivoyant/component-message-bus';
import { cache } from '@ivoyant/component-cache';
import moment from 'moment';

import {
    parse,
    isArray,
    isString,
    isObject,
    isJSX,
    isChild,
    getChild,
} from './utils';

const renderError = (jsx, fallback, warn) => {
    if (warn) {
        console.warn(
            `Failed to parse expression "${jsx}". Rendering fallback.`
        );
    }
    return fallback || '';
};

const parseJSX = (str, parameters) => {
    const jsx = parse(str, parameters);
    const { bindings, components, fallback, showWarnings = true } = parameters;
    return (
        <JSXParser
            jsx={jsx}
            bindings={bindings}
            components={components}
            renderInWrapper={false}
            renderError={() => renderError(jsx, fallback, showWarnings)}
        />
    );
};

const wrapper = (key) => (el) => (
    <React.Fragment key={key}>{el || null}</React.Fragment>
);

const parseElement = (
    element,
    childElements,
    options,
    jsxOptions,
    forwardToChild,
    nestedLevel = 0,
    i = 0,
    keyModifier = ''
) => {
    const key = `e${nestedLevel}${i}${keyModifier ? `-${keyModifier}` : ''}`;
    const wrap = wrapper(key);

    if (isString(element)) {
        if (isChild(element)) {
            const el = React.cloneElement(getChild(element, childElements), {
                ...forwardToChild,
                key: `child-${key}`,
            });

            return wrap(el);
        }
        return wrap(
            isJSX(element)
                ? parseJSX(element, { ...options, ...jsxOptions })
                : parse(element, options)
        );
    }

    if (isObject(element)) {
        if (element.condition && element.render) {
            const condition = parse(element.condition, options);
            return wrap(
                condition
                    ? parseElement(
                          element.render[0],
                          childElements,
                          options,
                          jsxOptions,
                          forwardToChild,
                          nestedLevel + 1,
                          i,
                          'c-0'
                      )
                    : parseElement(
                          element.render[1],
                          childElements,
                          options,
                          jsxOptions,
                          forwardToChild,
                          nestedLevel + 1,
                          i,
                          'c-1'
                      )
            );
        }
        return wrap(null);
    }

    if (isArray(element)) {
        let Tag = 'div';
        let props = {};
        let children = null;
        const isProps = (el) => isObject(el) && !(el.condition && el.render);

        element.forEach((el, index) => {
            if (index === 0 && (isString(el) || el == null)) {
                Tag = options.get(options.components, el, el || React.Fragment);
            } else if (index === 1 && isProps(el)) {
                props = parse(el, options) || {};
                if (props.css) {
                    props = {
                        ...props,
                        css: css`
                            ${props.css}
                        `,
                    };
                }
            } else {
                children = [
                    ...(children || []),
                    parseElement(
                        el,
                        childElements,
                        options,
                        jsxOptions,
                        forwardToChild,
                        nestedLevel + 1,
                        index + i
                    ),
                ];
            }
        });

        return (
            <Tag {...props} key={key}>
                {children}
            </Tag>
        );
    }

    return wrap(parse(element, options, jsxOptions));
};

const sendWorkflowEvent = (workflowEvent, data, datasources) => {
    const workflow = workflowEvent.split('.')[0];
    const event = workflowEvent.split('.')[1];
    let datasource;
    if (data?.datasource) {
        datasource = datasources[data.datasource];
    }
    MessageBus.send('WF.'.concat(workflow).concat('.').concat(event), {
        header: {
            registrationId: workflow,
            workflow,
            eventType: event,
        },
        body: {
            request: { ...(data || { body: {} }) },
            datasource,
        },
    });
};

const sendEvent = (datasources) => (event, data, isWorkflow = true) => {
    isWorkflow
        ? sendWorkflowEvent(event, data, datasources)
        : MessageBus.send(event, data);
};

const ParsedTemplate = ({
    childElements,
    render = [],
    imports,
    state,
    setState,
    constants,
    forwardToChild,
    stringifiedState,
    datasources,
}) => {
    const components = {
        ...imports.component,
    };

    const parameters = {
        ...constants,
        ...imports.module,
        state,
        setState,
        sendEvent: sendEvent(datasources),
        components,
        cache: cache.getAll(),
    };

    const jsxParameters = {
        components,
        bindings: {
            ...constants,
            ...imports.module,
            state,
            log: console.log,
            cache: cache.getAll(),
        },
    };

    return React.useMemo(
        () =>
            parseElement(
                render,
                childElements,
                parameters,
                jsxParameters,
                forwardToChild
            ),
        [stringifiedState]
    );
};

export default ParsedTemplate;
