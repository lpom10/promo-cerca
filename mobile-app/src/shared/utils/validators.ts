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
  if (!cedula || cedula.length !== 10) return false;
  
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  
  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) return false; // Natural persons only

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula.charAt(9), 10);
  
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let calculado = decenaSuperior - suma;
  if (calculado === 10) calculado = 0;
  
  return calculado === digitoVerificador;
};

export const validarRuc = (ruc: string) => {
  if (!ruc || ruc.length !== 13) return false;
  
  const sufijo = ruc.substring(10, 13);
  if (sufijo !== '001') return false;

  const provincia = parseInt(ruc.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(ruc.charAt(2), 10);

  if (tercerDigito < 6) {
    // Persona Natural: Los primeros 10 dígitos son la cédula
    return validarCedula(ruc.substring(0, 10));
  } else if (tercerDigito === 9) {
    // Sociedad Privada / Extranjeros
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(9), 10);
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }
    const residuo = suma % 11;
    let calculado = residuo === 0 ? 0 : 11 - residuo;
    return calculado === digitoVerificador;
  } else if (tercerDigito === 6) {
    // Sociedad Pública
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    const digitoVerificador = parseInt(ruc.charAt(8), 10);
    let suma = 0;
    for (let i = 0; i < 8; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
    }
    const residuo = suma % 11;
    let calculado = residuo === 0 ? 0 : 11 - residuo;
    return calculado === digitoVerificador;
  }

  return false;
};

export const sanitizarNumero = (valor: string) => {
  return valor.replace(/\D/g, '');
};

export const sanitizar = (valor: string) => {
  return valor.trim();
};
