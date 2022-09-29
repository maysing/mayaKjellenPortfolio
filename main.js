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

app.use(
	express.urlencoded({
		extended: false
	})
)


app.get('/', function(request, response){
     response.render('start.hbs')
})

app.get('/admin', function(request, response){
    response.render('admin.hbs')
})

app.post('/admin', function(request, response){
    
    const title = request.body.title
    const link = request.body.link
    const course = request.body.course
    const year = request.body.year

    data.works.push({
        id: data.works.at(-1).id +1,
        title: title, 
        link: link, 
        course: course, 
        year: year

    })

    response.redirect('/works')

})


app.get('/works', function(request, response){

    const model = {
        works: data.works
    }

    response.render('works.hbs', model)

})

app.get("/works/:id", function(request, response){

    const id = request.params.id

    const work = data.works.find[work => work.id == id]

    const model = {
        work: work, 
    }

    response.render('work.hbs', model)

})

app.get('/login', function(request, response){
    response.render('login.hbs')
})
 
 
app.listen(8080)