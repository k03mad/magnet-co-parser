import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

(async () => {
    try {
        const [proxy] = await utils.request.proxy();

        const [showsData, filmsData] = await Promise.all([
            showsParse(proxy),
            filmsParse(proxy),
        ]);

        await utils.folder.erase([
            pathsFilms.www.folder,
            pathsFilms.www.pages,
            pathsShows.www.pages,
        ]);

        await Promise.all([
            showsGenerator(showsData),
            filmsGenerator(filmsData),
        ]);
    } catch (err) {
        utils.print.ex(err, {exit: true, full: true});
    }
})();
