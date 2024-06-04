const User = require('../models/users');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

exports.login = async (req, res) => {
const username = req.body.username;
const password = req.body.password;

// Verify username and password
const user = await User.findOne({ username: username });
if (user) {
const match = await bcrypt.compare(password, user.password);
if (match) {
// Update the token
const tokenData = user.password + Date.now();
const token = await bcrypt.hash(tokenData, saltRounds);
await User.findOneAndUpdate({ username: username }, { token: token });
user.token = token;
res.status(200).json({ message: 'User logged in', user: user });
} else {
res.status(401).json({ message: 'Incorrect password' });
}
} else {
res.status(404).json({ message: 'User not found' });
}
};

exports.register = async (req, res) => {
const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
const tokenData = req.body.password + Date.now();
const token = await bcrypt.hash(tokenData, saltRounds);

const data = {
username: req.body.username,
password: hashedPassword,
token: token
};
const newUser = new User(data);
await newUser.save();
res.status(201).json({ message: 'User registered', user: newUser });
};