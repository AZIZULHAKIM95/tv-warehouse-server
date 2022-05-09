const express = require("express");
const { MongoClient,ObjectID } = require('mongodb');
require('dotenv').config();
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

// MongoDB Credentials
const admin = process.env.DB_USER;
const password = process.env.DB_PASS;
const uri = `mongodb+srv://${admin}:${password}@cluster0.qthbe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, 
    { 
        useNewUrlParser: true,
        useUnifiedTopology: true
});

// API ENDPOINTS
async function run() {
    try {

        await client.connect();
        console.log('DataBase Connected Successfully!!');

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
        });
        // GET API for One Product
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const product = await productCollection.findOne(query);
            console.log("Sending One service to client");
            res.json(product);
        });

        // FeedBack GET API
        app.get("/feedback", async (req, res) => {
            const query = {};
            const cursor = feedbackCollection.find(query);
            const feedback = await cursor.toArray();
            console.log("Sending feedback to client");
            res.json(feedback);
        })


        // POST API Add new products
        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });
        // DELETE API for Product
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const result = await productCollection.deleteOne({_id:ObjectID(id)});
            res.send(result);
        });

        // POST API to my items
        app.post("/myitems", async (req, res) => {
            const {id,user} = req.body;
            const product = {
                product_id : ObjectID(id),
                user
            }
            const result = await myitemsCollection.insertOne(product);
            res.send(result);
        });

        // Get all my items
        app.get("/myitems/:email", async (req, res) => {
            const productsId = [];
            const email = req.params.email;

            const cursor = myitemsCollection.find({user:email});
            const items = await cursor.toArray();
            
            items.map((item)=>{
                productsId.push(item.product_id)
            });
            const query = {_id : { $in : productsId } } ;
            const productcursor = productCollection.find(query);
            const products = await productcursor.toArray();
            res.json(products);
        })

        // Delete My items
        app.delete("/myitems/:user/:id", async (req, res) => {
            const {id,user} = req.params;
            const query = { "product_id": ObjectID(id),user };

            const result = await myitemsCollection.deleteMany(query);
            
            res.json(result);
          
  
        })


        // UPDATE Stock 
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