import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import fs from 'fs';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import rutor from './app/films/config/rutor.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

const parsers = proxy => [
    {
        name: 'films',
        parser: () => filmsParse(proxy),
        generator: data => filmsGenerator(data),
        paths: pathsFilms,
    },
    {
        name: 'shows',
        parser: () => showsParse(proxy),
        generator: data => showsGenerator(data),
        paths: pathsShows,
    },
];

(async () => {
    try {

        const proxy = await utils.request.proxy({testUrl: rutor.url});

        const promises = await Promise.allSettled(parsers(proxy).map(async elem => {
            const data = await elem.parser();

            await utils.folder.erase([
                elem.paths.www.folder,
                elem.paths.www.pages,
                elem.paths.parsed.folder,
            ]);

            await fs.promises.writeFile(
                `${elem.paths.parsed.folder}data.json`,
                JSON.stringify(data, null, 4),
            );

            await elem.generator(data);
        }));

        const errors = promises.map(elem => elem.reason).filter(Boolean);

        if (errors.length > 0) {
            throw new Error(errors.join('\n\n'));
        }

    } catch (err) {
        utils.print.ex(err, {time: false, exit: true});
    }
})();
