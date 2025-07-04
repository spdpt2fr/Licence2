(function(window){
  const API = {
    async init(){ return true; }
  };
  window.API = API;
})(typeof window !== 'undefined' ? window : globalThis);
