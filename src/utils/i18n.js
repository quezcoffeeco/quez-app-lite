export function t(key, lang, arg) {
  var strings = {
    appName: {en:'Quez Coffee Co.', es:'Quez Coffee Co.'},
    tagline: {en:'Operations Platform', es:'Plataforma de Operaciones'},
    selectEmployee: {en:'Select Your Name', es:'Selecciona Tu Nombre'},
    selectLocation: {en:'Select Location', es:'Selecciona Ubicacion'},
    enterPin: {en:'Enter PIN', es:'Ingresa PIN'},
    incorrectPin: {en:'Incorrect PIN', es:'PIN incorrecto'},
    accountLocked: {en:'Account locked. Contact owner.', es:'Cuenta bloqueada.'},
    clockingIn: {en:'Clocking in...', es:'Registrando entrada...'},
    welcomeBack: {en:function(n){return 'Welcome back, '+n;}, es:function(n){return 'Bienvenido, '+n;}},
    signIn: {en:'Sign In', es:'Iniciar Sesion'},
    noEmployeesConfigured: {en:'No employees configured. See owner.', es:'Sin empleados configurados.'},
    role_owner: {en:'Owner', es:'Dueno'},
    role_manager: {en:'Manager', es:'Gerente'},
    role_leadBarista: {en:'Lead Barista', es:'Barista Lider'},
    role_barista: {en:'Barista', es:'Barista'},
    role_trainee: {en:'Trainee', es:'Aprendiz'},
  };
  var l = lang || 'en';
  var entry = strings[key];
  if (!entry) return key;
  var str = entry[l] || entry['en'] || key;
  if (typeof str === 'function') return str(arg);
  return str;
}

export function roleLabel(role, lang) {
  return t('role_' + role, lang) || role;
}