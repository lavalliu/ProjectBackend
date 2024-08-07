require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const bcrypt = require('bcryptjs');
const User = require('./models/users'); 
const Item = require('./models/items'); 
const Resa = require('./models/reservations'); 
const Review = require('./models/reviews');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const mongoURI = "mongodb+srv://admin:hackathon123@cluster0.8o9apqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log('process.env.BACKEND_URL');
// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  dbName: 'finalproject'
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
  
// Register CORS plugin
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Enable the body parser plugin
fastify.register(require('@fastify/formbody'));

// Create a transporter object with the SMTP configuration
const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
            user: 'generic_service@hotmail.com',
            pass: 'Hotmailtest'
      },
      tls: {
            ciphers: 'SSLv3'
      }
});

fastify.post('/send-email', async (request, reply) => {
        const { to, subject, text, userId, email, username, newpassword } = request.body;
        try {
              const hashedPassword = await bcrypt.hash(newpassword, 10);
              // Update the user's password in the database
              const user = await User.findOne({ username: username });
              await User.findByIdAndUpdate(user._id, { password: hashedPassword });
              // Send an email with the new password
              const info = await transporter.sendMail({
                    from: '"Restaurant Royal Email Service" <generic_service@hotmail.com>', 
                    to: email, 
                    subject: "RESTAURANT ROYAL : Password Reset request", 
                    text: `Dear Customer,\n\nYour password has been reset to ${newpassword}\n\nBest Regards,\nThe Management`
              });
              reply.type('application/json').code(200).send({ message: 'Email sent successfully with new Password', info });
        } catch (error) {
              console.error('Error sending email:', error);
              reply.type('application/json').code(500).send({ message: 'Error sending email', error: error.message });
        }
  });

// Unified route to create a single item or multiple items
fastify.post('/items/create', async (request, reply) => {
      const items = Array.isArray(request.body) ? request.body : [request.body];
      try {
            const createdItems = [];
            for (const itemData of items) {
                  const newItem = new Item(itemData);
                  await newItem.save();
                  createdItems.push(newItem)
            }
            if (createdItems.length === 1) {
                  reply.code(201).send({ message: 'Item created', item: createdItems[0] });
            } else {
                  reply.code(201).send({ message: 'Items created successfully', items: createdItems });
            }
      } catch (error) {
            console.error(error);
            reply.code(500).send({ message: 'An error occurred while creating items', error: error.message });
      }
});

// Register route for user
fastify.post('/users/register', async (req, reply) => {
      const { username, password, fname, lname, email, phoneno } = req.body;
      try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                  username,
                  password: hashedPassword,
                  lname,
                  fname,
                  email,
                  phoneno,
                  role: 'client'
            });
            const newUser = await user.save();
            reply.code(201).send({ message: 'User registered', user: newUser });
      } catch (error) {
            if (error.code === 11000) {
                  reply.code(400).send({ message: 'User already exists' });
            } else {
                  reply.code(500).send({ message: 'Error registering user', error: error.message });
            }
      }
});

// Create Table route
fastify.post('/table/create', async (req, reply) => {
      try {
          const tableRecord = { tables: 50 };
          const result = await mongoose.connection.collection('tables').insertOne(tableRecord);
          return reply.code(200).send({ message: 'Table record inserted successfully', result: result });
      } catch (error) {
          return reply.code(500).send({ message: 'Error inserting table record', error: error.message });
      }
});

// Create Reservation route
fastify.post('/reservation/create', async (req, reply) => {
      const { username, email, fname, lname, date, time, pax, phoneno, other, takeout, status, orders } = req.body;
      try {
            const resa = new Resa({
                  username,
                  email,
                  pax,
                  fname,
                  lname,
                  date,
                  time,
                  phoneno,
                  other,
                  takeout,
                  status,
                  orders
            });
            const newResa = await resa.save();
            reply.code(201).send({ message: 'Reservation created', resa: newResa });
      } catch (error) {
            if (error.code === 11000) {
                  reply.code(400).send({ message: 'Reservation for that date and time already exists' });
            } else {
                  reply.code(500).send({ message: 'Error creating reservation', error: error.message });
            }
      }
});

//route to get a reservation as per guestname
fastify.get('/reservations/:username', async (req, reply) => {
  try {
          const userName = req.params.username;
          const resa = await Resa.findOne({ username: userName });
      if (resa) {
          reply.send({ success: true, customer: {
            username: resa.username,
            email: resa.email,
            fname: resa.fname,
            lname: resa.lname,
            phoneno: resa.phoneno,
            other: resa.other,
            date: resa.date,
            time: resa.time,
            pax: resa.pax,
            status : resa.status,
            takeout: resa.takeout,
            orders: resa.orders
          }
          });
      } else {
          reply.code(404).send({ success: false, message: `Reservation of ${guestName} not found` });
      }
      } catch (err) {
          reply.code(500).send({ success: false, message: err.message });
      }
});

