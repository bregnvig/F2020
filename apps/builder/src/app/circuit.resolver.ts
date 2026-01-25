import { Circuit } from '@f2020/data';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const normalize = (str: string) => str.toLocaleLowerCase().trim();
const mapPath = '/tmp/circuit-names.json';

const countryNameMap: Record<string, string> = {
  'australia': 'AUS',
  'austria': 'AUT',
  'azerbaijan': 'AZE',
  'bahrain': 'BHR',
  'belgium': 'BEL',
  'brazil': 'BRA',
  'canada': 'CAN',
  'china': 'CHN',
  'france': 'FRA',
  'germany': 'DEU',
  'great britain': 'GBR',
  'hungary': 'HUN',
  'italy': 'ITA',
  'japan': 'JPN',
  'mexico': 'MEX',
  'monaco': 'MCO',
  'netherlands': 'NLD',
  'portugal': 'PRT',
  'qatar': 'QAT',
  'russia': 'RUS',
  'saudi arabia': 'SAU',
  'singapore': 'SGP',
  'spain': 'ESP',
  'turkey': 'TUR',
  'uae': 'ARE',
  'united arab emirates': 'ARE',
  'united kingdom': 'GBR',
  'united states': 'USA',
  'usa': 'USA',
};

export const resolveCircuit = async (summary: string, location: string, circuits: Circuit[]): Promise<Circuit> => {
  const raceNameMatch = /FORMULA 1(.*) -/.exec(summary);
  const raceName = raceNameMatch ? normalize(raceNameMatch[1]) : normalize(summary);
  const locationNormalized = normalize(location);

  let circuitMap: Record<string, string> = {};
  if (fs.existsSync(mapPath)) {
    try {
      circuitMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse circuit map', e);
    }
  }

  // 1. Try to find via stored mapping
  if (circuitMap[raceName]) {
    const mappedName = normalize(circuitMap[raceName]);
    const found = circuits.find(c => normalize(c.name) === mappedName || normalize(c.circuitName) === mappedName);
    if (found) {
      return found;
    }
  }

  // 2. Try automatic resolution
  // Pass 1: Strong match - race name or location contains circuit name or race name
  let found = circuits.find(c => {
    const name = normalize(c.name);
    const circuitName = normalize(c.circuitName);
    return raceName.includes(name) || locationNormalized.includes(name) ||
           raceName.includes(circuitName) || locationNormalized.includes(circuitName);
  });

  // Pass 2: Weaker match - circuit name or race name contains location (e.g. Location "Monaco" in "Monaco Grand Prix")
  if (!found && locationNormalized.length > 2) {
    found = circuits.find(c => {
      const name = normalize(c.name);
      const circuitName = normalize(c.circuitName);
      return name.includes(locationNormalized) || circuitName.includes(locationNormalized);
    });
  }

  // Pass 3: Match by country name (if unique)
  if (!found) {
    const countryCode = countryNameMap[locationNormalized];
    if (countryCode) {
      const matches = circuits.filter(c => c.countryCode3 === countryCode);
      if (matches.length === 1) {
        found = matches[0];
      }
    }
  }

  if (found) {
    return found;
  }

  // 3. Fallback to manual selection
  console.log(`
⚠️  Could not resolve circuit automatically:`);
  console.log(`  Summary: "${summary}"`);
  console.log(`  Location: "${location}"`);
  console.log(`  Extracted Name: "${raceName}"`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    while (true) {
      console.log(`
Available Circuits:`);
      const candidates = circuits.sort((a, b) => a.name.localeCompare(b.name));

      const answer = await question('Type to search, "all" to list all, or "exit" to abort: ');
      if (answer.toLowerCase() === 'exit') {
        throw new Error('Circuit resolution aborted by user');
      }

      let matches: Circuit[] = [];
      if (answer.toLowerCase() === 'all') {
        matches = candidates;
      } else {
        const term = normalize(answer);
        matches = candidates.filter(c =>
          normalize(c.name).includes(term) ||
          normalize(c.circuitName).includes(term) ||
          c.countryCode2.toLowerCase() === term ||
          c.countryCode3.toLowerCase() === term,
        );
      }

      if (matches.length === 0) {
        console.log('No circuits found.');
        continue;
      }

      console.log(`
Select a circuit:`);
      matches.forEach((c, index) => {
        console.log(`${index + 1}. ${c.name} (${c.circuitName}) - ${c.countryCode3}`);
      });

      const selection = await question('Enter number (or Enter to search again): ');
      if (!selection) continue;

      const index = parseInt(selection) - 1;
      if (!isNaN(index) && matches[index]) {
        const selected = matches[index];
        console.log(`Selected: ${selected.name}\n`);

        // Save choice
        circuitMap[raceName] = selected.name;
        if (!fs.existsSync(path.dirname(mapPath))) {
          fs.mkdirSync(path.dirname(mapPath), { recursive: true });
        }
        fs.writeFileSync(mapPath, JSON.stringify(circuitMap, null, 2));

        return selected;
      }
    }
  } finally {
    rl.close();
  }
};
