import { useEffect, useState } from 'react';
import { Space, Row, Col, Typography, notification, Button } from 'antd';
import get from 'lodash/get';

const DEFAULT_COMPONENT_IMPORTS = {
    Space,
    Row,
    Col,
    Typography,
    Button,
};

const DEFAULT_MODULE_IMPORTS = {
    notification,
    get,
};

// relative to /src/plugins/pluginRegistry.js
const normalizeImport = (toImport) => {
    if (typeof toImport === 'string') {
        return {
            src: toImport,
            name: toImport,
            default: true,
        };
    }

    if (Array.isArray(toImport) || typeof toImport !== 'object') {
        throw new Error(
            `Import configuration cannot be ${
                Array.isArray(toImport)
                    ? 'an array.'
                    : `of type \`${typeof toImport}\`.`
            }`
        );
    }

    return {
        name: toImport.name,
        default: toImport.default || true,
        src: toImport.src,
        as: toImport.as || 'component', // or 'module'
    };
};

const processImports = (plugin, imports, setImportList) => {
    imports.forEach(async (toImport) => {
        const { name, default: isDefault, src, as } = normalizeImport(toImport);

        try {
            const invoked = await plugin.invoke('async.loader', src)[0];
            if (invoked.module) {
                setImportList((importList) => ({
                    ...importList,
                    [as]: {
                        ...(importList[as] || {}),
                        [name]: isDefault
                            ? invoked.module.default
                            : invoked.module,
                    },
                }));
            } else if (invoked.error) {
                setImportList((importList) => ({
                    ...importList,
                    errors: importList.errors + 1,
                }));
            }
        } catch (error) {
            console.warn(error);
            setImportList((importList) => ({
                ...importList,
                errors: importList.errors + 1,
            }));
        }
    });
};

const useImports = ({ import: imports = [] }, plugin) => {
    const [isLoading, setIsLoading] = useState(true);
    const [importList, setImportList] = useState({ errors: 0 });
    useEffect(() => {
        const loadImports = async () => {
            await processImports(plugin, imports, setImportList);
        };

        loadImports();
    }, []);

    useEffect(() => {
        let objectCount = 0;
        Object.keys(importList).forEach((k) => {
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
                ...DEFAULT_MODULE_IMPORTS,
            },
            component: {
                ...importList.component,
                ...DEFAULT_COMPONENT_IMPORTS,
            },
        },
        isLoading,
    };
};

export default useImports;
