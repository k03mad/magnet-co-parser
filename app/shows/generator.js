import Jimp from 'jimp';
import fs from 'node:fs';

import {getCover} from '../../utils.js';
import html from './config/html.js';
import paths from './config/paths.js';
import service from './config/service.js';

/**
 * @param {object} data
 * @param {string} proxy
 * @returns {Promise}
 */
export default async (data, proxy) => {
    const [index, page] = await Promise.all([
        fs.promises.readFile(paths.templates.list),
        fs.promises.readFile(paths.templates.page),
    ]);

    const pasteIndex = [html.date(`${data.timestamp.startTime} - ${data.timestamp.diff}`)];

    const foundIndex = [];
    const notFoundIndex = [];

    for (const show of data.items) {
        const pageAbsPath = `${paths.www.pages}/${show.id}.html`;
        const pageRelPath = `${paths.getRel(paths.www.pages)}/${show.id}.html`;

        if (show.cover) {
            show.cover = getCover(show.cover, proxy);
        } else {
            const noposter = await Jimp.read(paths.templates.noposter);
            const font = await Jimp.loadFont(paths.templates.font);

            const withText = await noposter.print(font, 0, 0, {
                text: show.title,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
            }, 200, 300);

            await withText.writeAsync(paths.www.noposter(show.id));
            show.cover = paths.getRel(paths.www.noposter(show.id));
        }

        show.rutor.length > 0
            ? foundIndex.push({href: pageRelPath, src: show.cover})
            : notFoundIndex.push({href: pageRelPath, src: show.cover, notfound: true});

        const pasteSerial = [
            html.url(show.urls),
            show.kp?.rating
                ? html.rating(show.kp.url, show.kp.rating)
                : '',
            show.photos
                ? html.photos(show.photos.slice(0, service.tmdb.castCount).map(elem => ({
                    ...elem, cover: getCover(elem.cover, proxy),
                })))
                : '',
            html.info([
                show.countries?.length > 0 ? `Страны: ${show.countries.slice(0, service.tmdb.countriesCount).join(', ')}` : '',
                show.creator?.length > 0 ? `Создатели: ${show.creator.join(', ')}` : '',
                show.director?.length > 0 ? `Режиссёры: ${show.director.join(', ')}` : '',
                show.companies?.length > 0 ? `Компании: ${show.companies.slice(0, service.tmdb.companiesCount).join(', ')}` : '',
                show.networks?.length > 0 ? `ТВ: ${show.networks.slice(0, service.tmdb.networksCount).join(', ')}` : '',
                show.overview,
                show.genres ? show.genres.slice(0, service.tmdb.genresCount).join(', ') : '',
            ].filter(Boolean)),
            html.table(show.rutor),
        ].filter(Boolean);

        const generatedPage = page.toString().replace(html.placeholder, pasteSerial.join(''));
        await fs.promises.writeFile(pageAbsPath, generatedPage);
    }

    pasteIndex.push(html.cover([...foundIndex, ...notFoundIndex]));

    const generatedIndex = index.toString().replace(html.placeholder, pasteIndex.join(''));
    await fs.promises.writeFile(paths.www.list, generatedIndex);
};
