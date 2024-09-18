const fs = require("fs");
const xmldom = require("@xmldom/xmldom");
const { optimize } = require("svgo");
const webpack = require("webpack");
const { RawSource } = webpack.sources || require("webpack-sources");
const crypto = require('crypto');
const DOMParser = new xmldom.DOMParser();
const XMLSerializer = new xmldom.XMLSerializer();
const XMLDoc = new xmldom.DOMImplementation().createDocument(null, null, null);

class SimpleSVGSprite {
  constructor(options) {
    if (!options || !options.svgFolderPath) {
      throw new Error("Error: 'svgFolderPath' option not passed.");
    }
    this.config = {
      svgFolderPath: options.svgFolderPath,
      spriteOutput: options.spriteOutput || "spritemap.svg",
      prefix: options.prefix || "shape-",
      svgoOptions: options.svgoOptions || {},
    };
    this.svgString = "";
    this.svgSprite = this.creatSvgSprite();
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("SimpleSVGSprite", (compilation, callback) => {
      this.generateSvgSprite()
        .then(() => {
          compilation.emitAsset(
            this.config.spriteOutput,
            new RawSource(this.svgString)
          );
          callback();
        })
        .catch((err) => {
          console.error("Error generating SVG sprite:", err);
          callback(err);
        });
    });
  }

  async generateSvgSprite() {
    try {
      const { svgFolderPath, prefix } = this.config;
      const files = await fs.promises.readdir(svgFolderPath);

      for (const file of files) {
        const { id, svgContent, svgName } = await this.handleReadSvg(
          svgFolderPath,
          file,
          prefix
        );

        const svg = this.svgOptimization(svgContent, svgName);

        const symbol = this.createSymbol(svg, id);

        Array.from(svg.documentElement.childNodes).forEach((childNode) => {
          symbol.appendChild(childNode);
        });

        const linearGradientElements =
          symbol.getElementsByTagName("linearGradient");

        if (linearGradientElements.length === 0) {
          this.svgSprite.appendChild(symbol);
        }
      }
      this.serializeSvgs();
    } catch (err) {
      throw new Error("Error generating SVG sprite:", err);
    }
  }

  async handleReadSvg(svgFolderPath, file, prefix) {
    const filePath = `${svgFolderPath}/${file}`;
    const svgName = this.removeFileExtension(file);
    const id = `${prefix}${svgName}`;
    const svgContent = await fs.promises.readFile(filePath, "utf-8");
    return { id, svgContent, svgName };
  }

  svgOptimization(svgContent, svgName) {
    const optimizedSvg = optimize(svgContent, {
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              ...this.config.svgoOptions,
              removeViewBox: false,
            },
          },
        },
        "cleanupIds",
        {
          name: "prefixIds",
          params: {
            prefix: svgName,
          },
        },
      ],
    }).data;

    return DOMParser.parseFromString(optimizedSvg, "image/svg+xml");
  }

  createSymbol(svg, id) {
    const symbol = XMLDoc.createElement("symbol");
    symbol.setAttribute("id", id);

    const viewBoxVal = svg.documentElement.getAttribute("viewBox");
    if (viewBoxVal) {
      symbol.setAttribute("viewBox", viewBoxVal);
    }
    return symbol;
  }

  removeFileExtension(filename) {
    const lastDotIndex = filename.lastIndexOf(".");
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  }

  creatSvgSprite() {
    const svgSprite = XMLDoc.createElement("svg");
    svgSprite.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgSprite.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svgSprite.setAttribute("width", 0);
    svgSprite.setAttribute("height", 0);
    return svgSprite;
  }

  serializeSvgs() {
    this.svgString = XMLSerializer.serializeToString(this.svgSprite);
  }
}

const GenerateSVGContentHash = (content) => {
  const hash = crypto.createHash("md5");
  const data = hash.update(content, "utf-8");
  return data.digest("hex");
};

module.exports = { SimpleSVGSprite, GenerateSVGContentHash };
