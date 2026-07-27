export const validarEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validarPassword = (password: string) => {
  if (password.length < 8) {
    return { valida: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }
  return { valida: true, error: '' };
};

export const validarTelefono = (telefono: string) => {
  return /^\d{10}$/.test(telefono);
};

export const validarCedula = (cedula: string) => {
  if (cedula.length !== 10) return false;
  // Algoritmo módulo 10 para cédula ecuatoriana
  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let num = parseInt(cedula.charAt(i), 10);
    if (i % 2 === 0) {
      num *= 2;
      if (num > 9) num -= 9;
    }
    suma += num;
  }
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let verifCalc = decenaSuperior - suma;
  if (verifCalc === 10) verifCalc = 0;
  
  return verifCalc === digitoVerificador;
};

export const validarRuc = (ruc: string) => {
  // RUC ecuatoriano: 13 dígitos, suele terminar en 001 y sus primeros 10 dígitos validan según tipo
  if (ruc.length !== 13) return false;
  const sufijo = ruc.substring(10, 13);
  if (sufijo !== '001') return false; // Regla general común
  // Por simplicidad, solo validaremos longitud y sufijo, pero se podría extender
  return true; 
};

export const sanitizarNumero = (valor: string) => {
  return valor.replace(/\D/g, '');
};

export const sanitizar = (valor: string) => {
  return valor.trim();
};
