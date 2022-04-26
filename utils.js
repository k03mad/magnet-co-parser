const expire = time => ({expire: time});

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

/**
 * @param {'rutor-search'|'rutor-page'|'tmdb-api'|'tmdb-img'} type
 * @returns {object}
 */
export const getExpire = type => {
    switch (type) {
        case 'rutor-search':
            return expire('30m');
        case 'rutor-page':
        case 'tmdb-api':
            return expire('7d');
        case 'tmdb-img':
            return expire('30d');

        default:
            throw new Error('unknown expire type');
    }
};
