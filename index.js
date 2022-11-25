const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ehoamog.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//custom middleware
function verifyJwt(req, res, next) {
    console.log(req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' })
        }
        req.decoded = decoded;
        next();
    })
}




async function run() {
    try {
        const brandCollection = client.db('phone').collection('brands');
        const productsCollection = client.db('phone').collection('products');
        const bookingCollection = client.db('phone').collection('booking');
        const userCollection = client.db('phone').collection('user');

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

        app.get('/bookings', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })


        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN)
                return res.send({ accessToken: token })
            }
            res.status(401).send({ accessToken: 'Unauthorized Access' })
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