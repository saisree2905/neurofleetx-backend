function heuristic(a, b) {
  if (!a || !b) return 0;
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

function aStar(graph, start, goal, coords) {
  if (!graph[start] || !graph[goal]) {
    throw new Error("Start or Goal node not found in graph");
  }

  const openSet = new Set([start]);
  const cameFrom = {};

  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach(node => {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  });

  gScore[start] = 0;
  fScore[start] = heuristic(coords[start], coords[goal]);

  while (openSet.size > 0) {
    let current = [...openSet].reduce((a, b) =>
      fScore[a] < fScore[b] ? a : b
    );

    if (current === goal) {
      const path = [];
      while (current) {
        path.unshift(current);
        current = cameFrom[current];
      }
      return path;
    }

    openSet.delete(current);

    for (let neighbor of graph[current]) {
      const tempG = gScore[current] + neighbor.distance;

      if (tempG < gScore[neighbor.node]) {
        cameFrom[neighbor.node] = current;
        gScore[neighbor.node] = tempG;
        fScore[neighbor.node] =
          tempG + heuristic(coords[neighbor.node], coords[goal]);
        openSet.add(neighbor.node);
      }
    }
  }

  return null;
}

module.exports = aStar;
