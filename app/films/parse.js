import {date, request, tmdb, ua} from '@k03mad/util';
import c from 'chalk';
import cheerio from 'cheerio';
import debug from 'debug';
import countries from 'i18n-iso-countries';
import moment from 'moment';
import ms from 'ms';

import {getExpire} from '../../utils.js';
import rutor from './config/rutor.js';
import service from './config/service.js';

/**
 * @param {string} proxy
 * @returns {Promise<object>}
 */
export default async proxy => {
    const printDebug = debug('magnet:films:parse');

    moment.locale('ru');
    const currentDate = new Date();
    const startTime = date.now();

    const films = {};
    const parsed = [];

    await Promise.all(rutor.search.categories.map(async cat => {
        await Promise.all([...Array.from({length: rutor.search.pages}).keys()].map(async page => {

            const {body} = await request.cache(
                proxy + rutor.search.url(page, cat) + rutor.search.query,
                {
                    timeout: {request: rutor.timeout},
                    headers: {'user-agent': ua.win.chrome},
                },
                getExpire('rutor-search'),
            );

            const $ = cheerio.load(body);

            if ($(rutor.selectors.td).contents().length > 0) {
                $(rutor.selectors.td).each((i, elem) => {
                    if (rutor.search.pages > 1 || i <= rutor.filmsPerCat) {
                        const td = $(elem)
                            .text()
                            .replace(/\s+/g, ' ')
                            .trim();

                        const matched = td.match(rutor.regexp);

                        if (
                            matched
                            && matched.groups.name
                        ) {
                            matched.groups.magnet = decodeURIComponent(
                                $(elem)
                                    .find(rutor.selectors.magnet)
                                    .attr('href')
                                    .replace(/.+magnet/, 'magnet'),
                            );

                            const href = $(elem).find(rutor.selectors.link).attr('href');

                            matched.groups.link = href.includes(rutor.domain)
                                ? decodeURIComponent(href).replace(new RegExp(`.+${rutor.domain}`), rutor.url)
                                : rutor.url + href;

                            const [quality, ...tags] = matched.groups.info.split(rutor.tagSplit);

                            matched.groups.quality = quality
                                .replace(/ от .+/, '')
                                .replace(rutor.comments, '');

                            matched.groups.tags = tags
                                .join(rutor.tagSplit)
                                .replace(rutor.comments, '');

                            if (films[matched.groups.name]) {
                                films[matched.groups.name].rutor.push({...matched.groups});
                            } else {
                                films[matched.groups.name] = {rutor: [{...matched.groups}]};
                            }
                        }
                    }
                });
            }

        }));
    }));

    let counter = 0;
    const filmsArr = Object.entries(films);

    await Promise.all(filmsArr.map(async ([key, value]) => {

        counter++;

        if (counter % 30 === 0 || counter === filmsArr.length) {
            printDebug(`FILM ${counter}/${filmsArr.length}`);
        }

        const [, originalName] = key.split(' / ');
        const title = originalName || key;

        const filmdb = {};

        for (const {link} of value.rutor) {
            const {body} = await request.cache(link, {
                headers: {'user-agent': ua.win.chrome},
            }, getExpire('rutor-page'));

            const kp = body.match(service.kp.re);
            const imdb = body.match(service.imdb.re);

            if (kp && kp.groups && !filmdb.kp) {
                const id = kp.groups.id1 || kp.groups.id2;

                filmdb.kp = {
                    id: Number(id),
                    url: service.kp.film + id,
                    rating: service.kp.rating(id),
                };
            }

            if (imdb && imdb.groups && !filmdb.imdb) {
                const {id} = imdb.groups;

                filmdb.imdb = {
                    id, url: service.imdb.film + id,
                };
            }

            if (kp && imdb) {
                break;
            }
        }

        let data;

        // если есть imdb id — используем ручку матчинга по нему
        if (filmdb.imdb) {
            ({movie_results: [data]} = await tmdb.get({
                path: `find/${filmdb.imdb.id}`,
                params: {external_source: 'imdb_id'},
                cache: true,
                proxy,
                ...getExpire('tmdb-api'),
            }));
            // иначе — по названию
        } else {
            [data] = await tmdb.get({
                path: 'search/movie',
                params: {query: title},
                cache: true,
                proxy,
                ...getExpire('tmdb-api'),
            });
        }

        if (data && data.poster_path) {

            const [movie, {cast, crew}] = await Promise.all([
                tmdb.get({
                    path: `movie/${data.id}`,
                    cache: true,
                    proxy,
                    ...getExpire('tmdb-api'),
                }),
                tmdb.get({
                    path: `movie/${data.id}/credits`,
                    cache: true,
                    proxy,
                    ...getExpire('tmdb-api'),
                }),
            ]);

            await Promise.all(cast.map(async (elem, j) => {
                if (j < service.tmdb.castCount) {
                    const person = await tmdb.get({
                        path: `person/${elem.id}`,
                        cache: true,
                        proxy,
                        ...getExpire('tmdb-api'),
                    });

                    cast[j] = {...person, ...cast[j]};
                }
            }));

            // первая страница, без категории, все слова
            const rutorUrl = rutor.search.url(0, 0, 100) + title;

            const info = {
                title,
                cover: service.tmdb.cover + data.poster_path,
                id: data.id,

                tagline: movie.tagline,
                overview: data.overview,
                genres: movie.genres.map(elem => elem.name),
                companies: movie.production_companies.map(elem => elem.name),
                countries: movie.production_countries.map(elem => countries.getName(elem.iso_3166_1, 'ru')),
                director: crew.filter(elem => elem.job === 'Director').map(elem => elem.name),

                photos: [
                    ...new Set(cast
                        .filter(elem => Boolean(elem.profile_path))
                        .map(elem => ({
                            id: elem.id,
                            link: service.imdb.person + elem.imdb_id,
                            name: elem.name,
                            cover: service.tmdb.cover + elem.profile_path,
                        })),
                    ),
                ],

                rutor: value.rutor,
                urls: {
                    rutor: rutorUrl,
                    rutracker: service.rutracker.url + title,
                    kinopub: service.kinopub.url + title,
                },
                ...filmdb,
            };

            parsed.push(info);

        } else {
            printDebug(c.red('Skipped: %s'), title);
        }
    }));

    const deduped = [];

    // мержим дубликаты
    parsed.forEach(orig => {
        let found;

        for (const element of deduped) {
            if (element.id === orig.id) {
                element.rutor.push(...orig.rutor);
                found = true;
                break;
            }
        }

        if (!found) {
            deduped.push(orig);
        }
    });

    const sorted = deduped
        // сортируем торренты фильма по дате
        .map(elem => {
            elem.rutor = elem.rutor.sort((a, b) => moment(b.date, rutor.dateFormat).valueOf() - moment(a.date, rutor.dateFormat).valueOf());
            return elem;
        })
        // сортируем все фильмы по дате новейшего торрента
        .sort((a, b) => moment(b.rutor[0].date, rutor.dateFormat).valueOf() - moment(a.rutor[0].date, rutor.dateFormat).valueOf())
        // сортируем торренты фильма по сидам
        .map(elem => {
            elem.rutor = elem.rutor.sort((a, b) => Number(b.seed) - Number(a.seed));
            return elem;
        });

    console.log(c.blue(`Фильмов найдено на Rutor: ${sorted.length}`));
    const sliced = sorted.slice(0, rutor.filmsSliceCount);
    console.log(c.blue(`Фильмов оставлено для показа: ${sliced.length}`));

    const diff = date.diff({date: currentDate, period: 'milliseconds'});

    return {
        timestamp: {
            startTime,
            diff: ms(diff),
            diffRaw: diff,
        },
        items: sliced,
    };
};
