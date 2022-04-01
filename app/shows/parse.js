import {date, myshows, request, tmdb, ua} from '@k03mad/util';
import c from 'chalk';
import cheerio from 'cheerio';
import countries from 'i18n-iso-countries';
import _ from 'lodash';
import ms from 'ms';

import rutor from './config/rutor.js';
import service from './config/service.js';

const getRutorElems = async (quality, titleOriginal) => {
    const rutorUrl = rutor.search.url + titleOriginal.replaceAll("'", '') + quality;

    const {body} = await request.cache(rutorUrl, {
        timeout: {request: rutor.timeout},
        headers: {'user-agent': ua.win.chrome},
    }, {expire: '30m'});

    return {$: cheerio.load(body), rutorUrl};
};

/** @returns {Promise<object>} */
export default async () => {
    const currentDate = new Date();
    const startTime = date.now();

    const parsed = [];
    const seriesList = [];

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
            $(rutor.selectors.td).each((x, elem) => {

                const td = $(elem)
                    .text()
                    .replace(/\s+/g, ' ')
                    .trim();

                const matched = td.match(rutor.regexp);

                if (matched?.groups?.name.match(rutor.episodes)) {
                    matched.groups.magnet = decodeURIComponent(
                        $(elem)
                            .find(rutor.selectors.magnet)
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

                        const [quality, ...tags] = matched.groups.info.split(rutor.tagSplit);

                        matched.groups.tags = tags.join(rutor.tagSplit).replace(rutor.comments, '');

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
            ({tv_results: [data]} = await tmdb.get({path: `find/tt${imdbId}`, params: {external_source: 'imdb_id'}, cache: true}));
        }

        if (!data) {
            [data] = await tmdb.get({path: 'search/tv', params: {query: titleOriginal}, cache: true});
        }

        parsed[i].id = id;

        parsed[i].urls = {
            rutor: rutorUrl,
            rutracker: service.rutracker.url + titleOriginal + rutor.search.quality.full,
            kinopub: service.kinopub.url + titleOriginal,
            myshows: service.myshows.url + id,
        };

        if (kinopoiskId) {
            parsed[i].kp = {
                id: kinopoiskId,
                url: service.kp.url + kinopoiskId,
                rating: service.kp.rating(kinopoiskId),
            };
        }

        if (data) {
            const show = await tmdb.get({path: `tv/${data.id}`, cache: true});
            const {cast, crew} = await tmdb.get({path: `tv/${data.id}/credits`, cache: true});

            parsed[i].cover = service.tmdb.cover + data.poster_path;
            parsed[i].networks = show.networks.map(elem => elem.name);
            parsed[i].genres = show.genres.map(elem => elem.name);
            parsed[i].overview = data.overview;
            parsed[i].companies = show.production_companies.map(elem => elem.name);
            parsed[i].countries = show.origin_country.map(elem => countries.getName(elem, 'ru'));
            parsed[i].director = crew.filter(elem => elem.job === 'Director').map(elem => elem.name);
            parsed[i].creator = show.created_by.map(elem => elem.name);

            parsed[i].photos = [
                ...new Set(cast
                    .filter(elem => Boolean(elem.profile_path))
                    .map(elem => ({
                        id: elem.id,
                        link: service.tmdb.person + elem.id,
                        name: elem.name,
                        cover: service.tmdb.cover + elem.profile_path,
                    })),
                ),
            ];

        }

    }));

    const withMagnet = parsed.filter(elem => elem.rutor.length > 0);

    console.log(c.blue(`Сериалов с Myshows: ${watching.length}`));
    console.log(c.blue(`Сериалов найдено на Rutor: ${withMagnet.length}`));

    const notFound = _.xor(seriesList, withMagnet.map(elem => elem.titleGenerated));

    console.log(c.cyan(`Сериалов не найдено: ${notFound.length}`));
    console.log(notFound.sort().join('\n'));

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
