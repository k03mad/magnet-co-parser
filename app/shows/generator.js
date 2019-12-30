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

        show.rutor.length > 0
            ? foundIndex.push({href: pageRelPath, src: show.cover})
            : notFoundIndex.push({href: pageRelPath, src: show.cover, notfound: true});

        const pasteSerial = [html.url(show.urls)];

        if (show.kp && show.kp.rating) {
            pasteSerial.push(html.rating(show.kp.url, show.kp.rating));
        }

        pasteSerial.push(
            html.photos(show.photos),
            html.info([show.networks.join(', '), show.overview, show.genres.join(', ')]),
            html.table(show.rutor),
        );

        const generatedPage = page.toString().replace(html.placeholder, pasteSerial.join(''));
        await fs.promises.writeFile(pageAbsPath, generatedPage);
    }

    pasteIndex.push(html.cover([...foundIndex, ...notFoundIndex]));

    const generatedIndex = index.toString().replace(html.placeholder, pasteIndex.join(''));
    await fs.promises.writeFile(paths.www.list, generatedIndex);
};
