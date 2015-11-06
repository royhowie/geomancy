var fs = require('fs')
var browserify = require('browserify')

console.log('\ncompiling and rebundling geomancy.es6.js')

browserify('./geomancy.es6.js')
    .transform('babelify', { presets: [ 'es2015' ] })
    .transform({ global : true }, 'uglifyify')
    .bundle()
    .pipe(fs.createWriteStream('./output/bundle.js'))
