import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';
import pretty from 'pretty';
import utils from 'utils-mad';

/**
 * Generate HTML
 * @returns {Function}
 */
export default async () => {
    const date = utils.date.now();

    const [index, page, data] = await Promise.all([
        fs.promises.readFile(paths.templates.index),
        fs.promises.readFile(paths.templates.page),
        fs.promises.readFile(paths.json.file),
    ]);

    const pasteIndex = [html.date(date)];
    const notFoundIndex = [];

    for (const show of JSON.parse(data)) {
        const pageAbsPath = `${paths.www.pages}/${show.id}.html`;
        const pageRelPath = `${paths.getRel(paths.www.pages)}/${show.id}.html?rnd=${Math.random()}`;

        show.rutor.length > 0
            ? pasteIndex.push(html.cover.found(pageRelPath, show.cover))
            : notFoundIndex.push(html.cover.notFound(pageRelPath, show.cover));

        const pasteSerial = [
            html.date(date),
            html.url(show.urls),
            ...show.rutor.map(elem => html.td(elem)),
        ];

        const generatedPage = page.toString().replace(html.placeholder, pasteSerial.join('\n'));
        await fs.promises.writeFile(pageAbsPath, pretty(generatedPage));
    }

    const generatedIndex = index.toString().replace(html.placeholder, [...pasteIndex, ...notFoundIndex].join('\n'));
    await fs.promises.writeFile(paths.www.index, pretty(generatedIndex));
};
