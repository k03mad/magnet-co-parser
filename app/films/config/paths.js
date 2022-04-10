import appRoot from 'app-root-path';

export default {
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
        covers: id => `${appRoot}/www/generated/films/covers/${id}.jpg`,
        photos: id => `${appRoot}/www/generated/films/pages/photos/${id}.jpg`,
    },

    getRel: path => path.replace(/.+www\/generated\/films\//, ''),
};
