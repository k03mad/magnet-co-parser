import c from 'colorette';
import cheerio from 'cheerio';
import ms from 'ms';
import rutor from './config/rutor.js';
import service from './config/service.js';
import utils from 'utils-mad';

/**
 * Парсинг трекера
 * @param {string} proxy
 * @returns {Function}
 */
export default async proxy => {
    const date = new Date();
    const startTime = utils.date.now();

    const parsed = [];
    const seriesList = [];

    const watching = await utils.myshows.watch({onlyAired: true});

    /**
     * Возвращает элементы на странице поиска со ссылкой
     * @param {string} quality
     * @param {string} titleOriginal
     * @returns {object}
     */
    const getRutorElems = async (quality, titleOriginal) => {
        const rutorUrl = rutor.search.url + titleOriginal.replace(/'/g, '') + quality;
        const rutorProxyUrl = proxy + encodeURIComponent(rutorUrl);

        const {body} = await utils.request.got(rutorProxyUrl);
        return {$: cheerio.load(body), rutorUrl, rutorProxyUrl};
    };

    for (const [i, element] of watching.entries()) {
        const {title, titleOriginal, episodesToWatch, id, kinopoiskId, imdbId} = element.show;
        const {seasonNumber} = episodesToWatch[episodesToWatch.length - 1];

        const titleGenerated = title === titleOriginal ? title : `${title} / ${titleOriginal}`;
        seriesList.push(titleGenerated);
        parsed[i] = {title, titleOriginal, titleGenerated, rutor: []};

        let {$, rutorUrl, rutorProxyUrl} = await getRutorElems(rutor.search.quality.full, titleOriginal);

        if ($(rutor.selectors.td).contents().length === 0) {
            ({$, rutorUrl, rutorProxyUrl} = await getRutorElems(rutor.search.quality.back, titleOriginal));
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
                && matched.groups.name.match(rutor.episodes)
            ) {
                matched.groups.magnet = decodeURIComponent(
                    $(elem)
                        .find(rutor.selectors.magnet)
                        .attr('href')
                        .replace(/^.+magnet/, 'magnet')
                        .trim(),
                );

                const [, episodes] = matched.groups.name.match(rutor.episodes);

                matched.groups.episodes = episodes
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
                    matched.groups.quality = quality;
                    matched.groups.tags = tags.join(rutor.tagSplit).replace(rutor.comments, '');

                    parsed[i].rutor.push({...matched.groups});
                }
            }

        });

        let data;

        if (imdbId) {
            ({movie_results: [data]} = await utils.tmdb.get({path: `find/tt${imdbId}`, params: {external_source: 'imdb_id'}, caching: true}));
        }

        if (!data) {
            [data] = await utils.tmdb.get({path: 'search/tv', params: {query: titleOriginal}, caching: true});
        }

        try {
            await utils.tmdb.get({path: `tv/${data.id}`, caching: true, gotOpts: {attempts: 1}});
        } catch (err) {
            if (err.statusCode === 404) {
                [data] = await utils.tmdb.get({path: 'search/tv', params: {query: titleOriginal}, caching: true});
            }
        }

        const show = await utils.tmdb.get({path: `tv/${data.id}`, caching: true});
        const {cast} = await utils.tmdb.get({path: `tv/${data.id}/credits`, caching: true});

        parsed[i].cover = service.tmdb.cover + data.poster_path;
        parsed[i].id = id;
        parsed[i].urls = {
            rutor: rutorUrl,
            proxy: rutorProxyUrl,
            rutracker: service.rutracker.url + titleOriginal + rutor.search.quality.full,
            lostfilm: service.lostfilm.url + titleOriginal,
            myshows: service.myshows.url + id,
        };

        parsed[i].networks = show.networks.map(elem => elem.name).join(', ');
        parsed[i].genres = show.genres.map(elem => elem.name).slice(0, service.tmdb.genresCount);
        parsed[i].overview = data.overview;

        parsed[i].photos = [
            ...new Set(cast
                .slice(0, service.tmdb.castCount)
                .filter(elem => Boolean(elem.profile_path))
                .map(elem => ({
                    id: elem.id,
                    name: elem.name,
                    url: service.tmdb.cover + elem.profile_path,
                })),
            ),
        ];

        parsed[i].kp = {
            id: kinopoiskId,
            url: service.kp.url + kinopoiskId,
            rating: service.kp.rating(kinopoiskId),
        };
    }

    const withMagnet = parsed.filter(elem => elem.rutor.length > 0);

    console.log(c.blue(`Сериалов с Myshows: ${watching.length}`));
    console.log(c.blue(`Сериалов найдено на Rutor: ${withMagnet.length}`));

    const notFound = utils.array.diff(seriesList, withMagnet.map(elem => elem.titleGenerated));

    console.log(c.cyan(`Сериалов не найдено: ${notFound.length}`));
    console.log(notFound.sort().join('\n'));

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
