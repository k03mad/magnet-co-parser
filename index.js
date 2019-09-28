import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

(async () => {
    try {
        await utils.folder.erase([
            pathsFilms.json.folder,
            pathsFilms.www.folder,

            pathsFilms.www.pages,
            pathsShows.www.pages,
        ]);

        const [proxy] = await utils.request.proxy();

        await Promise.all([
            filmsParse(proxy),
            showsParse(proxy),
        ]);

        await Promise.all([
            filmsGenerator(),
            showsGenerator(),
        ]);
    } catch (err) {
        utils.print.ex(err, {exit: true, full: true});
    }
})();
