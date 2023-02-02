import { useEffect, useRef } from 'react';

const usePrevious = (value, initialValue) => {
    const ref = useRef(initialValue);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

export default usePrevious;
