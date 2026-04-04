/**
 * firebase-mock.js — Récolt'IQ Demo Mode
 *
 * Drop-in replacement for firebase-config.js.
 * Uses an in-memory store (resets on every page load / refresh).
 * Same export surface as the real firebase-config.js.
 */

// ─── Demo seed data ──────────────────────────────────────────────────────────

const DEMO_UID  = "demo-user-001";
const DEMO_FARM = "farm-001";

function seedDatabase() {
  const now = Date.now();
  const ts  = (offset = 0) => ({ _isTimestamp: true, seconds: Math.floor((now + offset) / 1000), nanoseconds: 0 });

  return {
    [`users/${DEMO_UID}`]: {
      name: "Jean-Pierre Duval",
      farmName: "La Ferme du Val",
      email: "demo@recolt-iq.fr",
      hideFinishedOwnFields: false,
      lastSelectedFarmId: DEMO_FARM,
      createdAt: ts(-86400 * 30 * 1000),
      // Localisation pré-définie → évite la popup "choisir un lieu"
      weatherLocation: {
        name: "Bordeaux",
        coordinates: { latitude: 44.8378, longitude: -0.5792 },
      },
    },

    [`users/${DEMO_UID}/farms/${DEMO_FARM}`]: {
      name: "La Ferme du Val",
      ownerId: DEMO_UID,
    },

    // ── Parcelles ────────────────────────────────────────────────────────────
    [`users/${DEMO_UID}/fields/field-001`]: {
      name: "La Pièce du Moulin",
      crop: "Féverole",
      size: 24.06,
      year: 2024,
      farmId: DEMO_FARM,
      ownerId: DEMO_UID,
      trailers: [
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt", full: 18400, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 8 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Fendt", full: 17800, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 7 * 1000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Claas", full: 19200, empty: 5400, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 6 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas", full: 18900, empty: 5400, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 5 * 1000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt", full: 18600, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 4 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 21000, empty: 6200, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-3600 * 3 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 20800, empty: 6200, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-3600 * 2 * 1000) },
        // Total net: (18400-5200)+(17800-5200)+(19200-5400)+(18900-5400)+(18600-5200)+(21000-6200)+(20800-6200) ≈ 404 335 kg/ha
      ],
      strawTrailers: [],
      expenses: [
        { label: "Semences féverole", amount: 1820, date: ts(-86400 * 180 * 1000) },
        { label: "Engrais NPK", amount: 2450, date: ts(-86400 * 90 * 1000) },
        { label: "Produits phyto", amount: 680, date: ts(-86400 * 60 * 1000) },
      ],
      createdAt: ts(-86400 * 200 * 1000),
    },

    [`users/${DEMO_UID}/fields/field-002`]: {
      name: "La Pièce du Château",
      crop: "Tournesol",
      size: 19.53,
      year: 2024,
      farmId: DEMO_FARM,
      ownerId: DEMO_UID,
      trailers: [
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt", full: 14600, empty: 4800, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000 - 3600 * 8 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Fendt", full: 15200, empty: 4800, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000 - 3600 * 6 * 1000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Claas", full: 16000, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000 - 3600 * 4 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas", full: 15800, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000 - 3600 * 2 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 20500, empty: 6300, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-86400 * 1 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 19900, empty: 6300, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-3600 * 20 * 1000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt", full: 14800, empty: 4800, isEstimate: true, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-3600 * 10 * 1000) },
        // ≈ 387 055 kg net
      ],
      strawTrailers: [],
      expenses: [
        { label: "Semences tournesol", amount: 2100, date: ts(-86400 * 175 * 1000) },
        { label: "Engrais phosphaté", amount: 1980, date: ts(-86400 * 85 * 1000) },
      ],
      createdAt: ts(-86400 * 195 * 1000),
    },

    [`users/${DEMO_UID}/fields/field-003`]: {
      name: "Le Haut des Vents",
      crop: "Blé tendre",
      size: 18.2,
      year: 2024,
      farmId: DEMO_FARM,
      ownerId: DEMO_UID,
      trailers: [
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt",      full: 18200, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 5 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas",      full: 17600, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 5 * 1000 + 3600000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Claas",      full: 18400, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 4 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 21200, empty: 6400, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-86400 * 4 * 1000 + 7200000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Fendt",      full: 17900, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 3 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 20600, empty: 6400, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-86400 * 3 * 1000 + 3600000) },
        // ≈ 422 833 kg net
      ],
      strawTrailers: [
        { trailerName: "Remorque Paille 1", truckName: "Tracteur Fendt", full: 8200, empty: 3100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000) },
        { trailerName: "Remorque Paille 1", truckName: "Tracteur Fendt", full: 8400, empty: 3100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 2 * 1000 + 3600000) },
      ],
      expenses: [
        { label: "Semences blé tendre", amount: 1650, date: ts(-86400 * 210 * 1000) },
        { label: "Engrais azoté", amount: 3200, date: ts(-86400 * 80 * 1000) },
        { label: "Fongicide", amount: 890, date: ts(-86400 * 55 * 1000) },
        { label: "Herbicide", amount: 420, date: ts(-86400 * 130 * 1000) },
      ],
      createdAt: ts(-86400 * 220 * 1000),
    },

    [`users/${DEMO_UID}/fields/field-004`]: {
      name: "Les Longues Raies",
      crop: "Orge d'hiver",
      size: 15.8,
      year: 2024,
      farmId: DEMO_FARM,
      ownerId: DEMO_UID,
      trailers: [
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt",      full: 17800, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 10 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas",      full: 17200, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 10 * 1000 + 3600000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Claas",      full: 16900, empty: 5100, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 9 * 1000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 19800, empty: 6200, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-86400 * 9 * 1000 + 7200000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Fendt",      full: 17500, empty: 5200, isEstimate: false, addToStock: true, addedBy: DEMO_UID, timestamp: ts(-86400 * 8 * 1000) },
        // ≈ 262 400 kg net
      ],
      strawTrailers: [],
      expenses: [
        { label: "Semences orge", amount: 1420, date: ts(-86400 * 215 * 1000) },
        { label: "Engrais azoté", amount: 2600, date: ts(-86400 * 82 * 1000) },
      ],
      createdAt: ts(-86400 * 225 * 1000),
    },

    [`users/${DEMO_UID}/fields/field-005`]: {
      name: "La Plaine du Roy",
      crop: "Colza",
      size: 22.4,
      year: 2024,
      farmId: DEMO_FARM,
      ownerId: DEMO_UID,
      trailers: [
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt",      full: 12400, empty: 4600, isEstimate: false, addToStock: true,  addedBy: DEMO_UID, timestamp: ts(-86400 * 15 * 1000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas",      full: 11800, empty: 4600, isEstimate: false, addToStock: true,  addedBy: DEMO_UID, timestamp: ts(-86400 * 15 * 1000 + 3600000) },
        { trailerName: "Remorque 3", truckName: "Tracteur John Deere", full: 17200, empty: 5800, isEstimate: false, addToStock: false, addedBy: DEMO_UID, timestamp: ts(-86400 * 14 * 1000) },
        { trailerName: "Remorque 1", truckName: "Tracteur Fendt",      full: 12900, empty: 4600, isEstimate: false, addToStock: true,  addedBy: DEMO_UID, timestamp: ts(-86400 * 14 * 1000 + 3600000) },
        { trailerName: "Remorque 2", truckName: "Tracteur Claas",      full: 12200, empty: 4600, isEstimate: false, addToStock: true,  addedBy: DEMO_UID, timestamp: ts(-86400 * 13 * 1000) },
        // ≈ 257 400 kg net
      ],
      strawTrailers: [],
      expenses: [
        { label: "Semences colza hybride", amount: 3100, date: ts(-86400 * 270 * 1000) },
        { label: "Engrais azoté", amount: 4200, date: ts(-86400 * 88 * 1000) },
        { label: "Régulateur", amount: 560, date: ts(-86400 * 65 * 1000) },
        { label: "Insecticide", amount: 720, date: ts(-86400 * 200 * 1000) },
      ],
      createdAt: ts(-86400 * 280 * 1000),
    },

    // ── Noms de remorques et camions ─────────────────────────────────────────
    [`users/${DEMO_UID}/trailerNames/default`]: {
      names: ["Remorque 1", "Remorque 2", "Remorque 3", "Remorque Paille 1"],
    },
    [`users/${DEMO_UID}/truckNames/default`]: {
      names: ["Tracteur Fendt", "Tracteur Claas", "Tracteur John Deere"],
    },
    [`users/${DEMO_UID}/customCrops/default`]: {
      crops: ["Féverole", "Tournesol", "Blé tendre", "Orge d'hiver", "Colza", "Maïs grain", "Pois protéagineux"],
    },
  };
}

