const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ehoamog.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const brandCollection = client.db('phone').collection('brands');
        const productsCollection = client.db('phone').collection('products');

        app.get('/brands', async (req, res) => {
            const query = {};
            const brands = await brandCollection.find(query).toArray();
            res.send(brands);
        })
        app.get('/products/:BrandId', async (req, res) => {

            const id = req.params.BrandId;

            const query = { BrandId: id }
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })
        app.get('/products', async (req, res) => {


            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })
    }
    finally {

    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('phone mania server is running')
})

app.listen(port, () => console.log('phone mania is running on port', port))