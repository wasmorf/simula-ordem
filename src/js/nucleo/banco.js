"use strict";
/* Banco de dados: Firebase de verdade ou banco de teste no navegador (#teste). */
/* ===================== BANCO: Firebase ou modo de teste ===================== */
const DEL = { __del: true };
function firebaseDB() {
  const fs = firebase.firestore();
  try {
    fs.settings({ ignoreUndefinedProperties: true, merge: true });
  } catch (e) {}
  const toList = s => s.docs.map(x => ({ id: x.id, ...x.data() }));
  return {
    mode: "firebase",
    listenCol(path, o, cb, err) {
      let q = fs.collection(path);
      if (o && o.where) q = q.where(o.where[0], "==", o.where[1]);
      if (o && o.orderBy) q = q.orderBy(o.orderBy, o.dir || "asc");
      if (o && o.limit) q = q.limit(o.limit);
      return q.onSnapshot(
        s => cb(toList(s), { fromCache: s.metadata.fromCache }),
        e => err && err(e)
      );
    },
    listenDoc(path, cb, err) {
      return fs.doc(path).onSnapshot(
        s => cb(s.exists ? s.data() : null),
        e => err && err(e)
      );
    },
    async get(path) {
      const s = await fs.doc(path).get();
      return s.exists ? s.data() : null;
    },
    async getCol(path) {
      const s = await fs.collection(path).get();
      return s.docs.map(x => ({ id: x.id, ...x.data() }));
    },
    set(path, data) {
      return fs.doc(path).set(data);
    },
    merge(path, data) {
      return fs.doc(path).set(data, { merge: true });
    },
    setKey(path, key, sub, val, extra) {
      // grava/remove data[key][sub] sem tocar no resto
      if (val === DEL)
        return fs
          .doc(path)
          .update({ [key + "." + sub]: firebase.firestore.FieldValue.delete(), ...(extra || {}) })
          .catch(e => {
            if (e.code !== "not-found") throw e;
          });
      return fs.doc(path).set({ [key]: { [sub]: val }, ...(extra || {}) }, { merge: true });
    },
    async add(col, data) {
      const r = await fs.collection(col).add(data);
      return r.id;
    },
    del(path) {
      return fs.doc(path).delete();
    }
  };
}
function localDB() {
  // tudo em memória, só neste navegador; abas abertas ao mesmo tempo se sincronizam (para testar antes de configurar o Firebase)
  const docs = new Map();
  const ls = new Set();
  const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const parent = p => p.slice(0, p.lastIndexOf("/"));
  let bc = null;
  try {
    bc = new BroadcastChannel("simula-ordem-teste");
  } catch (e) {}
  function notify(changed) {
    setTimeout(() => ls.forEach(l => l.fire()), 0);
    if (bc && changed)
      changed.forEach(path => {
        try {
          bc.postMessage({ t: "put", path, data: docs.has(path) ? docs.get(path) : null });
        } catch (e) {}
      });
  }
  if (bc) {
    bc.onmessage = ev => {
      const m = ev.data;
      if (m.t === "put") {
        if (m.data == null) docs.delete(m.path);
        else docs.set(m.path, m.data);
        setTimeout(() => ls.forEach(l => l.fire()), 0);
      } else if (m.t === "hello") bc.postMessage({ t: "dump", entries: [...docs.entries()] });
      else if (m.t === "dump" && !docs.size) {
        m.entries.forEach(([k, v]) => docs.set(k, v));
        setTimeout(() => ls.forEach(l => l.fire()), 0);
      }
    };
    bc.postMessage({ t: "hello" });
  }
  function deepMerge(a, b) {
    for (const k in b) {
      const v = b[k];
      if (v === DEL) {
        delete a[k];
        continue;
      }
      if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        a[k] &&
        typeof a[k] === "object" &&
        !Array.isArray(a[k])
      )
        deepMerge(a[k], v);
      else a[k] = clone(v);
    }
    return a;
  }
  return {
    mode: "local",
    listenCol(path, o, cb) {
      const l = {
        fire() {
          let list = [];
          docs.forEach((v, k) => {
            if (parent(k) === path && (!o || !o.where || v[o.where[0]] === o.where[1]))
              list.push({ id: k.slice(path.length + 1), ...clone(v) });
          });
          if (o && o.orderBy) {
            const f = o.orderBy,
              s = o.dir === "desc" ? -1 : 1;
            list.sort((a, b) => ((a[f] ?? 0) > (b[f] ?? 0) ? 1 : (a[f] ?? 0) < (b[f] ?? 0) ? -1 : 0) * s);
          } else list.sort((a, b) => (a.id < b.id ? -1 : 1));
          if (o && o.limit) list = list.slice(0, o.limit);
          cb(list, { fromCache: false });
        }
      };
      ls.add(l);
      setTimeout(() => l.fire(), 0);
      return () => ls.delete(l);
    },
    listenDoc(path, cb) {
      const l = {
        fire() {
          cb(clone(docs.get(path) ?? null));
        }
      };
      ls.add(l);
      setTimeout(() => l.fire(), 0);
      return () => ls.delete(l);
    },
    async get(path) {
      return clone(docs.get(path) ?? null);
    },
    async getCol(path) {
      const out = [];
      docs.forEach((v, k) => {
        if (parent(k) === path) out.push({ id: k.slice(path.length + 1), ...clone(v) });
      });
      return out;
    },
    async set(path, data) {
      docs.set(path, clone(data));
      notify([path]);
    },
    async merge(path, data) {
      docs.set(path, deepMerge(docs.get(path) || {}, data));
      notify([path]);
    },
    async setKey(path, key, sub, val, extra) {
      const o = docs.get(path) || {};
      Object.assign(o, extra || {});
      o[key] = o[key] || {};
      if (val === DEL) delete o[key][sub];
      else o[key][sub] = clone(val);
      docs.set(path, o);
      notify([path]);
    },
    async add(col, data) {
      const id = rid(16);
      docs.set(col + "/" + id, clone(data));
      notify([col + "/" + id]);
      return id;
    },
    async del(path) {
      docs.delete(path);
      notify([path]);
    }
  };
}
