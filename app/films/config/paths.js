import appRoot from 'app-root-path';

export default {
    json: {
        folder: `${appRoot}/parsed/`,
        file: `${appRoot}/parsed/films.json`,
    },
    covers: {
        folder: `${appRoot}/www/generated/films/pic/covers`,
    },
    templates: {
        index: `${appRoot}/templates/index.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        index: `${appRoot}/www/generated/films/films.html`,
        pages: `${appRoot}/www/generated/films/pages`,
    },

    getRel: path => path.replace(/^.+www\/generated\/films\//, ''),
};
