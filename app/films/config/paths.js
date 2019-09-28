import appRoot from 'app-root-path';

export default {
    json: {
        folder: `${appRoot}/parsed/`,
        file: `${appRoot}/parsed/films.json`,
    },
    templates: {
        index: `${appRoot}/templates/index.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        folder: `${appRoot}/www/generated/`,
        pages: `${appRoot}/www/generated/films/pages`,
        pageCovers: 30,
        index: (i, additions = '') => `${appRoot}/www/generated/films/page${i}.html${additions}`,
    },

    getRel: path => path.replace(/.+www\/generated\/films\//, ''),
};
