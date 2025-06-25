
export interface BrainNode {
  id: string;
  title: string;
  author: string;
  tags: string[];
  transmissionId?: number;
  x?: number;
  y?: number;
  z?: number;
  coverUrl?: string;
  description?: string;
  neighbors: any[];
  links: any[];
  name: string;
  group: string;
}

export interface BookLink {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  strength: number;
  sharedTags: string[];
  connectionReason?: string;
  source: any;
  target: any;
}

// Sample brain data for visualization
export const gData = {
  nodes: [
    {
      id: "1",
      title: "Dune",
      author: "Frank Herbert",
      name: "Dune",
      description: "A science fiction epic about power, politics, and ecology on the desert planet Arrakis",
      group: "Science Fiction",
      tags: ["science fiction", "politics", "ecology"],
      neighbors: [],
      links: [],
      x: 0,
      y: 0,
      z: 0
    },
    {
      id: "2", 
      title: "Foundation",
      author: "Isaac Asimov",
      name: "Foundation",
      description: "The story of a galactic empire's decline and the Foundation created to preserve knowledge",
      group: "Science Fiction",
      tags: ["science fiction", "empire", "mathematics"],
      neighbors: [],
      links: [],
      x: 10,
      y: 5,
      z: -5
    },
    {
      id: "3",
      title: "Neuromancer",
      author: "William Gibson", 
      name: "Neuromancer",
      description: "A cyberpunk classic about hackers, AI, and virtual reality",
      group: "Cyberpunk",
      tags: ["cyberpunk", "AI", "technology"],
      neighbors: [],
      links: [],
      x: -8,
      y: 12,
      z: 3
    }
  ],
  links: [
    {
      id: "link1",
      fromId: "1",
      toId: "2", 
      type: "thematic",
      strength: 0.8,
      sharedTags: ["science fiction"],
      connectionReason: "Both explore galactic civilizations",
      source: "1",
      target: "2"
    },
    {
      id: "link2",
      fromId: "2",
      toId: "3",
      type: "thematic", 
      strength: 0.6,
      sharedTags: ["technology"],
      connectionReason: "Both examine technology's impact on society",
      source: "2",
      target: "3"
    }
  ]
};

// Add neighbors and links references to nodes
gData.nodes.forEach(node => {
  node.neighbors = gData.nodes.filter(n => 
    gData.links.some(link => 
      (link.fromId === node.id && link.toId === n.id) || 
      (link.toId === node.id && link.fromId === n.id)
    )
  );
  
  node.links = gData.links.filter(link => 
    link.fromId === node.id || link.toId === node.id
  );
});
