import React, { useState } from 'react';
import { X, Bell, CheckCircle2, Send, MessageCircle, Mail } from 'lucide-react';

interface SubscribeModalProps {
  onClose: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ onClose }) => {
  const [method, setMethod] = useState<'email' | 'whatsapp'>('whatsapp');
  const [contactInfo, setContactInfo] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#0a1f19] text-emerald-100 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="font-serif-title text-2xl font-bold text-white">¡Suscripción Confirmada!</h3>
            <p className="text-sm text-emerald-200 font-light">
              ¡Gracias, {name || 'amigo/a'}! Te avisaremos al instante por {method === 'whatsapp' ? 'WhatsApp' : 'Email'} cada vez que Héctor y María publiquen un nuevo post en Indonesia.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#E07A5F] text-white font-semibold text-sm hover:brightness-110"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl font-bold text-white">Sigue la Aventura</h3>
                <p className="text-xs text-emerald-300/70">Aviso rápido cada vez que suban un nuevo día del viaje</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setMethod('whatsapp')}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    method === 'whatsapp' ? 'bg-[#2A9D8F] text-white shadow' : 'text-emerald-300/60'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    method === 'email' ? 'bg-[#E07A5F] text-white shadow' : 'text-emerald-300/60'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-200 mb-1">Tu nombre o parentesco</label>
                <input
                  type="text"
                  placeholder="Ej: Tía Carmen, Mamá, Guille..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-emerald-300/40 text-sm focus:outline-none focus:border-[#E07A5F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-200 mb-1">
                  {method === 'whatsapp' ? 'Número de WhatsApp' : 'Correo Electrónico'}
                </label>
                <input
                  type={method === 'whatsapp' ? 'tel' : 'email'}
                  placeholder={method === 'whatsapp' ? '+34 600 000 000' : 'ejemplo@correo.com'}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-emerald-300/40 text-sm focus:outline-none focus:border-[#E07A5F]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#E76F51] text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Activar Avisos del Viaje</span>
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
