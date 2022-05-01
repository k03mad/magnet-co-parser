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

let parsers = [
    {
        type: 'films',
        parser: proxies => filmsParse(proxies),
        generator: (data, proxies) => filmsGenerator(data, proxies),
        paths: pathsFilms,
    },
    {
        type: 'shows',
        parser: proxies => showsParse(proxies),
        generator: (data, proxies) => showsGenerator(data, proxies),
        paths: pathsShows,
    },
];

if (env.parser.type) {
    parsers = parsers.filter(({type}) => type === env.parser.type);
}

(async () => {
    try {
        const httpProxy = await request.proxy({testUrl: 'http://rutor.info', serial: true});

        const proxies = {
            'rutor': httpProxy,
            'tmdb-api': '',
            'tmdb-img': httpProxy,
        };

        const promises = await Promise.allSettled(parsers.map(async elem => {
            const data = await elem.parser(proxies);

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

            await elem.generator(data, proxies);
        }));

        const errors = promises.map(elem => elem.reason).filter(Boolean);

        if (errors.length > 0) {
            throw new Error(errors.join('\n\n'));
        }
    } catch (err) {
        print.ex(err, {time: false, full: true, exit: true});
    }
})();
