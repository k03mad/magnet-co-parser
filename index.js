import {folder, print, request} from '@k03mad/util';
import fs from 'node:fs';
import path from 'node:path';

import pathsFilms from './app/films/config/paths.js';
import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import env from './env.js';
import {writeHosts} from './utils.js';

let parsers = [
    {
        type: 'films',
        parser: proxy => filmsParse(proxy),
        generator: (data, proxy) => filmsGenerator(data, proxy),
        paths: pathsFilms,
    },
    {
        type: 'shows',
        parser: proxy => showsParse(proxy),
        generator: (data, proxy) => showsGenerator(data, proxy),
        paths: pathsShows,
    },
];

if (env.parser.type) {
    parsers = parsers.filter(({type}) => type === env.parser.type);
}

(async () => {
    try {
        env.isCloud && await writeHosts();

        const proxy = await request.proxy({
            testUrl: 'https://api.themoviedb.org/',
            serial: true,
        });

        const promises = await Promise.allSettled(parsers.map(async elem => {
            const data = await elem.parser(proxy);

            await folder.erase([
                elem.paths.www.folder,
                elem.paths.www.pages,
                elem.paths.parsed.folder,
                path.dirname(elem.paths.www.covers()),
                path.dirname(elem.paths.www.photos()),
            ]);

            await fs.promises.writeFile(
                `${elem.paths.parsed.folder}data.json`,
                JSON.stringify(data, null, 4),
            );

            await elem.generator(data, proxy);
        }));

        const errors = promises.map(elem => elem.reason).filter(Boolean);

        if (errors.length > 0) {
            throw new Error(errors.join('\n\n'));
        }
    } catch (err) {
        print.ex(err, {time: false, full: true, exit: true});
    }
})();
