export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,
    paginator: (length, rel, path, add) => `
        <div id="paginator">
        ${[...new Array(length).keys()].map(elem => ++elem).map(num => `
            <a href="${rel(path(num, add))}">${num}</a>
        `).join(' ')}
        </div>
    `,

    rating: (href, src) => `
        <div id="rating">
            <a href="${href}" target="_blank"><img src="${src}"></a>
        </div>
    `,

    photos: photo => `
        <div>
        ${photo.reverse().map(elem => `
            <img id="photos" align="right" src="${elem}">
        `).join('\n')}
        </div>
    `,

    info: data => `
        <div id="info">
            ${data.filter(Boolean).join('<p>')}
        </div>
    `,

    cover: (href, src) => `<a href="${href}"><img id="covers" src="${src}"></a>`,

    url: data => `
        <div id="urls">
            ${Object.entries(data).map(([key, value]) => `
                <a href="${value}" target="_blank">${key}</a>
            `).join('\n')}
        </div>
    `,

    td: elem => `
        <tr onclick="document.location = '${elem.magnet}';">
            <td align="right">${elem.seed}</td>
            <td>${elem.year}</td>
            <td>${elem.name}</td>
            <td>${elem.tags}</td>
            <td>${elem.quality}</td>
            <td align="right">${elem.size}</td>
        </tr>
    `,
};
