const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 5000;
require('dotenv').config()

const app = express();
app.use(cors());
app.use(bodyParser.json());


// for token authorizartion
const admin = require("firebase-admin");
const serviceAccount = require("./configs/react-burj-al-arab-website-firebase-adminsdk.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  
}); 


// for mongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.efdix.mongodb.net/burjAlArab?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    if (err) {
        console.log("Error -->", err);
        return;
    }
    console.log("connected successfully");
    const bookings = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;

        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })

        console.log(newBooking);
    });

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;

                    if(tokenEmail === queryEmail){
                        bookings.find({ email: queryEmail })
                        .toArray((err, documents) => {
                            // status is optional
                            res.status(200).send(documents);
                        })
                    }
                    else 
                        res.status(401).send('un-authorized access');
                })
                .catch((error) => {
                    // Handle error
                });
        }
        else {
            // status code will be visible in browser console
            // status is optional
            res.status(401).send('Un-authorized access');
        }
    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})