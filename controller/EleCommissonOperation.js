const EleCommission = require("../models/ElectionCommisson");
const Candidate = require("../models/Candidate");
const Minner = require("../models/Minner");
const Voter = require("../models/Voter");
const VoterConfirmationNo = require("../models/VoteConfirmNo");
const MinnerBodyValid = require("../models/MinnerBodyForBlockChain.json");
const jwt = require("jsonwebtoken");
const Ajv = require("ajv");

const ajv = new Ajv();

const validate = ajv.compile(MinnerBodyValid);

exports.CreateMinnerInBlockChain = async (req, res) => {
  try {
    if (validate(req.body)) {
      fetch("http://localhost:5000/createMinner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      })
        .then((response) => response.text())
        .then((data) => {
          // console.log("Raw response from server:", data);
          const jsonData = JSON.stringify(data);
          console.log("New Minner added successfully : ", jsonData);
        })
        .catch((error) => {
          throw new Error(
            "EleCommissonOper.js Line No 34 : Error adding new Minner:",
            error
          );
        });
      res.status(200).send("Minner added successfully");
    } else {
      res.status(200).send(validate.errors);
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateElectionCommissioner = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    username,
    email,
    password,
    role,
    OffierID,
    addresses,
    profileimages,
  } = req.body; // Extract the fields you want to update
  try {
    // console.log("id: " + id);
    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (username) updatedFields.username = username;
    if (email) updatedFields.email = email;
    if (password) updatedFields.password = password;
    if (role) updatedFields.role = role;
    if (OffierID) updatedFields.OffierID = OffierID;
    if (addresses) updatedFields.addresses = addresses;
    if (profileimages) updatedFields.profileimages = profileimages;
    const user = await EleCommission.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.CountVoteOfCandidate = async (req, res) => {
  try {
    let candidateID = req.params.id;
    console.log(candidateID);
    if (candidateID) {
      let result = await fetch(
        `http://localhost:5000/CountVote/${candidateID}`
      );
      let data = await result.json();
      console.log("data : " + data);
      // Add the Vote Count To Candidate Database
      await Candidate.findOneAndUpdate(
        { CandidateID: candidateID },
        { $set: { VoteCount: data.count } },
        { new: true }
      );
      console.log("data.count : ", data.count);
      res.status(200).send(data);
    } else {
      res.status(400).send("Candidates does not exist");
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.toString() });
  }
};

// This function generates a unique voter number that will be used
// when the voter gives their vote.
// The voter cannot cast their vote without this number.
// This number will be provided by the Election Officer at the time of voting.

exports.genrateVoterConfirmationNo = async (req, res) => {
  try {
    let voterId = req.params.voterId;
    const existingVoter = await VoterConfirmationNo.findOne({
      VoterID: voterId,
    });
    const FindVoter = await Voter.findOne({
      VoterID: voterId,
    });
    if (FindVoter !== null) {
      console.log("FindVoter : ", FindVoter.VoterID);
    } else {
      console.log("FindVoter Null");
    }
    if (FindVoter === null || voterId === null) {
      res.status(400).send("Voter ID Not found");
    } else if (!existingVoter || voterId !== existingVoter.VoterID) {
      let token = "";
      for (let i = 0; i < voterId.length; i++) {
        token += Math.floor(voterId.codePointAt(i) * Math.random());
      }
      const confirmNo = new VoterConfirmationNo({
        VoterID: voterId,
        VoterConfirmNo: token,
      });
      const resultNo = await confirmNo.save();
      res.status(200).send(resultNo);
    } else {
      res.status(400).send("Voter Code Aleady Exists");
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.toString() });
  }
};

exports.getEleCommission = async (req, res) => {
  try {
    res.status(200).send("Hello World Election Commission!");
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.getAllVoter = async (req, res) => {
  try {
    console.log("req.query : ", req.query);
    let query = {};

    // Filter by Constituency
    if (req.query.constituency) {
      query.Constituency = req.query.constituency;
    }

    // Filter by Role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Pagination
    const pageSize = req.query._limit ? parseInt(req.query._limit) : 10;
    const page = req.query._page ? parseInt(req.query._page) : 1;
    const skip = pageSize * (page - 1);

    const voters = await Voter.find(
      query,
      "name username email role VoterID Constituency addresses"
    )
      .skip(skip)
      .limit(pageSize);

    res.status(200).json(voters);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.getAllCandidate = async (req, res) => {
  try {
    // Pagination parameters
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    // Constituency filter
    const constituencyFilter = req.query.constituency
      ? { Constituency: req.query.constituency }
      : {};

    // Role filter
    const roleFilter = req.query.role ? { role: req.query.role } : {};

    // Party filter
    const partyFilter = req.query.party ? { Party: req.query.party } : {};

    // Combine filters
    const filters = { ...constituencyFilter, ...roleFilter, ...partyFilter };

    // Query candidates with pagination and filters
    const candidates = await Candidate.find(filters)
      .select(
        "name username email role CandidateID Constituency Party addresses"
      )
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json(candidates);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.getAllMinner = async (req, res) => {
  try {
    // Pagination parameters
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    // Role filter
    const roleFilter = req.query.role ? { role: req.query.role } : {};

    // Combine filters
    const filters = { ...roleFilter };

    // Query minners with pagination and filters
    const minners = await Minner.find(filters)
      .select("name username email role MinnerID")
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json(minners);
  } catch (err) {
    res.status(400).json(err);
  }
};

//////////Work In Progress
exports.updateVoterRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Extract the fields you want to update
  try {
    console.log("id: " + id);
    console.log("role: " + role);
    const updatedFields = {};
    if (role) updatedFields.role = role;
    const user = await Voter.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });
    let newRole = user.role;
    res.status(200).send(`Updated Successfully, The New Roll : ${newRole}`);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateCandidateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Extract the fields you want to update
  try {
    console.log("id: " + id);
    const updatedFields = {};
    if (role) updatedFields.role = role;
    const user = await Candidate.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateMinnerRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // Extract the fields you want to update
  try {
    console.log("id: " + id);
    const updatedFields = {};
    if (role) updatedFields.role = role;
    const user = await Minner.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteMinner = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Minner.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteCandidate = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Candidate.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteVoter = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Voter.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};
