var fs = require('fs')
var browserify = require('browserify')

browserify('./geomancy.es6.js')
    .transform('babelify', { presets: [ 'es2015' ] })
    .transform({ global : true }, 'uglifyify')
    .bundle()
    .pipe(fs.createWriteStream('bundle.js'))
