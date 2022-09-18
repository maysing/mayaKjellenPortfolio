const express = require('express')
const expressHandlebars = require('express-handlebars')
 
const app = express()
 
app.engine('hbs', expressHandlebars.engine({
    defaultLayout: 'main.hbs',
}))
 
app.use(
    express.static('public')
)
 
app.get('/', function(request, response){
     response.render('start.hbs')
})
 
 
app.listen(8080)