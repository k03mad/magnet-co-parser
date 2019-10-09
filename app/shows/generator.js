import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';
import pretty from 'pretty';

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
    const notFoundIndex = [];

    for (const show of data.items) {
        const pageAbsPath = `${paths.www.pages}/${show.id}.html`;
        const pageRelPath = `${paths.getRel(paths.www.pages)}/${show.id}.html`;

        show.rutor.length > 0
            ? pasteIndex.push(html.cover.found(pageRelPath, show.cover))
            : notFoundIndex.push(html.cover.notFound(pageRelPath, show.cover));

        const pasteSerial = [
            html.url(show.urls),
            html.table(show.rutor),
        ];

        const generatedPage = page.toString().replace(html.placeholder, pasteSerial.join(''));
        await fs.promises.writeFile(pageAbsPath, pretty(generatedPage));
    }

    const generatedIndex = index.toString().replace(html.placeholder, [...pasteIndex, ...notFoundIndex].join('\n'));
    await fs.promises.writeFile(paths.www.list, pretty(generatedIndex));
};
