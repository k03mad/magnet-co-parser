import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import fs from 'fs';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import rutor from './app/films/config/rutor.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

const VPN_TIMEOUT = 6000;
const VPN_RETRIES = 10;

const parsers = [
    /* eslint-disable jsdoc/require-jsdoc */
    {
        name: 'films',
        parser: () => filmsParse(),
        generator: data => filmsGenerator(data),
        paths: pathsFilms,
    },
    {
        name: 'shows',
        parser: () => showsParse(),
        generator: data => showsGenerator(data),
        paths: pathsShows,
    },
];

(async () => {
    try {

        let available, error;

        for (let i = 0; i < VPN_RETRIES; i++) {
            try {
                await utils.request.got(rutor.url, {timeout: VPN_TIMEOUT});
                available = true;
                break;
            } catch (err) {
                error = err;
                await utils.shell.run('mad-mik-pptp');
            }
        }

        if (!available) {
            throw new Error(`${rutor.url} is not available:\n${error}`);
        }

        const promises = await Promise.allSettled(parsers.map(async elem => {
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
