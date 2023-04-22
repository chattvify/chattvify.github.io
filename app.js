const express =require('express')
const app = express()

app.use(express.static('v1'))

app.get('/auth', (req, res) => {
    console.log(req, res)
})

app.listen(80, (res) => {

})