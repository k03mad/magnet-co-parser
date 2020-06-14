import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import fs from 'fs';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

const parsers = [
    {
        name: 'films',
        folder: pathsFilms.parsed.folder,
        parser: () => filmsParse(),
        generator: data => filmsGenerator(data),
    },
    {
        name: 'shows',
        folder: pathsShows.parsed.folder,
        parser: () => showsParse(),
        generator: data => showsGenerator(data),
    },
];

(async () => {
    try {
        await utils.folder.erase([
            pathsFilms.parsed.folder,
            pathsShows.parsed.folder,

            pathsFilms.www.folder,
            pathsShows.www.folder,

            pathsFilms.www.pages,
            pathsShows.www.pages,
        ]);

        await Promise.all(parsers.map(async elem => {

            const data = await elem.parser();

            await fs.promises.writeFile(
                `${elem.folder + elem.name}.json`,
                JSON.stringify(data, null, 4),
            );

            await elem.generator(data);

        }));
    } catch (err) {
        utils.print.ex(err, {full: true, exit: true});
    }
})();
