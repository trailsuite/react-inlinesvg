"use strict"
var path = require('path')
var srcPath = path.join(__dirname, 'src')

module.exports = {
  target: 'web',
  cache: true,
  entry: {
    module: path.join(srcPath, 'index.js'),
    common: ['react']
  },
  resolve: {
    root: srcPath,
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules', 'src']
  },
  output: {
    path: './standalone/',
    filename: 'react-inlinesvg-with-cache.js',
    library: 'ReactInlineSVG',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          plugins: ['add-module-exports'],
          presets: ['es2015']
        }
      }
    ]
  }
};