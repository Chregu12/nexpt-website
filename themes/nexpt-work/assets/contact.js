(async()=>{
 const form=document.querySelector('#contact-form');if(!form)return;
 const button=form.querySelector('button'),status=document.querySelector('#contact-availability'),feedback=document.querySelector('#contact-feedback'),message=form.querySelector('[name="message"]'),counter=document.querySelector('#contact-counter');
 let ready=false,busy=false,native=false;
 const count=()=>{counter.textContent=String(message.value.length);};message.addEventListener('input',count);
 try{const r=await fetch('/api/contact/status');if(!r.ok)throw Error();const d=await r.json();ready=d.ready===true;native=d.provider==='formsubmit';if(native){document.querySelector('#contact-captcha').hidden=true;if(ready&&/^https:\/\/formsubmit\.co\/[A-Za-z0-9_-]+$/.test(d.action||'')){form.action=d.action;}}status.textContent=ready?'':'Das Kontaktformular wird gerade eingerichtet. Bitte versuche es später erneut.';button.disabled=!ready;}catch{status.textContent='Das Kontaktformular ist gerade nicht erreichbar. Bitte versuche es später erneut.';}
 form.addEventListener('submit',async e=>{
  if(!ready||busy||!form.reportValidity()){e.preventDefault();return;}
  if(native){form.querySelector('[name="_subject"]').value='Nexpt Kontakt: '+form.querySelector('[name="subject"]').value;busy=true;button.disabled=true;button.textContent='Weiter zur Prüfung …';return;}
  e.preventDefault();
  const values=new FormData(form);
  if(!values.get('altcha')){feedback.textContent='Bitte bestätige den Spam-Schutz.';feedback.dataset.state='error';feedback.focus();return;}
  busy=true;button.disabled=true;button.textContent='Wird gesendet …';feedback.textContent='Deine Nachricht wird übermittelt …';feedback.dataset.state='pending';
  try{const r=await fetch('/api/contact/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:values.get('name'),email:values.get('email'),company:values.get('company'),subject:values.get('subject'),message:values.get('message'),website:values.get('website'),consent:values.get('consent')==='on',altcha:values.get('altcha')})});const d=await r.json();if(!r.ok)throw Error(d.error||'Der Versand konnte nicht bestätigt werden.');feedback.textContent=d.message;feedback.dataset.state='success';form.reset();count();}
  catch(err){feedback.textContent=err.message||'Der Versand konnte nicht bestätigt werden. Deine Eingaben bleiben erhalten.';feedback.dataset.state='error';}
  finally{form.querySelector('altcha-widget').reset?.();busy=false;button.disabled=!ready;button.textContent='Nachricht senden ↗';feedback.focus();}
 });
})();