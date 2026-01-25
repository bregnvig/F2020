import { IDriver } from '@f2020/data';
import { GridPosition } from '@f2020/openf1';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const normalize = (str: string) => str.toLocaleLowerCase().trim();
const mapPath = '/tmp/driver-names.json';

export const resolveDriver = async (drivers: IDriver[], gridPosition: GridPosition): Promise<IDriver> => {
  const driverNumber = gridPosition.driver_number;

  // Load map
  let driverMap: Record<number, string> = {};
  if (fs.existsSync(mapPath)) {
    try {
      driverMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse driver map', e);
    }
  }

  // Filter drivers by the number from the grid position
  const candidates = drivers.filter(d => d.permanentNumber.includes(driverNumber));

  // 1. Try to find via stored mapping
  if (driverMap[driverNumber]) {
    const mappedId = driverMap[driverNumber];
    const found = candidates.find(d => d.driverId === mappedId);
    if (found) {
      return found;
    }
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  // Prioritize active drivers
  if (candidates.length > 1) {
    const activeCandidates = candidates.filter(d => d.active);
    if (activeCandidates.length === 1) {
      return activeCandidates[0];
    }
  }

  console.log(`
⚠️  Could not resolve driver automatically for number #${driverNumber}:`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  const saveAndReturn = (selected: IDriver) => {
    console.log(`Selected: ${selected.name}\n`);
    driverMap[driverNumber] = selected.driverId;
    if (!fs.existsSync(path.dirname(mapPath))) {
      fs.mkdirSync(path.dirname(mapPath), { recursive: true });
    }
    fs.writeFileSync(mapPath, JSON.stringify(driverMap, null, 2));
    return selected;
  };

  try {
    if (candidates.length > 0) {
      console.log(`  Found ${candidates.length} candidates with number ${driverNumber}:`);
      candidates.forEach((d, index) => {
        const numbers = d.permanentNumber.join(', ');
        const status = d.active ? 'Active' : 'Inactive';
        console.log(`${index + 1}. ${d.name} (${d.code}) [${numbers}] - ${status}`);
      });

      const answer = await question('Select number (or Enter to search all): ');
      const index = parseInt(answer) - 1;
      if (!isNaN(index) && candidates[index]) {
        return saveAndReturn(candidates[index]);
      }
    } else {
      console.log(`  No driver found with number ${driverNumber}`);
    }

    while (true) {
      console.log(`
Available Drivers:`);
      // Sort drivers by name for easier searching
      const allDrivers = drivers.sort((a, b) => a.name.localeCompare(b.name));

      const answer = await question('Type to search, "all" to list all, or "exit" to abort: ');
      if (answer.toLowerCase() === 'exit') {
        throw new Error('Driver resolution aborted by user');
      }

      let matches: IDriver[] = [];
      if (answer.toLowerCase() === 'all') {
        matches = allDrivers;
      } else {
        const term = normalize(answer);
        matches = allDrivers.filter(d =>
          normalize(d.name).includes(term) ||
          d.code?.toLowerCase().includes(term) ||
          d.permanentNumber.some(n => n.toString().includes(term))
        );
      }

      if (matches.length === 0) {
        console.log('No drivers found.');
        continue;
      }

      console.log(`
Select a driver for #${driverNumber}:`);
      matches.forEach((d, index) => {
        const numbers = d.permanentNumber.join(', ');
        const hasHeadshot = !!d.headshotUrl ? '📸' : '';
        console.log(`${index + 1}. ${d.name} (${d.code}) [${numbers}] ${hasHeadshot}`);
      });

      const selection = await question('Enter number (or Enter to search again): ');
      if (!selection) continue;

      const index = parseInt(selection) - 1;
      if (!isNaN(index) && matches[index]) {
        return saveAndReturn(matches[index]);
      }
    }
  } finally {
    rl.close();
  }
};