//route to get all reservations as per guestname
fastify.get('/reservations/user/:username', async (req, reply) => {
      const userName = req.params.username;
      try {
          const resa = await Resa.find({ username: userName });
          reply.send({ resa });
      } catch (error) {
          reply.code(500).send({ message: `Error fetching reservations for user ${username}` });
      }
});

// Route to update a reservation by guestname
fastify.put('/reservations/updateResa', async (req, reply) => {
      const { guestname, date, time, pax, email, takeout, phoneno, status, other, orders } = req.body;
      try {
              const reservation = await Resa.findOne({ guestname: guestname });
              if (!reservation) {
                  return reply.code(404).send({ message: 'No reservations found for this name' });
              }
                  const updatedReservation = await Resa.findOneAndUpdate(
                        { guestname: guestname },
                        { $set: { email: email, phoneno: phoneno, takeout: takeout, other: other, date: date, time: time, pax: pax, status: status, orders: orders } },
                        { new: true } 
                  );
              return reply.code(200).send({ message: 'Reservation updated successfully', guestname: updatedReservation });
          } catch (error) {
              return reply.code(500).send({ message: 'Error updating Reservation', error: error.message });
          }
});  


// Route to update a reservation by ReservationId
fastify.put('/reservations/:reservationId', async (req, reply) => {
  const { username, date, time, pax, email, takeout, phoneno, status, other, orders } = req.body;
  const resId = req.params.reservationId;
  try {
          const reservation = await Resa.findOne({ _id: resId });
          if (!reservation) {
              return reply.code(404).send({ message: 'No reservations found for this Id' });
          }
          const updatedReservation = await Resa.findOneAndUpdate(
                { _id: resId },
                { $set: { username, email, phoneno, takeout, other, date, time, pax, status, orders } },
                { new: true } 
          );
          return reply.code(200).send({ message: 'Reservation updated successfully', updatedReservation });
      } catch (error) {
          return reply.code(500).send({ message: 'Error updating Reservation', error: error.message });
      }
});  

// Route to update a reservation STATUS ONLY by ReservationId
fastify.patch('/reservationstatus/:id', async (request, reply) => {
  try {
  const reservationId = request.params.id;
  const updateData = request.body;
  
  const updatedReservation = await Resa.findByIdAndUpdate(reservationId, updateData, { new: true });
  
  if (!updatedReservation) {
  return reply.status(404).send({ message: 'Reservation not found' });
  }
  
  reply.send(updatedReservation);
  } catch (error) {
  console.error('Error updating reservation:', error);
  reply.status(500).send({ message: 'Error updating reservation', error });
  }
  });

// Route to get all Reservations
fastify.get('/reservations', async (request, reply) => {
    try {
          const resas = await Resa.find({});
          reply.send({ resas });
      } catch (error) {
          reply.code(500).send({ message: 'Error fetching reservations' });
      }
});

// Route to get a specific item by itemno
fastify.get('/items/:itemno', async (req, reply) => {
  try {
          const itemNo = req.params.itemno;
          const item = await Item.findOne({ itemno: itemNo });
      if (item) {
          reply.send({ success: true, customer: {
            _id: item._id, 
            itemno: item.itemno,
            itemname: item.itemname,
            group: item.group,
            description: item.description,
            price: item.price
          }
          });
      } else {
          reply.code(404).send({ success: false, message: 'Item not found' });
      }
      } catch (err) {
          reply.code(500).send({ success: false, message: err.message });
      }
  });
  
// Route to update 1 menu Item by item no
fastify.put('/items/updateItem', async (req, reply) => {
  const { itemno, itemname, group, description, price } = req.body;
  try {
        const item = await Item.findOne({ itemno: itemno });
        if (!item) {
            return reply.code(404).send({ message: 'Menu Item does not exist' });
        }
        const updatedItem = await Item.findOneAndUpdate(
          { itemno: itemno },
          { $set: { itemname: itemname, group: group, description: description, price: price } },
          { new: true } 
        );
      return reply.code(200).send({ message: 'Menu Item updated successfully', item: updatedItem });
      } catch (error) {
          return reply.code(500).send({ message: 'Error updating Menu Item', error: error.message });
      }
});  

