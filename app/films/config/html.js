export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,
    paginator: (length, rel, path) => `
        <div id="paginator">
            <div class="container" onclick="document.location = '/';">M</div>
            ${[...new Array(length).keys()].map(elem => ++elem).map(num => `
                <div class="container" onclick="document.location = '${rel(path(num))}';">
                    ${num}
                </div>
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
                <a href=${elem.link}><img align="right" src="${elem.cover}"></a>
            `).join(' ')}
        </div>
    `,

    info: data => `
        <div id="info">
            ${data.filter(Boolean).join('<hr><p>')}
        </div>
    `,

    cover: data => `
        <div id="covers">
            ${data.map(elem => `
                <div class="container">
                    <a href="${elem.href}"><img src="${elem.src}"></a>
                </div>
            `).join(' ')}
        </div>
    `,

    url: data => `
        <div id="urls">
            ${Object.entries(data).map(([key, value]) => `
                <a href="${value}" target="_blank">${key}</a>
            `).join(' ')}
        </div>
    `,

    table: data => `
        <table>
            ${data.map(elem => `
                <tr onclick="document.location = '${elem.magnet}';">
                    <td align="right">${elem.seed}</td>
                    <td>${elem.year}</td>
                    <td>${elem.name}</td>
                    <td>${elem.tags}</td>
                    <td>${elem.quality}</td>
                    <td align="right">${elem.size}</td>
                </tr>
            `).join(' ')}
        </table>
    `,
};
