export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,
    head: (vote, photo) => `
        <div id="rating">${vote}
        ${photo.reverse().map(elem => `
            <img align="right" src="${elem}">
        `).join('\n')}
        </div>
    `,

    info: data => `
        <div id="info">
            ${data.filter(Boolean).join('<p>')}
        </div>
    `,

    cover: (href, src) => `<a href="${href}"><img src="${src}"></a>`,

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
