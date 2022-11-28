const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
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
        const paymentCollection = client.db('phone').collection('payment');
        const reportedCollection = client.db('phone').collection('reported');



        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden' })
            }
            next();
        }


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



        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            res.send(result)
        })
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    paid: true,
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.put('/products/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertise: 'advertise',
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingCollection.findOne(filter);
            res.send(result);
        })


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const price = booking.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.productId;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,

                }
            }

            const updateResult = await bookingCollection.updateOne(filter, updatedDoc);

            res.send(result);

        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_Token)
                return res.send({ accessToken: token });
            }
            res.status(401).send({ accessToken: 'Unauthorized Access' })
        })

        app.get('/users', async (req, res) => {

            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);

        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })


        app.put('/users/admin/:id', verifyJwt, verifyAdmin, async (req, res) => {



            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.put('/users/verify/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: 'true'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.userType === 'Seller' });
        })

        app.delete('/users/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/reported', async (req, res) => {
            const query = {};
            const products = await reportedCollection.find(query).toArray();
            res.send(products);
        })
        app.post('/reported', async (req, res) => {
            const products = req.body;
            const result = await reportedCollection.insertOne(products);
            res.send(result)
        })
        app.delete('/reported/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: id };
            const result = await reportedCollection.deleteOne(filter);
            res.send(result);
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