var csvWriter = require('csv-write-stream');
var writer = csvWriter();
var fs = require('fs');
writer.pipe(fs.createWriteStream('out.csv'))
writer.write({hello: "world", foo: "bar", baz: "taco"})
writer.end()
 
