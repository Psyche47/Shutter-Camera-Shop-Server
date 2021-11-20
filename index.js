const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8ub5n.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("shutter");
    const productCollection = database.collection("allProducts");
    const ordersCollection = database.collection("bookings");
    const usersCollection = database.collection("users");
    const reviewsCollection = database.collection("reviews");

    // GET API
    app.get("/allProducts", async (req, res) => {
      const cursor = productCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    // POST API
    app.post("/addProducts", async (req, res) => {
      const service = req.body;
      const result = await productCollection.insertOne(service);
      res.json(result);
    });

    //POST REVIEW API
    app.post("/addReview", async (req, res) => {
      const service = req.body;
      const result = await reviewsCollection.insertOne(service);
      res.json(result);
    });

    // ADD A USER
    app.post("/users", async (req, res) => {
      const result = await usersCollection.insertOne(req.body);
      res.json(result);
    });

    // Check User
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    //Add user as Admin
    app.put("/addAdmin", async (req, res) => {
      const email = req.body.email;
      const result = await usersCollection.updateOne(
        { email },
        {
          $set: { role: "admin" },
        }
      );
      res.json(result);
    });

    // SINGLE PRODUCT
    app.get("/singleProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await productCollection.findOne(query);
      res.json(service);
    });

    // CONFIRM BOOKING
    app.post("/confirmedOrders", async (req, res) => {
      const booking = req.body;
      const result = await ordersCollection.insertOne(booking);
      res.json(result);
    });

    // MY BOOKINGS
    app.get("/myOrders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    // GET ALL BOOKINGS
    app.get("/myOrders", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray();
      res.send(result);
    });

    // DELETE BOOKINGS
    app.delete("/deleteOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });

    // DELETE SERVICE
    app.delete("/deleteProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json(result);
    });

    // UPDATE STATUS
    app.put("/updateOrderStatus/:id", (req, res) => {
      const id = req.params.id;
      const updatedStatus = req.body.status;
      const filter = { _id: ObjectId(id) };
      ordersCollection
        .updateOne(filter, { $set: { status: updatedStatus } })
        .then((result) => res.send(result));
    });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Shutter server is running.");
});

app.listen(port, () => {
  console.log("Shutter server is running on port: ", port);
});
