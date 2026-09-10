"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User } from '@/types';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@/lib/alerts';
import { 
  Users, UserPlus, Edit3, Trash2, Shield, CheckCircle, XCircle, 
  Search, ShieldAlert, KeyRound, AlertTriangle
} from 'lucide-react';

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    usuario: '',
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'USUARIO' as 'SUPERADMIN' | 'ADMIN' | 'USUARIO',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/usuarios');
      setUsuarios(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      usuario: '',
      nombre: '',
      correo: '',
      contrasena: '',
      rol: 'USUARIO',
      estado: 'ACTIVO'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      usuario: u.usuario,
      nombre: u.nombre,
      correo: u.correo,
      contrasena: '', // Vacío para no cambiar
      rol: u.rol,
      estado: u.estado
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (editingUser) {
        // Actualizar
        const payload: any = {
          nombre: formData.nombre,
          correo: formData.correo,
          rol: formData.rol,
          estado: formData.estado
        };
        if (formData.contrasena.trim()) {
          payload.contrasena = formData.contrasena.trim();
        }
        await fetchApi(`/usuarios/${editingUser.usuario}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccessMsg(`Usuario ${editingUser.usuario} actualizado correctamente.`);
      } else {
        // Crear
        if (!formData.usuario.trim() || !formData.contrasena.trim()) {
          throw new Error('El usuario y la contraseña son obligatorios.');
        }
        await fetchApi('/usuarios', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setSuccessMsg(`Usuario ${formData.usuario} creado exitosamente.`);
      }
      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (username: string) => {
    const res = await showConfirmAlert(
      '¿Eliminar usuario?', 
      `¿Estás seguro de que deseas eliminar permanentemente al usuario ${username}?`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!res.isConfirmed) return;

    try {
      await fetchApi(`/usuarios/${username}`, { method: 'DELETE' });
      await showSuccessAlert('Usuario eliminado', `El usuario ${username} fue eliminado correctamente.`);
      loadUsers();
    } catch (err: any) {
      showErrorAlert('Error al eliminar', err.message || 'Error al eliminar usuario');
    }
  };

  const filteredUsers = usuarios.filter(u => {
    const term = busqueda.toLowerCase();
    return (
      u.usuario.toLowerCase().includes(term) ||
      u.nombre.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term)
    );
  });

  const isSuperAdmin = currentUser?.rol === 'SUPERADMIN';

  return (
    <ProtectedRoute requireAdmin>
    <div className={`min-h-screen flex ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <Sidebar />

      <main className="flex-1 md:ml-20 lg:ml-64 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full transition-all">
        {/* Header */}
        <div className={`border-b pb-5 flex flex-wrap items-center justify-between gap-4 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div>
            <div className="flex items-center gap-2">
              <Users className="text-indigo-500" size={24} />
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Gestión de Usuarios</h1>
            </div>
            <p className={`text-xs md:text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              Administra las credenciales, roles y estados de acceso para cada operador o administrador.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserPlus size={16} /> Crear Nuevo Usuario
          </button>
        </div>

        {/* Notificaciones */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs md:text-sm flex items-center gap-2 font-medium">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        {/* Barra de búsqueda y contadores */}
        <div className={`p-4 rounded-3xl border shadow-lg flex flex-wrap items-center justify-between gap-3 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por usuario, nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-slate-800/80 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Total usuarios: <strong className="text-indigo-400">{filteredUsers.length}</strong>
          </div>
        </div>

        {/* Tabla de Usuarios Responsiva */}
        <div className={`rounded-3xl border overflow-hidden shadow-xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className={`uppercase text-[11px] font-bold tracking-wider ${
                theme === 'light' ? 'bg-slate-100 text-slate-600 border-b border-slate-200' : 'bg-slate-800/90 text-slate-400 border-b border-slate-800'
              }`}>
                <tr>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200 text-slate-700' : 'divide-slate-800/70 text-slate-300'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Cargando usuarios autorizados...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.usuario} className={theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/40'}>
                      <td className="p-4 font-bold text-indigo-400">{u.usuario}</td>
                      <td className="p-4 font-medium">{u.nombre}</td>
                      <td className="p-4 text-slate-400">{u.correo}</td>
                      <td className="p-4">
                        {u.rol === 'SUPERADMIN' ? (
                          <span className="px-2.5 py-1 text-xs font-black rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            u.rol === 'ADMIN'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {u.rol}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit ${
                          u.estado === 'ACTIVO'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {u.estado === 'ACTIVO' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          {u.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                            }`}
                            title="Editar usuario"
                          >
                            <Edit3 size={15} />
                          </button>
                          
                          {/* No permitir eliminar su propio usuario */}
                          {currentUser?.usuario !== u.usuario && (
                            <button
                              onClick={() => handleDelete(u.usuario)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CREAR / EDITAR USUARIO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            <div className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-50 ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="text-lg font-bold">
                  {editingUser ? `Editar Usuario: ${editingUser.usuario}` : 'Crear Nuevo Usuario'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">✕</button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingUser && (
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Nombre de Usuario *</label>
                    <input
                      type="text"
                      required
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      placeholder="ej: operador1"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="ej: Juan Pérez"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="ej: juan@encuestas.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    {editingUser ? 'Nueva Contraseña (Opcional, dejar vacío si no cambia)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    placeholder={editingUser ? "•••••••• (Sin cambios)" : "Ingresa contraseña"}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Rol de Acceso</label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                        theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                      }`}
                    >
                      <option value="USUARIO">USUARIO</option>
                      <option value="ADMIN">ADMIN</option>
                      {isSuperAdmin && <option value="SUPERADMIN">SUPERADMIN</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                        theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-white'
                      }`}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`flex-1 py-2.5 font-bold rounded-2xl text-xs cursor-pointer ${
                      theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                  >
                    {submitting ? 'Guardando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer className="mt-8 pt-6" />
      </main>
    </div>
    </ProtectedRoute>
  );
}
