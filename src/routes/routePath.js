console.log("SERVER FILE LOADED");

const express = require("express");
const router = express.Router();
const Road = require("../models/road");
// eslint-disable-next-line no-unused-vars
const astar = require("../utils/astar");

console.log("astar loaded:", astar);

router.get("/test", (req, res) => {
  res.send("RoutePath OK");
});

router.get("/shortest-path", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "start and end required" });
    }

    const roads = await Road.find();

    const graph = {};
    const coords = {};

    roads.forEach(r => {
      graph[r.from] = graph[r.from] || [];
      graph[r.to] = graph[r.to] || [];

      graph[r.from].push({ node: r.to, distance: r.distance });
      graph[r.to].push({ node: r.from, distance: r.distance });

      coords[r.from] = { lat: r.fromLat, lng: r.fromLng };
      coords[r.to] = { lat: r.toLat, lng: r.toLng };
    });

    const result = astar(graph, start, end, coords);

    if (!result) {
      return res.status(404).json({ error: "No path found" });
    }

    res.json({
      algorithm: "A*",
      path: result.path,
      totalDistance: result.distance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports=router;


/*src/routes/routePath.js (Temporary)
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('ROUTE API ROOT IS REACHED');
});

router.get('/test', (req, res) => {
    res.send('routepath ok - FINAL TEST');
});

// COMMENT OUT OR DELETE ALL OTHER CODE (like shortestpath, astar imports, etc.)

module.exports = router;*/