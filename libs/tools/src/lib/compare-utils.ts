import { DateTime } from 'luxon';

const enableDebug = false; // environment.production;
const debug = (assert: boolean, message: string, ...additionalArgs: any[]) => {
  if (enableDebug && !assert) {
    console.log(message, ...additionalArgs);
  }
};

export const deepCompareFn = (filteredUINames: Set<string>) => function deepCompareInner(fromBackend: any, fromUI: any): boolean {

  if ((fromBackend === null && fromUI === undefined) || (fromBackend === undefined && fromUI === null)) {
    debug(fromBackend === fromUI, 'From UI and from backend are both falsy, but not the same');
    return false;
  }
  if (!!fromBackend !== !!fromUI) {
    debug(false, 'From backend and from ui when converted to booleans should have been the same', fromBackend, fromUI);
    return false;
  }
  // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
  if (fromBackend instanceof RegExp) {
    debug(fromUI instanceof RegExp, 'From UI regexp not equal to from backend Regexp');
    return fromBackend.toString() === (fromUI || '').toString();
  }
  if (fromBackend === fromUI || fromBackend?.valueOf() === fromUI?.valueOf()) {
    return true;
  }
  if (typeof fromBackend === 'string' && typeof fromUI === 'boolean') {
    return fromBackend === fromUI.toString();
  }
  if (Array.isArray(fromBackend) && fromBackend.length !== fromUI.length) {
    debug(
      Array.isArray(fromBackend) && fromBackend.length !== fromUI.length,
      'From UI and from backend are both arrays, but not with same length', 'UI', fromUI.length, 'Backend', fromBackend.length,
    );
    return false;
  }

  // if they are dates, they must had equal valueOf
  if (fromBackend instanceof DateTime) {
    debug(false, 'From UI and from backend should already have been equal. from backend', typeof fromBackend, 'UI', typeof fromUI);
    return false;
  }

  if (Number.isNaN(fromUI) && Number.isNaN(fromBackend)) {
    return true;
  }

  // if they are strictly equal, they both need to be object at least
  if (!(fromBackend instanceof Object)) {
    debug(false, 'From backend should have been an object', typeof fromBackend);
    return false;
  }
  if (!(fromUI instanceof Object)) {
    debug(false, 'From UI should have been an object', typeof fromUI);
    return false;
  }

  // recursive object equality check
  const uiKeys = Object.keys(fromUI).filter(name => fromUI[name] !== undefined && filteredUINames.has(name) === false);
  const p = Object.keys(fromBackend).filter(name => uiKeys.indexOf(name) !== -1);

  if (enableDebug) {
    if (p.length !== uiKeys.length) {
      debug(false, `Different number of keys. UI: ${uiKeys.length}. Backend: ${p.length}`, 'UI:', uiKeys, 'Cover:', p);
      const keyDiff = (p.length > uiKeys.length ? p : uiKeys).filter(key => (p.length > uiKeys.length ? uiKeys : p).indexOf(key) === -1);
      debug(false, `Key diff ${keyDiff.join(', ')}`);
    } else if (!uiKeys.every((i) => p.indexOf(i) !== -1)) {
      debug(false, `Even though they had some same number of keys. The keys were different.`, uiKeys, p);
    }
  }

  return uiKeys.every((i) => {
      return p.indexOf(i) !== -1;
    }) &&
    p.every((i) => {
      const result = deepCompareInner(fromBackend[i], fromUI[i]);
      debug(result, 'Not equal', i, 'Backend:', fromBackend[i], 'UI:', fromUI[i]);
      return result;
    });
};

export const deepCompare = deepCompareFn(new Set<string>());
