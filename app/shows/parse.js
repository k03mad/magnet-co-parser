import {date, myshows, request, tmdb, ua} from '@k03mad/util';
import c from 'chalk';
import cheerio from 'cheerio';
import emoji from 'country-code-emoji';
import countries from 'i18n-iso-countries';
import _ from 'lodash';
import ms from 'ms';

import config from '../common/config.js';
import {getExpire, log} from '../common/utils.js';
import rutor from './config/rutor.js';

/**
 * @param {string} proxy
 * @returns {Promise<object>}
 */
export default async proxy => {

    const currentDate = new Date();
    const startTime = date.now();

    const parsed = [];
    const seriesList = [];

    const getRutorElems = async (quality, titleOriginal) => {
        const rutorUrl = rutor.search.url + titleOriginal.replaceAll("'", '') + quality;

        const {body} = await request.cache(proxy + rutorUrl, {
            timeout: {request: config.rutor.timeout},
            headers: {'user-agent': ua.win.chrome},
        }, {expire: '30m'});

        return {$: cheerio.load(body), rutorUrl};
    };

    const watching = await myshows.watch({onlyAired: true, gotOpts: {timeout: {request: 30_000}}});

    await Promise.all([...watching.entries()].map(async ([i, element]) => {
        const {episodesToWatch, id, imdbId, kinopoiskId, title, titleOriginal} = element.show;
        const {seasonNumber} = episodesToWatch.at(-1);

        const titleOriginalEscaped = titleOriginal
            // The End Of The F***ing World => The End Of The F World
            .replace(/(?=.+)(\*.+) /, ' ')
            // Project "А" => Project A
            .replace(/["«»]/g, '');

        const titleGenerated = title === titleOriginal ? title : `${title} / ${titleOriginal}`;

        seriesList.push(titleGenerated);
        parsed[i] = {title, titleOriginal, titleGenerated, rutor: []};

        /**
         * Парсим поиск по названию сериала
         * @param {object} $
         * @param {object} opts
         */
        const parseGroups = ($, opts = {}) => {
            $(config.rutor.selectors.td).each((x, elem) => {

                const td = $(elem)
                    .text()
                    .replace(/\s+/g, ' ')
                    .trim();

                const matched = td.match(config.rutor.regexp);

                if (matched?.groups?.name.match(rutor.episodes)) {
                    matched.groups.magnet = decodeURIComponent(
                        $(elem)
                            .find(config.rutor.selectors.magnet)
                            .attr('href')
                            .replace(/^.+magnet/, 'magnet')
                            .trim(),
                    );

                    const [, episodes] = matched.groups.name.match(rutor.episodes);

                    matched.groups.episodes = episodes
                        // 01-15 => s01 e01-15
                        .replace(/^(\d+-.+)$/, 's01 e$1')
                        // S01 => s01
                        // 01x01-05 / 7 => s01x01-05 / 7
                        .replace(/^S?(\d+)/, 's$1')
                        // s01x01-05 / 7 => s01x01-05 / 07
                        .replace(/ (\d)$/, ' 0$1')
                        .replace('из', '/')
                        .replace(/x|х/, ' e');

                    if (
                        matched.groups.episodes.includes(`s${seasonNumber}`)
                        || matched.groups.episodes.includes(`s0${seasonNumber}`)
                    ) {
                        matched.groups.name = matched.groups.name.replace(rutor.episodes, '').trim();

                        const [quality, ...tags] = matched.groups.info.split(config.rutor.tagSplit);

                        matched.groups.tags = tags.join(config.rutor.tagSplit).replace(config.rutor.comments, '');

                        // вырезаем не относящееся к качеству
                        // WEBRip 720p от FilmStudio
                        matched.groups.quality = opts.noQuality
                            ? quality.replace(rutor.releaseGroup, '')
                            : quality.replace(new RegExp(
                                `(${rutor.search.quality.full}|${rutor.search.quality.back})(.+)`,
                            ), '$1');

                        parsed[i].rutor.push({...matched.groups});
                    }
                }
            });
        };

        let {$, rutorUrl} = await getRutorElems(rutor.search.quality.full, titleOriginalEscaped);
        parseGroups($);

        // если ничего не нашли — пробуем другое качество
        if (parsed[i].rutor.length === 0) {
            ({$, rutorUrl} = await getRutorElems(rutor.search.quality.back, titleOriginalEscaped));
            parseGroups($);
        }

        // если ничего не нашли — пробуем без качества
        if (parsed[i].rutor.length === 0) {
            ({$, rutorUrl} = await getRutorElems('', titleOriginalEscaped));
            parseGroups($, {noQuality: true});
        }

        let data;

        if (imdbId) {
            ({tv_results: [data]} = await tmdb.get({
                path: `find/tt${imdbId}`,
                params: {external_source: 'imdb_id'},
                cache: true,
                // proxy,
                ...getExpire('tmdb-api'),
            }));
        }

        if (!data) {
            [data] = await tmdb.get({
                path: 'search/tv',
                params: {query: titleOriginal},
                cache: true,
                // proxy,
                ...getExpire('tmdb-api'),
            });
        }

        parsed[i].id = id;

        parsed[i].urls = {
            rutor: rutorUrl,
            rutracker: config.service.rutracker.url + titleOriginal + rutor.search.quality.full.split('|')[0],
            kinopub: config.service.kinopub.url + titleOriginal,
            myshows: config.service.myshows.url + id,
        };

        if (kinopoiskId) {
            parsed[i].kp = {
                id: kinopoiskId,
                url: config.service.kp.film + kinopoiskId,
                rating: config.service.kp.rating(kinopoiskId),
            };
        }

        if (data) {
            const [show, {cast, crew}] = await Promise.all([
                tmdb.get({
                    path: `tv/${data.id}`,
                    cache: true,
                    // proxy,
                    ...getExpire('tmdb-api'),
                }),
                tmdb.get({
                    path: `tv/${data.id}/credits`,
                    cache: true,
                    // proxy,
                    ...getExpire('tmdb-api'),
                }),
            ]);

            await Promise.all(cast.map(async (elem, j) => {
                if (j < config.service.tmdb.castCount) {
                    const person = await tmdb.get({
                        path: `person/${elem.id}`,
                        cache: true,
                        // proxy,
                        ...getExpire('tmdb-api'),
                    });

                    cast[j] = {...person, ...cast[j]};
                }
            }));

            parsed[i].cover = config.service.tmdb.cover + data.poster_path;
            parsed[i].networks = show.networks.map(elem => elem.name);
            parsed[i].genres = show.genres.map(elem => elem.name);
            parsed[i].overview = data.overview;
            parsed[i].companies = show.production_companies.map(elem => elem.name);

            parsed[i].countries = show.origin_country.map(
                elem => `${emoji(elem)} ${countries.getName(elem, 'ru')}`,
            );

            parsed[i].release = show.first_air_date;
            // parsed[i].status = show.status;
            parsed[i].seasons = show.number_of_seasons;
            parsed[i].episodes = show.number_of_episodes;
            // parsed[i].lastEpisode = show.last_air_date;
            // parsed[i].nextEpisode = show.next_episode_to_air?.air_date;
            parsed[i].tagline = show.tagline;
            parsed[i].director = crew.filter(elem => elem.job === 'Director').map(elem => elem.name);

            parsed[i].creator = show.created_by.map(elem => elem.name);

            parsed[i].photos = [
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
            ].slice(0, config.service.tmdb.castCount);

        }

    }));

    const withMagnet = parsed.filter(elem => elem.rutor.length > 0);

    log(c.blue(`Сериалов с Myshows: ${watching.length}`));
    log(c.blue(`Сериалов найдено на Rutor: ${withMagnet.length}`));

    const notFound = _.xor(seriesList, withMagnet.map(elem => elem.titleGenerated));

    log(c.cyan(`Сериалов не найдено: ${notFound.length}`));
    log(notFound.sort().join('\n'));

    const diff = date.diff({date: currentDate, period: 'milliseconds'});

    return {
        timestamp: {
            startTime,
            diff: ms(diff),
            diffRaw: diff,
        },
        items: parsed,
    };

};
