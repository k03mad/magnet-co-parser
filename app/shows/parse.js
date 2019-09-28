import c from 'colorette';
import cheerio from 'cheerio';
import fs from 'fs';
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
    const parsed = [];
    const seriesList = [];

    const watching = await utils.myshows.watch({onlyAired: true});

    await Promise.all(watching.map(async (series, i) => {
        const {title, titleOriginal, episodesToWatch, id, kinopoiskId, imdbId} = series.show;
        const {seasonNumber} = episodesToWatch[episodesToWatch.length - 1];

        const titleGenerated = title === titleOriginal ? title : `${title} / ${titleOriginal}`;
        seriesList.push(titleGenerated);
        parsed[i] = {title, titleOriginal, titleGenerated, rutor: []};

        /**
         * Возвращает элементы на странице поиска со ссылкой
         * @param {string} quality
         * @returns {object}
         */
        const getRutorElems = async quality => {
            const rutorUrl = rutor.search.url + titleOriginal.replace(/'/g, '') + quality;
            const rutorProxyUrl = proxy + encodeURIComponent(rutorUrl);

            const {body} = await utils.request.got(rutorProxyUrl, {timeout: rutor.timeout});
            return {$: cheerio.load(body), rutorUrl, rutorProxyUrl};
        };

        let {$, rutorUrl, rutorProxyUrl} = await getRutorElems(rutor.search.quality.full);

        if ($(rutor.selectors.td).contents().length === 0) {
            ({$, rutorUrl, rutorProxyUrl} = await getRutorElems(rutor.search.quality.back));
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
                && Number(matched.groups.seed) >= rutor.minSeeds
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

        const [data] = await utils.tmdb.get({
            path: 'search/tv',
            params: {query: titleOriginal},
            gotOpts: {timeout: service.tmdb.timeout},
            cacheExpireDays: service.tmdb.cacheDays.api,
        });

        parsed[i].cover = service.tmdb.cover + data.poster_path;
        parsed[i].urls = {
            rutor: rutorUrl,
            proxy: rutorProxyUrl,
            myshows: service.myshows.url + id,
            kinopoisk: service.kinopoisk.url + kinopoiskId,
            imdb: service.imdb.url + imdbId,
            tmdb: service.tmdb.url + data.id,
            rutracker: service.rutracker.url + titleOriginal + rutor.search.quality.full,
            lostfilm: service.lostfilm.url + titleOriginal,
        };
    }));

    const withMagnet = parsed.filter(elem => elem.rutor.length > 0);

    console.log(c.blue(`Сериалов с Myshows: ${watching.length}`));
    console.log(c.blue(`Найдено на Rutor: ${withMagnet.length}`));

    const diff = utils.array.diff(seriesList, withMagnet.map(elem => elem.titleGenerated));

    console.log(c.cyan(`Не найдено: ${diff.length}`));
    console.log(diff.sort().join('\n'));

    try {
        await fs.promises.unlink(paths.json.file);
    } catch (err) {
        console.log(c.yellow(`Не найден старый файл парсера ${paths.json.file}`));
    }

    await fs.promises.writeFile(paths.json.file, JSON.stringify(parsed));
};
