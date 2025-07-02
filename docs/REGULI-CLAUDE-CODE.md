# REGULI DE MUNCĂ - CLAUDE CODE

**Data creării:** 02/07/2025  
**Status:** Reguli obligatorii pentru toate sesiunile  

## 🚨 **REGULI CRITICE - ZERO TOLERANȚĂ**

### **1. INTERFAȚA ESTE SFÂNTĂ**
- ✅ **NU ȘTERG NIMIC** din interfața existentă
- ✅ **DOAR UPGRADE/ÎMBUNĂTĂȚESC** - nu înlocuiesc
- ✅ **PĂSTREZ DESIGNUL** dark theme existent
- ✅ **ZERO BREAKING CHANGES** - totul trebuie să funcționeze după modificări

### **2. PRECIZIE CHIRURGICALĂ** 
- ✅ **ANALIZEZ DE 5 ORI** înainte să fac orice modificare
- ✅ **NU PRESUPUN NIMIC** - execut doar instrucțiunile explicite
- ✅ **ÎNTREB DACĂ NU ÎNȚELEG** - nu improvizez
- ✅ **TESTEZ COMPILATION** după fiecare modificare

### **3. PROVIDER/CARRIER CONCEPT**
- ✅ **TOATĂ LUMEA VEDE TOATE LINKURILE** - Home, Marketplace, DispatcherAI, Fleet, Settings
- ✅ **Provider** = postează cargo (oferă marfă de transportat)
- ✅ **Carrier** = preia cargo (oferă servicii de transport)
- ✅ **DIFERENȚIEREA** este în ce pot face pe pagini, NU în ce văd în navigație

### **4. NAVIGAȚIA COMPLETĂ**
- ✅ **Footer navigation:** Home + Marketplace + DispatcherAI + Fleet + Settings
- ✅ **Header icons:** Chat + Notifications + UserButton
- ✅ **UserButton poziție:** În header sus dreapta, NU în footer
- ✅ **TOATE linkurile vizibile** pentru toate persoanele

### **5. WORKFLOW CORECT**
- ✅ **Read files first** înainte să editez
- ✅ **TodoWrite** pentru tracking progres
- ✅ **Plan mode** când user cere planificare
- ✅ **Git commit** doar când user cere explicit

## 📝 **LECȚII ÎNVĂȚATE**

### **Greșeala din 02/07/2025:**
❌ **Ce am făcut greșit:**
- Am ascuns linkurile în funcție de rol în `RoleAwareNavBar`
- Am pus UserButton în footer în loc de header
- Am interpretat greșit conceptul provider/carrier ca roluri cu vizibilitate diferită

✅ **Soluția aplicată:**
- Creat `FullNavigationBar` cu toate cele 5 linkuri
- Mutat UserButton în header lângă Chat + Notifications  
- Înțeles că diferențierea este funcțională, nu vizuală

### **Principiul de bază:**
> **"NU ȘTERG, DOAR UPGRADE!"** - Interfața existentă este perfectă, o îmbunătățesc fără să distrug nimic.

## 🔄 **CHECKLIST OBLIGATORIU**

Înainte de orice modificare:
- [ ] Am citit și înțeles cerința exact?
- [ ] Am verificat ce există deja în cod?
- [ ] Știu exact ce va face modificarea mea?
- [ ] Am păstrat designul dark theme?
- [ ] Toate linkurile rămân vizibile pentru toți?
- [ ] TypeScript compilation trece?

---

**⚠️ ATENȚIE:** Aceste reguli sunt OBLIGATORII pentru toate sesiunile viitoare!