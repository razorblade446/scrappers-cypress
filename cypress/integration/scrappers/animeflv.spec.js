/// <reference types="Cypress" />

const _ = require("lodash");
const fs = require("fs");

const baseUrl = "https://animeflv.net/";
const animeUrl = "https://animeflv.net/anime/4681/date-a-live-2";
const maxEpisode = 1000; // If progress fails, change this to the next episode on restart
let fileName;
let animeName;

const defaultItem = {
  text: "",
  filename: "",
  packageName: "",
  downloadFolder: "",
};

Cypress.config("baseUrl", baseUrl);

const propertiesWriter = (properties) => {
  let outStr = '';
  const objKeys = Object.keys(properties);
  for (let i = 0; i < objKeys.length; i++) {
    let myKey = objKeys[i];
    let myValue = properties[myKey];
    outStr += `${myKey}=${myValue}\n`;
  }
  cy.writeFile(fileName, outStr + "\n", { flag: "a+" });
};

describe("AnimeFLV Scrapper", () => {
  it("Get Chapter links", () => {
    cy.visit(animeUrl);

    cy.get('.Ficha.fchlt .Title').first().invoke('text').then(title => {
      animeName = title.replace(/[^\w]+/gi, ' ').replace(/\s{2,}/gi, ' ');
      fileName = animeName.toLowerCase().replace(/\s/ig, '-') + '.crawljob';

      for (let i = 0; i < 10; i++) {
        cy.get(".ListCaps").scrollTo("bottom");
        cy.wait(500);
      }

      cy.log('Title: ', animeName);
      console.log('Title: ', animeName);
      cy.log('FileName: ', fileName);
      console.log('FileName: ', fileName);

      cy.get(".fa-play-circle:not(.Next) a").then((episodeItems) => {
        for (let i = 0; i < episodeItems.length; i++) {
          let realEpisodeNumber = episodeItems.length - i;
          let episodeName = "";
          if (realEpisodeNumber <= maxEpisode) {
            cy.visit(episodeItems[i].getAttribute("href"));

            cy.get("h2.SubTitle")
              .invoke("text")
              .then((text) => (episodeName = text));

            cy.get(".BtnNw.Dwnd.fa-download").click();

            cy.get(".Button.Sm.fa-download").then((buttons) => {
              let links = [];
              for (i = 0; i < buttons.length; i++) {
                links.push(buttons[i].getAttribute("href"));
              }

              const mega = _.find(links, (link) => link.indexOf("mega.nz") > -1);

              let desiredLink = mega || links[0];

              cy.writeFile(fileName, "# " + animeName + ' ' + episodeName + '\n', { flag: 'a+' });

              [desiredLink, ...links].map((link) => {
                cy.log(link);
                let downloadItem = {
                  text: link,
                  filename: animeName + " " + episodeName + ".mp4",
                  packageName: animeName,
                  downloadFolder: animeName + "/Season 01",
                };

                propertiesWriter(downloadItem);
              });
            });
          }
        }
      });

    });

    cy.log("Done!");
  });
});
