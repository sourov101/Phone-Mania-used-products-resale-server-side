const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());




const uri = "mongodb+srv://<username>:<password>@cluster0.ehoamog.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




app.get('/', async (req, res) => {
    res.send('phone mania server is running')
})

app.listen(port, () => console.log('phone mania is running on port', port))