function heuristic(a, b) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

function astar(graph, start, end, coords) {
  const openSet = new Set([start]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach(node => {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(coords[start], coords[end]);

  while (openSet.size > 0) {
    let current = null;
    let lowest = Infinity;

    for (let node of openSet) {
      if (fScore[node] < lowest) {
        lowest = fScore[node];
        current = node;
      }
    }

    if (current === end) {
      const path = [];
      let temp = current;
      let distance = gScore[current];

      while (temp) {
        path.unshift(temp);
        temp = cameFrom[temp];
      }

      return { path, distance };
    }

    openSet.delete(current);

    for (let neighbor of graph[current]) {
      const tentativeG = gScore[current] + neighbor.distance;

      if (tentativeG < gScore[neighbor.node]) {
        cameFrom[neighbor.node] = current;
        gScore[neighbor.node] = tentativeG;
        fScore[neighbor.node] =
          tentativeG + heuristic(coords[neighbor.node], coords[end]);

        openSet.add(neighbor.node);
      }
    }
  }

  return null;
}

module.exports = astar;
