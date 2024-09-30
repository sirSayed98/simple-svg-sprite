# simple-svg-sprite

A Webpack plugin for creating an SVG sprite from individual SVG files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Change reference](#change-reference)
- [Demo](#demo)
---

## Installation

Install `simple-svg-sprite` using npm or yarn as a dev dependency:

```
npm install --save-dev simple-svg-sprite
```
OR
```
yarn add --dev simple-svg-sprite
```
## Usage

Here's how to use the plugin in your Webpack configuration:
```
// import package 
const { SimpleSVGSprite, GenerateSVGContentHash } = require('simple-svg-sprite');
const svgContentHash = GenerateSVGContentHash('path/to/svgs/folder')

module.exports = {
   // ... other webpack config 
   plugins: [ 
   new SimpleSVGSprite({
      svgFolderPath: 'path/to/svgs/folder',
      spriteOutput: spritemap.${svgContentHash}.svg,
    }),
  ] 
};
```

## Options

| Option | Required | Description | Default
|--------|----------|-------------|---------
| `svgFolderPath` | **Yes** | The path to SVG images folder | -
| `spriteOutput` | **NO** | The output sprite name | `"spritemap.svg"`
| `prefix` | **NO** | Prefix to each symbol ID  | `"shape-"`
| `svgoOptions` |**NO** | Custom optimization using SVGO library | `{}`

## Change reference 
we need to convert reference from your code to sprite refrence 
example:
```
// your code 
<svg>
  <use xlink:href="#shape-sp-delete" />
</svg>
// to
<svg>
  <use xlink:href="spritemap.${svgContentHash}.svg#shape-sp-delete" />
</svg>
```
- You don't need to update your code base to this format , you can use [Mutation observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to do that `OR` use custom loader:

```
// add this rule to your loaders
{
        test: /\.(js|html)$/,
        exclude: [/node_modules/],
        use: {
          loader: path.resolve(__dirname, './custom-loaders/EditSvgHrefLoader'),
          options: {
            svgFileName: `spritemap.${svgContentHash}.svg`,
            prefix: 'shape-',
          },
        },
},

// create EditSvgHrefLoader.js file in custom-loaders folder
custom-loaders/EditSvgHrefLoader.js

const loaderUtils = require('loader-utils');
module.exports = function (source) {
  const { svgFileName, prefix } = loaderUtils.getOptions(this);

  const modifiedSource = source.replace(
    new RegExp(`#${prefix}`, 'g'),
    `${svgFileName}#${prefix}`
  );

  return modifiedSource;
};
```
## Demo
You can see demo [here](https://codesandbox.io/p/github/sirSayed98/simple-svg-sprite-example/main).
