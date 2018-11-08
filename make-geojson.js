const fs = require('fs');
const Papa = require('papaparse');
const ss = require('simple-statistics');

const CSV_SOURCE = 'MA200-0073_S0037_181010112300.csv';

const csvContents = fs.readFileSync(CSV_SOURCE, 'utf-8');

const parsed = Papa.parse(csvContents, { header: true });

const LAT_FIELD = 'GPS lat (ddmm.mmmmm)';
const LNG_FIELD = 'GPS long (dddmm.mmmmm)';
const IR_FIELD = 'IR BCc'; // BX
const UV_FIELD = 'UV BCc'; // BL

const PROP_FIELDS = [
  'Serial number',
  'Date / time local',
  IR_FIELD,
  UV_FIELD,
];

const PROP_TRANSFORMS = {
  [UV_FIELD]: parseFloat, // BL
  [IR_FIELD]: parseFloat, // BX
};

const identity = x => x;

const IR_BCc_vals = [];

const features = parsed.data.map((row) => {
  if (!row[LNG_FIELD] || !row[LAT_FIELD]) {
    return null;
  }

  if (!row[IR_FIELD] || !row[IR_FIELD].length) {
    return null;
  }

  const properties = {};
  PROP_FIELDS.forEach((field) => {
    const transform = PROP_TRANSFORMS[field] || identity
    properties[field] = transform(row[field])
  });

  IR_BCc_vals.push(properties[IR_FIELD]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [parseFloat(row[LNG_FIELD]), parseFloat(row[LAT_FIELD])]
    },
    properties
  };
}).filter(i => i);

const featureCollection = {
  type: 'FeatureCollection',
  features
};

const breaks = ss.equalIntervalBreaks(IR_BCc_vals, 4);
console.log(`Breaks: ${breaks.join(', ')}`);

const OUT_FILE = 'data.json';
fs.writeFileSync(OUT_FILE, JSON.stringify(featureCollection));
console.log(`Done! Wrote ${OUT_FILE}`);

