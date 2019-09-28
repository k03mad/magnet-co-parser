import filmsGenerator from './app/films/generator.js';
import filmsParse from './app/films/parse.js';
import showsGenerator from './app/shows/generator.js';
import showsParse from './app/shows/parse.js';
import utils from 'utils-mad';

(async () => {
    try {
        const [proxy] = await utils.request.proxy();

        await filmsParse(proxy);
        await showsParse(proxy);

        await filmsGenerator();
        await showsGenerator();
    } catch (err) {
        utils.print.ex(err, {exit: true, full: true});
    }
})();
