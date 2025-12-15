require("dotenv").config();

const connectDB = require("./config/db");
const Road = require("./src/models/road");
const aStar = require("./src/utils/aStar");

async function run() {
  await connectDB();

  const roads = await Road.find();

  if (roads.length === 0) {
    console.log("❌ No roads found in database");
    process.exit();
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

  console.log("Graph:", graph);
  console.log("Coords:", coords);

  const start = "A";
  const goal = "B";

  const path = aStar(graph, start, goal, coords);

  console.log("✅ Shortest Path:", path);

  process.exit();
}

run();
