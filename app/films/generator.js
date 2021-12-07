import _ from 'lodash';
import fs from 'node:fs';

import html from './config/html.js';
import paths from './config/paths.js';
import rutor from './config/rutor.js';
import service from './config/service.js';

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
    const pages = _.chunk(data.items, rutor.pageCovers);
    console.log('—————————— \n pages', pages);

    for (const filmsArray of pages) {
        const pageIndex = [html.date(`${data.timestamp.startTime} - ${data.timestamp.diff}`)];

        if (pages.length > 1) {
            html.paginator(
                pages.length,
                paths.getRel,
                paths.www.list,
            );
        }

        const pageCovers = [];

        await Promise.all(filmsArray.map((film, i) => {
            const id = `${film.id}-${String(i + 1).padStart(String(filmsArray.length).length, 0)}`;
            const pageAbsPath = `${paths.www.pages}/${id}.html`;
            const pageRelPath = `${paths.getRel(paths.www.pages)}/${id}.html`;

            pageCovers.push({href: pageRelPath, src: film.cover});

            const pasteFilm = [
                html.url(film.urls),
                film.kp && film.kp.rating ? html.rating(film.kp.url, film.kp.rating) : '',
                html.photos(film.photos.slice(0, service.tmdb.castCount)),
                html.info([
                    film.countries.length > 0 ? `Страны: ${film.countries.slice(0, service.tmdb.countriesCount).join(', ')}` : '',
                    film.director.length > 0 ? `Режиссёры: ${film.director.join(', ')}` : '',
                    film.companies.length > 0 ? `Компании: ${film.companies.slice(0, service.tmdb.companiesCount).join(', ')}` : '',
                    film.tagline,
                    film.overview,
                    film.genres.slice(0, service.tmdb.genresCount).join(', '),
                ].filter(Boolean)),
                html.table(film.rutor),
            ];

            const generatedPage = page.toString().replace(html.placeholder, pasteFilm.join(''));
            return fs.promises.writeFile(pageAbsPath, generatedPage);
        }));

        pageIndex.push(html.cover(pageCovers));
        pasteIndex.push(pageIndex);
    }

    await Promise.all(pasteIndex.map((pageIndex, i) => {
        const generatedIndex = index.toString().replace(html.placeholder, pageIndex.join(''));
        return fs.promises.writeFile(paths.www.list(i + 1), generatedIndex);
    }));
};
