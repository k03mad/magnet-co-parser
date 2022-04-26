/**
 * @param {string} src
 * @param {string} proxy
 * @returns {string}
 */
export const getCover = (src, proxy) => {
    if (proxy) {
        return proxy + encodeURIComponent(src);
    }

    return src;
};
