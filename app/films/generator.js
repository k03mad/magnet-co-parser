import {request} from '@k03mad/util';
import _ from 'lodash';
import moment from 'moment';
import fs from 'node:fs';

import config from '../common/config.js';
import {getCover, getExpire} from '../common/utils.js';
import html from './config/html.js';
import paths from './config/paths.js';
import rutor from './config/rutor.js';

moment.locale('ru');

/**
 * @param {object} data
 * @param {string} proxy
 * @returns {Promise}
 */
export default async (data, proxy) => {
    const [index, page] = await Promise.all([
        fs.promises.readFile(config.templates.list),
        fs.promises.readFile(config.templates.page),
    ]);

    const pasteIndex = [];
    const pages = _.chunk(data.items, rutor.pageCovers);

    for (const filmsArray of pages) {
        const pageIndex = [html.date(`${data.timestamp.startTime} - ${data.timestamp.diff}`)];

        if (pages.length > 1) {
            pageIndex.push(
                html.paginator(
                    pages.length,
                    paths.getRel,
                    paths.www.list,
                ),
            );
        }

        const pageCovers = [];

        await Promise.all(filmsArray.map(async (film, i) => {
            const pageAbsPath = `${paths.www.pages}/${film.id}.html`;
            const pageRelPath = `${paths.getRel(paths.www.pages)}/${film.id}.html`;

            const {body} = await request.cache(getCover(film.cover, proxy), {
                encoding: 'base64',
            }, getExpire('tmdb-img'));

            const coverPath = paths.www.covers(film.id);
            pageCovers[i] = {href: pageRelPath, src: paths.getRel(coverPath)};
            await fs.promises.writeFile(coverPath, body, {encoding: 'base64'});

            const photos = await Promise.all(
                film.photos.map(async elem => {
                    const {body: bodyCover} = await request.cache(getCover(elem.cover, proxy), {
                        encoding: 'base64',
                    }, getExpire('tmdb-img'));

                    const photosPath = paths.www.photos(elem.id);
                    await fs.promises.writeFile(photosPath, bodyCover, {encoding: 'base64'});
                    return {...elem, cover: paths.getRel(photosPath.replace('pages/', ''))};
                }),
            );

            const pasteFilm = [
                html.url(film.urls),
                film.kp?.rating ? html.rating(film.kp.url, film.kp.rating) : '',
                html.photos(photos),
                html.info([
                    film.countries.length > 0 ? film.countries.slice(0, config.service.tmdb.countriesCount).join(' ') : '',
                    film.release ? `Релиз: ${moment(film.release, 'YYYY-MM-DD').format('DD MMMM YYYY')}` : '',
                    film.director.length > 0 ? `Режиссёры: ${film.director.join(', ')}` : '',
                    film.companies.length > 0 ? `Компании: ${film.companies.slice(0, config.service.tmdb.companiesCount).join(', ')}` : '',
                    film.budget ? `Бюджет: $${film.budget.toLocaleString()}` : '',
                    film.revenue ? `Выручка: $${film.revenue.toLocaleString()}` : '',
                    film.tagline,
                    film.overview,
                    film.genres.slice(0, config.service.tmdb.genresCount).join(', '),
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
