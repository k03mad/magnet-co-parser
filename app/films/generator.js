import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';
import pretty from 'pretty';
import service from './config/service.js';
import utils from 'utils-mad';

/**
 * Генерация HTML
 * @returns {Function}
 */
export default async () => {
    const date = utils.date.now();

    const [index, page, data] = await Promise.all([
        fs.promises.readFile(paths.templates.index),
        fs.promises.readFile(paths.templates.page),
        fs.promises.readFile(paths.json.file),
    ]);

    await utils.folder.erase(paths.www.pages);

    const pasteIndex = [html.date(date)];

    for (const film of JSON.parse(data)) {
        const {baseSafe, nameSafe} = await utils.request.download({
            url: film.cover,
            folder: paths.covers.folder,
            name: `${film.title}-${film.id}`,
            ext: 'jpg',
            replace: false,
            eraseFolderDays: service.tmdb.cacheDays.cover,
        });

        const coverRelPath = `${paths.getRel(paths.covers.folder)}/${baseSafe}`;
        const pageAbsPath = `${paths.www.pages}/${nameSafe}.html`;
        const pageRelPath = `${paths.getRel(paths.www.pages)}/${nameSafe}.html?rnd=${Math.random()}`;

        pasteIndex.push(html.cover(pageRelPath, coverRelPath));

        const [mainVote] = String(film.rating).split('.').map(Number);
        const rating = `${film.rating} ${
            service.tmdb.stars.fill.repeat(mainVote)
            + service.tmdb.stars.empty.repeat(10 - mainVote)
        }`;

        const pasteFilm = [
            html.date(date),
            html.url(film.urls),
            html.head(rating, film.photos.map(elem => elem.url)),
            html.info([film.tagline, film.overview, film.genres.join(', ')]),
            ...film.rutor.map(elem => html.td(elem)),
        ];

        const generatedPage = page.toString().replace(html.placeholder, pasteFilm.join('\n'));
        await fs.promises.writeFile(pageAbsPath, pretty(generatedPage.replace(/\s{2,}/g, '\n')));
    }

    const generatedIndex = index.toString().replace(html.placeholder, pasteIndex.join('\n'));
    await fs.promises.writeFile(paths.www.index, pretty(generatedIndex.replace(/\s{2,}/g, '\n')));
};
