import appRoot from 'app-root-path';

export default {
    templates: {
        list: `${appRoot}/templates/list.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        folder: `${appRoot}/www/generated/`,
        pages: `${appRoot}/www/generated/films/pages`,
        pageCovers: 30,
        list: (i, additions = '') => `${appRoot}/www/generated/films/list${i}.html${additions}`,
    },

    getRel: path => path.replace(/.+www\/generated\/films\//, ''),
};