// ─── In-memory store ─────────────────────────────────────────────────────────

let _store = seedDatabase();
const _listeners = {}; // path → [callback]

function _get(path) {
  return _store[path] !== undefined ? JSON.parse(JSON.stringify(_store[path])) : null;
}
function _set(path, data) {
  _store[path] = JSON.parse(JSON.stringify(data));
  _notifyListeners(path);
}
function _delete(path) {
  delete _store[path];
  _notifyListeners(path);
}
function _notifyListeners(path) {
  (_listeners[path] || []).forEach(cb => cb(_get(path)));
  // Also notify collection listeners
  const parts = path.split('/');
  if (parts.length >= 2) {
    const colPath = parts.slice(0, -1).join('/');
    (_listeners[colPath] || []).forEach(cb => cb(_getCollection(colPath)));
  }
}
function _addListener(path, cb) {
  if (!_listeners[path]) _listeners[path] = [];
  _listeners[path].push(cb);
  return () => { _listeners[path] = _listeners[path].filter(f => f !== cb); };
}
function _getCollection(colPath) {
  const prefix = colPath + '/';
  return Object.keys(_store)
    .filter(k => k.startsWith(prefix) && k.slice(prefix.length).indexOf('/') === -1)
    .map(k => ({ id: k.slice(prefix.length), data: JSON.parse(JSON.stringify(_store[k])), _path: k }));
}

