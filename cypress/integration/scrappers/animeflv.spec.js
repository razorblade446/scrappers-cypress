/// <reference types="Cypress" />

const _ = require("lodash");
const moment = require("moment");
const fs = require("fs");

const baseUrl = "https://animeflv.net/";
let fileName = "kimetso-no-jaiba.crawljob";
let animeName = "Kimetso No Jaiba";
let episodes = [];

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
    cy.visit("https://animeflv.net/anime/5557/kimetsu-no-yaiba");
    for (let i = 0; i < 10; i++) {
      cy.get(".ListCaps").scrollTo("bottom");
      cy.wait(500);
    }

    cy.get(".fa-play-circle:not(.Next) a").then((episodeItems) => {
      for (let i = 0; i < episodeItems.length; i++) {
        let realEpisodeNumber = episodeItems.length - i;
        let episodeName = "";
        if (realEpisodeNumber <= 14) {
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

    cy.log("Done!");
  });
});
