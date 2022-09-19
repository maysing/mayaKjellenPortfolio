const express = require('express')
const expressHandlebars = require('express-handlebars')
const data = require('./data.js')
 
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

app.get('/works', function(request, response){

    const model = {
        works: data.works
    }

    response.render('works.hbs', model)

})
 
 
app.listen(8080)