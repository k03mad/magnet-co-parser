import appRoot from 'app-root-path';

export default {
    parsed: {
        folder: `${appRoot}/parsed/shows/`,
    },
    www: {
        noposter: id => `${appRoot}/www/generated/shows/noposter/${id}.png`,
        folder: `${appRoot}/www/generated/shows`,
        list: `${appRoot}/www/generated/shows/list.html`,
        pages: `${appRoot}/www/generated/shows/pages`,
        covers: id => `${appRoot}/www/generated/shows/covers/${id}.jpg`,
        photos: id => `${appRoot}/www/generated/shows/pages/photos/${id}.jpg`,
    },

    getRel: path => path.replace(/.+www\/generated\/shows\//, ''),
};
