import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const cacheDir = '/tmp/openf1-cache';

export const initCache = (purge: boolean) => {
  if (purge && fs.existsSync(cacheDir)) {
    console.log(`Purging cache at ${cacheDir}`);
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
};

export const cachedFetch = async (url: string): Promise<{ json: () => Promise<any> }> => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const filePath = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(filePath)) {
    // console.log(`Cache hit: ${url}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      json: () => Promise.resolve(JSON.parse(content))
    };
  }

  console.log(`Fetching (with 5s delay): ${url}`);
  await new Promise(resolve => setTimeout(resolve, 5000));
  const response = await fetch(url);
  if (!response.ok) {
     throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  return {
    json: () => Promise.resolve(data)
  };
};
