var express = require('express');
var router = express.Router();
var mysql = require('mysql2/promise');

let db;

(async () => {
  try {
    // Connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Insert data if table is empty
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (rows[0].count === 0) {
      await db.execute(`
                -- Users
                INSERT INTO Users(username, email, password_hash, role)
                VALUES
                ("alice123", "alice@example.com", "hashed123", "owner"),
                ("bobwalker", "bob@example.com", "hashed456", "walker"),
                ("carol123", "carol@example.com", "hashed789", "owner"),
                ("randallxkcd", "randall@xkcd.com", "correcthorsebatterystaple", "owner"),
                ("malfoywalker", "malfoy@hogwarts.com", "hashedhunter2", "walker"),
                ("newwalker", "new@walker.com", "password123", "walker");

                -- dogs
                INSERT INTO Dogs(name, size, owner_id)
                Values
                ("Max", "medium", (SELECT user_id FROM Users WHERE username="alice123")),
                ("Bella", "small", (SELECT user_id FROM Users WHERE username="carol123")),
                ("Blaze", "medium", (SELECT user_id FROM Users WHERE username="randallxkcd")),
                ("Alex", "large", (SELECT user_id FROM Users WHERE username="carol123")),
                ("Teena", "medium", (SELECT user_id FROM Users WHERE username="alice123"));

                -- Requests
                INSERT INTO WalkRequests(dog_id, requested_time, duration_minutes, location, status)
                VALUES
                ((SELECT dog_id FROM Dogs WHERE name="Max"), '2025-06-10 08:00:00', 30, "Parklands", "open"),
                ((SELECT dog_id FROM Dogs WHERE name="Bella"), '2025-06-10 09:30:00', 45, "Beachside Ave", "accepted"),
                ((SELECT dog_id FROM Dogs WHERE name="Blaze"), '2025-06-21 10:30:00', 300, "Adelaide Parklands", "cancelled"),
                ((SELECT dog_id FROM Dogs WHERE name="Teena"), '2025-07-21 21:30:00', 15, "Unley", "open"),
                ((SELECT dog_id FROM Dogs WHERE name="Bella"), '2024-06-24 15:30:00', 15, "Modburry", "completed"),
                ((SELECT dog_id FROM Dogs WHERE name="Max"), '2024-06-24 15:30:00', 15, "Modburry", "completed"),
                ((SELECT dog_id FROM Dogs WHERE name="Max"), '2024-06-24 17:30:00', 15, "Modburry", "completed"),
                ((SELECT dog_id FROM Dogs WHERE name="Blaze"), '2024-06-24 15:30:00', 15, "Modburry", "completed"),
                ((SELECT dog_id FROM Dogs WHERE name="Alex"), '2024-06-24 15:30:00', 15, "Modburry", "completed"),
                ((SELECT dog_id FROM Dogs WHERE name="Max"), '2024-06-25 15:30:00', 15, "Modburry", "completed");



                -- Ratings
                INSERT INTO WalkRatings(request_id, walker_id, owner_id, rating, comments)
                VALUES
                (5, (SELECT user_id FROM Users WHERE username="bobwalker"), (SELECT user_id FROM Users WHERE username="carol123"), 5, "Great walk!"),
                (7, (SELECT user_id FROM Users WHERE username="bobwalker"), (SELECT user_id FROM Users WHERE username="alice123"), 3, "Was late and didn't follow instructions."),
                (10, (SELECT user_id FROM Users WHERE username="bobwalker"), (SELECT user_id FROM Users WHERE username="alice123"), 5, "Much better than last time."),
                (8, (SELECT user_id FROM Users WHERE username="malfoywalker"), (SELECT user_id FROM Users WHERE username="randallxkcd"), 3, "Average walk, not very engaging."),
                (9, (SELECT user_id FROM Users WHERE username="malfoywalker"), (SELECT user_id FROM Users WHERE username="carol123"), 2, "Injured my dog because it supposedly looked like a Weasly.");
                `);
    }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT Dogs.name AS dog_name, Dogs.size, Users.username AS owner_username
      FROM Dogs
      INNER JOIN Users
      ON Dogs.owner_id=Users.user_id;`);

    res.json(rows);

  } catch (err) {
    console.error('Error fetching dogs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT WalkRequests.request_id, Dogs.name AS dog_name, WalkRequests.requested_time, WalkRequests.duration_minutes, WalkRequests.location, Users.username AS owner_username
      FROM WalkRequests
      INNER JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
      INNER JOIN Users ON Dogs.owner_id = Users.user_id
      WHERE WalkRequests.status = 'open';
      `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching open walk requests:', err);
    res.sendStatus(500);
  }
});

router.get('/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT Users.username AS walker_username,
      COUNT(WalkRatings.rating_id) AS total_ratings,
      ROUND(AVG(WalkRatings.rating),1) AS average_rating,
      COUNT(
    (SELECT WalkRequests.request_id
      FROM WalkRequests
      WHERE WalkRequests.status = 'completed))
      ) AS completed_walks
      From Users
      LEFT JOIN WalkRatings ON Users.user_id = WalkRatings.walker_id
      LEFT JOIN WalkRequests ON WalkRatings.request_id = WalkRequests.request_id
      WHERE Users.role = 'walker'
      GROUP BY Users.username;
      `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching walker summary:', err);
    res.sendStatus(500);
  }
});

/*
{
    "walker_username": "bobwalker",
    "total_ratings": 2,
    "average_rating": 4.5,
    "completed_walks": 2
  },
*/

module.exports = router;
