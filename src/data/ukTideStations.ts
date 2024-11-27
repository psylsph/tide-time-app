export interface TideStation {
  id: string;
  name: string;
  region: string;
}

export const ukTideStations: TideStation[] = [
  // Thames Estuary
  { id: '0113', name: 'London Bridge', region: 'River Thames' },
  { id: '0112', name: 'Tilbury', region: 'River Thames' },
  { id: '0114', name: 'Silvertown', region: 'River Thames' },
  { id: '0111', name: 'Sheerness', region: 'River Thames' },
  
  // Kent & Sussex
  { id: '0068', name: 'Dover', region: 'Kent' },
  { id: '0069', name: 'Deal', region: 'Kent' },
  { id: '0065', name: 'Folkestone', region: 'Kent' },
  { id: '0066', name: 'Ramsgate', region: 'Kent' },
  { id: '0067', name: 'Margate', region: 'Kent' },
  { id: '0054', name: 'Brighton Marina', region: 'Sussex' },
  { id: '0055', name: 'Newhaven', region: 'Sussex' },
  { id: '0056', name: 'Eastbourne', region: 'Sussex' },
  { id: '0057', name: 'Hastings', region: 'Sussex' },
  { id: '0053', name: 'Selsey Bill', region: 'Sussex' },
  { id: '0052', name: 'Littlehampton', region: 'Sussex' },
  { id: '0051', name: 'Shoreham', region: 'Sussex' },
  
  // Hampshire & Isle of Wight
  { id: '0032', name: 'Portsmouth', region: 'Hampshire' },
  { id: '0034', name: 'Southampton', region: 'Hampshire' },
  { id: '0035', name: 'Calshot', region: 'Hampshire' },
  { id: '0036', name: 'Cowes', region: 'Isle of Wight' },
  { id: '0037', name: 'Ryde', region: 'Isle of Wight' },
  { id: '0038', name: 'Ventnor', region: 'Isle of Wight' },
  
  // Devon & Cornwall
  { id: '0012', name: 'Plymouth', region: 'Devon' },
  { id: '0014', name: 'Devonport', region: 'Devon' },
  { id: '0015', name: 'Torquay', region: 'Devon' },
  { id: '0016', name: 'Exmouth', region: 'Devon' },
  { id: '0017', name: 'Teignmouth', region: 'Devon' },
  { id: '0018', name: 'Falmouth', region: 'Cornwall' },
  { id: '0019', name: 'Newquay', region: 'Cornwall' },
  { id: '0020', name: 'Padstow', region: 'Cornwall' },
  { id: '0021', name: 'Penzance', region: 'Cornwall' },
  
  // North West
  { id: '0001', name: 'Liverpool', region: 'Merseyside' },
  { id: '0003', name: 'Birkenhead', region: 'Merseyside' },
  { id: '0004', name: 'Formby', region: 'Merseyside' },
  { id: '0005', name: 'Blackpool', region: 'Lancashire' },
  { id: '0006', name: 'Morecambe', region: 'Lancashire' },
  { id: '0007', name: 'Heysham', region: 'Lancashire' },
  
  // Scotland
  { id: '0152', name: 'Aberdeen', region: 'Scotland' },
  { id: '0157', name: 'Leith', region: 'Scotland' },
  { id: '0158', name: 'Dundee', region: 'Scotland' },
  { id: '0159', name: 'Glasgow', region: 'Scotland' },
  { id: '0160', name: 'Greenock', region: 'Scotland' },
  { id: '0161', name: 'Oban', region: 'Scotland' },
  { id: '0162', name: 'Ullapool', region: 'Scotland' },
  
  // Wales
  { id: '0175', name: 'Cardiff', region: 'Wales' },
  { id: '0176', name: 'Newport', region: 'Wales' },
  { id: '0177', name: 'Barry', region: 'Wales' },
  { id: '0178', name: 'Port Talbot', region: 'Wales' },
  { id: '0181', name: 'Swansea', region: 'Wales' },
  { id: '0182', name: 'Milford Haven', region: 'Wales' },
  { id: '0183', name: 'Fishguard', region: 'Wales' },
  { id: '0184', name: 'Holyhead', region: 'Wales' },
  
  // Northern Ireland
  { id: '0209', name: 'Belfast', region: 'Northern Ireland' },
  { id: '0210', name: 'Bangor', region: 'Northern Ireland' },
  { id: '0211', name: 'Londonderry', region: 'Northern Ireland' },
  { id: '0212', name: 'Portrush', region: 'Northern Ireland' },
  
  // East Coast
  { id: '0081', name: 'Harwich', region: 'Essex' },
  { id: '0082', name: 'Felixstowe', region: 'Suffolk' },
  { id: '0083', name: 'Lowestoft', region: 'Suffolk' },
  { id: '0084', name: 'Great Yarmouth', region: 'Norfolk' },
  { id: '0085', name: 'Cromer', region: 'Norfolk' },
  { id: '0086', name: 'Kings Lynn', region: 'Norfolk' },
  { id: '0087', name: 'Grimsby', region: 'Lincolnshire' },
  { id: '0088', name: 'Hull', region: 'Yorkshire' },
  { id: '0089', name: 'Whitby', region: 'Yorkshire' },
  { id: '0090', name: 'Scarborough', region: 'Yorkshire' },
];
