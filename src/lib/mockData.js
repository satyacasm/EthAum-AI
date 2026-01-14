// --- LAUNCHES (Window Shopping) ---
export const MOCK_LAUNCHES = [
    { id: 'm-l1', name: "Nebula Cortex", stage: "Series A", tagline: "Autonomous supply chain intelligence.", upvotes_count: 142, rank: 1, badge: "Product of the Day #1" },
    { id: 'm-l2', name: "Vortex Quantum", stage: "Seed", tagline: "Post-quantum encryption layer.", upvotes_count: 98, rank: 2, badge: "Daily Top 2" },
    { id: 'm-l3', name: "BioFold", stage: "Pre-Seed", tagline: "Generative protein folding AI.", upvotes_count: 65, rank: 3, badge: "Daily Top 3" }
];

// --- DEALS (The Ticker) ---
export const MOCK_DEALS = [
    { id: 'm-d1', company: "Microsoft", startup: "Nebula Cortex", value: "$15k Pilot", status: "Signed", time: "10m ago", slots_left: 2 },
    { id: 'm-d2', company: "BMW Group", startup: "Vortex Quantum", value: "$25k Pilot", status: "In Talks", time: "2h ago", slots_left: 4 },
    { id: 'm-d3', company: "Pfizer", startup: "BioFold", value: "$50k Pilot", status: "Approved", time: "5h ago", slots_left: 1 },
    { id: 'm-d4', company: "Salesforce", startup: "Legacy Shield", value: "$12k Pilot", status: "Signed", time: "1d ago", slots_left: 0 },
    { id: 'm-d5', company: "Sequoia", startup: "Stealth AI", value: "Undisclosed", status: "Term Sheet", time: "2d ago", slots_left: 5 }
];

// --- QUADRANT (Visual Intelligence) ---
export const MOCK_QUADRANT = [
    { id: 1, name: "Nebula AI", stage: "Series A", upvotes_count: 50, eth_aum_score: 900, tagline: "Autonomous Supply Chain" },
    { id: 2, name: "Vortex Logic", stage: "Series B", upvotes_count: 80, eth_aum_score: 600, tagline: "Quantum Encryption" },
    { id: 3, name: "BioFold", stage: "Seed", upvotes_count: 20, eth_aum_score: 850, tagline: "Protein Folding AI" },
    { id: 4, name: "CyberWall", stage: "Series C", upvotes_count: 90, eth_aum_score: 400, tagline: "Enterprise Firewall" },
    { id: 5, name: "Stealth", stage: "Pre-Seed", upvotes_count: 5, eth_aum_score: 950, tagline: "Undisclosed Deep Tech" }
];

// --- HISTORY (Deep Dive Filters) ---
export const MOCK_HISTORY = [
    ...MOCK_LAUNCHES, 
    { id: 'm-h1', name: "AeroDyne", stage: "Series B", tagline: "Drone logistics network.", upvotes_count: 340, rank: 1, badge: "Daily Top 1", date: "Yesterday" },
    { id: 'm-h2', name: "HealthOS", stage: "Series A", tagline: "Hospital operating system.", upvotes_count: 210, rank: 2, badge: "Daily Top 2", date: "Yesterday" },
    { id: 'm-h3', name: "SecureNet", stage: "Seed", tagline: "Zero-trust VPN for remote teams.", upvotes_count: 180, rank: 3, badge: "Daily Top 3", date: "Yesterday" },
    { id: 'm-h4', name: "FinFlow", stage: "Series C", tagline: "Automated payroll for gig economy.", upvotes_count: 890, rank: 1, badge: "Weekly Top 1", date: "Last Week" },
];

// --- OPEN OPPORTUNITIES (Marketplace View) ---
export const MOCK_OPPORTUNITIES = [
    { id: 'op-1', name: "Nebula Cortex", tagline: "Autonomous supply chain intelligence.", pilot_price_deal: 15000, slots_total: 5, slots_taken: 3, stage: "Series A", eth_aum_score: 950 },
    { id: 'op-2', name: "Vortex Quantum", tagline: "Post-quantum encryption layer.", pilot_price_deal: 8000, slots_total: 10, slots_taken: 1, stage: "Seed", eth_aum_score: 890 },
    { id: 'op-3', name: "BioFold", tagline: "Generative protein folding AI.", pilot_price_deal: 5000, slots_total: 3, slots_taken: 3, stage: "Pre-Seed", eth_aum_score: 820 }, 
    { id: 'op-4', name: "Legacy Shield", tagline: "GDPR compliance automation.", pilot_price_deal: 25000, slots_total: 20, slots_taken: 15, stage: "Series B", eth_aum_score: 600 },
    { id: 'op-5', name: "Simple CRM", tagline: "Agency CRM system.", pilot_price_deal: 1000, slots_total: 100, slots_taken: 1, stage: "Bootstrapped", eth_aum_score: 350 },
];