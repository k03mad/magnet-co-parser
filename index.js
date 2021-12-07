import utils from '@k03mad/util';
import fs from 'node:fs';

import pathsFilms from './app/films/config/paths.js';
import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import env from './env.js';
import writeHosts from './hosts.js';

const {folder, print} = utils;

let parsers = [
    {
        type: 'films',
        parser: () => filmsParse(),
        generator: data => filmsGenerator(data),
        paths: pathsFilms,
    },
    {
        type: 'shows',
        parser: () => showsParse(),
        generator: data => showsGenerator(data),
        paths: pathsShows,
    },
];

if (env.parser.type) {
    parsers = parsers.filter(({type}) => type === env.parser.type);
}

(async () => {
    try {
        env.isCloud && await writeHosts();

        const promises = await Promise.allSettled(parsers.map(async elem => {
            const data = await elem.parser();

            await folder.erase([
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
        print.ex(err, {time: false, full: true, exit: true});
    }
})();
