(function(window){
  const App = {
    async init(){
      if(window.Auth && typeof window.Auth.init === 'function'){
        await window.Auth.init();
      }
    }
  };
  window.App = App;
  if(typeof document !== 'undefined'){
    document.addEventListener('DOMContentLoaded', ()=>{
      App.init().catch(err=>console.error(err));
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
