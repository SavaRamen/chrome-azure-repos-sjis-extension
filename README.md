# Chrome Extension for Azure Repos SJIS files

This extension supports displaying SJIS files in Azure Repos website.

The Azure Repos website only supports displaying in UTF-8. Therefore, SJIS files are normally not displayed properly. This extension corrects the display of SJIS files.

### before

![before](./images/before.png)

#### after

![after](./images/after.png)

### update procedures

- develop
  - vscode
    - update `./src`
- test
  - chrome://extensions
    - load unpackaged extensions
      - folder: `./extension/`
- document
  - vscode
    - update `./README.md`
    - update `version` property in `./extension/manifest.json`
- release
  - [chrome web store](https://chrome.google.com/webstore/category/extensionschrome)
    - developer dashboard
