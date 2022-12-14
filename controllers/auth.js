var nodemailer = require('nodemailer');
const Sequelize = require("../db.connection");
const Crypto = require("crypto");

const users = require("./users");
const sessions = require("./session");
const { Op } = require("sequelize");

const Person = require('../models/user.model')(Sequelize.connection, Sequelize.library);
const Session = require('../models/session.model')(Sequelize.connection, Sequelize.library);

/* Login user if user is in the database */
exports.login = async (req, res) => {
    let user = await users.findByEmail(req, res)
    
    // if the user exists and password matches
    if (user && user.Id_Person && user.Password == Crypto.createHash('sha256').update(req.body.Password).digest('hex')) {

        // search for a session for this user
        let session = await sessions.findByUserId(user.Id_Person)
        // if there is a session, check if it's expired
        let isTokenExpired = session ? (new Date(session.validUntil) - new Date() <= 0) : true
        var token = ""

        // if the session exists and is not expired, go on
        // else, create a session
        if (session && !isTokenExpired) {
            console.log("use existing")
            token = session.token   
        } else {
            console.log("create new")
            session = await sessions.create(user.Id_Person)
            if (session) {
                token = session.token
            }
        }
        res.send(JSON.stringify({ token: token }))
    } else {
        res.status(403).send("Access denied")
    }
}

/* Verify if the token is still valid */
exports.isLoggedIn = async (req, res) => {
    var token = req.get("Authorization")
    console.log(token)
    if (token) {
        let session = await sessions.findByToken(token)
        if (session) {
            let isTokenExpired = (new Date(session.validUntil) - new Date()) <= 0
            console.log(session.validUntil, isTokenExpired)
            if (session && !isTokenExpired) {
                console.log("all good!")
                return true
            }
            console.log("token expired!")
            return false
        }
        console.log("no session!")
        return false
    }
    console.log("no token!")
    return false
}

/* Register a new user to the database with data given from front-end */
exports.register = async(req, res) => {
    // Create a new User
    const user = {
        Username: req.body.Username,
        Email: req.body.Email,
        Password: Crypto.createHash('sha256').update(req.body.Password).digest('hex'),
    };

    //Verify if user is in the database, send Already created if true
    let verify_user = await users.findByEmail(req, res);
    if(verify_user){
        res.status(401);
        res.send({response: "Account already created"});
        return;
    }

    //Create a new user and send it to database, alse send a confirmation email
    Person.create(user)
        .then(data =>{
            sendConfirmationMail(req, res);
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while sending the Score."
            });
        });

}

/* Disconnect by deleting the token */
exports.disconnect = async (req, res) => {
    //Delete expired token in the database to to clean it
    sessions.deleteExpiredToken();

    //Delete the current token used by the user
    sessions.findByToken(req.get("authorization")).then((session)=>{
        if(session){
            // Delete session
            sessions.delete(session.id);
            res.status(205);
            res.send();
        }
    })
}

/* Send mail to email given */
function sendConfirmationMail(req, res){
    //Create reusable transporter 
    let transporter = nodemailer.createTransport({
        service: "gmail",
        secure:true,
        auth: {
            user: "wordpanic@gmail.com",
            pass: "diykfziehqyeibio"
        }
    });
    // Message object
    let message = {
    from: 'wordpanic@gmail.com',
    to: req.body.Email,
    subject: 'Confirmation of Account creation',
    text: 'Hi ' + req.body.Username +",",
    html:'Hi '+ req.body.Username + ',' + '<br><p>Thanks again for creating an account on WordPanic.</p> <p>Follow this link to begin your WordPanic adventure! :</p> <p>http://lefthanging-frontend.s3-website.us-east-2.amazonaws.com/</p>'
    };

    // send mail with defined transport object
    transporter.sendMail(message, function(err, success){
    if(err){
        console.log(err);
    }
    else{
        console.log("Email Sent!")
    }
    })
}
