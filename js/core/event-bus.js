/* =====================================================
   EDUQUEST — event-bus.js
   Pub/Sub desacoplado: lógica ↔ vista
   ===================================================== */

const EQ_EventBus = (() => {
  const listeners = new Map();

  const on = (event, callback) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(callback);
    return () => off(event, callback);
  };

  const off = (event, callback) => {
    listeners.get(event)?.delete(callback);
  };

  const emit = (event, payload) => {
    listeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`[EventBus] ${event}:`, e); }
    });
  };

  const once = (event, callback) => {
    const wrapper = (payload) => {
      off(event, wrapper);
      callback(payload);
    };
    on(event, wrapper);
  };

  return { on, off, emit, once };
})();

window.EQ_EventBus = EQ_EventBus;
