import {date, request, tmdb, ua} from '@k03mad/util';
import c from 'chalk';
import cheerio from 'cheerio';
import emoji from 'country-code-emoji';
import countries from 'i18n-iso-countries';
import moment from 'moment';
import ms from 'ms';

import config from '../common/config.js';
import {getExpire, log} from '../common/utils.js';
import rutor from './config/rutor.js';

moment.locale('ru');

/**
 * @param {object} proxies
 * @returns {Promise<object>}
 */
export default async proxies => {
    const currentDate = new Date();
    const startTime = date.now();

    const films = {};
    const parsed = [];

    await Promise.all(rutor.search.categories.map(async cat => {
        await Promise.all([...Array.from({length: rutor.search.pages}).keys()].map(async page => {

            const {body} = await request.cache(
                proxies.rutor + rutor.search.url(page, cat) + rutor.search.query,
                {
                    timeout: {request: config.rutor.timeout},
                    headers: {'user-agent': ua.win.chrome},
                },
                getExpire('rutor-search'),
            );

            const $ = cheerio.load(body);

            if ($(config.rutor.selectors.td).contents().length > 0) {
                $(config.rutor.selectors.td).each((_, elem) => {
                    if (rutor.search.pages > 1) {
                        const td = $(elem)
                            .text()
                            .replace(/\s+/g, ' ')
                            .trim();

                        const matched = td.match(config.rutor.regexp);

                        if (
                            matched
                            && matched.groups.name
                        ) {
                            matched.groups.magnet = decodeURIComponent(
                                $(elem)
                                    .find(config.rutor.selectors.magnet)
                                    .attr('href')
                                    .replace(/.+magnet/, 'magnet'),
                            );

                            const href = $(elem).find(config.rutor.selectors.link).attr('href');

                            matched.groups.link = href.includes(config.rutor.domain)
                                ? decodeURIComponent(href).replace(new RegExp(`.+${config.rutor.domain}`), config.rutor.url)
                                : config.rutor.url + href;

                            const [quality, ...tags] = matched.groups.info.split(config.rutor.tagSplit);

                            matched.groups.quality = quality
                                .replace(/ от .+/, '')
                                .replace(config.rutor.comments, '');

                            matched.groups.tags = tags
                                .join(config.rutor.tagSplit)
                                .replace(config.rutor.comments, '');

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

    const filmsArr = Object.entries(films);

    await Promise.all(filmsArr.map(async ([key, value]) => {

        const [, originalName] = key.split(' / ');
        const title = originalName || key;

        const filmdb = {};

        for (const {link} of value.rutor) {
            const {body} = await request.cache(proxies.rutor + link, {
                headers: {'user-agent': ua.win.chrome},
            }, getExpire('rutor-page'));

            const kp = body.match(config.service.kp.re);
            const imdb = body.match(config.service.imdb.re);

            if (kp && kp.groups && !filmdb.kp) {
                const id = kp.groups.id1 || kp.groups.id2;

                filmdb.kp = {
                    id: Number(id),
                    url: config.service.kp.film + id,
                    rating: config.service.kp.rating(id),
                };
            }

            if (imdb && imdb.groups && !filmdb.imdb) {
                const {id} = imdb.groups;

                filmdb.imdb = {
                    id, url: config.service.imdb.film + id,
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
                proxy: proxies.tmdb,
                ...getExpire('tmdb-api'),
            }));
            // иначе — по названию
        } else {
            [data] = await tmdb.get({
                path: 'search/movie',
                params: {query: title},
                cache: true,
                proxy: proxies.tmdb,
                ...getExpire('tmdb-api'),
            });
        }

        if (data && data.poster_path) {
            const [movie, {cast, crew}] = await Promise.all([
                tmdb.get({
                    path: `movie/${data.id}`,
                    cache: true,
                    proxy: proxies.tmdb,
                    ...getExpire('tmdb-api'),
                }),
                tmdb.get({
                    path: `movie/${data.id}/credits`,
                    cache: true,
                    proxy: proxies.tmdb,
                    ...getExpire('tmdb-api'),
                }),
            ]);

            await Promise.all(cast.map(async (elem, j) => {
                if (j < config.service.tmdb.castCount) {
                    const person = await tmdb.get({
                        path: `person/${elem.id}`,
                        cache: true,
                        proxy: proxies.tmdb,
                        ...getExpire('tmdb-api'),
                    });

                    cast[j] = {...person, ...cast[j]};
                }
            }));

            // первая страница, без категории, все слова
            const rutorUrl = rutor.search.url(0, 0, 100) + title;

            const info = {
                title,
                cover: config.service.tmdb.cover + data.poster_path,
                id: data.id,

                tagline: movie.tagline,
                overview: data.overview,
                release: movie.release_date,
                genres: movie.genres.map(elem => elem.name),
                companies: movie.production_companies.map(elem => elem.name),
                countries: movie.production_countries.map(
                    elem => `${emoji(elem.iso_3166_1)} ${countries.getName(elem.iso_3166_1, 'ru')}`,
                ),
                director: crew.filter(elem => elem.job === 'Director').map(elem => elem.name),
                budget: movie.budget,
                revenue: movie.revenue,
                photos: [
                    ...new Set(cast
                        .filter(elem => Boolean(elem.profile_path))
                        .map(elem => ({
                            id: elem.id,
                            link:
                                // elem.imdb_id
                                // ? config.service.imdb.person + elem.imdb_id
                                config.service.tmdb.person + elem.id,
                            name: elem.name,
                            cover: config.service.tmdb.cover + elem.profile_path,
                        })),
                    ),
                ].slice(0, config.service.tmdb.castCount),

                rutor: value.rutor,
                urls: {
                    rutor: rutorUrl,
                    rutracker: config.service.rutracker.url + title,
                    kinopub: config.service.kinopub.url + title,
                },
                ...filmdb,
            };

            parsed.push(info);
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

    log(c.blue(`Фильмов найдено на Rutor: ${sorted.length}`));

    const diff = date.diff({date: currentDate, period: 'milliseconds'});

    return {
        timestamp: {
            startTime,
            diff: ms(diff),
            diffRaw: diff,
        },
        items: sorted,
    };
};
