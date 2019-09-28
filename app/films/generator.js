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

    const pasteIndex = [];
    const pages = utils.array.chunk(JSON.parse(data), paths.www.pageCovers);

    for (const filmsArray of pages) {
        const pageIndex = [
            html.date(date),
            html.paginator(
                pages.length,
                paths.getRel,
                paths.www.index,
                `?rnd=${Math.random()}`,
            ),
        ];

        await Promise.all(filmsArray.map(film => {
            const pageAbsPath = `${paths.www.pages}/${film.id}.html`;
            const pageRelPath = `${paths.getRel(paths.www.pages)}/${film.id}.html?rnd=${Math.random()}`;

            pageIndex.push(html.cover(pageRelPath, film.cover));

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
            return fs.promises.writeFile(pageAbsPath, pretty(generatedPage.replace(/\s{2,}/g, '\n')));
        }));

        pasteIndex.push(pageIndex);
    }

    await Promise.all(pasteIndex.map((pageIndex, i) => {
        const generatedIndex = index.toString().replace(html.placeholder, pageIndex.join('\n'));
        return fs.promises.writeFile(paths.www.index(i + 1), pretty(generatedIndex.replace(/\s{2,}/g, '\n')));
    }));
};
