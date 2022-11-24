const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('phone mania server is running')
})

app.listen(port, () => console.log('phone mania is running on port', port))