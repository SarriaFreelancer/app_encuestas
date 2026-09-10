const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Controlador de Timeout a 30 segundos para evitar cancelaciones prematuras en cargas de datos pesadas
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: El servidor backend no está respondiendo.`);
      }
      throw new Error('Respuesta inválida del servidor');
    }

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data?.detail || `Error del servidor (${response.status})`);
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo en responder (Timeout).');
    }
    throw err;
  }
}
