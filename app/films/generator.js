import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';
import pretty from 'pretty';
import utils from 'utils-mad';

/**
 * @param {object} data
 * @returns {Function}
 */
export default async data => {
    const [index, page] = await Promise.all([
        fs.promises.readFile(paths.templates.list),
        fs.promises.readFile(paths.templates.page),
    ]);

    const pasteIndex = [];
    const pages = utils.array.chunk(data.items, paths.www.pageCovers);

    for (const filmsArray of pages) {
        const pageIndex = [
            html.date(`${data.timestamp.startTime} - ${data.timestamp.diff}`),
            html.paginator(
                pages.length,
                paths.getRel,
                paths.www.list,
            ),
        ];

        const pageCovers = [];

        await Promise.all(filmsArray.map((film, i) => {
            const id = `${film.id}-${String(i + 1).padStart(String(filmsArray.length).length, 0)}`;
            const pageAbsPath = `${paths.www.pages}/${id}.html`;
            const pageRelPath = `${paths.getRel(paths.www.pages)}/${id}.html`;

            pageCovers.push({href: pageRelPath, src: film.cover});

            const pasteFilm = [html.url(film.urls)];

            if (film.kp.rating) {
                pasteFilm.push(html.rating(film.kp.url, film.kp.rating));
            }

            pasteFilm.push(
                html.photos(film.photos.map(elem => elem.url)),
                html.info([film.tagline, film.overview, film.genres.join(', ')]),
                ...film.rutor.map(elem => html.td(elem)),
            );

            const generatedPage = page.toString().replace(html.placeholder, pasteFilm.join('\n'));
            return fs.promises.writeFile(pageAbsPath, pretty(generatedPage.replace(/\s{2,}/g, '\n')));
        }));

        pageIndex.push(html.cover(pageCovers));
        pasteIndex.push(pageIndex);
    }

    await Promise.all(pasteIndex.map((pageIndex, i) => {
        const generatedIndex = index.toString().replace(html.placeholder, pageIndex.join('\n'));
        return fs.promises.writeFile(paths.www.list(i + 1), pretty(generatedIndex.replace(/\s{2,}/g, '\n')));
    }));
};
