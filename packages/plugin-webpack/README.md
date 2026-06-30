# @localive/webpack

> Webpack dev-server plugin that saves Localive's in-app edits to disk.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/webpack
```

Requires the peer dependencies `webpack` (>=5) and `@localive/vite`.

## Usage

```js
// webpack.config.js
const { LocaliveWebpackPlugin } = require('@localive/webpack');

module.exports = {
  devServer: {
    // ...your dev server config
  },
  plugins: [
    new LocaliveWebpackPlugin({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
    }),
  ],
};
```

See the full documentation at **https://localive.vercel.app/plugins/webpack/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
