export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,

    cover: {
        found: (href, src) => `<a href="${href}"><img src="${src}"></a>`,
        notFound: (href, src) => `<a href="${href}"><img id="notfound" src="${src}"></a>`,
    },

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
            <td>${elem.episodes}</td>
            <td>${elem.tags}</td>
            <td>${elem.quality}</td>
            <td align="right">${elem.size}</td>
        </tr>
    `,
};