//Route to update all the items
fastify.put('/items/updateItems', async (req, reply) => {
  const itemsToUpdate = req.body.items; // Expecting an array of items
  try {
      const updatePromises = itemsToUpdate.map(item => {
      const { itemno, itemname, group, description, status, price } = item;
      return Item.findOneAndUpdate(
          { itemno: itemno },
          { $set: { itemname: itemname, group: group, description: description, price: price, status: status } },
          { new: true }
      );
      });
      const updatedItems = await Promise.all(updatePromises);
      // Filter out any null responses (in case some items weren't found)
      const successfulUpdates = updatedItems.filter(item => item !== null);
      if(successfulUpdates.length === itemsToUpdate.length) {
          return reply.code(200).send({ message: 'All menu items updated successfully', items: successfulUpdates });
      } else {
          return reply.code(207).send({ message: 'Some menu items were not updated', items: successfulUpdates });
      }
  } catch (error) {
      return reply.code(500).send({ message: 'Error updating menu items', error: error.message });
  }
});

// Route to get all Menu Items
fastify.get('/items', async (request, reply) => {
  try {
      const items = await Item.find({});
      reply.send({ items });
    } catch (error) {
      reply.code(500).send({ message: 'Error fetching items' });
    }
});

// Route to get all Menu Items from a specific group
fastify.get('/items/group/:groupName', async (request, reply) => {
  const groupName = request.params.groupName;
  try {
      const items = await Item.find({ group: groupName });
      reply.send({ items });
  } catch (error) {
      reply.code(500).send({ message: `Error fetching items for group ${groupName}` });
  }
});

// Route for user login
fastify.post('/users/login', async (req, reply) => {
  const { username, password } = req.body;
  try {
      const user = await User.findOne({ username: username });
    if (!user) {
      return reply.code(404).send({ message: 'User does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(password + user.password);
    if (!isMatch) {
      return reply.code(401).send({ message: 'Password is incorrect' });
    }
      return reply.code(200).send({ message: 'Successful login', user: user });
    } catch (error) {
      return reply.code(500).send({ message: 'Error logging in', error: error.message });
    }
});

// Route to update user
fastify.put('/users/updateProfile', async (req, reply) => {
      const { username, password, fname, lname, email, phoneno } = req.body;
      try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.findOne({ username: username });
            if (!user) {
                return reply.code(404).send({ message: 'User does not exist' });
            }
            const updatedUser = await User.findOneAndUpdate(
              { username: username },
              { $set: { email: email, password: hashedPassword, fname: fname, lname: lname, phoneno: phoneno } },
              { new: true }
            );
          return reply.code(200).send({ message: 'Profile updated successfully', user: updatedUser });
          } catch (error) {
              return reply.code(500).send({ message: 'Error updating profile', error: error.message });
          }
});  

// Route to get all users
fastify.get('/users', async (request, reply) => {
  try {
      const users = await User.find({});
      reply.send({ users });
    } catch (error) {
      reply.code(500).send({ message: 'Error fetching users' });
    }
});

// Route to get a specific user by username
fastify.get('/users/:username', async (req, reply) => {
  try {
          const userName = req.params.username;
          const user = await User.findOne({ username: userName });
      if (user) {
          reply.send({ success: true, customer: {
            _id: user._id, 
            username: user.username,
            email: user.email,
            fname: user.fname,
            lname: user.lname,
            phoneno: user.phoneno,
            role: user.role
          }
          });
      } else {
          reply.code(404).send({ success: false, message: 'Username not found' });
      }
      } catch (err) {
          reply.code(500).send({ success: false, message: err.message });
      }
});

// Route to get email address
fastify.get('/usermail/:username', async (req, reply) => {
  try {
          const userName = req.params.username;
          const user = await User.findOne({ username: userName });
      if (user) {
          reply.send({ success: true, customer: {
            _id: user._id, 
            username: user.username,
            email: user.email
          }
          });
      } else {
          reply.code(404).send({ success: false, message: 'Username not found' });
      }
      } catch (err) {
          reply.code(500).send({ success: false, message: err.message });
      }
});

// Route to add customer reviews
fastify.post('/review/create', async (req, reply) => {
  const { username, date, rating, review, takeout } = req.body;
  try {
    const reviews = new Review({
          username,
          date,
          rating,
          review,
          takeout
    });
    const newReview = await reviews.save();
    reply.code(201).send({ message: 'Review created sucessfully', reviews: newReview });
} catch (error) {
    if (error.code === 11000) {
          reply.code(400).send({ message: 'Your review for that date already exists' });
    } else {
          reply.code(500).send({ message: 'Error creating review', error: error.message });
    }
}
});  

const PORT = process.env.PORT || 3000; // Fallback to 3000 if PORT is not set
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
if (err) throw err;
fastify.log.info(`server listening on ${address}`);
});