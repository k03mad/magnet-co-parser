import appRoot from 'app-root-path';

export default {
    templates: {
        index: `${appRoot}/templates/index.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        folder: `${appRoot}/www/generated/`,
        index: `${appRoot}/www/generated/shows/page.html`,
        pages: `${appRoot}/www/generated/shows/pages`,
    },

    getRel: path => path.replace(/.+www\/generated\/shows\//, ''),
};
