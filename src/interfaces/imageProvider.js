/**
 * @typedef ImageProviderConfig
 * @type {Object}
 */

/**
 * Stores and loads images
 * @constructor
 * @param {ImageProviderConfig} config - configs
 */
function ImageProvider(config){
  this.config  = config;
}

// Actual

// @return ReaderStream
ImageProvider.prototype.readActualImage = function(){
}

// Reference

// @return ReaderStream
ImageProvider.prototype.readReferenceImage = function(){
}


// Diff

// @param {WriterStream} diffWriter - write the diff image here
ImageProvider.prototype.writeDiffImage = function(){
}
