import appRoot from 'app-root-path';

export default {
    json: {
        folder: `${appRoot}/parsed/`,
        file: `${appRoot}/parsed/shows.json`,
    },
    covers: {
        folder: `${appRoot}/www/generated/shows/pic/covers`,
    },
    templates: {
        index: `${appRoot}/templates/index.html`,
        page: `${appRoot}/templates/page.html`,
    },
    www: {
        index: `${appRoot}/www/generated/shows/shows.html`,
        pages: `${appRoot}/www/generated/shows/pages`,
    },

    getRel: path => path.replace(/^.+www\/generated\/shows\//, ''),
};
