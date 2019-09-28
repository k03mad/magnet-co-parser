import fs from 'fs';
import html from './config/html.js';
import paths from './config/paths.js';
import pretty from 'pretty';
import service from './config/service.js';
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

    await utils.folder.erase(paths.www.pages, {force: true});

    const pasteIndex = [html.date(date)];
    const notFoundIndex = [];

    for (const show of JSON.parse(data)) {
        const {baseSafe, nameSafe} = await utils.request.download({
            url: show.cover,
            folder: paths.covers.folder,
            name: show.titleOriginal,
            ext: 'jpg',
            replace: false,
            force: true,
            eraseFolderDays: service.tmdb.cacheDays.cover,
        });

        const coverRelPath = `${paths.getRel(paths.covers.folder)}/${baseSafe}`;
        const pageAbsPath = `${paths.www.pages}/${nameSafe}.html`;
        const pageRelPath = `${paths.getRel(paths.www.pages)}/${nameSafe}.html?rnd=${Math.random()}`;

        show.rutor.length > 0
            ? pasteIndex.push(html.cover.found(pageRelPath, coverRelPath))
            : notFoundIndex.push(html.cover.notFound(pageRelPath, coverRelPath));

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
