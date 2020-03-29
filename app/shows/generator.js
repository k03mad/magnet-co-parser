import Jimp from 'jimp';
import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';

/**
 * @param {object} data
 * @returns {Function}
 */
export default async data => {
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

        if (!show.cover) {
            const noposter = await Jimp.read(paths.templates.noposter);
            const font = await Jimp.loadFont(paths.templates.font);

            const withText = await noposter.print(font, 0, 0, {
                text: show.titleGenerated,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
            }, 200, 300);

            await withText.writeAsync(`${paths.www.folder + show.id}.png`);

            show.cover = paths.www.noposter(show.id);
        }

        show.rutor.length > 0
            ? foundIndex.push({href: pageRelPath, src: show.cover})
            : notFoundIndex.push({href: pageRelPath, src: show.cover, notfound: true});

        const info = [
            show.countries,
            show.networks,
            show.overview,
            show.genres,
        ]
            .map(elem => Array.isArray(elem) ? elem.join(', ') : elem)
            .filter(Boolean);

        const pasteSerial = [
            html.url(show.urls),
            show.kp && show.kp.rating ? html.rating(show.kp.url, show.kp.rating) : '',
            show.photos ? html.photos(show.photos) : '',
            info.length > 0 ? html.info(info) : '',
            html.table(show.rutor),
        ].filter(Boolean);

        const generatedPage = page.toString().replace(html.placeholder, pasteSerial.join(''));
        await fs.promises.writeFile(pageAbsPath, generatedPage);
    }

    pasteIndex.push(html.cover([...foundIndex, ...notFoundIndex]));

    const generatedIndex = index.toString().replace(html.placeholder, pasteIndex.join(''));
    await fs.promises.writeFile(paths.www.list, generatedIndex);
};
