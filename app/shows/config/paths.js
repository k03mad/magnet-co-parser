import appRoot from 'app-root-path';

export default {
    templates: {
        folder: `${appRoot}/templates/`,
        list: `${appRoot}/templates/list.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        folder: `${appRoot}/www/generated/`,
        list: `${appRoot}/www/generated/shows/list.html`,
        pages: `${appRoot}/www/generated/shows/pages`,
    },

    getRel: path => path.replace(/.+www\/generated\/shows\//, ''),
};
