import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import fs from 'fs';
import pathsFilms from './app/films/config/paths.js';
import pathsShows from './app/shows/config/paths.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

(async () => {
    try {
        let filmsData, showsData;

        // только генерим страницы из json-файлов для отладки
        if (process.env.npm_config_fromjson) {

            [filmsData, showsData] = await Promise.all([
                fs.promises.readFile(`${pathsShows.templates.folder}films.json`, 'utf8'),
                fs.promises.readFile(`${pathsShows.templates.folder}shows.json`, 'utf8'),
                [''],
            ]);

            filmsData = JSON.parse(filmsData.replace(/\n| {2,}/g, ''));
            showsData = JSON.parse(showsData.replace(/\n| {2,}/g, ''));

        // иначе парсим
        } else {

            const [proxy] = await utils.request.proxy();

            [showsData, filmsData] = await Promise.all([
                showsParse(proxy),
                filmsParse(proxy),
            ]);

            // сохраняем json-файлы для отладки
            if (process.env.npm_config_savejson) {

                await Promise.all([
                    fs.promises.writeFile(`${pathsShows.templates.folder}shows.json`, JSON.stringify(showsData, null, 4)),
                    fs.promises.writeFile(`${pathsShows.templates.folder}films.json`, JSON.stringify(filmsData, null, 4)),
                ]);

            }
        }

        await utils.folder.erase([
            pathsFilms.www.folder,
            pathsFilms.www.pages,
            pathsShows.www.pages,
        ]);

        await Promise.all([
            filmsGenerator(filmsData),
            showsGenerator(showsData),
        ]);

    } catch (err) {
        utils.print.ex(err, {exit: true, full: true});
    }
})();
