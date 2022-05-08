const express = require("express");
const { MongoClient,ObjectID } = require('mongodb');
require('dotenv').config();
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

const admin = process.env.DB_USER;
const password = process.env.DB_PASS;


const uri = `mongodb+srv://${admin}:${password}@cluster0.qthbe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, 
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true
});

async function run() {
    try {

        await client.connect();
        console.log('Connected Successfully!!');

        const database = client.db("warehouse");
        const productCollection = database.collection("products");
        const myitemsCollection = database.collection("myitems");
        const feedbackCollection = database.collection("feedback");

        // Product GET API
        app.get("/products", async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            console.log("Sending products to client");
            res.json(products);
        })
        // FeedBack GET API
        app.get("/feedback", async (req, res) => {
            const query = {};
            const cursor = feedbackCollection.find(query);
            const feedback = await cursor.toArray();
            console.log("Sending feedback to client");
            res.json(feedback);
        })

        // GET API for One Product
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const product = await productCollection.findOne(query);
            console.log("Sending One service to client");
            res.json(product);
        })

        // POST API Add new products

        app.post("/products", async (req, res) => {
            const product = req.body;
            // const options = { ordered: true };
            // const result = await productCollection.insertMany(products, options);
            const result = await productCollection.insertOne(product);
            // console.log(result);
            // res.send(result);
            res.send(result);
        });

        // POST API
        app.post("/myitems", async (req, res) => {
            const id = req.body.id;
            const product = {
                product_id : ObjectID(id)
            }
            // const options = { ordered: true };
            // const result = await myitemsCollection.insertMany(products, options);
            const result = await myitemsCollection.insertOne(product);
            console.log(result);
            // res.send(result);
            res.send(result);
        });
        // Get all my items
        app.get("/myitems", async (req, res) => {
            
            const cursor = myitemsCollection.find({});
            const items = await cursor.toArray();
            const productsId = [];
            items.map((item)=>{
                productsId.push(item.product_id)
            });
            const query = {_id : { $in : productsId } } ;
            const productcursor = productCollection.find(query);
            const products = await productcursor.toArray();
            res.json(products);
        })
        // Delete My items
        app.delete("/myitems/:id", async (req, res) => {
            const id = req.params.id;
            const query = { "product_id": ObjectID(id) };
            const result = await myitemsCollection.deleteMany(query);
            if (result.deletedCount > 0) {
                console.log("Delete Successful");
                res.json(result);
            }
            else {
                console.log("Couldn't Delete");
                res.json(result);
            }
        })


        // 
        app.put("/products/:id", async (req, res) => {
                const id = req.params.id;
                const query = { _id: ObjectID(id) };
                let data;
                if(req.body.update){
                    data = {
                        $inc: { stock: parseInt(req.body.update) }
                    }
                }
                const result = await productCollection.updateOne(query,data);
                console.log("Updating Products...");
                if (result.modifiedCount > 0) {
                    console.log("Update Successful");
                    res.json(result);
                }
                else {
                    console.log("Couldn't Update");
                    res.json(result);
                }
                
    
            })


    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Welcome To TV Warehouse");
})


app.listen(port, () => {
    console.log("Listening to port", port);
})