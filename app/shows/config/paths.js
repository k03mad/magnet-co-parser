import appRoot from 'app-root-path';

export default {
    /* eslint-disable jsdoc/require-jsdoc */
    parsed: {
        folder: `${appRoot}/parsed/shows/`,
    },
    templates: {
        font: `${appRoot}/templates/font.fnt`,
        noposter: `${appRoot}/templates/no-poster.png`,
        folder: `${appRoot}/templates/`,
        list: `${appRoot}/templates/list.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        noposter: id => `${appRoot}/www/generated/shows/noposter/${id}.png`,
        folder: `${appRoot}/www/generated/shows`,
        list: `${appRoot}/www/generated/shows/list.html`,
        pages: `${appRoot}/www/generated/shows/pages`,
    },

    getRel: path => path.replace(/.+www\/generated\/shows\//, ''),
};
