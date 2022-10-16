/* BEGIN db initialization */
const { Op } = require("sequelize");
const Sequelize = require("../db.connection");
const User = require("../models/user.model")(Sequelize.connection, Sequelize.library);
const session = require('./session');

/* END db initialization */

// Create
exports.create = (req, res) => {

    // Validate request
    if (!req.body.fullname || !req.body.email || !req.body.phone) {
        res.status(400).send({
            message: "User must have name, email and phone!"
        });
        return;
    }

    // An object representing your data in the db
    const obj = {
        fullname: req.body.fullname,
        email: req.body.email,
        phone: req.body.phone
    };

    // Save in the database
    User.create(obj)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the record."
            });
        });

};

// Get all records with a certain email (sent from the front-end)
exports.findByEmail = async (req, res) => {
    const email = req.body.Email;
    console.log(email);
    var condition = email ? { email: { [Op.eq]: email } } : null;

    var result;
    await User.findOne({ where: condition })
    .then(data => {
        result = data
    })
    .catch(data => {
        result = data
    })
    return result
};

// Get username from a certain Id
exports.findUsernamebyId = async (idPerson) => {
    const id = idPerson;
    var condition =  {where: {Id_Person: {[Op.like]: id}}};

    var result;
    await User.findOne(condition)
    .then(data => {
        result = data
    })
    .catch(data => {
        result = data
    })
    return result
};

// Create JSON for a score associated with it's username
exports.createScoreUsername = async (id, score, moment, list) => {
    let user = await this.findUsernamebyId(id);
    score_item= {
        Score: score,
        Moment: moment,
        Username: user.Username
    }
    list.push(score_item);
    return list;
};

// Send Personal info from Id_Person to Frontend
exports.findPersonalInfo = (req, res) => {
    session.findByToken(req.get("authorization")).then((session)=>{
        if(session){
            this.findUsernamebyId(session.Id_Person)
            .then((user)=>{
            personalInfo = {
                Username: user.Username,
                Email: user.Email,
            }
            res.send(personalInfo);
        })
        }
        
    })
}


// Get all records with a certain name (sent from the front-end)
exports.findAll = (req, res) => {
    User.findAll()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving records."
            });
        });
};

// Get a record with a certain id (sent from the front-end)
exports.findOne = (req, res) => {
    const id = req.params.id;

    User.findByPk(id)
        .then(data => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Cannot find record with id=${id}.`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error retrieving record with id=" + id
            });
        });
};

// Update a record with a certain id
exports.update = (req, res) => {
    const id = req.params.id;

    User.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Record was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update record with id=${id}. Maybe record was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating record with id=" + id
            });
        });
};

// Delete a record with a certain id
exports.delete = (req, res) => {
    const id = req.params.id;

    User.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "Record was deleted successfully!"
                });
            } else {
                res.send({
                    message: `Cannot delete record with id=${id}. Maybe record was not found!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete record with id=" + id
            });
        });
};

// Delete all records in the table (use with caution)
exports.deleteAll = (req, res) => {
    User.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} records were deleted successfully!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while removing all records."
            });
        });
};