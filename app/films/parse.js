import c from 'colorette';
import cheerio from 'cheerio';
import fs from 'fs';
import moment from 'moment';
import paths from './config/paths.js';
import rutor from './config/rutor.js';
import service from './config/service.js';
import utils from 'utils-mad';

/**
 * Парсинг трекера
 * @param {string} proxy
 * @returns {Function}
 */
export default async proxy => {
    moment.locale('ru');

    const films = {};
    const parsed = [];

    await Promise.all(rutor.search.categories.map(async cat => {
        for (let page = 0; page < rutor.search.pages; page++) {

            const rutorUrl = rutor.search.url(page, cat) + rutor.search.query + rutor.search.quality;
            const rutorProxyUrl = proxy + encodeURIComponent(rutorUrl);

            const {body} = await utils.request.got(rutorProxyUrl, {timeout: rutor.timeout});

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
                            .replace(/^.+magnet/, 'magnet')
                            .trim(),
                    );

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

    for (const [key, value] of Object.entries(films)) {
        const [, originalName] = key.split(' / ');
        const title = originalName || key;

        const [data] = await utils.tmdb.get({
            path: 'search/movie',
            params: {query: title},
            gotOpts: {timeout: service.tmdb.timeout},
            cacheExpireDays: service.tmdb.cacheDays.api,
            force: true,
        });

        if (data && data.poster_path) {
            const movie = await utils.tmdb.get({
                path: `movie/${data.id}`,
                gotOpts: {timeout: service.tmdb.timeout},
                cacheExpireDays: service.tmdb.cacheDays.api,
                force: true,
            });

            const {cast} = await utils.tmdb.get({
                path: `movie/${data.id}/credits`,
                gotOpts: {timeout: service.tmdb.timeout},
                cacheExpireDays: service.tmdb.cacheDays.api,
                force: true,
            });

            // первая страница, без категории, все слова
            const rutorUrl = rutor.search.url(0, 0, 100) + title + rutor.search.quality;

            parsed.push({
                title,
                cover: service.tmdb.cover + data.poster_path,
                id: data.id,

                rating: data.vote_average,
                tagline: movie.tagline,
                overview: data.overview,
                genres: movie.genres.map(elem => elem.name).slice(0, 3),

                photos: [
                    ...new Set(cast
                        .slice(0, 3)
                        .filter(elem => Boolean(elem.profile_path))
                        .map(elem => ({
                            id: elem.id,
                            name: elem.name,
                            url: service.tmdb.cover + elem.profile_path,
                        })),
                    ),
                ],

                rutor: value.rutor,
                urls: {
                    rutor: rutorUrl,
                    proxy: proxy + encodeURIComponent(rutorUrl),
                    tmdb: service.tmdb.url + data.id,
                    imdb: service.imdb.url + movie.imdb_id,
                    rutracker: service.rutracker.url + title + rutor.search.quality,
                },
            });
        }
    }

    console.log(c.blue(`Найдено на Rutor: ${parsed.length}`));

    const sorted = parsed.sort((a, b) => {
        const FORMAT = 'DD MMM YY';
        const date = {
            a: moment(a.rutor[0].date, FORMAT).valueOf(),
            b: moment(b.rutor[0].date, FORMAT).valueOf(),
        };
        return date.b - date.a;
    });

    sorted.forEach((elem, i) => {
        const bySeed = elem.rutor.sort((a, b) => Number(b.seed) - Number(a.seed));
        sorted[i].rutor = bySeed;
    });

    await fs.promises.writeFile(paths.json.file, JSON.stringify(sorted));
};
