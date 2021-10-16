import c from 'chalk';
import cheerio from 'cheerio';
import countries from 'i18n-iso-countries';
import debug from 'debug';
import moment from 'moment';
import ms from 'ms';
import rutor from './config/rutor.js';
import service from './config/service.js';
import utils from '@k03mad/utils';

/** @returns {Function} */
export default async () => {
    /* eslint-disable unicorn/no-new-array */

    const printDebug = debug('magnet:films:parse');

    moment.locale('ru');
    const date = new Date();
    const startTime = utils.date.now();

    const films = {};
    const parsed = [];

    await Promise.all(rutor.search.categories.map(async cat => {
        await Promise.all([...new Array(rutor.search.pages).keys()].map(async page => {

            const rutorUrl = cat === 5
                ? rutor.search.url(page, cat) + rutor.search.queries.rus + rutor.search.quality
                : rutor.search.url(page, cat) + rutor.search.queries.default + rutor.search.quality;

            const {body} = await utils.request.cache(rutorUrl, {
                timeout: rutor.timeout,
                headers: {'user-agent': utils.ua.win.chrome},
            }, {expire: '30m'});

            const $ = cheerio.load(body);

            if ($(rutor.selectors.td).contents().length > 0) {
                $(rutor.selectors.td).each((_, elem) => {
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

        if (parsed.length !== rutor.filmsCount) {

            const [, originalName] = key.split(' / ');
            const title = originalName || key;

            const filmdb = {};

            for (const {link} of value.rutor) {
                const {body} = await utils.request.cache(link, {
                    headers: {'user-agent': utils.ua.win.chrome},
                });

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
                ({movie_results: [data]} = await utils.tmdb.get({path: `find/${filmdb.imdb.id}`, params: {external_source: 'imdb_id'}, cache: true}));
            // иначе — по названию
            } else {
                [data] = await utils.tmdb.get({path: 'search/movie', params: {query: title}, cache: true});
            }

            if (data && data.poster_path) {

                const [movie, {cast, crew}] = await Promise.all([
                    utils.tmdb.get({path: `movie/${data.id}`, cache: true}),
                    utils.tmdb.get({path: `movie/${data.id}/credits`, cache: true}),
                ]);

                // первая страница, без категории, все слова
                const rutorUrl = rutor.search.url(0, 0, 100) + title + rutor.search.quality;

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
                                link: service.tmdb.person + elem.id,
                                name: elem.name,
                                cover: service.tmdb.cover + elem.profile_path,
                            })),
                        ),
                    ],

                    rutor: value.rutor,
                    urls: {
                        rutor: rutorUrl,
                        rutracker: service.rutracker.url + title + rutor.search.quality,
                        kinopub: service.kinopub.url + title,
                    },
                    ...filmdb,
                };

                parsed.push(info);

            } else {
                printDebug(c.red('Skipped: %s'), title);
            }
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
    const diff = utils.date.diff({date, period: 'milliseconds'});

    return {
        timestamp: {
            startTime,
            diff: ms(diff),
            diffRaw: diff,
        },
        items: sorted,
    };
};
