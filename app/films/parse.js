import c from 'colorette';
import cheerio from 'cheerio';
import moment from 'moment';
import ms from 'ms';
import rutor from './config/rutor.js';
import service from './config/service.js';
import utils from 'utils-mad';

/**
 * @param {string} proxy
 * @returns {Function}
 */
export default async proxy => {
    moment.locale('ru');
    const date = new Date();
    const startTime = utils.date.now();

    const films = {};
    const parsed = [];

    await Promise.all(rutor.search.categories.map(async cat => {
        for (let page = 0; page < rutor.search.pages; page++) {

            const rutorUrl = rutor.search.url(page, cat) + rutor.search.query + rutor.search.quality;
            const rutorProxyUrl = proxy + encodeURIComponent(rutorUrl);

            const {body} = await utils.request.got(rutorProxyUrl, {timeout: rutor.timeout, headers: {
                'user-agent': utils.ua.win.chrome,
            }});

            const $ = cheerio.load(body);

            if ($(rutor.selectors.td).contents().length === 0) {
                break;
            }

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
                        : rutor.domain + href;

                    const [quality, ...tags] = matched.groups.info.split(rutor.tagSplit);
                    matched.groups.quality = quality.replace(/ от .+/, '');
                    matched.groups.tags = tags.join(rutor.tagSplit).replace(rutor.comments, '');

                    if (films[matched.groups.name]) {
                        films[matched.groups.name].rutor.push({...matched.groups});
                    } else {
                        films[matched.groups.name] = {rutor: [{...matched.groups}]};
                    }
                }

            });

        }
    }));

    const sorted = Object.entries(films).sort((a, b) => {
        const FORMAT = 'DD MMM YY';
        const sortings = {
            a: moment(a[1].rutor[0].date, FORMAT).valueOf(),
            b: moment(b[1].rutor[0].date, FORMAT).valueOf(),
        };
        return sortings.b - sortings.a;
    });

    for (const [key, value] of sorted) {
        if (parsed.length === rutor.filmsCount) {
            break;
        }

        const [, originalName] = key.split(' / ');
        const title = originalName || key;

        const filmdb = {};

        for (const {link} of value.rutor) {
            const {body} = await utils.request.cache(proxy + encodeURIComponent(link), {headers: {
                'user-agent': utils.ua.win.chrome,
            }});

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
                    id, url: service.imdb.film + imdb.groups.id,
                };
            }

            if (kp && imdb) {
                break;
            }
        }

        let data;

        // если есть imdb id — используем ручку матчинга по нему
        if (filmdb.imdb) {
            ({movie_results: [data]} = await utils.tmdb.get({path: `find/${filmdb.imdb.id}`, params: {external_source: 'imdb_id'}, caching: true}));
        // иначе — по названию
        } else {
            [data] = await utils.tmdb.get({path: 'search/movie', params: {query: title}, caching: true});
        }

        if (data && data.poster_path) {

            let double = false;

            parsed.forEach((elem, i) => {
                if (elem.id === data.id) {
                    parsed[i].rutor.push(...value.rutor);
                    double = true;
                }
            });

            if (!double) {

                const movie = await utils.tmdb.get({path: `movie/${data.id}`, caching: true});
                const {cast} = await utils.tmdb.get({path: `movie/${data.id}/credits`, caching: true});

                // первая страница, без категории, все слова
                const rutorUrl = rutor.search.url(0, 0, 100) + title + rutor.search.quality;

                const info = {
                    title,
                    cover: service.tmdb.cover + data.poster_path,
                    id: data.id,

                    tagline: movie.tagline,
                    overview: data.overview,
                    genres: movie.genres.map(elem => elem.name).slice(0, service.tmdb.genresCount),

                    photos: [
                        ...new Set(cast
                            .slice(0, service.tmdb.castCount)
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
                        proxy: proxy + encodeURIComponent(rutorUrl),
                        rutracker: service.rutracker.url + title + rutor.search.quality,
                    },
                    ...filmdb,
                };

                parsed.push(info);

            }
        }
    }

    console.log(c.blue(`Фильмов найдено на Rutor: ${parsed.length}`));

    parsed.forEach((elem, i) => {
        const bySeed = elem.rutor.sort((a, b) => Number(b.seed) - Number(a.seed));
        sorted[i].rutor = bySeed;
    });

    const diff = utils.date.diff({date, period: 'milliseconds'});

    return {
        timestamp: {
            startTime,
            diff: ms(diff),
            diffRaw: diff,
        },
        items: parsed,
    };
};