// ─── Timestamp / serverTimestamp ─────────────────────────────────────────────

class Timestamp {
  constructor(seconds, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
    this._isTimestamp = true;
  }
  toDate()   { return new Date(this.seconds * 1000); }
  toMillis() { return this.seconds * 1000; }
  static now() { return new Timestamp(Math.floor(Date.now() / 1000)); }
  static fromDate(d) { return new Timestamp(Math.floor(d.getTime() / 1000)); }
  static fromMillis(ms) { return new Timestamp(Math.floor(ms / 1000)); }
}

function serverTimestamp() {
  return Timestamp.now();
}

// ─── Field sentinels ─────────────────────────────────────────────────────────

function arrayUnion(...items) { return { _type: 'arrayUnion', items }; }
function arrayRemove(...items) { return { _type: 'arrayRemove', items }; }
function deleteField()         { return { _type: 'deleteField' }; }

function _applyUpdate(existing, updates) {
  const result = existing ? JSON.parse(JSON.stringify(existing)) : {};
  for (const [k, v] of Object.entries(updates)) {
    if (v && v._type === 'arrayUnion') {
      result[k] = [...(result[k] || []), ...v.items.filter(i => !(result[k] || []).some(x => JSON.stringify(x) === JSON.stringify(i)))];
    } else if (v && v._type === 'arrayRemove') {
      result[k] = (result[k] || []).filter(i => !v.items.some(x => JSON.stringify(x) === JSON.stringify(i)));
    } else if (v && v._type === 'deleteField') {
      delete result[k];
    } else if (v && v._isTimestamp) {
      result[k] = v;
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ─── Document / Collection references ────────────────────────────────────────

function doc(dbOrRef, ...pathSegments) {
  let base = '';
  if (typeof dbOrRef === 'string') {
    base = dbOrRef;
  } else if (dbOrRef && dbOrRef._path) {
    base = dbOrRef._path;
  }
  const fullPath = [base, ...pathSegments].filter(Boolean).join('/');
  return { _isDoc: true, _path: fullPath, id: fullPath.split('/').pop() };
}

function collection(dbOrRef, ...pathSegments) {
  let base = '';
  if (typeof dbOrRef === 'string') {
    base = dbOrRef;
  } else if (dbOrRef && dbOrRef._path) {
    base = dbOrRef._path;
  }
  const fullPath = [base, ...pathSegments].filter(Boolean).join('/');
  return { _isCollection: true, _path: fullPath };
}

function collectionGroup(_db, collectionId) {
  // Returns a pseudo-query that matches all sub-collections with given id
  return { _isCollectionGroup: true, _colId: collectionId, _constraints: [] };
}

// ─── CRUD operations ─────────────────────────────────────────────────────────

async function getDoc(ref) {
  const data = _get(ref._path);
  return {
    exists: () => data !== null,
    data:   () => data,
    id:     ref._path.split('/').pop(),
    ref,
  };
}

async function setDoc(ref, data, options = {}) {
  if (options.merge) {
    const existing = _get(ref._path) || {};
    _set(ref._path, _applyUpdate(existing, data));
  } else {
    _set(ref._path, data);
  }
}

async function updateDoc(ref, updates) {
  const existing = _get(ref._path) || {};
  _set(ref._path, _applyUpdate(existing, updates));
}

async function deleteDoc(ref) {
  _delete(ref._path);
}

async function addDoc(colRef, data) {
  const id   = 'auto-' + Math.random().toString(36).slice(2, 10);
  const path = colRef._path + '/' + id;
  _set(path, data);
  return { id, _path: path };
}

// ─── getDocs ─────────────────────────────────────────────────────────────────

async function getDocs(queryOrRef) {
  let docs;
  if (queryOrRef._isCollection) {
    docs = _getCollection(queryOrRef._path);
  } else if (queryOrRef._isQuery) {
    docs = _runQuery(queryOrRef);
  } else if (queryOrRef._isCollectionGroup) {
    docs = _runCollectionGroup(queryOrRef);
  } else {
    docs = [];
  }
  return {
    docs: docs.map(d => ({
      id:     d.id,
      data:   () => d.data,
      exists: () => true,
      ref:    { _path: d._path },
    })),
    forEach: function(cb) { this.docs.forEach(cb); },
    empty:   docs.length === 0,
    size:    docs.length,
  };
}

// ─── onSnapshot ──────────────────────────────────────────────────────────────

function onSnapshot(refOrQuery, callbackOrOptions, maybeCallback) {
  const callback = typeof callbackOrOptions === 'function' ? callbackOrOptions : maybeCallback;

  if (refOrQuery._isDoc) {
    // immediate call
    const snap = { exists: () => _get(refOrQuery._path) !== null, data: () => _get(refOrQuery._path), id: refOrQuery.id, ref: refOrQuery };
    callback(snap);
    return _addListener(refOrQuery._path, data => callback({ exists: () => data !== null, data: () => data, id: refOrQuery.id, ref: refOrQuery }));
  }

  if (refOrQuery._isCollection || refOrQuery._isQuery) {
    const colPath = refOrQuery._path;
    const makeSnap = () => {
      let docs = refOrQuery._isQuery ? _runQuery(refOrQuery) : _getCollection(colPath);
      return {
        docs: docs.map(d => ({ id: d.id, data: () => d.data, exists: () => true, ref: { _path: d._path } })),
        forEach: function(cb) { this.docs.forEach(cb); },
        empty: docs.length === 0,
        size:  docs.length,
      };
    };
    callback(makeSnap());
    return _addListener(colPath, () => callback(makeSnap()));
  }

  // Fallback no-op
  callback({ docs: [], forEach: () => {}, empty: true, size: 0 });
  return () => {};
}

// ─── Query ───────────────────────────────────────────────────────────────────

function query(colRef, ...constraints) {
  return { _isQuery: true, _path: colRef._path, _colId: colRef._colId, _isCollectionGroup: colRef._isCollectionGroup, _constraints: constraints };
}
function where(field, op, value) { return { _type: 'where', field, op, value }; }
function orderBy(field, dir = 'asc') { return { _type: 'orderBy', field, dir }; }
function limit(n) { return { _type: 'limit', n }; }
function startAt(...values) { return { _type: 'startAt', values }; }
function endAt(...values) { return { _type: 'endAt', values }; }

function _runQuery(q) {
  let docs = q._isCollectionGroup ? _runCollectionGroup(q) : _getCollection(q._path);

  for (const c of (q._constraints || [])) {
    if (c._type === 'where') {
      docs = docs.filter(d => {
        const v = d.data[c.field];
        if (c.op === '==')         return v === c.value;
        if (c.op === '!=')         return v !== c.value;
        if (c.op === '<')          return v  <  c.value;
        if (c.op === '<=')         return v  <= c.value;
        if (c.op === '>')          return v  >  c.value;
        if (c.op === '>=')         return v  >= c.value;
        if (c.op === 'array-contains') return Array.isArray(v) && v.includes(c.value);
        if (c.op === 'in')         return Array.isArray(c.value) && c.value.includes(v);
        return true;
      });
    }
    if (c._type === 'orderBy') {
      docs.sort((a, b) => {
        const av = a.data[c.field], bv = b.data[c.field];
        if (av === bv) return 0;
        const cmp = av < bv ? -1 : 1;
        return c.dir === 'desc' ? -cmp : cmp;
      });
    }
    if (c._type === 'limit') {
      docs = docs.slice(0, c.n);
    }
  }
  return docs;
}

function _runCollectionGroup(q) {
  const id = q._colId;
  return Object.keys(_store)
    .filter(k => { const parts = k.split('/'); return parts[parts.length - 2] === id; })
    .map(k => ({ id: k.split('/').pop(), data: JSON.parse(JSON.stringify(_store[k])), _path: k }));
}

// ─── writeBatch ───────────────────────────────────────────────────────────────

function writeBatch(_db) {
  const ops = [];
  return {
    set:    (ref, data, opts)  => { ops.push({ type: 'set',    ref, data, opts });    return this; },
    update: (ref, data)        => { ops.push({ type: 'update', ref, data });           return this; },
    delete: (ref)              => { ops.push({ type: 'delete', ref });                 return this; },
    commit: async () => { for (const op of ops) { if (op.type === 'set') await setDoc(op.ref, op.data, op.opts); else if (op.type === 'update') await updateDoc(op.ref, op.data); else if (op.type === 'delete') await deleteDoc(op.ref); } },
  };
}

// ─── Auth mock ────────────────────────────────────────────────────────────────

const DEMO_USER = {
  uid:           DEMO_UID,
  email:         "demo@recolt-iq.fr",
  displayName:   "Jean-Pierre Duval",
  emailVerified: true,
  photoURL:      null,
  reload:        () => Promise.resolve(),
  getIdToken:    () => Promise.resolve("demo-token"),
};

const _authListeners = [];
let   _currentUser   = DEMO_USER;

const auth = {
  currentUser: DEMO_USER,
  _type: 'auth',
};

function onAuthStateChanged(_auth, callback) {
  _authListeners.push(callback);
  // Fire immediately (async so the caller can register cleanups first)
  setTimeout(() => callback(DEMO_USER), 0);
  return () => { const i = _authListeners.indexOf(callback); if (i !== -1) _authListeners.splice(i, 1); };
}

async function signInWithEmailAndPassword(_auth, email, password) {
  // Always succeed in demo mode
  _currentUser = DEMO_USER;
  auth.currentUser = DEMO_USER;
  _authListeners.forEach(cb => cb(DEMO_USER));
  return { user: DEMO_USER };
}

async function createUserWithEmailAndPassword(_auth, email, password) {
  return { user: DEMO_USER };
}

async function signOut(_auth) {
  // In demo mode, re-login immediately so the app stays usable
  setTimeout(() => {
    _currentUser = DEMO_USER;
    auth.currentUser = DEMO_USER;
    _authListeners.forEach(cb => cb(DEMO_USER));
  }, 100);
}

async function sendPasswordResetEmail() {}
async function sendEmailVerification() {}
async function updatePassword() {}
async function deleteUser() {}

const GoogleAuthProvider = class { constructor() {} };
async function signInWithPopup() { return { user: DEMO_USER }; }

// ─── Storage mock ─────────────────────────────────────────────────────────────

const storage = { _type: 'storage' };

function ref(_storage, path = '') {
  return { _path: path, _isStorageRef: true };
}

function uploadBytesResumable(ref, data) {
  let _snapshot = { state: 'running', bytesTransferred: 0, totalBytes: data?.size || data?.byteLength || 100 };
  const _callbacks = { next: [], error: [], complete: [] };

  // Simulate upload progress
  setTimeout(() => {
    _snapshot = { ..._snapshot, state: 'success', bytesTransferred: _snapshot.totalBytes };
    _callbacks.next.forEach(cb => cb(_snapshot));
    _callbacks.complete.forEach(cb => cb());
  }, 400);

  return {
    snapshot: _snapshot,
    on: (event, nextCb, errorCb, completeCb) => {
      if (nextCb)     _callbacks.next.push(nextCb);
      if (errorCb)    _callbacks.error.push(errorCb);
      if (completeCb) _callbacks.complete.push(completeCb);
    },
    then: (resolve) => { setTimeout(() => resolve(_snapshot), 400); return Promise.resolve(_snapshot); },
  };
}

async function getDownloadURL(_ref) {
  // Return a placeholder avatar or empty image
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMWE2YjJlIiByeD0iMjAiLz48dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkpQPC90ZXh0Pjwvc3ZnPg==';
}

async function deleteObject(_ref) {}

// ─── Stub: analytics ─────────────────────────────────────────────────────────

const app = { _type: 'app', name: '[DEFAULT]' };

// ─── db reference ────────────────────────────────────────────────────────────

const db = { _type: 'db', _path: '', app };

// Patch doc/collection to work with db root
const _origDoc = doc;
const _origCol = collection;

// ─── Export (same surface as firebase-config.js) ──────────────────────────────

export const serverUrl = 'https://api-gte2tsbfiq-uc.a.run.app'; // kept for compat, unused in demo

export {
  app, auth, db, storage,
  // Auth
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  sendPasswordResetEmail, sendEmailVerification, updatePassword, deleteUser,
  GoogleAuthProvider, signInWithPopup,
  // Firestore
  doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot,
  collection, addDoc, query, where, deleteDoc,
  arrayUnion, arrayRemove, collectionGroup, writeBatch, deleteField,
  Timestamp, orderBy, serverTimestamp, startAt, endAt, limit,
  // Storage
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
};
