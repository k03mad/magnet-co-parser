import appRoot from 'app-root-path';
import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

(async () => {
    try {
        await utils.folder.erase(`${appRoot}/parsed/`);

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
