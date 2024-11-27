export interface TideStation {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

export const ukTideStations: TideStation[] = [
  // Thames Estuary
  { id: '0113', name: 'London Bridge', region: 'River Thames', latitude: 51.5081, longitude: -0.0875 },
  { id: '0112', name: 'Tilbury', region: 'River Thames', latitude: 51.4500, longitude: 0.3500 },
  { id: '0114', name: 'Silvertown', region: 'River Thames', latitude: 51.5027, longitude: 0.0123 },
  { id: '0111', name: 'Sheerness', region: 'River Thames', latitude: 51.4463, longitude: 0.7488 },
  
  // Kent & Sussex
  { id: '0068', name: 'Dover', region: 'Kent', latitude: 51.1279, longitude: 1.3134 },
  { id: '0069', name: 'Deal', region: 'Kent', latitude: 51.2233, longitude: 1.4042 },
  { id: '0065', name: 'Folkestone', region: 'Kent', latitude: 51.0813, longitude: 1.1795 },
  { id: '0066', name: 'Ramsgate', region: 'Kent', latitude: 51.3333, longitude: 1.4167 },
  { id: '0067', name: 'Margate', region: 'Kent', latitude: 51.3917, longitude: 1.3867 },
  { id: '0054', name: 'Brighton Marina', region: 'Sussex', latitude: 50.8147, longitude: -0.1030 },
  { id: '0055', name: 'Newhaven', region: 'Sussex', latitude: 50.7925, longitude: 0.0550 },
  { id: '0056', name: 'Eastbourne', region: 'Sussex', latitude: 50.7687, longitude: 0.2918 },
  { id: '0057', name: 'Hastings', region: 'Sussex', latitude: 50.8552, longitude: 0.5832 },
  { id: '0053', name: 'Selsey Bill', region: 'Sussex', latitude: 50.7242, longitude: -0.7900 },
  { id: '0052', name: 'Littlehampton', region: 'Sussex', latitude: 50.8053, longitude: -0.5453 },
  { id: '0051', name: 'Shoreham', region: 'Sussex', latitude: 50.8322, longitude: -0.2745 },
  
  // Hampshire & Isle of Wight
  { id: '0032', name: 'Portsmouth', region: 'Hampshire', latitude: 50.7989, longitude: -1.1091 },
  { id: '0034', name: 'Southampton', region: 'Hampshire', latitude: 50.8997, longitude: -1.4044 },
  { id: '0035', name: 'Calshot', region: 'Hampshire', latitude: 50.8167, longitude: -1.3083 },
  { id: '0036', name: 'Cowes', region: 'Isle of Wight', latitude: 50.7592, longitude: -1.2917 },
  { id: '0037', name: 'Ryde', region: 'Isle of Wight', latitude: 50.7333, longitude: -1.1583 },
  { id: '0038', name: 'Ventnor', region: 'Isle of Wight', latitude: 50.5947, longitude: -1.2083 },
  
  // Devon & Cornwall
  { id: '0012', name: 'Plymouth', region: 'Devon', latitude: 50.3719, longitude: -4.1422 },
  { id: '0014', name: 'Devonport', region: 'Devon', latitude: 50.3686, longitude: -4.1853 },
  { id: '0015', name: 'Torquay', region: 'Devon', latitude: 50.4619, longitude: -3.5253 },
  { id: '0016', name: 'Exmouth', region: 'Devon', latitude: 50.6181, longitude: -3.4133 },
  { id: '0017', name: 'Teignmouth', region: 'Devon', latitude: 50.5469, longitude: -3.4947 },
  { id: '0018', name: 'Falmouth', region: 'Cornwall', latitude: 50.1536, longitude: -5.0683 },
  { id: '0019', name: 'Newquay', region: 'Cornwall', latitude: 50.4155, longitude: -5.0828 },
  { id: '0020', name: 'Padstow', region: 'Cornwall', latitude: 50.5411, longitude: -4.9353 },
  { id: '0021', name: 'Penzance', region: 'Cornwall', latitude: 50.1181, longitude: -5.5272 },
  
  // North West
  { id: '0001', name: 'Liverpool', region: 'Merseyside', latitude: 53.4084, longitude: -3.0072 },
  { id: '0003', name: 'Birkenhead', region: 'Merseyside', latitude: 53.3947, longitude: -3.0139 },
  { id: '0004', name: 'Formby', region: 'Merseyside', latitude: 53.5528, longitude: -3.0928 },
  { id: '0005', name: 'Blackpool', region: 'Lancashire', latitude: 53.8175, longitude: -3.0536 },
  
  // Scotland
  { id: '0152', name: 'Aberdeen', region: 'Scotland', latitude: 57.1433, longitude: -2.0933 },
  { id: '0157', name: 'Leith', region: 'Scotland', latitude: 55.9778, longitude: -3.1703 },
  { id: '0158', name: 'Dundee', region: 'Scotland', latitude: 56.4633, longitude: -2.9667 },
  { id: '0159', name: 'Glasgow', region: 'Scotland', latitude: 55.8603, longitude: -4.2517 },
  { id: '0160', name: 'Greenock', region: 'Scotland', latitude: 55.9553, longitude: -4.7553 },
  { id: '0161', name: 'Oban', region: 'Scotland', latitude: 56.4133, longitude: -5.4733 },
  { id: '0162', name: 'Ullapool', region: 'Scotland', latitude: 57.8967, longitude: -5.1633 },
  
  // Wales
  { id: '0175', name: 'Cardiff', region: 'Wales', latitude: 51.4545, longitude: -3.1683 },
  { id: '0176', name: 'Newport', region: 'Wales', latitude: 51.5500, longitude: -2.9833 },
  { id: '0177', name: 'Barry', region: 'Wales', latitude: 51.3967, longitude: -3.2683 },
  { id: '0178', name: 'Port Talbot', region: 'Wales', latitude: 51.5900, longitude: -3.8183 },
  { id: '0181', name: 'Swansea', region: 'Wales', latitude: 51.6214, longitude: -3.9436 },
  { id: '0182', name: 'Milford Haven', region: 'Wales', latitude: 51.7125, longitude: -5.0403 },
  { id: '0183', name: 'Fishguard', region: 'Wales', latitude: 52.0067, longitude: -4.9833 },
  { id: '0184', name: 'Holyhead', region: 'Wales', latitude: 53.3083, longitude: -4.6333 },
  
  // Northern Ireland
  { id: '0209', name: 'Belfast', region: 'Northern Ireland', latitude: 54.5972, longitude: -5.9303 },
  { id: '0210', name: 'Bangor', region: 'Northern Ireland', latitude: 54.6667, longitude: -5.6667 },
  { id: '0211', name: 'Londonderry', region: 'Northern Ireland', latitude: 54.9967, longitude: -7.3103 },
  { id: '0212', name: 'Portrush', region: 'Northern Ireland', latitude: 55.2000, longitude: -6.7167 },
  
  // East Coast
  { id: '0081', name: 'Harwich', region: 'Essex', latitude: 51.9456, longitude: 1.2867 },
  { id: '0082', name: 'Felixstowe', region: 'Suffolk', latitude: 51.9567, longitude: 1.3511 },
  { id: '0083', name: 'Lowestoft', region: 'Suffolk', latitude: 52.4750, longitude: 1.7500 },
  { id: '0084', name: 'Great Yarmouth', region: 'Norfolk', latitude: 52.5833, longitude: 1.7333 },
  { id: '0085', name: 'Cromer', region: 'Norfolk', latitude: 52.9333, longitude: 1.3000 },
  { id: '0086', name: 'Kings Lynn', region: 'Norfolk', latitude: 52.7517, longitude: 0.3933 },
  { id: '0087', name: 'Grimsby', region: 'Lincolnshire', latitude: 53.5667, longitude: -0.0667 },
  { id: '0088', name: 'Hull', region: 'Yorkshire', latitude: 53.7433, longitude: -0.3333 },
  { id: '0089', name: 'Whitby', region: 'Yorkshire', latitude: 54.4833, longitude: -0.6167 },
  { id: '0090', name: 'Scarborough', region: 'Yorkshire', latitude: 54.2833, longitude: -0.4000 },
];
