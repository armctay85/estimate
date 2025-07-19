import { Request, Response } from 'express';

// Australian Building Regulations Database Service
// Integrates with NCC (National Construction Code), state building codes, and Australian Standards

interface BuildingRegulation {
  id: string;
  code: string;
  title: string;
  category: string;
  jurisdiction: string;
  effectiveDate: string;
  description: string;
  requirements: string[];
  relatedStandards: string[];
  penalties?: string;
  source: string;
}

interface ComplianceCheck {
  regulation: BuildingRegulation;
  status: 'compliant' | 'non-compliant' | 'review-required';
  notes: string;
  recommendations?: string[];
}

// Comprehensive Australian building regulations database
const BUILDING_REGULATIONS: BuildingRegulation[] = [
  // National Construction Code (NCC) 2022
  {
    id: 'ncc-2022-a1',
    code: 'NCC 2022 Section A',
    title: 'Governing Requirements',
    category: 'General',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Classification of buildings and structures',
    requirements: [
      'Building classification must be determined (Class 1-10)',
      'Mixed-use buildings require multiple classifications',
      'Documentation must show compliance pathways'
    ],
    relatedStandards: ['AS 1170', 'AS 3959'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-b1',
    code: 'NCC 2022 Section B',
    title: 'Structure',
    category: 'Structural',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Structural provisions for buildings',
    requirements: [
      'Resistance to actions (AS 1170 series)',
      'Structural reliability (AS 5104)',
      'Glass installations (AS 1288)',
      'Site soil classification required'
    ],
    relatedStandards: ['AS 1170.0-5', 'AS 3600', 'AS 4100', 'AS 1720.1'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-c1',
    code: 'NCC 2022 Section C',
    title: 'Fire Resistance',
    category: 'Fire Safety',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Fire resistance and stability requirements',
    requirements: [
      'Fire Resistance Levels (FRL) for structural elements',
      'Fire-source features separation',
      'Protection of openings',
      'Fire hazard properties of materials'
    ],
    relatedStandards: ['AS 1530.1-4', 'AS 4072.1'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-d1',
    code: 'NCC 2022 Section D',
    title: 'Access and Egress',
    category: 'Access',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Provision for escape and access for people with disability',
    requirements: [
      'Continuous accessible paths of travel',
      'AS 1428.1 compliance for accessibility',
      'Minimum door widths 850mm for accessible areas',
      'Tactile indicators at stairs and ramps'
    ],
    relatedStandards: ['AS 1428.1-5', 'AS 1735'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-e1',
    code: 'NCC 2022 Section E',
    title: 'Services and Equipment',
    category: 'Services',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Fire fighting equipment and smoke hazard management',
    requirements: [
      'Fire hydrants (AS 2419.1)',
      'Fire hose reels (AS 2441)',
      'Portable fire extinguishers (AS 2444)',
      'Automatic fire suppression systems where required'
    ],
    relatedStandards: ['AS 2419.1', 'AS 2441', 'AS 2444', 'AS 2118.1'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-f1',
    code: 'NCC 2022 Section F',
    title: 'Health and Amenity',
    category: 'Health',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Damp and weatherproofing, sanitary facilities, room sizes',
    requirements: [
      'Waterproofing of wet areas (AS 3740)',
      'Minimum ceiling heights (2.4m habitable rooms)',
      'Natural light and ventilation requirements',
      'Accessible sanitary facilities'
    ],
    relatedStandards: ['AS 3740', 'AS 1668.2', 'AS/NZS 3666.1'],
    source: 'National Construction Code 2022'
  },
  {
    id: 'ncc-2022-j1',
    code: 'NCC 2022 Section J',
    title: 'Energy Efficiency',
    category: 'Sustainability',
    jurisdiction: 'National',
    effectiveDate: '2022-05-01',
    description: 'Energy efficiency provisions (6-star minimum for residential)',
    requirements: [
      'Building fabric thermal performance',
      'Building sealing requirements',
      'Air-conditioning and ventilation systems',
      'Artificial lighting and power limits'
    ],
    relatedStandards: ['AS/NZS 1680.1', 'AS/NZS 3823.2'],
    source: 'National Construction Code 2022'
  },

  // State-Specific Regulations - NSW
  {
    id: 'nsw-ep-a-2021',
    code: 'NSW EP&A Regulation 2021',
    title: 'Environmental Planning and Assessment',
    category: 'Planning',
    jurisdiction: 'NSW',
    effectiveDate: '2021-03-01',
    description: 'Development application requirements and building standards',
    requirements: [
      'BASIX certificate for residential development',
      'Fire safety upgrade requirements',
      'Complying development standards',
      'Design verification statements for Class 2 buildings'
    ],
    relatedStandards: ['BASIX SEPP'],
    penalties: 'Up to $110,000 for non-compliance',
    source: 'NSW Environmental Planning and Assessment Regulation 2021'
  },

  // State-Specific Regulations - VIC
  {
    id: 'vic-br-2018',
    code: 'VIC Building Regulations 2018',
    title: 'Victorian Building Regulations',
    category: 'General',
    jurisdiction: 'VIC',
    effectiveDate: '2018-06-01',
    description: 'State variations to NCC and additional requirements',
    requirements: [
      'Bushfire protection (BAL assessment required)',
      'Termite management systems',
      'Swimming pool and spa barriers',
      'Mandatory inspections at stages'
    ],
    relatedStandards: ['AS 3959-2018', 'AS 3660.1'],
    penalties: 'Up to 500 penalty units',
    source: 'Victorian Building Regulations 2018'
  },

  // State-Specific Regulations - QLD
  {
    id: 'qld-ba-2021',
    code: 'QLD Building Act 1975',
    title: 'Queensland Building Standards',
    category: 'General',
    jurisdiction: 'QLD',
    effectiveDate: '2021-01-01',
    description: 'Building standards and local government matters',
    requirements: [
      'Siting requirements (boundary clearances)',
      'On-site sewerage facilities',
      'Pool safety certificates',
      'Notifiable work stages'
    ],
    relatedStandards: ['QDC MP 1.1-1.3', 'AS 1926.1-3'],
    source: 'Queensland Building Act 1975'
  },

  // Australian Standards - Key Construction Standards
  {
    id: 'as-1170-2002',
    code: 'AS 1170 Series',
    title: 'Structural Design Actions',
    category: 'Structural',
    jurisdiction: 'National',
    effectiveDate: '2002-01-01',
    description: 'Loading codes for structural design',
    requirements: [
      'AS 1170.0 - General principles',
      'AS 1170.1 - Permanent, imposed actions',
      'AS 1170.2 - Wind actions',
      'AS 1170.4 - Earthquake actions'
    ],
    relatedStandards: ['AS 3600', 'AS 4100'],
    source: 'Standards Australia'
  },
  {
    id: 'as-3600-2018',
    code: 'AS 3600:2018',
    title: 'Concrete Structures',
    category: 'Structural',
    jurisdiction: 'National',
    effectiveDate: '2018-12-01',
    description: 'Design and construction of concrete structures',
    requirements: [
      'Minimum concrete strength 20MPa',
      'Durability requirements by exposure',
      'Cover to reinforcement',
      'Crack control requirements'
    ],
    relatedStandards: ['AS 1379', 'AS 3610'],
    source: 'Standards Australia'
  },
  {
    id: 'as-4100-2020',
    code: 'AS 4100:2020',
    title: 'Steel Structures',
    category: 'Structural',
    jurisdiction: 'National',
    effectiveDate: '2020-06-01',
    description: 'Design of steel structures',
    requirements: [
      'Material specifications',
      'Fabrication tolerances',
      'Welding standards (AS 1554)',
      'Corrosion protection requirements'
    ],
    relatedStandards: ['AS 1554 Series', 'AS 4312'],
    source: 'Standards Australia'
  }
];

// Compliance checking service
export function checkCompliance(projectType: string, location: string, buildingClass: string): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  
  // Filter regulations based on project parameters
  const applicableRegulations = BUILDING_REGULATIONS.filter(reg => {
    // National regulations apply to all
    if (reg.jurisdiction === 'National') return true;
    
    // State regulations apply based on location
    const state = location.split(',')[1]?.trim();
    if (state && reg.jurisdiction === state) return true;
    
    return false;
  });

  // Perform compliance checks
  applicableRegulations.forEach(reg => {
    const check: ComplianceCheck = {
      regulation: reg,
      status: 'review-required',
      notes: `Review required for ${reg.title}`,
      recommendations: []
    };

    // Specific compliance logic based on building class
    if (buildingClass.includes('Class 1') && reg.category === 'Sustainability') {
      check.recommendations?.push('Ensure 6-star energy rating compliance');
      check.recommendations?.push('Provide NatHERS assessment certificate');
    }

    if (buildingClass.includes('Class 2') && reg.code.includes('NSW')) {
      check.recommendations?.push('Design verification statement required');
      check.recommendations?.push('Fire safety schedule required');
    }

    if (projectType === 'commercial' && reg.category === 'Access') {
      check.recommendations?.push('Provide accessibility consultant report');
      check.recommendations?.push('Ensure DDA compliance throughout');
    }

    checks.push(check);
  });

  return checks;
}

// API endpoints
export function setupRegulationsRoutes(app: any) {
  // Get all regulations
  app.get('/api/regulations', (req: Request, res: Response) => {
    const { category, jurisdiction } = req.query;
    
    let filtered = BUILDING_REGULATIONS;
    
    if (category) {
      filtered = filtered.filter(reg => reg.category === category);
    }
    
    if (jurisdiction) {
      filtered = filtered.filter(reg => reg.jurisdiction === jurisdiction);
    }
    
    res.json(filtered);
  });

  // Get specific regulation
  app.get('/api/regulations/:id', (req: Request, res: Response) => {
    const regulation = BUILDING_REGULATIONS.find(reg => reg.id === req.params.id);
    
    if (!regulation) {
      return res.status(404).json({ error: 'Regulation not found' });
    }
    
    res.json(regulation);
  });

  // Check project compliance
  app.post('/api/regulations/check-compliance', (req: Request, res: Response) => {
    const { projectType, location, buildingClass } = req.body;
    
    if (!projectType || !location || !buildingClass) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const checks = checkCompliance(projectType, location, buildingClass);
    res.json(checks);
  });

  // Search regulations
  app.get('/api/regulations/search', (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const searchTerm = q.toString().toLowerCase();
    const results = BUILDING_REGULATIONS.filter(reg => 
      reg.title.toLowerCase().includes(searchTerm) ||
      reg.description.toLowerCase().includes(searchTerm) ||
      reg.code.toLowerCase().includes(searchTerm) ||
      reg.requirements.some(req => req.toLowerCase().includes(searchTerm))
    );
    
    res.json(results);
  });
}