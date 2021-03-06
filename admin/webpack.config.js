const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: slsw.lib.entries,
  target: 'node',
  externals: [
    /^aws-sdk/,
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loaders: ['eslint-loader'],
        exclude: /node_modules/,
      },
      // We avoid transpiling to keep the code more readable in Lambda console
      // {
      //   test: /\.js$/,
      //   loaders: ['babel-loader'],
      //   include: __dirname,
      //   exclude: /node_modules/,
      // }
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
};
