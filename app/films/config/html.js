export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,
    paginator: (length, rel, path) => `
        <div id="paginator">
        ${[...new Array(length).keys()].map(elem => ++elem).map(num => `
            <a href="${rel(path(num))}">${num}</a>
        `).join(' ')}
        </div>
    `,

    rating: (href, src) => `
        <div id="rating">
            <a href="${href}" target="_blank"><img src="${src}"></a>
        </div>
    `,

    photos: photo => `
        <div id="photos">
        ${photo.reverse().map(elem => `
            <img align="right" src="${elem}">
        `).join('\n')}
        </div>
    `,

    info: data => `
        <div id="info">
            ${data.filter(Boolean).join('<p>')}</p>
        </div>
    `,

    cover: data => `
        <div id="covers">
            ${data.map(elem => `
                <a href="${elem.href}"><img src="${elem.src}"></a>
            `).join('\n')}
        </div>
    `,

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
