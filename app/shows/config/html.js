export default {
    placeholder: '{{}}',

    date: data => `<div id="date">${data}</div>`,

    cover: data => `
        <div id="covers">
            ${data.map(elem => `
                <div class="covers_container">
                    <a href="${elem.href}"><img src="${elem.src}"${elem.notfound ? ' class="notfound"' : ''}></a>
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
            ${photo.reverse().map(elem => elem.url).map(elem => `
                <img align="right" src="${elem}">
            `).join(' ')}
        </div>
    `,

    info: data => `
        <div id="info">
            ${data.filter(Boolean).map((elem, i) => i === 0 ? elem : `<p>${elem}</p>`).join(' ')}
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
                    <td>${elem.episodes}</td>
                    <td>${elem.tags}</td>
                    <td>${elem.quality}</td>
                    <td align="right">${elem.size}</td>
                </tr>
            `).join(' ')}
        </table>
    `,
};
