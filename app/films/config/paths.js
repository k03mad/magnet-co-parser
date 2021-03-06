import appRoot from 'app-root-path';

export default {
    /* eslint-disable jsdoc/require-jsdoc */
    parsed: {
        folder: `${appRoot}/parsed/films/`,
    },
    templates: {
        folder: `${appRoot}/templates/`,
        list: `${appRoot}/templates/list.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        folder: `${appRoot}/www/generated/films`,
        pages: `${appRoot}/www/generated/films/pages`,
        list: (i, additions = '') => `${appRoot}/www/generated/films/list${i}.html${additions}`,
    },

    getRel: path => path.replace(/.+www\/generated\/films\//, ''),
};
