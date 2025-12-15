const express = require("express");
const router = express.Router();

const Road = require("../models/road");
const aStar = require("../utils/aStar");

router.get("/", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: "start and end query parameters are required"
      });
    }

    const roads = await Road.find();

    if (roads.length === 0) {
      return res.status(404).json({ error: "No roads in database" });
    }

    const graph = {};
    const coords = {};

    roads.forEach(r => {
      if (!graph[r.from]) graph[r.from] = [];
      if (!graph[r.to]) graph[r.to] = [];

      graph[r.from].push({ node: r.to, distance: r.distance });
      graph[r.to].push({ node: r.from, distance: r.distance });

      coords[r.from] = { lat: r.fromLat, lng: r.fromLng };
      coords[r.to] = { lat: r.toLat, lng: r.toLng };
    });

    const path = aStar(graph, start, end, coords);

    if (!path) {
      return res.status(404).json({ error: "No path found" });
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph[path[i]].find(
        e => e.node === path[i + 1]
      );
      totalDistance += edge.distance;
    }

    res.json({
      path,
      distance: totalDistance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
