/// <reference types="Cypress" />

const _ = require("lodash");
const moment = require("moment");
const fs = require("fs");

const baseUrl = "https://animeblix.com/";
let fileName;
const animeId = 92;
let animeName;
let episodes = [];

const defaultItem = {
  text: "",
  filename: "",
  packageName: "",
  downloadFolder: "",
};

Cypress.config("baseUrl", baseUrl);

const requestPages = ({ body }) => {
  if (!animeName) {
    animeName = body.data[0].anime.title;
    fileName = animeName.toLowerCase() + '.crawljob';
  }

  for (let i = 1; i <= body.last_page; i++) {
    let pagePath = `${body.path}?animeId=${animeId}&page=${i}`;
    cy.request({
      method: "GET",
      url: pagePath,
      headers: {
        "x-requested-with": "XMLHttpRequest",
      },
    }).as("page" + i);

    cy.get("@page" + i).then((response) => requestEpisodes(response));
  }
};

const requestEpisodes = ({ body }) => {
  for (let i = 0; i < body.data.length; i++) {
    let episodio = body.data[i];
    const episodioPath = `${episodio.anime.slug}-episodio-${episodio.number}-${episodio.uuid}`;
    if (episodio.number <= 123) {
      cy.visit(episodioPath);
      let episodioName = `${episodio.anime.title} - S01E${episodio.number}`;
      cy.writeFile(fileName, "# " + episodioName + "\n", { flag: "a+" });
      cy.get("div.episode__video-actions.shadow div a").eq(2).click();
      cy.get(".mini-panel__body").children().then((downloadItems) => {
        cy.log(JSON.stringify(downloadItems[0]));
        let downloadOptions = {};
        for (let i = 0; i < downloadItems.length; i++) {
          downloadOptions[downloadItems[i].textContent] = downloadItems[
            i
          ].getAttribute("href");
        }

        const desiredUrl =
          downloadOptions["mp4Upload"] || downloadOptions["Mega"];

        if (desiredUrl) {
          const downloadItem = {
            text: desiredUrl,
            filename: episodioName + ".mp4",
            packageName: animeName,
            downloadFolder: animeName,
          };
          // propertiesWriter(downloadItem);
        }
      });
      /*     let episodioName = `${episodio.anime.title} - S01E${episodio.number}`;
            cy.writeFile(fileName, "# " + episodioName + '\n', { flag: 'a+' });
            let optionsUrl = `https://animeblix.com/episodes/player-options/${episodio.uuid}`;
            cy.request({
                method: 'GET',
                url: optionsUrl,
                headers: {
                    'x-requested-with': 'XMLHttpRequest'
                }
            })
                .then(({ body: optionsBody }) => {
                    let megaOptions = _.find(optionsBody, (option) => option.server === 'Mega');
                    let mp4Options = _.find(optionsBody, (option) => option.server === 'mp4Upload');

                    if (megaOptions) {
                        // megaDownloader(megaOptions);
                    }

                    if (mp4Options) {
                        mp4DownloaderCrawlJob(mp4Options, episodioName);
                    }
                }); */
    }
  }
};

const megaDownloader = (options) => {
  cy.writeFile(fileName, options.code.replace("embed", "") + "\n", {
    flag: "a+",
  });
};

const mp4Downloader = (options, name) => {
  cy.visit(options.code);
  cy.get("video").then((videoObj) => {
    console.log(videoObj[0]);
    const src = videoObj[0].getAttribute("src");
    const downloadCommand = `wget "${src}" -O '${name}.mp4'`;
    cy.writeFile(fileName, downloadCommand + "\n", { flag: "a+" });
  });
};

const mp4DownloaderCrawlJob = (options, name) => {
  cy.visit(options.code);
  cy.get("main").then((main) => {
    if (_.indexOf(main[0].classList, "bg-dark") === -1) {
      cy.get("video").then((videoObj) => {
        console.log(videoObj[0]);
        const src = videoObj[0].getAttribute("src");
        const downloadItem = {
          text: src,
          filename: name + ".mp4",
          packageName: animeName,
          downloadFolder: animeName,
        };
        propertiesWriter(downloadItem);
      });
    } else {
      cy.log("Skipped...");
    }
  });
};

const propertiesWriter = (properties) => {
  const objKeys = Object.keys(properties);
  for (let i = 0; i < objKeys.length; i++) {
    let myKey = objKeys[i];
    let myValue = properties[myKey];
    cy.writeFile(fileName, `${myKey}=${myValue}\n`, { flag: "a+" });
  }
  cy.writeFile(fileName, "\n", { flag: "a+" });
};

describe("AnimeBlix Scrapper", () => {
  it("Get Chapter links", () => {
    const url = `https://animeblix.com/episodes/animes?animeId=${animeId}`;
    cy.request({
      method: "GET",
      url,
      headers: {
        "x-requested-with": "XMLHttpRequest",
      },
    }).as("pages");

    cy.get("@pages").then((response) => {
      requestPages(response);
    });

    cy.log("Done!");
  });
});
